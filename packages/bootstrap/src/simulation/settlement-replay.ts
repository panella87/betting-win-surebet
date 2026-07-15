import type { BettingWinSettlementRecord } from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import type { ScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import { validateScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import type { StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
import { standardBinaryTerminalScenarios } from '../scenarios/terminal-scenario.js';
import type { StakeVectorSolution } from '../solver/stake-vector.js';
import type {
  NonAtomicCompletionSimulation,
  NonAtomicPaperGroupState,
  NonAtomicPaperLegSnapshot,
} from './non-atomic-completion.js';

const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/i;

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

export function consumeStandardBinarySettlementReplaySequence(
  completeSet: StandardBinaryCompleteSet,
  settlementRecords: readonly BettingWinSettlementRecord[],
): BoundaryResult<ResolvedSettlementReplaySequence> {
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
  const resolvedReplay = consumeStandardBinarySettlementReplaySequence(input.completeSet, input.settlementRecords);
  if (!resolvedReplay.ok) {
    return resolvedReplay;
  }

  const matrixTerms = validateMatrixTerms(input.stakeVector, input.matrix);
  if (!matrixTerms.ok) {
    return matrixTerms;
  }

  const completion = input.completionSimulation.completion;
  const legClassification = classifyCompletionLegs(completion.legs, matrixTerms.value);
  if (!legClassification.ok) {
    return legClassification;
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
  if (stakeVector.stakes.length === 0) {
    return blocked(
      'NON_ATOMIC_COMPLETION_STAKES_EMPTY',
      'Non-atomic completion simulation requires at least one solved stake-vector leg.',
      'Solved stake-vector legs for the completion group.',
    );
  }

  const plansByLegId = new Map<string, StakePlan>();
  for (const stake of stakeVector.stakes) {
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

  const scenarioIds = [...new Set(matrix.rows.map((row) => row.scenarioId))].sort();
  if (scenarioIds.length === 0) {
    return blocked(
      'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
      'Non-atomic completion simulation requires terminal scenario rows.',
      'Terminal scenario cash-flow rows aligned to the solved stake vector.',
    );
  }

  const contributionByLegAndScenarioId = new Map<string, ReadonlyMap<string, bigint>>();
  for (const [legId, plan] of plansByLegId) {
    const rowsForLeg = matrix.rows.filter((row) => row.legId === legId);
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
    if (plan.stakeQuantumMinor % referenceRow.stakeMinor !== 0n) {
      return blocked(
        'NON_ATOMIC_COMPLETION_MATRIX_QUANTUM_MISMATCH',
        'Non-atomic completion simulation requires solved stake quanta to be exact multiples of the scenario stake rows.',
        'Solved stake quanta aligned to the deterministic scenario cash-flow matrix.',
      );
    }

    const scaleFactor = plan.stakeQuantumMinor / referenceRow.stakeMinor;
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
      contributionsByScenarioId.set(
        row.scenarioId,
        (row.payoutMinor - row.stakeMinor - row.feeMinor - row.costMinor) * scaleFactor,
      );
    }

    contributionByLegAndScenarioId.set(legId, contributionsByScenarioId as ReadonlyMap<string, bigint>);
  }

  const matrixLegIds = new Set(matrix.rows.map((row) => row.legId));
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
