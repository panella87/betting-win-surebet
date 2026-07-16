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
  SurebetStrategyLedgerRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  applySurebetMigrations,
} from '../../../persistence/src/index.js';
import {
  createPrivatePaperRuntimeJobHandler,
} from '../workers/private-paper-runtime-jobs.js';
import {
  runBoundedWorkerPass,
  type BoundedWorkerJobHandler,
  type BoundedWorkerPassResult,
} from '../workers/bounded-job-worker.js';
import {
  resolveBwsServiceRuntimeConfig,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
} from './service-runtime.js';
import {
  type BoundaryResult,
  type Blocker,
} from '../contracts/local-types.js';
import {
  BWS_OBSERVABILITY_RUNTIME_ID_ENV,
  createBwsStructuredLogger,
  createBwsStructuredProcessIdentity,
  registerBwsEvidenceArtifact,
} from './observability.js';

const BWS_PRIVATE_PAPER_WORKER_SERVICE_STATE_SCHEMA = 'bws.private_paper_worker_service_state.v1';
const BWS_PRIVATE_PAPER_WORKER_SERVICE_EVIDENCE_SCHEMA = 'bws.private_paper_worker_service_evidence.v1';
const DEFAULT_RUNTIME_STATE_DIRECTORY = 'runtime/bws-private-paper-worker-service';
const DEFAULT_SLEEP_SLICE_MS = 50;
const PROCESS_SIGNAL_ZERO: NodeJS.Signals | 0 = 0;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;

export const BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS_ENV = 'BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS';
export const BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS_ENV = 'BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS';
export const BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS_ENV = 'BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS';
export const BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS_ENV = 'BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS';
export const BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS_ENV = 'BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS';

type BwsSignal = 'SIGINT' | 'SIGTERM';
type ServiceLifecycleState = 'running' | 'stopped';
type WorkerPassOutcome = 'blocked' | 'failure' | 'idle' | 'processed';
type ServiceEvidenceEvent =
  | 'pass_completed'
  | 'service_started'
  | 'service_status'
  | 'service_stopped';

export interface BwsPrivatePaperWorkerServiceEnvironment extends BwsServiceRuntimeEnvironment {
  readonly BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS?: string;
  readonly BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS?: string;
  readonly BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS?: string;
  readonly BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS?: string;
  readonly BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS?: string;
}

export interface BwsPrivatePaperWorkerManagedProcess {
  readonly command: readonly string[];
  readonly commandCwd: string;
  readonly entryPointPath: string;
  readonly pid: number;
  readonly procStartTicks: string;
  readonly processName: 'bws-private-paper-worker-service';
  readonly startedAt: string;
}

export interface BwsPrivatePaperWorkerServiceConfig {
  readonly intervalMs: number;
  readonly maxJobsPerPass: number;
  readonly maxRetryBackoffMs: number;
  readonly passTimeoutMs: number;
  readonly repositoryRoot: string;
  readonly retryBackoffMs: number;
  readonly runtimeConfig: BwsServiceRuntimeConfig;
}

export interface RedactedBwsPrivatePaperWorkerServiceConfig {
  readonly intervalMs: number;
  readonly maxJobsPerPass: number;
  readonly maxRetryBackoffMs: number;
  readonly passTimeoutMs: number;
  readonly queueName: string;
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
  readonly worker: BwsServiceRuntimeConfig['worker'];
}

export interface BwsPrivatePaperWorkerServiceSourceFingerprints {
  readonly packageVersion: string;
  readonly sourceManifestGeneratedAt: string;
  readonly sourceManifestOverlay: string;
  readonly sourceManifestSha256: string;
  readonly upstreamCommitSha: string;
  readonly upstreamGitTreeSha: string;
  readonly upstreamTrackedTreeListingSha256: string;
}

export interface BwsPrivatePaperWorkerServiceCounters {
  readonly blockedCount: number;
  readonly claimedCount: number;
  readonly completedCount: number;
  readonly consecutiveNonSuccessCount: number;
  readonly deadLetterCount: number;
  readonly expiredLeaseDeadLetterCount: number;
  readonly failureCount: number;
  readonly idlePassCount: number;
  readonly leaseRenewalCount: number;
  readonly processedPassCount: number;
  readonly retryCount: number;
  readonly totalPassCount: number;
}

export interface BwsPrivatePaperWorkerServiceLastPass {
  readonly blockerCodes: readonly string[];
  readonly claimedCount: number;
  readonly completedAt: string;
  readonly completedCount: number;
  readonly deadLetterCount: number;
  readonly drained: boolean;
  readonly durationMs: number;
  readonly errorMessage?: string;
  readonly expiredLeaseDeadLetterCount: number;
  readonly leaseRenewalCount: number;
  readonly outcome: WorkerPassOutcome;
  readonly passNumber: number;
  readonly retryCount: number;
  readonly startedAt: string;
  readonly summary: string;
  readonly timedOut: boolean;
}

export interface BwsPrivatePaperWorkerServiceRuntimeState {
  readonly counters: BwsPrivatePaperWorkerServiceCounters;
  readonly lastPass?: BwsPrivatePaperWorkerServiceLastPass;
  readonly lastSignal?: BwsSignal;
  readonly lifecycleState: ServiceLifecycleState;
  readonly nextAttemptAt?: string;
  readonly updatedAt: string;
}

export interface BwsPrivatePaperWorkerManagedServiceState {
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsPrivatePaperWorkerServiceConfig;
  readonly process: BwsPrivatePaperWorkerManagedProcess;
  readonly repositoryRoot: string;
  readonly runtimeId: string;
  readonly runtime: BwsPrivatePaperWorkerServiceRuntimeState;
  readonly schema: typeof BWS_PRIVATE_PAPER_WORKER_SERVICE_STATE_SCHEMA;
  readonly service: 'private_paper_worker';
  readonly sourceFingerprints: BwsPrivatePaperWorkerServiceSourceFingerprints;
  readonly stateRecordedAt: string;
}

export interface BwsPrivatePaperWorkerServiceCommandResult {
  readonly command: 'run' | 'status';
  readonly configuration: RedactedBwsPrivatePaperWorkerServiceConfig;
  readonly counters: BwsPrivatePaperWorkerServiceCounters;
  readonly evidenceFile: string;
  readonly generatedAt: string;
  readonly lastPass?: BwsPrivatePaperWorkerServiceLastPass;
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
    | BwsPrivatePaperWorkerManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>;
  readonly runtimeId: string;
  readonly service: 'private_paper_worker';
  readonly stateFile: string;
  readonly sourceFingerprints: BwsPrivatePaperWorkerServiceSourceFingerprints;
}

interface BwsPrivatePaperWorkerEvidenceRecord extends BwsPrivatePaperWorkerServiceCommandResult {
  readonly event: ServiceEvidenceEvent;
  readonly repositoryRoot: string;
  readonly schema: typeof BWS_PRIVATE_PAPER_WORKER_SERVICE_EVIDENCE_SCHEMA;
}

interface BwsPrivatePaperWorkerServicePaths {
  readonly evidenceDirectory: string;
  readonly repositoryRoot: string;
  readonly stateDirectory: string;
  readonly stateFilePath: string;
}

export interface BwsPrivatePaperWorkerSignalRegistrar {
  register(signal: BwsSignal, handler: () => void): () => void;
}

export interface BwsPrivatePaperWorkerProcessRuntime {
  createProcessRecord(input: Readonly<{
    readonly commandCwd: string;
    readonly entryPointPath: string;
    readonly processName: 'bws-private-paper-worker-service';
    readonly startedAt: string;
  }>): BwsPrivatePaperWorkerManagedProcess;
  inspectProcess(processRecord: BwsPrivatePaperWorkerManagedProcess): 'missing' | 'running';
}

export interface RunBwsPrivatePaperWorkerServiceRequest {
  readonly applyMigrations?: typeof applySurebetMigrations;
  readonly config?: BwsPrivatePaperWorkerServiceConfig;
  readonly createJobHandler?: (dependencies: Parameters<typeof createPrivatePaperRuntimeJobHandler>[0]) => BoundedWorkerJobHandler;
  readonly environment?: BwsPrivatePaperWorkerServiceEnvironment;
  readonly jobs?: Pick<
    SurebetWorkerJobRepository,
    | 'claimNext'
    | 'complete'
    | 'deadLetterOwnedJob'
    | 'fail'
    | 'heartbeatLease'
    | 'recordCheckpoint'
    | 'reapExpiredLeases'
  >;
  readonly maxPasses?: number;
  readonly now?: () => string;
  readonly processRuntime?: BwsPrivatePaperWorkerProcessRuntime;
  readonly repositoryRoot?: string;
  readonly runWorkerPass?: (request: Parameters<typeof runBoundedWorkerPass>[0]) => Promise<BoundaryResult<BoundedWorkerPassResult>>;
  readonly runtimeStateDirectory?: string;
  readonly signalRegistrar?: BwsPrivatePaperWorkerSignalRegistrar;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly strategyLedger?: Pick<SurebetStrategyLedgerRepository, 'create'>;
  readonly upstreamLocks?: Pick<SurebetUpstreamLockRepository, 'get'>;
}

export interface GetBwsPrivatePaperWorkerServiceStatusRequest {
  readonly config?: BwsPrivatePaperWorkerServiceConfig;
  readonly environment?: BwsPrivatePaperWorkerServiceEnvironment;
  readonly now?: () => string;
  readonly processRuntime?: BwsPrivatePaperWorkerProcessRuntime;
  readonly repositoryRoot?: string;
  readonly runtimeStateDirectory?: string;
}

export function resolveBwsPrivatePaperWorkerServiceConfig(
  environment: BwsPrivatePaperWorkerServiceEnvironment = process.env as BwsPrivatePaperWorkerServiceEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsPrivatePaperWorkerServiceConfig {
  const resolvedRepositoryRoot = realpathSync(repositoryRoot);
  const intervalMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS_ENV],
    BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS_ENV,
  );
  const retryBackoffMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS_ENV],
    BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS_ENV,
  );
  const maxRetryBackoffMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS_ENV],
    BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS_ENV,
  );
  const passTimeoutMs = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS_ENV],
    BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS_ENV,
  );
  const maxJobsPerPass = requirePositiveInteger(
    environment[BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS_ENV],
    BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS_ENV,
  );
  if (maxJobsPerPass > 128) {
    throw new Error(`${BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS_ENV} must not exceed 128.`);
  }
  if (retryBackoffMs > maxRetryBackoffMs) {
    throw new Error(
      `${BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS_ENV} must not exceed ${BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS_ENV}.`,
    );
  }
  return Object.freeze({
    intervalMs,
    maxJobsPerPass,
    maxRetryBackoffMs,
    passTimeoutMs,
    repositoryRoot: resolvedRepositoryRoot,
    retryBackoffMs,
    runtimeConfig: resolveBwsServiceRuntimeConfig(environment, resolvedRepositoryRoot),
  });
}

export async function runBwsPrivatePaperWorkerService(
  request: RunBwsPrivatePaperWorkerServiceRequest = {},
): Promise<BwsPrivatePaperWorkerServiceCommandResult> {
  const context = createContext(request);
  mkdirSync(context.paths.evidenceDirectory, { recursive: true });

  const existingState = readServiceState(context.paths.stateFilePath);
  if (existingState !== undefined) {
    assertStateMatchesRepository(existingState, context.paths.repositoryRoot);
    assertConfigFingerprintMatches(existingState, context.configFingerprint);
    if (context.processRuntime.inspectProcess(existingState.process) === 'running') {
      throw new Error('BWS private-paper worker service is already running for this repository and configuration.');
    }
  }

  (request.applyMigrations ?? applySurebetMigrations)(context.config.runtimeConfig.persistence);

  const startedAt = context.now();
  const currentProcess = context.processRuntime.createProcessRecord({
    commandCwd: context.paths.repositoryRoot,
    entryPointPath: resolve(
      context.paths.repositoryRoot,
      'dist/packages/bootstrap/src/cli/bws-private-paper-worker-service.js',
    ),
    processName: 'bws-private-paper-worker-service',
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
  const shouldDrain = () => shutdownSignal !== undefined;
  const signalDisposers: Array<() => void> = [];
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    signalDisposers.push(context.signalRegistrar.register(signal, () => {
      shutdownSignal = signal;
    }));
  }

  try {
    for (;;) {
      if (shutdownSignal !== undefined && state.runtime.counters.totalPassCount > 0) {
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

      const rawPassPromise = context.runWorkerPass({
        handlers: Object.freeze({
          private_paper_runtime_cycle_v1: context.handler,
        }),
        jobs: context.jobs,
        leaseDurationMs: context.config.runtimeConfig.worker.leaseDurationMs,
        maxJobs: context.config.maxJobsPerPass,
        now: context.now,
        queueName: context.config.runtimeConfig.worker.queueName,
        shouldDrain,
        sleep: context.sleep,
        workerId: context.config.runtimeConfig.worker.workerId,
      });
      const passExecutionStartedAt = Date.now();
      const timeoutResult = await raceWithTimeout(rawPassPromise, context.config.passTimeoutMs);
      const settledPassResult = timeoutResult.timedOut ? await rawPassPromise : timeoutResult.result;
      const passOutcome = classifyWorkerPassResult(settledPassResult, timeoutResult.timedOut);
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
            claimedCount: passOutcome.claimedCount,
            completedCount: passOutcome.completedCount,
            deadLetterCount: passOutcome.deadLetterCount,
            drained: passOutcome.drained,
            durationMs: Math.max(0, Date.now() - passExecutionStartedAt),
            ...(passOutcome.errorMessage === undefined ? {} : { errorMessage: passOutcome.errorMessage }),
            expiredLeaseDeadLetterCount: passOutcome.expiredLeaseDeadLetterCount,
            leaseRenewalCount: passOutcome.leaseRenewalCount,
            outcome: passOutcome.outcome,
            passNumber,
            retryCount: passOutcome.retryCount,
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

export function getBwsPrivatePaperWorkerServiceStatus(
  request: GetBwsPrivatePaperWorkerServiceStatusRequest = {},
): BwsPrivatePaperWorkerServiceCommandResult {
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
    RunBwsPrivatePaperWorkerServiceRequest,
    | 'config'
    | 'createJobHandler'
    | 'environment'
    | 'jobs'
    | 'maxPasses'
    | 'now'
    | 'processRuntime'
    | 'repositoryRoot'
    | 'runWorkerPass'
    | 'runtimeStateDirectory'
    | 'signalRegistrar'
    | 'sleep'
    | 'strategyLedger'
    | 'upstreamLocks'
  >,
): Readonly<{
  readonly config: BwsPrivatePaperWorkerServiceConfig;
  readonly configFingerprint: string;
  readonly configuration: RedactedBwsPrivatePaperWorkerServiceConfig;
  readonly handler: BoundedWorkerJobHandler;
  readonly jobs: Pick<
    SurebetWorkerJobRepository,
    | 'claimNext'
    | 'complete'
    | 'deadLetterOwnedJob'
    | 'fail'
    | 'heartbeatLease'
    | 'recordCheckpoint'
    | 'reapExpiredLeases'
  >;
  readonly maxPasses?: number;
  readonly now: () => string;
  readonly paths: BwsPrivatePaperWorkerServicePaths;
  readonly processRuntime: BwsPrivatePaperWorkerProcessRuntime;
  readonly runWorkerPass: (request: Parameters<typeof runBoundedWorkerPass>[0]) => Promise<BoundaryResult<BoundedWorkerPassResult>>;
  readonly runtimeId: string;
  readonly signalRegistrar: BwsPrivatePaperWorkerSignalRegistrar;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly sourceFingerprints: BwsPrivatePaperWorkerServiceSourceFingerprints;
}> {
  const repositoryRoot = realpathSync(request.repositoryRoot ?? process.cwd());
  const config = request.config ?? resolveBwsPrivatePaperWorkerServiceConfig(request.environment, repositoryRoot);
  const paths = resolvePaths(repositoryRoot, request.runtimeStateDirectory ?? DEFAULT_RUNTIME_STATE_DIRECTORY);
  const configuration = redactBwsPrivatePaperWorkerServiceConfig(config);
  const configFingerprint = sha256String(JSON.stringify(configuration));
  const upstreamLocks = request.upstreamLocks ?? new SurebetUpstreamLockRepository(config.runtimeConfig.persistence);
  const strategyLedger = request.strategyLedger ?? new SurebetStrategyLedgerRepository(config.runtimeConfig.persistence);
  return Object.freeze({
    config,
    configFingerprint,
    configuration,
    handler: (request.createJobHandler ?? createPrivatePaperRuntimeJobHandler)({
      strategyLedger,
      upstreamLocks,
    }),
    jobs: request.jobs ?? new SurebetWorkerJobRepository(config.runtimeConfig.persistence),
    ...(request.maxPasses === undefined ? {} : { maxPasses: request.maxPasses }),
    now: request.now ?? defaultNow,
    paths,
    processRuntime: request.processRuntime ?? createDefaultProcessRuntime(),
    runWorkerPass: request.runWorkerPass ?? ((runRequest) => runBoundedWorkerPass(runRequest)),
    runtimeId: resolveRuntimeId(),
    signalRegistrar: request.signalRegistrar ?? createDefaultSignalRegistrar(),
    sleep: request.sleep ?? defaultSleep,
    sourceFingerprints: collectSourceFingerprints(repositoryRoot, config),
  });
}

async function raceWithTimeout(
  passPromise: Promise<BoundaryResult<BoundedWorkerPassResult>>,
  timeoutMs: number,
): Promise<Readonly<{
  readonly result: BoundaryResult<BoundedWorkerPassResult>;
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

function classifyWorkerPassResult(
  result: BoundaryResult<BoundedWorkerPassResult>,
  timedOut: boolean,
): Readonly<{
  readonly blockerCodes: readonly string[];
  readonly claimedCount: number;
  readonly completedCount: number;
  readonly deadLetterCount: number;
  readonly drained: boolean;
  readonly errorMessage?: string;
  readonly expiredLeaseDeadLetterCount: number;
  readonly leaseRenewalCount: number;
  readonly outcome: WorkerPassOutcome;
  readonly retryCount: number;
  readonly summary: string;
  readonly timedOut: boolean;
}> {
  if (timedOut) {
    return Object.freeze({
      blockerCodes: Object.freeze([]),
      claimedCount: 0,
      completedCount: 0,
      deadLetterCount: 0,
      drained: false,
      errorMessage: `BWS private-paper worker pass exceeded ${BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS_ENV}.`,
      expiredLeaseDeadLetterCount: 0,
      leaseRenewalCount: 0,
      outcome: 'failure',
      retryCount: 0,
      summary: 'The bounded worker pass exceeded the configured timeout and is recorded as a failure.',
      timedOut: true,
    });
  }
  if (!result.ok) {
    return Object.freeze({
      blockerCodes: Object.freeze(result.blockers.map((entry) => entry.code)),
      claimedCount: 0,
      completedCount: 0,
      deadLetterCount: 0,
      drained: false,
      expiredLeaseDeadLetterCount: 0,
      leaseRenewalCount: 0,
      outcome: 'blocked',
      retryCount: 0,
      summary: summarizeBlockers(result.blockers),
      timedOut: false,
    });
  }
  const outcome: WorkerPassOutcome = result.value.claimedCount === 0 ? 'idle' : 'processed';
  return Object.freeze({
    blockerCodes: Object.freeze([]),
    claimedCount: result.value.claimedCount,
    completedCount: result.value.completedCount,
    deadLetterCount: result.value.deadLetterCount,
    drained: result.value.drained,
    expiredLeaseDeadLetterCount: result.value.expiredLeaseDeadLetterCount,
    leaseRenewalCount: result.value.leaseRenewalCount,
    outcome,
    retryCount: result.value.retryCount,
    summary: outcome === 'idle'
      ? `Worker found no available jobs on queue ${result.value.queueName}.`
      : `Worker processed ${result.value.claimedCount} job(s) on queue ${result.value.queueName}.`,
    timedOut: false,
  });
}

function resolveNextDelayMilliseconds(
  config: BwsPrivatePaperWorkerServiceConfig,
  outcome: WorkerPassOutcome,
  counters: BwsPrivatePaperWorkerServiceCounters,
): number {
  if (outcome === 'processed' || outcome === 'idle') {
    return config.intervalMs;
  }
  const consecutiveAttempt = counters.consecutiveNonSuccessCount + 1;
  const computed = config.retryBackoffMs * (2 ** Math.max(0, consecutiveAttempt - 1));
  return Math.min(config.maxRetryBackoffMs, computed);
}

function updateStateForPassStart(
  state: BwsPrivatePaperWorkerManagedServiceState,
  updatedAt: string,
): BwsPrivatePaperWorkerManagedServiceState {
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
  state: BwsPrivatePaperWorkerManagedServiceState,
  update: Readonly<{
    readonly completedAt: string;
    readonly durationMs: number;
    readonly lastSignal?: BwsSignal;
    readonly nextAttemptAt?: string;
    readonly pass: Readonly<{
      readonly blockerCodes: readonly string[];
      readonly claimedCount: number;
      readonly completedCount: number;
      readonly deadLetterCount: number;
      readonly drained: boolean;
      readonly durationMs: number;
      readonly errorMessage?: string;
      readonly expiredLeaseDeadLetterCount: number;
      readonly leaseRenewalCount: number;
      readonly outcome: WorkerPassOutcome;
      readonly passNumber: number;
      readonly retryCount: number;
      readonly startedAt: string;
      readonly summary: string;
      readonly timedOut: boolean;
    }>;
  }>,
): BwsPrivatePaperWorkerManagedServiceState {
  const counters = nextCounters(state.runtime.counters, update.pass);
  const runtime: BwsPrivatePaperWorkerServiceRuntimeState = Object.freeze({
    counters,
    lastPass: Object.freeze({
      blockerCodes: update.pass.blockerCodes,
      claimedCount: update.pass.claimedCount,
      completedAt: update.completedAt,
      completedCount: update.pass.completedCount,
      deadLetterCount: update.pass.deadLetterCount,
      drained: update.pass.drained,
      durationMs: update.durationMs,
      ...(update.pass.errorMessage === undefined ? {} : { errorMessage: update.pass.errorMessage }),
      expiredLeaseDeadLetterCount: update.pass.expiredLeaseDeadLetterCount,
      leaseRenewalCount: update.pass.leaseRenewalCount,
      outcome: update.pass.outcome,
      passNumber: update.pass.passNumber,
      retryCount: update.pass.retryCount,
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
  state: BwsPrivatePaperWorkerManagedServiceState,
  updatedAt: string,
  signal: BwsSignal | undefined,
): BwsPrivatePaperWorkerManagedServiceState {
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
  counters: BwsPrivatePaperWorkerServiceCounters,
  pass: Readonly<{
    readonly claimedCount: number;
    readonly completedCount: number;
    readonly deadLetterCount: number;
    readonly expiredLeaseDeadLetterCount: number;
    readonly leaseRenewalCount: number;
    readonly outcome: WorkerPassOutcome;
    readonly retryCount: number;
  }>,
): BwsPrivatePaperWorkerServiceCounters {
  return Object.freeze({
    blockedCount: counters.blockedCount + (pass.outcome === 'blocked' ? 1 : 0),
    claimedCount: counters.claimedCount + pass.claimedCount,
    completedCount: counters.completedCount + pass.completedCount,
    consecutiveNonSuccessCount: pass.outcome === 'processed' || pass.outcome === 'idle'
      ? 0
      : counters.consecutiveNonSuccessCount + 1,
    deadLetterCount: counters.deadLetterCount + pass.deadLetterCount,
    expiredLeaseDeadLetterCount: counters.expiredLeaseDeadLetterCount + pass.expiredLeaseDeadLetterCount,
    failureCount: counters.failureCount + (pass.outcome === 'failure' ? 1 : 0),
    idlePassCount: counters.idlePassCount + (pass.outcome === 'idle' ? 1 : 0),
    leaseRenewalCount: counters.leaseRenewalCount + pass.leaseRenewalCount,
    processedPassCount: counters.processedPassCount + (pass.outcome === 'processed' ? 1 : 0),
    retryCount: counters.retryCount + pass.retryCount,
    totalPassCount: counters.totalPassCount + 1,
  });
}

function buildRunningState(
  context: ReturnType<typeof createContext>,
  process: BwsPrivatePaperWorkerManagedProcess,
  existingState: BwsPrivatePaperWorkerManagedServiceState | undefined,
  startedAt: string,
): BwsPrivatePaperWorkerManagedServiceState {
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
    schema: BWS_PRIVATE_PAPER_WORKER_SERVICE_STATE_SCHEMA,
    service: 'private_paper_worker',
    sourceFingerprints: context.sourceFingerprints,
    stateRecordedAt: startedAt,
  });
}

function createCommandResult(
  context: ReturnType<typeof createContext>,
  state: BwsPrivatePaperWorkerManagedServiceState,
  command: 'run' | 'status',
  outcome: BwsPrivatePaperWorkerServiceCommandResult['outcome'],
  process:
    | BwsPrivatePaperWorkerManagedProcess
    | Readonly<{
        readonly ownership: 'missing';
      }>,
): BwsPrivatePaperWorkerServiceCommandResult {
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
    runtimeId: state.runtimeId,
    service: 'private_paper_worker',
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
    sourceFingerprints: context.sourceFingerprints,
  });
}

function createMissingStateStatusResult(
  context: ReturnType<typeof createContext>,
): BwsPrivatePaperWorkerServiceCommandResult {
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
    runtimeId: context.runtimeId,
    service: 'private_paper_worker',
    stateFile: relative(context.paths.repositoryRoot, context.paths.stateFilePath),
    sourceFingerprints: context.sourceFingerprints,
  });
}

function writeEvidence(
  context: ReturnType<typeof createContext>,
  event: ServiceEvidenceEvent,
  result: BwsPrivatePaperWorkerServiceCommandResult,
): void {
  const filePath = resolve(context.paths.repositoryRoot, result.evidenceFile);
  writeEvidenceRecord(filePath, {
    ...result,
    event,
    repositoryRoot: context.paths.repositoryRoot,
    schema: BWS_PRIVATE_PAPER_WORKER_SERVICE_EVIDENCE_SCHEMA,
  });
  registerBwsEvidenceArtifact({
    artifactPath: filePath,
    artifactSchema: BWS_PRIVATE_PAPER_WORKER_SERVICE_EVIDENCE_SCHEMA,
    createdAt: result.generatedAt,
    repositoryRoot: context.paths.repositoryRoot,
    retentionClass: 'runtime',
    runtimeId: result.runtimeId,
    sourceFingerprint: context.sourceFingerprints.sourceManifestSha256,
  });
  createBwsStructuredLogger({
    processIdentity: createBwsStructuredProcessIdentity('bws-private-paper-worker-service', context.paths.repositoryRoot, result.generatedAt),
    repositoryRoot: context.paths.repositoryRoot,
    runtimeId: result.runtimeId,
  }).write({
    details: Object.freeze({
      command: result.command,
      counters: result.counters,
      event,
      lifecycleState: result.lifecycleState,
      outcome: result.outcome,
      queueName: context.configuration.queueName,
    }),
    eventCode: event,
    serviceRole: 'private_paper_worker',
    timestamp: result.generatedAt,
  });
}

function resolvePaths(
  repositoryRoot: string,
  runtimeStateDirectory: string,
): BwsPrivatePaperWorkerServicePaths {
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
): BwsPrivatePaperWorkerManagedServiceState | undefined {
  if (!existsSync(stateFilePath)) {
    return undefined;
  }
  const parsed = requireObject(JSON.parse(readFileSync(stateFilePath, 'utf-8')), stateFilePath) as Partial<
    BwsPrivatePaperWorkerManagedServiceState
  >;
  if (parsed.schema !== BWS_PRIVATE_PAPER_WORKER_SERVICE_STATE_SCHEMA) {
    throw new Error(`Unexpected private-paper worker service state schema in ${stateFilePath}.`);
  }
  if (parsed.service !== 'private_paper_worker') {
    throw new Error(`Unexpected private-paper worker service type in ${stateFilePath}.`);
  }
  return parsed as BwsPrivatePaperWorkerManagedServiceState;
}

function writeServiceState(
  stateFilePath: string,
  state: BwsPrivatePaperWorkerManagedServiceState,
): void {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  const temporaryPath = `${stateFilePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, stateFilePath);
}

function resolveRuntimeId(): string {
  const candidate = process.env[BWS_OBSERVABILITY_RUNTIME_ID_ENV];
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return `${Date.now()}-${process.pid}-private-paper-worker`;
}

function writeEvidenceRecord(
  filePath: string,
  record: BwsPrivatePaperWorkerEvidenceRecord,
): void {
  if (existsSync(filePath)) {
    throw new Error(`Private-paper worker service evidence file already exists: ${filePath}`);
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
}

function resolveEvidenceFilePath(
  paths: BwsPrivatePaperWorkerServicePaths,
  generatedAt: string,
  command: BwsPrivatePaperWorkerServiceCommandResult['command'],
  outcome: BwsPrivatePaperWorkerServiceCommandResult['outcome'],
): string {
  const timestamp = generatedAt.replace(/[:.]/g, '').replace(/-/g, '');
  return join(paths.evidenceDirectory, `${timestamp}-${command}-${outcome}.json`);
}

function redactBwsPrivatePaperWorkerServiceConfig(
  config: BwsPrivatePaperWorkerServiceConfig,
): RedactedBwsPrivatePaperWorkerServiceConfig {
  return Object.freeze({
    intervalMs: config.intervalMs,
    maxJobsPerPass: config.maxJobsPerPass,
    maxRetryBackoffMs: config.maxRetryBackoffMs,
    passTimeoutMs: config.passTimeoutMs,
    queueName: config.runtimeConfig.worker.queueName,
    repositoryRoot: config.repositoryRoot,
    retryBackoffMs: config.retryBackoffMs,
    upstream: Object.freeze({
      commitSha: config.runtimeConfig.upstream.lock.commitSha,
      contractAlias: config.runtimeConfig.upstream.lock.contractAlias,
      contractSchema: config.runtimeConfig.upstream.lock.contractSchema,
      gitTreeSha: config.runtimeConfig.upstream.lock.gitTreeSha,
      lockPath: config.runtimeConfig.upstream.lockPath,
      repository: config.runtimeConfig.upstream.lock.repository,
      repositoryPath: config.runtimeConfig.upstream.lock.repositoryPath,
      sourceView: config.runtimeConfig.upstream.lock.sourceView,
      surebetProfile: config.runtimeConfig.upstream.lock.surebetProfile,
      trackedTreeListingSha256: config.runtimeConfig.upstream.lock.trackedTreeListingSha256,
      verifiedAt: config.runtimeConfig.upstream.lock.verifiedAt,
    }),
    worker: config.runtimeConfig.worker,
  });
}

function collectSourceFingerprints(
  repositoryRoot: string,
  config: BwsPrivatePaperWorkerServiceConfig,
): BwsPrivatePaperWorkerServiceSourceFingerprints {
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
    upstreamCommitSha: config.runtimeConfig.upstream.lock.commitSha,
    upstreamGitTreeSha: config.runtimeConfig.upstream.lock.gitTreeSha,
    upstreamTrackedTreeListingSha256: config.runtimeConfig.upstream.lock.trackedTreeListingSha256,
  });
}

function createDefaultProcessRuntime(): BwsPrivatePaperWorkerProcessRuntime {
  return Object.freeze({
    createProcessRecord(input: Readonly<{
      readonly commandCwd: string;
      readonly entryPointPath: string;
      readonly processName: 'bws-private-paper-worker-service';
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
    inspectProcess(processRecord: BwsPrivatePaperWorkerManagedProcess) {
      return inspectManagedProcess(processRecord);
    },
  });
}

function inspectManagedProcess(
  processRecord: BwsPrivatePaperWorkerManagedProcess,
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

function createDefaultSignalRegistrar(): BwsPrivatePaperWorkerSignalRegistrar {
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

function emptyCounters(): BwsPrivatePaperWorkerServiceCounters {
  return Object.freeze({
    blockedCount: 0,
    claimedCount: 0,
    completedCount: 0,
    consecutiveNonSuccessCount: 0,
    deadLetterCount: 0,
    expiredLeaseDeadLetterCount: 0,
    failureCount: 0,
    idlePassCount: 0,
    leaseRenewalCount: 0,
    processedPassCount: 0,
    retryCount: 0,
    totalPassCount: 0,
  });
}

function assertStateMatchesRepository(
  state: BwsPrivatePaperWorkerManagedServiceState,
  repositoryRoot: string,
): void {
  if (state.repositoryRoot !== repositoryRoot) {
    throw new Error('Private-paper worker service state belongs to a different repository root.');
  }
}

function assertConfigFingerprintMatches(
  state: BwsPrivatePaperWorkerManagedServiceState,
  configFingerprint: string,
): void {
  if (state.configFingerprint !== configFingerprint) {
    throw new Error(
      'Private-paper worker service configuration fingerprint does not match the recorded state.',
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
