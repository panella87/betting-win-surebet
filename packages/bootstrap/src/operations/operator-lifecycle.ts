import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  redactBwsServiceRuntimeConfig,
  resolveBwsServiceRuntimeConfig,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
  type RedactedBwsServiceRuntimeConfig,
} from './service-runtime.js';

const BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA = 'bws.operator_lifecycle_state.v1';
const BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA = 'bws.operator_lifecycle_evidence.v1';
const DEFAULT_RUNTIME_STATE_DIRECTORY = 'runtime/bws-operator-lifecycle';
const DEFAULT_START_TIMEOUT_MS = 10_000;
const DEFAULT_STOP_TIMEOUT_MS = 10_000;
const DEFAULT_STATUS_REQUEST_TIMEOUT_MS = 3_000;
const DEFAULT_POLL_INTERVAL_MS = 100;
const BWS_LIFECYCLE_TOKEN_PREFIX = '--bws-lifecycle-token=';
const PROCESS_SIGNAL_ZERO: NodeJS.Signals | 0 = 0;

export interface BwsOperatorLifecycleSourceFingerprints {
  readonly packageVersion: string;
  readonly sourceManifestGeneratedAt: string;
  readonly sourceManifestOverlay: string;
  readonly sourceManifestSha256: string;
  readonly upstreamCommitSha: string;
  readonly upstreamGitTreeSha: string;
  readonly upstreamTrackedTreeListingSha256: string;
}

export interface BwsOperatorLifecycleManagedProcess {
  readonly command: readonly string[];
  readonly commandCwd: string;
  readonly entryPointPath: string;
  readonly lifecycleToken: string;
  readonly pid: number;
  readonly processName: string;
  readonly procStartTicks: string;
  readonly startedAt: string;
}

export interface BwsOperatorLifecycleManagedServiceState {
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsServiceRuntimeConfig;
  readonly process: BwsOperatorLifecycleManagedProcess;
  readonly repositoryRoot: string;
  readonly runtimeBaseUrl: string;
  readonly schema: typeof BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA;
  readonly service: 'read_only_api';
  readonly sourceFingerprints: BwsOperatorLifecycleSourceFingerprints;
  readonly stateRecordedAt: string;
}

export interface BwsOperatorLifecycleProbeResult {
  readonly body: unknown;
  readonly ok: boolean;
  readonly statusCode: number;
  readonly url: string;
}

export interface BwsOperatorLifecycleCommandResult {
  readonly command: 'start' | 'status' | 'stop';
  readonly configuration: RedactedBwsServiceRuntimeConfig;
  readonly evidenceFile: string;
  readonly generatedAt: string;
  readonly health: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
  readonly outcome:
    | 'already_running'
    | 'already_stopped'
    | 'not_running'
    | 'running'
    | 'started'
    | 'stale_state_cleaned'
    | 'stopped';
  readonly process:
    | BwsOperatorLifecycleManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>;
  readonly readiness: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
  readonly service: 'read_only_api';
  readonly sourceFingerprints: BwsOperatorLifecycleSourceFingerprints;
  readonly stateFile: string;
}

export interface BwsOperatorLifecycleServiceDescriptor {
  readonly entryPointPath: string;
  readonly processName: string;
  readonly service: 'read_only_api';
}

interface BwsOperatorLifecyclePaths {
  readonly evidenceDirectory: string;
  readonly repositoryRoot: string;
  readonly stateDirectory: string;
  readonly stateFilePath: string;
}

interface BwsProcessSnapshot {
  readonly cmdline: readonly string[];
  readonly cwd: string;
  readonly procStartTicks: string;
}

export interface BwsLifecycleRequest {
  readonly config?: BwsServiceRuntimeConfig;
  readonly descriptor?: BwsOperatorLifecycleServiceDescriptor;
  readonly environment?: BwsServiceRuntimeEnvironment;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly runtimeStateDirectory?: string;
  readonly startTimeoutMs?: number;
  readonly statusRequestTimeoutMs?: number;
  readonly stopTimeoutMs?: number;
}

interface BwsLifecycleEvidenceRecord extends BwsOperatorLifecycleCommandResult {
  readonly repositoryRoot: string;
  readonly schema: typeof BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA;
}

export async function startManagedBwsReadOnlyApi(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  const context = createLifecycleContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readLifecycleState(context.paths.stateFilePath);
  if (currentState !== undefined) {
    assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
    assertConfigFingerprintMatches(currentState, context.configFingerprint);
    const ownership = readVerifiedProcessSnapshot(currentState.process);
    if (ownership === 'missing') {
      rmSync(context.paths.stateFilePath, { force: true });
      return await spawnAndPersistLifecycleState(context, 'stale_state_cleaned');
    }
    const result = await publishLifecycleEvidence(context, {
      command: 'start',
      outcome: 'already_running',
      process: currentState.process,
    });
    return result;
  }

  return await spawnAndPersistLifecycleState(context, 'started');
}

export async function getManagedBwsReadOnlyApiStatus(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  const context = createLifecycleContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readLifecycleState(context.paths.stateFilePath);
  if (currentState === undefined) {
    return await publishLifecycleEvidence(context, {
      command: 'status',
      outcome: 'not_running',
      process: Object.freeze({ ownership: 'missing' }),
    });
  }

  assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
  assertConfigFingerprintMatches(currentState, context.configFingerprint);
  const ownership = readVerifiedProcessSnapshot(currentState.process);
  if (ownership === 'missing') {
    rmSync(context.paths.stateFilePath, { force: true });
    return await publishLifecycleEvidence(context, {
      command: 'status',
      outcome: 'stale_state_cleaned',
      process: Object.freeze({ ownership: 'missing' }),
    });
  }

  return await publishLifecycleEvidence(context, {
    command: 'status',
    outcome: 'running',
    process: currentState.process,
  });
}

export async function stopManagedBwsReadOnlyApi(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  const context = createLifecycleContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readLifecycleState(context.paths.stateFilePath);
  if (currentState === undefined) {
    return await publishLifecycleEvidence(context, {
      command: 'stop',
      outcome: 'already_stopped',
      process: Object.freeze({ ownership: 'missing' }),
    });
  }

  assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
  assertConfigFingerprintMatches(currentState, context.configFingerprint);
  const ownership = readVerifiedProcessSnapshot(currentState.process);
  if (ownership === 'missing') {
    rmSync(context.paths.stateFilePath, { force: true });
    return await publishLifecycleEvidence(context, {
      command: 'stop',
      outcome: 'already_stopped',
      process: Object.freeze({ ownership: 'missing' }),
    });
  }

  const probes = await collectLifecycleProbes(context, currentState.process);
  process.kill(currentState.process.pid, 'SIGTERM');
  await waitForManagedProcessExit(currentState.process.pid, context.stopTimeoutMs);
  rmSync(context.paths.stateFilePath, { force: true });
  return await publishLifecycleEvidence(context, {
    command: 'stop',
    health: probes.health,
    outcome: 'stopped',
    process: currentState.process,
    readiness: probes.readiness,
  });
}

function createLifecycleContext(request: BwsLifecycleRequest): Readonly<{
  readonly config: BwsServiceRuntimeConfig;
  readonly configFingerprint: string;
  readonly descriptor: BwsOperatorLifecycleServiceDescriptor;
  readonly childEnvironment: NodeJS.ProcessEnv;
  readonly now: () => string;
  readonly paths: BwsOperatorLifecyclePaths;
  readonly sourceFingerprints: BwsOperatorLifecycleSourceFingerprints;
  readonly startTimeoutMs: number;
  readonly statusRequestTimeoutMs: number;
  readonly stopTimeoutMs: number;
}> {
  const repositoryRoot = realpathSync(request.repositoryRoot ?? process.cwd());
  const config = request.config ?? resolveBwsServiceRuntimeConfig(request.environment, repositoryRoot);
  const descriptor = request.descriptor ?? describeBwsReadOnlyApiLifecycleService(repositoryRoot);
  const childEnvironment = {
    ...process.env,
    ...(request.environment ?? process.env),
  };
  const now = request.now ?? defaultNow;
  const paths = resolveLifecyclePaths(
    repositoryRoot,
    request.runtimeStateDirectory ?? DEFAULT_RUNTIME_STATE_DIRECTORY,
  );
  const configFingerprint = sha256Json(redactBwsServiceRuntimeConfig(config));
  const sourceFingerprints = collectSourceFingerprints(repositoryRoot, config);
  return Object.freeze({
    config,
    configFingerprint,
    descriptor,
    childEnvironment,
    now,
    paths,
    sourceFingerprints,
    startTimeoutMs: request.startTimeoutMs ?? DEFAULT_START_TIMEOUT_MS,
    statusRequestTimeoutMs: request.statusRequestTimeoutMs ?? DEFAULT_STATUS_REQUEST_TIMEOUT_MS,
    stopTimeoutMs: request.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS,
  });
}

async function spawnAndPersistLifecycleState(
  context: ReturnType<typeof createLifecycleContext>,
  outcome: 'started' | 'stale_state_cleaned',
): Promise<BwsOperatorLifecycleCommandResult> {
  const lifecycleToken = randomUUID();
  const startedAt = context.now();
  const command = Object.freeze([
    process.execPath,
    context.descriptor.entryPointPath,
    `${BWS_LIFECYCLE_TOKEN_PREFIX}${lifecycleToken}`,
  ]);
  const child = spawn(process.execPath, [context.descriptor.entryPointPath, `${BWS_LIFECYCLE_TOKEN_PREFIX}${lifecycleToken}`], {
    cwd: context.paths.repositoryRoot,
    detached: true,
    env: context.childEnvironment,
    stdio: 'ignore',
  });
  child.unref();

  try {
    const snapshot = await waitForManagedProcessReady(
      child.pid ?? fail('Lifecycle start did not receive a child process pid.'),
      command,
      context.paths.repositoryRoot,
      lifecycleToken,
      context.config,
      context.startTimeoutMs,
    );
    const state: BwsOperatorLifecycleManagedServiceState = Object.freeze({
      configFingerprint: context.configFingerprint,
      configuration: redactBwsServiceRuntimeConfig(context.config),
      process: Object.freeze({
        command,
        commandCwd: context.paths.repositoryRoot,
        entryPointPath: context.descriptor.entryPointPath,
        lifecycleToken,
        pid: child.pid!,
        processName: context.descriptor.processName,
        procStartTicks: snapshot.procStartTicks,
        startedAt,
      }),
      repositoryRoot: context.paths.repositoryRoot,
      runtimeBaseUrl: `http://${context.config.api.bindHost}:${context.config.api.port}`,
      schema: BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA,
      service: context.descriptor.service,
      sourceFingerprints: context.sourceFingerprints,
      stateRecordedAt: context.now(),
    });
    writeLifecycleState(context.paths.stateFilePath, state);
    return await publishLifecycleEvidence(context, {
      command: 'start',
      outcome,
      process: state.process,
    });
  } catch (error) {
    try {
      if (child.pid !== undefined) {
        process.kill(child.pid, 'SIGTERM');
      }
    } catch {
      // Ignore cleanup failures during start rollback.
    }
    throw error;
  }
}

async function publishLifecycleEvidence(
  context: ReturnType<typeof createLifecycleContext>,
  partial: Readonly<{
    readonly command: 'start' | 'status' | 'stop';
    readonly health?:
      | BwsOperatorLifecycleProbeResult
      | Readonly<{ readonly error: string; readonly url: string }>;
    readonly outcome: BwsOperatorLifecycleCommandResult['outcome'];
    readonly process: BwsOperatorLifecycleCommandResult['process'];
    readonly readiness?:
      | BwsOperatorLifecycleProbeResult
      | Readonly<{ readonly error: string; readonly url: string }>;
  }>,
): Promise<BwsOperatorLifecycleCommandResult> {
  const generatedAt = context.now();
  const probes = partial.health !== undefined && partial.readiness !== undefined
    ? Object.freeze({
      health: partial.health,
      readiness: partial.readiness,
    })
    : await collectLifecycleProbes(context, partial.process);
  const evidenceFilePath = resolveLifecycleEvidenceFilePath(context.paths, generatedAt, partial.command, partial.outcome);
  const evidenceFile = relative(context.paths.repositoryRoot, evidenceFilePath);

  const result: BwsOperatorLifecycleCommandResult = Object.freeze({
    command: partial.command,
    configuration: redactBwsServiceRuntimeConfig(context.config),
    evidenceFile,
    generatedAt,
    health: probes.health,
    outcome: partial.outcome,
    process: partial.process,
    readiness: probes.readiness,
    service: 'read_only_api',
    sourceFingerprints: context.sourceFingerprints,
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
  });
  writeLifecycleEvidence(evidenceFilePath, {
    ...result,
    repositoryRoot: context.paths.repositoryRoot,
    schema: BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA,
  });

  return result;
}

function collectSourceFingerprints(
  repositoryRoot: string,
  config: BwsServiceRuntimeConfig,
): BwsOperatorLifecycleSourceFingerprints {
  const packageJsonPath = join(repositoryRoot, 'package.json');
  const sourceManifestPath = join(repositoryRoot, 'SOURCE_MANIFEST.json');
  const packageJson = requireObject(
    JSON.parse(readFileSync(packageJsonPath, 'utf-8')),
    'package.json',
  ) as { readonly version?: unknown };
  const version = requireNonEmptyString(packageJson.version, 'package.json version');
  const sourceManifestContents = readFileSync(sourceManifestPath, 'utf-8');
  const sourceManifest = requireObject(
    JSON.parse(sourceManifestContents),
    'SOURCE_MANIFEST.json',
  ) as {
    readonly generated?: unknown;
    readonly overlay?: unknown;
  };
  return Object.freeze({
    packageVersion: version,
    sourceManifestGeneratedAt: requireNonEmptyString(sourceManifest.generated, 'SOURCE_MANIFEST.json generated'),
    sourceManifestOverlay: requireNonEmptyString(sourceManifest.overlay, 'SOURCE_MANIFEST.json overlay'),
    sourceManifestSha256: sha256String(sourceManifestContents),
    upstreamCommitSha: config.upstream.lock.commitSha,
    upstreamGitTreeSha: config.upstream.lock.gitTreeSha,
    upstreamTrackedTreeListingSha256: config.upstream.lock.trackedTreeListingSha256,
  });
}

function describeBwsReadOnlyApiLifecycleService(
  repositoryRoot: string,
): BwsOperatorLifecycleServiceDescriptor {
  return Object.freeze({
    entryPointPath: resolve(repositoryRoot, 'dist/packages/bootstrap/src/cli/bws-read-only-api.js'),
    processName: 'bws-read-only-api',
    service: 'read_only_api',
  });
}

function resolveLifecyclePaths(
  repositoryRoot: string,
  runtimeStateDirectory: string,
): BwsOperatorLifecyclePaths {
  const stateDirectory = resolve(repositoryRoot, runtimeStateDirectory, 'read-only-api');
  return Object.freeze({
    evidenceDirectory: join(stateDirectory, 'evidence'),
    repositoryRoot,
    stateDirectory,
    stateFilePath: join(stateDirectory, 'state.json'),
  });
}

function readLifecycleState(
  stateFilePath: string,
): BwsOperatorLifecycleManagedServiceState | undefined {
  if (!existsSync(stateFilePath)) {
    return undefined;
  }
  const parsed = requireObject(
    JSON.parse(readFileSync(stateFilePath, 'utf-8')),
    stateFilePath,
  ) as Partial<BwsOperatorLifecycleManagedServiceState>;
  if (parsed.schema !== BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA) {
    throw new Error(`Unexpected lifecycle state schema in ${stateFilePath}.`);
  }
  if (parsed.service !== 'read_only_api') {
    throw new Error(`Unexpected lifecycle service in ${stateFilePath}.`);
  }
  return parsed as BwsOperatorLifecycleManagedServiceState;
}

function writeLifecycleState(
  stateFilePath: string,
  state: BwsOperatorLifecycleManagedServiceState,
): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  const temporaryPath = `${stateFilePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, stateFilePath);
}

function writeLifecycleEvidence(filePath: string, record: BwsLifecycleEvidenceRecord): void {
  if (existsSync(filePath)) {
    throw new Error(`Lifecycle evidence file already exists: ${filePath}`);
  }
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
}

function resolveLifecycleEvidenceFilePath(
  paths: BwsOperatorLifecyclePaths,
  generatedAt: string,
  command: BwsOperatorLifecycleCommandResult['command'],
  outcome: BwsOperatorLifecycleCommandResult['outcome'],
): string {
  const timestamp = generatedAt.replace(/[:.]/g, '').replace(/-/g, '');
  return join(paths.evidenceDirectory, `${timestamp}-${command}-${outcome}.json`);
}

async function waitForManagedProcessReady(
  pid: number,
  command: readonly string[],
  repositoryRoot: string,
  lifecycleToken: string,
  config: BwsServiceRuntimeConfig,
  timeoutMs: number,
): Promise<BwsProcessSnapshot> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const snapshot = readVerifiedProcessSnapshotFromRuntime(pid, command, repositoryRoot, lifecycleToken);
    if (snapshot !== 'missing') {
      const health = await fetchProbe(`http://${config.api.bindHost}:${config.api.port}/health`, DEFAULT_POLL_INTERVAL_MS);
      const readiness = await fetchProbe(`http://${config.api.bindHost}:${config.api.port}/readiness`, DEFAULT_POLL_INTERVAL_MS);
      if ('ok' in health && 'ok' in readiness && health.ok && readiness.ok) {
        return snapshot;
      }
    }
    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for managed BWS API readiness on pid ${pid}.`);
}

async function collectLifecycleProbes(
  context: ReturnType<typeof createLifecycleContext>,
  processRecord: BwsOperatorLifecycleCommandResult['process'],
): Promise<Readonly<{
  readonly health: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
  readonly readiness: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
}>> {
  const runtimeBaseUrl = `http://${context.config.api.bindHost}:${context.config.api.port}`;
  if (isMissingManagedProcess(processRecord)) {
    return Object.freeze({
      health: Object.freeze({ error: 'managed process is not running', url: `${runtimeBaseUrl}/health` }),
      readiness: Object.freeze({ error: 'managed process is not running', url: `${runtimeBaseUrl}/readiness` }),
    });
  }
  return Object.freeze({
    health: await fetchProbe(`${runtimeBaseUrl}/health`, context.statusRequestTimeoutMs),
    readiness: await fetchProbe(`${runtimeBaseUrl}/readiness`, context.statusRequestTimeoutMs),
  });
}

function readVerifiedProcessSnapshot(
  processRecord: BwsOperatorLifecycleManagedProcess,
): BwsProcessSnapshot | 'missing' {
  return readVerifiedProcessSnapshotFromRuntime(
    processRecord.pid,
    processRecord.command,
    processRecord.commandCwd,
    processRecord.lifecycleToken,
    processRecord.procStartTicks,
  );
}

function readVerifiedProcessSnapshotFromRuntime(
  pid: number,
  command: readonly string[],
  repositoryRoot: string,
  lifecycleToken: string,
  expectedProcStartTicks?: string,
): BwsProcessSnapshot | 'missing' {
  if (!isProcessAlive(pid)) {
    return 'missing';
  }
  const snapshot = readProcessSnapshot(pid);
  if (snapshot === undefined) {
    return 'missing';
  }
  if (expectedProcStartTicks !== undefined && snapshot.procStartTicks !== expectedProcStartTicks) {
    throw new Error(`Lifecycle pid ${pid} no longer matches the recorded Linux /proc start ticks.`);
  }
  if (snapshot.cwd !== repositoryRoot) {
    throw new Error(`Lifecycle pid ${pid} is not running from the recorded repository root.`);
  }
  if (snapshot.cmdline.length !== command.length) {
    throw new Error(`Lifecycle pid ${pid} command length does not match the recorded command.`);
  }
  for (let index = 0; index < command.length; index += 1) {
    if (snapshot.cmdline[index] !== command[index]) {
      throw new Error(`Lifecycle pid ${pid} command mismatch at argument ${index}.`);
    }
  }
  if (!snapshot.cmdline.includes(`${BWS_LIFECYCLE_TOKEN_PREFIX}${lifecycleToken}`)) {
    throw new Error(`Lifecycle pid ${pid} does not contain the recorded lifecycle token.`);
  }
  return snapshot;
}

function readProcessSnapshot(pid: number): BwsProcessSnapshot | undefined {
  const procRoot = join('/proc', String(pid));
  if (!existsSync(procRoot)) {
    return undefined;
  }
  const cwd = realpathSync(join(procRoot, 'cwd'));
  const cmdlineContents = readFileSync(join(procRoot, 'cmdline'));
  const statContents = readFileSync(join(procRoot, 'stat'), 'utf-8');
  const cmdline = cmdlineContents
    .toString('utf-8')
    .split('\u0000')
    .filter((value) => value.length > 0);
  const closingParenthesisIndex = statContents.lastIndexOf(') ');
  if (closingParenthesisIndex <= 0) {
    throw new Error(`Unable to parse /proc/${pid}/stat.`);
  }
  const fields = statContents.slice(closingParenthesisIndex + 2).trim().split(/\s+/);
  const procStartTicks = fields[19];
  if (procStartTicks === undefined || procStartTicks.length === 0) {
    throw new Error(`Unable to read /proc/${pid} start ticks.`);
  }
  return Object.freeze({
    cmdline: Object.freeze(cmdline),
    cwd,
    procStartTicks,
  });
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, PROCESS_SIGNAL_ZERO);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
      return false;
    }
    if (error instanceof Error && 'code' in error && error.code === 'EPERM') {
      throw new Error(`Lifecycle pid ${pid} exists but is not accessible for ownership verification.`);
    }
    throw error;
  }
}

async function waitForManagedProcessExit(pid: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    if (!isProcessAlive(pid)) {
      return;
    }
    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for managed BWS API pid ${pid} to exit after SIGTERM.`);
}

async function fetchProbe(
  url: string,
  timeoutMs: number,
): Promise<BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    });
    const body = parseProbeResponseBody(await response.text());
    return Object.freeze({
      body,
      ok: response.ok,
      statusCode: response.status,
      url,
    });
  } catch (error) {
    return Object.freeze({
      error: error instanceof Error ? error.message : String(error),
      url,
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseProbeResponseBody(body: string): unknown {
  if (body.trim().length === 0) {
    return null;
  }
  return JSON.parse(body);
}

function assertStateMatchesRepository(
  state: BwsOperatorLifecycleManagedServiceState,
  repositoryRoot: string,
): void {
  if (state.repositoryRoot !== repositoryRoot) {
    throw new Error('Lifecycle state belongs to a different repository root.');
  }
}

function assertConfigFingerprintMatches(
  state: BwsOperatorLifecycleManagedServiceState,
  configFingerprint: string,
): void {
  if (state.configFingerprint !== configFingerprint) {
    throw new Error(
      'Lifecycle command configuration fingerprint does not match the recorded managed process configuration.',
    );
  }
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function sha256Json(value: unknown): string {
  return sha256String(JSON.stringify(value));
}

function sha256String(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function defaultNow(): string {
  return new Date().toISOString();
}

function isMissingManagedProcess(
  processRecord: BwsOperatorLifecycleCommandResult['process'],
): processRecord is Readonly<{ readonly ownership: 'missing' }> {
  return 'ownership' in processRecord;
}

function fail(message: string): never {
  throw new Error(message);
}
