import {
  accepted,
  blocked,
  type BoundaryResult,
  type IsoTimestamp,
} from '../contracts/local-types.js';
import {
  validateB1ScenarioCashflowMatrix,
  type B1ScenarioCashflowMatrix,
} from '../scenarios/b1-scenario-cashflow.js';
import type { B1GeneralizedStakeVectorSolution } from '../solver/b1-generalized-stake-vector.js';
import {
  analyzeB1ResidualExposure,
  type B1ResidualExposureAnalysis,
  type B1ResidualExposureLeg,
} from './b1-residual-exposure.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const B1_FILLABILITY_EVENT_TYPES = [
  'fill',
  'reject',
  'timeout',
] as const;

export type B1FillabilityEventType = (typeof B1_FILLABILITY_EVENT_TYPES)[number];
export type B1FillabilityLegState =
  | 'leg_open'
  | 'leg_partial'
  | 'leg_filled'
  | 'leg_rejected'
  | 'leg_timed_out';
export type B1FillabilityGroupState = 'group_filled' | 'group_incomplete';
export type B1FillabilityTerminalDisposition = 'none' | 'rejected' | 'timed_out';

export interface B1FillabilityEvent {
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly type: B1FillabilityEventType;
  readonly occurredAtUtc: IsoTimestamp;
  readonly stakeMinor?: bigint;
}

export interface B1FillabilityLegSnapshot {
  readonly legId: string;
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly plannedStakeMinor: bigint;
  readonly liveFilledStakeMinor: bigint;
  readonly unfilledStakeMinor: bigint;
  readonly terminalDisposition: B1FillabilityTerminalDisposition;
  readonly updatedAtUtc: IsoTimestamp;
  readonly state: B1FillabilityLegState;
}

export interface B1FillabilitySimulation {
  readonly simulationKind: 'deterministic_b1_fill_rejection_timeout_simulation';
  readonly candidateId: string;
  readonly groupState: B1FillabilityGroupState;
  readonly legs: readonly B1FillabilityLegSnapshot[];
  readonly residualExposure?: B1ResidualExposureAnalysis;
  readonly executable: false;
  readonly unwindAttempted: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

export interface B1FillabilitySimulationInput {
  readonly stakeVector: B1GeneralizedStakeVectorSolution;
  readonly events: readonly B1FillabilityEvent[];
  readonly maxResidualExposureMinor: bigint;
}

interface B1FillabilityLegAccumulator {
  readonly legId: string;
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly plannedStakeMinor: bigint;
  liveFilledStakeMinor: bigint;
  terminalDisposition: B1FillabilityTerminalDisposition;
  updatedAtUtc: IsoTimestamp;
}

export function simulateB1FillRejectionTimeout(
  input: B1FillabilitySimulationInput,
): BoundaryResult<B1FillabilitySimulation> {
  const inputValidation = validateB1FillabilityInput(input);
  if (!inputValidation.ok) {
    return inputValidation;
  }

  const replayed = replayB1FillabilityEvents(inputValidation.value.legsByKey, input.events);
  if (!replayed.ok) {
    return replayed;
  }

  const legs = replayed.value.map((leg) => freezeB1FillabilityLegSnapshot(leg));
  const groupState = deriveB1FillabilityGroupState(legs);
  if (groupState === 'group_filled') {
    return accepted(Object.freeze({
      simulationKind: 'deterministic_b1_fill_rejection_timeout_simulation',
      candidateId: input.stakeVector.candidateId,
      groupState,
      legs: Object.freeze(legs),
      executable: false,
      unwindAttempted: false,
      liveReadiness: 'not_authorized_bws_900_parked',
    }));
  }

  const residualExposure = analyzeB1ResidualExposure(
    inputValidation.value.scenarioCashflowMatrix,
    legs.map((leg) => toB1ResidualExposureLeg(leg)),
    input.maxResidualExposureMinor,
  );
  if (!residualExposure.ok) {
    return residualExposure;
  }
  if (!residualExposure.value.residualExposureWithinLimit) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LIMIT_EXCEEDED',
      'B1 fillability simulation requires residual exposure to stay within the configured limit.',
      'Worst-case B1 residual exposure within maxResidualExposureMinor.',
    );
  }

  return accepted(Object.freeze({
    simulationKind: 'deterministic_b1_fill_rejection_timeout_simulation',
    candidateId: input.stakeVector.candidateId,
    groupState,
    legs: Object.freeze(legs),
    residualExposure: residualExposure.value,
    executable: false,
    unwindAttempted: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  }));
}

function validateB1FillabilityInput(
  input: B1FillabilitySimulationInput,
): BoundaryResult<{
  readonly legsByKey: ReadonlyMap<string, B1FillabilityLegAccumulator>;
  readonly scenarioCashflowMatrix: B1ScenarioCashflowMatrix;
}> {
  if (typeof input !== 'object' || input === null || Array.isArray(input) || !Array.isArray(input.events)) {
    return blocked(
      'B1_FILLABILITY_INPUT_MISSING',
      'B1 fillability simulation requires an explicit stake vector, event list and residual exposure limit.',
      'Explicit B1 fillability simulation input.',
    );
  }
  if (
    typeof input.stakeVector !== 'object'
    || input.stakeVector === null
    || Array.isArray(input.stakeVector)
    || input.stakeVector.ok !== true
  ) {
    return blocked(
      'B1_FILLABILITY_REQUIRES_ACCEPTED_STAKE_VECTOR',
      'B1 fillability simulation requires an accepted generalized stake-vector solution.',
      'Accepted B1 generalized stake-vector solution.',
    );
  }
  if (
    typeof input.stakeVector.candidateId !== 'string'
    || !Array.isArray(input.stakeVector.stakes)
    || typeof input.stakeVector.scenarioCashflowMatrix !== 'object'
    || input.stakeVector.scenarioCashflowMatrix === null
    || Array.isArray(input.stakeVector.scenarioCashflowMatrix)
    || !Array.isArray(input.stakeVector.scenarioCashflowMatrix.rows)
  ) {
    return blocked(
      'B1_FILLABILITY_STAKE_VECTOR_INVALID',
      'B1 fillability simulation requires a structured accepted stake-vector solution.',
      'Accepted B1 generalized stake-vector solution with stakes and scenario matrix.',
    );
  }
  if (input.events.length === 0) {
    return blocked(
      'B1_FILLABILITY_EVENTS_EMPTY',
      'B1 fillability simulation requires explicit fill, rejection or timeout evidence.',
      'Explicit B1 fillability events.',
    );
  }
  if (typeof input.maxResidualExposureMinor !== 'bigint' || input.maxResidualExposureMinor < 0n) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
      'B1 fillability simulation requires a non-negative explicit residual exposure limit.',
      'Non-negative B1 residual exposure limit in integer minor units.',
    );
  }
  const matrixValidation = validateB1ScenarioCashflowMatrix(input.stakeVector.scenarioCashflowMatrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }

  const legsByKey = new Map<string, B1FillabilityLegAccumulator>();
  for (const stake of input.stakeVector.stakes) {
    if (
      typeof stake !== 'object'
      || stake === null
      || Array.isArray(stake)
      || typeof stake.selectionEquivalenceKey !== 'string'
      || typeof stake.venueOrBookmakerId !== 'string'
      || typeof stake.stakeMinor !== 'bigint'
    ) {
      return blocked(
        'B1_FILLABILITY_STAKE_VECTOR_INVALID',
        'B1 fillability simulation requires structured solved stake-vector legs.',
        'Accepted B1 generalized stake-vector solution with structured solved legs.',
      );
    }
    const legId = buildB1FillabilityLegId(stake.selectionEquivalenceKey, stake.venueOrBookmakerId);
    const key = buildB1FillabilityLegKey(stake.selectionEquivalenceKey, stake.venueOrBookmakerId);
    if (stake.selectionEquivalenceKey.length === 0) {
      return blocked(
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1 fillability simulation requires selection equivalence evidence for every solved leg.',
        'B1 solved stake-vector leg selection_equivalence_key.',
      );
    }
    if (stake.venueOrBookmakerId.length === 0) {
      return blocked(
        'B1_VENUE_PAIR_INCOMPLETE',
        'B1 fillability simulation requires venue evidence for every solved leg.',
        'B1 solved stake-vector leg venue_or_bookmaker_id.',
      );
    }
    if (stake.stakeMinor <= 0n) {
      return blocked(
        'B1_STAKE_NOT_POSITIVE',
        'B1 fillability simulation requires positive solved stake amounts.',
        'Positive B1 solved stake in integer minor units.',
      );
    }
    if (legsByKey.has(key)) {
      return blocked(
        'B1_FILLABILITY_LEG_DUPLICATE',
        'B1 fillability simulation requires one solved leg per selection and venue.',
        'Unique B1 solved legs keyed by selection_equivalence_key and venue_or_bookmaker_id.',
      );
    }
    legsByKey.set(key, {
      legId,
      selectionEquivalenceKey: stake.selectionEquivalenceKey,
      venueOrBookmakerId: stake.venueOrBookmakerId,
      plannedStakeMinor: stake.stakeMinor,
      liveFilledStakeMinor: 0n,
      terminalDisposition: 'none',
      updatedAtUtc: '1970-01-01T00:00:00.000Z',
    });
  }

  return accepted(Object.freeze({
    legsByKey,
    scenarioCashflowMatrix: matrixValidation.value,
  }));
}

function replayB1FillabilityEvents(
  legsByKey: ReadonlyMap<string, B1FillabilityLegAccumulator>,
  events: readonly B1FillabilityEvent[],
): BoundaryResult<readonly B1FillabilityLegAccumulator[]> {
  const replayLegsByKey = new Map<string, B1FillabilityLegAccumulator>();
  for (const [key, leg] of legsByKey.entries()) {
    replayLegsByKey.set(key, { ...leg });
  }

  for (const event of events) {
    const eventValidation = validateB1FillabilityEvent(event);
    if (!eventValidation.ok) {
      return eventValidation;
    }
  }

  const timestampTieValidation = validateNoSameLegTimestampTies(events);
  if (!timestampTieValidation.ok) {
    return timestampTieValidation;
  }

  const indexedEvents = events.map((event, index) => ({ event, index }));
  indexedEvents.sort((left, right) => {
    const timestampOrder = left.event.occurredAtUtc.localeCompare(right.event.occurredAtUtc);
    if (timestampOrder !== 0) {
      return timestampOrder;
    }
    return left.index - right.index;
  });

  for (const { event } of indexedEvents) {
    const leg = replayLegsByKey.get(buildB1FillabilityLegKey(event.selectionEquivalenceKey, event.venueOrBookmakerId));
    if (leg === undefined) {
      return blocked(
        'B1_FILLABILITY_EVENT_TARGET_UNKNOWN',
        'B1 fillability simulation requires every event to target a solved B1 stake-vector leg.',
        'B1 fillability events aligned to solved selection and venue legs.',
      );
    }

    const applied = applyB1FillabilityEvent(leg, event);
    if (!applied.ok) {
      return applied;
    }
  }

  return accepted(Object.freeze(
    [...replayLegsByKey.values()]
      .sort(compareB1FillabilityLegs)
      .map((leg) => Object.freeze({ ...leg })),
  ));
}

function validateB1FillabilityEvent(event: B1FillabilityEvent): BoundaryResult<undefined> {
  if (typeof event !== 'object' || event === null || Array.isArray(event)) {
    return blocked(
      'B1_FILLABILITY_EVENT_INVALID',
      'B1 fillability simulation requires structured fillability events.',
      'Structured B1 fillability event objects.',
    );
  }
  if (
    typeof event.selectionEquivalenceKey !== 'string'
    || typeof event.venueOrBookmakerId !== 'string'
    || typeof event.type !== 'string'
    || typeof event.occurredAtUtc !== 'string'
  ) {
    return blocked(
      'B1_FILLABILITY_EVENT_INVALID',
      'B1 fillability simulation requires typed event identity, type and timestamp fields.',
      'B1 fillability event fields encoded with the expected runtime types.',
    );
  }
  if (event.selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 fillability events require selection equivalence evidence.',
      'B1 fillability event selection_equivalence_key.',
    );
  }
  if (event.venueOrBookmakerId.length === 0) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 fillability events require venue evidence.',
      'B1 fillability event venue_or_bookmaker_id.',
    );
  }
  if (!isIsoTimestamp(event.occurredAtUtc)) {
    return blocked(
      'B1_FILLABILITY_EVENT_TIMESTAMP_INVALID',
      'B1 fillability simulation requires ISO-8601 UTC timestamps for every event.',
      'ISO-8601 UTC B1 fillability event timestamps.',
    );
  }

  const eventType = event.type as string;
  if (eventType === 'rollback' || eventType === 'unwind') {
    return blocked(
      'B1_FILLABILITY_UNWIND_FORBIDDEN',
      'B1 fillability simulation forbids rollback or unwind events for cross-venue B1 candidates.',
      'Fill, reject or timeout events only; no unwind or execution mitigation.',
    );
  }
  if (!isB1FillabilityEventType(eventType)) {
    return blocked(
      'B1_FILLABILITY_EVENT_TYPE_INVALID',
      'B1 fillability simulation requires fill, reject or timeout event types.',
      'Supported B1 fill, reject and timeout events.',
    );
  }

  if (event.type === 'fill') {
    if (typeof event.stakeMinor !== 'bigint' || event.stakeMinor <= 0n) {
      return blocked(
        'B1_FILLABILITY_FILL_STAKE_INVALID',
        'B1 fillability fill events require a positive integer minor-unit stake.',
        'Positive B1 fill stake in integer minor units.',
      );
    }
    return accepted(undefined);
  }

  if (event.stakeMinor !== undefined) {
    return blocked(
      'B1_FILLABILITY_TERMINAL_STAKE_UNEXPECTED',
      'B1 fillability reject and timeout events must not include a stake amount.',
      'Stake-free B1 reject and timeout events.',
    );
  }
  return accepted(undefined);
}

function validateNoSameLegTimestampTies(
  events: readonly B1FillabilityEvent[],
): BoundaryResult<undefined> {
  const seenLegTimestamps = new Set<string>();
  for (const event of events) {
    const key = `${event.selectionEquivalenceKey}\u0000${event.venueOrBookmakerId}\u0000${event.occurredAtUtc}`;
    if (seenLegTimestamps.has(key)) {
      return blocked(
        'B1_FILLABILITY_SAME_LEG_TIMESTAMP_AMBIGUOUS',
        'B1 fillability simulation rejects same-leg events with identical timestamps.',
        'Unambiguous B1 fillability event ordering per leg and timestamp.',
      );
    }
    seenLegTimestamps.add(key);
  }
  return accepted(undefined);
}

function applyB1FillabilityEvent(
  leg: B1FillabilityLegAccumulator,
  event: B1FillabilityEvent,
): BoundaryResult<undefined> {
  if (event.type === 'fill') {
    if (leg.terminalDisposition !== 'none') {
      return blocked(
        'B1_FILLABILITY_FILL_AFTER_TERMINAL_FORBIDDEN',
        'B1 fillability simulation does not allow fills after rejection or timeout.',
        'Event order that does not fill a terminally rejected or timed-out leg.',
      );
    }
    leg.liveFilledStakeMinor += event.stakeMinor as bigint;
    if (leg.liveFilledStakeMinor > leg.plannedStakeMinor) {
      return blocked(
        'B1_FILLABILITY_FILL_EXCEEDS_PLAN',
        'B1 fillability simulation requires filled stake to stay within the solved stake plan.',
        'B1 fills bounded by the solved generalized stake vector.',
      );
    }
    leg.updatedAtUtc = event.occurredAtUtc;
    return accepted(undefined);
  }

  if (leg.terminalDisposition !== 'none') {
    return blocked(
      'B1_FILLABILITY_TERMINAL_DUPLICATE',
      'B1 fillability simulation allows at most one rejection or timeout marker per leg.',
      'One terminal B1 reject or timeout event for each incomplete leg.',
    );
  }
  if (leg.liveFilledStakeMinor === leg.plannedStakeMinor) {
    return blocked(
      'B1_FILLABILITY_TERMINAL_AFTER_FULL_FILL',
      'B1 fillability simulation does not allow rejection or timeout after a leg is fully filled.',
      'Terminal B1 reject or timeout events only for legs that still have unfilled stake.',
    );
  }
  leg.terminalDisposition = event.type === 'reject' ? 'rejected' : 'timed_out';
  leg.updatedAtUtc = event.occurredAtUtc;
  return accepted(undefined);
}

function freezeB1FillabilityLegSnapshot(
  leg: B1FillabilityLegAccumulator,
): B1FillabilityLegSnapshot {
  return Object.freeze({
    legId: leg.legId,
    selectionEquivalenceKey: leg.selectionEquivalenceKey,
    venueOrBookmakerId: leg.venueOrBookmakerId,
    plannedStakeMinor: leg.plannedStakeMinor,
    liveFilledStakeMinor: leg.liveFilledStakeMinor,
    unfilledStakeMinor: leg.plannedStakeMinor - leg.liveFilledStakeMinor,
    terminalDisposition: leg.terminalDisposition,
    updatedAtUtc: leg.updatedAtUtc,
    state: deriveB1FillabilityLegState(leg),
  });
}

function deriveB1FillabilityLegState(leg: B1FillabilityLegAccumulator): B1FillabilityLegState {
  if (leg.liveFilledStakeMinor === leg.plannedStakeMinor) {
    return 'leg_filled';
  }
  if (leg.liveFilledStakeMinor > 0n) {
    return 'leg_partial';
  }
  if (leg.terminalDisposition === 'rejected') {
    return 'leg_rejected';
  }
  if (leg.terminalDisposition === 'timed_out') {
    return 'leg_timed_out';
  }
  return 'leg_open';
}

function deriveB1FillabilityGroupState(
  legs: readonly B1FillabilityLegSnapshot[],
): B1FillabilityGroupState {
  return legs.every((leg) => leg.state === 'leg_filled') ? 'group_filled' : 'group_incomplete';
}

function toB1ResidualExposureLeg(leg: B1FillabilityLegSnapshot): B1ResidualExposureLeg {
  return Object.freeze({
    legId: leg.legId,
    selectionEquivalenceKey: leg.selectionEquivalenceKey,
    venueOrBookmakerId: leg.venueOrBookmakerId,
    plannedStakeMinor: leg.plannedStakeMinor,
    liveFilledStakeMinor: leg.liveFilledStakeMinor,
  });
}

function isB1FillabilityEventType(value: string): value is B1FillabilityEventType {
  return B1_FILLABILITY_EVENT_TYPES.includes(value as B1FillabilityEventType);
}

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function compareB1FillabilityLegs(
  left: B1FillabilityLegAccumulator,
  right: B1FillabilityLegAccumulator,
): number {
  const selectionComparison = left.selectionEquivalenceKey.localeCompare(right.selectionEquivalenceKey);
  if (selectionComparison !== 0) {
    return selectionComparison;
  }
  return left.venueOrBookmakerId.localeCompare(right.venueOrBookmakerId);
}

function buildB1FillabilityLegId(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `b1_leg:${selectionEquivalenceKey}:${venueOrBookmakerId}`;
}

function buildB1FillabilityLegKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}\u0000${venueOrBookmakerId}`;
}
