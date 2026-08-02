import {
  accepted,
  blocked,
  type BoundaryResult,
  type IsoTimestamp,
} from '../contracts/local-types.js';
import {
  validateB1ScenarioCashflowMatrix,
  type B1ScenarioCashflowMatrix,
  type B1ScenarioCashflowRow,
} from '../scenarios/b1-scenario-cashflow.js';
import type { B1FillabilitySimulation, B1FillabilityLegSnapshot } from './b1-leg-completion.js';
import {
  validateB1VoidRuleReplay,
  type B1VoidRuleReplayAnalysis,
  type B1VoidRuleReplayRecord,
} from './b1-void-rule-replay.js';

const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export interface B1SettlementReplayRecord extends B1VoidRuleReplayRecord {
  readonly replayManifestHash: string;
  readonly replayAcceptedAtUtc: IsoTimestamp;
  readonly finalityAuthorityId: string;
  readonly finalOutcomeSelectionEquivalenceKey: string;
}

export interface B1SettlementReplayAnalysisInput {
  readonly candidateId: string;
  readonly matrix: B1ScenarioCashflowMatrix;
  readonly fillabilitySimulation: B1FillabilitySimulation;
  readonly settlementRecords: readonly B1SettlementReplayRecord[];
}

export interface B1SettlementReplayAnalysis {
  readonly replayKind: 'deterministic_b1_settlement_replay';
  readonly candidateId: string;
  readonly finalOutcomeSelectionEquivalenceKey: string;
  readonly finalScenarioId: string;
  readonly settledNetMinor: bigint;
  readonly falsePositive: boolean;
  readonly falsePositiveReason: 'none' | 'settled_net_non_positive';
  readonly replayCount: number;
  readonly uniqueReplayCount: number;
  readonly correctionCount: number;
  readonly finalityProgressionCount: number;
  readonly voidRuleReplay: B1VoidRuleReplayAnalysis;
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

interface B1NormalizedSettlementReplay {
  readonly replayManifestHash: string;
  readonly replayAcceptedAtUtc: IsoTimestamp;
  readonly finalityAuthorityId: string;
  readonly finalOutcomeSelectionEquivalenceKey: string;
}

export function analyzeB1SettlementReplay(
  input: B1SettlementReplayAnalysisInput,
): BoundaryResult<B1SettlementReplayAnalysis> {
  if (input.candidateId.trim().length === 0) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_CANDIDATE_ID_MISSING',
      'B1 settlement replay requires a stable non-empty candidate id.',
      'Stable B1 settlement replay candidate id.',
    );
  }

  const matrixValidation = validateB1ScenarioCashflowMatrix(input.matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }

  const legAlignment = validateSettlementLegAlignment(
    matrixValidation.value.rows,
    input.fillabilitySimulation.legs,
    input.settlementRecords,
  );
  if (!legAlignment.ok) {
    return legAlignment;
  }

  const voidRuleReplay = validateB1VoidRuleReplay(input.settlementRecords);
  if (!voidRuleReplay.ok) {
    return voidRuleReplay;
  }

  const replaySequence = resolveB1SettlementReplaySequence(input.settlementRecords);
  if (!replaySequence.ok) {
    return replaySequence;
  }

  const finalScenario = resolveFinalScenario(
    matrixValidation.value.rows,
    replaySequence.value.finalReplay.finalOutcomeSelectionEquivalenceKey,
  );
  if (!finalScenario.ok) {
    return finalScenario;
  }

  const settledNet = calculateSettledNetMinor(
    finalScenario.value.rows,
    input.fillabilitySimulation.legs,
  );
  if (!settledNet.ok) {
    return settledNet;
  }

  const falsePositive = settledNet.value <= 0n;
  return accepted(Object.freeze({
    replayKind: 'deterministic_b1_settlement_replay',
    candidateId: input.candidateId,
    finalOutcomeSelectionEquivalenceKey: replaySequence.value.finalReplay.finalOutcomeSelectionEquivalenceKey,
    finalScenarioId: finalScenario.value.scenarioId,
    settledNetMinor: settledNet.value,
    falsePositive,
    falsePositiveReason: falsePositive ? 'settled_net_non_positive' : 'none',
    replayCount: input.settlementRecords.length,
    uniqueReplayCount: replaySequence.value.uniqueReplayCount,
    correctionCount: replaySequence.value.correctionCount,
    finalityProgressionCount: replaySequence.value.finalityProgressionCount,
    voidRuleReplay: voidRuleReplay.value,
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  }));
}

function validateSettlementLegAlignment(
  matrixRows: readonly B1ScenarioCashflowRow[],
  fillabilityLegs: readonly B1FillabilityLegSnapshot[],
  settlementRecords: readonly B1SettlementReplayRecord[],
): BoundaryResult<undefined> {
  if (settlementRecords.length === 0) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_MISSING',
      'B1 settlement replay requires explicit accepted settlement records before false-positive analysis.',
      'Accepted B1 settlement replay records for every compared leg.',
    );
  }

  const matrixLegKeys = new Set(matrixRows.map((row) => buildB1SettlementLegKey(
    row.selectionEquivalenceKey,
    row.venueOrBookmakerId,
  )));
  const fillabilityLegKeys = new Set(fillabilityLegs.map((leg) => buildB1SettlementLegKey(
    leg.selectionEquivalenceKey,
    leg.venueOrBookmakerId,
  )));
  const settlementLegKeys = new Set(settlementRecords.map((record) => buildB1SettlementLegKey(
    record.selectionEquivalenceKey,
    record.venueOrBookmakerId,
  )));

  for (const key of matrixLegKeys) {
    if (!fillabilityLegKeys.has(key)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILLABILITY_LEG_MISSING',
        'B1 settlement replay requires fillability evidence for every scenario cash-flow leg.',
        'B1 fillability leg snapshots aligned to settlement replay legs.',
      );
    }
    if (!settlementLegKeys.has(key)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_LEG_MISSING',
        'B1 settlement replay requires settlement evidence for every scenario cash-flow leg.',
        'B1 settlement replay records aligned to every compared leg.',
      );
    }
  }
  for (const key of fillabilityLegKeys) {
    if (!matrixLegKeys.has(key)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILLABILITY_LEG_UNKNOWN',
        'B1 settlement replay requires fillability evidence to stay inside the scenario cash-flow matrix.',
        'B1 fillability leg snapshots aligned to the scenario cash-flow matrix.',
      );
    }
  }
  for (const key of settlementLegKeys) {
    if (!matrixLegKeys.has(key)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_LEG_UNKNOWN',
        'B1 settlement replay requires settlement records to stay inside the scenario cash-flow matrix.',
        'B1 settlement replay records aligned to the scenario cash-flow matrix.',
      );
    }
  }

  return accepted(undefined);
}

function resolveB1SettlementReplaySequence(
  records: readonly B1SettlementReplayRecord[],
): BoundaryResult<{
  readonly finalReplay: B1NormalizedSettlementReplay;
  readonly uniqueReplayCount: number;
  readonly correctionCount: number;
  readonly finalityProgressionCount: number;
}> {
  const uniqueByHash = new Map<string, B1NormalizedSettlementReplay>();
  for (const record of records) {
    const validation = validateB1SettlementReplayRecord(record);
    if (!validation.ok) {
      return validation;
    }
    const existing = uniqueByHash.get(validation.value.replayManifestHash);
    if (existing !== undefined && !sameB1SettlementReplay(existing, validation.value)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_IDEMPOTENCY_MISMATCH',
        'B1 settlement replay requires each replay manifest hash to resolve to one immutable payload.',
        'Idempotent B1 settlement replay records keyed by replay_manifest_hash.',
      );
    }
    uniqueByHash.set(validation.value.replayManifestHash, validation.value);
  }

  const uniqueReplays = [...uniqueByHash.values()].sort(compareB1SettlementReplays);
  const firstReplay = uniqueReplays[0];
  if (firstReplay === undefined) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_MISSING',
      'B1 settlement replay requires at least one accepted replay payload.',
      'Accepted B1 settlement replay payload.',
    );
  }

  let finalReplay = firstReplay;
  let correctionCount = 0;
  let finalityProgressionCount = 0;
  for (let index = 1; index < uniqueReplays.length; index += 1) {
    const replay = uniqueReplays[index];
    if (replay === undefined) {
      continue;
    }
    if (replay.finalityAuthorityId !== firstReplay.finalityAuthorityId) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISMATCH',
        'B1 settlement replay requires one finality authority across accepted replay corrections.',
        'Accepted B1 settlement replays from one finality authority.',
      );
    }
    if (replay.replayAcceptedAtUtc === finalReplay.replayAcceptedAtUtc) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_CORRECTION_CONFLICT',
        'B1 settlement replay requires strict replay acceptance ordering for corrections.',
        'B1 settlement replay records with unambiguous replayAcceptedAtUtc order.',
      );
    }
    if (replay.finalOutcomeSelectionEquivalenceKey === finalReplay.finalOutcomeSelectionEquivalenceKey) {
      finalityProgressionCount += 1;
    } else {
      correctionCount += 1;
    }
    finalReplay = replay;
  }

  return accepted(Object.freeze({
    finalReplay,
    uniqueReplayCount: uniqueReplays.length,
    correctionCount,
    finalityProgressionCount,
  }));
}

function validateB1SettlementReplayRecord(
  record: B1SettlementReplayRecord,
): BoundaryResult<B1NormalizedSettlementReplay> {
  if (!MANIFEST_HASH_REGEX.test(record.replayManifestHash)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_MANIFEST_HASH_INVALID',
      'B1 settlement replay requires a 64-character hexadecimal replay manifest hash.',
      'B1 replay_manifest_hash encoded as 64 hexadecimal characters.',
    );
  }
  if (!ISO_TIMESTAMP_REGEX.test(record.replayAcceptedAtUtc)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_ACCEPTED_AT_INVALID',
      'B1 settlement replay requires ISO-8601 UTC replay acceptance timestamps.',
      'B1 replayAcceptedAtUtc timestamp in ISO-8601 UTC form.',
    );
  }
  if (record.finalityAuthorityId.length === 0) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISSING',
      'B1 settlement replay requires explicit finality authority evidence.',
      'B1 settlement replay finality_authority_id.',
    );
  }
  if (record.finalOutcomeSelectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 settlement replay requires final outcome selection equivalence evidence.',
      'B1 final outcome selection_equivalence_key.',
    );
  }
  return accepted(Object.freeze({
    replayManifestHash: record.replayManifestHash,
    replayAcceptedAtUtc: record.replayAcceptedAtUtc,
    finalityAuthorityId: record.finalityAuthorityId,
    finalOutcomeSelectionEquivalenceKey: record.finalOutcomeSelectionEquivalenceKey,
  }));
}

function resolveFinalScenario(
  rows: readonly B1ScenarioCashflowRow[],
  finalOutcomeSelectionEquivalenceKey: string,
): BoundaryResult<{
  readonly scenarioId: string;
  readonly rows: readonly B1ScenarioCashflowRow[];
}> {
  const scenarioRows = rows.filter(
    (row) => row.winningSelectionEquivalenceKey === finalOutcomeSelectionEquivalenceKey,
  );
  if (scenarioRows.length === 0) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
      'B1 settlement replay requires the final outcome to resolve to one terminal B1 scenario.',
      'B1 terminal scenario matching the accepted settlement final outcome.',
    );
  }
  const scenarioIds = new Set(scenarioRows.map((row) => row.scenarioId));
  if (scenarioIds.size !== 1) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_SCENARIO_CONFLICT',
      'B1 settlement replay requires the final outcome to map to exactly one terminal scenario.',
      'Unambiguous B1 terminal scenario for the accepted settlement final outcome.',
    );
  }
  const scenarioId = [...scenarioIds][0];
  if (scenarioId === undefined) {
    throw new Error('B1 settlement replay lost scenario id after scenario conflict validation.');
  }
  return accepted(Object.freeze({ scenarioId, rows: Object.freeze(scenarioRows) }));
}

function calculateSettledNetMinor(
  scenarioRows: readonly B1ScenarioCashflowRow[],
  legs: readonly B1FillabilityLegSnapshot[],
): BoundaryResult<bigint> {
  const legsByKey = new Map<string, B1FillabilityLegSnapshot>();
  for (const leg of legs) {
    legsByKey.set(buildB1SettlementLegKey(leg.selectionEquivalenceKey, leg.venueOrBookmakerId), leg);
  }

  let settledNetMinor = 0n;
  for (const row of scenarioRows) {
    const leg = legsByKey.get(buildB1SettlementLegKey(row.selectionEquivalenceKey, row.venueOrBookmakerId));
    if (leg === undefined) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILLABILITY_LEG_MISSING',
        'B1 settlement replay requires fillability evidence for every settled scenario row.',
        'B1 fillability leg snapshots aligned to the settled scenario.',
      );
    }
    if (leg.liveFilledStakeMinor > row.stakeMinor) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILL_EXCEEDS_MATRIX_STAKE',
        'B1 settlement replay requires live fills to stay within scenario cash-flow stake rows.',
        'B1 live fills bounded by the scenario cash-flow matrix stake.',
      );
    }
    if (leg.liveFilledStakeMinor === 0n) {
      continue;
    }
    const payoutMinor = (row.payoutMinor * leg.liveFilledStakeMinor) / row.stakeMinor;
    settledNetMinor += payoutMinor - leg.liveFilledStakeMinor;
  }
  return accepted(settledNetMinor);
}

function sameB1SettlementReplay(
  left: B1NormalizedSettlementReplay,
  right: B1NormalizedSettlementReplay,
): boolean {
  return left.replayManifestHash === right.replayManifestHash
    && left.replayAcceptedAtUtc === right.replayAcceptedAtUtc
    && left.finalityAuthorityId === right.finalityAuthorityId
    && left.finalOutcomeSelectionEquivalenceKey === right.finalOutcomeSelectionEquivalenceKey;
}

function compareB1SettlementReplays(
  left: B1NormalizedSettlementReplay,
  right: B1NormalizedSettlementReplay,
): number {
  const acceptedAtOrder = left.replayAcceptedAtUtc.localeCompare(right.replayAcceptedAtUtc);
  if (acceptedAtOrder !== 0) {
    return acceptedAtOrder;
  }
  return left.replayManifestHash.localeCompare(right.replayManifestHash);
}

function buildB1SettlementLegKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}\u0000${venueOrBookmakerId}`;
}
