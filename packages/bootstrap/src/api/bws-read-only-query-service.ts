import { createHash } from 'node:crypto';
import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import type { SurebetImportRunRecord, SurebetImportRunRepository } from '../../../persistence/src/repositories/import-run-repository.js';
import type {
  SurebetPinnedStrategyExportListFilters,
  SurebetPinnedStrategyExportListRequest,
  SurebetPinnedStrategyExportRecord,
  SurebetPinnedStrategyExportRepository,
} from '../../../persistence/src/repositories/pinned-strategy-export-repository.js';
import type {
  SurebetStrategyLedgerEntry,
  SurebetStrategyAcceptanceState,
  SurebetStrategyRunKind,
  SurebetStrategySourceKind,
} from '../strategy/strategy-ledger.js';
import { validateSurebetStrategyLedgerEntry } from '../strategy/strategy-ledger.js';
import type {
  SurebetStrategyLedgerListFilters,
  SurebetStrategyLedgerListRequest,
  SurebetStrategyLedgerRecord,
  SurebetStrategyLedgerRepository,
} from '../../../persistence/src/repositories/strategy-ledger-repository.js';
import type { SurebetUpstreamLockRepository } from '../../../persistence/src/repositories/upstream-lock-repository.js';
import { accepted, blocked, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';
import { describeReadOnlyQueryApiClientBoundary } from '../adapters/betting-win-query-client.js';

const BWS_READ_ONLY_QUERY_SERVICE_PHASE = 'BWS-400';
const MAX_CURSOR_BYTES = 512;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export interface BwsReadOnlyQueryBoundary {
  readonly automaticFallback: 'forbidden';
  readonly bwsReadOnlyQueryServiceBoundary: string;
  readonly upstreamReadOnlyQueryClientBoundary: string;
}

export interface BwsReadOnlyQueryPage<TItem> {
  readonly items: readonly TItem[];
  readonly nextCursor?: string;
  readonly pageSize: number;
  readonly returnedCount: number;
}

export interface BwsReadOnlyQueryResponse<TResource extends string, TItem> {
  readonly boundary: BwsReadOnlyQueryBoundary;
  readonly generatedAt: IsoTimestamp;
  readonly page: BwsReadOnlyQueryPage<TItem>;
  readonly resource: TResource;
}

export interface BwsStrategyLedgerQueryFilters {
  readonly acceptanceState?: string;
  readonly pinnedStrategyExportRecordId?: string;
  readonly reportId?: string;
  readonly runFingerprintSha256?: string;
  readonly runKind?: string;
  readonly runReferenceId?: string;
  readonly sourceKind?: string;
  readonly sourceManifestHash?: string;
  readonly upstreamLockRecordId?: string;
}

export interface BwsStrategyLedgerQueryRequest {
  readonly cursor?: string;
  readonly expand?: string;
  readonly filters: BwsStrategyLedgerQueryFilters;
  readonly pageSize: number;
}

export interface BwsPinnedStrategyExportQueryFilters {
  readonly endpointId?: string;
  readonly exportId?: string;
  readonly importRunId?: string;
  readonly providerId?: string;
  readonly sourceSha256?: string;
  readonly upstreamLockRecordId?: string;
}

export interface BwsPinnedStrategyExportQueryRequest {
  readonly cursor?: string;
  readonly expand?: string;
  readonly filters: BwsPinnedStrategyExportQueryFilters;
  readonly pageSize: number;
}

export interface BwsReadOnlyQueryDependencies {
  readonly importRuns: Pick<SurebetImportRunRepository, 'get'>;
  readonly pinnedStrategyExports: Pick<SurebetPinnedStrategyExportRepository, 'get' | 'list'>;
  readonly strategyLedger: Pick<SurebetStrategyLedgerRepository, 'list'>;
  readonly upstreamLocks: Pick<SurebetUpstreamLockRepository, 'get'>;
}

export interface BwsReadOnlyQueryServiceConfig {
  readonly generatedAt: () => string;
  readonly maxPageSize: number;
}

export interface BwsStrategyLedgerItemProvenance {
  readonly importRun?: SurebetImportRunRecord;
  readonly pinnedStrategyExport?: SurebetPinnedStrategyExportRecord;
  readonly upstreamLock: BettingWinUpstreamLock;
  readonly upstreamLockRecordId: string;
}

export interface BwsStrategyLedgerItem {
  readonly entry: SurebetStrategyLedgerEntry;
  readonly insertedAt: IsoTimestamp;
  readonly ledgerEntryId: string;
  readonly provenance: BwsStrategyLedgerItemProvenance;
}

export interface BwsPinnedStrategyExportItemProvenance {
  readonly importRun: SurebetImportRunRecord;
  readonly upstreamLock: BettingWinUpstreamLock;
  readonly upstreamLockRecordId: string;
}

export interface BwsPinnedStrategyExportItem {
  readonly intakeRecordId: string;
  readonly insertedAt: IsoTimestamp;
  readonly provenance: BwsPinnedStrategyExportItemProvenance;
  readonly record: SurebetPinnedStrategyExportRecord;
}

export interface BwsReadOnlyQueryService {
  readonly boundary: BwsReadOnlyQueryBoundary;
  queryPinnedStrategyExports(
    request: BwsPinnedStrategyExportQueryRequest,
  ): BoundaryResult<BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>>;
  queryStrategyLedger(
    request: BwsStrategyLedgerQueryRequest,
  ): BoundaryResult<BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>>;
}

interface CursorPayload {
  readonly afterId: string;
  readonly filtersSha256: string;
  readonly resource: 'pinned_strategy_exports' | 'strategy_ledger_entries';
}

interface NormalizedStrategyLedgerRequest {
  readonly afterLedgerEntryId?: string;
  readonly expand: 'provenance';
  readonly filters: SurebetStrategyLedgerListFilters;
  readonly pageSize: number;
}

interface NormalizedPinnedStrategyExportRequest {
  readonly afterIntakeRecordId?: string;
  readonly expand: 'provenance';
  readonly filters: SurebetPinnedStrategyExportListFilters;
  readonly pageSize: number;
}

export function describeBwsReadOnlyQueryServiceBoundary(): string {
  return `@betting-win-surebet/bootstrap:${BWS_READ_ONLY_QUERY_SERVICE_PHASE}`;
}

export function createBwsReadOnlyQueryService(
  dependencies: BwsReadOnlyQueryDependencies,
  config: BwsReadOnlyQueryServiceConfig,
): BoundaryResult<BwsReadOnlyQueryService> {
  const validatedConfig = validateConfig(config);
  if (!validatedConfig.ok) {
    return validatedConfig;
  }
  const validatedDependencies = validateDependencies(dependencies);
  if (!validatedDependencies.ok) {
    return validatedDependencies;
  }

  const boundary = Object.freeze({
    automaticFallback: 'forbidden',
    bwsReadOnlyQueryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
    upstreamReadOnlyQueryClientBoundary: describeReadOnlyQueryApiClientBoundary(),
  } satisfies BwsReadOnlyQueryBoundary);

  const service: BwsReadOnlyQueryService = {
    boundary,
    queryPinnedStrategyExports(request) {
      return queryPinnedStrategyExports(validatedDependencies.value, validatedConfig.value, boundary, request);
    },
    queryStrategyLedger(request) {
      return queryStrategyLedger(validatedDependencies.value, validatedConfig.value, boundary, request);
    },
  };
  return accepted(Object.freeze(service));
}

function queryStrategyLedger(
  dependencies: BwsReadOnlyQueryDependencies,
  config: Readonly<BwsReadOnlyQueryServiceConfig>,
  boundary: BwsReadOnlyQueryBoundary,
  request: BwsStrategyLedgerQueryRequest,
): BoundaryResult<BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>> {
  const normalized = validateStrategyLedgerRequest(config, request);
  if (!normalized.ok) {
    return normalized;
  }

  const records = dependencies.strategyLedger.list({
    ...(normalized.value.afterLedgerEntryId === undefined ? {} : { afterLedgerEntryId: normalized.value.afterLedgerEntryId }),
    filters: normalized.value.filters,
    limit: normalized.value.pageSize + 1,
  } satisfies SurebetStrategyLedgerListRequest);

  const pageItems = records.slice(0, normalized.value.pageSize);
  const items: BwsStrategyLedgerItem[] = [];
  for (const record of pageItems) {
    const item = expandStrategyLedgerRecord(dependencies, record);
    if (!item.ok) {
      return item;
    }
    items.push(item.value);
  }

  const nextCursor = records.length > normalized.value.pageSize
    ? encodeCursor({
        afterId: pageItems[pageItems.length - 1]!.ledgerEntryId,
        filtersSha256: hashCursorScope('strategy_ledger_entries', normalized.value.filters),
        resource: 'strategy_ledger_entries',
      })
    : undefined;
  return accepted(
    Object.freeze({
      boundary,
      generatedAt: config.generatedAt(),
      page: Object.freeze({
        items: Object.freeze(items),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        pageSize: normalized.value.pageSize,
        returnedCount: items.length,
      }),
      resource: 'strategy_ledger_entries',
    }),
  );
}

function queryPinnedStrategyExports(
  dependencies: BwsReadOnlyQueryDependencies,
  config: Readonly<BwsReadOnlyQueryServiceConfig>,
  boundary: BwsReadOnlyQueryBoundary,
  request: BwsPinnedStrategyExportQueryRequest,
): BoundaryResult<BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>> {
  const normalized = validatePinnedStrategyExportRequest(config, request);
  if (!normalized.ok) {
    return normalized;
  }

  const records = dependencies.pinnedStrategyExports.list({
    ...(normalized.value.afterIntakeRecordId === undefined ? {} : { afterIntakeRecordId: normalized.value.afterIntakeRecordId }),
    filters: normalized.value.filters,
    limit: normalized.value.pageSize + 1,
  } satisfies SurebetPinnedStrategyExportListRequest);

  const pageItems = records.slice(0, normalized.value.pageSize);
  const items: BwsPinnedStrategyExportItem[] = [];
  for (const record of pageItems) {
    const item = expandPinnedStrategyExportRecord(dependencies, record);
    if (!item.ok) {
      return item;
    }
    items.push(item.value);
  }

  const nextCursor = records.length > normalized.value.pageSize
    ? encodeCursor({
        afterId: pageItems[pageItems.length - 1]!.intakeRecordId,
        filtersSha256: hashCursorScope('pinned_strategy_exports', normalized.value.filters),
        resource: 'pinned_strategy_exports',
      })
    : undefined;
  return accepted(
    Object.freeze({
      boundary,
      generatedAt: config.generatedAt(),
      page: Object.freeze({
        items: Object.freeze(items),
        ...(nextCursor === undefined ? {} : { nextCursor }),
        pageSize: normalized.value.pageSize,
        returnedCount: items.length,
      }),
      resource: 'pinned_strategy_exports',
    }),
  );
}

function expandStrategyLedgerRecord(
  dependencies: BwsReadOnlyQueryDependencies,
  record: SurebetStrategyLedgerRecord,
): BoundaryResult<BwsStrategyLedgerItem> {
  const entryValidation = validateSurebetStrategyLedgerEntry(record.entry);
  if (!entryValidation.ok) {
    return entryValidation;
  }

  const upstreamLock = dependencies.upstreamLocks.get(record.upstreamLockRecordId);
  if (upstreamLock === undefined) {
    return blocked(
      'BWS_QUERY_PROVENANCE_MISSING',
      `BWS read-only strategy ledger entry ${record.ledgerEntryId} requires an upstream lock provenance expansion.`,
      'Persisted committed-HEAD betting-win upstream lock evidence for every returned strategy ledger entry.',
    );
  }

  if (record.entry.sourceKind === 'read_only_query') {
    if (record.pinnedStrategyExportRecordId !== undefined) {
      return blocked(
        'BWS_QUERY_PROVENANCE_INVALID',
        'BWS read-only strategy ledger entries sourced from read_only_query must not expose pinned export provenance.',
        'Strategy ledger entries whose read_only_query provenance omits pinned export references.',
      );
    }
    return accepted(
      Object.freeze({
        entry: record.entry,
        insertedAt: record.insertedAt,
        ledgerEntryId: record.ledgerEntryId,
        provenance: Object.freeze({
          upstreamLock: upstreamLock.lock,
          upstreamLockRecordId: record.upstreamLockRecordId,
        }),
      }),
    );
  }

  if (record.pinnedStrategyExportRecordId === undefined) {
    return blocked(
      'BWS_QUERY_PROVENANCE_MISSING',
      `BWS read-only strategy ledger entry ${record.ledgerEntryId} requires pinned export provenance expansion.`,
      'Pinned strategy export provenance for resource_export and pinned_records strategy ledger entries.',
    );
  }

  const pinnedStrategyExport = dependencies.pinnedStrategyExports.get(record.pinnedStrategyExportRecordId);
  if (pinnedStrategyExport === undefined) {
    return blocked(
      'BWS_QUERY_PROVENANCE_MISSING',
      `BWS read-only strategy ledger entry ${record.ledgerEntryId} references missing pinned strategy export ${record.pinnedStrategyExportRecordId}.`,
      'Persisted pinned strategy export provenance for every non-read_only_query strategy ledger entry.',
    );
  }
  if (pinnedStrategyExport.upstreamLockRecordId !== record.upstreamLockRecordId) {
    return blocked(
      'BWS_QUERY_PROVENANCE_INVALID',
      'BWS read-only strategy ledger entry provenance must keep the pinned strategy export on the same upstream lock.',
      'Strategy ledger and pinned export provenance bound to the same committed-HEAD upstream lock record.',
    );
  }

  const importRun = dependencies.importRuns.get(pinnedStrategyExport.importRunId);
  if (importRun === undefined) {
    return blocked(
      'BWS_QUERY_PROVENANCE_MISSING',
      `BWS read-only strategy ledger entry ${record.ledgerEntryId} requires import-run provenance for pinned export ${pinnedStrategyExport.intakeRecordId}.`,
      'Persisted import-run provenance for every pinned strategy export.',
    );
  }
  if (importRun.upstreamLockRecordId !== record.upstreamLockRecordId) {
    return blocked(
      'BWS_QUERY_PROVENANCE_INVALID',
      'BWS read-only strategy ledger entry provenance must keep the import run on the same upstream lock.',
      'Import-run provenance bound to the same committed-HEAD upstream lock record as the strategy ledger entry.',
    );
  }

  return accepted(
    Object.freeze({
      entry: record.entry,
      insertedAt: record.insertedAt,
      ledgerEntryId: record.ledgerEntryId,
      provenance: Object.freeze({
        importRun,
        pinnedStrategyExport,
        upstreamLock: upstreamLock.lock,
        upstreamLockRecordId: record.upstreamLockRecordId,
      }),
    }),
  );
}

function expandPinnedStrategyExportRecord(
  dependencies: BwsReadOnlyQueryDependencies,
  record: SurebetPinnedStrategyExportRecord,
): BoundaryResult<BwsPinnedStrategyExportItem> {
  if (
    record.contractSchema !== 'betting-win.strategy-export.v1'
    || record.contractAlias !== 'betting-win-strategy-export.v1'
    || record.surebetProfile !== 'surebet_standard_binary_v0'
    || record.exportKind !== 'pinned_provider_history_bundle'
  ) {
    return blocked(
      'BWS_QUERY_PROVENANCE_INVALID',
      'BWS read-only pinned strategy export responses require immutable upstream contract and bundle metadata.',
      'Pinned strategy export records whose schema, alias, profile, and export kind remain on the validated immutable contract.',
    );
  }

  const upstreamLock = dependencies.upstreamLocks.get(record.upstreamLockRecordId);
  if (upstreamLock === undefined) {
    return blocked(
      'BWS_QUERY_PROVENANCE_MISSING',
      `BWS read-only pinned strategy export ${record.intakeRecordId} requires an upstream lock provenance expansion.`,
      'Persisted committed-HEAD betting-win upstream lock evidence for every returned pinned strategy export.',
    );
  }

  const importRun = dependencies.importRuns.get(record.importRunId);
  if (importRun === undefined) {
    return blocked(
      'BWS_QUERY_PROVENANCE_MISSING',
      `BWS read-only pinned strategy export ${record.intakeRecordId} requires import-run provenance expansion.`,
      'Persisted import-run provenance for every returned pinned strategy export.',
    );
  }
  if (importRun.upstreamLockRecordId !== record.upstreamLockRecordId) {
    return blocked(
      'BWS_QUERY_PROVENANCE_INVALID',
      'BWS read-only pinned strategy export provenance must keep the import run on the same upstream lock.',
      'Import-run provenance bound to the same committed-HEAD upstream lock record as the pinned strategy export.',
    );
  }

  return accepted(
    Object.freeze({
      intakeRecordId: record.intakeRecordId,
      insertedAt: record.insertedAt,
      provenance: Object.freeze({
        importRun,
        upstreamLock: upstreamLock.lock,
        upstreamLockRecordId: record.upstreamLockRecordId,
      }),
      record,
    }),
  );
}

function validateConfig(
  config: BwsReadOnlyQueryServiceConfig,
): BoundaryResult<Readonly<BwsReadOnlyQueryServiceConfig>> {
  if (!Number.isSafeInteger(config.maxPageSize) || config.maxPageSize <= 0) {
    return blocked(
      'BWS_QUERY_PAGE_SIZE_BOUND_INVALID',
      'BWS read-only query service requires an explicit positive maxPageSize bound.',
      'Explicit positive BWS read-only query maxPageSize configuration.',
    );
  }
  if (typeof config.generatedAt !== 'function') {
    return blocked(
      'BWS_QUERY_GENERATED_AT_MISSING',
      'BWS read-only query service requires an explicit generatedAt clock.',
      'Explicit deterministic generatedAt clock for BWS read-only query responses.',
    );
  }
  const generatedAt = config.generatedAt();
  if (!ISO_8601_UTC_MILLISECONDS.test(generatedAt)) {
    return blocked(
      'BWS_QUERY_GENERATED_AT_INVALID',
      'BWS read-only query service requires generatedAt to produce an ISO-8601 UTC timestamp.',
      'ISO-8601 UTC generatedAt timestamps for BWS read-only query responses.',
    );
  }
  return accepted(Object.freeze(config));
}

function validateDependencies(
  dependencies: BwsReadOnlyQueryDependencies,
): BoundaryResult<Readonly<BwsReadOnlyQueryDependencies>> {
  if (
    typeof dependencies.importRuns?.get !== 'function'
    || typeof dependencies.pinnedStrategyExports?.get !== 'function'
    || typeof dependencies.pinnedStrategyExports?.list !== 'function'
    || typeof dependencies.strategyLedger?.list !== 'function'
    || typeof dependencies.upstreamLocks?.get !== 'function'
  ) {
    return blocked(
      'BWS_QUERY_DEPENDENCIES_INVALID',
      'BWS read-only query service requires explicit persistence dependencies for upstream locks, import runs, pinned exports, and strategy ledger queries.',
      'Explicit surebet.* repository dependencies for the BWS read-only query service.',
    );
  }
  return accepted(Object.freeze(dependencies));
}

function validateStrategyLedgerRequest(
  config: Readonly<BwsReadOnlyQueryServiceConfig>,
  request: BwsStrategyLedgerQueryRequest,
): BoundaryResult<NormalizedStrategyLedgerRequest> {
  if (request.expand !== 'provenance') {
    return blocked(
      'BWS_QUERY_EXPANSION_REQUIRED',
      'BWS read-only strategy ledger queries require expand=provenance.',
      'Explicit provenance expansion for strategy ledger responses.',
    );
  }
  const pageSize = validatePageSize(config.maxPageSize, request.pageSize);
  if (!pageSize.ok) {
    return pageSize;
  }

  const acceptanceState = validateAcceptanceState(request.filters.acceptanceState);
  if (!acceptanceState.ok) {
    return acceptanceState;
  }
  if (!hasStrategyLedgerScopeFilter(request.filters)) {
    return blocked(
      'BWS_QUERY_FILTERS_UNBOUNDED',
      'BWS read-only strategy ledger queries require acceptanceState plus at least one explicit scope filter.',
      'A bounded strategy ledger filter set such as runKind, sourceKind, runReferenceId, reportId, sourceManifestHash, upstreamLockRecordId, or pinnedStrategyExportRecordId.',
    );
  }

  const filters: SurebetStrategyLedgerListFilters = {
    acceptanceState: acceptanceState.value,
  };
  const runKind = validateOptionalRunKind(request.filters.runKind);
  if (!runKind.ok) {
    return runKind;
  }
  const sourceKind = validateOptionalSourceKind(request.filters.sourceKind);
  if (!sourceKind.ok) {
    return sourceKind;
  }
  const stringFilters = validateOptionalStringFilters([
    ['pinnedStrategyExportRecordId', request.filters.pinnedStrategyExportRecordId],
    ['reportId', request.filters.reportId],
    ['runReferenceId', request.filters.runReferenceId],
    ['upstreamLockRecordId', request.filters.upstreamLockRecordId],
  ]);
  if (!stringFilters.ok) {
    return stringFilters;
  }
  const hashFilters = validateOptionalSha256Filters([
    ['runFingerprintSha256', request.filters.runFingerprintSha256],
    ['sourceManifestHash', request.filters.sourceManifestHash],
  ]);
  if (!hashFilters.ok) {
    return hashFilters;
  }
  if (runKind.value !== undefined) {
    Object.assign(filters, { runKind: runKind.value });
  }
  if (sourceKind.value !== undefined) {
    Object.assign(filters, { sourceKind: sourceKind.value });
  }
  Object.assign(filters, stringFilters.value, hashFilters.value);

  const cursor = decodeCursor(
    'strategy_ledger_entries',
    hashCursorScope('strategy_ledger_entries', filters),
    request.cursor,
  );
  if (!cursor.ok) {
    return cursor;
  }

  return accepted(
    Object.freeze({
      ...(cursor.value === undefined ? {} : { afterLedgerEntryId: cursor.value.afterId }),
      expand: 'provenance',
      filters: Object.freeze(filters),
      pageSize: pageSize.value,
    }),
  );
}

function validatePinnedStrategyExportRequest(
  config: Readonly<BwsReadOnlyQueryServiceConfig>,
  request: BwsPinnedStrategyExportQueryRequest,
): BoundaryResult<NormalizedPinnedStrategyExportRequest> {
  if (request.expand !== 'provenance') {
    return blocked(
      'BWS_QUERY_EXPANSION_REQUIRED',
      'BWS read-only pinned strategy export queries require expand=provenance.',
      'Explicit provenance expansion for pinned strategy export responses.',
    );
  }
  const pageSize = validatePageSize(config.maxPageSize, request.pageSize);
  if (!pageSize.ok) {
    return pageSize;
  }
  if (!hasPinnedStrategyExportFilter(request.filters)) {
    return blocked(
      'BWS_QUERY_FILTERS_UNBOUNDED',
      'BWS read-only pinned strategy export queries require at least one explicit scope filter.',
      'A bounded pinned strategy export filter set such as exportId, importRunId, upstreamLockRecordId, sourceSha256, providerId, or endpointId.',
    );
  }

  const stringFilters = validateOptionalStringFilters([
    ['endpointId', request.filters.endpointId],
    ['exportId', request.filters.exportId],
    ['importRunId', request.filters.importRunId],
    ['providerId', request.filters.providerId],
    ['upstreamLockRecordId', request.filters.upstreamLockRecordId],
  ]);
  if (!stringFilters.ok) {
    return stringFilters;
  }
  const hashFilters = validateOptionalSha256Filters([
    ['sourceSha256', request.filters.sourceSha256],
  ]);
  if (!hashFilters.ok) {
    return hashFilters;
  }

  const filters: SurebetPinnedStrategyExportListFilters = {
    ...stringFilters.value,
    ...hashFilters.value,
  };
  const cursor = decodeCursor(
    'pinned_strategy_exports',
    hashCursorScope('pinned_strategy_exports', filters),
    request.cursor,
  );
  if (!cursor.ok) {
    return cursor;
  }

  return accepted(
    Object.freeze({
      ...(cursor.value === undefined ? {} : { afterIntakeRecordId: cursor.value.afterId }),
      expand: 'provenance',
      filters: Object.freeze(filters),
      pageSize: pageSize.value,
    }),
  );
}

function validatePageSize(maxPageSize: number, pageSize: number): BoundaryResult<number> {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    return blocked(
      'BWS_QUERY_PAGE_SIZE_INVALID',
      'BWS read-only query pageSize must be a positive integer.',
      'Explicit positive BWS read-only query pageSize.',
    );
  }
  if (pageSize > maxPageSize) {
    return blocked(
      'BWS_QUERY_PAGE_SIZE_EXCEEDED',
      `BWS read-only query pageSize must not exceed ${maxPageSize}.`,
      'BWS read-only query pageSize within the configured maxPageSize bound.',
    );
  }
  return accepted(pageSize);
}

function validateAcceptanceState(value: string | undefined): BoundaryResult<SurebetStrategyAcceptanceState> {
  if (value !== 'accepted_local_evidence' && value !== 'blocked') {
    return blocked(
      'BWS_QUERY_ACCEPTANCE_STATE_REQUIRED',
      'BWS read-only strategy ledger queries require acceptanceState accepted_local_evidence or blocked.',
      'Explicit strategy ledger acceptanceState filter.',
    );
  }
  return accepted(value);
}

function validateOptionalRunKind(value: string | undefined): BoundaryResult<SurebetStrategyRunKind | undefined> {
  if (value === undefined) {
    return accepted(undefined);
  }
  if (value !== 'deterministic_standard_binary_backtest' && value !== 'private_paper_runtime_cycle') {
    return blocked(
      'BWS_QUERY_RUN_KIND_INVALID',
      'BWS read-only strategy ledger runKind filters must be deterministic_standard_binary_backtest or private_paper_runtime_cycle.',
      'Supported BWS strategy ledger runKind filter.',
    );
  }
  return accepted(value);
}

function validateOptionalSourceKind(value: string | undefined): BoundaryResult<SurebetStrategySourceKind | undefined> {
  if (value === undefined) {
    return accepted(undefined);
  }
  if (value !== 'resource_export' && value !== 'pinned_records' && value !== 'read_only_query') {
    return blocked(
      'BWS_QUERY_SOURCE_KIND_INVALID',
      'BWS read-only strategy ledger sourceKind filters must be resource_export, pinned_records, or read_only_query.',
      'Supported BWS strategy ledger sourceKind filter.',
    );
  }
  return accepted(value);
}

function validateOptionalStringFilters(
  filters: readonly (readonly [string, string | undefined])[],
): BoundaryResult<Readonly<Record<string, string>>> {
  const normalized: Record<string, string> = {};
  for (const [field, value] of filters) {
    if (value === undefined) {
      continue;
    }
    if (value.trim().length === 0) {
      return blocked(
        'BWS_QUERY_FILTER_VALUE_INVALID',
        `BWS read-only query filter ${field} must be a non-empty string.`,
        `Explicit non-empty BWS read-only query ${field} filter.`,
      );
    }
    normalized[field] = value.trim();
  }
  return accepted(Object.freeze(normalized));
}

function validateOptionalSha256Filters(
  filters: readonly (readonly [string, string | undefined])[],
): BoundaryResult<Readonly<Record<string, string>>> {
  const normalized: Record<string, string> = {};
  for (const [field, value] of filters) {
    if (value === undefined) {
      continue;
    }
    const trimmed = value.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(trimmed)) {
      return blocked(
        'BWS_QUERY_FILTER_VALUE_INVALID',
        `BWS read-only query filter ${field} must be a 64-character lower-case SHA-256 value.`,
        `Explicit 64-character lower-case SHA-256 BWS read-only query ${field} filter.`,
      );
    }
    normalized[field] = trimmed;
  }
  return accepted(Object.freeze(normalized));
}

function hasStrategyLedgerScopeFilter(filters: BwsStrategyLedgerQueryFilters): boolean {
  return filters.pinnedStrategyExportRecordId !== undefined
    || filters.reportId !== undefined
    || filters.runFingerprintSha256 !== undefined
    || filters.runKind !== undefined
    || filters.runReferenceId !== undefined
    || filters.sourceKind !== undefined
    || filters.sourceManifestHash !== undefined
    || filters.upstreamLockRecordId !== undefined;
}

function hasPinnedStrategyExportFilter(filters: BwsPinnedStrategyExportQueryFilters): boolean {
  return filters.endpointId !== undefined
    || filters.exportId !== undefined
    || filters.importRunId !== undefined
    || filters.providerId !== undefined
    || filters.sourceSha256 !== undefined
    || filters.upstreamLockRecordId !== undefined;
}

function hashCursorScope(
  resource: CursorPayload['resource'],
  filters: SurebetStrategyLedgerListFilters | SurebetPinnedStrategyExportListFilters,
): string {
  return createHash('sha256')
    .update(stableJsonStringify({ filters, resource }))
    .digest('hex');
}

function decodeCursor(
  resource: CursorPayload['resource'],
  filtersSha256: string,
  cursor: string | undefined,
): BoundaryResult<CursorPayload | undefined> {
  if (cursor === undefined) {
    return accepted(undefined);
  }
  if (cursor.length === 0 || cursor.length > MAX_CURSOR_BYTES) {
    return blocked(
      'BWS_QUERY_CURSOR_INVALID',
      'BWS read-only query cursor must be a bounded non-empty string.',
      'Bounded opaque pagination cursor from a prior BWS read-only query response.',
    );
  }
  let payloadValue: unknown;
  try {
    payloadValue = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
  } catch {
    return blocked(
      'BWS_QUERY_CURSOR_INVALID',
      'BWS read-only query cursor must be a valid opaque pagination token.',
      'Opaque pagination cursor returned by a prior BWS read-only query response.',
    );
  }
  const payload = asRecord(payloadValue);
  const afterId = typeof payload?.['afterId'] === 'string' ? payload['afterId'] : undefined;
  const payloadFiltersSha256 = typeof payload?.['filtersSha256'] === 'string' ? payload['filtersSha256'] : undefined;
  const payloadResource = payload?.['resource'];
  if (
    afterId === undefined
    || payloadFiltersSha256 === undefined
    || payloadResource !== resource
    || payloadFiltersSha256 !== filtersSha256
  ) {
    return blocked(
      'BWS_QUERY_CURSOR_SCOPE_MISMATCH',
      'BWS read-only query cursor must match the resource and exact filter scope that produced it.',
      'Pagination cursor reused only with the same BWS read-only query resource and filters.',
    );
  }
  return accepted(
    Object.freeze({
      afterId,
      filtersSha256: payloadFiltersSha256,
      resource,
    }),
  );
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, childValue]) => [key, canonicalize(childValue)]),
    );
  }
  return value;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : undefined;
}
