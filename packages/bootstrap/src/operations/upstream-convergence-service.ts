import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { setTimeout as sleepFor } from 'node:timers/promises';
import {
  BWS_UPSTREAM_MODE_ENV,
  resolveBwsUpstreamExportConvergenceConfig,
  runBwsUpstreamExportConvergencePass,
  type BwsUpstreamExportConvergenceConfig,
  type BwsUpstreamExportConvergenceEnvironment,
  type BwsUpstreamExportConvergencePassResult,
} from './upstream-export-convergence.js';
import {
  resolveBwsUpstreamApiConvergenceConfig,
  runBwsUpstreamApiConvergencePass,
  type BwsUpstreamApiConvergenceConfig,
  type BwsUpstreamApiConvergenceEnvironment,
  type BwsUpstreamApiConvergencePassResult,
} from './upstream-api-convergence.js';
import { type BoundaryResult, type Blocker } from '../contracts/local-types.js';
import {
  BWS_OBSERVABILITY_RUNTIME_ID_ENV,
  createBwsStructuredLogger,
  createBwsStructuredProcessIdentity,
  registerBwsEvidenceArtifact,
} from './observability.js';

const BWS_UPSTREAM_CONVERGENCE_SERVICE_STATE_SCHEMA = 'bws.upstream_convergence_service_state.v1';
const BWS_UPSTREAM_CONVERGENCE_SERVICE_EVIDENCE_SCHEMA = 'bws.upstream_convergence_service_evidence.v1';
const DEFAULT_RUNTIME_STATE_DIRECTORY = 'runtime/bws-upstream-convergence-service';
const DEFAULT_SLEEP_SLICE_MS = 50;
const PROCESS_SIGNAL_ZERO: NodeJS.Signals | 0 = 0;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;

export const BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS_ENV = 'BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS';
export const BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS_ENV = 'BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS';
export const BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS_ENV = 'BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS';
export const BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS_ENV = 'BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS';

type BwsUpstreamConvergenceMode = 'api' | 'export';
type BwsSignal = 'SIGINT' | 'SIGTERM';
type ServiceLifecycleState = 'running' | 'stopped';
type PassOutcome = 'blocked' | 'failure' | 'no_change' | 'success';
type ServiceEvidenceEvent =
  | 'pass_completed'
  | 'service_started'
  | 'service_status'
  | 'service_stopped';

type SelectedPassConfig =
  | Readonly<{
      readonly mode: 'api';
      readonly passConfig: BwsUpstreamApiConvergenceConfig;
    }>
  | Readonly<{
      readonly mode: 'export';
      readonly passConfig: BwsUpstreamExportConvergenceConfig;
    }>;

type ConvergencePassResult = BwsUpstreamApiConvergencePassResult | BwsUpstreamExportConvergencePassResult;

type RedactedModeConfiguration =
  | Readonly<{
      readonly apiBaseUrl: string;
      readonly checkpointId: string;
      readonly contractVersion: string;
      readonly maxPagesPerResource: number;
      readonly mode: 'api';
      readonly pageSize: number;
      readonly retryBackoffMs: number;
      readonly retryLimit: number;
      readonly timeoutMs: number;
    }>
  | Readonly<{
      readonly checkpointId: string;
      readonly contractAlias: 'betting-win-strategy-export.v1';
      readonly contractSchema: 'betting-win.strategy-export.v1';
      readonly manifestPath: string;
      readonly manifestSha256: string;
      readonly mode: 'export';
      readonly selectionCount: number;
      readonly surebetProfile: 'surebet_standard_binary_v0';
    }>;

export interface BwsUpstreamConvergenceServiceEnvironment
  extends BwsUpstreamApiConvergenceEnvironment, BwsUpstreamExportConvergenceEnvironment {
  readonly BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS?: string;
  readonly BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS?: string;
  readonly BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS?: string;
  readonly BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS?: string;
}

export interface BwsUpstreamConvergenceManagedProcess {
  readonly command: readonly string[];
  readonly commandCwd: string;
  readonly entryPointPath: string;
  readonly pid: number;
  readonly procStartTicks: string;
  readonly processName: 'bws-upstream-convergence-service';
  readonly startedAt: string;
}

export interface BwsUpstreamConvergenceServiceConfig {
  readonly intervalMs: number;
  readonly maxRetryBackoffMs: number;
  readonly mode: BwsUpstreamConvergenceMode;
  readonly passConfig: BwsUpstreamApiConvergenceConfig | BwsUpstreamExportConvergenceConfig;
  readonly passTimeoutMs: number;
  readonly repositoryRoot: string;
  readonly retryBackoffMs: number;
}

export interface RedactedBwsUpstreamConvergenceServiceConfig {
  readonly intervalMs: number;
  readonly maxRetryBackoffMs: number;
  readonly mode: BwsUpstreamConvergenceMode;
  readonly modeConfiguration: RedactedModeConfiguration;
  readonly passTimeoutMs: number;
  readonly repositoryRoot: string;
  readonly retryBackoffMs: number;
  readonly upstream: Readonly<{
    readonly commitSha: string;
    readonly contractAlias: string;
    readonly contractSchema: string;
    readonly gitTreeSha: string;
    readonly lockPath: string;
    readonly repository: string;
    readonly repositoryPath: string;
    readonly sourceView: string;
    readonly surebetProfile: string;
    readonly trackedTreeListingSha256: string;
    readonly verifiedAt: string;
  }>;
}

export interface BwsUpstreamConvergenceServiceSourceFingerprints {
  readonly packageVersion: string;
  readonly sourceManifestGeneratedAt: string;
  readonly sourceManifestOverlay: string;
  readonly sourceManifestSha256: string;
  readonly upstreamCommitSha: string;
  readonly upstreamGitTreeSha: string;
  readonly upstreamTrackedTreeListingSha256: string;
}

export interface BwsUpstreamConvergenceServiceCounters {
  readonly blockerCount: number;
  readonly consecutiveNonSuccessCount: number;
  readonly failureCount: number;
  readonly noChangeCount: number;
  readonly successCount: number;
  readonly totalPassCount: number;
}

export interface BwsUpstreamConvergenceServiceLastPass {
  readonly blockerCodes: readonly string[];
  readonly completedAt: string;
  readonly durationMs: number;
  readonly errorMessage?: string;
  readonly mode: BwsUpstreamConvergenceMode;
  readonly outcome: PassOutcome;
  readonly passNumber: number;
  readonly processedCount: number;
  readonly startedAt: string;
  readonly summary: string;
  readonly timedOut: boolean;
}

export interface BwsUpstreamConvergenceServiceRuntimeState {
  readonly counters: BwsUpstreamConvergenceServiceCounters;
  readonly lastPass?: BwsUpstreamConvergenceServiceLastPass;
  readonly lastSignal?: BwsSignal;
  readonly lifecycleState: ServiceLifecycleState;
  readonly nextAttemptAt?: string;
  readonly updatedAt: string;
}

export interface BwsUpstreamConvergenceManagedServiceState {
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsUpstreamConvergenceServiceConfig;
  readonly process: BwsUpstreamConvergenceManagedProcess;
  readonly repositoryRoot: string;
  readonly runtimeId: string;
  readonly runtime: BwsUpstreamConvergenceServiceRuntimeState;
  readonly schema: typeof BWS_UPSTREAM_CONVERGENCE_SERVICE_STATE_SCHEMA;
  readonly service: 'upstream_convergence';
  readonly sourceFingerprints: BwsUpstreamConvergenceServiceSourceFingerprints;
  readonly stateRecordedAt: string;
}

export interface BwsUpstreamConvergenceServiceCommandResult {
  readonly command: 'run' | 'status';
  readonly configuration: RedactedBwsUpstreamConvergenceServiceConfig;
  readonly counters: BwsUpstreamConvergenceServiceCounters;
  readonly evidenceFile: string;
  readonly generatedAt: string;
  readonly lastPass?: BwsUpstreamConvergenceServiceLastPass;
  readonly lastSignal?: BwsSignal;
  readonly lifecycleState: ServiceLifecycleState;
  readonly mode: BwsUpstreamConvergenceMode;
  readonly nextAttemptAt?: string;
  readonly outcome:
    | 'already_running'
    | 'max_passes_reached'
    | 'not_running'
    | 'running'
    | 'signal_stopped'
    | 'stale_state';
  readonly process:
    | BwsUpstreamConvergenceManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>;
  readonly runtimeId: string;
  readonly service: 'upstream_convergence';
  readonly sourceFingerprints: BwsUpstreamConvergenceServiceSourceFingerprints;
  readonly stateFile: string;
}

interface BwsUpstreamConvergenceEvidenceRecord extends BwsUpstreamConvergenceServiceCommandResult {
  readonly event: ServiceEvidenceEvent;
  readonly repositoryRoot: string;
  readonly schema: typeof BWS_UPSTREAM_CONVERGENCE_SERVICE_EVIDENCE_SCHEMA;
}

interface BwsUpstreamConvergenceServicePaths {
  readonly evidenceDirectory: string;
  readonly repositoryRoot: string;
  readonly stateDirectory: string;
  readonly stateFilePath: string;
}

export interface BwsUpstreamConvergenceSignalRegistrar {
  register(signal: BwsSignal, handler: () => void): () => void;
}

export interface BwsUpstreamConvergenceProcessRuntime {
  createProcessRecord(input: Readonly<{
    readonly commandCwd: string;
    readonly entryPointPath: string;
    readonly processName: 'bws-upstream-convergence-service';
    readonly startedAt: string;
  }>): BwsUpstreamConvergenceManagedProcess;
  inspectProcess(processRecord: BwsUpstreamConvergenceManagedProcess): 'missing' | 'running';
}

export interface RunBwsUpstreamConvergenceServiceRequest {
  readonly config?: BwsUpstreamConvergenceServiceConfig;
  readonly environment?: BwsUpstreamConvergenceServiceEnvironment;
  readonly maxPasses?: number;
  readonly now?: () => string;
  readonly processRuntime?: BwsUpstreamConvergenceProcessRuntime;
  readonly repositoryRoot?: string;
  readonly runApiPass?: (
    request: Readonly<{ readonly config: BwsUpstreamApiConvergenceConfig }>,
  ) => Promise<BoundaryResult<BwsUpstreamApiConvergencePassResult>>;
  readonly runExportPass?: (
    request: Readonly<{ readonly config: BwsUpstreamExportConvergenceConfig }>,
  ) => BoundaryResult<BwsUpstreamExportConvergencePassResult> | Promise<BoundaryResult<BwsUpstreamExportConvergencePassResult>>;
  readonly runtimeStateDirectory?: string;
  readonly signalRegistrar?: BwsUpstreamConvergenceSignalRegistrar;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export interface GetBwsUpstreamConvergenceServiceStatusRequest {
  readonly config?: BwsUpstreamConvergenceServiceConfig;
  readonly environment?: BwsUpstreamConvergenceServiceEnvironment;
  readonly now?: () => string;
  readonly processRuntime?: BwsUpstreamConvergenceProcessRuntime;
  readonly repositoryRoot?: string;
  readonly runtimeStateDirectory?: string;
}

export function resolveBwsUpstreamConvergenceServiceConfig(
  environment: BwsUpstreamConvergenceServiceEnvironment = process.env as BwsUpstreamConvergenceServiceEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsUpstreamConvergenceServiceConfig {
  const resolvedRepositoryRoot = realpathSync(repositoryRoot);
  const mode = requireMode(environment[BWS_UPSTREAM_MODE_ENV]);
  const intervalMs = requirePositiveInteger(
    environment[BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS_ENV],
    BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS_ENV,
  );
  const retryBackoffMs = requirePositiveInteger(
    environment[BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS_ENV],
    BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS_ENV,
  );
  const maxRetryBackoffMs = requirePositiveInteger(
    environment[BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS_ENV],
    BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS_ENV,
  );
  const passTimeoutMs = requirePositiveInteger(
    environment[BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS_ENV],
    BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS_ENV,
  );
  if (retryBackoffMs > maxRetryBackoffMs) {
    throw new Error(
      `${BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS_ENV} must not exceed ${BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS_ENV}.`,
    );
  }
  const selectedConfig: SelectedPassConfig = mode === 'api'
    ? Object.freeze({
      mode,
      passConfig: resolveBwsUpstreamApiConvergenceConfig(environment, resolvedRepositoryRoot),
    })
    : Object.freeze({
      mode,
      passConfig: resolveBwsUpstreamExportConvergenceConfig(environment, resolvedRepositoryRoot),
    });
  return Object.freeze({
    intervalMs,
    maxRetryBackoffMs,
    mode: selectedConfig.mode,
    passConfig: selectedConfig.passConfig,
    passTimeoutMs,
    repositoryRoot: resolvedRepositoryRoot,
    retryBackoffMs,
  });
}

export async function runBwsUpstreamConvergenceService(
  request: RunBwsUpstreamConvergenceServiceRequest = {},
): Promise<BwsUpstreamConvergenceServiceCommandResult> {
  const context = createContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const existingState = readServiceState(context.paths.stateFilePath);
  if (existingState !== undefined) {
    assertStateMatchesRepository(existingState, context.paths.repositoryRoot);
    assertConfigFingerprintMatches(existingState, context.configFingerprint);
    if (context.processRuntime.inspectProcess(existingState.process) === 'running') {
      throw new Error('BWS upstream convergence service is already running for this repository and configuration.');
    }
  }

  const startedAt = context.now();
  const currentProcess = context.processRuntime.createProcessRecord({
    commandCwd: context.paths.repositoryRoot,
    entryPointPath: resolve(
      context.paths.repositoryRoot,
      'dist/packages/bootstrap/src/cli/bws-upstream-convergence-service.js',
    ),
    processName: 'bws-upstream-convergence-service',
    startedAt,
  });
  let state = buildRunningState(context, currentProcess, existingState, startedAt);
  writeServiceState(context.paths.stateFilePath, state);
  writeEvidence(
    context,
    'service_started',
    createCommandResult(context, state, 'run', 'running', currentProcess),
  );

  let shutdownSignal: BwsSignal | undefined;
  const signalDisposers: Array<() => void> = [];
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    signalDisposers.push(context.signalRegistrar.register(signal, () => {
      shutdownSignal = signal;
    }));
  }

  try {
    for (;;) {
      if (shutdownSignal !== undefined) {
        break;
      }
      if (context.maxPasses !== undefined && state.runtime.counters.totalPassCount >= context.maxPasses) {
        state = finalizeState(context, state, context.now(), undefined);
        writeServiceState(context.paths.stateFilePath, state);
        const result = createCommandResult(context, state, 'run', 'max_passes_reached', currentProcess);
        writeEvidence(context, 'service_stopped', result);
        return result;
      }

      const passStartedAt = context.now();
      const passNumber = state.runtime.counters.totalPassCount + 1;
      state = updateStateForPassStart(state, passStartedAt);
      writeServiceState(context.paths.stateFilePath, state);

      const passExecutionStartedAt = Date.now();
      const rawPassPromise = executePass(context);
      const timeoutResult = await raceWithTimeout(rawPassPromise, context.config.passTimeoutMs);
      const settledPassResult = timeoutResult.timedOut ? await rawPassPromise : timeoutResult.result;
      const passCompletedAt = context.now();
      const passOutcome = classifyPassResult(context.config.mode, settledPassResult, timeoutResult.timedOut);
      const nextDelayMs = resolveNextDelayMilliseconds(context.config, passOutcome.outcome, state.runtime.counters);
      const nextAttemptAt = shutdownSignal === undefined
        ? toIsoTimestamp(Date.now() + nextDelayMs)
        : undefined;

      state = updateStateForPassCompletion(
        state,
        Object.freeze({
          completedAt: passCompletedAt,
          durationMs: Math.max(0, Date.now() - passExecutionStartedAt),
          ...(shutdownSignal === undefined ? {} : { lastSignal: shutdownSignal }),
          ...(nextAttemptAt === undefined ? {} : { nextAttemptAt }),
          pass: Object.freeze({
            blockerCodes: passOutcome.blockerCodes,
            ...(passOutcome.errorMessage === undefined ? {} : { errorMessage: passOutcome.errorMessage }),
            mode: context.config.mode,
            outcome: passOutcome.outcome,
            passNumber,
            processedCount: passOutcome.processedCount,
            startedAt: passStartedAt,
            summary: passOutcome.summary,
            timedOut: timeoutResult.timedOut,
          }),
        }),
      );
      writeServiceState(context.paths.stateFilePath, state);
      writeEvidence(
        context,
        'pass_completed',
        createCommandResult(context, state, 'run', 'running', currentProcess),
      );

      if (shutdownSignal !== undefined) {
        break;
      }
      await sleepInterruptibly(nextDelayMs, context.sleep, () => shutdownSignal !== undefined);
    }

    const stoppedAt = context.now();
    state = finalizeState(context, state, stoppedAt, shutdownSignal);
    writeServiceState(context.paths.stateFilePath, state);
    const result = createCommandResult(context, state, 'run', 'signal_stopped', currentProcess);
    writeEvidence(context, 'service_stopped', result);
    return result;
  } finally {
    for (const dispose of signalDisposers) {
      dispose();
    }
  }
}

export function getBwsUpstreamConvergenceServiceStatus(
  request: GetBwsUpstreamConvergenceServiceStatusRequest = {},
): BwsUpstreamConvergenceServiceCommandResult {
  const context = createContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const currentState = readServiceState(context.paths.stateFilePath);
  if (currentState === undefined) {
    const result = createMissingStateStatusResult(context);
    writeEvidence(context, 'service_status', result);
    return result;
  }

  assertStateMatchesRepository(currentState, context.paths.repositoryRoot);
  assertConfigFingerprintMatches(currentState, context.configFingerprint);
  const processOwnership = context.processRuntime.inspectProcess(currentState.process);
  const result = createCommandResult(
    context,
    currentState,
    'status',
    processOwnership === 'running' ? 'running' : 'stale_state',
    processOwnership === 'running' ? currentState.process : Object.freeze({ ownership: 'missing' }),
  );
  writeEvidence(context, 'service_status', result);
  return result;
}

function createContext(
  request: Pick<
    RunBwsUpstreamConvergenceServiceRequest,
    | 'config'
    | 'environment'
    | 'maxPasses'
    | 'now'
    | 'processRuntime'
    | 'repositoryRoot'
    | 'runApiPass'
    | 'runExportPass'
    | 'runtimeStateDirectory'
    | 'signalRegistrar'
    | 'sleep'
  >,
): Readonly<{
  readonly config: BwsUpstreamConvergenceServiceConfig;
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsUpstreamConvergenceServiceConfig;
  readonly maxPasses?: number;
  readonly now: () => string;
  readonly paths: BwsUpstreamConvergenceServicePaths;
  readonly processRuntime: BwsUpstreamConvergenceProcessRuntime;
  readonly runApiPass: (
    request: Readonly<{ readonly config: BwsUpstreamApiConvergenceConfig }>,
  ) => Promise<BoundaryResult<BwsUpstreamApiConvergencePassResult>>;
  readonly runExportPass: (
    request: Readonly<{ readonly config: BwsUpstreamExportConvergenceConfig }>,
  ) => Promise<BoundaryResult<BwsUpstreamExportConvergencePassResult>>;
  readonly runtimeId: string;
  readonly signalRegistrar: BwsUpstreamConvergenceSignalRegistrar;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly sourceFingerprints: BwsUpstreamConvergenceServiceSourceFingerprints;
}> {
  const repositoryRoot = realpathSync(request.repositoryRoot ?? process.cwd());
  const config = request.config ?? resolveBwsUpstreamConvergenceServiceConfig(request.environment, repositoryRoot);
  const paths = resolvePaths(repositoryRoot, request.runtimeStateDirectory ?? DEFAULT_RUNTIME_STATE_DIRECTORY);
  const configuration = redactBwsUpstreamConvergenceServiceConfig(config);
  const configFingerprint = sha256String(JSON.stringify(configuration));
  return Object.freeze({
    config,
    configFingerprint,
    configuration,
    ...(request.maxPasses === undefined ? {} : { maxPasses: request.maxPasses }),
    now: request.now ?? defaultNow,
    paths,
    processRuntime: request.processRuntime ?? createDefaultProcessRuntime(),
    runApiPass: request.runApiPass ?? ((runRequest) => runBwsUpstreamApiConvergencePass(runRequest)),
    runExportPass: async (runRequest) =>
      await Promise.resolve(request.runExportPass?.(runRequest) ?? runBwsUpstreamExportConvergencePass(runRequest)),
    runtimeId: resolveRuntimeId(),
    signalRegistrar: request.signalRegistrar ?? createDefaultSignalRegistrar(),
    sleep: request.sleep ?? defaultSleep,
    sourceFingerprints: collectSourceFingerprints(repositoryRoot, config),
  });
}

async function executePass(
  context: ReturnType<typeof createContext>,
): Promise<BoundaryResult<ConvergencePassResult>> {
  if (context.config.mode === 'api') {
    return await context.runApiPass({
      config: context.config.passConfig as BwsUpstreamApiConvergenceConfig,
    });
  }
  return await context.runExportPass({
    config: context.config.passConfig as BwsUpstreamExportConvergenceConfig,
  });
}

async function raceWithTimeout(
  passPromise: Promise<BoundaryResult<ConvergencePassResult>>,
  timeoutMs: number,
): Promise<Readonly<{
  readonly result: BoundaryResult<ConvergencePassResult>;
  readonly timedOut: boolean;
}>> {
  const timeoutSentinel = Symbol('timeout');
  const timed = await Promise.race([
    passPromise,
    sleepFor(timeoutMs, timeoutSentinel),
  ]);
  if (timed === timeoutSentinel) {
    return Object.freeze({
      result: await passPromise,
      timedOut: true,
    });
  }
  return Object.freeze({
    result: timed,
    timedOut: false,
  });
}

function classifyPassResult(
  mode: BwsUpstreamConvergenceMode,
  result: BoundaryResult<ConvergencePassResult>,
  timedOut: boolean,
): Readonly<{
  readonly blockerCodes: readonly string[];
  readonly errorMessage?: string | undefined;
  readonly outcome: PassOutcome;
  readonly processedCount: number;
  readonly summary: string;
}> {
  if (timedOut) {
    return Object.freeze({
      blockerCodes: Object.freeze([]),
      errorMessage: `BWS upstream convergence pass exceeded ${BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS_ENV}.`,
      outcome: 'failure',
      processedCount: 0,
      summary: `The ${mode} convergence pass exceeded the configured timeout and is recorded as a failure.`,
    });
  }
  if (!result.ok) {
    return Object.freeze({
      blockerCodes: Object.freeze(result.blockers.map((entry) => entry.code)),
      outcome: 'blocked',
      processedCount: 0,
      summary: summarizeBlockers(result.blockers),
    });
  }
  const processedCount = result.value.processedCount;
  if (processedCount === 0) {
    return Object.freeze({
      blockerCodes: Object.freeze([]),
      outcome: 'no_change',
      processedCount,
      summary: summarizeSuccessfulPass(mode, result.value, 'no_change'),
    });
  }
  return Object.freeze({
    blockerCodes: Object.freeze([]),
    outcome: 'success',
    processedCount,
    summary: summarizeSuccessfulPass(mode, result.value, 'success'),
  });
}

function summarizeSuccessfulPass(
  mode: BwsUpstreamConvergenceMode,
  result: ConvergencePassResult,
  outcome: 'no_change' | 'success',
): string {
  if (mode === 'api') {
    const apiResult = result as BwsUpstreamApiConvergencePassResult;
    return outcome === 'success'
      ? `API convergence processed ${apiResult.processedCount} records on ${apiResult.resource} page ${apiResult.pageNumber}.`
      : `API convergence recorded no change on ${apiResult.resource} page ${apiResult.pageNumber}.`;
  }
  const exportResult = result as BwsUpstreamExportConvergencePassResult;
  return outcome === 'success'
    ? `Export convergence processed selection ${exportResult.processedSelectionCursor ?? exportResult.nextSelectionIndex}.`
    : `Export convergence observed no new immutable export selections.`;
}

function summarizeBlockers(blockers: readonly Blocker[]): string {
  return blockers.map((entry) => `${entry.code}: ${entry.message}`).join(' ');
}

function resolveNextDelayMilliseconds(
  config: BwsUpstreamConvergenceServiceConfig,
  outcome: PassOutcome,
  counters: BwsUpstreamConvergenceServiceCounters,
): number {
  if (outcome === 'success' || outcome === 'no_change') {
    return config.intervalMs;
  }
  const consecutiveAttempt = counters.consecutiveNonSuccessCount + 1;
  const computed = config.retryBackoffMs * (2 ** Math.max(0, consecutiveAttempt - 1));
  return Math.min(config.maxRetryBackoffMs, computed);
}

function updateStateForPassStart(
  state: BwsUpstreamConvergenceManagedServiceState,
  updatedAt: string,
): BwsUpstreamConvergenceManagedServiceState {
  const { nextAttemptAt: _nextAttemptAt, ...runtimeWithoutNextAttempt } = state.runtime;
  return Object.freeze({
    ...state,
    runtime: Object.freeze({
      ...runtimeWithoutNextAttempt,
      lifecycleState: 'running',
      updatedAt,
    }),
    stateRecordedAt: updatedAt,
  });
}

function updateStateForPassCompletion(
  state: BwsUpstreamConvergenceManagedServiceState,
  update: Readonly<{
    readonly completedAt: string;
    readonly durationMs: number;
    readonly lastSignal?: BwsSignal;
    readonly nextAttemptAt?: string;
    readonly pass: Readonly<{
      readonly blockerCodes: readonly string[];
      readonly errorMessage?: string;
      readonly mode: BwsUpstreamConvergenceMode;
      readonly outcome: PassOutcome;
      readonly passNumber: number;
      readonly processedCount: number;
      readonly startedAt: string;
      readonly summary: string;
      readonly timedOut: boolean;
    }>;
  }>,
): BwsUpstreamConvergenceManagedServiceState {
  const counters = nextCounters(state.runtime.counters, update.pass.outcome);
  const runtime: BwsUpstreamConvergenceServiceRuntimeState = Object.freeze({
    counters,
    lastPass: Object.freeze({
      blockerCodes: update.pass.blockerCodes,
      completedAt: update.completedAt,
      durationMs: update.durationMs,
      ...(update.pass.errorMessage === undefined ? {} : { errorMessage: update.pass.errorMessage }),
      mode: update.pass.mode,
      outcome: update.pass.outcome,
      passNumber: update.pass.passNumber,
      processedCount: update.pass.processedCount,
      startedAt: update.pass.startedAt,
      summary: update.pass.summary,
      timedOut: update.pass.timedOut,
    }),
    ...(update.lastSignal === undefined ? {} : { lastSignal: update.lastSignal }),
    lifecycleState: 'running',
    ...(update.nextAttemptAt === undefined ? {} : { nextAttemptAt: update.nextAttemptAt }),
    updatedAt: update.completedAt,
  });
  return Object.freeze({
    ...state,
    runtime,
    stateRecordedAt: update.completedAt,
  });
}

function finalizeState(
  context: ReturnType<typeof createContext>,
  state: BwsUpstreamConvergenceManagedServiceState,
  updatedAt: string,
  signal: BwsSignal | undefined,
): BwsUpstreamConvergenceManagedServiceState {
  void context;
  const { nextAttemptAt: _nextAttemptAt, ...runtimeWithoutNextAttempt } = state.runtime;
  return Object.freeze({
    ...state,
    runtime: Object.freeze({
      ...runtimeWithoutNextAttempt,
      ...(signal === undefined ? {} : { lastSignal: signal }),
      lifecycleState: 'stopped',
      updatedAt,
    }),
    stateRecordedAt: updatedAt,
  });
}

function nextCounters(
  counters: BwsUpstreamConvergenceServiceCounters,
  outcome: PassOutcome,
): BwsUpstreamConvergenceServiceCounters {
  return Object.freeze({
    blockerCount: counters.blockerCount + (outcome === 'blocked' ? 1 : 0),
    consecutiveNonSuccessCount: outcome === 'success' || outcome === 'no_change'
      ? 0
      : counters.consecutiveNonSuccessCount + 1,
    failureCount: counters.failureCount + (outcome === 'failure' ? 1 : 0),
    noChangeCount: counters.noChangeCount + (outcome === 'no_change' ? 1 : 0),
    successCount: counters.successCount + (outcome === 'success' ? 1 : 0),
    totalPassCount: counters.totalPassCount + 1,
  });
}

function buildRunningState(
  context: ReturnType<typeof createContext>,
  process: BwsUpstreamConvergenceManagedProcess,
  existingState: BwsUpstreamConvergenceManagedServiceState | undefined,
  startedAt: string,
): BwsUpstreamConvergenceManagedServiceState {
  const runtime = existingState?.runtime;
  return Object.freeze({
    configFingerprint: context.configFingerprint,
    configuration: context.configuration,
    process,
    repositoryRoot: context.paths.repositoryRoot,
    runtimeId: context.runtimeId,
    runtime: Object.freeze({
      counters: runtime?.counters ?? emptyCounters(),
      ...(runtime?.lastPass === undefined ? {} : { lastPass: runtime.lastPass }),
      ...(runtime?.lastSignal === undefined ? {} : { lastSignal: runtime.lastSignal }),
      lifecycleState: 'running',
      updatedAt: startedAt,
    }),
    schema: BWS_UPSTREAM_CONVERGENCE_SERVICE_STATE_SCHEMA,
    service: 'upstream_convergence',
    sourceFingerprints: context.sourceFingerprints,
    stateRecordedAt: startedAt,
  });
}

function createCommandResult(
  context: ReturnType<typeof createContext>,
  state: BwsUpstreamConvergenceManagedServiceState,
  command: 'run' | 'status',
  outcome: BwsUpstreamConvergenceServiceCommandResult['outcome'],
  process:
    | BwsUpstreamConvergenceManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>,
): BwsUpstreamConvergenceServiceCommandResult {
  const generatedAt = context.now();
  return Object.freeze({
    command,
    configuration: context.configuration,
    counters: state.runtime.counters,
    evidenceFile: relative(
      context.paths.repositoryRoot,
      resolveEvidenceFilePath(context.paths, generatedAt, command, outcome),
    ),
    generatedAt,
    ...(state.runtime.lastPass === undefined ? {} : { lastPass: state.runtime.lastPass }),
    ...(state.runtime.lastSignal === undefined ? {} : { lastSignal: state.runtime.lastSignal }),
    lifecycleState: state.runtime.lifecycleState,
    mode: context.config.mode,
    ...(state.runtime.nextAttemptAt === undefined ? {} : { nextAttemptAt: state.runtime.nextAttemptAt }),
    outcome,
    process,
    runtimeId: state.runtimeId,
    service: 'upstream_convergence',
    sourceFingerprints: context.sourceFingerprints,
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
  });
}

function createMissingStateStatusResult(
  context: ReturnType<typeof createContext>,
): BwsUpstreamConvergenceServiceCommandResult {
  const generatedAt = context.now();
  return Object.freeze({
    command: 'status',
    configuration: context.configuration,
    counters: emptyCounters(),
    evidenceFile: relative(
      context.paths.repositoryRoot,
      resolveEvidenceFilePath(context.paths, generatedAt, 'status', 'not_running'),
    ),
    generatedAt,
    lifecycleState: 'stopped',
    mode: context.config.mode,
    outcome: 'not_running',
    process: Object.freeze({ ownership: 'missing' }),
    runtimeId: context.runtimeId,
    service: 'upstream_convergence',
    sourceFingerprints: context.sourceFingerprints,
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
  });
}

function writeEvidence(
  context: ReturnType<typeof createContext>,
  event: ServiceEvidenceEvent,
  result: BwsUpstreamConvergenceServiceCommandResult,
): void {
  const filePath = resolve(context.paths.repositoryRoot, result.evidenceFile);
  writeEvidenceRecord(filePath, {
    ...result,
    event,
    repositoryRoot: context.paths.repositoryRoot,
    schema: BWS_UPSTREAM_CONVERGENCE_SERVICE_EVIDENCE_SCHEMA,
  });
  registerBwsEvidenceArtifact({
    artifactPath: filePath,
    artifactSchema: BWS_UPSTREAM_CONVERGENCE_SERVICE_EVIDENCE_SCHEMA,
    createdAt: result.generatedAt,
    repositoryRoot: context.paths.repositoryRoot,
    retentionClass: 'runtime',
    runtimeId: result.runtimeId,
    sourceFingerprint: context.sourceFingerprints.sourceManifestSha256,
  });
  createBwsStructuredLogger({
    processIdentity: createBwsStructuredProcessIdentity('bws-upstream-convergence-service', context.paths.repositoryRoot, result.generatedAt),
    repositoryRoot: context.paths.repositoryRoot,
    runtimeId: result.runtimeId,
    selectedUpstreamMode: context.config.mode,
  }).write({
    details: Object.freeze({
      command: result.command,
      counters: result.counters,
      event,
      lifecycleState: result.lifecycleState,
      mode: result.mode,
      outcome: result.outcome,
    }),
    eventCode: event,
    serviceRole: 'upstream_convergence',
    timestamp: result.generatedAt,
  });
}

function resolvePaths(
  repositoryRoot: string,
  runtimeStateDirectory: string,
): BwsUpstreamConvergenceServicePaths {
  const stateDirectory = resolve(repositoryRoot, runtimeStateDirectory);
  return Object.freeze({
    evidenceDirectory: join(stateDirectory, 'evidence'),
    repositoryRoot,
    stateDirectory,
    stateFilePath: join(stateDirectory, 'state.json'),
  });
}

function readServiceState(
  stateFilePath: string,
): BwsUpstreamConvergenceManagedServiceState | undefined {
  if (!existsSync(stateFilePath)) {
    return undefined;
  }
  const parsed = requireObject(JSON.parse(readFileSync(stateFilePath, 'utf-8')), stateFilePath) as Partial<
    BwsUpstreamConvergenceManagedServiceState
  >;
  if (parsed.schema !== BWS_UPSTREAM_CONVERGENCE_SERVICE_STATE_SCHEMA) {
    throw new Error(`Unexpected upstream convergence service state schema in ${stateFilePath}.`);
  }
  if (parsed.service !== 'upstream_convergence') {
    throw new Error(`Unexpected upstream convergence service type in ${stateFilePath}.`);
  }
  return parsed as BwsUpstreamConvergenceManagedServiceState;
}

function writeServiceState(
  stateFilePath: string,
  state: BwsUpstreamConvergenceManagedServiceState,
): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  const temporaryPath = `${stateFilePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, stateFilePath);
}

function writeEvidenceRecord(
  filePath: string,
  record: BwsUpstreamConvergenceEvidenceRecord,
): void {
  if (existsSync(filePath)) {
    throw new Error(`Upstream convergence service evidence file already exists: ${filePath}`);
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
}

function resolveRuntimeId(): string {
  const candidate = process.env[BWS_OBSERVABILITY_RUNTIME_ID_ENV];
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return `${Date.now()}-${process.pid}-upstream-convergence`;
}

function resolveEvidenceFilePath(
  paths: BwsUpstreamConvergenceServicePaths,
  generatedAt: string,
  command: BwsUpstreamConvergenceServiceCommandResult['command'],
  outcome: BwsUpstreamConvergenceServiceCommandResult['outcome'],
): string {
  const timestamp = generatedAt.replace(/[:.]/g, '').replace(/-/g, '');
  return join(paths.evidenceDirectory, `${timestamp}-${command}-${outcome}.json`);
}

function redactBwsUpstreamConvergenceServiceConfig(
  config: BwsUpstreamConvergenceServiceConfig,
): RedactedBwsUpstreamConvergenceServiceConfig {
  const base = Object.freeze({
    intervalMs: config.intervalMs,
    maxRetryBackoffMs: config.maxRetryBackoffMs,
    mode: config.mode,
    passTimeoutMs: config.passTimeoutMs,
    repositoryRoot: config.repositoryRoot,
    retryBackoffMs: config.retryBackoffMs,
    upstream: Object.freeze({
      commitSha: config.passConfig.upstream.lock.commitSha,
      contractAlias: config.passConfig.upstream.lock.contractAlias,
      contractSchema: config.passConfig.upstream.lock.contractSchema,
      gitTreeSha: config.passConfig.upstream.lock.gitTreeSha,
      lockPath: config.passConfig.upstream.lockPath,
      repository: config.passConfig.upstream.lock.repository,
      repositoryPath: config.passConfig.upstream.lock.repositoryPath,
      sourceView: config.passConfig.upstream.lock.sourceView,
      surebetProfile: config.passConfig.upstream.lock.surebetProfile,
      trackedTreeListingSha256: config.passConfig.upstream.lock.trackedTreeListingSha256,
      verifiedAt: config.passConfig.upstream.lock.verifiedAt,
    }),
  });
  if (config.mode === 'api') {
    const apiConfig = config.passConfig as BwsUpstreamApiConvergenceConfig;
    return Object.freeze({
      ...base,
      modeConfiguration: Object.freeze({
        apiBaseUrl: apiConfig.query.baseUrl,
        checkpointId: apiConfig.checkpointId,
        contractVersion: apiConfig.query.contractVersion,
        maxPagesPerResource: apiConfig.query.maxPagesPerResource,
        mode: 'api',
        pageSize: apiConfig.query.pageSize,
        retryBackoffMs: apiConfig.query.retryBackoffMs,
        retryLimit: apiConfig.query.retryLimit,
        timeoutMs: apiConfig.query.timeoutMs,
      }),
    });
  }
  const exportConfig = config.passConfig as BwsUpstreamExportConvergenceConfig;
  return Object.freeze({
    ...base,
    modeConfiguration: Object.freeze({
      checkpointId: exportConfig.selection.checkpointId,
      contractAlias: exportConfig.selection.contractAlias,
      contractSchema: exportConfig.selection.contractSchema,
      manifestPath: exportConfig.selection.manifestPath,
      manifestSha256: exportConfig.selection.manifestSha256,
      mode: 'export',
      selectionCount: exportConfig.selection.entries.length,
      surebetProfile: exportConfig.selection.surebetProfile,
    }),
  });
}

function collectSourceFingerprints(
  repositoryRoot: string,
  config: BwsUpstreamConvergenceServiceConfig,
): BwsUpstreamConvergenceServiceSourceFingerprints {
  const packageJsonPath = join(repositoryRoot, 'package.json');
  const sourceManifestPath = join(repositoryRoot, 'SOURCE_MANIFEST.json');
  const packageJson = requireObject(JSON.parse(readFileSync(packageJsonPath, 'utf-8')), 'package.json') as {
    readonly version?: unknown;
  };
  const sourceManifestContents = readFileSync(sourceManifestPath, 'utf-8');
  const sourceManifest = requireObject(JSON.parse(sourceManifestContents), 'SOURCE_MANIFEST.json') as {
    readonly generated?: unknown;
    readonly overlay?: unknown;
  };
  return Object.freeze({
    packageVersion: requireNonEmptyString(packageJson.version, 'package.json version'),
    sourceManifestGeneratedAt: requireNonEmptyString(sourceManifest.generated, 'SOURCE_MANIFEST.json generated'),
    sourceManifestOverlay: requireNonEmptyString(sourceManifest.overlay, 'SOURCE_MANIFEST.json overlay'),
    sourceManifestSha256: sha256String(sourceManifestContents),
    upstreamCommitSha: config.passConfig.upstream.lock.commitSha,
    upstreamGitTreeSha: config.passConfig.upstream.lock.gitTreeSha,
    upstreamTrackedTreeListingSha256: config.passConfig.upstream.lock.trackedTreeListingSha256,
  });
}

function createDefaultProcessRuntime(): BwsUpstreamConvergenceProcessRuntime {
  return Object.freeze({
    createProcessRecord(input: Readonly<{
      readonly commandCwd: string;
      readonly entryPointPath: string;
      readonly processName: 'bws-upstream-convergence-service';
      readonly startedAt: string;
    }>) {
      const command = Object.freeze([process.execPath, ...process.argv.slice(1)]);
      const snapshot = readProcessSnapshot(process.pid);
      if (snapshot === undefined) {
        throw new Error('Unable to read the current process snapshot from /proc.');
      }
      return Object.freeze({
        command,
        commandCwd: input.commandCwd,
        entryPointPath: input.entryPointPath,
        pid: process.pid,
        procStartTicks: snapshot.procStartTicks,
        processName: input.processName,
        startedAt: input.startedAt,
      });
    },
    inspectProcess(processRecord: BwsUpstreamConvergenceManagedProcess) {
      return inspectManagedProcess(processRecord);
    },
  });
}

function inspectManagedProcess(
  processRecord: BwsUpstreamConvergenceManagedProcess,
): 'missing' | 'running' {
  if (!isProcessAlive(processRecord.pid)) {
    return 'missing';
  }
  const snapshot = readProcessSnapshot(processRecord.pid);
  if (snapshot === undefined) {
    return 'missing';
  }
  if (snapshot.procStartTicks !== processRecord.procStartTicks) {
    return 'missing';
  }
  if (snapshot.cwd !== processRecord.commandCwd) {
    return 'missing';
  }
  if (snapshot.cmdline.length !== processRecord.command.length) {
    return 'missing';
  }
  for (let index = 0; index < snapshot.cmdline.length; index += 1) {
    if (snapshot.cmdline[index] !== processRecord.command[index]) {
      return 'missing';
    }
  }
  return 'running';
}

function createDefaultSignalRegistrar(): BwsUpstreamConvergenceSignalRegistrar {
  return Object.freeze({
    register(signal: BwsSignal, handler: () => void) {
      process.on(signal, handler);
      return () => {
        process.off(signal, handler);
      };
    },
  });
}

async function sleepInterruptibly(
  milliseconds: number,
  sleep: (milliseconds: number) => Promise<void>,
  shouldStop: () => boolean,
): Promise<void> {
  let remaining = milliseconds;
  while (remaining > 0) {
    if (shouldStop()) {
      return;
    }
    const slice = Math.min(remaining, DEFAULT_SLEEP_SLICE_MS);
    await sleep(slice);
    remaining -= slice;
  }
}

function defaultSleep(milliseconds: number): Promise<void> {
  return sleepFor(milliseconds).then(() => undefined);
}

function readProcessSnapshot(
  pid: number,
): Readonly<{
  readonly cmdline: readonly string[];
  readonly cwd: string;
  readonly procStartTicks: string;
}> | undefined {
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
      throw new Error(`Process ${pid} exists but is not accessible for ownership verification.`);
    }
    throw error;
  }
}

function emptyCounters(): BwsUpstreamConvergenceServiceCounters {
  return Object.freeze({
    blockerCount: 0,
    consecutiveNonSuccessCount: 0,
    failureCount: 0,
    noChangeCount: 0,
    successCount: 0,
    totalPassCount: 0,
  });
}

function assertStateMatchesRepository(
  state: BwsUpstreamConvergenceManagedServiceState,
  repositoryRoot: string,
): void {
  if (state.repositoryRoot !== repositoryRoot) {
    throw new Error('Upstream convergence service state belongs to a different repository root.');
  }
}

function assertConfigFingerprintMatches(
  state: BwsUpstreamConvergenceManagedServiceState,
  configFingerprint: string,
): void {
  if (state.configFingerprint !== configFingerprint) {
    throw new Error(
      'Upstream convergence service configuration fingerprint does not match the recorded state.',
    );
  }
}

function requireMode(value: string | undefined): BwsUpstreamConvergenceMode {
  const normalized = requireNonEmptyString(value, BWS_UPSTREAM_MODE_ENV);
  if (normalized !== 'api' && normalized !== 'export') {
    throw new Error(`${BWS_UPSTREAM_MODE_ENV} must be exactly api or export.`);
  }
  return normalized;
}

function requirePositiveInteger(value: string | undefined, name: string): number {
  const normalized = requireNonEmptyString(value, name);
  if (!POSITIVE_INTEGER_PATTERN.test(normalized)) {
    throw new Error(`${name} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function sha256String(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function defaultNow(): string {
  return new Date().toISOString();
}

function toIsoTimestamp(epochMilliseconds: number): string {
  return new Date(epochMilliseconds).toISOString();
}
