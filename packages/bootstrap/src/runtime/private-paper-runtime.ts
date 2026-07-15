import { createHash } from 'node:crypto';
import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import type {
  IdentityReadOnlyQueryItem,
  NormalizedReadOnlyQueryItem,
  ReadOnlyQueryApiClient,
  RulesReadOnlyQueryItem,
} from '../adapters/betting-win-query-client.js';
import type { BettingWinResourceRecord, BettingWinSettlementRecord } from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type Blocker, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';
import type { StandardBinaryOpportunityCandidate } from '../opportunity/standard-binary-derivation.js';
import { deriveStandardBinaryOpportunityCandidates } from '../opportunity/standard-binary-derivation.js';
import { buildStandardBinaryStakeVectorInput } from '../opportunity/standard-binary-stake-solver.js';
import {
  NON_ATOMIC_COMPLETION_EVENT_TYPES,
  simulateNonAtomicPaperGroupCompletion,
  type NonAtomicCompletionEvent,
  type NonAtomicCompletionSimulation,
  type NonAtomicResidualExposureAnalysis,
} from '../simulation/non-atomic-completion.js';
import {
  reconcileNonAtomicSettlementReplay,
  type ConsumedSettlementReplay,
  type NonAtomicSettlementReplayReconciliation,
} from '../simulation/settlement-replay.js';
import { solveStandardBinaryStakeVector, type StakeVectorSolution } from '../solver/stake-vector.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const LOWERCASE_SHA256_REGEX = /^[0-9a-f]{64}$/;

export interface PrivatePaperCandidateRuntimePlan {
  readonly candidateId: string;
  readonly decisionTimestamp: IsoTimestamp;
  readonly maxQuoteAgeMs: number;
  readonly manualKill: boolean;
  readonly completionEvents: readonly NonAtomicCompletionEvent[];
  readonly residualExposureFloorMinor?: bigint;
}

export interface PrivatePaperRuntimePinnedRecordSource {
  readonly kind: 'pinned_records';
  readonly sourceBundleKind: 'resource_export';
  readonly exportedAt: IsoTimestamp;
  readonly sourceManifestHash: string;
  readonly records: readonly BettingWinResourceRecord[];
}

export interface PrivatePaperRuntimeReadOnlyQueryRequest<TFilters> {
  readonly filters?: TFilters;
  readonly maxPages: number;
  readonly pageSize: number;
}

export interface PrivatePaperReadOnlyQueryRecordMappers {
  readonly identity: (item: IdentityReadOnlyQueryItem) => BoundaryResult<readonly BettingWinResourceRecord[]>;
  readonly rules: (item: RulesReadOnlyQueryItem) => BoundaryResult<readonly BettingWinResourceRecord[]>;
  readonly quotes: (item: NormalizedReadOnlyQueryItem) => BoundaryResult<readonly BettingWinResourceRecord[]>;
  readonly settlement: (item: NormalizedReadOnlyQueryItem) => BoundaryResult<readonly BettingWinResourceRecord[]>;
}

export interface PrivatePaperRuntimeReadOnlyQuerySource {
  readonly kind: 'read_only_query';
  readonly exportedAt: IsoTimestamp;
  readonly sourceManifestHash: string;
  readonly client: ReadOnlyQueryApiClient;
  readonly requests: {
    readonly identity: PrivatePaperRuntimeReadOnlyQueryRequest<Parameters<ReadOnlyQueryApiClient['queryIdentity']>[0]['filters']>;
    readonly rules: PrivatePaperRuntimeReadOnlyQueryRequest<Parameters<ReadOnlyQueryApiClient['queryRules']>[0]['filters']>;
    readonly quotes: PrivatePaperRuntimeReadOnlyQueryRequest<Parameters<ReadOnlyQueryApiClient['queryQuotes']>[0]['filters']>;
    readonly settlement: PrivatePaperRuntimeReadOnlyQueryRequest<Parameters<ReadOnlyQueryApiClient['querySettlement']>[0]['filters']>;
  };
  readonly mappers: PrivatePaperReadOnlyQueryRecordMappers;
}

export type PrivatePaperRuntimeSource = PrivatePaperRuntimePinnedRecordSource | PrivatePaperRuntimeReadOnlyQuerySource;

export interface PrivatePaperRuntimeStateCycle {
  readonly cycleId: string;
  readonly cycleFingerprint: string;
  readonly sourceKind: PrivatePaperRuntimeSource['kind'];
  readonly sourceManifestHash: string;
  readonly exportedAt: IsoTimestamp;
  readonly candidateCount: number;
  readonly blockedCandidateCount: number;
  readonly killTriggered: boolean;
}

export interface PrivatePaperRuntimeState {
  readonly runtimeId: string;
  readonly upstreamCommitSha: string;
  readonly upstreamGitTreeSha: string;
  readonly completedCycles: readonly PrivatePaperRuntimeStateCycle[];
}

export interface PrivatePaperRuntimeRequest {
  readonly runtimeId: string;
  readonly cycleId: string;
  readonly maxCandidatesPerCycle: number;
  readonly upstreamLock: BettingWinUpstreamLock;
  readonly source: PrivatePaperRuntimeSource;
  readonly candidatePlans: readonly PrivatePaperCandidateRuntimePlan[];
  readonly previousState?: PrivatePaperRuntimeState;
}

export interface PrivatePaperRuntimeAcceptedCandidateResult {
  readonly ok: true;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly decisionTimestamp: IsoTimestamp;
  readonly maxQuoteAgeMs: number;
  readonly completionEventCount: number;
  readonly completionGroupState: NonAtomicSettlementReplayReconciliation['completionGroupState'];
  readonly killTriggered: boolean;
  readonly killReason?: 'manual' | 'residual_exposure_floor';
  readonly stakeVector: StakeVectorSolution;
  readonly residualExposure?: NonAtomicResidualExposureAnalysis;
  readonly settlement: ConsumedSettlementReplay;
  readonly settledNetMinor: bigint;
  readonly replayCount: number;
  readonly uniqueReplayCount: number;
  readonly correctionCount: number;
  readonly finalityProgressionCount: number;
  readonly filledLegIds: readonly string[];
  readonly excludedLegIds: readonly string[];
}

export interface PrivatePaperRuntimeBlockedCandidateResult {
  readonly ok: false;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly blockers: readonly Blocker[];
}

export type PrivatePaperRuntimeCandidateResult =
  | PrivatePaperRuntimeAcceptedCandidateResult
  | PrivatePaperRuntimeBlockedCandidateResult;

export interface PrivatePaperRuntimeCycleResult {
  readonly runtimeKind: 'private_paper_runtime_cycle';
  readonly runtimeId: string;
  readonly cycleId: string;
  readonly sourceKind: PrivatePaperRuntimeSource['kind'];
  readonly sourceManifestHash: string;
  readonly exportedAt: IsoTimestamp;
  readonly cycleFingerprint: string;
  readonly candidateResults: readonly PrivatePaperRuntimeCandidateResult[];
  readonly candidateCount: number;
  readonly blockedCandidateCount: number;
  readonly killTriggered: boolean;
  readonly stopReason: 'cycle_complete' | 'kill_triggered';
  readonly state: PrivatePaperRuntimeState;
}

interface NormalizedCandidatePlan {
  readonly candidateId: string;
  readonly decisionTimestamp: IsoTimestamp;
  readonly decisionTimestampMs: number;
  readonly maxQuoteAgeMs: number;
  readonly manualKill: boolean;
  readonly completionEvents: readonly NonAtomicCompletionEvent[];
  readonly residualExposureFloorMinor?: bigint;
}

interface IndexedCompletionEvent {
  readonly event: NonAtomicCompletionEvent;
  readonly index: number;
}

export async function runBoundedPrivatePaperRuntimeCycle(
  request: PrivatePaperRuntimeRequest,
): Promise<BoundaryResult<PrivatePaperRuntimeCycleResult>> {
  const normalizedRequest = validateRuntimeRequest(request);
  if (!normalizedRequest.ok) {
    return normalizedRequest;
  }

  const recordsResult = await loadRuntimeRecords(
    normalizedRequest.value.source,
    normalizedRequest.value.upstreamLock,
  );
  if (!recordsResult.ok) {
    return recordsResult;
  }

  const candidates = deriveStandardBinaryOpportunityCandidates(recordsResult.value.records);
  if (candidates.length === 0) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_CANDIDATES_EMPTY',
      'Private paper runtime requires at least one canonical market candidate from the selected source.',
      'Pinned records or read-only query pages that derive at least one canonical market candidate.',
    );
  }
  if (candidates.length > normalizedRequest.value.maxCandidatesPerCycle) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_CANDIDATE_BOUND_EXCEEDED',
      'Private paper runtime requires an explicit candidate bound and rejects sources that exceed it.',
      'A bounded source scope whose derived candidate count stays within maxCandidatesPerCycle.',
    );
  }
  const candidateIds = new Set(candidates.map((candidate) => candidate.candidateId));
  for (const candidatePlan of normalizedRequest.value.candidatePlans) {
    if (!candidateIds.has(candidatePlan.candidateId)) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_PLAN_UNKNOWN_CANDIDATE',
        'Private paper runtime requires every candidate runtime plan to target a derived canonical market candidate.',
        'Candidate runtime plans aligned to the derived canonical market candidates.',
      );
    }
  }

  const cycleFingerprint = computeCycleFingerprint(
    normalizedRequest.value,
    recordsResult.value,
  );
  if (!cycleFingerprint.ok) {
    return cycleFingerprint;
  }

  const restartedState = validateRestartState(normalizedRequest.value, cycleFingerprint.value);
  if (!restartedState.ok) {
    return restartedState;
  }

  const normalizedPlansByCandidateId = new Map(
    normalizedRequest.value.candidatePlans.map((plan) => [plan.candidateId, plan]),
  );

  const candidateResults = candidates
    .map((candidate) =>
      executeRuntimeCandidate(
        candidate,
        normalizedPlansByCandidateId.get(candidate.candidateId),
      ),
    )
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));

  const blockedCandidateCount = candidateResults.filter((candidateResult) => !candidateResult.ok).length;
  const killTriggered = candidateResults.some(
    (candidateResult) => candidateResult.ok && candidateResult.killTriggered,
  );
  const state = buildNextState(
    normalizedRequest.value,
    cycleFingerprint.value,
    candidateResults.length,
    blockedCandidateCount,
    killTriggered,
  );

  return accepted(
    Object.freeze({
      runtimeKind: 'private_paper_runtime_cycle',
      runtimeId: normalizedRequest.value.runtimeId,
      cycleId: normalizedRequest.value.cycleId,
      sourceKind: normalizedRequest.value.source.kind,
      sourceManifestHash: normalizedRequest.value.source.sourceManifestHash,
      exportedAt: normalizedRequest.value.source.exportedAt,
      cycleFingerprint: cycleFingerprint.value,
      candidateResults: Object.freeze(candidateResults),
      candidateCount: candidateResults.length,
      blockedCandidateCount,
      killTriggered,
      stopReason: killTriggered ? 'kill_triggered' : 'cycle_complete',
      state,
    }),
  );
}

function validateRuntimeRequest(
  request: PrivatePaperRuntimeRequest,
): BoundaryResult<{
  readonly runtimeId: string;
  readonly cycleId: string;
  readonly maxCandidatesPerCycle: number;
  readonly upstreamLock: BettingWinUpstreamLock;
  readonly source: PrivatePaperRuntimeSource;
  readonly candidatePlans: readonly NormalizedCandidatePlan[];
  readonly previousState?: PrivatePaperRuntimeState;
}> {
  const runtimeId = requireNonEmptyString(
    request.runtimeId,
    'PRIVATE_PAPER_RUNTIME_ID_MISSING',
    'Private paper runtime requires a non-empty runtime id.',
    'Stable runtime id for the private paper cycle.',
  );
  if (!runtimeId.ok) {
    return runtimeId;
  }
  const cycleId = requireNonEmptyString(
    request.cycleId,
    'PRIVATE_PAPER_RUNTIME_CYCLE_ID_MISSING',
    'Private paper runtime requires a non-empty cycle id.',
    'Stable cycle id for restart and idempotency checks.',
  );
  if (!cycleId.ok) {
    return cycleId;
  }
  const maxCandidatesPerCycle = requirePositiveInteger(
    request.maxCandidatesPerCycle,
    'PRIVATE_PAPER_RUNTIME_CANDIDATE_BOUND_INVALID',
    'Private paper runtime requires maxCandidatesPerCycle to be a positive integer.',
    'Explicit positive candidate bound for each runtime cycle.',
  );
  if (!maxCandidatesPerCycle.ok) {
    return maxCandidatesPerCycle;
  }
  if (!isCompatibleUpstreamLock(request.upstreamLock)) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_UPSTREAM_LOCK_INCOMPATIBLE',
      'Private paper runtime requires the validated betting-win committed-HEAD surebet lock contract.',
      'Validated betting-win committed-HEAD upstream lock for betting-win.strategy-export.v1 and surebet_standard_binary_v0.',
    );
  }

  const sourceValidation = validateRuntimeSource(request.source, request.upstreamLock);
  if (!sourceValidation.ok) {
    return sourceValidation;
  }

  const normalizedCandidatePlans = normalizeCandidatePlans(request.candidatePlans);
  if (!normalizedCandidatePlans.ok) {
    return normalizedCandidatePlans;
  }
  if (normalizedCandidatePlans.value.length > maxCandidatesPerCycle.value) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_PLAN_BOUND_EXCEEDED',
      'Private paper runtime rejects candidate plan sets that exceed maxCandidatesPerCycle.',
      'Candidate plans bounded by maxCandidatesPerCycle.',
    );
  }

  return accepted(
    Object.freeze({
      runtimeId: runtimeId.value,
      cycleId: cycleId.value,
      maxCandidatesPerCycle: maxCandidatesPerCycle.value,
      upstreamLock: request.upstreamLock,
      source: sourceValidation.value,
      candidatePlans: normalizedCandidatePlans.value,
      ...(request.previousState === undefined ? {} : { previousState: request.previousState }),
    }),
  );
}

function validateRuntimeSource(
  source: PrivatePaperRuntimeSource,
  upstreamLock: BettingWinUpstreamLock,
): BoundaryResult<PrivatePaperRuntimeSource> {
  const exportedAt = requireIsoTimestamp(
    source.exportedAt,
    'PRIVATE_PAPER_RUNTIME_EXPORTED_AT_INVALID',
    'Private paper runtime requires an ISO-8601 UTC exportedAt timestamp.',
    'Explicit ISO-8601 UTC exportedAt timestamp for the runtime source.',
  );
  if (!exportedAt.ok) {
    return exportedAt;
  }
  const sourceManifestHash = requireManifestHash(
    source.sourceManifestHash,
    'PRIVATE_PAPER_RUNTIME_SOURCE_MANIFEST_HASH_INVALID',
    'Private paper runtime requires a 64-character lower-case source manifest hash.',
    'Stable lower-case source manifest hash for the runtime source.',
  );
  if (!sourceManifestHash.ok) {
    return sourceManifestHash;
  }

  if (source.kind === 'pinned_records') {
    if (source.sourceBundleKind !== 'resource_export') {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_SOURCE_KIND_UNSUPPORTED',
        'Private paper runtime currently supports only resource_export bundles for pinned-record mode.',
        'Pinned resource_export records for private paper runtime mode.',
      );
    }
    if (source.records.length === 0) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_SOURCE_RECORDS_EMPTY',
        'Private paper runtime requires at least one pinned resource record.',
        'Pinned resource records for the runtime cycle.',
      );
    }
    return accepted(
      Object.freeze({
        kind: 'pinned_records',
        sourceBundleKind: 'resource_export',
        exportedAt: exportedAt.value,
        sourceManifestHash: sourceManifestHash.value,
        records: Object.freeze([...source.records]),
      }),
    );
  }

  if (!sameUpstreamLock(source.client.config.upstreamLock, upstreamLock)) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_UPSTREAM_LOCK_MISMATCH',
      'Private paper runtime requires the read-only query client upstream lock to match the runtime upstream lock exactly.',
      'Read-only query client built from the same validated betting-win upstream lock as the runtime cycle.',
    );
  }

  const requestValidation = validateReadOnlyQueryRequests(source.requests);
  if (!requestValidation.ok) {
    return requestValidation;
  }
  const mapperValidation = validateReadOnlyQueryMappers(source.mappers);
  if (!mapperValidation.ok) {
    return mapperValidation;
  }

  return accepted(
    Object.freeze({
      kind: 'read_only_query',
      exportedAt: exportedAt.value,
      sourceManifestHash: sourceManifestHash.value,
      client: source.client,
      requests: source.requests,
      mappers: source.mappers,
    }),
  );
}

function validateReadOnlyQueryRequests(
  requests: PrivatePaperRuntimeReadOnlyQuerySource['requests'],
): BoundaryResult<undefined> {
  for (const [resource, request] of Object.entries(requests) as Array<
    [keyof PrivatePaperRuntimeReadOnlyQuerySource['requests'], PrivatePaperRuntimeReadOnlyQuerySource['requests'][keyof PrivatePaperRuntimeReadOnlyQuerySource['requests']]]
  >) {
    const pageSize = requirePositiveInteger(
      request.pageSize,
      'PRIVATE_PAPER_RUNTIME_QUERY_PAGE_SIZE_INVALID',
      'Private paper runtime requires a positive integer pageSize for each read-only query resource.',
      'Explicit positive read-only query pageSize.',
    );
    if (!pageSize.ok) {
      return pageSize;
    }
    const maxPages = requirePositiveInteger(
      request.maxPages,
      'PRIVATE_PAPER_RUNTIME_QUERY_PAGE_BOUND_INVALID',
      'Private paper runtime requires a positive integer maxPages for each read-only query resource.',
      'Explicit positive read-only query maxPages bound.',
    );
    if (!maxPages.ok) {
      return maxPages;
    }
    if (resource === 'settlement' && request.filters === undefined) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_QUERY_RESOURCE_UNSUPPORTED',
        'Private paper runtime requires an explicit settlement query filter set before polling the read-only API.',
        'Explicit settlement read-only query scope for the runtime cycle.',
      );
    }
  }
  return accepted(undefined);
}

function validateReadOnlyQueryMappers(
  mappers: PrivatePaperReadOnlyQueryRecordMappers,
): BoundaryResult<undefined> {
  for (const [resource, mapper] of Object.entries(mappers) as Array<
    [keyof PrivatePaperReadOnlyQueryRecordMappers, PrivatePaperReadOnlyQueryRecordMappers[keyof PrivatePaperReadOnlyQueryRecordMappers]]
  >) {
    if (typeof mapper !== 'function') {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_QUERY_MAPPER_MISSING',
        `Private paper runtime requires an explicit ${resource} read-only query record mapper.`,
        'Explicit canonical record mapper for each read-only query resource.',
      );
    }
  }
  return accepted(undefined);
}

async function loadRuntimeRecords(
  source: PrivatePaperRuntimeSource,
  upstreamLock: BettingWinUpstreamLock,
): Promise<BoundaryResult<{
  readonly records: readonly BettingWinResourceRecord[];
  readonly recordCount: number;
  readonly recordFingerprintSha256: string;
}>> {
  if (source.kind === 'pinned_records') {
    const records = Object.freeze([...source.records]);
    return accepted(
      Object.freeze({
        records,
        recordCount: records.length,
        recordFingerprintSha256: computeRecordFingerprint(records),
      }),
    );
  }

  if (!sameUpstreamLock(source.client.config.upstreamLock, upstreamLock)) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_UPSTREAM_LOCK_MISMATCH',
      'Private paper runtime requires the read-only query client upstream lock to match the runtime upstream lock exactly.',
      'Read-only query client built from the same validated betting-win upstream lock as the runtime cycle.',
    );
  }

  const records: BettingWinResourceRecord[] = [];
  const identityRecords = await collectBoundedReadOnlyQueryRecords(
    source.requests.identity.maxPages,
    async (cursor) => source.client.queryIdentity({
      ...toOptionalCursor(cursor),
      ...toOptionalFilters(source.requests.identity.filters),
      pageSize: source.requests.identity.pageSize,
    }),
    source.mappers.identity,
  );
  if (!identityRecords.ok) {
    return identityRecords;
  }
  records.push(...identityRecords.value);

  const ruleRecords = await collectBoundedReadOnlyQueryRecords(
    source.requests.rules.maxPages,
    async (cursor) => source.client.queryRules({
      ...toOptionalCursor(cursor),
      ...toOptionalFilters(source.requests.rules.filters),
      pageSize: source.requests.rules.pageSize,
    }),
    source.mappers.rules,
  );
  if (!ruleRecords.ok) {
    return ruleRecords;
  }
  records.push(...ruleRecords.value);

  const quoteRecords = await collectBoundedReadOnlyQueryRecords(
    source.requests.quotes.maxPages,
    async (cursor) => source.client.queryQuotes({
      ...toOptionalCursor(cursor),
      ...toOptionalFilters(source.requests.quotes.filters),
      pageSize: source.requests.quotes.pageSize,
    }),
    source.mappers.quotes,
  );
  if (!quoteRecords.ok) {
    return quoteRecords;
  }
  records.push(...quoteRecords.value);

  const settlementRecords = await collectBoundedReadOnlyQueryRecords(
    source.requests.settlement.maxPages,
    async (cursor) => source.client.querySettlement({
      ...toOptionalCursor(cursor),
      ...toOptionalFilters(source.requests.settlement.filters),
      pageSize: source.requests.settlement.pageSize,
    }),
    source.mappers.settlement,
  );
  if (!settlementRecords.ok) {
    return settlementRecords;
  }
  records.push(...settlementRecords.value);

  if (records.length === 0) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_SOURCE_RECORDS_EMPTY',
      'Private paper runtime requires the read-only query scope to resolve to at least one canonical record.',
      'Read-only query pages that map to canonical BWS records.',
    );
  }

  const normalizedRecords = Object.freeze(
    records.map((record) => Object.freeze({ ...record }) as BettingWinResourceRecord),
  );
  return accepted(
    Object.freeze({
      records: normalizedRecords,
      recordCount: normalizedRecords.length,
      recordFingerprintSha256: computeRecordFingerprint(normalizedRecords),
    }),
  );
}

async function collectBoundedReadOnlyQueryRecords<TItem>(
  maxPages: number,
  requestPage: (cursor?: string) => Promise<BoundaryResult<{ readonly page: { readonly items: readonly TItem[]; readonly nextCursor?: string } }>>,
  mapItem: (item: TItem) => BoundaryResult<readonly BettingWinResourceRecord[]>,
): Promise<BoundaryResult<readonly BettingWinResourceRecord[]>> {
  const collectedRecords: BettingWinResourceRecord[] = [];
  let currentCursor: string | undefined;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const pageResult = await requestPage(currentCursor);
    if (!pageResult.ok) {
      return pageResult;
    }

    for (const item of pageResult.value.page.items) {
      const mapped = mapItem(item);
      if (!mapped.ok) {
        return mapped;
      }
      collectedRecords.push(...mapped.value);
    }

    currentCursor = pageResult.value.page.nextCursor;
    if (currentCursor === undefined) {
      return accepted(Object.freeze(collectedRecords));
    }
  }

  return blocked(
    'PRIVATE_PAPER_RUNTIME_QUERY_PAGE_BOUND_EXCEEDED',
    'Private paper runtime rejects read-only query pagination paths that exceed the explicit per-resource page bound.',
    'A bounded read-only query scope whose pagination completes within maxPages.',
  );
}

function normalizeCandidatePlans(
  candidatePlans: readonly PrivatePaperCandidateRuntimePlan[],
): BoundaryResult<readonly NormalizedCandidatePlan[]> {
  if (candidatePlans.length === 0) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_CANDIDATE_PLANS_MISSING',
      'Private paper runtime requires at least one explicit candidate runtime plan.',
      'Candidate runtime plans with decision timestamps and completion events.',
    );
  }

  const seenCandidateIds = new Set<string>();
  const normalizedPlans: NormalizedCandidatePlan[] = [];
  for (const candidatePlan of candidatePlans) {
    const candidateId = requireNonEmptyString(
      candidatePlan.candidateId,
      'PRIVATE_PAPER_RUNTIME_CANDIDATE_ID_MISSING',
      'Private paper runtime requires a non-empty candidate id for every candidate plan.',
      'Candidate runtime plans keyed by candidate id.',
    );
    if (!candidateId.ok) {
      return candidateId;
    }
    if (seenCandidateIds.has(candidateId.value)) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_CANDIDATE_PLAN_DUPLICATE',
        'Private paper runtime requires exactly one runtime plan per candidate id.',
        'One private paper runtime plan per candidate.',
      );
    }

    const decisionTimestamp = requireIsoTimestamp(
      candidatePlan.decisionTimestamp,
      'PRIVATE_PAPER_RUNTIME_DECISION_TIMESTAMP_INVALID',
      'Private paper runtime requires ISO-8601 UTC decision timestamps.',
      'Candidate runtime plan decision timestamps in ISO-8601 UTC format.',
    );
    if (!decisionTimestamp.ok) {
      return decisionTimestamp;
    }
    const decisionTimestampMs = Date.parse(decisionTimestamp.value);
    if (!Number.isFinite(decisionTimestampMs)) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_DECISION_TIMESTAMP_INVALID',
        'Private paper runtime requires ISO-8601 UTC decision timestamps.',
        'Candidate runtime plan decision timestamps in ISO-8601 UTC format.',
      );
    }

    const maxQuoteAgeMs = requireNonNegativeInteger(
      candidatePlan.maxQuoteAgeMs,
      'PRIVATE_PAPER_RUNTIME_QUOTE_AGE_INVALID',
      'Private paper runtime requires a non-negative integer maxQuoteAgeMs for every candidate plan.',
      'Explicit non-negative quote freshness window for each candidate plan.',
    );
    if (!maxQuoteAgeMs.ok) {
      return maxQuoteAgeMs;
    }

    if (candidatePlan.completionEvents.length === 0) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENTS_MISSING',
        'Private paper runtime requires at least one completion event for every candidate plan.',
        'Explicit completion or reservation events for each candidate plan.',
      );
    }

    const normalizedCompletionEvents = normalizeCompletionEvents(candidatePlan.completionEvents);
    if (!normalizedCompletionEvents.ok) {
      return normalizedCompletionEvents;
    }

    if (
      candidatePlan.residualExposureFloorMinor !== undefined
      && candidatePlan.residualExposureFloorMinor > 0n
    ) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_KILL_CRITERIA_INVALID',
        'Private paper runtime requires residualExposureFloorMinor to be zero or negative when provided.',
        'Residual exposure kill criteria expressed as zero or negative fixed-point net thresholds.',
      );
    }

    seenCandidateIds.add(candidateId.value);
    normalizedPlans.push(
      Object.freeze({
        candidateId: candidateId.value,
        decisionTimestamp: decisionTimestamp.value,
        decisionTimestampMs,
        maxQuoteAgeMs: maxQuoteAgeMs.value,
        manualKill: candidatePlan.manualKill,
        completionEvents: normalizedCompletionEvents.value,
        ...(candidatePlan.residualExposureFloorMinor === undefined
          ? {}
          : { residualExposureFloorMinor: candidatePlan.residualExposureFloorMinor }),
      }),
    );
  }

  normalizedPlans.sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  return accepted(Object.freeze(normalizedPlans));
}

function normalizeCompletionEvents(
  completionEvents: readonly NonAtomicCompletionEvent[],
): BoundaryResult<readonly NonAtomicCompletionEvent[]> {
  const normalizedCompletionEvents = completionEvents
    .map((event, index) => ({ event: cloneCompletionEvent(event), index }))
    .sort(compareIndexedCompletionEvents);

  for (let index = 1; index < normalizedCompletionEvents.length; index += 1) {
    const previous = normalizedCompletionEvents[index - 1];
    const current = normalizedCompletionEvents[index];
    if (
      previous !== undefined
      && current !== undefined
      && previous.event.legId === current.event.legId
      && previous.event.occurredAt === current.event.occurredAt
    ) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENT_ORDER_AMBIGUOUS',
        'Private paper runtime requires an unambiguous per-leg ordering for completion events when timestamps tie.',
        'Completion events with distinct per-leg timestamps or an explicit per-leg sequence.',
      );
    }
  }

  return accepted(Object.freeze(normalizedCompletionEvents.map(({ event }) => event)));
}

function executeRuntimeCandidate(
  candidate: StandardBinaryOpportunityCandidate,
  candidatePlan: NormalizedCandidatePlan | undefined,
): PrivatePaperRuntimeCandidateResult {
  if (!candidate.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, candidate.blockers);
  }
  if (candidatePlan === undefined) {
    return createBlockedCandidateResult(
      candidate.candidateId,
      candidate.canonicalMarketId,
      toSingleBlocker(
        'PRIVATE_PAPER_RUNTIME_PLAN_MISSING',
        'Private paper runtime requires an explicit runtime plan for every accepted candidate.',
        'Runtime plan for every accepted private paper candidate.',
      ),
    );
  }

  const timing = validateCandidateTiming(candidate.records, candidatePlan);
  if (!timing.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, timing.blockers);
  }

  const stakeVectorInput = buildStandardBinaryStakeVectorInput(candidate.completeSet, {
    observedNowMs: candidatePlan.decisionTimestampMs,
    maxQuoteAgeMs: candidatePlan.maxQuoteAgeMs,
  });
  if (!stakeVectorInput.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, stakeVectorInput.blockers);
  }

  const stakeVector = solveStandardBinaryStakeVector(stakeVectorInput.value);
  if (!stakeVector.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, stakeVector.blockers);
  }

  const simulatedCandidate = simulateRuntimeCandidate(
    candidate,
    candidatePlan,
    stakeVector.value,
    stakeVectorInput.value.matrix,
  );
  if (!simulatedCandidate.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, simulatedCandidate.blockers);
  }

  return createAcceptedCandidateResult(
    candidate,
    candidatePlan,
    stakeVector.value,
    simulatedCandidate.value.completionSimulation,
    simulatedCandidate.value.reconciliation,
    simulatedCandidate.value.killReason,
  );
}

function validateCandidateTiming(
  records: readonly BettingWinResourceRecord[],
  candidatePlan: NormalizedCandidatePlan,
): BoundaryResult<undefined> {
  for (const completionEvent of candidatePlan.completionEvents) {
    if (completionEvent.legId.trim().length === 0) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENT_LEG_ID_MISSING',
        'Private paper runtime requires a non-empty legId for every completion event.',
        'Completion events with stable leg ids.',
      );
    }
    if (!ISO_TIMESTAMP_REGEX.test(completionEvent.occurredAt)) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENT_TIMESTAMP_INVALID',
        'Private paper runtime requires ISO-8601 UTC timestamps for every completion event.',
        'Completion events with ISO-8601 UTC timestamps.',
      );
    }
    if (!NON_ATOMIC_COMPLETION_EVENT_TYPES.includes(completionEvent.type)) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENT_TYPE_INVALID',
        'Private paper runtime requires supported non-atomic completion event types.',
        'Completion events using reserve, fill, reject, expire, or rollback types.',
      );
    }
    if (Date.parse(completionEvent.occurredAt) < candidatePlan.decisionTimestampMs) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENT_BEFORE_DECISION',
        'Private paper runtime rejects completion events that occur before the decision timestamp.',
        'Completion events occurring at or after the decision timestamp.',
      );
    }
  }

  const settlementRecords = records.filter(isSettlementRecord);
  for (const settlementRecord of settlementRecords) {
    const settlementAcceptedAtMs = Date.parse(settlementRecord.replayAcceptedAt);
    if (!Number.isFinite(settlementAcceptedAtMs)) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_SETTLEMENT_TIMESTAMP_INVALID',
        'Private paper runtime requires ISO-8601 UTC settlement replay timestamps.',
        'Accepted settlement replay timestamps in ISO-8601 UTC format.',
      );
    }
    if (settlementAcceptedAtMs <= candidatePlan.decisionTimestampMs) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_SETTLEMENT_LOOKAHEAD',
        'Private paper runtime rejects settlement replay evidence available at or before the decision timestamp.',
        'Settlement replay evidence strictly after the runtime decision timestamp.',
      );
    }
  }

  return accepted(undefined);
}

function simulateRuntimeCandidate(
  candidate: Extract<StandardBinaryOpportunityCandidate, { readonly ok: true }>,
  candidatePlan: NormalizedCandidatePlan,
  stakeVector: StakeVectorSolution,
  matrix: ReturnType<typeof buildStandardBinaryStakeVectorInput> extends BoundaryResult<infer TValue>
    ? TValue extends { readonly matrix: infer TMatrix }
      ? TMatrix
      : never
    : never,
): BoundaryResult<{
  readonly completionSimulation: NonAtomicCompletionSimulation;
  readonly reconciliation: NonAtomicSettlementReplayReconciliation;
  readonly killReason?: 'manual' | 'residual_exposure_floor';
}> {
  const initialSimulation = simulateNonAtomicPaperGroupCompletion({
    stakeVector,
    matrix,
    events: candidatePlan.completionEvents,
    manualKill: candidatePlan.manualKill,
  });
  if (!initialSimulation.ok) {
    return initialSimulation;
  }

  let completionSimulation = initialSimulation.value;
  let killReason: 'manual' | 'residual_exposure_floor' | undefined = candidatePlan.manualKill
    ? 'manual'
    : undefined;

  if (
    killReason === undefined
    && candidatePlan.residualExposureFloorMinor !== undefined
    && completionSimulation.residualExposure !== undefined
    && completionSimulation.residualExposure.worstCaseNetMinor < candidatePlan.residualExposureFloorMinor
  ) {
    const killedSimulation = simulateNonAtomicPaperGroupCompletion({
      stakeVector,
      matrix,
      events: candidatePlan.completionEvents,
      manualKill: true,
    });
    if (!killedSimulation.ok) {
      return killedSimulation;
    }
    completionSimulation = killedSimulation.value;
    killReason = 'residual_exposure_floor';
  }

  const settlementRecords = candidate.records.filter(isSettlementRecord);
  const reconciliation = reconcileNonAtomicSettlementReplay({
    completeSet: candidate.completeSet,
    settlementRecords,
    completionSimulation,
    stakeVector,
    matrix,
  });
  if (!reconciliation.ok) {
    return reconciliation;
  }

  const eventWindow = validateCompletionEventWindow(
    candidatePlan.completionEvents,
    reconciliation.value.settlement.replayAcceptedAt,
  );
  if (!eventWindow.ok) {
    return eventWindow;
  }

  return accepted(
    Object.freeze({
      completionSimulation,
      reconciliation: reconciliation.value,
      ...(killReason === undefined ? {} : { killReason }),
    }),
  );
}

function validateCompletionEventWindow(
  completionEvents: readonly NonAtomicCompletionEvent[],
  settlementReplayAcceptedAt: IsoTimestamp,
): BoundaryResult<undefined> {
  const settlementReplayAcceptedAtMs = Date.parse(settlementReplayAcceptedAt);
  if (!Number.isFinite(settlementReplayAcceptedAtMs)) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_SETTLEMENT_TIMESTAMP_INVALID',
      'Private paper runtime requires ISO-8601 UTC settlement replay timestamps.',
      'Accepted settlement replay timestamps in ISO-8601 UTC format.',
    );
  }

  for (const completionEvent of completionEvents) {
    if (Date.parse(completionEvent.occurredAt) >= settlementReplayAcceptedAtMs) {
      return blocked(
        'PRIVATE_PAPER_RUNTIME_COMPLETION_EVENT_AFTER_SETTLEMENT',
        'Private paper runtime rejects completion events that occur at or after the final settlement replay timestamp.',
        'Completion events strictly earlier than the final settlement replay timestamp.',
      );
    }
  }

  return accepted(undefined);
}

function validateRestartState(
  request: {
    readonly runtimeId: string;
    readonly cycleId: string;
    readonly upstreamLock: BettingWinUpstreamLock;
    readonly previousState?: PrivatePaperRuntimeState;
  },
  cycleFingerprint: string,
): BoundaryResult<undefined> {
  if (request.previousState === undefined) {
    return accepted(undefined);
  }
  if (request.previousState.runtimeId !== request.runtimeId) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_RESTART_RUNTIME_ID_MISMATCH',
      'Private paper runtime restarts require the persisted runtime id to match the incoming runtime id.',
      'Restart state for the same private paper runtime id.',
    );
  }
  if (request.previousState.upstreamCommitSha !== request.upstreamLock.commitSha) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_RESTART_UPSTREAM_COMMIT_MISMATCH',
      'Private paper runtime restarts require the persisted upstream commit to match the verified runtime upstream lock.',
      'Restart state created under the same verified betting-win commit.',
    );
  }
  if (request.previousState.upstreamGitTreeSha !== request.upstreamLock.gitTreeSha) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_RESTART_UPSTREAM_TREE_MISMATCH',
      'Private paper runtime restarts require the persisted upstream tree to match the verified runtime upstream lock.',
      'Restart state created under the same verified betting-win tree.',
    );
  }
  const existingCycle = request.previousState.completedCycles.find((cycle) => cycle.cycleId === request.cycleId);
  if (existingCycle !== undefined && existingCycle.cycleFingerprint !== cycleFingerprint) {
    return blocked(
      'PRIVATE_PAPER_RUNTIME_IDEMPOTENCY_MISMATCH',
      'Private paper runtime rejects a repeated cycle id when the runtime input fingerprint changes.',
      'Repeated cycle ids with byte-for-byte identical runtime inputs.',
    );
  }
  return accepted(undefined);
}

function buildNextState(
  request: {
    readonly runtimeId: string;
    readonly cycleId: string;
    readonly upstreamLock: BettingWinUpstreamLock;
    readonly source: PrivatePaperRuntimeSource;
    readonly previousState?: PrivatePaperRuntimeState;
  },
  cycleFingerprint: string,
  candidateCount: number,
  blockedCandidateCount: number,
  killTriggered: boolean,
): PrivatePaperRuntimeState {
  const currentCycle = Object.freeze({
    cycleId: request.cycleId,
    cycleFingerprint,
    sourceKind: request.source.kind,
    sourceManifestHash: request.source.sourceManifestHash,
    exportedAt: request.source.exportedAt,
    candidateCount,
    blockedCandidateCount,
    killTriggered,
  } satisfies PrivatePaperRuntimeStateCycle);

  const priorCycles = request.previousState?.completedCycles ?? [];
  const existingCycle = priorCycles.find((cycle) => cycle.cycleId === request.cycleId);
  const completedCycles = existingCycle === undefined
    ? Object.freeze([...priorCycles, currentCycle].sort((left, right) => left.cycleId.localeCompare(right.cycleId)))
    : Object.freeze([...priorCycles].sort((left, right) => left.cycleId.localeCompare(right.cycleId)));

  return Object.freeze({
    runtimeId: request.runtimeId,
    upstreamCommitSha: request.upstreamLock.commitSha,
    upstreamGitTreeSha: request.upstreamLock.gitTreeSha,
    completedCycles,
  });
}

function computeCycleFingerprint(
  request: {
    readonly cycleId: string;
    readonly maxCandidatesPerCycle: number;
    readonly runtimeId: string;
    readonly upstreamLock: BettingWinUpstreamLock;
    readonly source: PrivatePaperRuntimeSource;
    readonly candidatePlans: readonly NormalizedCandidatePlan[];
  },
  loadedRecords: {
    readonly recordCount: number;
    readonly recordFingerprintSha256: string;
  },
): BoundaryResult<string> {
  const fingerprintMaterial = canonicalizeForHash({
    runtimeId: request.runtimeId,
    cycleId: request.cycleId,
    maxCandidatesPerCycle: request.maxCandidatesPerCycle,
    upstreamCommitSha: request.upstreamLock.commitSha,
    upstreamGitTreeSha: request.upstreamLock.gitTreeSha,
    upstreamTrackedTreeListingSha256: request.upstreamLock.trackedTreeListingSha256,
    source: buildCycleFingerprintSourcePayload(request.source, loadedRecords),
    candidatePlans: request.candidatePlans.map((candidatePlan) => ({
      candidateId: candidatePlan.candidateId,
      decisionTimestamp: candidatePlan.decisionTimestamp,
      maxQuoteAgeMs: candidatePlan.maxQuoteAgeMs,
      manualKill: candidatePlan.manualKill,
      residualExposureFloorMinor: candidatePlan.residualExposureFloorMinor,
      completionEvents: candidatePlan.completionEvents.map((completionEvent) => ({
        legId: completionEvent.legId,
        type: completionEvent.type,
        occurredAt: completionEvent.occurredAt,
        stakeMinor: completionEvent.stakeMinor,
      })),
    })),
  });

  return accepted(createHash('sha256').update(JSON.stringify(fingerprintMaterial)).digest('hex'));
}

function buildCycleFingerprintSourcePayload(
  source: PrivatePaperRuntimeSource,
  loadedRecords: {
    readonly recordCount: number;
    readonly recordFingerprintSha256: string;
  },
): unknown {
  if (source.kind === 'pinned_records') {
    return Object.freeze({
      kind: source.kind,
      sourceBundleKind: source.sourceBundleKind,
      sourceManifestHash: source.sourceManifestHash,
      exportedAt: source.exportedAt,
      recordCount: loadedRecords.recordCount,
      recordFingerprintSha256: loadedRecords.recordFingerprintSha256,
    });
  }

  return Object.freeze({
    kind: source.kind,
    sourceManifestHash: source.sourceManifestHash,
    exportedAt: source.exportedAt,
    recordCount: loadedRecords.recordCount,
    recordFingerprintSha256: loadedRecords.recordFingerprintSha256,
    client: Object.freeze({
      baseUrl: source.client.config.baseUrl,
      contractVersion: source.client.config.contractVersion,
      maxPageSize: source.client.config.maxPageSize,
      retryBackoffMs: source.client.config.retryBackoffMs,
      retryLimit: source.client.config.retryLimit,
      timeoutMs: source.client.config.timeoutMs,
    }),
    requests: Object.freeze({
      identity: normalizeFingerprintReadOnlyQueryRequest(source.requests.identity),
      rules: normalizeFingerprintReadOnlyQueryRequest(source.requests.rules),
      quotes: normalizeFingerprintReadOnlyQueryRequest(source.requests.quotes),
      settlement: normalizeFingerprintReadOnlyQueryRequest(source.requests.settlement),
    }),
  });
}

function normalizeFingerprintReadOnlyQueryRequest<TFilters>(
  request: PrivatePaperRuntimeReadOnlyQueryRequest<TFilters>,
): unknown {
  return Object.freeze({
    maxPages: request.maxPages,
    pageSize: request.pageSize,
    ...(request.filters === undefined ? {} : { filters: canonicalizeForHash(request.filters) }),
  });
}

function computeRecordFingerprint(records: readonly BettingWinResourceRecord[]): string {
  const canonicalRecordMaterial = records
    .map((record) => JSON.stringify(canonicalizeForHash(record)))
    .sort((left, right) => left.localeCompare(right));
  return createHash('sha256').update(JSON.stringify(canonicalRecordMaterial)).digest('hex');
}

function createAcceptedCandidateResult(
  candidate: Extract<StandardBinaryOpportunityCandidate, { readonly ok: true }>,
  candidatePlan: NormalizedCandidatePlan,
  stakeVector: StakeVectorSolution,
  completionSimulation: NonAtomicCompletionSimulation,
  reconciliation: NonAtomicSettlementReplayReconciliation,
  killReason?: 'manual' | 'residual_exposure_floor',
): PrivatePaperRuntimeAcceptedCandidateResult {
  return Object.freeze({
    ok: true,
    candidateId: candidate.candidateId,
    canonicalMarketId: candidate.canonicalMarketId,
    decisionTimestamp: candidatePlan.decisionTimestamp,
    maxQuoteAgeMs: candidatePlan.maxQuoteAgeMs,
    completionEventCount: candidatePlan.completionEvents.length,
    completionGroupState: reconciliation.completionGroupState,
    killTriggered: killReason !== undefined,
    ...(killReason === undefined ? {} : { killReason }),
    stakeVector,
    ...(completionSimulation.residualExposure === undefined
      ? {}
      : { residualExposure: completionSimulation.residualExposure }),
    settlement: reconciliation.settlement,
    settledNetMinor: reconciliation.settledNetMinor,
    replayCount: reconciliation.replayCount,
    uniqueReplayCount: reconciliation.uniqueReplayCount,
    correctionCount: reconciliation.correctionCount,
    finalityProgressionCount: reconciliation.finalityProgressionCount,
    filledLegIds: Object.freeze([...reconciliation.filledLegIds]),
    excludedLegIds: Object.freeze([...reconciliation.excludedLegIds]),
  });
}

function createBlockedCandidateResult(
  candidateId: string,
  canonicalMarketId: string,
  blockers: readonly Blocker[],
): PrivatePaperRuntimeBlockedCandidateResult {
  return Object.freeze({
    ok: false,
    candidateId,
    canonicalMarketId,
    blockers: Object.freeze(blockers.map((blocker) => Object.freeze({ ...blocker }))),
  });
}

function cloneCompletionEvent(event: NonAtomicCompletionEvent): NonAtomicCompletionEvent {
  return Object.freeze({
    legId: event.legId,
    type: event.type,
    occurredAt: event.occurredAt,
    ...(event.stakeMinor === undefined ? {} : { stakeMinor: event.stakeMinor }),
  });
}

function compareIndexedCompletionEvents(left: IndexedCompletionEvent, right: IndexedCompletionEvent): number {
  const timestampOrder = left.event.occurredAt.localeCompare(right.event.occurredAt);
  if (timestampOrder !== 0) {
    return timestampOrder;
  }

  const legOrder = left.event.legId.localeCompare(right.event.legId);
  if (legOrder !== 0) {
    return legOrder;
  }

  const typeOrder = left.event.type.localeCompare(right.event.type);
  if (typeOrder !== 0) {
    return typeOrder;
  }

  const stakeOrder = compareOptionalBigInt(left.event.stakeMinor, right.event.stakeMinor);
  if (stakeOrder !== 0) {
    return stakeOrder;
  }

  return left.index - right.index;
}

function compareOptionalBigInt(left: bigint | undefined, right: bigint | undefined): number {
  if (left === right) {
    return 0;
  }
  if (left === undefined) {
    return -1;
  }
  if (right === undefined) {
    return 1;
  }
  return left < right ? -1 : 1;
}

function sameUpstreamLock(left: BettingWinUpstreamLock, right: BettingWinUpstreamLock): boolean {
  return left.repository === right.repository
    && left.repositoryPath === right.repositoryPath
    && left.commitSha === right.commitSha
    && left.gitTreeSha === right.gitTreeSha
    && left.trackedTreeListingSha256 === right.trackedTreeListingSha256
    && left.contractSchema === right.contractSchema
    && left.contractAlias === right.contractAlias
    && left.surebetProfile === right.surebetProfile
    && left.sourceView === right.sourceView;
}

function isCompatibleUpstreamLock(lock: BettingWinUpstreamLock): boolean {
  return lock.contractSchema === 'betting-win.strategy-export.v1'
    && lock.contractAlias === 'betting-win-strategy-export.v1'
    && lock.surebetProfile === 'surebet_standard_binary_v0'
    && lock.sourceView === 'committed_git_head';
}

function requireNonEmptyString(
  value: string,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value.trim());
}

function requireManifestHash(
  value: string,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || !LOWERCASE_SHA256_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireIsoTimestamp(
  value: string,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<IsoTimestamp> {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_REGEX.test(value) || Number.isNaN(Date.parse(value))) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requirePositiveInteger(
  value: number,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<number> {
  if (!Number.isInteger(value) || value <= 0) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireNonNegativeInteger(
  value: number,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<number> {
  if (!Number.isInteger(value) || value < 0) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function toSingleBlocker(code: string, message: string, evidenceRequired: string): readonly Blocker[] {
  return Object.freeze([{ code, message, evidenceRequired }]);
}

function isSettlementRecord(record: BettingWinResourceRecord): record is BettingWinSettlementRecord {
  return record.recordType === 'settlement';
}

function toOptionalCursor(cursor: string | undefined): { readonly cursor?: string } {
  return cursor === undefined ? {} : { cursor };
}

function toOptionalFilters<TFilters>(filters: TFilters | undefined): { readonly filters?: TFilters } {
  return filters === undefined ? {} : { filters };
}

function canonicalizeForHash(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalizeForHash(entry));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, canonicalizeForHash(entryValue)]),
    );
  }
  return value;
}
