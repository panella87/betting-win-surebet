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
  getBwsPrivatePaperSchedulerServiceStatus,
  type BwsPrivatePaperSchedulerServiceCommandResult,
} from './private-paper-scheduler-service.js';
import {
  getBwsPrivatePaperWorkerServiceStatus,
  type BwsPrivatePaperWorkerServiceCommandResult,
} from './private-paper-worker-service.js';
import {
  redactBwsServiceRuntimeConfig,
  resolveBwsServiceRuntimeConfig,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
  type RedactedBwsServiceRuntimeConfig,
} from './service-runtime.js';
import {
  BWS_OBSERVABILITY_RUNTIME_ID_ENV,
  createBwsStructuredLogger,
  createBwsStructuredProcessIdentity,
  registerBwsEvidenceArtifact,
} from './observability.js';
import {
  getBwsUpstreamConvergenceServiceStatus,
  type BwsUpstreamConvergenceServiceCommandResult,
} from './upstream-convergence-service.js';

const BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA = 'bws.operator_lifecycle_state.v2';
const BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA = 'bws.operator_lifecycle_evidence.v2';
const DEFAULT_RUNTIME_STATE_DIRECTORY = 'runtime/bws-operator-lifecycle';
const DEFAULT_START_TIMEOUT_MS = 60_000;
const DEFAULT_STOP_TIMEOUT_MS = 10_000;
const DEFAULT_STATUS_REQUEST_TIMEOUT_MS = 3_000;
const DEFAULT_POLL_INTERVAL_MS = 100;
const BWS_LIFECYCLE_TOKEN_PREFIX = '--bws-lifecycle-token=';
const PROCESS_SIGNAL_ZERO: NodeJS.Signals | 0 = 0;
const LIFECYCLE_ROLE_ORDER = Object.freeze([
  'upstream_convergence',
  'private_paper_scheduler',
  'private_paper_worker',
  'cockpit',
  'api',
] as const);

type BwsLifecycleStageRole = (typeof LIFECYCLE_ROLE_ORDER)[number];
type BwsLifecycleComponentStatus = 'blocked' | 'degraded' | 'missing' | 'ready';
type BwsLifecycleHealthStatus = 'blocked' | 'degraded' | 'healthy';
type BwsLifecycleReadinessStatus = 'blocked' | 'degraded' | 'ready';
type BwsManagedProcessKind = 'api_runtime' | 'private_paper_scheduler' | 'private_paper_worker' | 'upstream_convergence';
type BwsManagedServiceReader = (
  repositoryRoot: string,
) =>
  | BwsUpstreamConvergenceServiceCommandResult
  | BwsPrivatePaperSchedulerServiceCommandResult
  | BwsPrivatePaperWorkerServiceCommandResult;

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
  readonly kind: BwsManagedProcessKind;
  readonly lifecycleToken: string;
  readonly pid: number;
  readonly processName: string;
  readonly procStartTicks: string;
  readonly roles: readonly BwsLifecycleStageRole[];
  readonly startedAt: string;
}

export interface BwsOperatorLifecycleManagedServiceState {
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsServiceRuntimeConfig;
  readonly processes: readonly BwsOperatorLifecycleManagedProcess[];
  readonly repositoryRoot: string;
  readonly runtimeId?: string;
  readonly runtimeBaseUrl: string;
  readonly schema: typeof BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA;
  readonly service: 'full_stack';
  readonly sourceFingerprints: BwsOperatorLifecycleSourceFingerprints;
  readonly stateRecordedAt: string;
}

export interface BwsOperatorLifecycleProbeResult {
  readonly body: unknown;
  readonly ok: boolean;
  readonly statusCode: number;
  readonly url: string;
}

export interface BwsOperatorLifecycleRoleRuntimeSummary {
  readonly evidenceFile: string;
  readonly lifecycleState: string;
  readonly outcome: string;
  readonly service: string;
  readonly stateFile: string;
}

export interface BwsOperatorLifecycleRoleStatus {
  readonly lifecycleToken?: string;
  readonly pid?: number;
  readonly processName?: string;
  readonly role: BwsLifecycleStageRole;
  readonly runtime?: BwsOperatorLifecycleRoleRuntimeSummary;
  readonly startedAt?: string;
  readonly state: 'missing' | 'running';
}

export interface BwsOperatorLifecycleStackStatus {
  readonly blockers: readonly string[];
  readonly components: Readonly<Record<BwsLifecycleStageRole, BwsLifecycleComponentStatus>>;
  readonly healthStatus: BwsLifecycleHealthStatus;
  readonly readinessStatus: BwsLifecycleReadinessStatus;
  readonly roles: readonly BwsOperatorLifecycleRoleStatus[];
  readonly shutdownOrder: readonly BwsLifecycleStageRole[];
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
    | 'degraded'
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
  readonly processes: readonly BwsOperatorLifecycleManagedProcess[];
  readonly readiness: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
  readonly runtimeId?: string;
  readonly service: 'full_stack';
  readonly sourceFingerprints: BwsOperatorLifecycleSourceFingerprints;
  readonly stack: BwsOperatorLifecycleStackStatus;
  readonly stateFile: string;
}

export interface BwsOperatorLifecycleManagedProcessDescriptor {
  readonly commandArguments?: readonly string[];
  readonly entryPointPath: string;
  readonly kind: BwsManagedProcessKind;
  readonly processName: string;
  readonly roles: readonly BwsLifecycleStageRole[];
  readonly statusReader?: BwsManagedServiceReader;
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

interface BwsInspectedManagedProcess {
  readonly process: BwsOperatorLifecycleManagedProcess;
  readonly snapshot?: BwsProcessSnapshot;
  readonly state: 'missing' | 'running';
}

interface BwsManagedRoleDetail {
  readonly descriptor?: BwsOperatorLifecycleManagedProcessDescriptor | undefined;
  readonly process?: BwsOperatorLifecycleManagedProcess | undefined;
  readonly status: BwsLifecycleComponentStatus;
  readonly summary: BwsOperatorLifecycleRoleStatus;
}

interface BwsManagedServiceStatusReaderResult {
  readonly evidenceFile: string;
  readonly lifecycleState: string;
  readonly outcome: string;
  readonly service: string;
  readonly stateFile: string;
}

export interface BwsLifecycleRequest {
  readonly config?: BwsServiceRuntimeConfig;
  readonly environment?: BwsServiceRuntimeEnvironment;
  readonly managedProcessDescriptors?: readonly BwsOperatorLifecycleManagedProcessDescriptor[];
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly runtimeStateDirectory?: string;
  readonly startTimeoutMs?: number;
  readonly statusRequestTimeoutMs?: number;
  readonly stopTimeoutMs?: number;
}

export interface BwsOperatorLifecycleServiceDescriptor {
  readonly entryPointPath: string;
  readonly processName: string;
  readonly service: 'read_only_api';
}

interface BwsLifecycleEvidenceRecord extends BwsOperatorLifecycleCommandResult {
  readonly repositoryRoot: string;
  readonly schema: typeof BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA;
}

export async function startManagedBwsOperatorStack(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  const context = createLifecycleContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readLifecycleState(context.paths.stateFilePath);
  if (currentState !== undefined) {
    assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
    assertConfigFingerprintMatches(currentState, context.configFingerprint);
    const inspection = inspectManagedProcesses(currentState.processes);
    if (inspection.every((entry) => entry.state === 'running')) {
      return await publishLifecycleEvidence(context, {
        command: 'start',
        outcome: 'already_running',
        processes: currentState.processes,
      });
    }
    await cleanupManagedProcesses(context, currentState.processes, inspection);
    rmSync(context.paths.stateFilePath, { force: true });
    return await spawnAndPersistLifecycleState(context, 'stale_state_cleaned');
  }

  return await spawnAndPersistLifecycleState(context, 'started');
}

export async function getManagedBwsOperatorStackStatus(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  const context = createLifecycleContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readLifecycleState(context.paths.stateFilePath);
  if (currentState === undefined) {
    return await publishLifecycleEvidence(context, {
      command: 'status',
      outcome: 'not_running',
      processes: Object.freeze([]),
    });
  }

  assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
  assertConfigFingerprintMatches(currentState, context.configFingerprint);
  const inspection = inspectManagedProcesses(currentState.processes);
  if (inspection.every((entry) => entry.state === 'missing')) {
    rmSync(context.paths.stateFilePath, { force: true });
    return await publishLifecycleEvidence(context, {
      command: 'status',
      outcome: 'stale_state_cleaned',
      processes: Object.freeze([]),
    });
  }

  const outcome = inspection.every((entry) => entry.state === 'running')
    ? 'running'
    : 'degraded';
  return await publishLifecycleEvidence(context, {
    command: 'status',
    outcome,
    processes: currentState.processes,
  });
}

export async function stopManagedBwsOperatorStack(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  const context = createLifecycleContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readLifecycleState(context.paths.stateFilePath);
  if (currentState === undefined) {
    return await publishLifecycleEvidence(context, {
      command: 'stop',
      outcome: 'already_stopped',
      processes: Object.freeze([]),
    });
  }

  assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
  assertConfigFingerprintMatches(currentState, context.configFingerprint);
  const inspection = inspectManagedProcesses(currentState.processes);
  const probes = await collectLifecycleProbes(context, inspection);
  await shutdownManagedProcesses(context, currentState.processes, inspection);
  rmSync(context.paths.stateFilePath, { force: true });
  return await publishLifecycleEvidence(context, {
    command: 'stop',
    health: probes.health,
    outcome: 'stopped',
    processes: currentState.processes,
    readiness: probes.readiness,
  });
}

export async function startManagedBwsReadOnlyApi(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  return await startManagedBwsOperatorStack(request);
}

export async function getManagedBwsReadOnlyApiStatus(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  return await getManagedBwsOperatorStackStatus(request);
}

export async function stopManagedBwsReadOnlyApi(
  request: BwsLifecycleRequest = {},
): Promise<BwsOperatorLifecycleCommandResult> {
  return await stopManagedBwsOperatorStack(request);
}

function createLifecycleContext(request: BwsLifecycleRequest): Readonly<{
  readonly childEnvironment: NodeJS.ProcessEnv;
  readonly config: BwsServiceRuntimeConfig;
  readonly configFingerprint: string;
  readonly descriptors: readonly BwsOperatorLifecycleManagedProcessDescriptor[];
  readonly now: () => string;
  readonly paths: BwsOperatorLifecyclePaths;
  readonly sourceFingerprints: BwsOperatorLifecycleSourceFingerprints;
  readonly startTimeoutMs: number;
  readonly statusRequestTimeoutMs: number;
  readonly stopTimeoutMs: number;
}> {
  const repositoryRoot = realpathSync(request.repositoryRoot ?? process.cwd());
  const config = request.config ?? resolveBwsServiceRuntimeConfig(request.environment, repositoryRoot);
  const descriptors = request.managedProcessDescriptors ?? describeManagedProcessDescriptors(repositoryRoot);
  const childEnvironment = {
    ...process.env,
    ...(request.environment ?? process.env),
  };
  const now = request.now ?? defaultNow;
  const paths = resolveLifecyclePaths(
    repositoryRoot,
    request.runtimeStateDirectory ?? DEFAULT_RUNTIME_STATE_DIRECTORY,
  );
  const configFingerprint = sha256Json({
    configuration: redactBwsServiceRuntimeConfig(config),
    managedProcessDescriptors: descriptors.map((descriptor) => ({
      commandArguments: descriptor.commandArguments ?? [],
      entryPointPath: descriptor.entryPointPath,
      kind: descriptor.kind,
      processName: descriptor.processName,
      roles: descriptor.roles,
    })),
  });
  const sourceFingerprints = collectSourceFingerprints(repositoryRoot, config);
  return Object.freeze({
    childEnvironment,
    config,
    configFingerprint,
    descriptors,
    now,
    paths,
    sourceFingerprints,
    startTimeoutMs: request.startTimeoutMs ?? DEFAULT_START_TIMEOUT_MS,
    statusRequestTimeoutMs: request.statusRequestTimeoutMs ?? DEFAULT_STATUS_REQUEST_TIMEOUT_MS,
    stopTimeoutMs: request.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS,
  });
}

function describeManagedProcessDescriptors(
  repositoryRoot: string,
): readonly BwsOperatorLifecycleManagedProcessDescriptor[] {
  return Object.freeze([
    Object.freeze({
      commandArguments: Object.freeze(['run']),
      entryPointPath: resolve(
        repositoryRoot,
        'dist/packages/bootstrap/src/cli/bws-upstream-convergence-service.js',
      ),
      kind: 'upstream_convergence' as const,
      processName: 'bws-upstream-convergence-service',
      roles: Object.freeze(['upstream_convergence'] as const),
      statusReader: (root: string) => getBwsUpstreamConvergenceServiceStatus({ repositoryRoot: root }),
    }),
    Object.freeze({
      commandArguments: Object.freeze(['run']),
      entryPointPath: resolve(
        repositoryRoot,
        'dist/packages/bootstrap/src/cli/bws-private-paper-scheduler-service.js',
      ),
      kind: 'private_paper_scheduler' as const,
      processName: 'bws-private-paper-scheduler-service',
      roles: Object.freeze(['private_paper_scheduler'] as const),
      statusReader: (root: string) => getBwsPrivatePaperSchedulerServiceStatus({ repositoryRoot: root }),
    }),
    Object.freeze({
      commandArguments: Object.freeze(['run']),
      entryPointPath: resolve(
        repositoryRoot,
        'dist/packages/bootstrap/src/cli/bws-private-paper-worker-service.js',
      ),
      kind: 'private_paper_worker' as const,
      processName: 'bws-private-paper-worker-service',
      roles: Object.freeze(['private_paper_worker'] as const),
      statusReader: (root: string) => getBwsPrivatePaperWorkerServiceStatus({ repositoryRoot: root }),
    }),
    Object.freeze({
      entryPointPath: resolve(repositoryRoot, 'dist/packages/bootstrap/src/cli/bws-read-only-api.js'),
      kind: 'api_runtime' as const,
      processName: 'bws-read-only-api',
      roles: Object.freeze(['cockpit', 'api'] as const),
    }),
  ]);
}

async function spawnAndPersistLifecycleState(
  context: ReturnType<typeof createLifecycleContext>,
  outcome: 'started' | 'stale_state_cleaned',
): Promise<BwsOperatorLifecycleCommandResult> {
  const lifecycleToken = randomUUID();
  const startedAt = context.now();
  const startedProcesses: BwsOperatorLifecycleManagedProcess[] = [];

  try {
    for (const descriptor of context.descriptors) {
      const command = Object.freeze([
        process.execPath,
        descriptor.entryPointPath,
        ...(descriptor.commandArguments ?? []),
        `${BWS_LIFECYCLE_TOKEN_PREFIX}${lifecycleToken}`,
      ]);
      const child = spawn(
        process.execPath,
        [
          descriptor.entryPointPath,
          ...(descriptor.commandArguments ?? []),
          `${BWS_LIFECYCLE_TOKEN_PREFIX}${lifecycleToken}`,
        ],
        {
          cwd: context.paths.repositoryRoot,
          detached: true,
          env: {
            ...context.childEnvironment,
            [BWS_OBSERVABILITY_RUNTIME_ID_ENV]: lifecycleToken,
          },
          stdio: 'ignore',
        },
      );
      child.unref();
      const pid = child.pid ?? fail(`Lifecycle start did not receive a child process pid for ${descriptor.processName}.`);
      const snapshot = await waitForManagedProcessPresence(
        pid,
        command,
        context.paths.repositoryRoot,
        lifecycleToken,
        context.startTimeoutMs,
      );
      startedProcesses.push(
        Object.freeze({
          command,
          commandCwd: context.paths.repositoryRoot,
          entryPointPath: descriptor.entryPointPath,
          kind: descriptor.kind,
          lifecycleToken,
          pid,
          processName: descriptor.processName,
          procStartTicks: snapshot.procStartTicks,
          roles: descriptor.roles,
          startedAt,
        }),
      );
    }

    const apiProcess = requirePrimaryProcess(startedProcesses);
    await waitForManagedApiObservable(
      apiProcess.pid,
      apiProcess.command,
      context.paths.repositoryRoot,
      apiProcess.lifecycleToken,
      context.config,
      context.startTimeoutMs,
    );

    const state: BwsOperatorLifecycleManagedServiceState = Object.freeze({
      configFingerprint: context.configFingerprint,
      configuration: redactBwsServiceRuntimeConfig(context.config),
      processes: Object.freeze(startedProcesses),
      repositoryRoot: context.paths.repositoryRoot,
      runtimeId: lifecycleToken,
      runtimeBaseUrl: `http://${context.config.api.bindHost}:${context.config.api.port}`,
      schema: BWS_OPERATOR_LIFECYCLE_STATE_SCHEMA,
      service: 'full_stack',
      sourceFingerprints: context.sourceFingerprints,
      stateRecordedAt: context.now(),
    });
    writeLifecycleState(context.paths.stateFilePath, state);
    return await publishLifecycleEvidence(context, {
      command: 'start',
      outcome,
      processes: state.processes,
    });
  } catch (error) {
    const inspection = startedProcesses.map((processRecord) => Object.freeze({
      process: processRecord,
      state: processRecord.pid > 0 && isProcessAlive(processRecord.pid) ? 'running' as const : 'missing' as const,
    }));
    await cleanupManagedProcesses(context, startedProcesses, inspection);
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
    readonly processes: readonly BwsOperatorLifecycleManagedProcess[];
    readonly readiness?:
      | BwsOperatorLifecycleProbeResult
      | Readonly<{ readonly error: string; readonly url: string }>;
  }>,
): Promise<BwsOperatorLifecycleCommandResult> {
  const generatedAt = context.now();
  const inspection = inspectManagedProcesses(partial.processes);
  const probes = partial.health !== undefined && partial.readiness !== undefined
    ? Object.freeze({
      health: partial.health,
      readiness: partial.readiness,
    })
    : await collectLifecycleProbes(context, inspection);
  const stack = buildStackStatus(context, partial.processes, inspection, probes);
  const evidenceFilePath = resolveLifecycleEvidenceFilePath(context.paths, generatedAt, partial.command, partial.outcome);
  const evidenceFile = relative(context.paths.repositoryRoot, evidenceFilePath);
  const primaryProcess = resolvePrimaryProcess(partial.processes, inspection);
  const runtimeId = partial.processes[0]?.lifecycleToken ?? generateFallbackRuntimeId(partial.command, generatedAt);

  const result: BwsOperatorLifecycleCommandResult = Object.freeze({
    command: partial.command,
    configuration: redactBwsServiceRuntimeConfig(context.config),
    evidenceFile,
    generatedAt,
    health: probes.health,
    outcome: partial.outcome,
    process: primaryProcess,
    processes: Object.freeze(partial.processes),
    readiness: probes.readiness,
    runtimeId,
    service: 'full_stack',
    sourceFingerprints: context.sourceFingerprints,
    stack,
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
  });
  writeLifecycleEvidence(evidenceFilePath, {
    ...result,
    repositoryRoot: context.paths.repositoryRoot,
    schema: BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA,
  });
  registerBwsEvidenceArtifact({
    artifactPath: evidenceFilePath,
    artifactSchema: BWS_OPERATOR_LIFECYCLE_EVIDENCE_SCHEMA,
    createdAt: generatedAt,
    repositoryRoot: context.paths.repositoryRoot,
    retentionClass: 'lifecycle',
    runtimeId,
    sourceFingerprint: context.sourceFingerprints.sourceManifestSha256,
  });
  createBwsStructuredLogger({
    processIdentity: createBwsStructuredProcessIdentity('bws-operator-lifecycle', context.paths.repositoryRoot, generatedAt),
    repositoryRoot: context.paths.repositoryRoot,
    runtimeId,
  }).write({
    details: Object.freeze({
      command: partial.command,
      healthStatus: stack.healthStatus,
      outcome: partial.outcome,
      readinessStatus: stack.readinessStatus,
    }),
    eventCode: `lifecycle_${partial.command}`,
    serviceRole: 'lifecycle',
    timestamp: generatedAt,
  });
  return result;
}

function buildStackStatus(
  context: ReturnType<typeof createLifecycleContext>,
  processes: readonly BwsOperatorLifecycleManagedProcess[],
  inspection: readonly BwsInspectedManagedProcess[],
  probes: Readonly<{
    readonly health: BwsOperatorLifecycleCommandResult['health'];
    readonly readiness: BwsOperatorLifecycleCommandResult['readiness'];
  }>,
): BwsOperatorLifecycleStackStatus {
  const details = new Map<BwsLifecycleStageRole, BwsManagedRoleDetail>();
  for (const role of LIFECYCLE_ROLE_ORDER) {
    const processRecord = processes.find((entry) => entry.roles.includes(role));
    const descriptor = context.descriptors.find((entry) => entry.roles.includes(role));
    const inspected = processRecord === undefined
      ? undefined
      : inspection.find((entry) => entry.process.pid === processRecord.pid && entry.process.kind === processRecord.kind);
    const runtime = inspected?.state === 'running' && descriptor?.statusReader !== undefined
      ? readManagedServiceStatus(descriptor.statusReader, context.paths.repositoryRoot)
      : undefined;
    const status = resolveRoleStatus(role, inspected?.state ?? 'missing', runtime, probes);
    details.set(role, Object.freeze({
      descriptor,
      process: processRecord,
      status,
      summary: Object.freeze({
        ...(processRecord === undefined ? {} : {
          lifecycleToken: processRecord.lifecycleToken,
          pid: processRecord.pid,
          processName: processRecord.processName,
          startedAt: processRecord.startedAt,
        }),
        ...(runtime === undefined ? {} : { runtime }),
        role,
        state: inspected?.state ?? 'missing',
      }),
    }));
  }

  const roles = Object.freeze(LIFECYCLE_ROLE_ORDER.map((role) => details.get(role)!.summary));
  const components = Object.freeze({
    api: details.get('api')!.status,
    cockpit: details.get('cockpit')!.status,
    private_paper_scheduler: details.get('private_paper_scheduler')!.status,
    private_paper_worker: details.get('private_paper_worker')!.status,
    upstream_convergence: details.get('upstream_convergence')!.status,
  });
  const blockers = Object.freeze(
    LIFECYCLE_ROLE_ORDER
      .filter((role) => details.get(role)!.status === 'blocked')
      .map((role) => `${role} is blocked.`),
  );
  const statuses = Object.values(components);
  const healthStatus: BwsLifecycleHealthStatus = blockers.length > 0
    ? 'blocked'
    : statuses.some((status) => status === 'degraded' || status === 'missing')
      ? 'degraded'
      : 'healthy';
  const readinessStatus: BwsLifecycleReadinessStatus = blockers.length > 0
    ? 'blocked'
    : statuses.every((status) => status === 'ready')
      ? 'ready'
      : 'degraded';

  return Object.freeze({
    blockers,
    components,
    healthStatus,
    readinessStatus,
    roles,
    shutdownOrder: LIFECYCLE_ROLE_ORDER,
  });
}

function resolveRoleStatus(
  role: BwsLifecycleStageRole,
  state: 'missing' | 'running',
  runtime: BwsManagedServiceStatusReaderResult | undefined,
  probes: Readonly<{
    readonly health: BwsOperatorLifecycleCommandResult['health'];
    readonly readiness: BwsOperatorLifecycleCommandResult['readiness'];
  }>,
): BwsLifecycleComponentStatus {
  if (state === 'missing') {
    return 'missing';
  }
  if (role === 'api') {
    return probeIsSuccessful(probes.health) ? 'ready' : 'blocked';
  }
  if (role === 'cockpit') {
    return cockpitProbeIsReady(probes.readiness) ? 'ready' : 'blocked';
  }
  if (runtime === undefined) {
    return 'ready';
  }
  if (runtime.outcome === 'running' && runtime.lifecycleState === 'running') {
    return 'ready';
  }
  if (runtime.outcome === 'not_running' || runtime.outcome === 'stale_state') {
    return 'degraded';
  }
  return 'blocked';
}

function readManagedServiceStatus(
  statusReader: BwsManagedServiceReader,
  repositoryRoot: string,
): BwsManagedServiceStatusReaderResult {
  const result = statusReader(repositoryRoot);
  return Object.freeze({
    evidenceFile: result.evidenceFile,
    lifecycleState: result.lifecycleState,
    outcome: result.outcome,
    service: result.service,
    stateFile: result.stateFile,
  });
}

async function collectLifecycleProbes(
  context: ReturnType<typeof createLifecycleContext>,
  inspection: readonly BwsInspectedManagedProcess[],
): Promise<Readonly<{
  readonly health: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
  readonly readiness: BwsOperatorLifecycleProbeResult | Readonly<{ readonly error: string; readonly url: string }>;
}>> {
  const runtimeBaseUrl = `http://${context.config.api.bindHost}:${context.config.api.port}`;
  const apiProcess = resolvePrimaryProcessFromInspection(inspection);
  if (apiProcess === undefined) {
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

async function cleanupManagedProcesses(
  context: ReturnType<typeof createLifecycleContext>,
  processes: readonly BwsOperatorLifecycleManagedProcess[],
  inspection: readonly BwsInspectedManagedProcess[],
): Promise<void> {
  try {
    await shutdownManagedProcesses(context, processes, inspection);
  } catch {
    // Ignore cleanup failures during recovery. The caller will fail closed with the original error.
  }
}

async function shutdownManagedProcesses(
  context: ReturnType<typeof createLifecycleContext>,
  processes: readonly BwsOperatorLifecycleManagedProcess[],
  inspection: readonly BwsInspectedManagedProcess[],
): Promise<void> {
  const handledPids = new Set<number>();
  for (const role of LIFECYCLE_ROLE_ORDER) {
    const processRecord = processes.find((entry) => entry.roles.includes(role));
    if (processRecord === undefined || handledPids.has(processRecord.pid)) {
      continue;
    }
    const inspected = inspection.find((entry) => entry.process.pid === processRecord.pid && entry.process.kind === processRecord.kind);
    if (inspected?.state !== 'running') {
      handledPids.add(processRecord.pid);
      continue;
    }
    process.kill(processRecord.pid, 'SIGTERM');
    await waitForManagedProcessExit(processRecord.pid, context.stopTimeoutMs);
    handledPids.add(processRecord.pid);
  }
}

function inspectManagedProcesses(
  processes: readonly BwsOperatorLifecycleManagedProcess[],
): readonly BwsInspectedManagedProcess[] {
  return Object.freeze(
    processes.map((processRecord) => {
      const snapshot = readVerifiedProcessSnapshot(processRecord);
      return Object.freeze({
        process: processRecord,
        ...(snapshot === 'missing'
          ? { state: 'missing' as const }
          : {
            snapshot,
            state: 'running' as const,
          }),
      });
    }),
  );
}

function resolvePrimaryProcess(
  processes: readonly BwsOperatorLifecycleManagedProcess[],
  inspection: readonly BwsInspectedManagedProcess[],
): BwsOperatorLifecycleCommandResult['process'] {
  const apiProcess = processes.find((entry) => entry.roles.includes('api'));
  if (apiProcess === undefined) {
    return Object.freeze({ ownership: 'missing' });
  }
  const inspected = inspection.find((entry) => entry.process.pid === apiProcess.pid && entry.process.kind === apiProcess.kind);
  return inspected?.state === 'running'
    ? apiProcess
    : Object.freeze({ ownership: 'missing' });
}

function resolvePrimaryProcessFromInspection(
  inspection: readonly BwsInspectedManagedProcess[],
): BwsOperatorLifecycleManagedProcess | undefined {
  return inspection.find((entry) => entry.process.roles.includes('api') && entry.state === 'running')?.process;
}

function requirePrimaryProcess(
  processes: readonly BwsOperatorLifecycleManagedProcess[],
): BwsOperatorLifecycleManagedProcess {
  const apiProcess = processes.find((entry) => entry.roles.includes('api'));
  if (apiProcess === undefined) {
    throw new Error('Managed lifecycle descriptors must include an API process.');
  }
  return apiProcess;
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

function resolveLifecyclePaths(
  repositoryRoot: string,
  runtimeStateDirectory: string,
): BwsOperatorLifecyclePaths {
  const stateDirectory = resolve(repositoryRoot, runtimeStateDirectory);
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
  if (parsed.service !== 'full_stack') {
    throw new Error(`Unexpected lifecycle service in ${stateFilePath}.`);
  }
  if (!Array.isArray(parsed.processes) || parsed.processes.length === 0) {
    throw new Error(`Lifecycle state must record at least one managed process in ${stateFilePath}.`);
  }
  return parsed as BwsOperatorLifecycleManagedServiceState;
}

function generateFallbackRuntimeId(command: string, generatedAt: string): string {
  return `${command}-${generatedAt}-${process.pid}`;
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

async function waitForManagedProcessPresence(
  pid: number,
  command: readonly string[],
  repositoryRoot: string,
  lifecycleToken: string,
  timeoutMs: number,
): Promise<BwsProcessSnapshot> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const snapshot = readVerifiedProcessSnapshotFromRuntime(pid, command, repositoryRoot, lifecycleToken);
    if (snapshot !== 'missing') {
      return snapshot;
    }
    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for managed process ${pid} to become observable.`);
}

async function waitForManagedApiObservable(
  pid: number,
  command: readonly string[],
  repositoryRoot: string,
  lifecycleToken: string,
  config: BwsServiceRuntimeConfig,
  timeoutMs: number,
): Promise<BwsProcessSnapshot> {
  const start = Date.now();
  let lastHealth: BwsOperatorLifecycleCommandResult['health'] | undefined;
  let lastReadiness: BwsOperatorLifecycleCommandResult['readiness'] | undefined;
  while (Date.now() - start <= timeoutMs) {
    const snapshot = readVerifiedProcessSnapshotFromRuntime(pid, command, repositoryRoot, lifecycleToken);
    if (snapshot !== 'missing') {
      lastHealth = await fetchProbe(`http://${config.api.bindHost}:${config.api.port}/health`, DEFAULT_POLL_INTERVAL_MS);
      lastReadiness = await fetchProbe(`http://${config.api.bindHost}:${config.api.port}/readiness`, DEFAULT_POLL_INTERVAL_MS);
      if (probeIsSuccessful(lastHealth)) {
        return snapshot;
      }
    }
    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }
  throw new Error(
    [
      `Timed out waiting for managed BWS API health on pid ${pid}.`,
      `last_health=${formatProbeForError(lastHealth)}`,
      `last_readiness=${formatProbeForError(lastReadiness)}`,
    ].join(' '),
  );
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
  throw new Error(`Timed out waiting for managed pid ${pid} to exit after SIGTERM.`);
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

function probeIsSuccessful(
  probe: BwsOperatorLifecycleCommandResult['health'] | BwsOperatorLifecycleCommandResult['readiness'],
): probe is BwsOperatorLifecycleProbeResult {
  return 'ok' in probe && probe.ok && probe.statusCode === 200;
}

function formatProbeForError(
  probe: BwsOperatorLifecycleCommandResult['health'] | BwsOperatorLifecycleCommandResult['readiness'] | undefined,
): string {
  if (probe === undefined) {
    return 'not_attempted';
  }
  if ('error' in probe) {
    return `error:${sanitizeProbeErrorField(probe.error)}`;
  }
  const body = sanitizeProbeErrorField(JSON.stringify(probe.body));
  return `status:${String(probe.statusCode)} ok:${String(probe.ok)} body:${body}`;
}

function sanitizeProbeErrorField(value: string): string {
  return value
    .replace(/password[^,}\s]*/gi, 'password=[redacted]')
    .replace(/secret[^,}\s]*/gi, 'secret=[redacted]')
    .slice(0, 500);
}

function cockpitProbeIsReady(
  probe: BwsOperatorLifecycleCommandResult['readiness'],
): boolean {
  if (!probeIsSuccessful(probe)) {
    return false;
  }
  if (probe.body === null || typeof probe.body !== 'object' || Array.isArray(probe.body)) {
    return false;
  }
  const readinessBody = 'readiness' in probe.body ? probe.body.readiness : undefined;
  if (readinessBody === null || typeof readinessBody !== 'object' || Array.isArray(readinessBody)) {
    return false;
  }
  const components = 'components' in readinessBody ? readinessBody.components : undefined;
  if (components === null || typeof components !== 'object' || Array.isArray(components)) {
    return true;
  }
  return 'cockpit' in components ? components.cockpit === 'ready' : true;
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

function fail(message: string): never {
  throw new Error(message);
}
