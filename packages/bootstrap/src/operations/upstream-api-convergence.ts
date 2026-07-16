import {
  SurebetImportRunRepository,
  SurebetUpstreamApiConvergenceRepository,
  SurebetUpstreamLockRepository,
  type SurebetImportRunRecord,
  type SurebetUpstreamApiConvergenceCheckpointRecord,
  type SurebetUpstreamApiConvergenceResource,
  type SurebetUpstreamApiResponseProvenance,
  resolveSurebetPersistenceConfig,
  type JsonValue,
  type SurebetPersistenceConfig,
  type SurebetPersistenceEnvironment,
} from '../../../persistence/src/index.js';
import {
  readBettingWinUpstreamLock,
  verifyBettingWinUpstreamLock,
  type BettingWinUpstreamLock,
} from '../../../upstream/src/index.js';
import {
  createReadOnlyQueryApiClient,
  type ReadOnlyQueryApiClient,
  type ReadOnlyQueryFetchLike,
  type ReadOnlyQueryResponseEnvelope,
} from '../adapters/betting-win-query-client.js';
import { accepted, blocked, type Blocker, type BoundaryResult } from '../contracts/local-types.js';
import {
  BWS_UPSTREAM_API_BASE_URL_ENV,
  BWS_UPSTREAM_API_TIMEOUT_MS_ENV,
  BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV,
  BWS_UPSTREAM_MODE_ENV,
} from './upstream-export-convergence.js';
import {
  BWS_UPSTREAM_LOCK_PATH_ENV,
  SUREBET_EXECUTION_ENABLED_ENV,
  SUREBET_PROVIDER_CONNECTIONS_ENV,
  SUREBET_RUNTIME_MODE_ENV,
} from './service-runtime.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const API_ENV_PREFIX = 'BWS_UPSTREAM_API_';
const API_RESOURCE_ORDER = ['identity', 'rules', 'quotes', 'settlement'] as const;
const SENSITIVE_API_SETTING_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;
const UNSUPPORTED_PROVIDER_SETTING_PATTERN = /endpoint|provider/i;

export const BWS_UPSTREAM_API_CHECKPOINT_ID_ENV = 'BWS_UPSTREAM_API_CHECKPOINT_ID';
export const BWS_UPSTREAM_API_CONTRACT_VERSION_ENV = 'BWS_UPSTREAM_API_CONTRACT_VERSION';
export const BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV = 'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE';
export const BWS_UPSTREAM_API_PAGE_SIZE_ENV = 'BWS_UPSTREAM_API_PAGE_SIZE';
export const BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV = 'BWS_UPSTREAM_API_RETRY_BACKOFF_MS';
export const BWS_UPSTREAM_API_RETRY_LIMIT_ENV = 'BWS_UPSTREAM_API_RETRY_LIMIT';

type ApiResource = (typeof API_RESOURCE_ORDER)[number];

export interface BwsUpstreamApiConvergenceEnvironment extends SurebetPersistenceEnvironment {
  readonly BETTING_WIN_REPO_PATH?: string;
  readonly BWS_UPSTREAM_API_BASE_URL?: string;
  readonly BWS_UPSTREAM_API_CHECKPOINT_ID?: string;
  readonly BWS_UPSTREAM_API_CONTRACT_VERSION?: string;
  readonly BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE?: string;
  readonly BWS_UPSTREAM_API_PAGE_SIZE?: string;
  readonly BWS_UPSTREAM_API_RETRY_BACKOFF_MS?: string;
  readonly BWS_UPSTREAM_API_RETRY_LIMIT?: string;
  readonly BWS_UPSTREAM_API_TIMEOUT_MS?: string;
  readonly BWS_UPSTREAM_EXPORT_SELECTION_PATH?: string;
  readonly BWS_UPSTREAM_LOCK_PATH?: string;
  readonly BWS_UPSTREAM_MODE?: string;
  readonly SUREBET_EXECUTION_ENABLED?: string;
  readonly SUREBET_PINNED_BUNDLE?: string;
  readonly SUREBET_PROVIDER_CONNECTIONS?: string;
  readonly SUREBET_RUNTIME_MODE?: string;
}

export interface BwsUpstreamApiConvergenceConfig {
  readonly mode: 'api';
  readonly checkpointId: string;
  readonly persistence: SurebetPersistenceConfig;
  readonly query: Readonly<{
    readonly baseUrl: string;
    readonly contractVersion: string;
    readonly maxPagesPerResource: number;
    readonly pageSize: number;
    readonly retryBackoffMs: number;
    readonly retryLimit: number;
    readonly timeoutMs: number;
  }>;
  readonly repositoryRoot: string;
  readonly upstream: Readonly<{
    readonly lock: BettingWinUpstreamLock;
    readonly lockPath: string;
    readonly repoPath: string;
  }>;
}

export interface RunBwsUpstreamApiConvergencePassRequest {
  readonly config?: BwsUpstreamApiConvergenceConfig;
  readonly environment?: BwsUpstreamApiConvergenceEnvironment;
  readonly fetchImplementation?: ReadOnlyQueryFetchLike;
  readonly importRuns?: Pick<SurebetImportRunRepository, 'create' | 'finalize' | 'get'>;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly upstreamApiCheckpoints?: Pick<SurebetUpstreamApiConvergenceRepository, 'advance' | 'create' | 'get'>;
  readonly upstreamLocks?: Pick<SurebetUpstreamLockRepository, 'put'>;
}

export interface BwsUpstreamApiConvergencePassResult {
  readonly checkpointId: string;
  readonly completedCycleCount: number;
  readonly cycleCompleted: boolean;
  readonly cycleNumber: number;
  readonly importRunId: string;
  readonly mode: 'api';
  readonly nextCursor?: string;
  readonly nextResource: ApiResource;
  readonly pageNumber: number;
  readonly processedCount: number;
  readonly resource: ApiResource;
}

interface ApiPageOutcome {
  readonly nextCursor?: string;
  readonly pageNumber: number;
  readonly processedCount: number;
  readonly provenance: SurebetUpstreamApiResponseProvenance;
  readonly resource: ApiResource;
}

interface PersistedApiImportRunMetadata {
  readonly apiBaseUrl: string;
  readonly checkpointId: string;
  readonly contractVersion: string;
  readonly cycleNumber: number;
  readonly maxPagesPerResource: number;
  readonly mode: 'api';
  readonly page: ApiPageOutcome;
  readonly pageSize: number;
  readonly requestCursor?: string;
  readonly resource: ApiResource;
  readonly retryBackoffMs: number;
  readonly retryLimit: number;
  readonly timeoutMs: number;
  readonly upstreamLockRecordId: string;
}

export function resolveBwsUpstreamApiConvergenceConfig(
  environment: BwsUpstreamApiConvergenceEnvironment = process.env as BwsUpstreamApiConvergenceEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsUpstreamApiConvergenceConfig {
  requireLiteral(environment[SUREBET_RUNTIME_MODE_ENV], SUREBET_RUNTIME_MODE_ENV, 'paper');
  requireLiteral(environment[SUREBET_PROVIDER_CONNECTIONS_ENV], SUREBET_PROVIDER_CONNECTIONS_ENV, 'disabled');
  requireLiteral(environment[SUREBET_EXECUTION_ENABLED_ENV], SUREBET_EXECUTION_ENABLED_ENV, 'false');
  requireLiteral(environment[BWS_UPSTREAM_MODE_ENV], BWS_UPSTREAM_MODE_ENV, 'api');
  rejectUnknownApiEnvironmentKeys(environment);

  if (environment[BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV] !== undefined) {
    throw new Error(
      `${BWS_UPSTREAM_MODE_ENV}=api forbids ${BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV}; BWS must not fall back to export mode.`,
    );
  }
  if (environment.SUREBET_PINNED_BUNDLE !== undefined) {
    throw new Error(
      `${BWS_UPSTREAM_MODE_ENV}=api forbids SUREBET_PINNED_BUNDLE; BWS must not fall back to local fixture or mock intake.`,
    );
  }

  const resolvedRepositoryRoot = repositoryRoot;
  const upstreamRepoPath = requireNonEmptyString(environment.BETTING_WIN_REPO_PATH, 'BETTING_WIN_REPO_PATH');
  const lockPath = requireNonEmptyString(environment[BWS_UPSTREAM_LOCK_PATH_ENV], BWS_UPSTREAM_LOCK_PATH_ENV);
  const upstreamLock = verifyBettingWinUpstreamLock(
    readBettingWinUpstreamLock(lockPath, resolvedRepositoryRoot),
    {
      bettingWinRepoPath: upstreamRepoPath,
      repositoryRoot: resolvedRepositoryRoot,
    },
  );

  return Object.freeze({
    checkpointId: requireDeterministicId(
      environment[BWS_UPSTREAM_API_CHECKPOINT_ID_ENV],
      BWS_UPSTREAM_API_CHECKPOINT_ID_ENV,
    ),
    mode: 'api',
    persistence: resolveSurebetPersistenceConfig(environment),
    query: Object.freeze({
      baseUrl: requireNonEmptyString(environment[BWS_UPSTREAM_API_BASE_URL_ENV], BWS_UPSTREAM_API_BASE_URL_ENV),
      contractVersion: requireNonEmptyString(
        environment[BWS_UPSTREAM_API_CONTRACT_VERSION_ENV],
        BWS_UPSTREAM_API_CONTRACT_VERSION_ENV,
      ),
      maxPagesPerResource: requirePositiveIntegerString(
        environment[BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV],
        BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV,
      ),
      pageSize: requirePositiveIntegerString(
        environment[BWS_UPSTREAM_API_PAGE_SIZE_ENV],
        BWS_UPSTREAM_API_PAGE_SIZE_ENV,
      ),
      retryBackoffMs: requirePositiveIntegerString(
        environment[BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV],
        BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV,
      ),
      retryLimit: requireNonNegativeIntegerString(
        environment[BWS_UPSTREAM_API_RETRY_LIMIT_ENV],
        BWS_UPSTREAM_API_RETRY_LIMIT_ENV,
      ),
      timeoutMs: requirePositiveIntegerString(
        environment[BWS_UPSTREAM_API_TIMEOUT_MS_ENV],
        BWS_UPSTREAM_API_TIMEOUT_MS_ENV,
      ),
    }),
    repositoryRoot: resolvedRepositoryRoot,
    upstream: Object.freeze({
      lock: upstreamLock,
      lockPath,
      repoPath: upstreamRepoPath,
    }),
  });
}

export async function runBwsUpstreamApiConvergencePass(
  request: RunBwsUpstreamApiConvergencePassRequest = {},
): Promise<BoundaryResult<BwsUpstreamApiConvergencePassResult>> {
  const config = request.config ?? resolveBwsUpstreamApiConvergenceConfig(request.environment, request.repositoryRoot);
  const now = request.now ?? defaultNow;
  const clientResult = createReadOnlyQueryApiClient({
    baseUrl: config.query.baseUrl,
    contractVersion: config.query.contractVersion,
    fetchImplementation: request.fetchImplementation ?? globalThis.fetch.bind(globalThis),
    maxPageSize: config.query.pageSize,
    retryBackoffMs: config.query.retryBackoffMs,
    retryLimit: config.query.retryLimit,
    timeoutMs: config.query.timeoutMs,
    upstreamLock: config.upstream.lock,
  });
  if (!clientResult.ok) {
    return clientResult;
  }

  const upstreamLocks = request.upstreamLocks ?? new SurebetUpstreamLockRepository(config.persistence);
  const checkpoints = request.upstreamApiCheckpoints ?? new SurebetUpstreamApiConvergenceRepository(config.persistence);
  const importRuns = request.importRuns ?? new SurebetImportRunRepository(config.persistence);
  const lockRecordId = buildUpstreamLockRecordId(config.upstream.lock);
  const lockRecord = upstreamLocks.put({
    lock: config.upstream.lock,
    lockRecordId,
  });
  const existingCheckpoint = checkpoints.get(config.checkpointId);
  if (existingCheckpoint !== undefined) {
    const checkpointValidation = validateExistingCheckpoint(existingCheckpoint, config, lockRecord.lockRecordId);
    if (!checkpointValidation.ok) {
      return checkpointValidation;
    }
  }
  const checkpoint = existingCheckpoint ?? checkpoints.create({
    apiBaseUrl: clientResult.value.config.baseUrl,
    checkpointId: config.checkpointId,
    completedCycleCount: 0,
    contractVersion: config.query.contractVersion,
    currentCycleNumber: 1,
    currentResource: 'identity',
    currentResourcePageCount: 0,
    maxPagesPerResource: config.query.maxPagesPerResource,
    mode: 'api',
    pageSize: config.query.pageSize,
    retryBackoffMs: config.query.retryBackoffMs,
    retryLimit: config.query.retryLimit,
    timeoutMs: config.query.timeoutMs,
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  const importRunId = buildImportRunId(
    checkpoint.checkpointId,
    checkpoint.currentCycleNumber,
    checkpoint.currentResource,
    checkpoint.currentResourcePageCount + 1,
  );
  const existingImportRun = importRuns.get(importRunId);
  if (existingImportRun !== undefined) {
    const importRunValidation = validateExistingImportRun(existingImportRun, checkpoint, config, lockRecord.lockRecordId);
    if (!importRunValidation.ok) {
      return importRunValidation;
    }
    const recovered = recoverExistingImportRunResult(existingImportRun, checkpoint, checkpoints, importRuns, now);
    if (!recovered.ok) {
      return recovered;
    }
    return recovered;
  }

  const pageOutcome = await fetchApiPage(
    clientResult.value,
    checkpoint.currentResource,
    checkpoint.currentResourcePageCount + 1,
    checkpoint.nextCursor,
    config.query.pageSize,
  );
  if (!pageOutcome.ok) {
    return pageOutcome;
  }

  const importRun = importRuns.create({
    importRunId,
    metadata: buildImportRunMetadata(config, checkpoint, lockRecord.lockRecordId, pageOutcome.value),
    requestedAt: now(),
    sourceKind: 'continuous_read_only_query_page',
    sourceLocator: buildImportRunSourceLocator(config, checkpoint, checkpoint.nextCursor),
    startedAt: now(),
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  const nextState = computeNextCheckpointState(checkpoint, pageOutcome.value, config.query.maxPagesPerResource);
  if (!nextState.ok) {
    finalizeFailedImportRun(importRuns, importRun, now(), nextState.blockers);
    return nextState;
  }

  finalizeSucceededImportRun(importRuns, importRun, now(), pageOutcome.value.processedCount);
  checkpoints.advance({
    checkpointId: checkpoint.checkpointId,
    completedCycleCount: nextState.value.completedCycleCount,
    currentCycleNumber: nextState.value.currentCycleNumber,
    currentResource: nextState.value.currentResource,
    currentResourcePageCount: nextState.value.currentResourcePageCount,
    expectedCurrentCycleNumber: checkpoint.currentCycleNumber,
    expectedCurrentResource: checkpoint.currentResource,
    expectedCurrentResourcePageCount: checkpoint.currentResourcePageCount,
    lastImportRunId: importRunId,
    lastResponseProvenance: pageOutcome.value.provenance,
    ...(checkpoint.nextCursor === undefined ? {} : { expectedNextCursor: checkpoint.nextCursor }),
    ...(nextState.value.lastCompletedCycleAt === undefined ? {} : { lastCompletedCycleAt: nextState.value.lastCompletedCycleAt }),
    ...(nextState.value.nextCursor === undefined ? {} : { nextCursor: nextState.value.nextCursor }),
  });

  return accepted(
    Object.freeze({
      checkpointId: checkpoint.checkpointId,
      completedCycleCount: nextState.value.completedCycleCount,
      cycleCompleted: nextState.value.cycleCompleted,
      cycleNumber: checkpoint.currentCycleNumber,
      importRunId,
      mode: 'api',
      ...(nextState.value.nextCursor === undefined ? {} : { nextCursor: nextState.value.nextCursor }),
      nextResource: nextState.value.currentResource,
      pageNumber: pageOutcome.value.pageNumber,
      processedCount: pageOutcome.value.processedCount,
      resource: checkpoint.currentResource,
    }),
  );
}

async function fetchApiPage(
  client: ReadOnlyQueryApiClient,
  resource: ApiResource,
  pageNumber: number,
  cursor: string | undefined,
  pageSize: number,
): Promise<BoundaryResult<ApiPageOutcome>> {
  const responseResult = await queryResourcePage(client, resource, cursor, pageSize);
  if (!responseResult.ok) {
    return responseResult;
  }
  return accepted(
    Object.freeze({
      ...(responseResult.value.page.nextCursor === undefined ? {} : { nextCursor: responseResult.value.page.nextCursor }),
      pageNumber,
      processedCount: responseResult.value.page.returnedCount,
      provenance: Object.freeze({
        commitSha: responseResult.value.provenance.commitSha,
        repository: responseResult.value.provenance.repository,
        resource,
        responseReceivedAt: responseResult.value.provenance.responseReceivedAt,
        sourceView: responseResult.value.provenance.sourceView,
        verifiedAt: responseResult.value.provenance.verifiedAt,
      }),
      resource,
    }),
  );
}

async function queryResourcePage(
  client: ReadOnlyQueryApiClient,
  resource: ApiResource,
  cursor: string | undefined,
  pageSize: number,
): Promise<
  BoundaryResult<
    | ReadOnlyQueryResponseEnvelope<'identity'>
    | ReadOnlyQueryResponseEnvelope<'quotes'>
    | ReadOnlyQueryResponseEnvelope<'rules'>
    | ReadOnlyQueryResponseEnvelope<'settlement'>
  >
> {
  switch (resource) {
    case 'identity':
      return client.queryIdentity({
        ...(cursor === undefined ? {} : { cursor }),
        pageSize,
      });
    case 'rules':
      return client.queryRules({
        ...(cursor === undefined ? {} : { cursor }),
        pageSize,
      });
    case 'quotes':
      return client.queryQuotes({
        ...(cursor === undefined ? {} : { cursor }),
        pageSize,
      });
    case 'settlement':
      return client.querySettlement({
        ...(cursor === undefined ? {} : { cursor }),
        filters: Object.freeze({
          finalityStatus: 'terminal',
        }),
        pageSize,
      });
  }
}

function computeNextCheckpointState(
  checkpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  page: ApiPageOutcome,
  maxPagesPerResource: number,
): BoundaryResult<{
  readonly completedCycleCount: number;
  readonly currentCycleNumber: number;
  readonly currentResource: ApiResource;
  readonly currentResourcePageCount: number;
  readonly cycleCompleted: boolean;
  readonly lastCompletedCycleAt?: string;
  readonly nextCursor?: string;
}> {
  if (page.resource !== checkpoint.currentResource) {
    return blocked(
      'BWS_UPSTREAM_API_RESOURCE_MISMATCH',
      `BWS upstream API convergence checkpoint ${checkpoint.checkpointId} expected resource ${checkpoint.currentResource} but recovered ${page.resource}.`,
      'Persisted read-only query page metadata aligned to the checkpoint resource state.',
    );
  }
  if (page.pageNumber !== checkpoint.currentResourcePageCount + 1) {
    return blocked(
      'BWS_UPSTREAM_API_PAGE_NUMBER_MISMATCH',
      `BWS upstream API convergence checkpoint ${checkpoint.checkpointId} expected page ${checkpoint.currentResourcePageCount + 1} but recovered ${page.pageNumber}.`,
      'Persisted read-only query page metadata aligned to the checkpoint page state.',
    );
  }

  if (page.nextCursor !== undefined) {
    if (page.pageNumber >= maxPagesPerResource) {
      return blocked(
        'BWS_UPSTREAM_API_PAGE_BOUND_EXCEEDED',
        'BWS upstream API convergence rejects pagination paths that exceed the explicit per-resource page bound.',
        'A bounded read-only query scope whose pagination completes within maxPagesPerResource.',
      );
    }
    return accepted(
      Object.freeze({
        completedCycleCount: checkpoint.completedCycleCount,
        currentCycleNumber: checkpoint.currentCycleNumber,
        currentResource: checkpoint.currentResource,
        currentResourcePageCount: page.pageNumber,
        cycleCompleted: false,
        nextCursor: page.nextCursor,
      }),
    );
  }

  const nextResource = nextApiResource(checkpoint.currentResource);
  if (nextResource !== undefined) {
    return accepted(
      Object.freeze({
        completedCycleCount: checkpoint.completedCycleCount,
        currentCycleNumber: checkpoint.currentCycleNumber,
        currentResource: nextResource,
        currentResourcePageCount: 0,
        cycleCompleted: false,
      }),
    );
  }

  return accepted(
    Object.freeze({
      completedCycleCount: checkpoint.completedCycleCount + 1,
      currentCycleNumber: checkpoint.currentCycleNumber + 1,
      currentResource: 'identity',
      currentResourcePageCount: 0,
      cycleCompleted: true,
      lastCompletedCycleAt: page.provenance.responseReceivedAt,
    }),
  );
}

function recoverExistingImportRunResult(
  importRun: SurebetImportRunRecord,
  checkpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  checkpoints: Pick<SurebetUpstreamApiConvergenceRepository, 'advance'>,
  importRuns: Pick<SurebetImportRunRepository, 'finalize'>,
  now: () => string,
): BoundaryResult<BwsUpstreamApiConvergencePassResult> {
  const metadata = parseImportRunMetadata(importRun.metadata);
  if (!metadata.ok) {
    return metadata;
  }
  const nextState = computeNextCheckpointState(checkpoint, metadata.value.page, metadata.value.maxPagesPerResource);
  if (!nextState.ok) {
    return nextState;
  }
  if (importRun.outcome === 'failed') {
    return importRunFailureToBoundary(importRun);
  }
  if (importRun.outcome === 'running') {
    finalizeSucceededImportRun(importRuns, importRun, now(), metadata.value.page.processedCount);
  }
  checkpoints.advance({
    checkpointId: checkpoint.checkpointId,
    completedCycleCount: nextState.value.completedCycleCount,
    currentCycleNumber: nextState.value.currentCycleNumber,
    currentResource: nextState.value.currentResource,
    currentResourcePageCount: nextState.value.currentResourcePageCount,
    expectedCurrentCycleNumber: checkpoint.currentCycleNumber,
    expectedCurrentResource: checkpoint.currentResource,
    expectedCurrentResourcePageCount: checkpoint.currentResourcePageCount,
    lastImportRunId: importRun.importRunId,
    lastResponseProvenance: metadata.value.page.provenance,
    ...(checkpoint.nextCursor === undefined ? {} : { expectedNextCursor: checkpoint.nextCursor }),
    ...(nextState.value.lastCompletedCycleAt === undefined ? {} : { lastCompletedCycleAt: nextState.value.lastCompletedCycleAt }),
    ...(nextState.value.nextCursor === undefined ? {} : { nextCursor: nextState.value.nextCursor }),
  });
  return accepted(
    Object.freeze({
      checkpointId: checkpoint.checkpointId,
      completedCycleCount: nextState.value.completedCycleCount,
      cycleCompleted: nextState.value.cycleCompleted,
      cycleNumber: checkpoint.currentCycleNumber,
      importRunId: importRun.importRunId,
      mode: 'api',
      ...(nextState.value.nextCursor === undefined ? {} : { nextCursor: nextState.value.nextCursor }),
      nextResource: nextState.value.currentResource,
      pageNumber: metadata.value.page.pageNumber,
      processedCount: metadata.value.page.processedCount,
      resource: checkpoint.currentResource,
    }),
  );
}

function validateExistingCheckpoint(
  checkpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  config: BwsUpstreamApiConvergenceConfig,
  upstreamLockRecordId: string,
): BoundaryResult<undefined> {
  if (checkpoint.mode !== 'api') {
    return blocked(
      'BWS_UPSTREAM_API_CHECKPOINT_MODE_MISMATCH',
      `BWS upstream API checkpoint ${checkpoint.checkpointId} must remain in api mode.`,
      'Persisted api-mode convergence checkpoint.',
    );
  }
  if (checkpoint.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_UPSTREAM_API_CHECKPOINT_LOCK_MISMATCH',
      `BWS upstream API checkpoint ${checkpoint.checkpointId} must stay pinned to the exact verified upstream lock.`,
      'Persisted api checkpoint bound to the same verified betting-win upstream lock.',
    );
  }
  if (
    checkpoint.apiBaseUrl !== config.query.baseUrl
    || checkpoint.contractVersion !== config.query.contractVersion
    || checkpoint.pageSize !== config.query.pageSize
    || checkpoint.maxPagesPerResource !== config.query.maxPagesPerResource
    || checkpoint.retryLimit !== config.query.retryLimit
    || checkpoint.retryBackoffMs !== config.query.retryBackoffMs
    || checkpoint.timeoutMs !== config.query.timeoutMs
  ) {
    return blocked(
      'BWS_UPSTREAM_API_CONFIGURATION_MUTATED',
      `BWS upstream API checkpoint ${checkpoint.checkpointId} rejects mutable API convergence configuration replacement.`,
      'An unchanged explicit API convergence configuration for the persisted checkpoint.',
    );
  }
  return accepted(undefined);
}

function validateExistingImportRun(
  importRun: SurebetImportRunRecord,
  checkpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  config: BwsUpstreamApiConvergenceConfig,
  upstreamLockRecordId: string,
): BoundaryResult<undefined> {
  if (importRun.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_LOCK_MISMATCH',
      `BWS upstream API import run ${importRun.importRunId} must remain pinned to the same verified upstream lock.`,
      'Persisted API import run bound to the same verified betting-win upstream lock.',
    );
  }
  if (importRun.sourceKind !== 'continuous_read_only_query_page') {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_KIND_MISMATCH',
      `BWS upstream API import run ${importRun.importRunId} must stay within the continuous read-only query page source kind.`,
      'Persisted API import run created by the BWS API convergence pass.',
    );
  }
  const metadata = parseImportRunMetadata(importRun.metadata);
  if (!metadata.ok) {
    return metadata;
  }
  if (
    metadata.value.checkpointId !== checkpoint.checkpointId
    || metadata.value.apiBaseUrl !== config.query.baseUrl
    || metadata.value.contractVersion !== config.query.contractVersion
    || metadata.value.cycleNumber !== checkpoint.currentCycleNumber
    || metadata.value.maxPagesPerResource !== config.query.maxPagesPerResource
    || metadata.value.pageSize !== config.query.pageSize
    || metadata.value.resource !== checkpoint.currentResource
    || metadata.value.retryBackoffMs !== config.query.retryBackoffMs
    || metadata.value.retryLimit !== config.query.retryLimit
    || metadata.value.timeoutMs !== config.query.timeoutMs
    || metadata.value.upstreamLockRecordId !== upstreamLockRecordId
    || metadata.value.page.pageNumber !== checkpoint.currentResourcePageCount + 1
  ) {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_METADATA_MISMATCH',
      `BWS upstream API import run ${importRun.importRunId} metadata must remain aligned to the persisted checkpoint and explicit API configuration.`,
      'Persisted API import-run metadata aligned to the checkpoint cursor state.',
    );
  }
  return accepted(undefined);
}

function parseImportRunMetadata(value: JsonValue): BoundaryResult<PersistedApiImportRunMetadata> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_METADATA_INVALID',
      'BWS upstream API import-run metadata must remain a JSON object.',
      'Object-shaped persisted API import-run metadata.',
    );
  }
  const record = value as Record<string, unknown>;
  if (record.mode !== 'api') {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_METADATA_INVALID',
      'BWS upstream API import-run metadata must remain in explicit api mode.',
      'Persisted api-mode import-run metadata.',
    );
  }
  const checkpointId = requireDeterministicId(record.checkpointId, 'metadata.checkpointId');
  const apiBaseUrl = requireNonEmptyString(record.apiBaseUrl, 'metadata.apiBaseUrl');
  const contractVersion = requireNonEmptyString(record.contractVersion, 'metadata.contractVersion');
  const cycleNumber = requirePositiveInteger(record.cycleNumber, 'metadata.cycleNumber');
  const maxPagesPerResource = requirePositiveInteger(record.maxPagesPerResource, 'metadata.maxPagesPerResource');
  const pageSize = requirePositiveInteger(record.pageSize, 'metadata.pageSize');
  const resource = requireApiResource(record.resource, 'metadata.resource');
  const retryBackoffMs = requirePositiveInteger(record.retryBackoffMs, 'metadata.retryBackoffMs');
  const retryLimit = requireNonNegativeInteger(record.retryLimit, 'metadata.retryLimit');
  const timeoutMs = requirePositiveInteger(record.timeoutMs, 'metadata.timeoutMs');
  const upstreamLockRecordId = requireNonEmptyString(record.upstreamLockRecordId, 'metadata.upstreamLockRecordId');
  const page = parsePageOutcome(record.page);
  if (!page.ok) {
    return page;
  }
  const requestCursor = record.requestCursor === undefined
    ? undefined
    : requireNonEmptyString(record.requestCursor, 'metadata.requestCursor');

  return accepted(
    Object.freeze({
      apiBaseUrl,
      checkpointId,
      contractVersion,
      cycleNumber,
      maxPagesPerResource,
      mode: 'api',
      page: page.value,
      pageSize,
      ...(requestCursor === undefined ? {} : { requestCursor }),
      resource,
      retryBackoffMs,
      retryLimit,
      timeoutMs,
      upstreamLockRecordId,
    }),
  );
}

function parsePageOutcome(value: unknown): BoundaryResult<ApiPageOutcome> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_METADATA_INVALID',
      'BWS upstream API persisted page metadata must remain an object.',
      'Object-shaped persisted API page metadata.',
    );
  }
  const record = value as Record<string, unknown>;
  const pageNumber = requirePositiveInteger(record.pageNumber, 'metadata.page.pageNumber');
  const processedCount = requireNonNegativeInteger(record.processedCount, 'metadata.page.processedCount');
  const resource = requireApiResource(record.resource, 'metadata.page.resource');
  const nextCursor = record.nextCursor === undefined
    ? undefined
    : requireNonEmptyString(record.nextCursor, 'metadata.page.nextCursor');
  const provenanceResult = parseResponseProvenance(record.provenance, resource);
  if (!provenanceResult.ok) {
    return provenanceResult;
  }
  return accepted(
    Object.freeze({
      ...(nextCursor === undefined ? {} : { nextCursor }),
      pageNumber,
      processedCount,
      provenance: provenanceResult.value,
      resource,
    }),
  );
}

function parseResponseProvenance(
  value: unknown,
  resource: ApiResource,
): BoundaryResult<SurebetUpstreamApiResponseProvenance> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return blocked(
      'BWS_UPSTREAM_API_IMPORT_METADATA_INVALID',
      'BWS upstream API persisted provenance must remain an object.',
      'Object-shaped persisted API provenance metadata.',
    );
  }
  const record = value as Record<string, unknown>;
  return accepted(
    Object.freeze({
      commitSha: requireNonEmptyString(record.commitSha, 'metadata.page.provenance.commitSha'),
      repository: requireNonEmptyString(record.repository, 'metadata.page.provenance.repository'),
      resource,
      responseReceivedAt: requireIsoTimestamp(
        record.responseReceivedAt,
        'metadata.page.provenance.responseReceivedAt',
      ),
      sourceView: requireNonEmptyString(record.sourceView, 'metadata.page.provenance.sourceView'),
      verifiedAt: requireIsoTimestamp(record.verifiedAt, 'metadata.page.provenance.verifiedAt'),
    }),
  );
}

function importRunFailureToBoundary(importRun: SurebetImportRunRecord): BoundaryResult<never> {
  const blockersValue = importRun.failureDetails;
  if (typeof blockersValue !== 'object' || blockersValue === null || Array.isArray(blockersValue)) {
    return blocked(
      importRun.failureCode ?? 'BWS_UPSTREAM_API_IMPORT_FAILED',
      `BWS upstream API import run ${importRun.importRunId} is finalized as failed.`,
      'Persisted blocker details for the failed API import run.',
    );
  }
  const record = blockersValue as Record<string, unknown>;
  const blockers = Array.isArray(record.blockers) ? record.blockers : undefined;
  if (blockers === undefined || blockers.length === 0) {
    return blocked(
      importRun.failureCode ?? 'BWS_UPSTREAM_API_IMPORT_FAILED',
      `BWS upstream API import run ${importRun.importRunId} is finalized as failed.`,
      'Persisted blocker details for the failed API import run.',
    );
  }
  const normalizedBlockers = blockers.map((entry) => {
    const blocker = entry as Record<string, unknown>;
    return Object.freeze({
      code: requireNonEmptyString(blocker.code, 'failureDetails.blockers.code'),
      evidenceRequired: requireNonEmptyString(
        blocker.evidenceRequired,
        'failureDetails.blockers.evidenceRequired',
      ),
      message: requireNonEmptyString(blocker.message, 'failureDetails.blockers.message'),
    });
  });
  return Object.freeze({
    blockers: normalizedBlockers,
    ok: false,
  });
}

function buildImportRunMetadata(
  config: BwsUpstreamApiConvergenceConfig,
  checkpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  upstreamLockRecordId: string,
  page: ApiPageOutcome,
): JsonValue {
  return Object.freeze({
    apiBaseUrl: config.query.baseUrl,
    checkpointId: checkpoint.checkpointId,
    contractVersion: config.query.contractVersion,
    cycleNumber: checkpoint.currentCycleNumber,
    maxPagesPerResource: config.query.maxPagesPerResource,
    mode: 'api',
    page: Object.freeze({
      ...(page.nextCursor === undefined ? {} : { nextCursor: page.nextCursor }),
      pageNumber: page.pageNumber,
      processedCount: page.processedCount,
      provenance: Object.freeze({
        commitSha: page.provenance.commitSha,
        repository: page.provenance.repository,
        resource: page.provenance.resource,
        responseReceivedAt: page.provenance.responseReceivedAt,
        sourceView: page.provenance.sourceView,
        verifiedAt: page.provenance.verifiedAt,
      }),
      resource: page.resource,
    }),
    pageSize: config.query.pageSize,
    ...(checkpoint.nextCursor === undefined ? {} : { requestCursor: checkpoint.nextCursor }),
    resource: checkpoint.currentResource,
    retryBackoffMs: config.query.retryBackoffMs,
    retryLimit: config.query.retryLimit,
    timeoutMs: config.query.timeoutMs,
    upstreamLockRecordId,
  });
}

function buildImportRunSourceLocator(
  config: BwsUpstreamApiConvergenceConfig,
  checkpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  requestCursor: string | undefined,
): string {
  return `${config.query.baseUrl}#${checkpoint.checkpointId}:cycle:${checkpoint.currentCycleNumber}:resource:${checkpoint.currentResource}:page:${checkpoint.currentResourcePageCount + 1}${requestCursor === undefined ? '' : `:cursor:${requestCursor}`}`;
}

function finalizeFailedImportRun(
  importRuns: Pick<SurebetImportRunRepository, 'finalize'>,
  importRun: SurebetImportRunRecord,
  completedAt: string,
  blockers: readonly Blocker[],
): void {
  if (importRun.outcome !== 'running') {
    return;
  }
  importRuns.finalize({
    completedAt,
    failureCode: blockers[0]?.code ?? 'BWS_UPSTREAM_API_CONVERGENCE_FAILED',
    failureDetails: Object.freeze({
      blockers: blockers.map((blocker) =>
        Object.freeze({
          code: blocker.code,
          evidenceRequired: blocker.evidenceRequired,
          message: blocker.message,
        })),
      mode: 'api',
    }) as JsonValue,
    importRunId: importRun.importRunId,
    importedRecordCount: 0,
    outcome: 'failed',
  });
}

function finalizeSucceededImportRun(
  importRuns: Pick<SurebetImportRunRepository, 'finalize'>,
  importRun: SurebetImportRunRecord,
  completedAt: string,
  importedRecordCount: number,
): SurebetImportRunRecord {
  if (importRun.outcome === 'succeeded') {
    return importRun;
  }
  if (importRun.outcome === 'failed') {
    throw new Error(
      `BWS upstream API convergence import run ${importRun.importRunId} was already finalized as failed and must not be replayed.`,
    );
  }
  return importRuns.finalize({
    completedAt,
    importRunId: importRun.importRunId,
    importedRecordCount,
    outcome: 'succeeded',
  });
}

function rejectUnknownApiEnvironmentKeys(environment: BwsUpstreamApiConvergenceEnvironment): void {
  const allowed = new Set([
    BWS_UPSTREAM_API_BASE_URL_ENV,
    BWS_UPSTREAM_API_CHECKPOINT_ID_ENV,
    BWS_UPSTREAM_API_CONTRACT_VERSION_ENV,
    BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV,
    BWS_UPSTREAM_API_PAGE_SIZE_ENV,
    BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV,
    BWS_UPSTREAM_API_RETRY_LIMIT_ENV,
    BWS_UPSTREAM_API_TIMEOUT_MS_ENV,
  ]);
  for (const key of Object.keys(environment)) {
    if (!key.startsWith(API_ENV_PREFIX) || allowed.has(key)) {
      continue;
    }
    if (SENSITIVE_API_SETTING_PATTERN.test(key)) {
      throw new Error(`${key} is forbidden; BWS API mode must not accept provider credentials or secret material.`);
    }
    if (UNSUPPORTED_PROVIDER_SETTING_PATTERN.test(key)) {
      throw new Error(`${key} is forbidden; BWS API mode accepts only the betting-win read-only query base URL.`);
    }
    throw new Error(`${key} is not a supported BWS API convergence setting.`);
  }
}

function buildImportRunId(
  checkpointId: string,
  cycleNumber: number,
  resource: ApiResource,
  pageNumber: number,
): string {
  return `import:${checkpointId}:cycle:${cycleNumber}:${resource}:page:${pageNumber}`;
}

function buildUpstreamLockRecordId(lock: BettingWinUpstreamLock): string {
  return `upstream-lock:${lock.commitSha}:${lock.gitTreeSha}`;
}

function nextApiResource(resource: ApiResource): ApiResource | undefined {
  const index = API_RESOURCE_ORDER.indexOf(resource);
  return index >= 0 ? API_RESOURCE_ORDER[index + 1] : undefined;
}

function requireLiteral(value: string | undefined, name: string, expected: string): string {
  if (value !== expected) {
    throw new Error(`${name} must be exactly ${expected}.`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
}

function requireDeterministicId(value: unknown, name: string): string {
  const normalized = requireNonEmptyString(value, name);
  if (!ID_PATTERN.test(normalized)) {
    throw new Error(`${name} must match ${ID_PATTERN.source}.`);
  }
  return normalized;
}

function requirePositiveIntegerString(value: unknown, name: string): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    throw new Error(`${name} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a base-10 positive integer.`);
  }
  return parsed;
}

function requireNonNegativeIntegerString(value: unknown, name: string): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    throw new Error(`${name} must be a base-10 non-negative integer.`);
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a base-10 non-negative integer.`);
  }
  return parsed;
}

function requirePositiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function requireNonNegativeInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return value;
}

function requireApiResource(value: unknown, name: string): ApiResource {
  if (typeof value !== 'string' || !(API_RESOURCE_ORDER as readonly string[]).includes(value)) {
    throw new Error(`${name} must be one of ${API_RESOURCE_ORDER.join(', ')}.`);
  }
  return value as ApiResource;
}

function requireIsoTimestamp(value: unknown, name: string): string {
  if (typeof value !== 'string' || !ISO_UTC_TIMESTAMP.test(value)) {
    throw new Error(`${name} must be an ISO-8601 UTC timestamp.`);
  }
  return value;
}

function defaultNow(): string {
  const now = new Date().toISOString();
  if (!ISO_UTC_TIMESTAMP.test(now)) {
    throw new Error('BWS upstream API convergence timestamp source must emit ISO-8601 UTC timestamps.');
  }
  return now;
}
