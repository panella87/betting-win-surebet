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
import {
  analyzeB1ResidualExposure,
  type B1ResidualExposureAnalysis,
} from './b1-residual-exposure.js';
import type {
  B1FillabilityGroupState,
  B1FillabilitySimulation,
  B1FillabilityLegSnapshot,
} from './b1-leg-completion.js';
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

interface B1SettlementReplayManifestGroup {
  readonly replay: B1NormalizedSettlementReplay;
  readonly legKeys: ReadonlySet<string>;
}

export function analyzeB1SettlementReplay(
  input: B1SettlementReplayAnalysisInput,
): BoundaryResult<B1SettlementReplayAnalysis> {
  if (typeof input !== 'object' || input === null) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_INPUT_INVALID',
      'B1 settlement replay requires structured analysis input.',
      'Structured B1 settlement replay analysis input.',
    );
  }
  if (typeof input.candidateId !== 'string' || input.candidateId.trim().length === 0) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_CANDIDATE_ID_MISSING',
      'B1 settlement replay requires a stable non-empty candidate id.',
      'Stable B1 settlement replay candidate id.',
    );
  }

  const fillabilitySimulationShape = validateB1SettlementFillabilitySimulation(input.fillabilitySimulation);
  if (!fillabilitySimulationShape.ok) {
    return fillabilitySimulationShape;
  }

  if (input.fillabilitySimulation.candidateId !== input.candidateId) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_CANDIDATE_ID_MISMATCH',
      'B1 settlement replay requires the caller candidate id to match fillability simulation evidence.',
      'B1 settlement replay input aligned to the fillability simulation candidate id.',
    );
  }

  const matrixValidation = validateB1ScenarioCashflowMatrix(input.matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }

  const replayRecordShapes = validateB1SettlementReplayRecordShapes(input.settlementRecords);
  if (!replayRecordShapes.ok) {
    return replayRecordShapes;
  }

  const fillabilitySnapshots = validateB1SettlementFillabilitySnapshots(
    matrixValidation.value.rows,
    input.fillabilitySimulation.legs,
  );
  if (!fillabilitySnapshots.ok) {
    return fillabilitySnapshots;
  }

  const expectedGroupState = deriveB1SettlementGroupState(input.fillabilitySimulation.legs);
  if (input.fillabilitySimulation.groupState !== expectedGroupState) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_GROUP_STATE_MISMATCH',
      'B1 settlement replay requires aggregate fillability group state to match leg snapshots.',
      'B1 fillability simulation groupState derived from validated leg snapshots.',
    );
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

  const replaySequence = resolveB1SettlementReplaySequence(
    input.settlementRecords,
    legAlignment.value.expectedLegKeys,
  );
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

  const residualReplay = validateB1SettlementResidualReplay(
    input.fillabilitySimulation,
    matrixValidation.value.rows,
    finalScenario.value.scenarioId,
    settledNet.value,
  );
  if (!residualReplay.ok) {
    return residualReplay;
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
): BoundaryResult<{ readonly expectedLegKeys: ReadonlySet<string> }> {
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

  return accepted(Object.freeze({ expectedLegKeys: matrixLegKeys }));
}

function validateB1SettlementFillabilitySimulation(
  fillabilitySimulation: B1FillabilitySimulation,
): BoundaryResult<undefined> {
  if (
    typeof fillabilitySimulation !== 'object'
    || fillabilitySimulation === null
    || typeof fillabilitySimulation.candidateId !== 'string'
    || !Array.isArray(fillabilitySimulation.legs)
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires structured fillability simulation evidence.',
      'Structured B1 fillability simulation evidence with leg snapshots.',
    );
  }
  if (!isB1FillabilityGroupState(fillabilitySimulation.groupState)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires a supported aggregate fillability group state.',
      'Supported B1 fillability simulation groupState evidence.',
    );
  }
  return accepted(undefined);
}

function validateB1SettlementReplayRecordShapes(
  records: readonly B1SettlementReplayRecord[],
): BoundaryResult<undefined> {
  if (!Array.isArray(records)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      'B1 settlement replay requires structured settlement replay records.',
      'Structured B1 settlement replay record objects.',
    );
  }
  for (const record of records) {
    const shapeValidation = validateB1SettlementReplayRecordShape(record);
    if (!shapeValidation.ok) {
      return shapeValidation;
    }
  }
  return accepted(undefined);
}

function validateB1SettlementReplayRecordShape(
  record: B1SettlementReplayRecord,
): BoundaryResult<undefined> {
  if (typeof record !== 'object' || record === null) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      'B1 settlement replay requires structured settlement replay records.',
      'Structured B1 settlement replay record objects.',
    );
  }
  if (
    typeof record.selectionEquivalenceKey !== 'string'
    || typeof record.venueOrBookmakerId !== 'string'
    || typeof record.settlementRuleVersion !== 'string'
    || typeof record.settlementCompatibilityFlag !== 'string'
    || typeof record.voidRuleId !== 'string'
    || typeof record.replayManifestHash !== 'string'
    || typeof record.replayAcceptedAtUtc !== 'string'
    || typeof record.finalityAuthorityId !== 'string'
    || typeof record.finalOutcomeSelectionEquivalenceKey !== 'string'
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      'B1 settlement replay requires string identity, rule, manifest, finality and outcome fields.',
      'B1 settlement replay record fields encoded with the expected runtime types.',
    );
  }
  return accepted(undefined);
}

function resolveB1SettlementReplaySequence(
  records: readonly B1SettlementReplayRecord[],
  expectedLegKeys: ReadonlySet<string>,
): BoundaryResult<{
  readonly finalReplay: B1NormalizedSettlementReplay;
  readonly uniqueReplayCount: number;
  readonly correctionCount: number;
  readonly finalityProgressionCount: number;
}> {
  const groupsByHash = new Map<string, B1SettlementReplayManifestGroup>();
  for (const record of records) {
    const validation = validateB1SettlementReplayRecord(record);
    if (!validation.ok) {
      return validation;
    }
    const legKey = buildB1SettlementLegKey(record.selectionEquivalenceKey, record.venueOrBookmakerId);
    const existing = groupsByHash.get(validation.value.replayManifestHash);
    if (existing !== undefined && !sameB1SettlementReplay(existing.replay, validation.value)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_IDEMPOTENCY_MISMATCH',
        'B1 settlement replay requires each replay manifest hash to resolve to one immutable payload.',
        'Idempotent B1 settlement replay records keyed by replay_manifest_hash.',
      );
    }
    if (existing !== undefined) {
      groupsByHash.set(validation.value.replayManifestHash, Object.freeze({
        replay: existing.replay,
        legKeys: Object.freeze(new Set([...existing.legKeys, legKey])),
      }));
    } else {
      groupsByHash.set(validation.value.replayManifestHash, Object.freeze({
        replay: validation.value,
        legKeys: Object.freeze(new Set([legKey])),
      }));
    }
  }

  for (const group of groupsByHash.values()) {
    for (const key of expectedLegKeys) {
      if (!group.legKeys.has(key)) {
        return blocked(
          'B1_SETTLEMENT_REPLAY_LEG_MISSING',
          'B1 settlement replay requires each replay manifest to contain settlement evidence for every compared leg.',
          'Complete per-manifest B1 settlement replay records aligned to every compared leg.',
        );
      }
    }
    if (group.legKeys.size !== expectedLegKeys.size) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_LEG_MISSING',
        'B1 settlement replay requires each replay manifest to contain settlement evidence for every compared leg.',
        'Complete per-manifest B1 settlement replay records aligned to every compared leg.',
      );
    }
  }

  const uniqueReplays = [...groupsByHash.values()].map((group) => group.replay).sort(compareB1SettlementReplays);
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
  if (!isIsoTimestamp(record.replayAcceptedAtUtc)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_ACCEPTED_AT_INVALID',
      'B1 settlement replay requires ISO-8601 UTC replay acceptance timestamps.',
      'B1 replayAcceptedAtUtc timestamp in ISO-8601 UTC form.',
    );
  }
  if (record.finalityAuthorityId.trim().length === 0) {
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

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function validateB1SettlementFillabilitySnapshots(
  matrixRows: readonly B1ScenarioCashflowRow[],
  fillabilityLegs: readonly B1FillabilityLegSnapshot[],
): BoundaryResult<undefined> {
  const legsByKey = new Map<string, B1FillabilityLegSnapshot>();
  for (const leg of fillabilityLegs) {
    const legValidation = validateB1SettlementFillabilitySnapshot(leg);
    if (!legValidation.ok) {
      return legValidation;
    }
    const key = buildB1SettlementLegKey(leg.selectionEquivalenceKey, leg.venueOrBookmakerId);
    if (legsByKey.has(key)) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
        'B1 settlement replay requires one stable fillability snapshot per compared leg.',
        'Unique B1 fillability snapshots keyed by selection_equivalence_key and venue_or_bookmaker_id.',
      );
    }
    legsByKey.set(key, leg);
  }

  for (const row of matrixRows) {
    const leg = legsByKey.get(buildB1SettlementLegKey(row.selectionEquivalenceKey, row.venueOrBookmakerId));
    if (leg === undefined) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILLABILITY_LEG_MISSING',
        'B1 settlement replay requires fillability evidence for every scenario cash-flow leg.',
        'B1 fillability leg snapshots aligned to settlement replay legs.',
      );
    }
    if (leg.liveFilledStakeMinor > row.stakeMinor) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_FILL_EXCEEDS_MATRIX_STAKE',
        'B1 settlement replay requires live fills to stay within scenario cash-flow stake rows.',
        'B1 live fills bounded by the scenario cash-flow matrix stake.',
      );
    }
  }

  return accepted(undefined);
}

function validateB1SettlementFillabilitySnapshot(
  leg: B1FillabilityLegSnapshot,
): BoundaryResult<undefined> {
  if (typeof leg !== 'object' || leg === null) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires structured fillability leg snapshots.',
      'Structured B1 fillability leg snapshot objects.',
    );
  }
  if (
    typeof leg.legId !== 'string'
    || typeof leg.selectionEquivalenceKey !== 'string'
    || typeof leg.venueOrBookmakerId !== 'string'
    || typeof leg.updatedAtUtc !== 'string'
    || typeof leg.terminalDisposition !== 'string'
    || typeof leg.state !== 'string'
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires typed fillability snapshot identity, timestamp and state fields.',
      'B1 fillability snapshot fields encoded with the expected runtime types.',
    );
  }
  if (
    typeof leg.plannedStakeMinor !== 'bigint'
    || typeof leg.liveFilledStakeMinor !== 'bigint'
    || typeof leg.unfilledStakeMinor !== 'bigint'
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires integer minor-unit fillability snapshot stake fields.',
      'B1 fillability snapshot stake fields encoded as bigint integer minor units.',
    );
  }
  if (
    leg.legId.trim().length === 0
    || leg.selectionEquivalenceKey.length === 0
    || leg.venueOrBookmakerId.length === 0
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires stable non-empty fillability snapshot identity fields.',
      'Stable B1 fillability leg id, selection_equivalence_key and venue_or_bookmaker_id.',
    );
  }
  if (!isIsoTimestamp(leg.updatedAtUtc)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires ISO-8601 UTC fillability snapshot timestamps.',
      'ISO-8601 UTC B1 fillability snapshot updatedAtUtc timestamps.',
    );
  }
  if (leg.plannedStakeMinor <= 0n) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires positive planned stake in every fillability snapshot.',
      'Positive B1 fillability planned stake in integer minor units.',
    );
  }
  if (leg.liveFilledStakeMinor < 0n || leg.unfilledStakeMinor < 0n) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires non-negative fillability snapshot stake values.',
      'Non-negative B1 live filled and unfilled stake values.',
    );
  }
  if (leg.liveFilledStakeMinor > leg.plannedStakeMinor) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires live fills to stay within planned fillability stake.',
      'B1 live filled stake bounded by planned fillability stake.',
    );
  }
  if (leg.plannedStakeMinor - leg.liveFilledStakeMinor !== leg.unfilledStakeMinor) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires fillability unfilled stake to match planned minus live filled stake.',
      'Internally consistent B1 fillability snapshot stake values.',
    );
  }
  if (!isB1FillabilityTerminalDisposition(leg.terminalDisposition) || !isB1FillabilityLegState(leg.state)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires supported fillability snapshot state and terminal disposition values.',
      'Supported B1 fillability snapshot state and terminal disposition values.',
    );
  }
  if (!hasConsistentB1FillabilityState(leg)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      'B1 settlement replay requires fillability snapshot state to match live fill and terminal disposition values.',
      'Internally consistent B1 fillability snapshot state and disposition values.',
    );
  }
  return accepted(undefined);
}

function isB1FillabilityTerminalDisposition(value: string): boolean {
  return value === 'none' || value === 'rejected' || value === 'timed_out';
}

function isB1FillabilityGroupState(value: string): value is B1FillabilityGroupState {
  return value === 'group_filled' || value === 'group_incomplete';
}

function isB1FillabilityLegState(value: string): boolean {
  return value === 'leg_open'
    || value === 'leg_partial'
    || value === 'leg_filled'
    || value === 'leg_rejected'
    || value === 'leg_timed_out';
}

function hasConsistentB1FillabilityState(leg: B1FillabilityLegSnapshot): boolean {
  if (leg.state === 'leg_filled') {
    return leg.liveFilledStakeMinor === leg.plannedStakeMinor && leg.terminalDisposition === 'none';
  }
  if (leg.state === 'leg_partial') {
    return leg.liveFilledStakeMinor > 0n && leg.liveFilledStakeMinor < leg.plannedStakeMinor;
  }
  if (leg.state === 'leg_rejected') {
    return leg.liveFilledStakeMinor === 0n && leg.terminalDisposition === 'rejected';
  }
  if (leg.state === 'leg_timed_out') {
    return leg.liveFilledStakeMinor === 0n && leg.terminalDisposition === 'timed_out';
  }
  return leg.liveFilledStakeMinor === 0n && leg.terminalDisposition === 'none';
}

function deriveB1SettlementGroupState(
  legs: readonly B1FillabilityLegSnapshot[],
): B1FillabilityGroupState {
  return legs.every((leg) => leg.state === 'leg_filled') ? 'group_filled' : 'group_incomplete';
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
    const payoutNumeratorMinor = row.payoutMinor * leg.liveFilledStakeMinor;
    if (payoutNumeratorMinor % row.stakeMinor !== 0n) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_PAYOUT_SCALING_FRACTIONAL',
        'B1 settlement replay requires partial payout scaling to resolve to integer minor units.',
        'B1 settled scenario payout scaling with no fractional minor-unit remainder.',
      );
    }
    const payoutMinor = payoutNumeratorMinor / row.stakeMinor;
    settledNetMinor += payoutMinor - leg.liveFilledStakeMinor;
  }
  return accepted(settledNetMinor);
}

function validateB1SettlementResidualReplay(
  fillabilitySimulation: B1FillabilitySimulation,
  matrixRows: readonly B1ScenarioCashflowRow[],
  finalScenarioId: string,
  settledNetMinor: bigint,
): BoundaryResult<undefined> {
  if (fillabilitySimulation.groupState !== 'group_incomplete') {
    return accepted(undefined);
  }

  const residualExposure = fillabilitySimulation.residualExposure;
  if (residualExposure === undefined) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_MISSING',
      'B1 settlement replay requires residual exposure evidence for incomplete fillability simulations.',
      'B1 residual exposure output from the validated fillability simulation.',
    );
  }
  const residualExposureShape = validateB1SettlementResidualExposureEvidence(residualExposure);
  if (!residualExposureShape.ok) {
    return residualExposureShape;
  }

  const freshness = validateB1ResidualExposureFreshness(
    residualExposure,
    matrixRows,
    fillabilitySimulation.legs,
    finalScenarioId,
  );
  if (!freshness.ok) {
    return freshness;
  }
  if (residualExposure.residualExposureWithinLimit !== true) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_OVER_LIMIT',
      'B1 settlement replay requires incomplete residual exposure evidence to stay within the configured exposure limit.',
      'B1 residual exposure evidence with residualExposureWithinLimit=true.',
    );
  }

  const settledScenario = residualExposure.scenarioNets.find(
    (scenarioNet) => scenarioNet.scenarioId === finalScenarioId,
  );
  if (settledScenario === undefined) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
      'B1 settlement replay requires residual exposure evidence for the accepted final scenario.',
      'B1 residual exposure scenario net aligned to the accepted settlement replay.',
    );
  }
  if (settledScenario.netMinor !== settledNetMinor) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_RECONCILIATION_MISMATCH',
      'B1 settlement replay requires the settled final scenario net to match residual exposure evidence.',
      'B1 residual exposure scenario nets reconciled to the accepted settlement replay.',
    );
  }

  return accepted(undefined);
}

function validateB1SettlementResidualExposureEvidence(
  residualExposure: B1ResidualExposureAnalysis,
): BoundaryResult<undefined> {
  if (
    typeof residualExposure !== 'object'
    || residualExposure === null
    || !Array.isArray(residualExposure.exposedLegIds)
    || !Array.isArray(residualExposure.excludedLegIds)
    || !Array.isArray(residualExposure.scenarioNets)
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
      'B1 settlement replay requires structured residual exposure replay evidence.',
      'Structured B1 residual exposure replay evidence.',
    );
  }
  if (
    residualExposure.exposureKind !== 'deterministic_b1_residual_exposure'
    || typeof residualExposure.worstCaseNetMinor !== 'bigint'
    || typeof residualExposure.worstCaseScenarioId !== 'string'
    || typeof residualExposure.maxResidualExposureMinor !== 'bigint'
    || typeof residualExposure.residualExposureWithinLimit !== 'boolean'
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
      'B1 settlement replay requires typed residual exposure aggregate fields.',
      'B1 residual exposure aggregate fields encoded with the expected runtime types.',
    );
  }
  for (const legId of [...residualExposure.exposedLegIds, ...residualExposure.excludedLegIds]) {
    if (typeof legId !== 'string') {
      return blocked(
        'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
        'B1 settlement replay requires residual exposure leg classifications to contain leg ids.',
        'B1 residual exposure exposed and excluded leg ids encoded as strings.',
      );
    }
  }
  for (const scenarioNet of residualExposure.scenarioNets) {
    if (
      typeof scenarioNet !== 'object'
      || scenarioNet === null
      || typeof scenarioNet.scenarioId !== 'string'
      || typeof scenarioNet.winningSelectionEquivalenceKey !== 'string'
      || typeof scenarioNet.netMinor !== 'bigint'
    ) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
        'B1 settlement replay requires typed residual exposure scenario nets.',
        'B1 residual exposure scenario nets encoded with the expected runtime types.',
      );
    }
  }
  return accepted(undefined);
}

function validateB1ResidualExposureFreshness(
  residualExposure: B1ResidualExposureAnalysis,
  matrixRows: readonly B1ScenarioCashflowRow[],
  legs: readonly B1FillabilityLegSnapshot[],
  finalScenarioId: string,
): BoundaryResult<undefined> {
  if (residualExposure.exposureKind !== 'deterministic_b1_residual_exposure') {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
      'B1 settlement replay requires residual exposure evidence from the deterministic B1 residual exposure analyzer.',
      'Fresh deterministic B1 residual exposure evidence for the fillability simulation.',
    );
  }

  const expectedResidualExposure = analyzeB1ResidualExposure(
    Object.freeze({ rows: Object.freeze(matrixRows) }),
    legs,
    residualExposure.maxResidualExposureMinor,
  );
  if (!expectedResidualExposure.ok) {
    return expectedResidualExposure;
  }

  if (
    !sameStringList(expectedResidualExposure.value.exposedLegIds, [...residualExposure.exposedLegIds].sort())
    || !sameStringList(expectedResidualExposure.value.excludedLegIds, [...residualExposure.excludedLegIds].sort())
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
      'B1 settlement replay requires residual exposure leg classification to match fillability evidence.',
      'Fresh B1 residual exposure exposed and excluded leg ids for the fillability simulation.',
    );
  }

  const expectedScenarios = expectedResidualExposure.value.scenarioNets;
  const residualScenarios = [...residualExposure.scenarioNets].sort((left, right) =>
    left.scenarioId.localeCompare(right.scenarioId));
  if (residualScenarios.length !== expectedScenarios.length) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
      'B1 settlement replay requires residual exposure coverage for every terminal scenario.',
      'Complete B1 residual exposure scenario nets aligned to the scenario cash-flow matrix.',
    );
  }

  for (let index = 0; index < expectedScenarios.length; index += 1) {
    const expectedScenario = expectedScenarios[index];
    const residualScenario = residualScenarios[index];
    if (expectedScenario === undefined || residualScenario === undefined) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
        'B1 settlement replay requires residual exposure coverage for every terminal scenario.',
        'Complete B1 residual exposure scenario nets aligned to the scenario cash-flow matrix.',
      );
    }
    if (residualScenario.scenarioId !== expectedScenario.scenarioId) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
        'B1 settlement replay requires residual exposure coverage for every terminal scenario.',
        'Complete B1 residual exposure scenario nets aligned to the scenario cash-flow matrix.',
      );
    }
    if (residualScenario.winningSelectionEquivalenceKey !== expectedScenario.winningSelectionEquivalenceKey) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
        'B1 settlement replay requires residual exposure scenarios to match the cash-flow matrix winners.',
        'Fresh B1 residual exposure scenario winners aligned to the scenario cash-flow matrix.',
      );
    }
    if (residualScenario.scenarioId !== finalScenarioId && residualScenario.netMinor !== expectedScenario.netMinor) {
      return blocked(
        'B1_SETTLEMENT_REPLAY_RESIDUAL_RECONCILIATION_MISMATCH',
        'B1 settlement replay requires residual exposure scenario nets to match fillability evidence.',
        'Fresh B1 residual exposure scenario nets derived from the fillability simulation.',
      );
    }
  }

  if (
    residualExposure.worstCaseNetMinor !== expectedResidualExposure.value.worstCaseNetMinor
    || residualExposure.worstCaseScenarioId !== expectedResidualExposure.value.worstCaseScenarioId
    || residualExposure.residualExposureWithinLimit !== expectedResidualExposure.value.residualExposureWithinLimit
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_STALE',
      'B1 settlement replay requires residual exposure worst-case evidence to match scenario nets.',
      'Fresh B1 residual exposure worst-case scenario derived from residual scenario nets.',
    );
  }

  return accepted(undefined);
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
