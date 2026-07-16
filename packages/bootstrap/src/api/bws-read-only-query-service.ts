import { createHash } from 'node:crypto';
import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import type { SurebetImportRunRecord, SurebetImportRunRepository } from '../../../persistence/src/repositories/import-run-repository.js';
import type {
  SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters,
  SurebetPrivatePaperRuntimeSchedulerCheckpointListRequest,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRecord,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
} from '../../../persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.js';
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
import type {
  SurebetUpstreamApiConvergenceCheckpointRecord,
  SurebetUpstreamApiConvergenceRepository,
} from '../../../persistence/src/repositories/upstream-api-convergence-repository.js';
import type { SurebetUpstreamLockRepository } from '../../../persistence/src/repositories/upstream-lock-repository.js';
import type {
  SurebetWorkerJobCheckpointRecord,
  SurebetWorkerJobDeadLetterRecord,
  SurebetWorkerJobRecord,
  SurebetWorkerJobRepository,
  SurebetWorkerJobStatus,
} from '../../../persistence/src/repositories/worker-job-repository.js';
import { accepted, blocked, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';
import { describeReadOnlyQueryApiClientBoundary } from '../adapters/betting-win-query-client.js';

const BWS_READ_ONLY_QUERY_SERVICE_PHASE = 'BWS-400';
const MAX_CURSOR_BYTES = 512;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PRIVATE_PAPER_RUNTIME_JOB_SCHEMA = 'bws.private_paper_runtime_job.v1';
const PRIVATE_PAPER_RUNTIME_CYCLE_CHECKPOINT_RETENTION = 3;
const PRIVATE_PAPER_RUNTIME_CYCLE_SCAN_MULTIPLIER = 4;
const PRIVATE_PAPER_RUNTIME_CYCLE_SCHEDULER_RETENTION = 8;

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

export interface BwsPrivatePaperRuntimeCycleQueryFilters {
  readonly acceptanceState?: string;
  readonly queueName?: string;
  readonly runtimeId?: string;
  readonly schedulerCheckpointId?: string;
  readonly upstreamLockRecordId?: string;
}

export interface BwsPrivatePaperRuntimeCycleQueryRequest {
  readonly expand?: string;
  readonly filters: BwsPrivatePaperRuntimeCycleQueryFilters;
  readonly pageSize: number;
}

export interface BwsReadOnlyQueryDependencies {
  readonly importRuns: Pick<SurebetImportRunRepository, 'get'>;
  readonly pinnedStrategyExports: Pick<SurebetPinnedStrategyExportRepository, 'get' | 'list'>;
  readonly privatePaperSchedulerCheckpoints: Pick<SurebetPrivatePaperRuntimeSchedulerCheckpointRepository, 'list'>;
  readonly strategyLedger: Pick<SurebetStrategyLedgerRepository, 'list'>;
  readonly upstreamApiCheckpoints: Pick<SurebetUpstreamApiConvergenceRepository, 'get'>;
  readonly upstreamLocks: Pick<SurebetUpstreamLockRepository, 'get'>;
  readonly workerJobs: Pick<SurebetWorkerJobRepository, 'get' | 'getDeadLetter' | 'listCheckpoints'>;
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

export interface BwsPrivatePaperRuntimeCycleCheckpointItem {
  readonly checkpoint: Readonly<Record<string, unknown>>;
  readonly checkpointId: string;
  readonly checkpointSha256: string;
  readonly recordedAt: IsoTimestamp;
}

export interface BwsPrivatePaperRuntimeCycleDeadLetterItem {
  readonly checkpointCount: number;
  readonly deadLetterReasonCode: string;
  readonly deadLetterReasonDetails: Readonly<Record<string, unknown>>;
  readonly finalAttemptCount: number;
  readonly insertedAt: IsoTimestamp;
}

export interface BwsPrivatePaperRuntimeCycleJobSummary {
  readonly attemptCount: number;
  readonly checkpointCount: number;
  readonly completedAt?: IsoTimestamp;
  readonly insertedAt: IsoTimestamp;
  readonly jobId: string;
  readonly lastCheckpointAt?: IsoTimestamp;
  readonly lastCheckpointId?: string;
  readonly lastErrorCode?: string;
  readonly queueName: string;
  readonly status: SurebetWorkerJobStatus;
  readonly updatedAt: IsoTimestamp;
}

export interface BwsPrivatePaperRuntimeCycleItemProvenance {
  readonly cycleImportRun?: SurebetImportRunRecord;
  readonly schedulerCheckpoint: SurebetPrivatePaperRuntimeSchedulerCheckpointRecord;
  readonly upstreamApiCheckpoint: SurebetUpstreamApiConvergenceCheckpointRecord;
  readonly upstreamLock: BettingWinUpstreamLock;
  readonly upstreamLockRecordId: string;
}

export interface BwsPrivatePaperRuntimeCycleItem {
  readonly acceptanceState: SurebetStrategyAcceptanceState;
  readonly blockedReasonCode?: string;
  readonly cycleId: string;
  readonly cycleNumber: number;
  readonly deadLetter?: BwsPrivatePaperRuntimeCycleDeadLetterItem;
  readonly job: BwsPrivatePaperRuntimeCycleJobSummary;
  readonly provenance: BwsPrivatePaperRuntimeCycleItemProvenance;
  readonly recentCheckpoints: readonly BwsPrivatePaperRuntimeCycleCheckpointItem[];
  readonly runtimeId: string;
  readonly sourceKind: SurebetStrategySourceKind;
  readonly sourceManifestHash: string;
  readonly strategyLedger?: BwsStrategyLedgerItem;
}

export interface BwsReadOnlyQueryService {
  readonly boundary: BwsReadOnlyQueryBoundary;
  queryPinnedStrategyExports(
    request: BwsPinnedStrategyExportQueryRequest,
  ): BoundaryResult<BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>>;
  queryPrivatePaperRuntimeCycles(
    request: BwsPrivatePaperRuntimeCycleQueryRequest,
  ): BoundaryResult<BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>>;
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

interface NormalizedPrivatePaperRuntimeCycleRequest {
  readonly expand: 'provenance';
  readonly filters: Readonly<{
    readonly acceptanceState: SurebetStrategyAcceptanceState;
    readonly queueName?: string;
    readonly runtimeId?: string;
    readonly schedulerCheckpointId?: string;
    readonly upstreamLockRecordId?: string;
  }>;
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
    queryPrivatePaperRuntimeCycles(request) {
      return queryPrivatePaperRuntimeCycles(validatedDependencies.value, validatedConfig.value, boundary, request);
    },
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

function queryPrivatePaperRuntimeCycles(
  dependencies: BwsReadOnlyQueryDependencies,
  config: Readonly<BwsReadOnlyQueryServiceConfig>,
  boundary: BwsReadOnlyQueryBoundary,
  request: BwsPrivatePaperRuntimeCycleQueryRequest,
): BoundaryResult<BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>> {
  const normalized = validatePrivatePaperRuntimeCycleRequest(config, request);
  if (!normalized.ok) {
    return normalized;
  }

  const schedulerCheckpoints = dependencies.privatePaperSchedulerCheckpoints.list({
    filters: toRuntimeCycleSchedulerFilters(normalized.value.filters),
    limit: Math.max(
      PRIVATE_PAPER_RUNTIME_CYCLE_SCHEDULER_RETENTION,
      normalized.value.pageSize * PRIVATE_PAPER_RUNTIME_CYCLE_SCAN_MULTIPLIER,
    ),
  } satisfies SurebetPrivatePaperRuntimeSchedulerCheckpointListRequest);

  const scannedItems: Array<{
    readonly item: BwsPrivatePaperRuntimeCycleItem;
    readonly sortTimestamp: string;
  }> = [];

  for (const schedulerCheckpoint of schedulerCheckpoints) {
    if (schedulerCheckpoint.mode !== 'api') {
      continue;
    }
    const upperCycleNumber = schedulerCheckpoint.lastScheduledApiCycleNumber ?? 0;
    const lowerCycleNumber = Math.max(
      1,
      upperCycleNumber - (normalized.value.pageSize * PRIVATE_PAPER_RUNTIME_CYCLE_SCAN_MULTIPLIER) + 1,
    );
    for (let cycleNumber = upperCycleNumber; cycleNumber >= lowerCycleNumber; cycleNumber -= 1) {
      const item = buildPrivatePaperRuntimeCycleItem(
        dependencies,
        schedulerCheckpoint,
        cycleNumber,
        normalized.value.filters.acceptanceState,
      );
      if (!item.ok) {
        return item;
      }
      if (item.value === undefined) {
        continue;
      }
      scannedItems.push(
        Object.freeze({
          item: item.value,
          sortTimestamp: item.value.job.completedAt ?? item.value.job.updatedAt,
        }),
      );
    }
  }

  const items = Object.freeze(
    [...scannedItems]
      .sort((left, right) => {
        const timeComparison = right.sortTimestamp.localeCompare(left.sortTimestamp);
        if (timeComparison !== 0) {
          return timeComparison;
        }
        const checkpointComparison = left.item.provenance.schedulerCheckpoint.schedulerCheckpointId.localeCompare(
          right.item.provenance.schedulerCheckpoint.schedulerCheckpointId,
        );
        if (checkpointComparison !== 0) {
          return checkpointComparison;
        }
        return left.item.cycleId.localeCompare(right.item.cycleId);
      })
      .slice(0, normalized.value.pageSize)
      .map((entry) => entry.item),
  );

  return accepted(
    Object.freeze({
      boundary,
      generatedAt: config.generatedAt(),
      page: Object.freeze({
        items,
        pageSize: normalized.value.pageSize,
        returnedCount: items.length,
      }),
      resource: 'private_paper_runtime_cycles',
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

function buildPrivatePaperRuntimeCycleItem(
  dependencies: BwsReadOnlyQueryDependencies,
  schedulerCheckpoint: SurebetPrivatePaperRuntimeSchedulerCheckpointRecord,
  cycleNumber: number,
  acceptanceState: SurebetStrategyAcceptanceState,
): BoundaryResult<BwsPrivatePaperRuntimeCycleItem | undefined> {
  const upstreamApiCheckpoint = dependencies.upstreamApiCheckpoints.get(schedulerCheckpoint.upstreamCheckpointId);
  if (upstreamApiCheckpoint === undefined) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_MISSING',
      `BWS private-paper runtime cycle queries require upstream API checkpoint ${schedulerCheckpoint.upstreamCheckpointId}.`,
      'Persisted upstream API checkpoint provenance for every returned private-paper runtime cycle.',
    );
  }
  if (upstreamApiCheckpoint.upstreamLockRecordId !== schedulerCheckpoint.upstreamLockRecordId) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_INVALID',
      `BWS private-paper scheduler checkpoint ${schedulerCheckpoint.schedulerCheckpointId} must stay on the same upstream lock as API checkpoint ${schedulerCheckpoint.upstreamCheckpointId}.`,
      'Private-paper scheduler and upstream API checkpoints pinned to the same committed-HEAD upstream lock.',
    );
  }

  const upstreamLock = dependencies.upstreamLocks.get(schedulerCheckpoint.upstreamLockRecordId);
  if (upstreamLock === undefined) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_MISSING',
      `BWS private-paper runtime cycle queries require upstream lock ${schedulerCheckpoint.upstreamLockRecordId}.`,
      'Persisted committed-HEAD upstream lock provenance for every returned private-paper runtime cycle.',
    );
  }

  const jobId = buildPrivatePaperRuntimeJobId(schedulerCheckpoint.schedulerCheckpointId, cycleNumber);
  const job = dependencies.workerJobs.get(jobId);
  if (job === undefined) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_MISSING',
      `BWS private-paper runtime cycle ${jobId} was scheduled but is missing from surebet.worker_jobs.`,
      'Persisted worker job state for every scheduled private-paper runtime cycle returned by the read-only API.',
    );
  }

  const payload = parsePrivatePaperRuntimeJobPayload(job, schedulerCheckpoint, cycleNumber);
  if (!payload.ok) {
    return payload;
  }

  const strategyLedger = findPrivatePaperRuntimeStrategyLedger(
    dependencies,
    payload.value.runtimeId,
    payload.value.cycleId,
  );
  if (!strategyLedger.ok) {
    return strategyLedger;
  }

  if (job.status === 'succeeded') {
    if (strategyLedger.value === undefined) {
      return blocked(
        'BWS_QUERY_RUNTIME_CYCLE_LEDGER_MISSING',
        `BWS succeeded private-paper runtime cycle ${jobId} must expose a persisted strategy-ledger row.`,
        'A persisted private-paper strategy-ledger row for every succeeded runtime cycle.',
      );
    }
    if (strategyLedger.value.entry.acceptanceState !== acceptanceState) {
      return accepted(undefined);
    }
    const recentCheckpoints = normalizeRuntimeCycleCheckpoints(
      dependencies.workerJobs.listCheckpoints(job.jobId, {
        limit: PRIVATE_PAPER_RUNTIME_CYCLE_CHECKPOINT_RETENTION,
        newestFirst: true,
      }),
      job.jobId,
    );
    if (!recentCheckpoints.ok) {
      return recentCheckpoints;
    }
    const cycleImportRun = findCompletedCycleImportRun(
      dependencies,
      schedulerCheckpoint,
      upstreamApiCheckpoint,
      cycleNumber,
    );
    if (!cycleImportRun.ok) {
      return cycleImportRun;
    }
    return accepted(
      Object.freeze({
        acceptanceState,
        ...(acceptanceState !== 'blocked' || strategyLedger.value.entry.report.stopReason === undefined
          ? {}
          : { blockedReasonCode: strategyLedger.value.entry.report.stopReason }),
        cycleId: payload.value.cycleId,
        cycleNumber,
        job: summarizeRuntimeCycleJob(job),
        provenance: Object.freeze({
          ...(cycleImportRun.value === undefined ? {} : { cycleImportRun: cycleImportRun.value }),
          schedulerCheckpoint,
          upstreamApiCheckpoint,
          upstreamLock: upstreamLock.lock,
          upstreamLockRecordId: upstreamLock.lockRecordId,
        }),
        recentCheckpoints: recentCheckpoints.value,
        runtimeId: payload.value.runtimeId,
        sourceKind: payload.value.sourceKind,
        sourceManifestHash: payload.value.sourceManifestHash,
        strategyLedger: strategyLedger.value,
      }),
    );
  }

  if (job.status !== 'dead_lettered') {
    return accepted(undefined);
  }

  if (acceptanceState !== 'blocked') {
    return accepted(undefined);
  }
  if (strategyLedger.value !== undefined) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_INVALID',
      `BWS dead-lettered private-paper runtime cycle ${jobId} must not expose a persisted strategy-ledger row.`,
      'Dead-lettered private-paper runtime cycles without strategy-ledger success evidence.',
    );
  }

  const deadLetter = dependencies.workerJobs.getDeadLetter(job.jobId);
  if (deadLetter === undefined) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_DEAD_LETTER_MISSING',
      `BWS blocked private-paper runtime cycle ${jobId} requires a persisted dead-letter record.`,
      'Persisted dead-letter provenance for blocked runtime cycles without strategy-ledger evidence.',
    );
  }
  const recentCheckpoints = normalizeRuntimeCycleCheckpoints(
    dependencies.workerJobs.listCheckpoints(job.jobId, {
      limit: PRIVATE_PAPER_RUNTIME_CYCLE_CHECKPOINT_RETENTION,
      newestFirst: true,
    }),
    job.jobId,
  );
  if (!recentCheckpoints.ok) {
    return recentCheckpoints;
  }
  const deadLetterDetails = normalizeRuntimeCycleDeadLetter(deadLetter, job.jobId);
  if (!deadLetterDetails.ok) {
    return deadLetterDetails;
  }
  const cycleImportRun = findCompletedCycleImportRun(
    dependencies,
    schedulerCheckpoint,
    upstreamApiCheckpoint,
    cycleNumber,
  );
  if (!cycleImportRun.ok) {
    return cycleImportRun;
  }
  return accepted(
    Object.freeze({
      acceptanceState: 'blocked',
      blockedReasonCode: deadLetter.deadLetterReasonCode,
      cycleId: payload.value.cycleId,
      cycleNumber,
      deadLetter: deadLetterDetails.value,
      job: summarizeRuntimeCycleJob(job),
      provenance: Object.freeze({
        ...(cycleImportRun.value === undefined ? {} : { cycleImportRun: cycleImportRun.value }),
        schedulerCheckpoint,
        upstreamApiCheckpoint,
        upstreamLock: upstreamLock.lock,
        upstreamLockRecordId: upstreamLock.lockRecordId,
      }),
      recentCheckpoints: recentCheckpoints.value,
      runtimeId: payload.value.runtimeId,
      sourceKind: payload.value.sourceKind,
      sourceManifestHash: payload.value.sourceManifestHash,
    }),
  );
}

function findPrivatePaperRuntimeStrategyLedger(
  dependencies: BwsReadOnlyQueryDependencies,
  runtimeId: string,
  cycleId: string,
): BoundaryResult<BwsStrategyLedgerItem | undefined> {
  const runReferenceId = `${runtimeId}:${cycleId}`;
  let matched: BwsStrategyLedgerItem | undefined;
  for (const acceptanceState of ['accepted_local_evidence', 'blocked'] as const) {
    const records = dependencies.strategyLedger.list({
      filters: Object.freeze({
        acceptanceState,
        runKind: 'private_paper_runtime_cycle',
        runReferenceId,
      }),
      limit: 2,
    } satisfies SurebetStrategyLedgerListRequest);
    if (records.length === 0) {
      continue;
    }
    if (records.length > 1) {
      return blocked(
        'BWS_QUERY_RUNTIME_CYCLE_LEDGER_CONFLICT',
        `BWS private-paper runtime cycle ${runReferenceId} must resolve to exactly one strategy-ledger row per acceptance state.`,
        'Exactly one persisted strategy-ledger row per runtime cycle acceptance state.',
      );
    }
    const expanded = expandStrategyLedgerRecord(dependencies, records[0]!);
    if (!expanded.ok) {
      return expanded;
    }
    if (matched !== undefined) {
      return blocked(
        'BWS_QUERY_RUNTIME_CYCLE_LEDGER_CONFLICT',
        `BWS private-paper runtime cycle ${runReferenceId} must not resolve to both accepted and blocked strategy-ledger rows.`,
        'Exactly one persisted private-paper strategy-ledger row for the runtime cycle.',
      );
    }
    matched = expanded.value;
  }
  return accepted(matched);
}

function findCompletedCycleImportRun(
  dependencies: BwsReadOnlyQueryDependencies,
  schedulerCheckpoint: SurebetPrivatePaperRuntimeSchedulerCheckpointRecord,
  upstreamApiCheckpoint: SurebetUpstreamApiConvergenceCheckpointRecord,
  cycleNumber: number,
): BoundaryResult<SurebetImportRunRecord | undefined> {
  for (let pageNumber = 1; pageNumber <= upstreamApiCheckpoint.maxPagesPerResource; pageNumber += 1) {
    const importRunId = buildPrivatePaperRuntimeImportRunId(
      schedulerCheckpoint.upstreamCheckpointId,
      cycleNumber,
      'settlement',
      pageNumber,
    );
    const importRun = dependencies.importRuns.get(importRunId);
    if (importRun === undefined) {
      continue;
    }
    const metadata = validateCompletedCycleImportRunMetadata(
      importRun,
      schedulerCheckpoint.upstreamCheckpointId,
      schedulerCheckpoint.upstreamLockRecordId,
      cycleNumber,
      pageNumber,
    );
    if (!metadata.ok) {
      return metadata;
    }
    if (metadata.value.hasNextCursor === false && importRun.outcome === 'succeeded') {
      return accepted(importRun);
    }
  }
  return accepted(undefined);
}

function validateCompletedCycleImportRunMetadata(
  importRun: SurebetImportRunRecord,
  checkpointId: string,
  upstreamLockRecordId: string,
  cycleNumber: number,
  pageNumber: number,
): BoundaryResult<Readonly<{ readonly hasNextCursor: boolean }>> {
  if (importRun.sourceKind !== 'continuous_read_only_query_page') {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_INVALID',
      `BWS runtime cycle import run ${importRun.importRunId} must remain a continuous_read_only_query_page source.`,
      'Continuous read-only query import runs for private-paper runtime cycle provenance.',
    );
  }
  if (importRun.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_INVALID',
      `BWS runtime cycle import run ${importRun.importRunId} must stay on upstream lock ${upstreamLockRecordId}.`,
      'Cycle import-run provenance pinned to the same committed-HEAD upstream lock as the runtime cycle.',
    );
  }
  const metadata = asRecord(importRun.metadata);
  const page = asRecord(metadata?.['page']);
  const provenance = asRecord(page?.['provenance']);
  if (
    metadata?.['mode'] !== 'api'
    || metadata?.['checkpointId'] !== checkpointId
    || metadata?.['upstreamLockRecordId'] !== upstreamLockRecordId
    || metadata?.['cycleNumber'] !== cycleNumber
    || page?.['resource'] !== 'settlement'
    || page?.['pageNumber'] !== pageNumber
    || typeof provenance?.['responseReceivedAt'] !== 'string'
  ) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_PROVENANCE_INVALID',
      `BWS runtime cycle import run ${importRun.importRunId} must keep settlement-page metadata aligned to checkpoint ${checkpointId} cycle ${cycleNumber}.`,
      'Cycle import-run settlement metadata aligned to the selected checkpoint, page number, and verified upstream lock.',
    );
  }
  return accepted(
    Object.freeze({
      hasNextCursor: typeof page['nextCursor'] === 'string' && page['nextCursor'].length > 0,
    }),
  );
}

function normalizeRuntimeCycleCheckpoints(
  checkpoints: readonly SurebetWorkerJobCheckpointRecord[],
  jobId: string,
): BoundaryResult<readonly BwsPrivatePaperRuntimeCycleCheckpointItem[]> {
  const items: BwsPrivatePaperRuntimeCycleCheckpointItem[] = [];
  for (const checkpoint of checkpoints) {
    const record = asRecord(checkpoint.checkpoint);
    if (record === undefined) {
      return blocked(
        'BWS_QUERY_RUNTIME_CYCLE_CHECKPOINT_INVALID',
        `BWS worker checkpoint ${jobId}:${checkpoint.checkpointId} must store an object-shaped checkpoint payload.`,
        'Object-shaped persisted worker checkpoint payloads for runtime cycle visibility.',
      );
    }
    items.push(
      Object.freeze({
        checkpoint: Object.freeze({ ...record }),
        checkpointId: checkpoint.checkpointId,
        checkpointSha256: checkpoint.checkpointSha256,
        recordedAt: checkpoint.recordedAt,
      }),
    );
  }
  return accepted(Object.freeze(items));
}

function normalizeRuntimeCycleDeadLetter(
  deadLetter: SurebetWorkerJobDeadLetterRecord,
  jobId: string,
): BoundaryResult<BwsPrivatePaperRuntimeCycleDeadLetterItem> {
  const details = asRecord(deadLetter.deadLetterReasonDetails);
  if (details === undefined) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_DEAD_LETTER_INVALID',
      `BWS worker dead-letter ${jobId} must retain object-shaped reason details.`,
      'Object-shaped dead-letter reason details for blocked runtime cycle visibility.',
    );
  }
  return accepted(
    Object.freeze({
      checkpointCount: deadLetter.checkpointCount,
      deadLetterReasonCode: deadLetter.deadLetterReasonCode,
      deadLetterReasonDetails: Object.freeze({ ...details }),
      finalAttemptCount: deadLetter.finalAttemptCount,
      insertedAt: deadLetter.insertedAt,
    }),
  );
}

function summarizeRuntimeCycleJob(job: SurebetWorkerJobRecord): BwsPrivatePaperRuntimeCycleJobSummary {
  return Object.freeze({
    attemptCount: job.attemptCount,
    checkpointCount: job.checkpointCount,
    ...(job.completedAt === undefined ? {} : { completedAt: job.completedAt }),
    insertedAt: job.insertedAt,
    jobId: job.jobId,
    ...(job.lastCheckpointAt === undefined ? {} : { lastCheckpointAt: job.lastCheckpointAt }),
    ...(job.lastCheckpointId === undefined ? {} : { lastCheckpointId: job.lastCheckpointId }),
    ...(job.lastErrorCode === undefined ? {} : { lastErrorCode: job.lastErrorCode }),
    queueName: job.queueName,
    status: job.status,
    updatedAt: job.updatedAt,
  });
}

function parsePrivatePaperRuntimeJobPayload(
  job: SurebetWorkerJobRecord,
  schedulerCheckpoint: SurebetPrivatePaperRuntimeSchedulerCheckpointRecord,
  cycleNumber: number,
): BoundaryResult<Readonly<{
  readonly cycleId: string;
  readonly runtimeId: string;
  readonly sourceKind: SurebetStrategySourceKind;
  readonly sourceManifestHash: string;
}>> {
  const payload = asRecord(job.payload);
  const source = asRecord(payload?.['source']);
  if (
    payload?.['schema'] !== PRIVATE_PAPER_RUNTIME_JOB_SCHEMA
    || typeof payload?.['runtimeId'] !== 'string'
    || typeof payload?.['cycleId'] !== 'string'
    || typeof payload?.['upstreamLockRecordId'] !== 'string'
    || !Number.isSafeInteger(payload?.['maxCandidatesPerCycle'])
    || source === undefined
  ) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job ${job.jobId} must retain a ${PRIVATE_PAPER_RUNTIME_JOB_SCHEMA} payload.`,
      'Persisted private-paper worker payloads aligned to the BWS runtime job schema.',
    );
  }
  const identifiers = parsePrivatePaperRuntimeJobId(job.jobId);
  if (!identifiers.ok) {
    return identifiers;
  }
  if (
    identifiers.value.schedulerCheckpointId !== schedulerCheckpoint.schedulerCheckpointId
    || identifiers.value.cycleNumber !== cycleNumber
  ) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job ${job.jobId} must align to scheduler checkpoint ${schedulerCheckpoint.schedulerCheckpointId} cycle ${cycleNumber}.`,
      'Deterministic private-paper worker job identifiers aligned to the scheduler checkpoint and cycle number.',
    );
  }
  if (payload['upstreamLockRecordId'] !== schedulerCheckpoint.upstreamLockRecordId) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job ${job.jobId} must stay pinned to upstream lock ${schedulerCheckpoint.upstreamLockRecordId}.`,
      'Private-paper worker jobs pinned to the same committed-HEAD upstream lock as their scheduler checkpoint.',
    );
  }
  if (payload['runtimeId'] !== schedulerCheckpoint.runtimeId) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job ${job.jobId} must stay aligned to runtime ${schedulerCheckpoint.runtimeId}.`,
      'Private-paper worker payload runtime identifiers aligned to the scheduler checkpoint runtime.',
    );
  }
  const sourceManifestHash = typeof source['sourceManifestHash'] === 'string'
    ? source['sourceManifestHash'].trim().toLowerCase()
    : undefined;
  const sourceKind = source['kind'];
  if (
    sourceManifestHash === undefined
    || !/^[0-9a-f]{64}$/.test(sourceManifestHash)
    || (sourceKind !== 'read_only_query' && sourceKind !== 'pinned_records')
  ) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job ${job.jobId} must retain a supported source kind and 64-character sourceManifestHash.`,
      'Private-paper worker payload source metadata aligned to the accepted runtime source contract.',
    );
  }
  return accepted(
    Object.freeze({
      cycleId: payload['cycleId'].trim(),
      runtimeId: payload['runtimeId'].trim(),
      sourceKind,
      sourceManifestHash,
    }),
  );
}

function parsePrivatePaperRuntimeJobId(
  jobId: string,
): BoundaryResult<Readonly<{ readonly cycleNumber: number; readonly schedulerCheckpointId: string }>> {
  const match = /^private-paper:(.+):cycle:(\d+)$/.exec(jobId);
  if (match === null) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job id ${jobId} must stay on the deterministic private-paper scheduler format.`,
      'Deterministic private-paper worker job ids.',
    );
  }
  const cycleNumber = Number.parseInt(match[2]!, 10);
  if (!Number.isSafeInteger(cycleNumber) || cycleNumber <= 0) {
    return blocked(
      'BWS_QUERY_RUNTIME_CYCLE_JOB_INVALID',
      `BWS private-paper worker job id ${jobId} must encode a positive cycle number.`,
      'Positive cycle numbers encoded in private-paper worker job ids.',
    );
  }
  return accepted(
    Object.freeze({
      cycleNumber,
      schedulerCheckpointId: match[1]!,
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
    || typeof dependencies.privatePaperSchedulerCheckpoints?.list !== 'function'
    || typeof dependencies.strategyLedger?.list !== 'function'
    || typeof dependencies.upstreamApiCheckpoints?.get !== 'function'
    || typeof dependencies.upstreamLocks?.get !== 'function'
    || typeof dependencies.workerJobs?.get !== 'function'
    || typeof dependencies.workerJobs?.getDeadLetter !== 'function'
    || typeof dependencies.workerJobs?.listCheckpoints !== 'function'
  ) {
    return blocked(
      'BWS_QUERY_DEPENDENCIES_INVALID',
      'BWS read-only query service requires explicit persistence dependencies for upstream locks, import runs, pinned exports, scheduler checkpoints, upstream API checkpoints, worker jobs, and strategy ledger queries.',
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

function validatePrivatePaperRuntimeCycleRequest(
  config: Readonly<BwsReadOnlyQueryServiceConfig>,
  request: BwsPrivatePaperRuntimeCycleQueryRequest,
): BoundaryResult<NormalizedPrivatePaperRuntimeCycleRequest> {
  if (request.expand !== 'provenance') {
    return blocked(
      'BWS_QUERY_EXPANSION_REQUIRED',
      'BWS read-only private-paper runtime cycle queries require expand=provenance.',
      'Explicit provenance expansion for private-paper runtime cycle responses.',
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
  const stringFilters = validateOptionalStringFilters([
    ['queueName', request.filters.queueName],
    ['runtimeId', request.filters.runtimeId],
    ['schedulerCheckpointId', request.filters.schedulerCheckpointId],
    ['upstreamLockRecordId', request.filters.upstreamLockRecordId],
  ]);
  if (!stringFilters.ok) {
    return stringFilters;
  }
  return accepted(
    Object.freeze({
      expand: 'provenance',
      filters: Object.freeze({
        acceptanceState: acceptanceState.value,
        ...(stringFilters.value['queueName'] === undefined ? {} : { queueName: stringFilters.value['queueName'] }),
        ...(stringFilters.value['runtimeId'] === undefined ? {} : { runtimeId: stringFilters.value['runtimeId'] }),
        ...(stringFilters.value['schedulerCheckpointId'] === undefined
          ? {}
          : { schedulerCheckpointId: stringFilters.value['schedulerCheckpointId'] }),
        ...(stringFilters.value['upstreamLockRecordId'] === undefined
          ? {}
          : { upstreamLockRecordId: stringFilters.value['upstreamLockRecordId'] }),
      }),
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

function toRuntimeCycleSchedulerFilters(
  filters: NormalizedPrivatePaperRuntimeCycleRequest['filters'],
): SurebetPrivatePaperRuntimeSchedulerCheckpointListFilters {
  return Object.freeze({
    ...(filters.queueName === undefined ? {} : { queueName: filters.queueName }),
    ...(filters.runtimeId === undefined ? {} : { runtimeId: filters.runtimeId }),
    ...(filters.schedulerCheckpointId === undefined ? {} : { schedulerCheckpointId: filters.schedulerCheckpointId }),
    ...(filters.upstreamLockRecordId === undefined ? {} : { upstreamLockRecordId: filters.upstreamLockRecordId }),
  });
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

function buildPrivatePaperRuntimeJobId(schedulerCheckpointId: string, cycleNumber: number): string {
  return `private-paper:${schedulerCheckpointId}:cycle:${cycleNumber}`;
}

function buildPrivatePaperRuntimeImportRunId(
  checkpointId: string,
  cycleNumber: number,
  resource: 'settlement',
  pageNumber: number,
): string {
  return `import:${checkpointId}:cycle:${cycleNumber}:${resource}:page:${pageNumber}`;
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
