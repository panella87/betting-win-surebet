import type { Blocker } from '../contracts/local-types.js';
import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';

export interface B1FalsePositiveObservation {
  readonly candidateId: string;
  readonly settlementStatus: 'accepted' | 'blocked';
  readonly settledNetMinor?: bigint;
  readonly falsePositive?: boolean;
  readonly blockers?: readonly Blocker[];
}

export interface B1FalsePositiveReport {
  readonly reportKind: 'deterministic_b1_false_positive_report';
  readonly candidateCount: number;
  readonly acceptedSettlementCount: number;
  readonly blockedSettlementCount: number;
  readonly falsePositiveCount: number;
  readonly falsePositiveRateBps: bigint;
  readonly settlementMismatchBlockCount: number;
  readonly voidRuleMismatchBlockCount: number;
  readonly settlementCompatibilityBlockCount: number;
  readonly observations: readonly B1FalsePositiveObservation[];
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

export function createB1FalsePositiveReport(
  observations: readonly B1FalsePositiveObservation[],
): BoundaryResult<B1FalsePositiveReport> {
  if (observations.length === 0) {
    return blocked(
      'B1_FALSE_POSITIVE_OBSERVATIONS_EMPTY',
      'B1 false-positive reporting requires at least one settlement replay observation.',
      'B1 settlement replay observations for false-positive analysis.',
    );
  }

  let acceptedSettlementCount = 0;
  let blockedSettlementCount = 0;
  let falsePositiveCount = 0;
  let settlementMismatchBlockCount = 0;
  let voidRuleMismatchBlockCount = 0;
  let settlementCompatibilityBlockCount = 0;
  const frozenObservations: B1FalsePositiveObservation[] = [];

  for (const observation of observations) {
    const validation = validateB1FalsePositiveObservation(observation);
    if (!validation.ok) {
      return validation;
    }
    frozenObservations.push(validation.value);

    if (observation.settlementStatus === 'accepted') {
      acceptedSettlementCount += 1;
      if (observation.falsePositive === true) {
        falsePositiveCount += 1;
      }
    } else {
      blockedSettlementCount += 1;
      const blockers = observation.blockers as readonly Blocker[];
      settlementMismatchBlockCount += blockers.filter((blocker) => (
        blocker.code === 'B1_SETTLEMENT_RULE_MISMATCH'
          || blocker.code === 'B1_SETTLEMENT_REPLAY_SCENARIO_CONFLICT'
          || blocker.code === 'B1_SETTLEMENT_REPLAY_CORRECTION_CONFLICT'
      )).length;
      voidRuleMismatchBlockCount += blockers.filter((blocker) => blocker.code === 'B1_VOID_RULE_MISMATCH').length;
      settlementCompatibilityBlockCount += blockers.filter((blocker) => (
        blocker.code === 'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN'
          || blocker.code === 'B1_BLOCKED_SETTLEMENT_COMPATIBILITY'
      )).length;
    }
  }

  if (acceptedSettlementCount === 0) {
    return blocked(
      'B1_FALSE_POSITIVE_RATE_DENOMINATOR_MISSING',
      'B1 false-positive reporting requires at least one accepted settlement replay to compute a deterministic rate.',
      'At least one accepted B1 settlement replay observation.',
    );
  }

  return accepted(Object.freeze({
    reportKind: 'deterministic_b1_false_positive_report',
    candidateCount: observations.length,
    acceptedSettlementCount,
    blockedSettlementCount,
    falsePositiveCount,
    falsePositiveRateBps: (BigInt(falsePositiveCount) * 10_000n) / BigInt(acceptedSettlementCount),
    settlementMismatchBlockCount,
    voidRuleMismatchBlockCount,
    settlementCompatibilityBlockCount,
    observations: Object.freeze(frozenObservations),
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  }));
}

function validateB1FalsePositiveObservation(
  observation: B1FalsePositiveObservation,
): BoundaryResult<B1FalsePositiveObservation> {
  if (observation.candidateId.trim().length === 0) {
    return blocked(
      'B1_FALSE_POSITIVE_CANDIDATE_ID_MISSING',
      'B1 false-positive reporting requires stable non-empty candidate ids.',
      'Stable B1 false-positive observation candidate ids.',
    );
  }

  if (observation.settlementStatus === 'accepted') {
    if (observation.settledNetMinor === undefined || observation.falsePositive === undefined) {
      return blocked(
        'B1_FALSE_POSITIVE_ACCEPTED_OBSERVATION_INCOMPLETE',
        'B1 false-positive reporting requires settled net and false-positive status for accepted settlement replays.',
        'Accepted B1 settlement replay observation with settledNetMinor and falsePositive fields.',
      );
    }
    if (observation.blockers !== undefined) {
      return blocked(
        'B1_FALSE_POSITIVE_ACCEPTED_BLOCKERS_UNEXPECTED',
        'B1 false-positive reporting forbids blockers on accepted settlement replay observations.',
        'Accepted B1 settlement replay observations without blockers.',
      );
    }
    return accepted(Object.freeze({
      candidateId: observation.candidateId,
      settlementStatus: observation.settlementStatus,
      settledNetMinor: observation.settledNetMinor,
      falsePositive: observation.falsePositive,
    }));
  }

  if (observation.settlementStatus === 'blocked') {
    if (observation.blockers === undefined || observation.blockers.length === 0) {
      return blocked(
        'B1_FALSE_POSITIVE_BLOCKED_OBSERVATION_INCOMPLETE',
        'B1 false-positive reporting requires blocker evidence for blocked settlement replays.',
        'Blocked B1 settlement replay observation with explicit blockers.',
      );
    }
    if (observation.settledNetMinor !== undefined || observation.falsePositive !== undefined) {
      return blocked(
        'B1_FALSE_POSITIVE_BLOCKED_NET_UNEXPECTED',
        'B1 false-positive reporting forbids settled net metrics on blocked settlement replay observations.',
        'Blocked B1 settlement replay observations with blocker evidence only.',
      );
    }
    return accepted(Object.freeze({
      candidateId: observation.candidateId,
      settlementStatus: observation.settlementStatus,
      blockers: Object.freeze(observation.blockers.map((blocker) => Object.freeze({ ...blocker }))),
    }));
  }

  return blocked(
    'B1_FALSE_POSITIVE_STATUS_INVALID',
    'B1 false-positive reporting requires accepted or blocked settlement replay status.',
    'B1 false-positive observation settlementStatus accepted or blocked.',
  );
}
