import { accepted, blocked, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const PAPER_LEG_COMPLETION_STATES = [
  'leg_open',
  'leg_reserved',
  'leg_filled',
  'leg_failed',
  'leg_stale',
  'leg_settlement_pending',
] as const;

export const PAPER_GROUP_COMPLETION_STATES = [
  'group_open',
  'group_reserved',
  'group_settlement_pending',
  'group_complete',
  'group_incomplete',
  'group_killed',
] as const;

export type PaperLegCompletionState = (typeof PAPER_LEG_COMPLETION_STATES)[number];
export type PaperGroupCompletionState = (typeof PAPER_GROUP_COMPLETION_STATES)[number];

export interface PaperLegCompletionSnapshot {
  readonly legId: string;
  readonly state: PaperLegCompletionState;
  readonly reservedStakeMinor: bigint;
  readonly filledStakeMinor: bigint;
  readonly updatedAt: IsoTimestamp;
}

export interface PaperGroupCompletionInput {
  readonly legs: readonly PaperLegCompletionSnapshot[];
  readonly manualKill: boolean;
}

export interface PaperGroupCompletionSnapshot {
  readonly groupState: PaperGroupCompletionState;
  readonly manualKill: boolean;
  readonly legs: readonly PaperLegCompletionSnapshot[];
}

export function simulatePaperGroupCompletion(
  input: PaperGroupCompletionInput,
): BoundaryResult<PaperGroupCompletionSnapshot> {
  if (input.legs.length === 0) {
    return blocked(
      'LEG_COMPLETION_LEGS_EMPTY',
      'Leg completion simulation requires at least one local paper leg.',
      'One or more local paper leg completion snapshots.',
    );
  }

  const seenLegIds = new Set<string>();
  const validatedLegs: PaperLegCompletionSnapshot[] = [];
  for (const leg of input.legs) {
    if (leg.legId.trim().length === 0) {
      return blocked(
        'LEG_COMPLETION_LEG_ID_MISSING',
        'Leg completion simulation requires a non-empty leg id.',
        'Stable local paper leg id for each completion snapshot.',
      );
    }
    if (seenLegIds.has(leg.legId)) {
      return blocked(
        'LEG_COMPLETION_DUPLICATE_LEG_ID',
        'Leg completion simulation requires exactly one completion snapshot per leg id.',
        'Unique local paper leg ids for the completion group.',
      );
    }
    if (!isPaperLegCompletionState(leg.state)) {
      return blocked(
        'LEG_COMPLETION_STATE_INVALID',
        'Leg completion simulation requires a supported local paper leg state.',
        'Supported local paper leg completion state.',
      );
    }
    if (!isIsoTimestamp(leg.updatedAt)) {
      return blocked(
        'LEG_COMPLETION_TIMESTAMP_INVALID',
        'Leg completion simulation requires ISO-8601 UTC timestamps for each leg snapshot.',
        'ISO-8601 UTC completion timestamps for each local paper leg.',
      );
    }
    if (leg.reservedStakeMinor < 0n || leg.filledStakeMinor < 0n) {
      return blocked(
        'LEG_COMPLETION_STAKE_NEGATIVE',
        'Leg completion simulation requires non-negative reserved and filled stake amounts.',
        'Non-negative local paper reserved and filled stake amounts.',
      );
    }

    const shapeValidation = validateStakeShapeForState(leg);
    if (!shapeValidation.ok) {
      return shapeValidation;
    }

    seenLegIds.add(leg.legId);
    validatedLegs.push(Object.freeze({ ...leg }));
  }

  return accepted(
    Object.freeze({
      groupState: deriveGroupState(validatedLegs, input.manualKill),
      manualKill: input.manualKill,
      legs: Object.freeze(validatedLegs),
    }),
  );
}

function deriveGroupState(
  legs: readonly PaperLegCompletionSnapshot[],
  manualKill: boolean,
): PaperGroupCompletionState {
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

  if (legs.every((leg) => leg.state === 'leg_filled' || leg.state === 'leg_settlement_pending')) {
    return legs.some((leg) => leg.state === 'leg_settlement_pending') ? 'group_settlement_pending' : 'group_complete';
  }

  return 'group_incomplete';
}

function validateStakeShapeForState(
  leg: PaperLegCompletionSnapshot,
): BoundaryResult<PaperLegCompletionSnapshot> {
  switch (leg.state) {
    case 'leg_open':
    case 'leg_failed':
    case 'leg_stale':
      if (leg.reservedStakeMinor !== 0n || leg.filledStakeMinor !== 0n) {
        return blocked(
          'LEG_COMPLETION_STATE_STAKE_MISMATCH',
          `Leg state ${leg.state} requires zero reserved and zero filled stake.`,
          'State-aligned local paper stake amounts for each leg snapshot.',
        );
      }
      break;
    case 'leg_reserved':
      if (leg.reservedStakeMinor <= 0n || leg.filledStakeMinor !== 0n) {
        return blocked(
          'LEG_COMPLETION_STATE_STAKE_MISMATCH',
          'Reserved legs require positive reserved stake and zero filled stake.',
          'State-aligned local paper stake amounts for each leg snapshot.',
        );
      }
      break;
    case 'leg_filled':
    case 'leg_settlement_pending':
      if (leg.reservedStakeMinor !== 0n || leg.filledStakeMinor <= 0n) {
        return blocked(
          'LEG_COMPLETION_STATE_STAKE_MISMATCH',
          `Leg state ${leg.state} requires zero reserved stake and positive filled stake.`,
          'State-aligned local paper stake amounts for each leg snapshot.',
        );
      }
      break;
  }

  return accepted(leg);
}

function isPaperLegCompletionState(value: string): value is PaperLegCompletionState {
  return PAPER_LEG_COMPLETION_STATES.includes(value as PaperLegCompletionState);
}

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}
