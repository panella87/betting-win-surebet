import { createHash } from 'node:crypto';
import type { BettingWinExportBundle } from '../adapters/betting-win-export-reader.js';
import {
  parseBettingWinResourceRecords,
  type BettingWinResourceRecord,
  type BettingWinSettlementRecord,
} from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type Blocker, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';
import type { StandardBinaryOpportunityCandidate } from '../opportunity/standard-binary-derivation.js';
import { deriveStandardBinaryOpportunityCandidates } from '../opportunity/standard-binary-derivation.js';
import { buildStandardBinaryStakeVectorInput } from '../opportunity/standard-binary-stake-solver.js';
import type { StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
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

export interface StandardBinaryBacktestExecutionPlan {
  readonly canonicalMarketId: string;
  readonly decisionTimestamp: IsoTimestamp;
  readonly maxQuoteAgeMs: number;
  readonly manualKill: boolean;
  readonly completionEvents: readonly NonAtomicCompletionEvent[];
}

export interface StandardBinaryBacktestRunInput {
  readonly bundle: BettingWinExportBundle;
  readonly records: readonly BettingWinResourceRecord[];
  readonly executionPlans: readonly StandardBinaryBacktestExecutionPlan[];
}

export interface StandardBinaryBacktestAcceptedCandidateResult {
  readonly ok: true;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly decisionTimestamp: IsoTimestamp;
  readonly maxQuoteAgeMs: number;
  readonly manualKill: boolean;
  readonly completionEventCount: number;
  readonly completionGroupState: NonAtomicSettlementReplayReconciliation['completionGroupState'];
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

export interface StandardBinaryBacktestBlockedCandidateResult {
  readonly ok: false;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly blockers: readonly Blocker[];
}

export type StandardBinaryBacktestCandidateResult =
  | StandardBinaryBacktestAcceptedCandidateResult
  | StandardBinaryBacktestBlockedCandidateResult;

export interface StandardBinaryBacktestRun {
  readonly runKind: 'deterministic_standard_binary_backtest';
  readonly sourceManifestHash: string;
  readonly sourceBundleKind: 'resource_export';
  readonly exportedAt: IsoTimestamp;
  readonly runHash: string;
  readonly candidateResults: readonly StandardBinaryBacktestCandidateResult[];
  readonly acceptedCandidateCount: number;
  readonly blockedCandidateCount: number;
}

interface NormalizedExecutionPlan {
  readonly canonicalMarketId: string;
  readonly decisionTimestamp: IsoTimestamp;
  readonly decisionTimestampMs: number;
  readonly maxQuoteAgeMs: number;
  readonly manualKill: boolean;
  readonly completionEvents: readonly NonAtomicCompletionEvent[];
}

interface IndexedCompletionEvent {
  readonly event: NonAtomicCompletionEvent;
  readonly index: number;
}

export function runDeterministicStandardBinaryBacktest(
  input: StandardBinaryBacktestRunInput,
): BoundaryResult<StandardBinaryBacktestRun> {
  if (input.bundle.bundleKind !== 'resource_export') {
    return blocked(
      'BACKTEST_EXPORT_KIND_UNSUPPORTED',
      'Deterministic standard-binary backtesting currently supports only resource_export bundles.',
      'Pinned betting-win resource_export bundle for deterministic backtesting.',
    );
  }
  if (input.records.length === 0) {
    return blocked(
      'BACKTEST_RECORDS_EMPTY',
      'Deterministic standard-binary backtesting requires parsed betting-win resource records.',
      'Pinned betting-win resource records for at least one canonical market candidate.',
    );
  }
  const sourceRecordsHash = validatePinnedBundleRecordProvenance(input.bundle, input.records);
  if (!sourceRecordsHash.ok) {
    return sourceRecordsHash;
  }

  const normalizedExecutionPlans = normalizeExecutionPlans(input.executionPlans);
  if (!normalizedExecutionPlans.ok) {
    return normalizedExecutionPlans;
  }

  const candidates = deriveStandardBinaryOpportunityCandidates(input.records);
  if (candidates.length === 0) {
    return blocked(
      'BACKTEST_CANDIDATES_EMPTY',
      'Deterministic standard-binary backtesting requires at least one derived canonical market candidate.',
      'Pinned betting-win resource records that derive at least one canonical market candidate.',
    );
  }

  const candidateIds = new Set(candidates.map((candidate) => candidate.canonicalMarketId));
  for (const executionPlan of normalizedExecutionPlans.value) {
    if (!candidateIds.has(executionPlan.canonicalMarketId)) {
      return blocked(
        'BACKTEST_EXECUTION_PLAN_UNKNOWN_CANDIDATE',
        'Deterministic standard-binary backtesting requires every execution plan to target a derived canonical market candidate.',
        'Execution plans aligned to the derived canonical market candidates.',
      );
    }
  }

  const executionPlansByCandidateId = new Map(
    normalizedExecutionPlans.value.map((executionPlan) => [executionPlan.canonicalMarketId, executionPlan]),
  );

  const candidateResults = candidates
    .map((candidate) => executeCandidateBacktest(candidate, executionPlansByCandidateId.get(candidate.canonicalMarketId)))
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));

  const hashMaterial = toRunHashMaterial(
    input.bundle,
    sourceRecordsHash.value,
    normalizedExecutionPlans.value,
    candidateResults,
  );
  const runHash = computeDeterministicRunHash(hashMaterial);
  if (!runHash.ok) {
    return runHash;
  }

  const acceptedCandidateCount = candidateResults.filter((candidateResult) => candidateResult.ok).length;
  const blockedCandidateCount = candidateResults.length - acceptedCandidateCount;

  return accepted(
    Object.freeze({
      runKind: 'deterministic_standard_binary_backtest',
      sourceManifestHash: input.bundle.reference.manifestHash,
      sourceBundleKind: 'resource_export',
      exportedAt: input.bundle.exportedAt,
      runHash: runHash.value,
      candidateResults: Object.freeze(candidateResults),
      acceptedCandidateCount,
      blockedCandidateCount,
    }),
  );
}

function validatePinnedBundleRecordProvenance(
  bundle: BettingWinExportBundle,
  records: readonly BettingWinResourceRecord[],
): BoundaryResult<string> {
  const bundleRecords = parseBettingWinResourceRecords(bundle.records);
  if (!bundleRecords.ok) {
    return blocked(
      'BACKTEST_SOURCE_RECORDS_INVALID',
      'Deterministic standard-binary backtesting requires bundle.records to parse into canonical betting-win resource records.',
      'Pinned betting-win export bundle records compatible with the BWS-130 intake contract.',
    );
  }

  const bundleRecordHash = hashCanonicalResourceRecords(bundleRecords.value);
  const inputRecordHash = hashCanonicalResourceRecords(records);
  if (bundleRecordHash !== inputRecordHash) {
    return blocked(
      'BACKTEST_SOURCE_RECORDS_PROVENANCE_MISMATCH',
      'Deterministic standard-binary backtesting requires the parsed record set to match the pinned bundle records exactly.',
      'Parsed betting-win resource records canonically matching the pinned bundle contents.',
    );
  }

  return accepted(bundleRecordHash);
}

function normalizeExecutionPlans(
  executionPlans: readonly StandardBinaryBacktestExecutionPlan[],
): BoundaryResult<readonly NormalizedExecutionPlan[]> {
  if (executionPlans.length === 0) {
    return blocked(
      'BACKTEST_EXECUTION_PLANS_MISSING',
      'Deterministic standard-binary backtesting requires at least one execution plan.',
      'Execution plans for the canonical market candidates under backtest.',
    );
  }

  const normalizedExecutionPlans: NormalizedExecutionPlan[] = [];
  const seenCandidateIds = new Set<string>();
  for (const executionPlan of executionPlans) {
    const canonicalMarketId = executionPlan.canonicalMarketId.trim();
    if (canonicalMarketId.length === 0) {
      return blocked(
        'BACKTEST_EXECUTION_PLAN_CANDIDATE_ID_MISSING',
        'Deterministic standard-binary backtesting requires a non-empty canonicalMarketId for every execution plan.',
        'Execution plans keyed by canonical market id.',
      );
    }
    if (seenCandidateIds.has(canonicalMarketId)) {
      return blocked(
        'BACKTEST_EXECUTION_PLAN_DUPLICATE',
        'Deterministic standard-binary backtesting requires exactly one execution plan per canonical market candidate.',
        'One execution plan for each canonical market candidate under backtest.',
      );
    }
    if (!Number.isInteger(executionPlan.maxQuoteAgeMs) || executionPlan.maxQuoteAgeMs < 0) {
      return blocked(
        'BACKTEST_QUOTE_FRESHNESS_WINDOW_INVALID',
        'Deterministic standard-binary backtesting requires a non-negative integer maxQuoteAgeMs for every execution plan.',
        'Execution plans with non-negative integer quote freshness windows.',
      );
    }

    const decisionTimestampMs = Date.parse(executionPlan.decisionTimestamp);
    if (!isIsoTimestamp(executionPlan.decisionTimestamp) || !Number.isFinite(decisionTimestampMs)) {
      return blocked(
        'BACKTEST_DECISION_TIMESTAMP_INVALID',
        'Deterministic standard-binary backtesting requires ISO-8601 UTC decision timestamps.',
        'Execution plans with ISO-8601 UTC decision timestamps.',
      );
    }
    if (executionPlan.completionEvents.length === 0) {
      return blocked(
        'BACKTEST_COMPLETION_EVENTS_MISSING',
        'Deterministic standard-binary backtesting requires at least one non-atomic completion event per execution plan.',
        'Execution plans with explicit non-atomic completion replay events.',
      );
    }

    const normalizedCompletionEvents = normalizeCompletionEvents(executionPlan.completionEvents);
    if (!normalizedCompletionEvents.ok) {
      return normalizedCompletionEvents;
    }

    seenCandidateIds.add(canonicalMarketId);
    normalizedExecutionPlans.push(
      Object.freeze({
        canonicalMarketId,
        decisionTimestamp: executionPlan.decisionTimestamp,
        decisionTimestampMs,
        maxQuoteAgeMs: executionPlan.maxQuoteAgeMs,
        manualKill: executionPlan.manualKill,
        completionEvents: normalizedCompletionEvents.value,
      }),
    );
  }

  normalizedExecutionPlans.sort((left, right) => left.canonicalMarketId.localeCompare(right.canonicalMarketId));
  return accepted(Object.freeze(normalizedExecutionPlans));
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
        'BACKTEST_COMPLETION_EVENT_ORDER_AMBIGUOUS',
        'Deterministic standard-binary backtesting requires an unambiguous per-leg ordering for completion events when timestamps tie.',
        'Completion replay events with distinct per-leg timestamps or an explicit per-leg sequence.',
      );
    }
  }

  return accepted(Object.freeze(normalizedCompletionEvents.map(({ event }) => event)));
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
  if (left < right) {
    return -1;
  }
  return 1;
}

function executeCandidateBacktest(
  candidate: StandardBinaryOpportunityCandidate,
  executionPlan: NormalizedExecutionPlan | undefined,
): StandardBinaryBacktestCandidateResult {
  if (!candidate.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, candidate.blockers);
  }
  if (executionPlan === undefined) {
    return createBlockedCandidateResult(
      candidate.candidateId,
      candidate.canonicalMarketId,
      toSingleBlocker(
        'BACKTEST_EXECUTION_PLAN_MISSING',
        'Deterministic standard-binary backtesting requires an execution plan for every accepted canonical market candidate.',
        'Execution plan for every accepted canonical market candidate under backtest.',
      ),
    );
  }

  const timing = validateBacktestTiming(candidate.completeSet, candidate.records, executionPlan);
  if (!timing.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, timing.blockers);
  }

  const stakeVectorInput = buildStandardBinaryStakeVectorInput(candidate.completeSet, {
    observedNowMs: executionPlan.decisionTimestampMs,
    maxQuoteAgeMs: executionPlan.maxQuoteAgeMs,
  });
  if (!stakeVectorInput.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, stakeVectorInput.blockers);
  }

  const stakeVector = solveStandardBinaryStakeVector(stakeVectorInput.value);
  if (!stakeVector.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, stakeVector.blockers);
  }

  const completionSimulation = simulateNonAtomicPaperGroupCompletion({
    stakeVector: stakeVector.value,
    matrix: stakeVectorInput.value.matrix,
    events: executionPlan.completionEvents,
    manualKill: executionPlan.manualKill,
  });
  if (!completionSimulation.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, completionSimulation.blockers);
  }

  const settlementRecords = candidate.records.filter(isSettlementRecord);
  const reconciliation = reconcileNonAtomicSettlementReplay({
    completeSet: candidate.completeSet,
    settlementRecords,
    completionSimulation: completionSimulation.value,
    stakeVector: stakeVector.value,
    matrix: stakeVectorInput.value.matrix,
  });
  if (!reconciliation.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, reconciliation.blockers);
  }

  const eventWindow = validateCompletionEventWindow(executionPlan, reconciliation.value.settlement.replayAcceptedAt);
  if (!eventWindow.ok) {
    return createBlockedCandidateResult(candidate.candidateId, candidate.canonicalMarketId, eventWindow.blockers);
  }

  return createAcceptedCandidateResult(
    candidate.candidateId,
    candidate.canonicalMarketId,
    executionPlan,
    stakeVector.value,
    completionSimulation.value,
    reconciliation.value,
  );
}

function validateBacktestTiming(
  completeSet: StandardBinaryCompleteSet,
  records: readonly BettingWinResourceRecord[],
  executionPlan: NormalizedExecutionPlan,
): BoundaryResult<undefined> {
  for (const quoteRecord of [completeSet.quotesByOutcome.yes, completeSet.quotesByOutcome.no]) {
    const observedAtMs = Date.parse(quoteRecord.evidence.observedAt);
    if (!Number.isFinite(observedAtMs)) {
      return blocked(
        'BACKTEST_QUOTE_TIMESTAMP_INVALID',
        'Deterministic standard-binary backtesting requires ISO-8601 UTC quote timestamps.',
        'Pinned betting-win quote records with ISO-8601 UTC timestamps.',
      );
    }
    if (observedAtMs > executionPlan.decisionTimestampMs) {
      return blocked(
        'BACKTEST_LOOKAHEAD_QUOTE_EVIDENCE',
        'Deterministic standard-binary backtesting rejects quote evidence observed after the decision timestamp.',
        'Pinned betting-win quote evidence observed no later than the backtest decision timestamp.',
      );
    }
  }

  const settlementRecords = records.filter(isSettlementRecord);
  for (const settlementRecord of settlementRecords) {
    const settlementAcceptedAtMs = Date.parse(settlementRecord.replayAcceptedAt);
    if (!Number.isFinite(settlementAcceptedAtMs)) {
      return blocked(
        'BACKTEST_SETTLEMENT_TIMESTAMP_INVALID',
        'Deterministic standard-binary backtesting requires ISO-8601 UTC settlement replay timestamps.',
        'Pinned betting-win settlement replay timestamps in ISO-8601 UTC format.',
      );
    }
    if (settlementAcceptedAtMs <= executionPlan.decisionTimestampMs) {
      return blocked(
        'BACKTEST_LOOKAHEAD_SETTLEMENT_REPLAY',
        'Deterministic standard-binary backtesting rejects settlement replay evidence available at or before the decision timestamp.',
        'Pinned betting-win settlement replay evidence strictly after the backtest decision timestamp.',
      );
    }
  }

  return validateCompletionEvents(executionPlan);
}

function validateCompletionEvents(executionPlan: NormalizedExecutionPlan): BoundaryResult<undefined> {
  for (const completionEvent of executionPlan.completionEvents) {
    if (completionEvent.legId.trim().length === 0) {
      return blocked(
        'BACKTEST_COMPLETION_EVENT_LEG_ID_MISSING',
        'Deterministic standard-binary backtesting requires a non-empty legId for every completion event.',
        'Completion replay events with stable leg ids.',
      );
    }
    if (!isIsoTimestamp(completionEvent.occurredAt)) {
      return blocked(
        'BACKTEST_COMPLETION_EVENT_TIMESTAMP_INVALID',
        'Deterministic standard-binary backtesting requires ISO-8601 UTC timestamps for every completion event.',
        'Completion replay events with ISO-8601 UTC timestamps.',
      );
    }
    if (!NON_ATOMIC_COMPLETION_EVENT_TYPES.includes(completionEvent.type)) {
      return blocked(
        'BACKTEST_COMPLETION_EVENT_TYPE_INVALID',
        'Deterministic standard-binary backtesting requires supported non-atomic completion event types.',
        'Completion replay events using reserve, fill, reject, expire, or rollback types.',
      );
    }
    if (Date.parse(completionEvent.occurredAt) < executionPlan.decisionTimestampMs) {
      return blocked(
        'BACKTEST_COMPLETION_EVENT_BEFORE_DECISION',
        'Deterministic standard-binary backtesting rejects completion events that occur before the decision timestamp.',
        'Completion replay events occurring at or after the backtest decision timestamp.',
      );
    }
  }

  return accepted(undefined);
}

function validateCompletionEventWindow(
  executionPlan: NormalizedExecutionPlan,
  settlementReplayAcceptedAt: IsoTimestamp,
): BoundaryResult<undefined> {
  const settlementReplayAcceptedAtMs = Date.parse(settlementReplayAcceptedAt);
  if (!Number.isFinite(settlementReplayAcceptedAtMs)) {
    return blocked(
      'BACKTEST_SETTLEMENT_TIMESTAMP_INVALID',
      'Deterministic standard-binary backtesting requires ISO-8601 UTC settlement replay timestamps.',
      'Pinned betting-win settlement replay timestamps in ISO-8601 UTC format.',
    );
  }

  for (const completionEvent of executionPlan.completionEvents) {
    if (Date.parse(completionEvent.occurredAt) >= settlementReplayAcceptedAtMs) {
      return blocked(
        'BACKTEST_COMPLETION_EVENT_AFTER_SETTLEMENT',
        'Deterministic standard-binary backtesting rejects completion events that occur at or after the final settlement replay timestamp.',
        'Completion replay events strictly earlier than the final settlement replay timestamp.',
      );
    }
  }

  return accepted(undefined);
}

function createAcceptedCandidateResult(
  candidateId: string,
  canonicalMarketId: string,
  executionPlan: NormalizedExecutionPlan,
  stakeVector: StakeVectorSolution,
  completionSimulation: NonAtomicCompletionSimulation,
  reconciliation: NonAtomicSettlementReplayReconciliation,
): StandardBinaryBacktestAcceptedCandidateResult {
  const result: StandardBinaryBacktestAcceptedCandidateResult = {
    ok: true,
    candidateId,
    canonicalMarketId,
    decisionTimestamp: executionPlan.decisionTimestamp,
    maxQuoteAgeMs: executionPlan.maxQuoteAgeMs,
    manualKill: executionPlan.manualKill,
    completionEventCount: executionPlan.completionEvents.length,
    completionGroupState: reconciliation.completionGroupState,
    stakeVector: freezeStakeVector(stakeVector),
    settlement: freezeSettlement(reconciliation.settlement),
    settledNetMinor: reconciliation.settledNetMinor,
    replayCount: reconciliation.replayCount,
    uniqueReplayCount: reconciliation.uniqueReplayCount,
    correctionCount: reconciliation.correctionCount,
    finalityProgressionCount: reconciliation.finalityProgressionCount,
    filledLegIds: Object.freeze([...reconciliation.filledLegIds]),
    excludedLegIds: Object.freeze([...reconciliation.excludedLegIds]),
  };

  if (completionSimulation.residualExposure !== undefined) {
    return Object.freeze({
      ...result,
      residualExposure: freezeResidualExposure(completionSimulation.residualExposure),
    });
  }

  return Object.freeze(result);
}

function createBlockedCandidateResult(
  candidateId: string,
  canonicalMarketId: string,
  blockers: readonly Blocker[],
): StandardBinaryBacktestBlockedCandidateResult {
  return Object.freeze({
    ok: false,
    candidateId,
    canonicalMarketId,
    blockers: Object.freeze(blockers.map((blocker) => Object.freeze({ ...blocker }))),
  });
}

function toRunHashMaterial(
  bundle: BettingWinExportBundle,
  sourceRecordsHash: string,
  executionPlans: readonly NormalizedExecutionPlan[],
  candidateResults: readonly StandardBinaryBacktestCandidateResult[],
): unknown {
  return Object.freeze({
    runKind: 'deterministic_standard_binary_backtest',
    sourceManifestHash: bundle.reference.manifestHash,
    sourceContractVersion: bundle.reference.contractVersion,
    sourceBundleKind: bundle.bundleKind,
    exportedAt: bundle.exportedAt,
    sourceRecordsHash,
    executionPlans: Object.freeze(
      executionPlans.map((executionPlan) =>
        Object.freeze({
          canonicalMarketId: executionPlan.canonicalMarketId,
          decisionTimestamp: executionPlan.decisionTimestamp,
          maxQuoteAgeMs: executionPlan.maxQuoteAgeMs,
          manualKill: executionPlan.manualKill,
          completionEvents: Object.freeze(
            executionPlan.completionEvents.map((completionEvent) => Object.freeze({
              legId: completionEvent.legId,
              type: completionEvent.type,
              occurredAt: completionEvent.occurredAt,
              stakeMinor: completionEvent.stakeMinor,
            })),
          ),
        }),
      ),
    ),
    candidateResults: Object.freeze(candidateResults.map((candidateResult) => toHashableCandidateResult(candidateResult))),
  });
}

function toHashableCandidateResult(candidateResult: StandardBinaryBacktestCandidateResult): unknown {
  if (!candidateResult.ok) {
    return Object.freeze({
      ok: false,
      candidateId: candidateResult.candidateId,
      canonicalMarketId: candidateResult.canonicalMarketId,
      blockers: Object.freeze(
        candidateResult.blockers.map((blocker) => Object.freeze({
          code: blocker.code,
          message: blocker.message,
          evidenceRequired: blocker.evidenceRequired,
        })),
      ),
    });
  }

  const hashableCandidateResult = {
    ok: true,
    candidateId: candidateResult.candidateId,
    canonicalMarketId: candidateResult.canonicalMarketId,
    decisionTimestamp: candidateResult.decisionTimestamp,
    maxQuoteAgeMs: candidateResult.maxQuoteAgeMs,
    manualKill: candidateResult.manualKill,
    completionEventCount: candidateResult.completionEventCount,
    completionGroupState: candidateResult.completionGroupState,
    stakeVector: freezeStakeVector(candidateResult.stakeVector),
    settlement: freezeSettlement(candidateResult.settlement),
    settledNetMinor: candidateResult.settledNetMinor,
    replayCount: candidateResult.replayCount,
    uniqueReplayCount: candidateResult.uniqueReplayCount,
    correctionCount: candidateResult.correctionCount,
    finalityProgressionCount: candidateResult.finalityProgressionCount,
    filledLegIds: Object.freeze([...candidateResult.filledLegIds]),
    excludedLegIds: Object.freeze([...candidateResult.excludedLegIds]),
  };

  if (candidateResult.residualExposure !== undefined) {
    return Object.freeze({
      ...hashableCandidateResult,
      residualExposure: freezeResidualExposure(candidateResult.residualExposure),
    });
  }

  return Object.freeze(hashableCandidateResult);
}

function computeDeterministicRunHash(hashMaterial: unknown): BoundaryResult<string> {
  try {
    const primarySerializedHashMaterial = stableJsonCompact(hashMaterial);
    const secondarySerializedHashMaterial = stableJsonCompact(cloneHashableValue(hashMaterial));
    const primaryRunHash = sha256Hex(primarySerializedHashMaterial);
    const secondaryRunHash = sha256Hex(secondarySerializedHashMaterial);
    if (primaryRunHash !== secondaryRunHash) {
      return blocked(
        'BACKTEST_RUN_HASH_NON_DETERMINISTIC',
        'Deterministic standard-binary backtesting rejected a non-deterministic run-hash materialization.',
        'Deterministic canonical run-hash materialization for the pinned backtest input and result set.',
      );
    }
    return accepted(primaryRunHash);
  } catch {
    return blocked(
      'BACKTEST_RUN_HASH_SERIALIZATION_INVALID',
      'Deterministic standard-binary backtesting could not serialize the run-hash material using the canonical fixed-point serializer.',
      'Canonical fixed-point run-hash material compatible with deterministic backtest serialization.',
    );
  }
}

function freezeStakeVector(stakeVector: StakeVectorSolution): StakeVectorSolution {
  return Object.freeze({
    stakes: Object.freeze(stakeVector.stakes.map((stake) => Object.freeze({ ...stake }))),
    scenarioNets: Object.freeze(stakeVector.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
    worstCaseNetMinor: stakeVector.worstCaseNetMinor,
  });
}

function freezeSettlement(settlement: ConsumedSettlementReplay): ConsumedSettlementReplay {
  return Object.freeze({ ...settlement });
}

function freezeResidualExposure(residualExposure: NonAtomicResidualExposureAnalysis): NonAtomicResidualExposureAnalysis {
  return Object.freeze({
    groupState: 'group_incomplete',
    exposedLegIds: Object.freeze([...residualExposure.exposedLegIds]),
    excludedLegIds: Object.freeze([...residualExposure.excludedLegIds]),
    scenarioNets: Object.freeze(residualExposure.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
    worstCaseNetMinor: residualExposure.worstCaseNetMinor,
    worstCaseScenarioId: residualExposure.worstCaseScenarioId,
  });
}

function cloneCompletionEvent(event: NonAtomicCompletionEvent): NonAtomicCompletionEvent {
  const clonedEvent = {
    legId: event.legId,
    type: event.type,
    occurredAt: event.occurredAt,
  };

  if (event.stakeMinor !== undefined) {
    return Object.freeze({
      ...clonedEvent,
      stakeMinor: event.stakeMinor,
    });
  }

  return Object.freeze(clonedEvent);
}

function cloneHashableValue(value: unknown): unknown {
  if (typeof value === 'bigint' || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => cloneHashableValue(entry)));
  }
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const clone: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      clone[key] = cloneHashableValue(source[key]);
    }
    return Object.freeze(clone);
  }

  throw new Error('Unsupported run-hash value.');
}

function stableJsonCompact(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Non-finite number in deterministic backtest hash material.');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'bigint') {
    return JSON.stringify(value.toString());
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonCompact(entry)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonCompact(record[key])}`)
      .join(',')}}`;
  }

  throw new Error('Unsupported deterministic backtest hash material.');
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function toSingleBlocker(code: string, message: string, evidenceRequired: string): readonly Blocker[] {
  return Object.freeze([Object.freeze({ code, message, evidenceRequired })]);
}

function hashCanonicalResourceRecords(records: readonly BettingWinResourceRecord[]): string {
  const serializedRecords = records
    .map((record) => stableJsonCompact(toHashableResourceRecord(record)))
    .sort();
  return sha256Hex(`[${serializedRecords.join(',')}]`);
}

function toHashableResourceRecord(record: BettingWinResourceRecord): unknown {
  switch (record.recordType) {
    case 'identity':
      return Object.freeze({
        recordType: 'identity',
        canonicalEventId: record.canonicalEventId,
        canonicalMarketId: record.canonicalMarketId,
        providerMarketId: record.providerMarketId,
        providerGeneration: record.providerGeneration,
      });
    case 'rules':
      return Object.freeze({
        recordType: 'rules',
        canonicalMarketId: record.canonicalMarketId,
        ruleProfileId: record.ruleProfileId,
        resultSourceId: record.resultSourceId,
        finalityPolicyId: record.finalityPolicyId,
      });
    case 'quotes':
      return Object.freeze({
        recordType: 'quotes',
        canonicalMarketId: record.canonicalMarketId,
        outcome: record.outcome,
        quoteSourceManifestHash: record.quoteSourceManifestHash,
        minStakeMinor: record.minStakeMinor,
        feeMinor: record.feeMinor,
        costMinor: record.costMinor,
        evidence: Object.freeze({
          evidenceId: record.evidence.evidenceId,
          observedAt: record.evidence.observedAt,
          priceMinor: record.evidence.priceMinor,
          availableSizeMinor: record.evidence.availableSizeMinor,
          currency: record.evidence.currency,
        }),
      });
    case 'settlement':
      return Object.freeze({
        recordType: 'settlement',
        canonicalMarketId: record.canonicalMarketId,
        ruleProfileId: record.ruleProfileId,
        resultSourceId: record.resultSourceId,
        finalityPolicyId: record.finalityPolicyId,
        finalityAuthorityId: record.finalityAuthorityId,
        replayManifestHash: record.replayManifestHash,
        replayAcceptedAt: record.replayAcceptedAt,
        acceptanceStatus: record.acceptanceStatus,
        finalOutcome: record.finalOutcome,
      });
  }
}

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsedValue = new Date(value);
  return !Number.isNaN(parsedValue.valueOf()) && parsedValue.toISOString() === value;
}

function isSettlementRecord(record: BettingWinResourceRecord): record is BettingWinSettlementRecord {
  return record.recordType === 'settlement';
}
