import { createServer as createNodeHttpServer, type Server as NodeHttpServer } from 'node:http';
import {
  createBwsReadOnlyQueryHttpHandler,
} from '../api/bws-read-only-query-http.js';
import {
  createBwsReadOnlyQueryService,
  describeBwsReadOnlyQueryServiceBoundary,
  type BwsReadOnlyQueryDependencies,
  type BwsReadOnlyQueryService,
} from '../api/bws-read-only-query-service.js';
import {
  type BoundaryResult,
} from '../contracts/local-types.js';
import {
  createBwsOperationalStatusSnapshot,
  resolveBwsServiceRuntimeConfig,
  type BwsOperationalStatusSnapshot,
  type BwsProcessDefinition,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
} from './service-runtime.js';
import {
  runBoundedWorkerPass,
  type BoundedWorkerJobHandler,
  type BoundedWorkerPassResult,
} from '../workers/bounded-job-worker.js';
import {
  createPrivatePaperRuntimeJobHandler,
} from '../workers/private-paper-runtime-jobs.js';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamApiConvergenceRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  applySurebetMigrations,
  type ApplySurebetMigrationsOptions,
} from '../../../persistence/src/index.js';

const DEFAULT_API_QUERY_MAX_PAGE_SIZE = 25;
const DEFAULT_WORKER_MAX_JOBS = 128;
const DEFAULT_STRATEGY_EVIDENCE_POLICY = Object.freeze({
  liveState: 'not_claimed',
  privacy: 'private_only',
  profitabilityState: 'not_reported',
  publicDistributionState: 'withheld',
});

type BwsRuntimeEventKind =
  | 'api_started'
  | 'api_shutdown_completed'
  | 'api_shutdown_requested'
  | 'worker_completed'
  | 'worker_shutdown_requested'
  | 'worker_started';

type BwsSignal = 'SIGINT' | 'SIGTERM';

export interface BwsRuntimeProcessIdentity {
  readonly nodeVersion: string;
  readonly pid: number;
  readonly ppid: number;
  readonly processName: string;
  readonly repositoryRoot: string;
  readonly startedAt: string;
}

export interface BwsRuntimeLogEvent {
  readonly configSummary?: Readonly<{
    readonly apiPort?: number;
    readonly queueName?: string;
    readonly workerId?: string;
  }>;
  readonly event: BwsRuntimeEventKind;
  readonly finishedAt?: string;
  readonly passResult?: BoundedWorkerPassResult;
  readonly processIdentity: BwsRuntimeProcessIdentity;
  readonly signal?: BwsSignal;
  readonly startedAt: string;
}

export interface BwsRuntimeLogger {
  write(event: BwsRuntimeLogEvent): void;
}

export interface BwsRuntimeSignalRegistrar {
  register(signal: BwsSignal, handler: () => void): () => void;
}

export interface StartBwsReadOnlyApiApplicationRequest {
  readonly applyMigrations?: typeof applySurebetMigrations;
  readonly config?: BwsServiceRuntimeConfig;
  readonly cockpitProcessDefinition: BwsProcessDefinition;
  readonly environment?: BwsServiceRuntimeEnvironment;
  readonly logger?: BwsRuntimeLogger;
  readonly now?: () => string;
  readonly queryDependencies?: BwsReadOnlyQueryDependencies;
  readonly queryService?: BwsReadOnlyQueryService;
  readonly repositoryRoot?: string;
  readonly signalRegistrar?: BwsRuntimeSignalRegistrar;
  readonly startHttpServer?: (listener: Parameters<typeof createNodeHttpServer>[0]) => NodeHttpServer;
}

export interface BwsReadOnlyApiApplicationHandle {
  readonly closed: Promise<void>;
  readonly config: BwsServiceRuntimeConfig;
  readonly processIdentity: BwsRuntimeProcessIdentity;
  readonly queryService: BwsReadOnlyQueryService;
  readonly server: NodeHttpServer;
  close(signal?: BwsSignal): Promise<void>;
}

export interface RunBwsWorkerApplicationRequest {
  readonly applyMigrations?: typeof applySurebetMigrations;
  readonly config?: BwsServiceRuntimeConfig;
  readonly createJobHandler?: (handler: Parameters<typeof createPrivatePaperRuntimeJobHandler>[0]) => BoundedWorkerJobHandler;
  readonly environment?: BwsServiceRuntimeEnvironment;
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
  readonly logger?: BwsRuntimeLogger;
  readonly maxJobs?: number;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly runWorkerPass?: (request: Parameters<typeof runBoundedWorkerPass>[0]) => Promise<BoundaryResult<BoundedWorkerPassResult>>;
  readonly signalRegistrar?: BwsRuntimeSignalRegistrar;
  readonly strategyLedger?: Pick<SurebetStrategyLedgerRepository, 'create'>;
  readonly upstreamLocks?: Pick<SurebetUpstreamLockRepository, 'get'>;
}

export interface BwsWorkerApplicationResult {
  readonly config: BwsServiceRuntimeConfig;
  readonly passResult: BoundedWorkerPassResult;
  readonly processIdentity: BwsRuntimeProcessIdentity;
  readonly shutdownSignal?: BwsSignal;
}

export async function startBwsReadOnlyApiApplication(
  request: StartBwsReadOnlyApiApplicationRequest,
): Promise<BwsReadOnlyApiApplicationHandle> {
  const repositoryRoot = request.repositoryRoot ?? process.cwd();
  const now = request.now ?? defaultNow;
  const startedAt = now();
  const config = request.config ?? resolveBwsServiceRuntimeConfig(request.environment, repositoryRoot);
  const processIdentity = createProcessIdentity('bws-read-only-api', repositoryRoot, startedAt);
  const logger = request.logger ?? createJsonLineLogger();

  (request.applyMigrations ?? applySurebetMigrations)(config.persistence, createMigrationOptions(repositoryRoot));

  const queryDependencies = request.queryDependencies ?? createReadOnlyQueryDependencies(config);
  const queryService = request.queryService ?? requireAccepted(
    createBwsReadOnlyQueryService(queryDependencies, {
      generatedAt: now,
      maxPageSize: DEFAULT_API_QUERY_MAX_PAGE_SIZE,
    }),
    'BWS API runtime failed to build the validated read-only query service.',
  );
  const server = (request.startHttpServer ?? createNodeHttpServer)(
    createBwsReadOnlyQueryHttpHandler(queryService, {
      getOperationalStatusSnapshot: () =>
        buildOperationalStatusSnapshot(
          config,
          request.cockpitProcessDefinition,
          now,
        ),
    }),
  );

  await listenLoopback(server, config.api.port, config.api.bindHost);

  const signalDisposers: Array<() => void> = [];
  let closed = false;
  let closePromise: Promise<void> | undefined;

  const close = async (signal?: BwsSignal): Promise<void> => {
    if (closePromise !== undefined) {
      return closePromise;
    }
    if (signal !== undefined) {
      logger.write({
        configSummary: Object.freeze({ apiPort: config.api.port }),
        event: 'api_shutdown_requested',
        processIdentity,
        signal,
        startedAt,
      });
    }

    closePromise = (async () => {
      for (const dispose of signalDisposers) {
        dispose();
      }
      signalDisposers.length = 0;
      if (!closed) {
        await closeHttpServer(server);
        closed = true;
      }
      logger.write({
        configSummary: Object.freeze({ apiPort: config.api.port }),
        event: 'api_shutdown_completed',
        finishedAt: now(),
        processIdentity,
        ...(signal === undefined ? {} : { signal }),
        startedAt,
      });
    })();

    return closePromise;
  };

  const signalRegistrar = request.signalRegistrar ?? defaultSignalRegistrar();
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    signalDisposers.push(signalRegistrar.register(signal, () => {
      void close(signal);
    }));
  }

  logger.write({
    configSummary: Object.freeze({ apiPort: config.api.port }),
    event: 'api_started',
    processIdentity,
    startedAt,
  });

  return Object.freeze({
    closed: new Promise<void>((resolve) => {
      server.once('close', () => {
        closed = true;
        resolve();
      });
    }),
    close,
    config,
    processIdentity,
    queryService,
    server,
  });
}

export async function runBwsWorkerApplication(
  request: RunBwsWorkerApplicationRequest = {},
): Promise<BwsWorkerApplicationResult> {
  const repositoryRoot = request.repositoryRoot ?? process.cwd();
  const now = request.now ?? defaultNow;
  const startedAt = now();
  const config = request.config ?? resolveBwsServiceRuntimeConfig(request.environment, repositoryRoot);
  const processIdentity = createProcessIdentity('bws-private-paper-worker', repositoryRoot, startedAt);
  const logger = request.logger ?? createJsonLineLogger();

  (request.applyMigrations ?? applySurebetMigrations)(config.persistence, createMigrationOptions(repositoryRoot));

  let shutdownSignal: BwsSignal | undefined;
  const signalDisposers: Array<() => void> = [];
  const signalRegistrar = request.signalRegistrar ?? defaultSignalRegistrar();
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    signalDisposers.push(signalRegistrar.register(signal, () => {
      shutdownSignal = signal;
      logger.write({
        configSummary: Object.freeze({
          queueName: config.worker.queueName,
          workerId: config.worker.workerId,
        }),
        event: 'worker_shutdown_requested',
        processIdentity,
        signal,
        startedAt,
      });
    }));
  }

  logger.write({
    configSummary: Object.freeze({
      queueName: config.worker.queueName,
      workerId: config.worker.workerId,
    }),
    event: 'worker_started',
    processIdentity,
    startedAt,
  });

  try {
    const upstreamLocks = request.upstreamLocks ?? new SurebetUpstreamLockRepository(config.persistence);
    const strategyLedger = request.strategyLedger ?? new SurebetStrategyLedgerRepository(config.persistence);
    const jobs = request.jobs ?? new SurebetWorkerJobRepository(config.persistence);
    const handler = (request.createJobHandler ?? createPrivatePaperRuntimeJobHandler)({
      strategyLedger,
      upstreamLocks,
    });
    const passResult = requireAccepted(
      await (request.runWorkerPass ?? runBoundedWorkerPass)({
        handlers: Object.freeze({
          private_paper_runtime_cycle_v1: handler,
        }),
        jobs,
        leaseDurationMs: config.worker.leaseDurationMs,
        maxJobs: request.maxJobs ?? DEFAULT_WORKER_MAX_JOBS,
        now,
        queueName: config.worker.queueName,
        workerId: config.worker.workerId,
      }),
      'BWS worker runtime failed to complete the bounded worker pass.',
    );

    logger.write({
      configSummary: Object.freeze({
        queueName: config.worker.queueName,
        workerId: config.worker.workerId,
      }),
      event: 'worker_completed',
      finishedAt: now(),
      passResult,
      processIdentity,
      ...(shutdownSignal === undefined ? {} : { signal: shutdownSignal }),
      startedAt,
    });

    return Object.freeze({
      config,
      passResult,
      processIdentity,
      ...(shutdownSignal === undefined ? {} : { shutdownSignal }),
    });
  } finally {
    for (const dispose of signalDisposers) {
      dispose();
    }
  }
}

function buildOperationalStatusSnapshot(
  config: BwsServiceRuntimeConfig,
  cockpitProcessDefinition: BwsProcessDefinition,
  now: () => string,
): BwsOperationalStatusSnapshot {
  return requireAccepted(
    createBwsOperationalStatusSnapshot({
      cockpitProcessDefinition,
      config,
      generatedAt: now(),
      queryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
      strategyEvidencePolicy: DEFAULT_STRATEGY_EVIDENCE_POLICY,
      workerHandlerKinds: ['private_paper_runtime_cycle_v1'],
    }),
    'BWS API runtime failed to build an operational status snapshot.',
  );
}

function createProcessIdentity(
  processName: string,
  repositoryRoot: string,
  startedAt: string,
): BwsRuntimeProcessIdentity {
  return Object.freeze({
    nodeVersion: process.version,
    pid: process.pid,
    ppid: process.ppid,
    processName,
    repositoryRoot,
    startedAt,
  });
}

function createMigrationOptions(repositoryRoot: string): ApplySurebetMigrationsOptions {
  return Object.freeze({
    repositoryRoot,
  });
}

function createReadOnlyQueryDependencies(
  config: BwsServiceRuntimeConfig,
): BwsReadOnlyQueryDependencies {
  return Object.freeze({
    importRuns: new SurebetImportRunRepository(config.persistence),
    pinnedStrategyExports: new SurebetPinnedStrategyExportRepository(config.persistence),
    privatePaperSchedulerCheckpoints: new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(config.persistence),
    strategyLedger: new SurebetStrategyLedgerRepository(config.persistence),
    upstreamApiCheckpoints: new SurebetUpstreamApiConvergenceRepository(config.persistence),
    upstreamLocks: new SurebetUpstreamLockRepository(config.persistence),
    workerJobs: new SurebetWorkerJobRepository(config.persistence),
  });
}

function createJsonLineLogger(stream: NodeJS.WriteStream = process.stdout): BwsRuntimeLogger {
  return Object.freeze({
    write(event: BwsRuntimeLogEvent) {
      stream.write(`${JSON.stringify(event)}\n`);
    },
  });
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultSignalRegistrar(): BwsRuntimeSignalRegistrar {
  return Object.freeze({
    register(signal: BwsSignal, handler: () => void) {
      process.on(signal, handler);
      return () => {
        process.off(signal, handler);
      };
    },
  });
}

function requireAccepted<T>(result: BoundaryResult<T>, message: string): T {
  if (!result.ok) {
    throw new Error(`${message} ${result.blockers.map((blocker) => blocker.message).join(' ')}`.trim());
  }
  return result.value;
}

async function listenLoopback(server: NodeHttpServer, port: number, host: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      server.off('listening', handleListening);
      reject(error);
    };
    const handleListening = () => {
      server.off('error', handleError);
      resolve();
    };
    server.once('error', handleError);
    server.once('listening', handleListening);
    server.listen(port, host);
  });
}

async function closeHttpServer(server: NodeHttpServer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
