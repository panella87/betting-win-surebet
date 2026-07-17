import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import {
  SurebetWorkerJobRepository,
} from '../../../persistence/src/index.js';
import {
  getBwsDatabaseMigrationStatus,
  type BwsMigrationStatusResult,
} from './database-lifecycle.js';
import {
  BWS_API_PORT_ENV,
  BWS_UPSTREAM_LOCK_PATH_ENV,
  BWS_WORKER_ID_ENV,
  BWS_WORKER_LEASE_DURATION_MS_ENV,
  BWS_WORKER_QUEUE_NAME_ENV,
  SUREBET_EXECUTION_ENABLED_ENV,
  SUREBET_PROVIDER_CONNECTIONS_ENV,
  SUREBET_RUNTIME_MODE_ENV,
  resolveBwsServiceRuntimeConfig,
  type BwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
} from './service-runtime.js';

const BWS_STRUCTURED_LOG_ENTRY_SCHEMA = 'bws.structured_log_entry.v1';
const BWS_EVIDENCE_INDEX_ENTRY_SCHEMA = 'bws.evidence_index_entry.v1';
const BWS_EVIDENCE_INDEX_SUMMARY_SCHEMA = 'bws.evidence_index_summary.v1';
const BWS_DIAGNOSTICS_BUNDLE_SCHEMA = 'bws.diagnostics_bundle.v1';
const DEFAULT_OBSERVABILITY_DIRECTORY = 'runtime/bws-observability';
const DEFAULT_LOG_DIRECTORY = 'logs';
const DEFAULT_EVIDENCE_INDEX_DIRECTORY = 'evidence-index';
const DEFAULT_DIAGNOSTICS_DIRECTORY = 'diagnostics';
const DEFAULT_LOG_MAX_BYTES = 256 * 1024;
const DEFAULT_LOG_MAX_FILES = 5;
const DEFAULT_RECENT_ENTRY_LIMIT = 10;
const DEFAULT_HTTP_TIMEOUT_MS = 2_000;
const LOOPBACK_BASE_URL = 'http://127.0.0.1';
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;
const SENSITIVE_KEY_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;
const URL_PATTERN = /^[a-z]+:\/\//i;
const CONFIGURATION_PRESENCE_KEYS = Object.freeze([
  'BETTING_WIN_REPO_PATH',
  BWS_UPSTREAM_LOCK_PATH_ENV,
  'BWS_UPSTREAM_MODE',
  BWS_API_PORT_ENV,
  BWS_WORKER_ID_ENV,
  BWS_WORKER_QUEUE_NAME_ENV,
  BWS_WORKER_LEASE_DURATION_MS_ENV,
  'BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS',
  'BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS',
  'BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH',
  'BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS',
  'BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS',
  SUREBET_RUNTIME_MODE_ENV,
  SUREBET_PROVIDER_CONNECTIONS_ENV,
  SUREBET_EXECUTION_ENABLED_ENV,
  'SUREBET_PG_DATABASE',
  'SUREBET_PG_HOST',
  'SUREBET_PG_SOCKET_DIRECTORY',
  'SUREBET_PG_PORT',
  'SUREBET_PG_USER',
]);

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type BwsStructuredLogLevel = 'error' | 'info' | 'warn';
export type BwsStructuredLogRole =
  | 'api'
  | 'cockpit'
  | 'lifecycle'
  | 'private_paper_scheduler'
  | 'private_paper_worker'
  | 'upstream_convergence';

export type BwsEvidenceRetentionClass =
  | 'backup_restore'
  | 'lifecycle'
  | 'paper'
  | 'recovery'
  | 'release'
  | 'runtime';

export interface BwsStructuredProcessIdentity {
  readonly nodeVersion: string;
  readonly pid: number;
  readonly ppid: number;
  readonly processName: string;
  readonly repositoryRoot: string;
  readonly startedAt: string;
}

export interface BwsStructuredLogRecord {
  readonly checkpointOrJobId?: string;
  readonly details: JsonValue;
  readonly eventCode: string;
  readonly level: BwsStructuredLogLevel;
  readonly processIdentity: BwsStructuredProcessIdentity;
  readonly runtimeId: string;
  readonly schema: typeof BWS_STRUCTURED_LOG_ENTRY_SCHEMA;
  readonly serviceRole: BwsStructuredLogRole;
  readonly timestamp: string;
  readonly upstreamMode?: 'api' | 'export';
}

export interface BwsStructuredLogger {
  readonly runtimeId: string;
  write(input: Readonly<{
    readonly checkpointOrJobId?: string;
    readonly details?: unknown;
    readonly eventCode: string;
    readonly level?: BwsStructuredLogLevel;
    readonly serviceRole: BwsStructuredLogRole;
    readonly timestamp?: string;
  }>): void;
}

export interface BwsEvidenceIndexEntry {
  readonly artifactSchema: string;
  readonly createdAt: string;
  readonly path: string;
  readonly retentionClass: BwsEvidenceRetentionClass;
  readonly runtimeId: string;
  readonly schema: typeof BWS_EVIDENCE_INDEX_ENTRY_SCHEMA;
  readonly sha256: string;
  readonly sourceFingerprint: string;
}

export interface BwsEvidenceIndexSummary {
  readonly entryCount: number;
  readonly lastCreatedAt?: string;
  readonly lastRuntimeId?: string;
  readonly recentEntries: readonly BwsEvidenceIndexEntry[];
  readonly schema: typeof BWS_EVIDENCE_INDEX_SUMMARY_SCHEMA;
}

export interface BwsHttpRequestMetrics {
  readonly errorCount: number;
  readonly lastDurationMs?: number;
  readonly lastStatusCode?: number;
  readonly requestCount: number;
  readonly responseBytes: number;
  readonly totalDurationMs: number;
}

export interface BwsApiRequestMetricsSnapshot {
  readonly api: BwsHttpRequestMetrics;
  readonly cockpit: BwsHttpRequestMetrics;
  readonly health: BwsHttpRequestMetrics;
  readonly metrics: BwsHttpRequestMetrics;
  readonly readiness: BwsHttpRequestMetrics;
}

export interface BwsApiRequestMetricsCollector {
  record(input: Readonly<{
    readonly bytesWritten: number;
    readonly durationMs: number;
    readonly kind: keyof BwsApiRequestMetricsSnapshot;
    readonly statusCode: number;
  }>): void;
  snapshot(): BwsApiRequestMetricsSnapshot;
}

export interface BwsMetricsSnapshot {
  readonly api: Readonly<{
    readonly requestMetrics: BwsApiRequestMetricsSnapshot;
    readonly runtimeId: string;
    readonly status: 'blocked' | 'ready';
  }>;
  readonly cockpit: Readonly<{
    readonly assetFingerprint?: string;
    readonly requestMetrics: BwsHttpRequestMetrics;
    readonly status: 'blocked' | 'ready';
  }>;
  readonly database: Readonly<{
    readonly connectivity: 'available' | 'blocked';
    readonly pendingMigrationCount: number;
    readonly status: BwsMigrationStatusResult['compatibility']['status'];
  }>;
  readonly evidence: Readonly<{
    readonly entryCount: number;
    readonly lastCreatedAt?: string;
    readonly lastRuntimeId?: string;
  }>;
  readonly generatedAt: string;
  readonly runtime: Readonly<{
    readonly lifecycleState: string;
    readonly runtimeId?: string;
  }>;
  readonly scheduler: Readonly<{
    readonly counters?: Record<string, number>;
    readonly lifecycleState: string;
    readonly queueDepth?: Record<string, number>;
    readonly runtimeId?: string;
  }>;
  readonly schema: 'bws.metrics_snapshot.v1';
  readonly sourceFingerprint: string;
  readonly upstream: Readonly<{
    readonly counters?: Record<string, number>;
    readonly lastBlockerCodes?: readonly string[];
    readonly lastDurationMs?: number;
    readonly lastSuccessAt?: string;
    readonly lifecycleState: string;
    readonly mode?: 'api' | 'export';
    readonly runtimeId?: string;
  }>;
  readonly worker: Readonly<{
    readonly counters?: Record<string, number>;
    readonly lifecycleState: string;
    readonly runtimeId?: string;
  }>;
}

export interface BwsDiagnosticsBundleResult {
  readonly bundleDirectory: string;
  readonly bundleManifestFile: string;
  readonly generatedAt: string;
  readonly manifestSha256: string;
  readonly schema: typeof BWS_DIAGNOSTICS_BUNDLE_SCHEMA;
}

interface DiagnosticsStateSnapshot {
  readonly apiMetrics: BwsApiRequestMetricsSnapshot;
  readonly environment: Record<string, boolean>;
  readonly evidenceIndex: BwsEvidenceIndexSummary;
  readonly health: unknown;
  readonly lifecycle: unknown;
  readonly logs: Readonly<Record<string, readonly BwsStructuredLogRecord[]>>;
  readonly metrics: BwsMetricsSnapshot;
  readonly migrationStatus: BwsMigrationStatusResult;
  readonly queueSummary: ReturnType<SurebetWorkerJobRepository['summarizeQueue']>;
  readonly readiness: unknown;
  readonly sourceFingerprints: Readonly<{
    readonly packageVersion: string;
    readonly sourceManifestGeneratedAt: string;
    readonly sourceManifestSha256: string;
    readonly upstreamCommitSha: string;
    readonly upstreamGitTreeSha: string;
    readonly upstreamTrackedTreeListingSha256: string;
  }>;
}

export const BWS_OBSERVABILITY_RUNTIME_ID_ENV = 'BWS_OBSERVABILITY_RUNTIME_ID';
export const BWS_OBSERVABILITY_LOG_DIRECTORY_ENV = 'BWS_OBSERVABILITY_LOG_DIRECTORY';
export const BWS_OBSERVABILITY_LOG_MAX_BYTES_ENV = 'BWS_OBSERVABILITY_LOG_MAX_BYTES';
export const BWS_OBSERVABILITY_LOG_MAX_FILES_ENV = 'BWS_OBSERVABILITY_LOG_MAX_FILES';

export function createBwsStructuredLogger(request: Readonly<{
  readonly logDirectory?: string;
  readonly maxBytes?: number;
  readonly maxFiles?: number;
  readonly now?: () => string;
  readonly processIdentity: BwsStructuredProcessIdentity;
  readonly repositoryRoot: string;
  readonly runtimeId?: string;
  readonly selectedUpstreamMode?: 'api' | 'export';
}>): BwsStructuredLogger {
  const repositoryRoot = resolve(request.repositoryRoot);
  const paths = resolveBwsObservabilityPaths(repositoryRoot);
  const logDirectory = resolve(
    repositoryRoot,
    request.logDirectory
      ?? process.env[BWS_OBSERVABILITY_LOG_DIRECTORY_ENV]
      ?? relative(repositoryRoot, paths.logDirectory),
  );
  const maxBytes = request.maxBytes
    ?? requirePositiveInteger(
      process.env[BWS_OBSERVABILITY_LOG_MAX_BYTES_ENV],
      BWS_OBSERVABILITY_LOG_MAX_BYTES_ENV,
      DEFAULT_LOG_MAX_BYTES,
    );
  const maxFiles = request.maxFiles
    ?? requirePositiveInteger(
      process.env[BWS_OBSERVABILITY_LOG_MAX_FILES_ENV],
      BWS_OBSERVABILITY_LOG_MAX_FILES_ENV,
      DEFAULT_LOG_MAX_FILES,
    );
  if (maxFiles < 1) {
    throw new Error(`${BWS_OBSERVABILITY_LOG_MAX_FILES_ENV} must be at least 1.`);
  }
  const runtimeId = request.runtimeId ?? resolveStructuredRuntimeId();
  const selectedUpstreamMode = request.selectedUpstreamMode ?? resolveStructuredUpstreamMode();
  const now = request.now ?? defaultNow;

  mkdirSync(logDirectory, { recursive: true });
  return Object.freeze({
    runtimeId,
    write(input: Readonly<{
      readonly checkpointOrJobId?: string;
      readonly details?: unknown;
      readonly eventCode: string;
      readonly level?: BwsStructuredLogLevel;
      readonly serviceRole: BwsStructuredLogRole;
      readonly timestamp?: string;
    }>) {
      const record: BwsStructuredLogRecord = Object.freeze({
        ...(input.checkpointOrJobId === undefined ? {} : { checkpointOrJobId: input.checkpointOrJobId }),
        details: sanitizeJsonValue(input.details ?? Object.freeze({})),
        eventCode: requireNonEmptyString(input.eventCode, 'eventCode'),
        level: input.level ?? 'info',
        processIdentity: request.processIdentity,
        runtimeId,
        schema: BWS_STRUCTURED_LOG_ENTRY_SCHEMA,
        serviceRole: input.serviceRole,
        timestamp: requireIsoTimestamp(input.timestamp ?? now(), 'timestamp'),
        ...(selectedUpstreamMode === undefined ? {} : { upstreamMode: selectedUpstreamMode }),
      });
      const filePath = join(logDirectory, `${record.serviceRole}.jsonl`);
      const line = `${JSON.stringify(record)}\n`;
      rotateLogFileIfNeeded(filePath, maxBytes, maxFiles, line);
      appendFileSync(filePath, line, 'utf-8');
    },
  });
}

export function createBwsApiRequestMetricsCollector(): BwsApiRequestMetricsCollector {
  const counters = new Map<keyof BwsApiRequestMetricsSnapshot, MutableRequestMetrics>([
    ['api', createEmptyRequestMetrics()],
    ['cockpit', createEmptyRequestMetrics()],
    ['health', createEmptyRequestMetrics()],
    ['metrics', createEmptyRequestMetrics()],
    ['readiness', createEmptyRequestMetrics()],
  ]);
  return Object.freeze({
    record(input: Readonly<{
      readonly bytesWritten: number;
      readonly durationMs: number;
      readonly kind: keyof BwsApiRequestMetricsSnapshot;
      readonly statusCode: number;
    }>) {
      const metrics = counters.get(input.kind);
      if (metrics === undefined) {
        throw new Error(`Unknown request metrics kind: ${String(input.kind)}.`);
      }
      metrics.requestCount += 1;
      metrics.responseBytes += input.bytesWritten;
      metrics.totalDurationMs += input.durationMs;
      metrics.lastDurationMs = input.durationMs;
      metrics.lastStatusCode = input.statusCode;
      if (input.statusCode >= 400) {
        metrics.errorCount += 1;
      }
    },
    snapshot() {
      return Object.freeze({
        api: freezeRequestMetrics(counters.get('api')!),
        cockpit: freezeRequestMetrics(counters.get('cockpit')!),
        health: freezeRequestMetrics(counters.get('health')!),
        metrics: freezeRequestMetrics(counters.get('metrics')!),
        readiness: freezeRequestMetrics(counters.get('readiness')!),
      });
    },
  });
}

export function registerBwsEvidenceArtifact(request: Readonly<{
  readonly artifactPath: string;
  readonly artifactSchema: string;
  readonly createdAt: string;
  readonly repositoryRoot: string;
  readonly retentionClass: BwsEvidenceRetentionClass;
  readonly runtimeId: string;
  readonly sourceFingerprint: string;
}>): BwsEvidenceIndexEntry {
  const repositoryRoot = resolve(request.repositoryRoot);
  const paths = resolveBwsObservabilityPaths(repositoryRoot);
  const artifactPath = requireRepositoryFile(repositoryRoot, request.artifactPath, 'artifactPath');
  const createdAt = requireIsoTimestamp(request.createdAt, 'createdAt');
  const entry: BwsEvidenceIndexEntry = Object.freeze({
    artifactSchema: requireNonEmptyString(request.artifactSchema, 'artifactSchema'),
    createdAt,
    path: relative(repositoryRoot, artifactPath),
    retentionClass: request.retentionClass,
    runtimeId: requireNonEmptyString(request.runtimeId, 'runtimeId'),
    schema: BWS_EVIDENCE_INDEX_ENTRY_SCHEMA,
    sha256: fileSha256(artifactPath),
    sourceFingerprint: requireNonEmptyString(request.sourceFingerprint, 'sourceFingerprint'),
  });
  mkdirSync(paths.evidenceIndexDirectory, { recursive: true });
  const existingEntries = readEvidenceIndexEntries(paths.evidenceIndexFilePath);
  const duplicate = existingEntries.some((candidate) => candidate.path === entry.path && candidate.sha256 === entry.sha256);
  if (!duplicate) {
    mkdirSync(dirname(paths.evidenceIndexFilePath), { recursive: true });
    appendFileSync(paths.evidenceIndexFilePath, `${JSON.stringify(entry)}\n`, 'utf-8');
  }
  mkdirSync(dirname(paths.evidenceIndexSummaryPath), { recursive: true });
  writeJsonFile(paths.evidenceIndexSummaryPath, summarizeEntries(readEvidenceIndexEntries(paths.evidenceIndexFilePath)));
  return entry;
}

export function summarizeBwsEvidenceIndex(
  repositoryRoot: string,
  recentEntryLimit: number = DEFAULT_RECENT_ENTRY_LIMIT,
): BwsEvidenceIndexSummary {
  const paths = resolveBwsObservabilityPaths(repositoryRoot);
  const entries = readEvidenceIndexEntries(paths.evidenceIndexFilePath);
  return summarizeEntries(entries, recentEntryLimit);
}

export function readRecentBwsStructuredLogs(
  repositoryRoot: string,
  recentEntryLimit: number = DEFAULT_RECENT_ENTRY_LIMIT,
): Readonly<Record<string, readonly BwsStructuredLogRecord[]>> {
  const paths = resolveBwsObservabilityPaths(repositoryRoot);
  if (!existsSync(paths.logDirectory) || !statSync(paths.logDirectory).isDirectory()) {
    return Object.freeze({});
  }
  const result = new Map<string, readonly BwsStructuredLogRecord[]>();
  for (const entry of readdirSync(paths.logDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.jsonl')) {
      continue;
    }
    const records = tailJsonLines<BwsStructuredLogRecord>(
      join(paths.logDirectory, entry.name),
      recentEntryLimit,
    ).filter((record): record is BwsStructuredLogRecord => record.schema === BWS_STRUCTURED_LOG_ENTRY_SCHEMA);
    result.set(entry.name.replace(/\.jsonl$/, ''), Object.freeze(records));
  }
  return Object.freeze(Object.fromEntries(result));
}

export function createBwsMetricsSnapshot(request: Readonly<{
  readonly apiRequestMetrics: BwsApiRequestMetricsSnapshot;
  readonly config: BwsServiceRuntimeConfig;
  readonly cockpitState: Readonly<{
    readonly assetFingerprint?: string;
    readonly status: 'blocked' | 'ready';
  }>;
  readonly generatedAt?: string;
  readonly repositoryRoot: string;
  readonly runtimeId: string;
}>): BwsMetricsSnapshot {
  const generatedAt = requireIsoTimestamp(request.generatedAt ?? defaultNow(), 'generatedAt');
  const repositoryRoot = resolve(request.repositoryRoot);
  const migrationStatus = getBwsDatabaseMigrationStatus({
    persistenceConfig: request.config.persistence,
    repositoryRoot,
  });
  const queueSummary = new SurebetWorkerJobRepository(request.config.persistence)
    .summarizeQueue(request.config.worker.queueName);
  const upstreamState = readManagedStateFile(join(repositoryRoot, 'runtime/bws-upstream-convergence-service/state.json'));
  const schedulerState = readManagedStateFile(join(repositoryRoot, 'runtime/bws-private-paper-scheduler-service/state.json'));
  const workerState = readManagedStateFile(join(repositoryRoot, 'runtime/bws-private-paper-worker-service/state.json'));
  const lifecycleState = readManagedStateFile(join(repositoryRoot, 'runtime/bws-operator-lifecycle/state.json'));
  const evidenceIndex = summarizeBwsEvidenceIndex(repositoryRoot);
  const lifecycleRuntimeId = readOptionalStringField(lifecycleState, 'runtimeId');
  const schedulerCounters = readObjectNumberMap(schedulerState, 'runtime.counters');
  const schedulerRuntimeId = readOptionalStringField(schedulerState, 'runtimeId');
  const schedulerQueueDepth = readQueueDepthMap(schedulerState);
  const upstreamCounters = readObjectNumberMap(upstreamState, 'runtime.counters');
  const upstreamLastBlockerCodes = readNestedStringArray(upstreamState, 'runtime.lastPass.blockerCodes');
  const upstreamLastDurationMs = readNestedNumber(upstreamState, 'runtime.lastPass.durationMs');
  const upstreamLastSuccessAt = readLastSuccessTimestamp(upstreamState);
  const upstreamMode = readOptionalLiteral(upstreamState, 'configuration.mode', ['api', 'export']);
  const upstreamRuntimeId = readOptionalStringField(upstreamState, 'runtimeId');
  const workerCounters = readObjectNumberMap(workerState, 'runtime.counters');
  const workerRuntimeId = readOptionalStringField(workerState, 'runtimeId');

  return Object.freeze({
    api: Object.freeze({
      requestMetrics: request.apiRequestMetrics,
      runtimeId: request.runtimeId,
      status: 'ready',
    }),
    cockpit: Object.freeze({
      ...(request.cockpitState.assetFingerprint === undefined ? {} : { assetFingerprint: request.cockpitState.assetFingerprint }),
      requestMetrics: request.apiRequestMetrics.cockpit,
      status: request.cockpitState.status,
    }),
    database: Object.freeze({
      connectivity: migrationStatus.compatibility.status === 'compatible' ? 'available' : 'blocked',
      pendingMigrationCount: migrationStatus.migrationLedger.pending.length,
      status: migrationStatus.compatibility.status,
    }),
    evidence: Object.freeze({
      entryCount: evidenceIndex.entryCount,
      ...(evidenceIndex.lastCreatedAt === undefined ? {} : { lastCreatedAt: evidenceIndex.lastCreatedAt }),
      ...(evidenceIndex.lastRuntimeId === undefined ? {} : { lastRuntimeId: evidenceIndex.lastRuntimeId }),
    }),
    generatedAt,
    runtime: Object.freeze({
      lifecycleState: readLifecycleStateValue(lifecycleState),
      ...(lifecycleRuntimeId === undefined ? {} : { runtimeId: lifecycleRuntimeId }),
    }),
    scheduler: Object.freeze({
      ...(schedulerCounters === undefined ? {} : { counters: schedulerCounters }),
      lifecycleState: readNestedLifecycleStateValue(schedulerState),
      ...(schedulerRuntimeId === undefined ? {} : { runtimeId: schedulerRuntimeId }),
      ...(schedulerQueueDepth === undefined ? {} : { queueDepth: schedulerQueueDepth }),
    }),
    schema: 'bws.metrics_snapshot.v1',
    sourceFingerprint: request.config.upstream.lock.trackedTreeListingSha256,
    upstream: Object.freeze({
      ...(upstreamCounters === undefined ? {} : { counters: upstreamCounters }),
      ...(upstreamLastBlockerCodes === undefined ? {} : { lastBlockerCodes: upstreamLastBlockerCodes }),
      ...(upstreamLastDurationMs === undefined ? {} : { lastDurationMs: upstreamLastDurationMs }),
      ...(upstreamLastSuccessAt === undefined ? {} : { lastSuccessAt: upstreamLastSuccessAt }),
      lifecycleState: readNestedLifecycleStateValue(upstreamState),
      ...(upstreamMode === undefined ? {} : { mode: upstreamMode }),
      ...(upstreamRuntimeId === undefined ? {} : { runtimeId: upstreamRuntimeId }),
    }),
    worker: Object.freeze({
      ...(workerCounters === undefined ? {} : { counters: workerCounters }),
      lifecycleState: readNestedLifecycleStateValue(workerState),
      ...(workerRuntimeId === undefined ? {} : { runtimeId: workerRuntimeId }),
    }),
  });
}

export async function collectBwsDiagnosticsBundle(request: Readonly<{
  readonly config?: BwsServiceRuntimeConfig;
  readonly environment?: BwsServiceRuntimeEnvironment;
  readonly fetchJson?: typeof fetchLoopbackJson;
  readonly migrationStatus?: BwsMigrationStatusResult;
  readonly now?: () => string;
  readonly queueSummary?: ReturnType<SurebetWorkerJobRepository['summarizeQueue']>;
  readonly recentEntryLimit?: number;
  readonly repositoryRoot?: string;
}>): Promise<BwsDiagnosticsBundleResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const config = request.config ?? resolveBwsServiceRuntimeConfig(
    request.environment ?? process.env as BwsServiceRuntimeEnvironment,
    repositoryRoot,
  );
  const generatedAt = requireIsoTimestamp((request.now ?? defaultNow)(), 'generatedAt');
  const recentEntryLimit = request.recentEntryLimit ?? DEFAULT_RECENT_ENTRY_LIMIT;
  const paths = resolveBwsObservabilityPaths(repositoryRoot);
  mkdirSync(paths.diagnosticsDirectory, { recursive: true });

  const diagnosticsRequest = Object.freeze({
    config,
    environment: request.environment ?? process.env as BwsServiceRuntimeEnvironment,
    fetchJson: request.fetchJson ?? fetchLoopbackJson,
    recentEntryLimit,
    repositoryRoot,
    ...(request.migrationStatus === undefined ? {} : { migrationStatus: request.migrationStatus }),
    ...(request.queueSummary === undefined ? {} : { queueSummary: request.queueSummary }),
  });
  const diagnostics = await collectDiagnosticsStateSnapshot(diagnosticsRequest);
  const manifest = Object.freeze({
    configurationPresence: diagnostics.environment,
    evidenceIndex: diagnostics.evidenceIndex,
    generatedAt,
    health: diagnostics.health,
    lifecycle: diagnostics.lifecycle,
    logs: diagnostics.logs,
    metrics: diagnostics.metrics,
    migrationStatus: diagnostics.migrationStatus,
    queueSummary: diagnostics.queueSummary,
    readiness: diagnostics.readiness,
    schema: BWS_DIAGNOSTICS_BUNDLE_SCHEMA,
    sourceFingerprints: diagnostics.sourceFingerprints,
  });
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestSha256 = sha256String(manifestText);
  const bundleDirectoryName = `${generatedAt.replace(/[:.]/g, '-')}-${manifestSha256.slice(0, 12)}`;
  const temporaryDirectory = join(paths.diagnosticsDirectory, `${bundleDirectoryName}.tmp-${process.pid}`);
  const bundleDirectory = join(paths.diagnosticsDirectory, bundleDirectoryName);
  mkdirSync(temporaryDirectory, { recursive: true });
  writeFileSync(join(temporaryDirectory, 'diagnostics.json'), manifestText, 'utf-8');
  writeFileSync(join(temporaryDirectory, 'metrics.json'), `${JSON.stringify(diagnostics.metrics, null, 2)}\n`, 'utf-8');
  writeFileSync(join(temporaryDirectory, 'evidence-index.json'), `${JSON.stringify(diagnostics.evidenceIndex, null, 2)}\n`, 'utf-8');
  writeFileSync(join(temporaryDirectory, 'logs.json'), `${JSON.stringify(diagnostics.logs, null, 2)}\n`, 'utf-8');
  renameSync(temporaryDirectory, bundleDirectory);
  return Object.freeze({
    bundleDirectory: relative(repositoryRoot, bundleDirectory),
    bundleManifestFile: relative(repositoryRoot, join(bundleDirectory, 'diagnostics.json')),
    generatedAt,
    manifestSha256,
    schema: BWS_DIAGNOSTICS_BUNDLE_SCHEMA,
  });
}

export function createBwsStructuredProcessIdentity(
  processName: string,
  repositoryRoot: string,
  startedAt: string,
): BwsStructuredProcessIdentity {
  return Object.freeze({
    nodeVersion: process.version,
    pid: process.pid,
    ppid: process.ppid,
    processName,
    repositoryRoot,
    startedAt,
  });
}

export function generateBwsRuntimeId(): string {
  return randomUUID();
}

function resolveBwsObservabilityPaths(repositoryRoot: string): Readonly<{
  readonly diagnosticsDirectory: string;
  readonly evidenceIndexDirectory: string;
  readonly evidenceIndexFilePath: string;
  readonly evidenceIndexSummaryPath: string;
  readonly logDirectory: string;
}> {
  const root = resolve(repositoryRoot, DEFAULT_OBSERVABILITY_DIRECTORY);
  const evidenceIndexDirectory = join(root, DEFAULT_EVIDENCE_INDEX_DIRECTORY);
  return Object.freeze({
    diagnosticsDirectory: join(root, DEFAULT_DIAGNOSTICS_DIRECTORY),
    evidenceIndexDirectory,
    evidenceIndexFilePath: join(evidenceIndexDirectory, 'index.jsonl'),
    evidenceIndexSummaryPath: join(evidenceIndexDirectory, 'latest.json'),
    logDirectory: join(root, DEFAULT_LOG_DIRECTORY),
  });
}

async function collectDiagnosticsStateSnapshot(request: Readonly<{
  readonly config: BwsServiceRuntimeConfig;
  readonly environment: BwsServiceRuntimeEnvironment;
  readonly fetchJson: typeof fetchLoopbackJson;
  readonly migrationStatus?: BwsMigrationStatusResult;
  readonly queueSummary?: ReturnType<SurebetWorkerJobRepository['summarizeQueue']>;
  readonly recentEntryLimit: number;
  readonly repositoryRoot: string;
}>): Promise<DiagnosticsStateSnapshot> {
  const requestMetrics = await request.fetchJson<BwsMetricsSnapshot>(
    `${LOOPBACK_BASE_URL}:${request.config.api.port}/metrics`,
  );
  const health = await request.fetchJson<unknown>(
    `${LOOPBACK_BASE_URL}:${request.config.api.port}/health`,
  );
  const readiness = await request.fetchJson<unknown>(
    `${LOOPBACK_BASE_URL}:${request.config.api.port}/readiness`,
  );
  const migrationStatus = request.migrationStatus ?? getBwsDatabaseMigrationStatus({
    persistenceConfig: request.config.persistence,
    repositoryRoot: request.repositoryRoot,
  });
  const queueSummary = request.queueSummary ?? new SurebetWorkerJobRepository(request.config.persistence)
    .summarizeQueue(request.config.worker.queueName);
  const evidenceIndex = summarizeBwsEvidenceIndex(request.repositoryRoot, request.recentEntryLimit);
  return Object.freeze({
    apiMetrics: requestMetrics.ok ? requestMetrics.value.api.requestMetrics : createBwsApiRequestMetricsCollector().snapshot(),
    environment: inspectConfigurationPresence(request.environment),
    evidenceIndex,
    health: health.ok ? health.value : Object.freeze({ ok: false, error: health.error }),
    lifecycle: readManagedStateFile(join(request.repositoryRoot, 'runtime/bws-operator-lifecycle/state.json')),
    logs: readRecentBwsStructuredLogs(request.repositoryRoot, request.recentEntryLimit),
    metrics: requestMetrics.ok
      ? requestMetrics.value
      : createBwsMetricsSnapshot({
        apiRequestMetrics: createBwsApiRequestMetricsCollector().snapshot(),
        config: request.config,
        cockpitState: Object.freeze({ status: 'blocked' as const }),
        generatedAt: defaultNow(),
        repositoryRoot: request.repositoryRoot,
        runtimeId: resolveStructuredRuntimeId(),
      }),
    migrationStatus,
    queueSummary,
    readiness: readiness.ok ? readiness.value : Object.freeze({ ok: false, error: readiness.error }),
    sourceFingerprints: collectSourceFingerprints(request.repositoryRoot, request.config),
  });
}

function inspectConfigurationPresence(
  environment: BwsServiceRuntimeEnvironment,
): Record<string, boolean> {
  const values = environment as Readonly<Record<string, string | undefined>>;
  return Object.freeze(
    Object.fromEntries(
      CONFIGURATION_PRESENCE_KEYS.map((key) => [key, hasPresentEnvironmentValue(values[key])]),
    ),
  );
}

async function fetchLoopbackJson<T>(
  url: string,
): Promise<Readonly<
  | { readonly ok: true; readonly value: T }
  | { readonly error: string; readonly ok: false }
>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: Object.freeze({
        accept: 'application/json',
      }),
      signal: controller.signal,
    });
    const body = await response.json() as T;
    return Object.freeze({ ok: true, value: body });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Object.freeze({ error: message, ok: false });
  } finally {
    clearTimeout(timeout);
  }
}

function collectSourceFingerprints(
  repositoryRoot: string,
  config: BwsServiceRuntimeConfig,
): Readonly<{
  readonly packageVersion: string;
  readonly sourceManifestGeneratedAt: string;
  readonly sourceManifestSha256: string;
  readonly upstreamCommitSha: string;
  readonly upstreamGitTreeSha: string;
  readonly upstreamTrackedTreeListingSha256: string;
}> {
  const packageJsonPath = resolve(repositoryRoot, 'package.json');
  const sourceManifestPath = resolve(repositoryRoot, 'SOURCE_MANIFEST.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    readonly version?: unknown;
  };
  const sourceManifestContents = readFileSync(sourceManifestPath, 'utf-8');
  const sourceManifest = JSON.parse(sourceManifestContents) as {
    readonly generatedAt?: unknown;
  };
  return Object.freeze({
    packageVersion: requireNonEmptyString(String(packageJson.version ?? ''), 'package.version'),
    sourceManifestGeneratedAt: requireIsoTimestamp(String(sourceManifest.generatedAt ?? ''), 'SOURCE_MANIFEST.generatedAt'),
    sourceManifestSha256: sha256String(sourceManifestContents),
    upstreamCommitSha: config.upstream.lock.commitSha,
    upstreamGitTreeSha: config.upstream.lock.gitTreeSha,
    upstreamTrackedTreeListingSha256: config.upstream.lock.trackedTreeListingSha256,
  });
}

function summarizeEntries(
  entries: readonly BwsEvidenceIndexEntry[],
  recentEntryLimit: number = DEFAULT_RECENT_ENTRY_LIMIT,
): BwsEvidenceIndexSummary {
  const recentEntries = entries.slice(-recentEntryLimit);
  const lastEntry = entries[entries.length - 1];
  return Object.freeze({
    entryCount: entries.length,
    ...(lastEntry?.createdAt === undefined ? {} : { lastCreatedAt: lastEntry.createdAt }),
    ...(lastEntry?.runtimeId === undefined ? {} : { lastRuntimeId: lastEntry.runtimeId }),
    recentEntries: Object.freeze(recentEntries),
    schema: BWS_EVIDENCE_INDEX_SUMMARY_SCHEMA,
  });
}

function readEvidenceIndexEntries(filePath: string): readonly BwsEvidenceIndexEntry[] {
  if (!existsSync(filePath)) {
    return Object.freeze([]);
  }
  return Object.freeze(
    tailJsonLines<BwsEvidenceIndexEntry>(filePath, Number.MAX_SAFE_INTEGER)
      .filter((entry): entry is BwsEvidenceIndexEntry => entry.schema === BWS_EVIDENCE_INDEX_ENTRY_SCHEMA),
  );
}

function tailJsonLines<T>(filePath: string, limit: number): readonly T[] {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return Object.freeze([]);
  }
  const lines = readFileSync(filePath, 'utf-8')
    .trim()
    .split('\n')
    .filter((line) => line.length > 0);
  const selected = lines.slice(Math.max(lines.length - limit, 0));
  return Object.freeze(selected.map((line) => JSON.parse(line) as T));
}

function rotateLogFileIfNeeded(
  filePath: string,
  maxBytes: number,
  maxFiles: number,
  nextLine: string,
): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const incomingBytes = Buffer.byteLength(nextLine);
  const currentBytes = existsSync(filePath) ? statSync(filePath).size : 0;
  if (currentBytes + incomingBytes <= maxBytes) {
    return;
  }
  for (let index = maxFiles - 1; index >= 1; index -= 1) {
    const previousPath = index === 1 ? filePath : `${filePath}.${index - 1}`;
    const nextPath = `${filePath}.${index}`;
    if (!existsSync(previousPath)) {
      continue;
    }
    renameSync(previousPath, nextPath);
  }
}

function sanitizeJsonValue(value: unknown): JsonValue {
  if (value === null) {
    return null;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Structured observability values must not contain non-finite numbers.');
    }
    return value;
  }
  if (typeof value === 'string') {
    if (URL_PATTERN.test(value)) {
      try {
        return new URL(value).origin;
      } catch {
        return value;
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => sanitizeJsonValue(entry)));
  }
  if (typeof value === 'object') {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, '[redacted]'] as const;
      }
      return [key, sanitizeJsonValue(entry)] as const;
    });
    return Object.freeze(Object.fromEntries(sanitizedEntries));
  }
  throw new Error(`Unsupported structured observability value type: ${typeof value}.`);
}

function createEmptyRequestMetrics(): MutableRequestMetrics {
  return {
    errorCount: 0,
    requestCount: 0,
    responseBytes: 0,
    totalDurationMs: 0,
  };
}

function freezeRequestMetrics(value: MutableRequestMetrics): BwsHttpRequestMetrics {
  return Object.freeze({
    errorCount: value.errorCount,
    ...(value.lastDurationMs === undefined ? {} : { lastDurationMs: value.lastDurationMs }),
    ...(value.lastStatusCode === undefined ? {} : { lastStatusCode: value.lastStatusCode }),
    requestCount: value.requestCount,
    responseBytes: value.responseBytes,
    totalDurationMs: value.totalDurationMs,
  });
}

function readManagedStateFile(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return undefined;
  }
  const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Managed state file must contain an object: ${filePath}`);
  }
  return parsed as Record<string, unknown>;
}

function readLifecycleStateValue(state: Record<string, unknown> | undefined): string {
  if (state === undefined) {
    return 'not_running';
  }
  const processes = state.processes;
  if (!Array.isArray(processes) || processes.length === 0) {
    return 'blocked';
  }
  return 'running';
}

function readNestedLifecycleStateValue(state: Record<string, unknown> | undefined): string {
  if (state === undefined) {
    return 'not_running';
  }
  const runtime = readNestedObject(state, 'runtime');
  const lifecycleState = runtime === undefined ? undefined : runtime.lifecycleState;
  return typeof lifecycleState === 'string' ? lifecycleState : 'blocked';
}

function readNestedObject(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  const candidate = value[key];
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return undefined;
  }
  return candidate as Record<string, unknown>;
}

function readOptionalStringField(
  state: Record<string, unknown> | undefined,
  path: string,
): string | undefined {
  const value = readPathValue(state, path);
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readOptionalLiteral<T extends string>(
  state: Record<string, unknown> | undefined,
  path: string,
  allowed: readonly T[],
): T | undefined {
  const value = readPathValue(state, path);
  if (typeof value !== 'string') {
    return undefined;
  }
  return allowed.includes(value as T) ? value as T : undefined;
}

function readNestedStringArray(
  state: Record<string, unknown> | undefined,
  path: string,
): readonly string[] | undefined {
  const value = readPathValue(state, path);
  if (!Array.isArray(value)) {
    return undefined;
  }
  const strings = value.filter((entry): entry is string => typeof entry === 'string');
  return strings.length === value.length ? Object.freeze(strings) : undefined;
}

function readObjectNumberMap(
  state: Record<string, unknown> | undefined,
  path: string,
): Record<string, number> | undefined {
  const value = readPathValue(state, path);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  if (entries.some(([, entry]) => typeof entry !== 'number' || !Number.isFinite(entry))) {
    return undefined;
  }
  return Object.freeze(Object.fromEntries(entries as Array<readonly [string, number]>));
}

function readQueueDepthMap(
  state: Record<string, unknown> | undefined,
): Record<string, number> | undefined {
  return readObjectNumberMap(state, 'runtime.lastPass.queueDepth');
}

function readNestedNumber(
  state: Record<string, unknown> | undefined,
  path: string,
): number | undefined {
  const value = readPathValue(state, path);
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readLastSuccessTimestamp(
  state: Record<string, unknown> | undefined,
): string | undefined {
  const outcome = readOptionalStringField(state, 'runtime.lastPass.outcome');
  const completedAt = readOptionalStringField(state, 'runtime.lastPass.completedAt');
  return outcome === 'success' || outcome === 'scheduled' || outcome === 'processed'
    ? completedAt
    : undefined;
}

function readPathValue(
  value: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (value === undefined) {
    return undefined;
  }
  let current: unknown = value;
  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function resolveStructuredRuntimeId(): string {
  const candidate = process.env[BWS_OBSERVABILITY_RUNTIME_ID_ENV];
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate.trim()
    : generateBwsRuntimeId();
}

function resolveStructuredUpstreamMode(): 'api' | 'export' | undefined {
  const candidate = process.env.BWS_UPSTREAM_MODE;
  return candidate === 'api' || candidate === 'export'
    ? candidate
    : undefined;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function requirePositiveInteger(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  if (!POSITIVE_INTEGER_PATTERN.test(value)) {
    throw new Error(`${name} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function requireRepositoryFile(repositoryRoot: string, value: string, name: string): string {
  const resolvedPath = resolve(value);
  const resolvedRoot = resolve(repositoryRoot);
  if (!(resolvedPath === resolvedRoot || resolvedPath.startsWith(`${resolvedRoot}/`))) {
    throw new Error(`${name} must stay within the repository root.`);
  }
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
    throw new Error(`${name} must point to an existing file.`);
  }
  return resolvedPath;
}

function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, filePath);
}

function fileSha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function sha256String(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function requireIsoTimestamp(value: string, name: string): string {
  if (!ISO_8601_UTC_MILLISECONDS.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${name} must be an ISO-8601 UTC timestamp.`);
  }
  return value;
}

function requireNonEmptyString(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
}

function hasPresentEnvironmentValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

interface MutableRequestMetrics {
  errorCount: number;
  lastDurationMs?: number;
  lastStatusCode?: number;
  requestCount: number;
  responseBytes: number;
  totalDurationMs: number;
}
