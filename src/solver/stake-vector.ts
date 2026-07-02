import { accepted, blocked, type BoundaryResult, type CapacityConstraint } from '../contracts/local-types.js';
import { type ScenarioCashflowMatrix, validateScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import { validateCapacityConstraint } from './constraints.js';

export interface StakeVectorRoundingConstraint {
  readonly legId: string;
  readonly stepMinor: bigint;
}

export interface StakeVectorInputContract {
  readonly matrix: ScenarioCashflowMatrix;
  readonly capacityConstraints: readonly CapacityConstraint[];
  readonly roundingConstraints: readonly StakeVectorRoundingConstraint[];
}

export interface SolvedStakeVectorLeg {
  readonly legId: string;
  readonly unitCount: bigint;
  readonly stakeQuantumMinor: bigint;
  readonly stakeMinor: bigint;
}

export interface StakeVectorScenarioNet {
  readonly scenarioId: string;
  readonly netMinor: bigint;
}

export interface StakeVectorSolution {
  readonly stakes: readonly SolvedStakeVectorLeg[];
  readonly scenarioNets: readonly StakeVectorScenarioNet[];
  readonly worstCaseNetMinor: bigint;
}

interface SolverLegTerms {
  readonly legId: string;
  readonly quantumMinor: bigint;
  readonly minUnits: bigint;
  readonly maxUnits: bigint;
  readonly winningScenarioId: string;
  readonly contributionsByScenarioId: ReadonlyMap<string, bigint>;
}

export function solveStandardBinaryStakeVector(input: StakeVectorInputContract): BoundaryResult<StakeVectorSolution> {
  const matrixValidation = validateScenarioCashflowMatrix(input.matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }

  const scenarioIds = [...new Set(input.matrix.rows.map((row) => row.scenarioId))].sort();
  const legIds = [...new Set(input.matrix.rows.map((row) => row.legId))].sort();
  if (scenarioIds.length !== 2 || legIds.length !== 2) {
    return blocked(
      'STAKE_VECTOR_MATRIX_NOT_STANDARD_BINARY',
      'Stake-vector solving requires exactly two terminal scenarios and two complete-set legs.',
      'Validated standard-binary scenario cash-flow rows.',
    );
  }

  const capacityByLeg = new Map<string, CapacityConstraint>();
  for (const constraint of input.capacityConstraints) {
    const validatedConstraint = validateCapacityConstraint(constraint);
    if (!validatedConstraint.ok) {
      return validatedConstraint;
    }
    if (capacityByLeg.has(validatedConstraint.value.legId)) {
      return blocked(
        'STAKE_VECTOR_CAPACITY_DUPLICATE',
        'Stake-vector solving requires exactly one capacity constraint per leg.',
        'One local min/max capacity constraint for each complete-set leg.',
      );
    }
    capacityByLeg.set(validatedConstraint.value.legId, validatedConstraint.value);
  }

  const roundingByLeg = new Map<string, StakeVectorRoundingConstraint>();
  for (const constraint of input.roundingConstraints) {
    if (constraint.stepMinor <= 0n) {
      return blocked(
        'STAKE_VECTOR_ROUNDING_STEP_INVALID',
        'Stake-vector solving requires a positive rounding step for every leg.',
        'Positive local stake rounding step for each complete-set leg.',
      );
    }
    if (roundingByLeg.has(constraint.legId)) {
      return blocked(
        'STAKE_VECTOR_ROUNDING_DUPLICATE',
        'Stake-vector solving requires exactly one rounding constraint per leg.',
        'One local stake rounding step for each complete-set leg.',
      );
    }
    roundingByLeg.set(constraint.legId, Object.freeze({ ...constraint }));
  }

  const legTerms: SolverLegTerms[] = [];
  for (const legId of legIds) {
    const capacity = capacityByLeg.get(legId);
    if (!capacity) {
      return blocked(
        'STAKE_VECTOR_CAPACITY_MISSING',
        'Stake-vector solving requires a capacity constraint for every leg.',
        'One local min/max capacity constraint for each complete-set leg.',
      );
    }

    const rounding = roundingByLeg.get(legId);
    if (!rounding) {
      return blocked(
        'STAKE_VECTOR_ROUNDING_MISSING',
        'Stake-vector solving requires a rounding constraint for every leg.',
        'One local stake rounding step for each complete-set leg.',
      );
    }

    const rowsForLeg = input.matrix.rows.filter((row) => row.legId === legId);
    const extractedTerms = extractSolverLegTerms(legId, rowsForLeg, scenarioIds, capacity, rounding);
    if (!extractedTerms.ok) {
      return extractedTerms;
    }
    legTerms.push(extractedTerms.value);
  }

  const legA = legTerms[0];
  const legB = legTerms[1];
  if (!legA || !legB) {
    return blocked(
      'STAKE_VECTOR_MATRIX_NOT_STANDARD_BINARY',
      'Stake-vector solving requires exactly two terminal scenarios and two complete-set legs.',
      'Validated standard-binary scenario cash-flow rows.',
    );
  }
  if (legA.winningScenarioId === legB.winningScenarioId) {
    return blocked(
      'STAKE_VECTOR_WINNING_SCENARIOS_INVALID',
      'Stake-vector solving requires the two legs to win different terminal scenarios.',
      'Standard-binary scenario rows with one winner per outcome.',
    );
  }

  const scenarioAId = legA.winningScenarioId;
  const scenarioBId = legB.winningScenarioId;
  const scenarioALegAContribution = legA.contributionsByScenarioId.get(scenarioAId);
  const scenarioALegBContribution = legB.contributionsByScenarioId.get(scenarioAId);
  const scenarioBLegAContribution = legA.contributionsByScenarioId.get(scenarioBId);
  const scenarioBLegBContribution = legB.contributionsByScenarioId.get(scenarioBId);
  if (
    scenarioALegAContribution === undefined ||
    scenarioALegBContribution === undefined ||
    scenarioBLegAContribution === undefined ||
    scenarioBLegBContribution === undefined
  ) {
    return blocked(
      'STAKE_VECTOR_SCENARIO_ALIGNMENT_INVALID',
      'Stake-vector solving requires every leg to include rows for every terminal scenario.',
      'Complete standard-binary scenario cash-flow coverage for each leg.',
    );
  }

  if (
    scenarioALegAContribution <= 0n ||
    scenarioALegBContribution >= 0n ||
    scenarioBLegAContribution >= 0n ||
    scenarioBLegBContribution <= 0n
  ) {
    return blocked(
      'STAKE_VECTOR_CONTRIBUTIONS_INSUFFICIENT',
      'Stake-vector solving requires one positive winner contribution and one negative loser contribution in each terminal scenario.',
      'Local stake, payout, fee, and cost rows that preserve standard-binary payoff shape.',
    );
  }

  const lossFromLegBInScenarioA = -scenarioALegBContribution;
  const lossFromLegAInScenarioB = -scenarioBLegAContribution;
  if (scenarioALegAContribution * scenarioBLegBContribution < lossFromLegAInScenarioB * lossFromLegBInScenarioA) {
    return blocked(
      'STAKE_VECTOR_WORST_CASE_NEGATIVE',
      'Stake-vector solving cannot reach non-negative worst-case exposure with the supplied local cash-flow rows.',
      'Local quote terms that can cover both standard-binary terminal scenarios.',
    );
  }

  let legAUnits = legA.minUnits;
  let legBUnits = legB.minUnits;
  for (;;) {
    const nextLegAUnits = maxBigInt(legA.minUnits, ceilDiv(lossFromLegBInScenarioA * legBUnits, scenarioALegAContribution));
    const nextLegBUnits = maxBigInt(legB.minUnits, ceilDiv(lossFromLegAInScenarioB * nextLegAUnits, scenarioBLegBContribution));
    if (nextLegAUnits > legA.maxUnits || nextLegBUnits > legB.maxUnits) {
      return blocked(
        'STAKE_VECTOR_CAPACITY_EXHAUSTED',
        'Stake-vector solving cannot fit a non-negative local paper stake vector inside the supplied capacity and rounding limits.',
        'Larger local capacity bounds or a tighter local scenario cash-flow matrix.',
      );
    }
    if (nextLegAUnits === legAUnits && nextLegBUnits === legBUnits) {
      break;
    }
    legAUnits = nextLegAUnits;
    legBUnits = nextLegBUnits;
  }

  const stakes = Object.freeze([
    Object.freeze({
      legId: legA.legId,
      unitCount: legAUnits,
      stakeQuantumMinor: legA.quantumMinor,
      stakeMinor: legAUnits * legA.quantumMinor,
    }),
    Object.freeze({
      legId: legB.legId,
      unitCount: legBUnits,
      stakeQuantumMinor: legB.quantumMinor,
      stakeMinor: legBUnits * legB.quantumMinor,
    }),
  ]);

  const scenarioNetsList: StakeVectorScenarioNet[] = [];
  for (const scenarioId of scenarioIds) {
    const legAContribution = legA.contributionsByScenarioId.get(scenarioId);
    const legBContribution = legB.contributionsByScenarioId.get(scenarioId);
    if (legAContribution === undefined || legBContribution === undefined) {
      return blocked(
        'STAKE_VECTOR_SCENARIO_ALIGNMENT_INVALID',
        'Stake-vector solving requires every leg to include rows for every terminal scenario.',
        'Complete standard-binary scenario cash-flow coverage for each leg.',
      );
    }
    scenarioNetsList.push(
      Object.freeze({
        scenarioId,
        netMinor: legAContribution * legAUnits + legBContribution * legBUnits,
      }),
    );
  }
  const scenarioNets = Object.freeze(scenarioNetsList);

  for (const scenarioNet of scenarioNets) {
    if (scenarioNet.netMinor < 0n) {
      return blocked(
        'STAKE_VECTOR_WORST_CASE_NEGATIVE',
        'Stake-vector solving cannot reach non-negative worst-case exposure with the supplied local cash-flow rows.',
        'Local quote terms that can cover both standard-binary terminal scenarios.',
      );
    }
  }

  const firstScenarioNet = scenarioNets[0];
  if (!firstScenarioNet) {
    return blocked(
      'STAKE_VECTOR_MATRIX_NOT_STANDARD_BINARY',
      'Stake-vector solving requires exactly two terminal scenarios and two complete-set legs.',
      'Validated standard-binary scenario cash-flow rows.',
    );
  }

  const worstCaseNetMinor = scenarioNets.reduce(
    (currentWorstCaseNetMinor, scenarioNet) =>
      scenarioNet.netMinor < currentWorstCaseNetMinor ? scenarioNet.netMinor : currentWorstCaseNetMinor,
    firstScenarioNet.netMinor,
  );

  return accepted(
    Object.freeze({
      stakes,
      scenarioNets,
      worstCaseNetMinor,
    }),
  );
}

function extractSolverLegTerms(
  legId: string,
  rows: readonly { scenarioId: string; legId: string; stakeMinor: bigint; payoutMinor: bigint; feeMinor: bigint; costMinor: bigint }[],
  scenarioIds: readonly string[],
  capacity: CapacityConstraint,
  rounding: StakeVectorRoundingConstraint,
): BoundaryResult<SolverLegTerms> {
  if (rows.length !== scenarioIds.length) {
    return blocked(
      'STAKE_VECTOR_SCENARIO_ALIGNMENT_INVALID',
      'Stake-vector solving requires every leg to include rows for every terminal scenario.',
      'Complete standard-binary scenario cash-flow coverage for each leg.',
    );
  }

  const uniqueScenarioIds = [...new Set(rows.map((row) => row.scenarioId))].sort();
  for (let index = 0; index < scenarioIds.length; index += 1) {
    if (uniqueScenarioIds[index] !== scenarioIds[index]) {
      return blocked(
        'STAKE_VECTOR_SCENARIO_ALIGNMENT_INVALID',
        'Stake-vector solving requires every leg to include rows for every terminal scenario.',
        'Complete standard-binary scenario cash-flow coverage for each leg.',
      );
    }
  }

  const referenceRow = rows[0];
  if (!referenceRow) {
    return blocked(
      'STAKE_VECTOR_SCENARIO_ALIGNMENT_INVALID',
      'Stake-vector solving requires every leg to include rows for every terminal scenario.',
      'Complete standard-binary scenario cash-flow coverage for each leg.',
    );
  }
  if (referenceRow.stakeMinor <= 0n) {
    return blocked(
      'STAKE_VECTOR_STAKE_INVALID',
      'Stake-vector solving requires positive fixed-point stake rows.',
      'Positive local stake rows for each complete-set leg.',
    );
  }

  const winningRows = rows.filter((row) => row.payoutMinor > 0n);
  if (winningRows.length !== 1) {
    return blocked(
      'STAKE_VECTOR_WINNING_SCENARIOS_INVALID',
      'Stake-vector solving requires exactly one winning payout row for each leg.',
      'Standard-binary scenario rows with one winner per outcome.',
    );
  }

  const winningRow = winningRows[0];
  if (!winningRow) {
    return blocked(
      'STAKE_VECTOR_WINNING_SCENARIOS_INVALID',
      'Stake-vector solving requires exactly one winning payout row for each leg.',
      'Standard-binary scenario rows with one winner per outcome.',
    );
  }

  const quantumMinor = lcm(referenceRow.stakeMinor, rounding.stepMinor);
  const scaleFactor = quantumMinor / referenceRow.stakeMinor;
  const maxUnits = capacity.maxStakeMinor / quantumMinor;
  const minUnits = ceilDiv(capacity.minStakeMinor, quantumMinor);
  if (maxUnits < minUnits) {
    return blocked(
      'STAKE_VECTOR_CAPACITY_EXHAUSTED',
      'Stake-vector solving cannot fit a non-negative local paper stake vector inside the supplied capacity and rounding limits.',
      'Larger local capacity bounds or a tighter local scenario cash-flow matrix.',
    );
  }

  const contributionsByScenarioId = new Map<string, bigint>();
  for (const row of rows) {
    if (
      row.stakeMinor !== referenceRow.stakeMinor ||
      row.feeMinor !== referenceRow.feeMinor ||
      row.costMinor !== referenceRow.costMinor
    ) {
      return blocked(
        'STAKE_VECTOR_TERMS_INCONSISTENT',
        'Stake-vector solving requires each leg to keep stake, fee, and cost terms consistent across terminal scenarios.',
        'Per-leg local stake, fee, and cost rows that only vary by winning payout.',
      );
    }
    contributionsByScenarioId.set(row.scenarioId, (row.payoutMinor - row.stakeMinor - row.feeMinor - row.costMinor) * scaleFactor);
  }

  return accepted(
    Object.freeze({
      legId,
      quantumMinor,
      minUnits,
      maxUnits,
      winningScenarioId: winningRow.scenarioId,
      contributionsByScenarioId: contributionsByScenarioId as ReadonlyMap<string, bigint>,
    }),
  );
}

function gcd(left: bigint, right: bigint): bigint {
  let currentLeft = left;
  let currentRight = right;
  while (currentRight !== 0n) {
    const remainder = currentLeft % currentRight;
    currentLeft = currentRight;
    currentRight = remainder;
  }
  return currentLeft < 0n ? -currentLeft : currentLeft;
}

function lcm(left: bigint, right: bigint): bigint {
  return (left / gcd(left, right)) * right;
}

function ceilDiv(dividend: bigint, divisor: bigint): bigint {
  const quotient = dividend / divisor;
  if (dividend % divisor === 0n) {
    return quotient;
  }
  return quotient + 1n;
}

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}
