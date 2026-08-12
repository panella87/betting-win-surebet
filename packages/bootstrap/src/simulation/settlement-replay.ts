import type { BettingWinSettlementRecord } from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import type { ScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import { validateScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import type { StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
import { standardBinaryTerminalScenarios } from '../scenarios/terminal-scenario.js';
import type { StakeVectorSolution } from '../solver/stake-vector.js';
import {
  NON_ATOMIC_GROUP_STATES,
  type NonAtomicCompletionSimulation,
  type NonAtomicPaperGroupState,
  type NonAtomicPaperLegSnapshot,
  type NonAtomicResidualExposureAnalysis,
} from './non-atomic-completion.js';

const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export interface ConsumedSettlementReplay {
  readonly canonicalMarketId: string;
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
  readonly finalityAuthorityId: string;
  readonly replayManifestHash: string;
  readonly replayAcceptedAt: string;
  readonly scenarioId: string;
  readonly finalOutcome: 'yes' | 'no';
}

export interface ResolvedSettlementReplaySequence {
  readonly settlement: ConsumedSettlementReplay;
  readonly replayCount: number;
  readonly uniqueReplayCount: number;
  readonly correctionCount: number;
  readonly finalityProgressionCount: number;
}

export interface NonAtomicSettlementReplayReconciliation {
  readonly settlement: ConsumedSettlementReplay;
  readonly replayCount: number;
  readonly uniqueReplayCount: number;
  readonly correctionCount: number;
  readonly finalityProgressionCount: number;
  readonly completionGroupState: NonAtomicPaperGroupState;
  readonly settledNetMinor: bigint;
  readonly filledLegIds: readonly string[];
  readonly excludedLegIds: readonly string[];
}

export interface NonAtomicSettlementReplayReconciliationInput {
  readonly completeSet: StandardBinaryCompleteSet;
  readonly settlementRecords: readonly BettingWinSettlementRecord[];
  readonly completionSimulation: NonAtomicCompletionSimulation;
  readonly stakeVector: StakeVectorSolution;
  readonly matrix: ScenarioCashflowMatrix;
}

interface StakePlan {
  readonly legId: string;
  readonly stakeQuantumMinor: bigint;
  readonly unitCount: bigint;
  readonly stakeMinor: bigint;
}

interface MatrixTerms {
  readonly scenarioIds: readonly string[];
  readonly plansByLegId: ReadonlyMap<string, StakePlan>;
  readonly contributionByLegAndScenarioId: ReadonlyMap<string, ReadonlyMap<string, bigint>>;
}

export function consumeStandardBinarySettlementReplay(
  completeSet: StandardBinaryCompleteSet,
  settlementRecord: BettingWinSettlementRecord,
): BoundaryResult<ConsumedSettlementReplay> {
  const completeSetValidation = validateSettlementReplayCompleteSet(completeSet);
  if (!completeSetValidation.ok) {
    return completeSetValidation;
  }
  const settlementRecordValidation = validateSettlementReplayRecordShape(settlementRecord);
  if (!settlementRecordValidation.ok) {
    return settlementRecordValidation;
  }

  if (settlementRecord.canonicalMarketId !== completeSet.canonicalMarketId) {
    return blocked(
      'SETTLEMENT_REPLAY_MARKET_IDENTITY_MISMATCH',
      'Settlement replay consumption requires the canonical market identity to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set market identity.',
    );
  }
  if (settlementRecord.ruleProfileId !== completeSet.ruleProfileId) {
    return blocked(
      'SETTLEMENT_REPLAY_RULE_PROFILE_MISMATCH',
      'Settlement replay consumption requires the rule profile to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set rule profile.',
    );
  }
  if (settlementRecord.resultSourceId !== completeSet.resultSourceId) {
    return blocked(
      'SETTLEMENT_REPLAY_RESULT_SOURCE_MISMATCH',
      'Settlement replay consumption requires the result source to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set result source.',
    );
  }
  if (settlementRecord.finalityPolicyId !== completeSet.finalityPolicyId) {
    return blocked(
      'SETTLEMENT_REPLAY_FINALITY_POLICY_MISMATCH',
      'Settlement replay consumption requires the finality policy to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set finality policy.',
    );
  }
  if (settlementRecord.acceptanceStatus !== 'accepted') {
    return blocked(
      'SETTLEMENT_REPLAY_ACCEPTANCE_STATUS_INVALID',
      'Settlement replay consumption requires an accepted local settlement replay fixture.',
      'Accepted local settlement replay fixture.',
    );
  }
  if (settlementRecord.finalityAuthorityId.trim().length === 0) {
    return blocked(
      'SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISSING',
      'Settlement replay consumption requires a finality authority id.',
      'Accepted local settlement replay finality authority.',
    );
  }
  if (!MANIFEST_HASH_REGEX.test(settlementRecord.replayManifestHash)) {
    return blocked(
      'SETTLEMENT_REPLAY_MANIFEST_HASH_INVALID',
      'Settlement replay consumption requires a 64-character hexadecimal replay manifest hash.',
      'Accepted local settlement replay manifest hash.',
    );
  }
  if (!isIsoTimestamp(settlementRecord.replayAcceptedAt)) {
    return blocked(
      'SETTLEMENT_REPLAY_ACCEPTED_AT_INVALID',
      'Settlement replay consumption requires ISO-8601 UTC replay acceptance timestamps.',
      'Accepted local settlement replayAcceptedAt timestamp in ISO-8601 UTC form.',
    );
  }

  const matchingScenario = standardBinaryTerminalScenarios().find(
    (scenario) =>
      scenario.winningOutcome === settlementRecord.finalOutcome && completeSet.scenarioIds.includes(scenario.scenarioId),
  );
  if (!matchingScenario) {
    return blocked(
      'SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
      'Settlement replay consumption requires a terminal scenario that matches the accepted final outcome.',
      'Validated standard-binary terminal scenarios for the complete-set.',
    );
  }

  return accepted(
    Object.freeze({
      canonicalMarketId: settlementRecord.canonicalMarketId,
      ruleProfileId: settlementRecord.ruleProfileId,
      resultSourceId: settlementRecord.resultSourceId,
      finalityPolicyId: settlementRecord.finalityPolicyId,
      finalityAuthorityId: settlementRecord.finalityAuthorityId,
      replayManifestHash: settlementRecord.replayManifestHash,
      replayAcceptedAt: settlementRecord.replayAcceptedAt,
      scenarioId: matchingScenario.scenarioId,
      finalOutcome: settlementRecord.finalOutcome,
    }),
  );
}

function validateSettlementReplayCompleteSet(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<undefined> {
  if (
    typeof completeSet !== 'object'
    || completeSet === null
    || Array.isArray(completeSet)
    || typeof completeSet.canonicalMarketId !== 'string'
    || typeof completeSet.ruleProfileId !== 'string'
    || typeof completeSet.resultSourceId !== 'string'
    || typeof completeSet.finalityPolicyId !== 'string'
    || !Array.isArray(completeSet.scenarioIds)
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETE_SET_INVALID',
      'Settlement replay consumption requires a structured standard-binary complete set.',
      'Structured standard-binary complete set with market, rule, result, finality and scenario evidence.',
    );
  }
  for (const scenarioId of completeSet.scenarioIds) {
    if (typeof scenarioId !== 'string') {
      return blocked(
        'SETTLEMENT_REPLAY_COMPLETE_SET_INVALID',
        'Settlement replay consumption requires complete-set scenario ids as strings.',
        'Structured standard-binary complete set with string scenario ids.',
      );
    }
  }
  if (
    completeSet.canonicalMarketId.trim().length === 0
    || completeSet.ruleProfileId.trim().length === 0
    || completeSet.resultSourceId.trim().length === 0
    || completeSet.finalityPolicyId.trim().length === 0
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETE_SET_IDENTITY_MISSING',
      'Settlement replay consumption requires non-empty complete-set market, rule, result and finality evidence.',
      'Non-empty standard-binary complete-set identity and finality fields.',
    );
  }
  const scenarioCoverage = validateStandardBinarySettlementReplayScenarioIds(completeSet.scenarioIds);
  if (!scenarioCoverage.ok) {
    return scenarioCoverage;
  }
  return accepted(undefined);
}

function validateSettlementReplayRecordShape(
  settlementRecord: BettingWinSettlementRecord,
): BoundaryResult<undefined> {
  if (
    typeof settlementRecord !== 'object'
    || settlementRecord === null
    || Array.isArray(settlementRecord)
    || typeof settlementRecord.canonicalMarketId !== 'string'
    || typeof settlementRecord.ruleProfileId !== 'string'
    || typeof settlementRecord.resultSourceId !== 'string'
    || typeof settlementRecord.finalityPolicyId !== 'string'
    || typeof settlementRecord.acceptanceStatus !== 'string'
    || typeof settlementRecord.finalityAuthorityId !== 'string'
    || typeof settlementRecord.replayManifestHash !== 'string'
    || typeof settlementRecord.replayAcceptedAt !== 'string'
    || typeof settlementRecord.finalOutcome !== 'string'
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_RECORD_INVALID',
      'Settlement replay consumption requires a structured settlement replay record.',
      'Structured accepted local settlement replay fixture record.',
    );
  }
  if (
    settlementRecord.canonicalMarketId.trim().length === 0
    || settlementRecord.ruleProfileId.trim().length === 0
    || settlementRecord.resultSourceId.trim().length === 0
    || settlementRecord.finalityPolicyId.trim().length === 0
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_RECORD_IDENTITY_MISSING',
      'Settlement replay consumption requires non-empty settlement replay market, rule, result and finality evidence.',
      'Non-empty accepted settlement replay identity and finality fields.',
    );
  }
  return accepted(undefined);
}

function validateStandardBinarySettlementReplayScenarioIds(
  scenarioIds: readonly string[],
): BoundaryResult<undefined> {
  const expectedScenarioIds = standardBinaryTerminalScenarios()
    .map((scenario) => scenario.scenarioId)
    .sort();
  const seenScenarioIds = new Set<string>();
  for (const scenarioId of scenarioIds) {
    if (
      scenarioId.trim().length === 0
      || seenScenarioIds.has(scenarioId)
      || !expectedScenarioIds.includes(scenarioId)
    ) {
      return blocked(
        'SETTLEMENT_REPLAY_SCENARIO_COVERAGE_INVALID',
        'Settlement replay consumption requires complete and unique standard-binary terminal scenario coverage.',
        'Exact yes_wins and no_wins standard-binary scenario ids.',
      );
    }
    seenScenarioIds.add(scenarioId);
  }

  const actualScenarioIds = [...seenScenarioIds].sort();
  if (!sameStringList(actualScenarioIds, expectedScenarioIds)) {
    return blocked(
      'SETTLEMENT_REPLAY_SCENARIO_COVERAGE_INVALID',
      'Settlement replay consumption requires complete and unique standard-binary terminal scenario coverage.',
      'Exact yes_wins and no_wins standard-binary scenario ids.',
    );
  }
  return accepted(undefined);
}

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function consumeStandardBinarySettlementReplaySequence(
  completeSet: StandardBinaryCompleteSet,
  settlementRecords: readonly BettingWinSettlementRecord[],
): BoundaryResult<ResolvedSettlementReplaySequence> {
  if (!Array.isArray(settlementRecords)) {
    return blocked(
      'SETTLEMENT_REPLAY_RECORDS_INVALID',
      'Settlement replay consumption requires settlement records as an array.',
      'Array of accepted local settlement replay fixture records.',
    );
  }
  if (settlementRecords.length === 0) {
    return blocked(
      'SETTLEMENT_REPLAY_MISSING',
      'Settlement replay consumption requires at least one accepted local settlement replay fixture.',
      'Accepted local settlement replay fixture.',
    );
  }

  const uniqueReplaysByManifestHash = new Map<string, ConsumedSettlementReplay>();
  for (const settlementRecord of settlementRecords) {
    const consumedReplay = consumeStandardBinarySettlementReplay(completeSet, settlementRecord);
    if (!consumedReplay.ok) {
      return consumedReplay;
    }

    const existingReplay = uniqueReplaysByManifestHash.get(consumedReplay.value.replayManifestHash);
    if (existingReplay !== undefined && !sameConsumedReplay(existingReplay, consumedReplay.value)) {
      return blocked(
        'SETTLEMENT_REPLAY_IDEMPOTENCY_MISMATCH',
        'Settlement replay consumption requires each replay manifest hash to resolve to exactly one accepted settlement payload.',
        'Idempotent accepted settlement replay records keyed by replay manifest hash.',
      );
    }

    uniqueReplaysByManifestHash.set(consumedReplay.value.replayManifestHash, consumedReplay.value);
  }

  const uniqueReplays = [...uniqueReplaysByManifestHash.values()]
    .sort((left, right) => {
      const acceptedAtOrder = left.replayAcceptedAt.localeCompare(right.replayAcceptedAt);
      if (acceptedAtOrder !== 0) {
        return acceptedAtOrder;
      }
      return left.replayManifestHash.localeCompare(right.replayManifestHash);
    });

  const firstReplay = uniqueReplays[0];
  if (firstReplay === undefined) {
    return blocked(
      'SETTLEMENT_REPLAY_MISSING',
      'Settlement replay consumption requires at least one accepted local settlement replay fixture.',
      'Accepted local settlement replay fixture.',
    );
  }

  let currentReplay = firstReplay;
  let correctionCount = 0;
  let finalityProgressionCount = 0;
  for (let index = 1; index < uniqueReplays.length; index += 1) {
    const replay = uniqueReplays[index];
    if (replay === undefined) {
      continue;
    }

    if (replay.finalityAuthorityId !== firstReplay.finalityAuthorityId) {
      return blocked(
        'SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISMATCH',
        'Settlement replay consumption requires one finality authority across accepted replay corrections.',
        'Accepted settlement replay records from one finality authority for the complete-set.',
      );
    }

    if (replay.replayAcceptedAt === currentReplay.replayAcceptedAt) {
      return blocked(
        'SETTLEMENT_REPLAY_CORRECTION_CONFLICT',
        'Settlement replay consumption requires a strict replay acceptance order for corrections and finality progression.',
        'Accepted settlement replay records with an unambiguous replayAcceptedAt order.',
      );
    }

    if (replay.scenarioId === currentReplay.scenarioId && replay.finalOutcome === currentReplay.finalOutcome) {
      finalityProgressionCount += 1;
    } else {
      correctionCount += 1;
    }
    currentReplay = replay;
  }

  return accepted(
    Object.freeze({
      settlement: currentReplay,
      replayCount: settlementRecords.length,
      uniqueReplayCount: uniqueReplays.length,
      correctionCount,
      finalityProgressionCount,
    }),
  );
}

export function reconcileNonAtomicSettlementReplay(
  input: NonAtomicSettlementReplayReconciliationInput,
): BoundaryResult<NonAtomicSettlementReplayReconciliation> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return blocked(
      'SETTLEMENT_REPLAY_INPUT_INVALID',
      'Settlement replay reconciliation requires structured reconciliation input.',
      'Structured non-atomic settlement replay reconciliation input.',
    );
  }
  if (typeof input.completionSimulation !== 'object' || input.completionSimulation === null || Array.isArray(input.completionSimulation)) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SIMULATION_INVALID',
      'Settlement replay reconciliation requires structured completion simulation evidence.',
      'Structured non-atomic completion simulation evidence.',
    );
  }
  const resolvedReplay = consumeStandardBinarySettlementReplaySequence(input.completeSet, input.settlementRecords);
  if (!resolvedReplay.ok) {
    return resolvedReplay;
  }

  const matrixTerms = validateMatrixTerms(input.stakeVector, input.matrix);
  if (!matrixTerms.ok) {
    return matrixTerms;
  }

  const completion = input.completionSimulation.completion;
  const completionAggregateValidation = validateSettlementCompletionAggregate(completion);
  if (!completionAggregateValidation.ok) {
    return completionAggregateValidation;
  }

  const completionLegSnapshots = validateSettlementCompletionLegSnapshots(completion.legs, matrixTerms.value);
  if (!completionLegSnapshots.ok) {
    return completionLegSnapshots;
  }

  const legClassification = classifyCompletionLegs(completion.legs, matrixTerms.value);
  if (!legClassification.ok) {
    return legClassification;
  }
  const expectedGroupState = deriveCompletionGroupState(completion.legs, completion.manualKill);
  if (completion.groupState !== expectedGroupState) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_GROUP_STATE_MISMATCH',
      'Settlement replay reconciliation requires aggregate completion group state to match leg snapshots.',
      'Non-atomic completion groupState derived from completion leg snapshots.',
    );
  }

  const settledNetMinor = sumScenarioNetForLiveFilledUnits(
    completion.legs,
    matrixTerms.value,
    resolvedReplay.value.settlement.scenarioId,
  );

  if (completion.groupState === 'group_incomplete') {
    const residualExposure = input.completionSimulation.residualExposure;
    if (residualExposure === undefined) {
      return blocked(
        'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_MISSING',
        'Settlement replay reconciliation requires residual exposure evidence for incomplete non-atomic groups.',
        'Residual exposure output from the validated non-atomic completion simulation.',
      );
    }

    const residualFreshness = validateResidualExposureFreshness(
      residualExposure,
      matrixTerms.value,
      completion.legs,
      legClassification.value,
    );
    if (!residualFreshness.ok) {
      return residualFreshness;
    }

    const settledScenario = residualExposure.scenarioNets.find(
      (scenarioNet) => scenarioNet.scenarioId === resolvedReplay.value.settlement.scenarioId,
    );
    if (settledScenario === undefined) {
      return blocked(
        'SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
        'Settlement replay reconciliation requires the accepted settlement scenario to stay inside the residual exposure scenario set.',
        'Residual exposure scenario coverage aligned to the accepted settlement replay.',
      );
    }
    if (settledScenario.netMinor !== settledNetMinor) {
      return blocked(
        'SETTLEMENT_REPLAY_RECONCILIATION_MISMATCH',
        'Settlement replay reconciliation requires the settled scenario net to match the residual exposure replay.',
        'Residual exposure scenario nets that match the settled non-atomic completion replay.',
      );
    }
  }

  return accepted(
    Object.freeze({
      settlement: resolvedReplay.value.settlement,
      replayCount: resolvedReplay.value.replayCount,
      uniqueReplayCount: resolvedReplay.value.uniqueReplayCount,
      correctionCount: resolvedReplay.value.correctionCount,
      finalityProgressionCount: resolvedReplay.value.finalityProgressionCount,
      completionGroupState: completion.groupState,
      settledNetMinor,
      filledLegIds: Object.freeze(legClassification.value.filledLegIds),
      excludedLegIds: Object.freeze(legClassification.value.excludedLegIds),
    }),
  );
}

function validateResidualExposureFreshness(
  residualExposure: NonAtomicResidualExposureAnalysis,
  matrixTerms: MatrixTerms,
  legs: readonly NonAtomicPaperLegSnapshot[],
  legClassification: { readonly filledLegIds: readonly string[]; readonly excludedLegIds: readonly string[] },
): BoundaryResult<undefined> {
  const residualExposureShape = validateSettlementResidualExposureEvidence(residualExposure);
  if (!residualExposureShape.ok) {
    return residualExposureShape;
  }
  if (residualExposure.groupState !== 'group_incomplete') {
    return blocked(
      'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
      'Settlement replay reconciliation requires residual exposure evidence for an incomplete non-atomic group.',
      'Fresh residual exposure evidence from the validated incomplete non-atomic completion simulation.',
    );
  }

  const expectedResidualExposure = buildExpectedResidualExposure(legs, matrixTerms, legClassification);
  if (!expectedResidualExposure.ok) {
    return expectedResidualExposure;
  }

  if (
    !sameStringList([...expectedResidualExposure.value.exposedLegIds].sort(), [...residualExposure.exposedLegIds].sort())
    || !sameStringList([...expectedResidualExposure.value.excludedLegIds].sort(), [...residualExposure.excludedLegIds].sort())
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
      'Settlement replay reconciliation requires residual exposure leg classification to match completion evidence.',
      'Fresh residual exposure exposed and excluded leg ids for the non-atomic completion simulation.',
    );
  }

  const expectedScenarios = expectedResidualExposure.value.scenarioNets;
  const residualScenarios = [...residualExposure.scenarioNets].sort((left, right) =>
    left.scenarioId.localeCompare(right.scenarioId));
  if (residualScenarios.length !== expectedScenarios.length) {
    return blocked(
      'SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
      'Settlement replay reconciliation requires residual exposure coverage for every terminal scenario.',
      'Complete residual exposure scenario nets aligned to the scenario cash-flow matrix.',
    );
  }

  for (let index = 0; index < expectedScenarios.length; index += 1) {
    const expectedScenario = expectedScenarios[index];
    const residualScenario = residualScenarios[index];
    if (expectedScenario === undefined || residualScenario === undefined) {
      return blocked(
        'SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
        'Settlement replay reconciliation requires residual exposure coverage for every terminal scenario.',
        'Complete residual exposure scenario nets aligned to the scenario cash-flow matrix.',
      );
    }
    if (residualScenario.scenarioId !== expectedScenario.scenarioId) {
      return blocked(
        'SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
        'Settlement replay reconciliation requires residual exposure coverage for every terminal scenario.',
        'Complete residual exposure scenario nets aligned to the scenario cash-flow matrix.',
      );
    }
    if (residualScenario.netMinor !== expectedScenario.netMinor) {
      return blocked(
        'SETTLEMENT_REPLAY_RECONCILIATION_MISMATCH',
        'Settlement replay reconciliation requires residual exposure scenario nets to match completion evidence.',
        'Fresh residual exposure scenario nets derived from the non-atomic completion simulation.',
      );
    }
  }

  if (
    residualExposure.worstCaseNetMinor !== expectedResidualExposure.value.worstCaseNetMinor
    || residualExposure.worstCaseScenarioId !== expectedResidualExposure.value.worstCaseScenarioId
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
      'Settlement replay reconciliation requires residual exposure worst-case evidence to match scenario nets.',
      'Fresh residual exposure worst-case scenario derived from residual scenario nets.',
    );
  }

  return accepted(undefined);
}

function validateSettlementResidualExposureEvidence(
  residualExposure: NonAtomicResidualExposureAnalysis,
): BoundaryResult<undefined> {
  if (
    typeof residualExposure !== 'object'
    || residualExposure === null
    || Array.isArray(residualExposure)
    || typeof residualExposure.groupState !== 'string'
    || !Array.isArray(residualExposure.exposedLegIds)
    || !Array.isArray(residualExposure.excludedLegIds)
    || !Array.isArray(residualExposure.scenarioNets)
    || typeof residualExposure.worstCaseNetMinor !== 'bigint'
    || typeof residualExposure.worstCaseScenarioId !== 'string'
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
      'Settlement replay reconciliation requires structured residual exposure evidence.',
      'Structured residual exposure output from the validated non-atomic completion simulation.',
    );
  }
  for (const legId of residualExposure.exposedLegIds) {
    if (typeof legId !== 'string') {
      return blocked(
        'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
        'Settlement replay reconciliation requires residual exposed leg ids as strings.',
        'Structured residual exposure exposed leg ids.',
      );
    }
  }
  for (const legId of residualExposure.excludedLegIds) {
    if (typeof legId !== 'string') {
      return blocked(
        'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
        'Settlement replay reconciliation requires residual excluded leg ids as strings.',
        'Structured residual exposure excluded leg ids.',
      );
    }
  }
  for (const scenarioNet of residualExposure.scenarioNets) {
    if (
      typeof scenarioNet !== 'object'
      || scenarioNet === null
      || Array.isArray(scenarioNet)
      || typeof scenarioNet.scenarioId !== 'string'
      || typeof scenarioNet.netMinor !== 'bigint'
    ) {
      return blocked(
        'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
        'Settlement replay reconciliation requires structured residual scenario net evidence.',
        'Structured residual exposure scenario nets.',
      );
    }
  }
  return accepted(undefined);
}

function buildExpectedResidualExposure(
  legs: readonly NonAtomicPaperLegSnapshot[],
  matrixTerms: MatrixTerms,
  legClassification: { readonly filledLegIds: readonly string[]; readonly excludedLegIds: readonly string[] },
): BoundaryResult<NonAtomicResidualExposureAnalysis> {
  const scenarioNets = Object.freeze(
    matrixTerms.scenarioIds.map((scenarioId) =>
      Object.freeze({
        scenarioId,
        netMinor: sumScenarioNetForLiveFilledUnits(legs, matrixTerms, scenarioId),
      }),
    ),
  );

  const firstScenarioNet = scenarioNets[0];
  if (firstScenarioNet === undefined) {
    return blocked(
      'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
      'Non-atomic residual exposure analysis requires terminal scenario rows.',
      'Terminal scenario cash-flow rows aligned to the solved stake vector.',
    );
  }

  let worstCaseScenarioId = firstScenarioNet.scenarioId;
  let worstCaseNetMinor = firstScenarioNet.netMinor;
  for (const scenarioNet of scenarioNets) {
    if (scenarioNet.netMinor < worstCaseNetMinor) {
      worstCaseNetMinor = scenarioNet.netMinor;
      worstCaseScenarioId = scenarioNet.scenarioId;
    }
  }

  return accepted(
    Object.freeze({
      groupState: 'group_incomplete',
      exposedLegIds: Object.freeze([...legClassification.filledLegIds]),
      excludedLegIds: Object.freeze([...legClassification.excludedLegIds]),
      scenarioNets,
      worstCaseNetMinor,
      worstCaseScenarioId,
    }),
  );
}

function sameStringList(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function sameConsumedReplay(left: ConsumedSettlementReplay, right: ConsumedSettlementReplay): boolean {
  return left.canonicalMarketId === right.canonicalMarketId
    && left.ruleProfileId === right.ruleProfileId
    && left.resultSourceId === right.resultSourceId
    && left.finalityPolicyId === right.finalityPolicyId
    && left.finalityAuthorityId === right.finalityAuthorityId
    && left.replayManifestHash === right.replayManifestHash
    && left.replayAcceptedAt === right.replayAcceptedAt
    && left.scenarioId === right.scenarioId
    && left.finalOutcome === right.finalOutcome;
}

function validateMatrixTerms(
  stakeVector: StakeVectorSolution,
  matrix: ScenarioCashflowMatrix,
): BoundaryResult<MatrixTerms> {
  if (typeof stakeVector !== 'object' || stakeVector === null || Array.isArray(stakeVector) || !Array.isArray(stakeVector.stakes)) {
    return blocked(
      'SETTLEMENT_REPLAY_STAKE_VECTOR_INVALID',
      'Settlement replay reconciliation requires a structured solved stake-vector.',
      'Structured solved stake-vector with solved leg stakes.',
    );
  }
  if (typeof matrix !== 'object' || matrix === null || Array.isArray(matrix) || !Array.isArray(matrix.rows)) {
    return blocked(
      'SETTLEMENT_REPLAY_MATRIX_INVALID',
      'Settlement replay reconciliation requires a structured scenario cash-flow matrix.',
      'Structured scenario cash-flow matrix with rows.',
    );
  }
  if (stakeVector.stakes.length === 0) {
    return blocked(
      'NON_ATOMIC_COMPLETION_STAKES_EMPTY',
      'Non-atomic completion simulation requires at least one solved stake-vector leg.',
      'Solved stake-vector legs for the completion group.',
    );
  }

  const plansByLegId = new Map<string, StakePlan>();
  for (const stake of stakeVector.stakes) {
    if (
      typeof stake !== 'object'
      || stake === null
      || Array.isArray(stake)
      || typeof stake.legId !== 'string'
      || typeof stake.unitCount !== 'bigint'
      || typeof stake.stakeQuantumMinor !== 'bigint'
      || typeof stake.stakeMinor !== 'bigint'
    ) {
      return blocked(
        'SETTLEMENT_REPLAY_STAKE_VECTOR_INVALID',
        'Settlement replay reconciliation requires structured solved stake-vector leg terms.',
        'Structured solved stake-vector legs with leg id, unit count, stake quantum and stake total.',
      );
    }
    if (stake.legId.trim().length === 0) {
      return blocked(
        'NON_ATOMIC_COMPLETION_LEG_ID_MISSING',
        'Non-atomic completion simulation requires a non-empty stake-vector leg id.',
        'Stable leg ids for each solved stake-vector leg.',
      );
    }
    if (plansByLegId.has(stake.legId)) {
      return blocked(
        'NON_ATOMIC_COMPLETION_LEG_DUPLICATE',
        'Non-atomic completion simulation requires exactly one solved stake-vector leg per leg id.',
        'Unique solved stake-vector leg ids for the completion group.',
      );
    }
    if (stake.unitCount <= 0n || stake.stakeQuantumMinor <= 0n || stake.stakeMinor <= 0n) {
      return blocked(
        'NON_ATOMIC_COMPLETION_STAKE_PLAN_INVALID',
        'Non-atomic completion simulation requires positive solved unit counts, stake quanta, and stake totals.',
        'Positive fixed-point solved stake-vector terms for each leg.',
      );
    }
    if (stake.unitCount * stake.stakeQuantumMinor !== stake.stakeMinor) {
      return blocked(
        'NON_ATOMIC_COMPLETION_STAKE_PLAN_INVALID',
        'Non-atomic completion simulation requires stakeMinor to equal unitCount multiplied by stakeQuantumMinor.',
        'Internally consistent solved stake-vector terms for each leg.',
      );
    }

    plansByLegId.set(
      stake.legId,
      Object.freeze({
        legId: stake.legId,
        stakeQuantumMinor: stake.stakeQuantumMinor,
        unitCount: stake.unitCount,
        stakeMinor: stake.stakeMinor,
      }),
    );
  }

  const matrixValidation = validateScenarioCashflowMatrix(matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }
  const matrixRows = matrixValidation.value.rows;

  const scenarioIds = [...new Set(matrixRows.map((row) => row.scenarioId))].sort();
  if (scenarioIds.length === 0) {
    return blocked(
      'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
      'Non-atomic completion simulation requires terminal scenario rows.',
      'Terminal scenario cash-flow rows aligned to the solved stake vector.',
    );
  }

  const contributionByLegAndScenarioId = new Map<string, ReadonlyMap<string, bigint>>();
  for (const [legId, plan] of plansByLegId) {
    const rowsForLeg = matrixRows.filter((row) => row.legId === legId);
    if (rowsForLeg.length !== scenarioIds.length) {
      return blocked(
        'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
        'Non-atomic completion simulation requires every solved leg to cover every terminal scenario exactly once.',
        'Complete terminal scenario cash-flow rows for each solved completion leg.',
      );
    }

    const uniqueScenarioIds = [...new Set(rowsForLeg.map((row) => row.scenarioId))].sort();
    for (let index = 0; index < scenarioIds.length; index += 1) {
      if (uniqueScenarioIds[index] !== scenarioIds[index]) {
        return blocked(
          'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
          'Non-atomic completion simulation requires every solved leg to cover every terminal scenario exactly once.',
          'Complete terminal scenario cash-flow rows for each solved completion leg.',
        );
      }
    }

    const referenceRow = rowsForLeg[0];
    if (referenceRow === undefined) {
      return blocked(
        'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
        'Non-atomic completion simulation requires terminal scenario rows.',
        'Terminal scenario cash-flow rows aligned to the solved stake vector.',
      );
    }
    if (referenceRow.stakeMinor <= 0n) {
      return blocked(
        'NON_ATOMIC_COMPLETION_MATRIX_STAKE_INVALID',
        'Non-atomic completion simulation requires positive scenario stake rows for each leg.',
        'Positive fixed-point stake rows for each completion leg.',
      );
    }
    const contributionsByScenarioId = new Map<string, bigint>();
    for (const row of rowsForLeg) {
      if (
        row.stakeMinor !== referenceRow.stakeMinor
        || row.feeMinor !== referenceRow.feeMinor
        || row.costMinor !== referenceRow.costMinor
      ) {
        return blocked(
          'NON_ATOMIC_COMPLETION_MATRIX_TERMS_INCONSISTENT',
          'Non-atomic completion simulation requires each leg to keep stake, fee, and cost terms consistent across terminal scenarios.',
          'Per-leg fixed-point stake, fee, and cost rows that only vary by winning payout.',
        );
      }
      const contribution = scaleMatrixContribution(
        row.payoutMinor - row.stakeMinor - row.feeMinor - row.costMinor,
        row.stakeMinor,
        plan,
      );
      if (!contribution.ok) {
        return contribution;
      }
      contributionsByScenarioId.set(
        row.scenarioId,
        contribution.value,
      );
    }

    contributionByLegAndScenarioId.set(legId, contributionsByScenarioId as ReadonlyMap<string, bigint>);
  }

  const matrixLegIds = new Set(matrixRows.map((row) => row.legId));
  for (const legId of matrixLegIds) {
    if (!plansByLegId.has(legId)) {
      return blocked(
        'NON_ATOMIC_COMPLETION_MATRIX_LEG_UNKNOWN',
        'Non-atomic completion simulation requires scenario rows to match the solved completion leg ids.',
        'Scenario cash-flow rows aligned to the solved completion leg ids.',
      );
    }
  }

  return accepted(
    Object.freeze({
      scenarioIds: Object.freeze(scenarioIds),
      plansByLegId,
      contributionByLegAndScenarioId,
    }),
  );
}

function scaleMatrixContribution(
  contributionMinor: bigint,
  matrixStakeMinor: bigint,
  plan: StakePlan,
): BoundaryResult<bigint> {
  const numerator = contributionMinor * plan.stakeQuantumMinor;
  if (numerator % matrixStakeMinor !== 0n) {
    return blocked(
      'NON_ATOMIC_COMPLETION_MATRIX_QUANTUM_MISMATCH',
      'Non-atomic completion simulation requires solved stake quanta to scale scenario cash-flow rows to integer minor units.',
      'Solved stake quanta with integral deterministic scenario cash-flow contributions.',
    );
  }

  return accepted(numerator / matrixStakeMinor);
}

function classifyCompletionLegs(
  legs: readonly NonAtomicPaperLegSnapshot[],
  matrixTerms: MatrixTerms,
): BoundaryResult<{ readonly filledLegIds: readonly string[]; readonly excludedLegIds: readonly string[] }> {
  const filledLegIds: string[] = [];
  const excludedLegIds: string[] = [];

  for (const leg of legs) {
    const plan = matrixTerms.plansByLegId.get(leg.legId);
    if (plan === undefined) {
      return blocked(
        'NON_ATOMIC_COMPLETION_LEG_UNKNOWN',
        'Settlement replay reconciliation requires completion legs to match the solved stake-vector leg ids.',
        'Completion legs aligned to the solved stake-vector leg ids.',
      );
    }
    if (leg.liveFilledStakeMinor > 0n && leg.liveFilledStakeMinor % plan.stakeQuantumMinor !== 0n) {
      return blocked(
        'NON_ATOMIC_COMPLETION_FILLED_STAKE_MISMATCH',
        'Non-atomic residual exposure analysis requires live filled stake to align to the solved stake quantum.',
        'Live filled stake amounts aligned to the deterministic solved stake quantum.',
      );
    }

    if (leg.liveFilledStakeMinor > 0n) {
      filledLegIds.push(leg.legId);
    } else {
      excludedLegIds.push(leg.legId);
    }
  }

  return accepted(
    Object.freeze({
      filledLegIds: Object.freeze(filledLegIds),
      excludedLegIds: Object.freeze(excludedLegIds),
    }),
  );
}

function validateSettlementCompletionAggregate(
  completion: NonAtomicCompletionSimulation['completion'],
): BoundaryResult<undefined> {
  if (typeof completion !== 'object' || completion === null || !Array.isArray(completion.legs)) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_AGGREGATE_INVALID',
      'Settlement replay reconciliation requires structured aggregate completion evidence.',
      'Structured non-atomic aggregate completion evidence with leg snapshots.',
    );
  }
  if (typeof completion.manualKill !== 'boolean') {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_AGGREGATE_INVALID',
      'Settlement replay reconciliation requires completion manualKill to be an explicit boolean.',
      'Explicit boolean manualKill evidence for the non-atomic completion group.',
    );
  }
  if (typeof completion.groupState !== 'string' || !isNonAtomicPaperGroupState(completion.groupState)) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_AGGREGATE_INVALID',
      'Settlement replay reconciliation requires a supported aggregate completion group state.',
      'Supported non-atomic completion groupState evidence.',
    );
  }
  return accepted(undefined);
}

function validateSettlementCompletionLegSnapshots(
  legs: readonly NonAtomicPaperLegSnapshot[],
  matrixTerms: MatrixTerms,
): BoundaryResult<undefined> {
  const seenLegIds = new Set<string>();
  for (const leg of legs) {
    const snapshotValidation = validateSettlementCompletionLegSnapshot(leg);
    if (!snapshotValidation.ok) {
      return snapshotValidation;
    }

    const plan = matrixTerms.plansByLegId.get(leg.legId);
    if (plan === undefined) {
      return blocked(
        'NON_ATOMIC_COMPLETION_LEG_UNKNOWN',
        'Settlement replay reconciliation requires completion legs to match the solved stake-vector leg ids.',
        'Completion legs aligned to the solved stake-vector leg ids.',
      );
    }
    if (seenLegIds.has(leg.legId)) {
      return blocked(
        'SETTLEMENT_REPLAY_COMPLETION_LEG_COVERAGE_MISMATCH',
        'Settlement replay reconciliation requires exactly one completion leg snapshot per solved stake-vector leg.',
        'Complete and unique completion leg snapshots aligned to solved stake-vector legs.',
      );
    }
    if (leg.plannedStakeMinor !== plan.stakeMinor) {
      return blocked(
        'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_STAKE_MISMATCH',
        'Settlement replay reconciliation requires completion planned stake to match the solved stake-vector leg.',
        'Completion planned stake aligned to the solved stake-vector leg.',
      );
    }
    seenLegIds.add(leg.legId);
  }

  if (seenLegIds.size !== matrixTerms.plansByLegId.size) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_LEG_COVERAGE_MISMATCH',
      'Settlement replay reconciliation requires exactly one completion leg snapshot per solved stake-vector leg.',
      'Complete and unique completion leg snapshots aligned to solved stake-vector legs.',
    );
  }

  return accepted(undefined);
}

function validateSettlementCompletionLegSnapshot(
  leg: NonAtomicPaperLegSnapshot,
): BoundaryResult<undefined> {
  if (typeof leg !== 'object' || leg === null) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_INVALID',
      'Settlement replay reconciliation requires completion leg snapshots to be structured objects.',
      'Structured non-atomic completion leg snapshot objects.',
    );
  }
  if (typeof leg.legId !== 'string' || leg.legId.trim().length === 0) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_INVALID',
      'Settlement replay reconciliation requires a stable non-empty completion leg id.',
      'Stable completion leg id for each non-atomic leg snapshot.',
    );
  }
  if (typeof leg.state !== 'string' || !isNonAtomicPaperLegState(leg.state)) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_INVALID',
      'Settlement replay reconciliation requires supported non-atomic completion leg states.',
      'Supported non-atomic completion leg state values.',
    );
  }
  if (typeof leg.updatedAt !== 'string' || !isIsoTimestamp(leg.updatedAt)) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_INVALID',
      'Settlement replay reconciliation requires ISO-8601 UTC completion leg timestamps.',
      'ISO-8601 UTC updatedAt timestamps for each non-atomic leg snapshot.',
    );
  }
  if (
    typeof leg.plannedStakeMinor !== 'bigint'
    || typeof leg.reservedStakeMinor !== 'bigint'
    || typeof leg.liveFilledStakeMinor !== 'bigint'
    || typeof leg.rolledBackStakeMinor !== 'bigint'
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_INVALID',
      'Settlement replay reconciliation requires integer minor-unit completion stake fields.',
      'Completion stake fields encoded as bigint integer minor units.',
    );
  }
  if (
    leg.plannedStakeMinor <= 0n
    || leg.reservedStakeMinor < 0n
    || leg.liveFilledStakeMinor < 0n
    || leg.rolledBackStakeMinor < 0n
  ) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_STAKE_INVALID',
      'Settlement replay reconciliation requires positive planned stake and non-negative completion stake fields.',
      'Positive planned stake and non-negative reserved, live-filled, and rolled-back stake evidence.',
    );
  }
  if (leg.liveFilledStakeMinor > leg.plannedStakeMinor || leg.reservedStakeMinor > leg.plannedStakeMinor) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_STAKE_INVALID',
      'Settlement replay reconciliation requires live and reserved stake to stay within planned stake.',
      'Completion live and reserved stake bounded by planned stake.',
    );
  }
  if (leg.liveFilledStakeMinor + leg.reservedStakeMinor > leg.plannedStakeMinor) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_STAKE_INVALID',
      'Settlement replay reconciliation requires current live and reserved stake not to exceed planned stake.',
      'Completion current stake exposure bounded by planned stake.',
    );
  }
  if (!hasStateAlignedCompletionStake(leg)) {
    return blocked(
      'SETTLEMENT_REPLAY_COMPLETION_SNAPSHOT_STATE_STAKE_MISMATCH',
      'Settlement replay reconciliation requires completion leg state to match stake evidence.',
      'State-aligned non-atomic completion leg stake evidence.',
    );
  }

  return accepted(undefined);
}

function isNonAtomicPaperLegState(value: string): boolean {
  return value === 'leg_open'
    || value === 'leg_reserved'
    || value === 'leg_partial'
    || value === 'leg_filled'
    || value === 'leg_rejected'
    || value === 'leg_expired'
    || value === 'leg_rolled_back';
}

function isNonAtomicPaperGroupState(value: string): value is NonAtomicPaperGroupState {
  return NON_ATOMIC_GROUP_STATES.includes(value as NonAtomicPaperGroupState);
}

function hasStateAlignedCompletionStake(leg: NonAtomicPaperLegSnapshot): boolean {
  if (leg.state === 'leg_open') {
    return leg.reservedStakeMinor === 0n && leg.liveFilledStakeMinor === 0n && leg.rolledBackStakeMinor === 0n;
  }
  if (leg.state === 'leg_reserved') {
    return leg.reservedStakeMinor > 0n && leg.liveFilledStakeMinor === 0n;
  }
  if (leg.state === 'leg_partial') {
    return leg.liveFilledStakeMinor > 0n && leg.liveFilledStakeMinor < leg.plannedStakeMinor;
  }
  if (leg.state === 'leg_filled') {
    return leg.reservedStakeMinor === 0n && leg.liveFilledStakeMinor === leg.plannedStakeMinor;
  }
  if (leg.state === 'leg_rejected' || leg.state === 'leg_expired') {
    return leg.reservedStakeMinor === 0n && leg.liveFilledStakeMinor === 0n;
  }
  return leg.reservedStakeMinor === 0n && leg.liveFilledStakeMinor === 0n && leg.rolledBackStakeMinor > 0n;
}

function deriveCompletionGroupState(
  legs: readonly NonAtomicPaperLegSnapshot[],
  manualKill: boolean,
): NonAtomicPaperGroupState {
  if (manualKill) {
    return 'group_killed';
  }
  if (legs.every((leg) => leg.state === 'leg_open')) {
    return 'group_open';
  }
  if (legs.every((leg) => leg.state === 'leg_open' || leg.state === 'leg_reserved')) {
    return 'group_reserved';
  }
  if (legs.every((leg) => leg.state === 'leg_filled')) {
    return 'group_complete';
  }
  return 'group_incomplete';
}

function sumScenarioNetForLiveFilledUnits(
  legs: readonly NonAtomicPaperLegSnapshot[],
  matrixTerms: MatrixTerms,
  scenarioId: string,
): bigint {
  let netMinor = 0n;
  for (const leg of legs) {
    if (leg.liveFilledStakeMinor === 0n) {
      continue;
    }
    const plan = matrixTerms.plansByLegId.get(leg.legId);
    const contributionsByScenarioId = matrixTerms.contributionByLegAndScenarioId.get(leg.legId);
    if (plan === undefined || contributionsByScenarioId === undefined) {
      continue;
    }
    const contribution = contributionsByScenarioId.get(scenarioId);
    if (contribution === undefined) {
      continue;
    }
    const liveUnits = leg.liveFilledStakeMinor / plan.stakeQuantumMinor;
    netMinor += contribution * liveUnits;
  }
  return netMinor;
}
