import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { setTimeout as sleepFor } from 'node:timers/promises';
import {
  SurebetWorkerJobRepository,
  type SurebetWorkerQueueSummary,
} from '../../../persistence/src/index.js';
import {
  type BoundaryResult,
  type Blocker,
} from '../contracts/local-types.js';
import {
  resolveBwsPrivatePaperSchedulerConfig,
  runBwsPrivatePaperSchedulerPass,
  type BwsPrivatePaperSchedulerConfig,
  type BwsPrivatePaperSchedulerEnvironment,
  type BwsPrivatePaperSchedulerPassResult,
} from './private-paper-runtime-scheduler.js';
import {
  BWS_OBSERVABILITY_RUNTIME_ID_ENV,
  createBwsStructuredLogger,
  createBwsStructuredProcessIdentity,
  registerBwsEvidenceArtifact,
} from './observability.js';

const BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_STATE_SCHEMA = 'bws.private_paper_scheduler_service_state.v1';
const BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_EVIDENCE_SCHEMA = 'bws.private_paper_scheduler_service_evidence.v1';
const DEFAULT_RUNTIME_STATE_DIRECTORY = 'runtime/bws-private-paper-scheduler-service';
const DEFAULT_SLEEP_SLICE_MS = 50;
const PROCESS_SIGNAL_ZERO: NodeJS.Signals | 0 = 0;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;

export const BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS_ENV = 'BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS';
export const BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS_ENV = 'BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS';
export const BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS_ENV = 'BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS';
export const BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS_ENV = 'BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS';
export const BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH_ENV = 'BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH';

type BwsSignal = 'SIGINT' | 'SIGTERM';
type ServiceLifecycleState = 'running' | 'stopped';
type SchedulerPassOutcome = 'blocked' | 'failure' | 'scheduled' | 'skipped';
type SchedulerSkipReason = 'backpressure' | 'no_completed_cycle';
type ServiceEvidenceEvent =
  | 'pass_completed'
  | 'service_started'
  | 'service_status'
  | 'service_stopped';

interface SchedulerPassClassification {
  readonly blockerCodes: readonly string[];
  readonly duplicateSuppressed: boolean;
  readonly errorMessage?: string;
  readonly outcome: SchedulerPassOutcome;
  readonly queueDepth: SurebetWorkerQueueSummary;
  readonly scheduledCycleNumber?: number;
  readonly scheduledJobId?: string;
  readonly skipReason?: SchedulerSkipReason;
  readonly summary: string;
  readonly timedOut: boolean;
}

export interface BwsPrivatePaperSchedulerServiceEnvironment extends BwsPrivatePaperSchedulerEnvironment {
  readonly BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS?: string;
  readonly BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS?: string;
  readonly BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS?: string;
  readonly BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS?: string;
  readonly BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH?: string;
}

export interface BwsPrivatePaperSchedulerManagedProcess {
  readonly command: readonly string[];
  readonly commandCwd: string;
  readonly entryPointPath: string;
  readonly pid: number;
  readonly procStartTicks: string;
  readonly processName: 'bws-private-paper-scheduler-service';
  readonly startedAt: string;
}

export interface BwsPrivatePaperSchedulerServiceConfig {
  readonly intervalMs: number;
  readonly maxQueueDepth: number;
  readonly maxRetryBackoffMs: number;
  readonly passConfig: BwsPrivatePaperSchedulerConfig;
  readonly passTimeoutMs: number;
  readonly repositoryRoot: string;
  readonly retryBackoffMs: number;
}

export interface RedactedBwsPrivatePaperSchedulerServiceConfig {
  readonly intervalMs: number;
  readonly maxQueueDepth: number;
  readonly maxRetryBackoffMs: number;
  readonly mode: BwsPrivatePaperSchedulerConfig['mode'];
  readonly queueName: string;
  readonly passTimeoutMs: number;
  readonly repositoryRoot: string;
  readonly retryBackoffMs: number;
  readonly runtimeId: string;
  readonly schedulerCheckpointId: string;
  readonly scheduleManifestPath: string;
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

export interface BwsPrivatePaperSchedulerServiceSourceFingerprints {
  readonly packageVersion: string;
  readonly sourceManifestGeneratedAt: string;
  readonly sourceManifestOverlay: string;
  readonly sourceManifestSha256: string;
  readonly upstreamCommitSha: string;
  readonly upstreamGitTreeSha: string;
  readonly upstreamTrackedTreeListingSha256: string;
}

export interface BwsPrivatePaperSchedulerServiceCounters {
  readonly blockedCount: number;
  readonly consecutiveNonSuccessCount: number;
  readonly duplicateSuppressedCount: number;
  readonly failureCount: number;
  readonly scheduledCount: number;
  readonly skippedCount: number;
  readonly totalPassCount: number;
}

export interface BwsPrivatePaperSchedulerServiceLastPass {
  readonly blockerCodes: readonly string[];
  readonly completedAt: string;
  readonly durationMs: number;
  readonly errorMessage?: string;
  readonly duplicateSuppressed: boolean;
  readonly outcome: SchedulerPassOutcome;
  readonly passNumber: number;
  readonly queueDepth: SurebetWorkerQueueSummary;
  readonly scheduledCycleNumber?: number;
  readonly scheduledJobId?: string;
  readonly skipReason?: SchedulerSkipReason;
  readonly startedAt: string;
  readonly summary: string;
  readonly timedOut: boolean;
}

export interface BwsPrivatePaperSchedulerServiceRuntimeState {
  readonly counters: BwsPrivatePaperSchedulerServiceCounters;
  readonly lastPass?: BwsPrivatePaperSchedulerServiceLastPass;
  readonly lastSignal?: BwsSignal;
  readonly lifecycleState: ServiceLifecycleState;
  readonly nextAttemptAt?: string;
  readonly updatedAt: string;
}

export interface BwsPrivatePaperSchedulerManagedServiceState {
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsPrivatePaperSchedulerServiceConfig;
  readonly process: BwsPrivatePaperSchedulerManagedProcess;
  readonly repositoryRoot: string;
  readonly runtimeId: string;
  readonly runtime: BwsPrivatePaperSchedulerServiceRuntimeState;
  readonly schema: typeof BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_STATE_SCHEMA;
  readonly service: 'private_paper_scheduler';
  readonly sourceFingerprints: BwsPrivatePaperSchedulerServiceSourceFingerprints;
  readonly stateRecordedAt: string;
}

export interface BwsPrivatePaperSchedulerServiceCommandResult {
  readonly command: 'run' | 'status';
  readonly configuration: RedactedBwsPrivatePaperSchedulerServiceConfig;
  readonly counters: BwsPrivatePaperSchedulerServiceCounters;
  readonly evidenceFile: string;
  readonly generatedAt: string;
  readonly lastPass?: BwsPrivatePaperSchedulerServiceLastPass;
  readonly lastSignal?: BwsSignal;
  readonly lifecycleState: ServiceLifecycleState;
  readonly outcome:
    | 'already_running'
    | 'max_passes_reached'
    | 'not_running'
    | 'running'
    | 'signal_stopped'
    | 'stale_state';
  readonly process:
    | BwsPrivatePaperSchedulerManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>;
  readonly service: 'private_paper_scheduler';
  readonly stateFile: string;
  readonly runtimeId: string;
  readonly sourceFingerprints: BwsPrivatePaperSchedulerServiceSourceFingerprints;
}

interface BwsPrivatePaperSchedulerEvidenceRecord extends BwsPrivatePaperSchedulerServiceCommandResult {
  readonly event: ServiceEvidenceEvent;
  readonly repositoryRoot: string;
  readonly schema: typeof BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_EVIDENCE_SCHEMA;
}

interface BwsPrivatePaperSchedulerServicePaths {
  readonly evidenceDirectory: string;
  readonly repositoryRoot: string;
  readonly stateDirectory: string;
  readonly stateFilePath: string;
}

export interface BwsPrivatePaperSchedulerSignalRegistrar {
  register(signal: BwsSignal, handler: () => void): () => void;
}

export interface BwsPrivatePaperSchedulerProcessRuntime {
  createProcessRecord(input: Readonly<{
    readonly commandCwd: string;
    readonly entryPointPath: string;
    readonly processName: 'bws-private-paper-scheduler-service';
    readonly startedAt: string;
  }>): BwsPrivatePaperSchedulerManagedProcess;
  inspectProcess(processRecord: BwsPrivatePaperSchedulerManagedProcess): 'missing' | 'running';
}

export interface RunBwsPrivatePaperSchedulerServiceRequest {
  readonly config?: BwsPrivatePaperSchedulerServiceConfig;
  readonly environment?: BwsPrivatePaperSchedulerServiceEnvironment;
  readonly jobs?: Pick<SurebetWorkerJobRepository, 'summarizeQueue'>;
  readonly maxPasses?: number;
  readonly now?: () => string;
  readonly processRuntime?: BwsPrivatePaperSchedulerProcessRuntime;
  readonly repositoryRoot?: string;
  readonly runSchedulerPass?: (
    request: Readonly<{ readonly config: BwsPrivatePaperSchedulerConfig }>,
  ) => Promise<BoundaryResult<BwsPrivatePaperSchedulerPassResult>>;
  readonly runtimeStateDirectory?: string;
  readonly signalRegistrar?: BwsPrivatePaperSchedulerSignalRegistrar;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export interface GetBwsPrivatePaperSchedulerServiceStatusRequest {
  readonly config?: BwsPrivatePaperSchedulerServiceConfig;
  readonly environment?: BwsPrivatePaperSchedulerServiceEnvironment;
  readonly now?: () => string;
  readonly processRuntime?: BwsPrivatePaperSchedulerProcessRuntime;
  readonly repositoryRoot?: string;
  readonly runtimeStateDirectory?: string;
}

export function resolveBwsPrivatePaperSchedulerServiceConfig(
  environment: BwsPrivatePaperSchedulerServiceEnvironment = process.env as BwsPrivatePaperSchedulerServiceEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsPrivatePaperSchedulerServiceConfig {
  const resolvedRepositoryRoot = realpathSync(repositoryRoot);
  const intervalMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS_ENV],
    BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS_ENV,
  );
  const retryBackoffMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS_ENV],
    BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS_ENV,
  );
  const maxRetryBackoffMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS_ENV],
    BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS_ENV,
  );
  const passTimeoutMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS_ENV],
    BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS_ENV,
  );
  const maxQueueDepth = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH_ENV],
    BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH_ENV,
  );
  if (retryBackoffMs > maxRetryBackoffMs) {
    throw new Error(
      `${BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS_ENV} must not exceed ${BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS_ENV}.`,
    );
  }
  return Object.freeze({
    intervalMs,
    maxQueueDepth,
    maxRetryBackoffMs,
    passConfig: resolveBwsPrivatePaperSchedulerConfig(environment, resolvedRepositoryRoot),
    passTimeoutMs,
    repositoryRoot: resolvedRepositoryRoot,
    retryBackoffMs,
  });
}

export async function runBwsPrivatePaperSchedulerService(
  request: RunBwsPrivatePaperSchedulerServiceRequest = {},
): Promise<BwsPrivatePaperSchedulerServiceCommandResult> {
  const context = createContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const existingState = readServiceState(context.paths.stateFilePath);
  if (existingState !== undefined) {
    assertStateMatchesRepository(existingState, context.paths.repositoryRoot);
    assertConfigFingerprintMatches(existingState, context.configFingerprint);
    if (context.processRuntime.inspectProcess(existingState.process) === 'running') {
      throw new Error('BWS private-paper scheduler service is already running for this repository and configuration.');
    }
  }

  const startedAt = context.now();
  const currentProcess = context.processRuntime.createProcessRecord({
    commandCwd: context.paths.repositoryRoot,
    entryPointPath: resolve(
      context.paths.repositoryRoot,
      'dist/packages/bootstrap/src/cli/bws-private-paper-scheduler-service.js',
    ),
    processName: 'bws-private-paper-scheduler-service',
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
        state = finalizeState(state, context.now(), undefined);
        writeServiceState(context.paths.stateFilePath, state);
        const result = createCommandResult(context, state, 'run', 'max_passes_reached', currentProcess);
        writeEvidence(context, 'service_stopped', result);
        return result;
      }

      const passStartedAt = context.now();
      const passNumber = state.runtime.counters.totalPassCount + 1;
      state = updateStateForPassStart(state, passStartedAt);
      writeServiceState(context.paths.stateFilePath, state);

      const queueDepth = context.jobs.summarizeQueue(context.config.passConfig.queueName);
      const passExecutionStartedAt = Date.now();
      const passOutcome = queueDepth.outstandingCount >= context.config.maxQueueDepth
        ? classifyBackpressurePass(queueDepth)
        : await executePass(context, queueDepth);
      const passCompletedAt = context.now();
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
            duplicateSuppressed: passOutcome.duplicateSuppressed,
            outcome: passOutcome.outcome,
            passNumber,
            queueDepth: passOutcome.queueDepth,
            ...(passOutcome.scheduledCycleNumber === undefined ? {} : { scheduledCycleNumber: passOutcome.scheduledCycleNumber }),
            ...(passOutcome.scheduledJobId === undefined ? {} : { scheduledJobId: passOutcome.scheduledJobId }),
            ...(passOutcome.skipReason === undefined ? {} : { skipReason: passOutcome.skipReason }),
            startedAt: passStartedAt,
            summary: passOutcome.summary,
            timedOut: passOutcome.timedOut,
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
    state = finalizeState(state, stoppedAt, shutdownSignal);
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

export function getBwsPrivatePaperSchedulerServiceStatus(
  request: GetBwsPrivatePaperSchedulerServiceStatusRequest = {},
): BwsPrivatePaperSchedulerServiceCommandResult {
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
    RunBwsPrivatePaperSchedulerServiceRequest,
    | 'config'
    | 'environment'
    | 'jobs'
    | 'maxPasses'
    | 'now'
    | 'processRuntime'
    | 'repositoryRoot'
    | 'runSchedulerPass'
    | 'runtimeStateDirectory'
    | 'signalRegistrar'
    | 'sleep'
  >,
): Readonly<{
  readonly config: BwsPrivatePaperSchedulerServiceConfig;
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsPrivatePaperSchedulerServiceConfig;
  readonly jobs: Pick<SurebetWorkerJobRepository, 'summarizeQueue'>;
  readonly maxPasses?: number;
  readonly now: () => string;
  readonly paths: BwsPrivatePaperSchedulerServicePaths;
  readonly processRuntime: BwsPrivatePaperSchedulerProcessRuntime;
  readonly runSchedulerPass: (
    request: Readonly<{ readonly config: BwsPrivatePaperSchedulerConfig }>,
  ) => Promise<BoundaryResult<BwsPrivatePaperSchedulerPassResult>>;
  readonly runtimeId: string;
  readonly signalRegistrar: BwsPrivatePaperSchedulerSignalRegistrar;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly sourceFingerprints: BwsPrivatePaperSchedulerServiceSourceFingerprints;
}> {
  const repositoryRoot = realpathSync(request.repositoryRoot ?? process.cwd());
  const config = request.config ?? resolveBwsPrivatePaperSchedulerServiceConfig(request.environment, repositoryRoot);
  const paths = resolvePaths(repositoryRoot, request.runtimeStateDirectory ?? DEFAULT_RUNTIME_STATE_DIRECTORY);
  const configuration = redactBwsPrivatePaperSchedulerServiceConfig(config);
  const configFingerprint = sha256String(JSON.stringify(configuration));
  return Object.freeze({
    config,
    configFingerprint,
    configuration,
    jobs: request.jobs ?? new SurebetWorkerJobRepository(config.passConfig.persistence),
    ...(request.maxPasses === undefined ? {} : { maxPasses: request.maxPasses }),
    now: request.now ?? defaultNow,
    paths,
    processRuntime: request.processRuntime ?? createDefaultProcessRuntime(),
    runSchedulerPass: request.runSchedulerPass ?? ((runRequest) => runBwsPrivatePaperSchedulerPass(runRequest)),
    runtimeId: resolveRuntimeId(),
    signalRegistrar: request.signalRegistrar ?? createDefaultSignalRegistrar(),
    sleep: request.sleep ?? defaultSleep,
    sourceFingerprints: collectSourceFingerprints(repositoryRoot, config),
  });
}

async function executePass(
  context: ReturnType<typeof createContext>,
  queueDepth: SurebetWorkerQueueSummary,
): Promise<SchedulerPassClassification> {
  const rawPassPromise = context.runSchedulerPass({
    config: context.config.passConfig,
  });
  const timeoutResult = await raceWithTimeout(rawPassPromise, context.config.passTimeoutMs);
  const settledPassResult = timeoutResult.timedOut ? await rawPassPromise : timeoutResult.result;
  return classifySchedulerPassResult(settledPassResult, timeoutResult.timedOut, queueDepth);
}

function classifyBackpressurePass(
  queueDepth: SurebetWorkerQueueSummary,
): SchedulerPassClassification {
  return Object.freeze({
    blockerCodes: Object.freeze([]),
    duplicateSuppressed: false,
    outcome: 'skipped',
    queueDepth,
    skipReason: 'backpressure',
    summary: `Queue ${queueDepth.queueName} is at backpressure depth ${queueDepth.outstandingCount}; scheduling is skipped until outstanding work drains.`,
    timedOut: false,
  });
}

async function raceWithTimeout(
  passPromise: Promise<BoundaryResult<BwsPrivatePaperSchedulerPassResult>>,
  timeoutMs: number,
): Promise<Readonly<{
  readonly result: BoundaryResult<BwsPrivatePaperSchedulerPassResult>;
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

function classifySchedulerPassResult(
  result: BoundaryResult<BwsPrivatePaperSchedulerPassResult>,
  timedOut: boolean,
  queueDepth: SurebetWorkerQueueSummary,
): SchedulerPassClassification {
  if (timedOut) {
    return Object.freeze({
      blockerCodes: Object.freeze([]),
      duplicateSuppressed: false,
      errorMessage: `BWS private-paper scheduler pass exceeded ${BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS_ENV}.`,
      outcome: 'failure',
      queueDepth,
      summary: 'The bounded scheduler pass exceeded the configured timeout and is recorded as a failure.',
      timedOut: true,
    });
  }
  if (!result.ok) {
    return Object.freeze({
      blockerCodes: Object.freeze(result.blockers.map((entry) => entry.code)),
      duplicateSuppressed: false,
      outcome: 'blocked',
      queueDepth,
      summary: summarizeBlockers(result.blockers),
      timedOut: false,
    });
  }
  if (result.value.scheduled) {
    return Object.freeze({
      blockerCodes: Object.freeze([]),
      duplicateSuppressed: result.value.duplicateSuppressed === true,
      outcome: 'scheduled',
      queueDepth,
      ...(result.value.scheduledCycleNumber === undefined ? {} : { scheduledCycleNumber: result.value.scheduledCycleNumber }),
      ...(result.value.scheduledJobId === undefined ? {} : { scheduledJobId: result.value.scheduledJobId }),
      summary: result.value.duplicateSuppressed === true
        ? `Scheduler recovered deterministic job ${result.value.scheduledJobId} and advanced its checkpoint without duplicating work.`
        : `Scheduler queued deterministic job ${result.value.scheduledJobId} for cycle ${result.value.scheduledCycleNumber}.`,
      timedOut: false,
    });
  }
  return Object.freeze({
    blockerCodes: Object.freeze([]),
    duplicateSuppressed: false,
    outcome: 'skipped',
    queueDepth,
    skipReason: 'no_completed_cycle',
    summary: `Scheduler found no newly completed ${result.value.mode} upstream cycle to queue for ${result.value.queueName}.`,
    timedOut: false,
  });
}

function resolveNextDelayMilliseconds(
  config: BwsPrivatePaperSchedulerServiceConfig,
  outcome: SchedulerPassOutcome,
  counters: BwsPrivatePaperSchedulerServiceCounters,
): number {
  if (outcome === 'scheduled' || outcome === 'skipped') {
    return config.intervalMs;
  }
  const consecutiveAttempt = counters.consecutiveNonSuccessCount + 1;
  const computed = config.retryBackoffMs * (2 ** Math.max(0, consecutiveAttempt - 1));
  return Math.min(config.maxRetryBackoffMs, computed);
}

function updateStateForPassStart(
  state: BwsPrivatePaperSchedulerManagedServiceState,
  updatedAt: string,
): BwsPrivatePaperSchedulerManagedServiceState {
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
  state: BwsPrivatePaperSchedulerManagedServiceState,
  update: Readonly<{
    readonly completedAt: string;
    readonly durationMs: number;
    readonly lastSignal?: BwsSignal;
    readonly nextAttemptAt?: string;
    readonly pass: Readonly<{
      readonly blockerCodes: readonly string[];
      readonly duplicateSuppressed: boolean;
      readonly errorMessage?: string;
      readonly outcome: SchedulerPassOutcome;
      readonly passNumber: number;
      readonly queueDepth: SurebetWorkerQueueSummary;
      readonly scheduledCycleNumber?: number;
      readonly scheduledJobId?: string;
      readonly skipReason?: SchedulerSkipReason;
      readonly startedAt: string;
      readonly summary: string;
      readonly timedOut: boolean;
    }>;
  }>,
): BwsPrivatePaperSchedulerManagedServiceState {
  const counters = nextCounters(state.runtime.counters, update.pass.outcome, update.pass.duplicateSuppressed);
  const runtime: BwsPrivatePaperSchedulerServiceRuntimeState = Object.freeze({
    counters,
    lastPass: Object.freeze({
      blockerCodes: update.pass.blockerCodes,
      completedAt: update.completedAt,
      durationMs: update.durationMs,
      duplicateSuppressed: update.pass.duplicateSuppressed,
      ...(update.pass.errorMessage === undefined ? {} : { errorMessage: update.pass.errorMessage }),
      outcome: update.pass.outcome,
      passNumber: update.pass.passNumber,
      queueDepth: update.pass.queueDepth,
      ...(update.pass.scheduledCycleNumber === undefined ? {} : { scheduledCycleNumber: update.pass.scheduledCycleNumber }),
      ...(update.pass.scheduledJobId === undefined ? {} : { scheduledJobId: update.pass.scheduledJobId }),
      ...(update.pass.skipReason === undefined ? {} : { skipReason: update.pass.skipReason }),
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
  state: BwsPrivatePaperSchedulerManagedServiceState,
  updatedAt: string,
  signal: BwsSignal | undefined,
): BwsPrivatePaperSchedulerManagedServiceState {
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
  counters: BwsPrivatePaperSchedulerServiceCounters,
  outcome: SchedulerPassOutcome,
  duplicateSuppressed: boolean,
): BwsPrivatePaperSchedulerServiceCounters {
  return Object.freeze({
    blockedCount: counters.blockedCount + (outcome === 'blocked' ? 1 : 0),
    consecutiveNonSuccessCount: outcome === 'scheduled' || outcome === 'skipped'
      ? 0
      : counters.consecutiveNonSuccessCount + 1,
    duplicateSuppressedCount: counters.duplicateSuppressedCount + (duplicateSuppressed ? 1 : 0),
    failureCount: counters.failureCount + (outcome === 'failure' ? 1 : 0),
    scheduledCount: counters.scheduledCount + (outcome === 'scheduled' ? 1 : 0),
    skippedCount: counters.skippedCount + (outcome === 'skipped' ? 1 : 0),
    totalPassCount: counters.totalPassCount + 1,
  });
}

function buildRunningState(
  context: ReturnType<typeof createContext>,
  process: BwsPrivatePaperSchedulerManagedProcess,
  existingState: BwsPrivatePaperSchedulerManagedServiceState | undefined,
  startedAt: string,
): BwsPrivatePaperSchedulerManagedServiceState {
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
    schema: BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_STATE_SCHEMA,
    service: 'private_paper_scheduler',
    sourceFingerprints: context.sourceFingerprints,
    stateRecordedAt: startedAt,
  });
}

function createCommandResult(
  context: ReturnType<typeof createContext>,
  state: BwsPrivatePaperSchedulerManagedServiceState,
  command: 'run' | 'status',
  outcome: BwsPrivatePaperSchedulerServiceCommandResult['outcome'],
  process:
    | BwsPrivatePaperSchedulerManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>,
): BwsPrivatePaperSchedulerServiceCommandResult {
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
    outcome,
    process,
    service: 'private_paper_scheduler',
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
    runtimeId: state.runtimeId,
    sourceFingerprints: context.sourceFingerprints,
  });
}

function createMissingStateStatusResult(
  context: ReturnType<typeof createContext>,
): BwsPrivatePaperSchedulerServiceCommandResult {
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
    outcome: 'not_running',
    process: Object.freeze({ ownership: 'missing' }),
    service: 'private_paper_scheduler',
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
    runtimeId: context.runtimeId,
    sourceFingerprints: context.sourceFingerprints,
  });
}

function writeEvidence(
  context: ReturnType<typeof createContext>,
  event: ServiceEvidenceEvent,
  result: BwsPrivatePaperSchedulerServiceCommandResult,
): void {
  const filePath = resolve(context.paths.repositoryRoot, result.evidenceFile);
  writeEvidenceRecord(filePath, {
    ...result,
    event,
    repositoryRoot: context.paths.repositoryRoot,
    schema: BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_EVIDENCE_SCHEMA,
  });
  registerBwsEvidenceArtifact({
    artifactPath: filePath,
    artifactSchema: BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_EVIDENCE_SCHEMA,
    createdAt: result.generatedAt,
    repositoryRoot: context.paths.repositoryRoot,
    retentionClass: 'runtime',
    runtimeId: result.runtimeId,
    sourceFingerprint: context.sourceFingerprints.sourceManifestSha256,
  });
  createBwsStructuredLogger({
    processIdentity: createBwsStructuredProcessIdentity('bws-private-paper-scheduler-service', context.paths.repositoryRoot, result.generatedAt),
    repositoryRoot: context.paths.repositoryRoot,
    runtimeId: result.runtimeId,
    selectedUpstreamMode: context.config.passConfig.mode,
  }).write({
    ...(result.lastPass?.scheduledJobId === undefined ? {} : { checkpointOrJobId: result.lastPass.scheduledJobId }),
    details: Object.freeze({
      command: result.command,
      counters: result.counters,
      event,
      lifecycleState: result.lifecycleState,
      outcome: result.outcome,
      queueName: context.configuration.queueName,
    }),
    eventCode: event,
    serviceRole: 'private_paper_scheduler',
    timestamp: result.generatedAt,
  });
}

function resolvePaths(
  repositoryRoot: string,
  runtimeStateDirectory: string,
): BwsPrivatePaperSchedulerServicePaths {
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
): BwsPrivatePaperSchedulerManagedServiceState | undefined {
  if (!existsSync(stateFilePath)) {
    return undefined;
  }
  const parsed = requireObject(JSON.parse(readFileSync(stateFilePath, 'utf-8')), stateFilePath) as Partial<
    BwsPrivatePaperSchedulerManagedServiceState
  >;
  if (parsed.schema !== BWS_PRIVATE_PAPER_SCHEDULER_SERVICE_STATE_SCHEMA) {
    throw new Error(`Unexpected private-paper scheduler service state schema in ${stateFilePath}.`);
  }
  if (parsed.service !== 'private_paper_scheduler') {
    throw new Error(`Unexpected private-paper scheduler service type in ${stateFilePath}.`);
  }
  return parsed as BwsPrivatePaperSchedulerManagedServiceState;
}

function writeServiceState(
  stateFilePath: string,
  state: BwsPrivatePaperSchedulerManagedServiceState,
): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  const temporaryPath = `${stateFilePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, stateFilePath);
}

function writeEvidenceRecord(
  filePath: string,
  record: BwsPrivatePaperSchedulerEvidenceRecord,
): void {
  if (existsSync(filePath)) {
    throw new Error(`Private-paper scheduler service evidence file already exists: ${filePath}`);
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
}

function resolveRuntimeId(): string {
  const candidate = process.env[BWS_OBSERVABILITY_RUNTIME_ID_ENV];
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return `${Date.now()}-${process.pid}-private-paper-scheduler`;
}

function resolveEvidenceFilePath(
  paths: BwsPrivatePaperSchedulerServicePaths,
  generatedAt: string,
  command: BwsPrivatePaperSchedulerServiceCommandResult['command'],
  outcome: BwsPrivatePaperSchedulerServiceCommandResult['outcome'],
): string {
  const timestamp = generatedAt.replace(/[:.]/g, '').replace(/-/g, '');
  return join(paths.evidenceDirectory, `${timestamp}-${command}-${outcome}.json`);
}

function redactBwsPrivatePaperSchedulerServiceConfig(
  config: BwsPrivatePaperSchedulerServiceConfig,
): RedactedBwsPrivatePaperSchedulerServiceConfig {
  return Object.freeze({
    intervalMs: config.intervalMs,
    maxQueueDepth: config.maxQueueDepth,
    maxRetryBackoffMs: config.maxRetryBackoffMs,
    mode: config.passConfig.mode,
    passTimeoutMs: config.passTimeoutMs,
    queueName: config.passConfig.queueName,
    repositoryRoot: config.repositoryRoot,
    retryBackoffMs: config.retryBackoffMs,
    runtimeId: config.passConfig.schedule.runtimeId,
    scheduleManifestPath: config.passConfig.schedule.manifestPath,
    schedulerCheckpointId: config.passConfig.schedule.schedulerCheckpointId,
    upstream: Object.freeze({
      commitSha: config.passConfig.upstream.upstream.lock.commitSha,
      contractAlias: config.passConfig.upstream.upstream.lock.contractAlias,
      contractSchema: config.passConfig.upstream.upstream.lock.contractSchema,
      gitTreeSha: config.passConfig.upstream.upstream.lock.gitTreeSha,
      lockPath: config.passConfig.upstream.upstream.lockPath,
      repository: config.passConfig.upstream.upstream.lock.repository,
      repositoryPath: config.passConfig.upstream.upstream.lock.repositoryPath,
      sourceView: config.passConfig.upstream.upstream.lock.sourceView,
      surebetProfile: config.passConfig.upstream.upstream.lock.surebetProfile,
      trackedTreeListingSha256: config.passConfig.upstream.upstream.lock.trackedTreeListingSha256,
      verifiedAt: config.passConfig.upstream.upstream.lock.verifiedAt,
    }),
  });
}

function collectSourceFingerprints(
  repositoryRoot: string,
  config: BwsPrivatePaperSchedulerServiceConfig,
): BwsPrivatePaperSchedulerServiceSourceFingerprints {
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
    upstreamCommitSha: config.passConfig.upstream.upstream.lock.commitSha,
    upstreamGitTreeSha: config.passConfig.upstream.upstream.lock.gitTreeSha,
    upstreamTrackedTreeListingSha256: config.passConfig.upstream.upstream.lock.trackedTreeListingSha256,
  });
}

function createDefaultProcessRuntime(): BwsPrivatePaperSchedulerProcessRuntime {
  return Object.freeze({
    createProcessRecord(input: Readonly<{
      readonly commandCwd: string;
      readonly entryPointPath: string;
      readonly processName: 'bws-private-paper-scheduler-service';
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
    inspectProcess(processRecord: BwsPrivatePaperSchedulerManagedProcess) {
      return inspectManagedProcess(processRecord);
    },
  });
}

function inspectManagedProcess(
  processRecord: BwsPrivatePaperSchedulerManagedProcess,
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

function createDefaultSignalRegistrar(): BwsPrivatePaperSchedulerSignalRegistrar {
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

function emptyCounters(): BwsPrivatePaperSchedulerServiceCounters {
  return Object.freeze({
    blockedCount: 0,
    consecutiveNonSuccessCount: 0,
    duplicateSuppressedCount: 0,
    failureCount: 0,
    scheduledCount: 0,
    skippedCount: 0,
    totalPassCount: 0,
  });
}

function assertStateMatchesRepository(
  state: BwsPrivatePaperSchedulerManagedServiceState,
  repositoryRoot: string,
): void {
  if (state.repositoryRoot !== repositoryRoot) {
    throw new Error('Private-paper scheduler service state belongs to a different repository root.');
  }
}

function assertConfigFingerprintMatches(
  state: BwsPrivatePaperSchedulerManagedServiceState,
  configFingerprint: string,
): void {
  if (state.configFingerprint !== configFingerprint) {
    throw new Error(
      'Private-paper scheduler service configuration fingerprint does not match the recorded state.',
    );
  }
}

function summarizeBlockers(blockers: readonly Blocker[]): string {
  return blockers.map((entry) => `${entry.code}: ${entry.message}`).join(' ');
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
