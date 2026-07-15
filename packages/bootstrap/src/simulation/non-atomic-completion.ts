import { accepted, blocked, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';
import type { ScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import { validateScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import type { StakeVectorSolution } from '../solver/stake-vector.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const NON_ATOMIC_LEG_STATES = [
  'leg_open',
  'leg_reserved',
  'leg_partial',
  'leg_filled',
  'leg_rejected',
  'leg_expired',
  'leg_rolled_back',
] as const;

export const NON_ATOMIC_GROUP_STATES = [
  'group_open',
  'group_reserved',
  'group_complete',
  'group_incomplete',
  'group_killed',
] as const;

export const NON_ATOMIC_COMPLETION_EVENT_TYPES = [
  'reserve',
  'fill',
  'reject',
  'expire',
  'rollback',
] as const;

export type NonAtomicPaperLegState = (typeof NON_ATOMIC_LEG_STATES)[number];
export type NonAtomicPaperGroupState = (typeof NON_ATOMIC_GROUP_STATES)[number];
export type NonAtomicCompletionEventType = (typeof NON_ATOMIC_COMPLETION_EVENT_TYPES)[number];

export interface NonAtomicCompletionEvent {
  readonly legId: string;
  readonly type: NonAtomicCompletionEventType;
  readonly stakeMinor?: bigint;
  readonly occurredAt: IsoTimestamp;
}

export interface NonAtomicPaperLegSnapshot {
  readonly legId: string;
  readonly plannedStakeMinor: bigint;
  readonly reservedStakeMinor: bigint;
  readonly liveFilledStakeMinor: bigint;
  readonly rolledBackStakeMinor: bigint;
  readonly updatedAt: IsoTimestamp;
  readonly state: NonAtomicPaperLegState;
}

export interface NonAtomicPaperGroupCompletionSnapshot {
  readonly groupState: NonAtomicPaperGroupState;
  readonly manualKill: boolean;
  readonly legs: readonly NonAtomicPaperLegSnapshot[];
}

export interface NonAtomicResidualExposureScenarioNet {
  readonly scenarioId: string;
  readonly netMinor: bigint;
}

export interface NonAtomicResidualExposureAnalysis {
  readonly groupState: 'group_incomplete';
  readonly exposedLegIds: readonly string[];
  readonly excludedLegIds: readonly string[];
  readonly scenarioNets: readonly NonAtomicResidualExposureScenarioNet[];
  readonly worstCaseNetMinor: bigint;
  readonly worstCaseScenarioId: string;
}

export interface NonAtomicCompletionSimulation {
  readonly completion: NonAtomicPaperGroupCompletionSnapshot;
  readonly residualExposure?: NonAtomicResidualExposureAnalysis;
}

export interface NonAtomicCompletionInput {
  readonly stakeVector: StakeVectorSolution;
  readonly matrix: ScenarioCashflowMatrix;
  readonly events: readonly NonAtomicCompletionEvent[];
  readonly manualKill: boolean;
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

interface LegAccumulator {
  readonly legId: string;
  readonly plannedStakeMinor: bigint;
  reservedStakeMinor: bigint;
  liveFilledStakeMinor: bigint;
  rolledBackStakeMinor: bigint;
  terminalDisposition?: 'rejected' | 'expired';
  updatedAt: IsoTimestamp;
}

export function simulateNonAtomicPaperGroupCompletion(
  input: NonAtomicCompletionInput,
): BoundaryResult<NonAtomicCompletionSimulation> {
  const matrixTerms = validateNonAtomicInputs(input.stakeVector, input.matrix);
  if (!matrixTerms.ok) {
    return matrixTerms;
  }

  const replayed = replayLegEvents(matrixTerms.value.plansByLegId, input.events);
  if (!replayed.ok) {
    return replayed;
  }

  const completion = freezeCompletionSnapshot(
    replayed.value.map((leg) => freezeLegSnapshot(leg)),
    input.manualKill,
  );

  if (completion.groupState !== 'group_incomplete') {
    return accepted(Object.freeze({ completion }));
  }

  const residualExposure = analyzeNonAtomicResidualExposure(completion, matrixTerms.value);
  if (!residualExposure.ok) {
    return residualExposure;
  }

  return accepted(
    Object.freeze({
      completion,
      residualExposure: residualExposure.value,
    }),
  );
}

function validateNonAtomicInputs(
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
    if (!referenceRow) {
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

function replayLegEvents(
  plansByLegId: ReadonlyMap<string, StakePlan>,
  events: readonly NonAtomicCompletionEvent[],
): BoundaryResult<readonly LegAccumulator[]> {
  const legs = [...plansByLegId.values()]
    .sort((left, right) => left.legId.localeCompare(right.legId))
    .map((plan) => ({
      legId: plan.legId,
      plannedStakeMinor: plan.stakeMinor,
      reservedStakeMinor: 0n,
      liveFilledStakeMinor: 0n,
      rolledBackStakeMinor: 0n,
      updatedAt: '1970-01-01T00:00:00.000Z' as IsoTimestamp,
    }));

  const accumulatorsByLegId = new Map<string, LegAccumulator>(
    legs.map((leg) => [leg.legId, leg]),
  );

  const indexedEvents = events.map((event, index) => ({ event, index }));
  indexedEvents.sort((left, right) => {
    const timestampOrder = left.event.occurredAt.localeCompare(right.event.occurredAt);
    if (timestampOrder !== 0) {
      return timestampOrder;
    }
    return left.index - right.index;
  });

  for (const { event } of indexedEvents) {
    if (event.legId.trim().length === 0) {
      return blocked(
        'NON_ATOMIC_COMPLETION_EVENT_LEG_ID_MISSING',
        'Non-atomic completion simulation requires a non-empty event leg id.',
        'Stable leg ids for each non-atomic completion event.',
      );
    }
    if (!isIsoTimestamp(event.occurredAt)) {
      return blocked(
        'NON_ATOMIC_COMPLETION_EVENT_TIMESTAMP_INVALID',
        'Non-atomic completion simulation requires ISO-8601 UTC timestamps for every event.',
        'ISO-8601 UTC event timestamps for the non-atomic completion replay.',
      );
    }
    if (!isNonAtomicCompletionEventType(event.type)) {
      return blocked(
        'NON_ATOMIC_COMPLETION_EVENT_TYPE_INVALID',
        'Non-atomic completion simulation requires a supported event type.',
        'Supported reserve, fill, reject, expire, and rollback event types.',
      );
    }

    const accumulator = accumulatorsByLegId.get(event.legId);
    if (!accumulator) {
      return blocked(
        'NON_ATOMIC_COMPLETION_EVENT_LEG_UNKNOWN',
        'Non-atomic completion simulation requires every event to target a solved completion leg.',
        'Non-atomic completion events aligned to the solved stake-vector leg ids.',
      );
    }

    const eventValidation = validateEventStakeShape(event);
    if (!eventValidation.ok) {
      return eventValidation;
    }

    const replayResult = applyEvent(accumulator, event);
    if (!replayResult.ok) {
      return replayResult;
    }
  }

  return accepted(Object.freeze(legs.map((leg) => Object.freeze({ ...leg })) as readonly LegAccumulator[]));
}

function validateEventStakeShape(event: NonAtomicCompletionEvent): BoundaryResult<undefined> {
  if (event.type === 'reject' || event.type === 'expire') {
    if (event.stakeMinor !== undefined) {
      return blocked(
        'NON_ATOMIC_COMPLETION_EVENT_STAKE_UNEXPECTED',
        `Non-atomic completion event ${event.type} must not include a stake amount.`,
        'Stake-free reject and expire completion events.',
      );
    }
    return accepted(undefined);
  }

  if (event.stakeMinor === undefined || event.stakeMinor <= 0n) {
    return blocked(
      'NON_ATOMIC_COMPLETION_EVENT_STAKE_INVALID',
      `Non-atomic completion event ${event.type} requires a positive fixed-point stake amount.`,
      'Positive fixed-point stake amounts for reserve, fill, and rollback events.',
    );
  }

  return accepted(undefined);
}

function applyEvent(accumulator: LegAccumulator, event: NonAtomicCompletionEvent): BoundaryResult<undefined> {
  switch (event.type) {
    case 'reserve':
      if (accumulator.terminalDisposition !== undefined) {
        return blocked(
          'NON_ATOMIC_COMPLETION_TERMINAL_REOPEN_FORBIDDEN',
          'Non-atomic completion simulation does not allow reserve events after rejection or expiry.',
          'Event order that does not reopen a terminally rejected or expired leg.',
        );
      }
      accumulator.reservedStakeMinor += event.stakeMinor as bigint;
      if (accumulator.reservedStakeMinor + accumulator.liveFilledStakeMinor > accumulator.plannedStakeMinor) {
        return blocked(
          'NON_ATOMIC_COMPLETION_RESERVE_EXCEEDS_PLAN',
          'Non-atomic completion simulation requires reserved plus live filled stake to stay within the solved plan.',
          'Reserve events bounded by the solved stake-vector leg size.',
        );
      }
      break;
    case 'fill':
      if (accumulator.terminalDisposition !== undefined) {
        return blocked(
          'NON_ATOMIC_COMPLETION_FILL_AFTER_TERMINAL_FORBIDDEN',
          'Non-atomic completion simulation does not allow fill events after rejection or expiry.',
          'Event order that does not fill a terminally rejected or expired leg.',
        );
      }
      if (accumulator.reservedStakeMinor > 0n && accumulator.reservedStakeMinor < (event.stakeMinor as bigint)) {
        return blocked(
          'NON_ATOMIC_COMPLETION_FILL_EXCEEDS_RESERVED',
          'Non-atomic completion simulation requires filled stake to stay within the reserved amount when a reservation exists.',
          'Fill events that do not exceed the reserved completion stake.',
        );
      }
      accumulator.reservedStakeMinor =
        accumulator.reservedStakeMinor === 0n
          ? 0n
          : accumulator.reservedStakeMinor - (event.stakeMinor as bigint);
      accumulator.liveFilledStakeMinor += event.stakeMinor as bigint;
      if (accumulator.liveFilledStakeMinor > accumulator.plannedStakeMinor) {
        return blocked(
          'NON_ATOMIC_COMPLETION_FILL_EXCEEDS_PLAN',
          'Non-atomic completion simulation requires live filled stake to stay within the solved plan.',
          'Fill events bounded by the solved stake-vector leg size.',
        );
      }
      break;
    case 'reject':
      if (accumulator.terminalDisposition !== undefined) {
        return blocked(
          'NON_ATOMIC_COMPLETION_TERMINAL_DUPLICATE',
          'Non-atomic completion simulation allows at most one rejection or expiry marker per leg.',
          'One terminal reject or expire marker for each incomplete completion leg.',
        );
      }
      if (accumulator.liveFilledStakeMinor === accumulator.plannedStakeMinor) {
        return blocked(
          'NON_ATOMIC_COMPLETION_TERMINAL_AFTER_FULL_FILL',
          'Non-atomic completion simulation does not allow rejection after a leg is fully filled.',
          'Reject markers only for legs that still have unfilled solved stake.',
        );
      }
      accumulator.terminalDisposition = 'rejected';
      accumulator.reservedStakeMinor = 0n;
      break;
    case 'expire':
      if (accumulator.terminalDisposition !== undefined) {
        return blocked(
          'NON_ATOMIC_COMPLETION_TERMINAL_DUPLICATE',
          'Non-atomic completion simulation allows at most one rejection or expiry marker per leg.',
          'One terminal reject or expire marker for each incomplete completion leg.',
        );
      }
      if (accumulator.liveFilledStakeMinor === accumulator.plannedStakeMinor) {
        return blocked(
          'NON_ATOMIC_COMPLETION_TERMINAL_AFTER_FULL_FILL',
          'Non-atomic completion simulation does not allow expiry after a leg is fully filled.',
          'Expiry markers only for legs that still have unfilled solved stake.',
        );
      }
      accumulator.terminalDisposition = 'expired';
      accumulator.reservedStakeMinor = 0n;
      break;
    case 'rollback':
      if (accumulator.liveFilledStakeMinor < (event.stakeMinor as bigint)) {
        return blocked(
          'NON_ATOMIC_COMPLETION_ROLLBACK_EXCEEDS_LIVE_FILL',
          'Non-atomic completion simulation requires rollback stake to stay within the currently live filled stake.',
          'Rollback events bounded by previously filled stake on the same leg.',
        );
      }
      accumulator.liveFilledStakeMinor -= event.stakeMinor as bigint;
      accumulator.rolledBackStakeMinor += event.stakeMinor as bigint;
      break;
  }

  accumulator.updatedAt = event.occurredAt;
  return accepted(undefined);
}

function freezeLegSnapshot(accumulator: LegAccumulator): NonAtomicPaperLegSnapshot {
  return Object.freeze({
    legId: accumulator.legId,
    plannedStakeMinor: accumulator.plannedStakeMinor,
    reservedStakeMinor: accumulator.reservedStakeMinor,
    liveFilledStakeMinor: accumulator.liveFilledStakeMinor,
    rolledBackStakeMinor: accumulator.rolledBackStakeMinor,
    updatedAt: accumulator.updatedAt,
    state: deriveLegState(accumulator),
  });
}

function freezeCompletionSnapshot(
  legs: readonly NonAtomicPaperLegSnapshot[],
  manualKill: boolean,
): NonAtomicPaperGroupCompletionSnapshot {
  return Object.freeze({
    groupState: deriveGroupState(legs, manualKill),
    manualKill,
    legs: Object.freeze([...legs]),
  });
}

function deriveLegState(accumulator: LegAccumulator): NonAtomicPaperLegState {
  if (accumulator.liveFilledStakeMinor === accumulator.plannedStakeMinor) {
    return 'leg_filled';
  }
  if (accumulator.liveFilledStakeMinor > 0n) {
    return 'leg_partial';
  }
  if (accumulator.reservedStakeMinor > 0n) {
    return 'leg_reserved';
  }
  if (accumulator.rolledBackStakeMinor > 0n) {
    return 'leg_rolled_back';
  }
  if (accumulator.terminalDisposition === 'rejected') {
    return 'leg_rejected';
  }
  if (accumulator.terminalDisposition === 'expired') {
    return 'leg_expired';
  }
  return 'leg_open';
}

function deriveGroupState(
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

function analyzeNonAtomicResidualExposure(
  completion: NonAtomicPaperGroupCompletionSnapshot,
  matrixTerms: MatrixTerms,
): BoundaryResult<NonAtomicResidualExposureAnalysis> {
  const exposedLegIds: string[] = [];
  const excludedLegIds: string[] = [];

  for (const leg of completion.legs) {
    if (!supportsResidualExposureState(leg.state)) {
      return blocked(
        'NON_ATOMIC_COMPLETION_STATE_UNSUPPORTED',
        'Non-atomic residual exposure analysis only supports incomplete groups composed of open, reserved, partial, filled, rejected, expired, or rolled-back legs.',
        'Incomplete group completion snapshots limited to supported non-atomic leg states.',
      );
    }

    const plan = matrixTerms.plansByLegId.get(leg.legId);
    if (!plan) {
      return blocked(
        'NON_ATOMIC_COMPLETION_LEG_UNKNOWN',
        'Non-atomic residual exposure analysis requires completion legs to match the solved stake-vector leg ids.',
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
      exposedLegIds.push(leg.legId);
    } else {
      excludedLegIds.push(leg.legId);
    }
  }

  const scenarioNets = Object.freeze(
    matrixTerms.scenarioIds.map((scenarioId) =>
      Object.freeze({
        scenarioId,
        netMinor: sumScenarioNetForLiveFilledUnits(completion.legs, matrixTerms, scenarioId),
      }),
    ),
  );

  const firstScenarioNet = scenarioNets[0];
  if (!firstScenarioNet) {
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
      exposedLegIds: Object.freeze(exposedLegIds),
      excludedLegIds: Object.freeze(excludedLegIds),
      scenarioNets,
      worstCaseNetMinor,
      worstCaseScenarioId,
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
    if (!plan || !contributionsByScenarioId) {
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

function supportsResidualExposureState(state: NonAtomicPaperLegState): boolean {
  return state === 'leg_open'
    || state === 'leg_reserved'
    || state === 'leg_partial'
    || state === 'leg_filled'
    || state === 'leg_rejected'
    || state === 'leg_expired'
    || state === 'leg_rolled_back';
}

function isNonAtomicCompletionEventType(value: string): value is NonAtomicCompletionEventType {
  return NON_ATOMIC_COMPLETION_EVENT_TYPES.includes(value as NonAtomicCompletionEventType);
}

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}
