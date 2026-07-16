import { createHash } from 'node:crypto';
import {
  createServer as createNodeHttpServer,
  type IncomingMessage,
  type Server as NodeHttpServer,
  type ServerResponse,
} from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
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
  type BwsCockpitOperationalState,
  resolveBwsServiceRuntimeConfig,
  type BwsOperationalStatusSnapshot,
  type BwsProcessDefinition,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
} from './service-runtime.js';
import {
  createBwsApiRequestMetricsCollector,
  createBwsMetricsSnapshot,
  createBwsStructuredLogger,
  type BwsApiRequestMetricsCollector,
} from './observability.js';
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
const DEFAULT_COCKPIT_BUILD_DIRECTORY = 'dist/apps/web';
const DEFAULT_WORKER_MAX_JOBS = 128;
const DEFAULT_STRATEGY_EVIDENCE_POLICY = Object.freeze({
  liveState: 'not_claimed',
  privacy: 'private_only',
  profitabilityState: 'not_reported',
  publicDistributionState: 'withheld',
});
const COCKPIT_BUILD_METADATA_FILE = 'bws-cockpit-build.json';
const COCKPIT_BUILD_METADATA_SCHEMA = 'bws.operator_cockpit_build.v1';

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
  readonly cockpitBuildDirectory?: string;
  readonly config?: BwsServiceRuntimeConfig;
  readonly cockpitProcessDefinition: BwsProcessDefinition;
  readonly environment?: BwsServiceRuntimeEnvironment;
  readonly logger?: BwsRuntimeLogger;
  readonly metricsCollector?: BwsApiRequestMetricsCollector;
  readonly metricsSnapshotFactory?: () => unknown;
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

interface BwsManagedCockpitBuildMetadata {
  readonly apiBaseUrl?: unknown;
  readonly dataMode?: unknown;
  readonly schema?: unknown;
}

export async function startBwsReadOnlyApiApplication(
  request: StartBwsReadOnlyApiApplicationRequest,
): Promise<BwsReadOnlyApiApplicationHandle> {
  const repositoryRoot = request.repositoryRoot ?? process.cwd();
  const now = request.now ?? defaultNow;
  const startedAt = now();
  const config = request.config ?? resolveBwsServiceRuntimeConfig(request.environment, repositoryRoot);
  const runtimeBaseUrl = `http://${config.api.bindHost}:${config.api.port}`;
  const cockpitBuildDirectory = resolve(repositoryRoot, request.cockpitBuildDirectory ?? DEFAULT_COCKPIT_BUILD_DIRECTORY);
  const processIdentity = createProcessIdentity('bws-read-only-api', repositoryRoot, startedAt);
  const logger = request.logger ?? createJsonLineLogger();
  const structuredLogger = request.logger === undefined
    ? createBwsStructuredLogger({
      processIdentity,
      repositoryRoot,
    })
    : undefined;
  const metricsCollector = request.metricsCollector ?? createBwsApiRequestMetricsCollector();
  const readCockpitState = () => inspectManagedCockpitBuild({
    cockpitBuildDirectory,
    repositoryRoot,
    runtimeBaseUrl,
  });
  assertCockpitStateReady(readCockpitState());

  (request.applyMigrations ?? applySurebetMigrations)(config.persistence, createMigrationOptions(repositoryRoot));

  const queryDependencies = request.queryDependencies ?? createReadOnlyQueryDependencies(config);
  const queryService = request.queryService ?? requireAccepted(
    createBwsReadOnlyQueryService(queryDependencies, {
      generatedAt: now,
      maxPageSize: DEFAULT_API_QUERY_MAX_PAGE_SIZE,
    }),
    'BWS API runtime failed to build the validated read-only query service.',
  );
  const apiHandler = createBwsReadOnlyQueryHttpHandler(queryService, {
    getOperationalStatusSnapshot: () =>
      buildOperationalStatusSnapshot(
        config,
        request.cockpitProcessDefinition,
        readCockpitState(),
        now,
      ),
  });
  const server = (request.startHttpServer ?? createNodeHttpServer)(
    createManagedRuntimeRequestHandler(
      apiHandler,
      cockpitBuildDirectory,
      metricsCollector,
      request.metricsSnapshotFactory ?? (() =>
        createBwsMetricsSnapshot({
          apiRequestMetrics: metricsCollector.snapshot(),
          config,
          cockpitState: readCockpitState(),
          generatedAt: now(),
          repositoryRoot,
          runtimeId: structuredLogger?.runtimeId ?? 'api-runtime',
        })),
    ),
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
      emitRuntimeEvent(logger, structuredLogger, {
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
      emitRuntimeEvent(logger, structuredLogger, {
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

  emitRuntimeEvent(logger, structuredLogger, {
    configSummary: Object.freeze({ apiPort: config.api.port }),
    event: 'api_started',
    processIdentity,
    startedAt,
  });
  structuredLogger?.write({
    details: Object.freeze({
      apiBaseUrl: runtimeBaseUrl,
      assetFingerprint: readCockpitState().assetFingerprint ?? 'missing',
      buildDirectory: readCockpitState().buildDirectory,
      status: readCockpitState().status,
    }),
    eventCode: 'cockpit_ready',
    serviceRole: 'cockpit',
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
      emitRuntimeEvent(logger, undefined, {
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

  emitRuntimeEvent(logger, undefined, {
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

    emitRuntimeEvent(logger, undefined, {
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
  cockpitState: BwsCockpitOperationalState,
  now: () => string,
): BwsOperationalStatusSnapshot {
  return requireAccepted(
    createBwsOperationalStatusSnapshot({
      cockpitState,
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

function inspectManagedCockpitBuild(request: Readonly<{
  readonly cockpitBuildDirectory: string;
  readonly repositoryRoot: string;
  readonly runtimeBaseUrl: string;
}>): BwsCockpitOperationalState {
  const buildDirectory = relative(request.repositoryRoot, request.cockpitBuildDirectory);
  if (!existsSync(request.cockpitBuildDirectory) || !statSync(request.cockpitBuildDirectory).isDirectory()) {
    return Object.freeze({
      blocker: Object.freeze({
        code: 'BWS_COCKPIT_BUILD_DIRECTORY_MISSING',
        evidenceRequired: 'A built operator cockpit under dist/apps/web with explicit api-mode metadata.',
        message: `Managed cockpit build directory is missing: ${buildDirectory}.`,
      }),
      buildDirectory,
      status: 'blocked',
    });
  }

  const entryDocumentPath = join(request.cockpitBuildDirectory, 'index.html');
  if (!existsSync(entryDocumentPath) || !statSync(entryDocumentPath).isFile()) {
    return Object.freeze({
      blocker: Object.freeze({
        code: 'BWS_COCKPIT_INDEX_MISSING',
        evidenceRequired: 'A built operator cockpit index.html generated by the web workspace build.',
        message: `Managed cockpit entry document is missing: ${relative(request.repositoryRoot, entryDocumentPath)}.`,
      }),
      buildDirectory,
      status: 'blocked',
    });
  }

  const metadataPath = join(request.cockpitBuildDirectory, COCKPIT_BUILD_METADATA_FILE);
  if (!existsSync(metadataPath) || !statSync(metadataPath).isFile()) {
    return Object.freeze({
      blocker: Object.freeze({
        code: 'BWS_COCKPIT_BUILD_METADATA_MISSING',
        evidenceRequired: `A ${COCKPIT_BUILD_METADATA_FILE} file describing the explicit cockpit build mode and loopback API base URL.`,
        message: `Managed cockpit build metadata is missing: ${relative(request.repositoryRoot, metadataPath)}.`,
      }),
      buildDirectory,
      entryDocumentPath: relative(request.repositoryRoot, entryDocumentPath),
      status: 'blocked',
    });
  }

  const metadata = readCockpitBuildMetadata(metadataPath);
  if (metadata.schema !== COCKPIT_BUILD_METADATA_SCHEMA) {
    return Object.freeze({
      blocker: Object.freeze({
        code: 'BWS_COCKPIT_BUILD_METADATA_SCHEMA_INVALID',
        evidenceRequired: `The exact ${COCKPIT_BUILD_METADATA_SCHEMA} build metadata schema.`,
        message: `Managed cockpit build metadata schema is invalid in ${relative(request.repositoryRoot, metadataPath)}.`,
      }),
      buildDirectory,
      entryDocumentPath: relative(request.repositoryRoot, entryDocumentPath),
      status: 'blocked',
    });
  }
  if (metadata.dataMode !== 'api') {
    return Object.freeze({
      blocker: Object.freeze({
        code: 'BWS_COCKPIT_DATA_MODE_INVALID',
        evidenceRequired: 'A cockpit build produced with VITE_BWS_COCKPIT_DATA_MODE=api.',
        message: `Managed cockpit build must use explicit api mode. Received ${String(metadata.dataMode)}.`,
      }),
      buildDirectory,
      entryDocumentPath: relative(request.repositoryRoot, entryDocumentPath),
      status: 'blocked',
    });
  }
  if (metadata.apiBaseUrl !== request.runtimeBaseUrl) {
    return Object.freeze({
      ...(metadata.apiBaseUrl === undefined ? {} : { apiBaseUrl: metadata.apiBaseUrl }),
      blocker: Object.freeze({
        code: 'BWS_COCKPIT_API_BASE_URL_MISMATCH',
        evidenceRequired: `A cockpit build whose explicit API base URL matches ${request.runtimeBaseUrl}.`,
        message: `Managed cockpit build targets ${String(metadata.apiBaseUrl)} but the runtime serves ${request.runtimeBaseUrl}.`,
      }),
      buildDirectory,
      dataMode: 'api',
      entryDocumentPath: relative(request.repositoryRoot, entryDocumentPath),
      status: 'blocked',
    });
  }

  return Object.freeze({
    apiBaseUrl: metadata.apiBaseUrl,
    assetFingerprint: computeDirectoryFingerprint(request.cockpitBuildDirectory),
    buildDirectory,
    dataMode: 'api',
    entryDocumentPath: relative(request.repositoryRoot, entryDocumentPath),
    status: 'ready',
  });
}

function readCockpitBuildMetadata(metadataPath: string): Readonly<{
  readonly apiBaseUrl?: string;
  readonly dataMode?: 'api' | 'mock';
  readonly schema?: string;
}> {
  const parsed = JSON.parse(readFileSync(metadataPath, 'utf-8')) as BwsManagedCockpitBuildMetadata;
  return Object.freeze({
    ...(typeof parsed.apiBaseUrl === 'string' ? { apiBaseUrl: parsed.apiBaseUrl } : {}),
    ...(parsed.dataMode === 'api' || parsed.dataMode === 'mock' ? { dataMode: parsed.dataMode } : {}),
    ...(typeof parsed.schema === 'string' ? { schema: parsed.schema } : {}),
  });
}

function assertCockpitStateReady(cockpitState: BwsCockpitOperationalState): void {
  if (cockpitState.status === 'ready') {
    return;
  }
  throw new Error(cockpitState.blocker?.message ?? 'Managed cockpit readiness is blocked.');
}

function createManagedRuntimeRequestHandler(
  apiHandler: (request: IncomingMessage, response: ServerResponse<IncomingMessage>) => Promise<void>,
  cockpitBuildDirectory: string,
  metricsCollector: BwsApiRequestMetricsCollector,
  getMetricsSnapshot: () => unknown,
): (request: IncomingMessage, response: ServerResponse<IncomingMessage>) => Promise<void> {
  return async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = trimTrailingSlash(requestUrl.pathname);
    if (pathname === '/health' || pathname === '/readiness' || pathname.startsWith('/api/')) {
      const kind = pathname === '/health'
        ? 'health'
        : pathname === '/readiness'
          ? 'readiness'
          : 'api';
      await recordManagedRequestMetrics(metricsCollector, kind, response, async () => {
        await apiHandler(request, response);
      });
      return;
    }

    if (pathname === '/metrics') {
      await recordManagedRequestMetrics(metricsCollector, 'metrics', response, async () => {
        response.statusCode = 200;
        applyManagedCockpitHeaders(response, 'application/json; charset=utf-8');
        response.end(`${JSON.stringify(getMetricsSnapshot())}\n`);
      });
      return;
    }

    if (request.method !== 'GET') {
      await recordManagedRequestMetrics(metricsCollector, 'cockpit', response, async () => {
        response.setHeader('allow', 'GET');
        response.statusCode = 405;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(`${JSON.stringify({
          error: {
            code: 'BWS_COCKPIT_METHOD_NOT_ALLOWED',
            message: 'Managed cockpit serving accepts only GET requests.',
          },
          ok: false,
        })}\n`);
      });
      return;
    }

    await recordManagedRequestMetrics(metricsCollector, 'cockpit', response, async () => {
      serveManagedCockpitAsset(response, cockpitBuildDirectory, requestUrl.pathname);
    });
  };
}

function serveManagedCockpitAsset(
  response: ServerResponse<IncomingMessage>,
  cockpitBuildDirectory: string,
  pathname: string,
): void {
  const buildDirectory = resolve(cockpitBuildDirectory);
  const entryDocumentPath = join(buildDirectory, 'index.html');
  const candidatePath = resolve(buildDirectory, pathname.slice(1));
  const isInsideBuildDirectory = candidatePath === buildDirectory || candidatePath.startsWith(`${buildDirectory}/`);

  let selectedPath = entryDocumentPath;
  if (pathname !== '/' && isInsideBuildDirectory && existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    selectedPath = candidatePath;
  } else if (pathname !== '/' && pathname.includes('.')) {
    response.statusCode = 404;
    applyManagedCockpitHeaders(response, 'application/json; charset=utf-8');
    response.end(`${JSON.stringify({
      error: {
        code: 'BWS_COCKPIT_ASSET_NOT_FOUND',
        message: 'Managed cockpit asset was not found.',
      },
      ok: false,
    })}\n`);
    return;
  }

  applyManagedCockpitHeaders(response, inferContentType(selectedPath));
  response.statusCode = 200;
  response.end(readFileSync(selectedPath));
}

function applyManagedCockpitHeaders(
  response: ServerResponse<IncomingMessage>,
  contentType: string,
): void {
  response.setHeader('cache-control', 'no-store');
  response.setHeader(
    'content-security-policy',
    "default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
  );
  response.setHeader('permissions-policy', 'camera=(), geolocation=(), microphone=()');
  response.setHeader('referrer-policy', 'no-referrer');
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('x-frame-options', 'DENY');
  response.setHeader('content-type', contentType);
}

function inferContentType(filePath: string): string {
  switch (extname(filePath)) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function computeDirectoryFingerprint(directoryPath: string): string {
  const digest = createHash('sha256');
  for (const filePath of listDirectoryFiles(directoryPath)) {
    digest.update(relative(directoryPath, filePath));
    digest.update('\u0000');
    digest.update(readFileSync(filePath));
    digest.update('\u0000');
  }
  return digest.digest('hex');
}

function listDirectoryFiles(directoryPath: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listDirectoryFiles(entryPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return Object.freeze(files.sort());
}

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
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

function emitRuntimeEvent(
  logger: BwsRuntimeLogger,
  structuredLogger: ReturnType<typeof createBwsStructuredLogger> | undefined,
  event: BwsRuntimeLogEvent,
): void {
  logger.write(event);
  if (structuredLogger === undefined) {
    return;
  }
  const checkpointOrJobId = event.passResult !== undefined && event.passResult.claimedCount > 0
    ? `claimed:${event.passResult.claimedCount}`
    : undefined;
  structuredLogger.write({
    ...(checkpointOrJobId === undefined ? {} : { checkpointOrJobId }),
    details: Object.freeze({
      ...(event.configSummary?.apiPort === undefined ? {} : { apiPort: event.configSummary.apiPort }),
      ...(event.configSummary?.queueName === undefined ? {} : { queueName: event.configSummary.queueName }),
      ...(event.configSummary?.workerId === undefined ? {} : { workerId: event.configSummary.workerId }),
      ...(event.finishedAt === undefined ? {} : { finishedAt: event.finishedAt }),
      ...(event.passResult === undefined ? {} : { claimedCount: event.passResult.claimedCount }),
      ...(event.passResult === undefined ? {} : { completedCount: event.passResult.completedCount }),
      ...(event.passResult === undefined ? {} : { deadLetterCount: event.passResult.deadLetterCount }),
      ...(event.passResult === undefined ? {} : { drained: event.passResult.drained }),
      ...(event.passResult === undefined ? {} : { expiredLeaseDeadLetterCount: event.passResult.expiredLeaseDeadLetterCount }),
      ...(event.passResult === undefined ? {} : { leaseRenewalCount: event.passResult.leaseRenewalCount }),
      ...(event.passResult === undefined ? {} : { retryCount: event.passResult.retryCount }),
      ...(event.signal === undefined ? {} : { signal: event.signal }),
      startedAt: event.startedAt,
    }),
    eventCode: event.event,
    serviceRole: event.event.startsWith('worker_') ? 'private_paper_worker' : 'api',
    timestamp: event.finishedAt ?? event.startedAt,
  });
}

async function recordManagedRequestMetrics(
  collector: BwsApiRequestMetricsCollector,
  kind: keyof ReturnType<BwsApiRequestMetricsCollector['snapshot']>,
  response: ServerResponse<IncomingMessage>,
  action: () => Promise<void>,
): Promise<void> {
  const startedAt = process.hrtime.bigint();
  let bytesWritten = 0;
  const originalWrite = response.write.bind(response);
  const originalEnd = response.end.bind(response);
  response.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding, callback?: (error?: Error | null) => void) => {
    bytesWritten += countChunkBytes(chunk, encoding);
    return originalWrite(chunk as never, encoding as never, callback as never);
  }) as typeof response.write;
  response.end = ((chunk?: string | Uint8Array, encoding?: BufferEncoding, callback?: () => void) => {
    if (chunk !== undefined) {
      bytesWritten += countChunkBytes(chunk, encoding);
    }
    return originalEnd(chunk as never, encoding as never, callback as never);
  }) as typeof response.end;
  try {
    await action();
  } finally {
    response.write = originalWrite;
    response.end = originalEnd;
    collector.record({
      bytesWritten,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
      kind,
      statusCode: response.statusCode,
    });
  }
}

function countChunkBytes(
  chunk: string | Uint8Array,
  encoding?: BufferEncoding,
): number {
  return typeof chunk === 'string'
    ? Buffer.byteLength(chunk, encoding)
    : chunk.byteLength;
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
