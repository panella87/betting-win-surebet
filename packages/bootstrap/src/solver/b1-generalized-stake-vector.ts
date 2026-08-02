import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import {
  B1_DECIMAL_ODDS_SCALE_MICRO,
} from '../opportunity/b1-gross-spread.js';
import type {
  B1AcceptedGrossOpportunityCandidate,
  B1GrossOpportunityCandidate,
} from '../opportunity/b1-cross-venue-derivation.js';
import {
  buildB1ScenarioCashflowMatrix,
  calculateB1PayoutMinor,
  type B1ScenarioCashflowLegTerms,
  type B1ScenarioCashflowMatrix,
} from '../scenarios/b1-scenario-cashflow.js';
import {
  buildB1TerminalScenarios,
  type B1TerminalScenario,
} from '../scenarios/b1-terminal-scenario.js';
import {
  ceilDivB1,
  roundUpB1StakeMinor,
} from './b1-rounding.js';

export interface B1StakeVectorLegConstraint {
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly minStakeMinor: bigint;
  readonly maxStakeMinor: bigint;
  readonly stakeStepMinor: bigint;
}

export interface B1GeneralizedStakeVectorPolicy {
  readonly legConstraints: readonly B1StakeVectorLegConstraint[];
  readonly targetWorstCaseNetMinor: bigint;
  readonly maximumTotalRoundingLossMinor: bigint;
  readonly maxSearchIterations: number;
}

export interface B1SolvedStakeVectorLeg {
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly outcomeSide: string;
  readonly venueOrBookmakerId: string;
  readonly decimalOddsMicro: bigint;
  readonly rawStakeMinor: bigint;
  readonly stakeMinor: bigint;
  readonly stakeStepMinor: bigint;
  readonly roundingLossMinor: bigint;
  readonly payoutIfWonMinor: bigint;
}

export interface B1StakeVectorScenarioNet {
  readonly scenarioId: string;
  readonly winningSelectionEquivalenceKey: string;
  readonly payoutMinor: bigint;
  readonly netMinor: bigint;
}

export interface B1GeneralizedStakeVectorSolution {
  readonly ok: true;
  readonly candidateId: string;
  readonly stakeVectorKind: 'deterministic_b1_generalized_stake_vector';
  readonly terminalOutcomeCount: 2 | 3;
  readonly terminalScenarios: readonly B1TerminalScenario[];
  readonly stakes: readonly B1SolvedStakeVectorLeg[];
  readonly stakeAssumptions: readonly {
    readonly selectionEquivalenceKey: string;
    readonly stakeMinor: bigint;
  }[];
  readonly scenarioCashflowMatrix: B1ScenarioCashflowMatrix;
  readonly scenarioNets: readonly B1StakeVectorScenarioNet[];
  readonly totalStakeMinor: bigint;
  readonly totalRoundingLossMinor: bigint;
  readonly worstCaseNetMinor: bigint;
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

interface B1NormalizedLegConstraint extends B1StakeVectorLegConstraint {
  readonly key: string;
}

interface B1StakeBuildResult {
  readonly stakes: readonly B1SolvedStakeVectorLeg[];
  readonly totalStakeMinor: bigint;
  readonly totalRoundingLossMinor: bigint;
}

export function solveB1GeneralizedStakeVector(
  candidate: B1GrossOpportunityCandidate,
  policy: B1GeneralizedStakeVectorPolicy,
): BoundaryResult<B1GeneralizedStakeVectorSolution> {
  if (!candidate.ok) {
    return blocked(
      'B1_STAKE_VECTOR_REQUIRES_ACCEPTED_GROSS_CANDIDATE',
      'B1 generalized stake-vector solving requires an accepted gross-only candidate.',
      'Accepted B1 deterministic gross cross-venue candidate.',
    );
  }

  const policyValidation = validateB1GeneralizedStakeVectorPolicy(candidate, policy);
  if (!policyValidation.ok) {
    return policyValidation;
  }
  const terminalScenarios = buildB1TerminalScenarios(candidate.selectedQuotes);
  if (!terminalScenarios.ok) {
    return terminalScenarios;
  }

  const maxTargetPayoutMinor = maxTargetPayout(candidate, policyValidation.value);
  let targetPayoutMinor = initialTargetPayout(candidate, policyValidation.value);
  for (let iteration = 0; iteration < policy.maxSearchIterations; iteration += 1) {
    if (targetPayoutMinor > maxTargetPayoutMinor) {
      return blocked(
        'B1_STAKE_VECTOR_CAPACITY_EXHAUSTED',
        'B1 generalized stake-vector solving cannot satisfy target net inside explicit capacity limits.',
        'B1 venue capacity limits that can cover the rounded generalized stake vector.',
      );
    }

    const stakes = buildStakesForTargetPayout(candidate, policyValidation.value, targetPayoutMinor);
    if (!stakes.ok) {
      return stakes;
    }
    if (stakes.value.totalRoundingLossMinor > policy.maximumTotalRoundingLossMinor) {
      return blocked(
        'B1_STAKE_VECTOR_ROUNDING_LOSS',
        'B1 generalized stake-vector solving rejects stake rounding loss above the explicit policy limit.',
        'B1 stake steps fine enough to keep total rounding loss within policy.',
      );
    }

    const scenarioCashflowMatrix = buildB1ScenarioCashflowMatrix(
      terminalScenarios.value,
      stakes.value.stakes.map((stake) => Object.freeze({
        selectionEquivalenceKey: stake.selectionEquivalenceKey,
        venueOrBookmakerId: stake.venueOrBookmakerId,
        stakeMinor: stake.stakeMinor,
        decimalOddsMicro: stake.decimalOddsMicro,
      })),
    );
    if (!scenarioCashflowMatrix.ok) {
      return scenarioCashflowMatrix;
    }

    const scenarioNets = calculateScenarioNets(terminalScenarios.value, stakes.value);
    const worstCaseNetMinor = minimumScenarioNet(scenarioNets);
    if (worstCaseNetMinor >= policy.targetWorstCaseNetMinor) {
      return accepted(Object.freeze({
        ok: true,
        candidateId: candidate.candidateId,
        stakeVectorKind: 'deterministic_b1_generalized_stake_vector',
        terminalOutcomeCount: terminalOutcomeCount(terminalScenarios.value),
        terminalScenarios: terminalScenarios.value,
        stakes: stakes.value.stakes,
        stakeAssumptions: Object.freeze(stakes.value.stakes.map((stake) => Object.freeze({
          selectionEquivalenceKey: stake.selectionEquivalenceKey,
          stakeMinor: stake.stakeMinor,
        }))),
        scenarioCashflowMatrix: scenarioCashflowMatrix.value,
        scenarioNets,
        totalStakeMinor: stakes.value.totalStakeMinor,
        totalRoundingLossMinor: stakes.value.totalRoundingLossMinor,
        worstCaseNetMinor,
        executable: false,
        liveReadiness: 'not_authorized_bws_900_parked',
      }));
    }

    const deficitMinor = policy.targetWorstCaseNetMinor - worstCaseNetMinor;
    targetPayoutMinor += deficitMinor;
  }

  return blocked(
    'B1_STAKE_VECTOR_SEARCH_EXHAUSTED',
    'B1 generalized stake-vector solving exhausted the explicit bounded integer search.',
    'Higher maxSearchIterations or tighter B1 stake vector constraints.',
  );
}

function validateB1GeneralizedStakeVectorPolicy(
  candidate: B1AcceptedGrossOpportunityCandidate,
  policy: B1GeneralizedStakeVectorPolicy,
): BoundaryResult<ReadonlyMap<string, B1NormalizedLegConstraint>> {
  if (typeof policy !== 'object' || policy === null || !Array.isArray(policy.legConstraints)) {
    return blocked(
      'B1_STAKE_VECTOR_POLICY_MISSING',
      'B1 generalized stake-vector solving requires an explicit policy with leg constraints.',
      'Explicit B1 generalized stake-vector policy.',
    );
  }
  if (policy.targetWorstCaseNetMinor < 0n || policy.maximumTotalRoundingLossMinor < 0n) {
    return blocked(
      'B1_STAKE_VECTOR_POLICY_INVALID',
      'B1 generalized stake-vector policy requires non-negative target net and rounding-loss limits.',
      'Non-negative B1 target net and rounding-loss policy values.',
    );
  }
  if (!Number.isInteger(policy.maxSearchIterations) || policy.maxSearchIterations <= 0 || policy.maxSearchIterations > 1_000) {
    return blocked(
      'B1_STAKE_VECTOR_SEARCH_BOUND_INVALID',
      'B1 generalized stake-vector solving requires an explicit bounded positive integer search limit.',
      'B1 maxSearchIterations between 1 and 1000.',
    );
  }

  const constraintsByKey = new Map<string, B1NormalizedLegConstraint>();
  for (const constraint of policy.legConstraints) {
    const key = buildConstraintKey(constraint.selectionEquivalenceKey, constraint.venueOrBookmakerId);
    if (constraint.selectionEquivalenceKey.length === 0) {
      return blocked(
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1 stake-vector constraints require selection equivalence evidence.',
        'B1 selection_equivalence_key for every stake-vector leg.',
      );
    }
    if (constraint.venueOrBookmakerId.length === 0) {
      return blocked(
        'B1_VENUE_PAIR_INCOMPLETE',
        'B1 stake-vector constraints require venue evidence.',
        'B1 venue_or_bookmaker_id for every stake-vector leg.',
      );
    }
    if (constraint.minStakeMinor <= 0n || constraint.maxStakeMinor <= 0n) {
      return blocked(
        'B1_STAKE_VECTOR_CAPACITY_INVALID',
        'B1 stake-vector constraints require positive min and max stake limits.',
        'Positive B1 min/max stake limits in integer minor units.',
      );
    }
    if (constraint.maxStakeMinor < constraint.minStakeMinor) {
      return blocked(
        'B1_STAKE_VECTOR_CAPACITY_INVERTED',
        'B1 stake-vector max stake must be greater than or equal to min stake.',
        'Consistent B1 stake-vector capacity limits.',
      );
    }
    if (constraint.stakeStepMinor <= 0n) {
      return blocked(
        'B1_STAKE_VECTOR_ROUNDING_STEP_INVALID',
        'B1 generalized stake-vector solving requires a positive stake rounding step.',
        'Positive B1 stake rounding step in integer minor units.',
      );
    }
    if (constraintsByKey.has(key)) {
      return blocked(
        'B1_STAKE_VECTOR_CONSTRAINT_DUPLICATE',
        'B1 generalized stake-vector solving requires one constraint per selected venue outcome.',
        'Unique B1 constraint keyed by selection_equivalence_key and venue_or_bookmaker_id.',
      );
    }
    constraintsByKey.set(key, Object.freeze({ ...constraint, key }));
  }

  for (const quote of candidate.selectedQuotes) {
    if (!constraintsByKey.has(buildConstraintKey(quote.selectionEquivalenceKey, quote.venueOrBookmakerId))) {
      return blocked(
        'B1_STAKE_VECTOR_CONSTRAINT_MISSING',
        'B1 generalized stake-vector solving requires an explicit constraint for every selected quote.',
        'B1 stake-vector constraint keyed by selected quote and venue.',
      );
    }
  }
  if (constraintsByKey.size !== candidate.selectedQuotes.length) {
    return blocked(
      'B1_STAKE_VECTOR_CONSTRAINT_UNKNOWN',
      'B1 generalized stake-vector solving rejects constraints for unselected quotes.',
      'B1 stake-vector constraints matching only selected gross quotes.',
    );
  }

  return accepted(constraintsByKey);
}

function initialTargetPayout(
  candidate: B1AcceptedGrossOpportunityCandidate,
  constraintsByKey: ReadonlyMap<string, B1NormalizedLegConstraint>,
): bigint {
  let targetPayoutMinor = 1n;
  for (const quote of candidate.selectedQuotes) {
    const constraint = requireConstraint(constraintsByKey, quote.selectionEquivalenceKey, quote.venueOrBookmakerId);
    const minPayoutMinor = calculateB1PayoutMinor(constraint.minStakeMinor, quote.decimalOddsMicro);
    if (minPayoutMinor > targetPayoutMinor) {
      targetPayoutMinor = minPayoutMinor;
    }
  }
  return targetPayoutMinor;
}

function maxTargetPayout(
  candidate: B1AcceptedGrossOpportunityCandidate,
  constraintsByKey: ReadonlyMap<string, B1NormalizedLegConstraint>,
): bigint {
  let maxPayoutMinor: bigint | undefined;
  for (const quote of candidate.selectedQuotes) {
    const constraint = requireConstraint(constraintsByKey, quote.selectionEquivalenceKey, quote.venueOrBookmakerId);
    const legMaxPayoutMinor = calculateB1PayoutMinor(constraint.maxStakeMinor, quote.decimalOddsMicro);
    if (maxPayoutMinor === undefined || legMaxPayoutMinor < maxPayoutMinor) {
      maxPayoutMinor = legMaxPayoutMinor;
    }
  }
  if (maxPayoutMinor === undefined) {
    throw new Error('B1 generalized stake-vector max payout requires selected quotes.');
  }
  return maxPayoutMinor;
}

function buildStakesForTargetPayout(
  candidate: B1AcceptedGrossOpportunityCandidate,
  constraintsByKey: ReadonlyMap<string, B1NormalizedLegConstraint>,
  targetPayoutMinor: bigint,
): BoundaryResult<B1StakeBuildResult> {
  const stakes: B1SolvedStakeVectorLeg[] = [];
  let totalStakeMinor = 0n;
  let totalRoundingLossMinor = 0n;

  for (const quote of [...candidate.selectedQuotes].sort(compareCandidateQuotes)) {
    const constraint = requireConstraint(constraintsByKey, quote.selectionEquivalenceKey, quote.venueOrBookmakerId);
    const rawStakeMinor = ceilDivB1(
      targetPayoutMinor * B1_DECIMAL_ODDS_SCALE_MICRO,
      quote.decimalOddsMicro,
    );
    const minimumRawStakeMinor = rawStakeMinor > constraint.minStakeMinor ? rawStakeMinor : constraint.minStakeMinor;
    const rounded = roundUpB1StakeMinor(minimumRawStakeMinor, constraint.stakeStepMinor);
    if (!rounded.ok) {
      return rounded;
    }
    if (rounded.value.roundedStakeMinor > constraint.maxStakeMinor) {
      return blocked(
        'B1_STAKE_VECTOR_CAPACITY_EXHAUSTED',
        'B1 generalized stake-vector solving cannot satisfy target payout inside explicit capacity limits.',
        'B1 venue capacity limits that can cover the rounded generalized stake vector.',
      );
    }
    let stakeMinor = rounded.value.roundedStakeMinor;
    let payoutIfWonMinor = calculateB1PayoutMinor(stakeMinor, quote.decimalOddsMicro);
    while (payoutIfWonMinor < targetPayoutMinor) {
      stakeMinor += constraint.stakeStepMinor;
      if (stakeMinor > constraint.maxStakeMinor) {
        return blocked(
          'B1_STAKE_VECTOR_CAPACITY_EXHAUSTED',
          'B1 generalized stake-vector solving cannot satisfy integer payout rounding inside explicit capacity limits.',
          'B1 capacity for stake rounding that reaches the target payout.',
        );
      }
      payoutIfWonMinor = calculateB1PayoutMinor(stakeMinor, quote.decimalOddsMicro);
    }

    const roundingLossMinor = stakeMinor - rawStakeMinor;
    totalStakeMinor += stakeMinor;
    totalRoundingLossMinor += roundingLossMinor;
    stakes.push(Object.freeze({
      selectionEquivalenceKey: quote.selectionEquivalenceKey,
      outcomeName: quote.outcomeName,
      outcomeSide: quote.outcomeSide,
      venueOrBookmakerId: quote.venueOrBookmakerId,
      decimalOddsMicro: quote.decimalOddsMicro,
      rawStakeMinor,
      stakeMinor,
      stakeStepMinor: constraint.stakeStepMinor,
      roundingLossMinor,
      payoutIfWonMinor,
    }));
  }

  return accepted(Object.freeze({
    stakes: Object.freeze(stakes),
    totalStakeMinor,
    totalRoundingLossMinor,
  }));
}

function calculateScenarioNets(
  terminalScenarios: readonly B1TerminalScenario[],
  stakeBuild: B1StakeBuildResult,
): readonly B1StakeVectorScenarioNet[] {
  const stakesBySelection = new Map<string, B1SolvedStakeVectorLeg>();
  for (const stake of stakeBuild.stakes) {
    stakesBySelection.set(stake.selectionEquivalenceKey, stake);
  }

  const nets: B1StakeVectorScenarioNet[] = [];
  for (const scenario of terminalScenarios) {
    const winningStake = stakesBySelection.get(scenario.selectionEquivalenceKey);
    if (winningStake === undefined) {
      throw new Error('B1 scenario net calculation lost a selected winning stake.');
    }
    nets.push(Object.freeze({
      scenarioId: scenario.scenarioId,
      winningSelectionEquivalenceKey: scenario.selectionEquivalenceKey,
      payoutMinor: winningStake.payoutIfWonMinor,
      netMinor: winningStake.payoutIfWonMinor - stakeBuild.totalStakeMinor,
    }));
  }
  return Object.freeze(nets);
}

function minimumScenarioNet(scenarioNets: readonly B1StakeVectorScenarioNet[]): bigint {
  const first = scenarioNets[0];
  if (first === undefined) {
    throw new Error('B1 generalized stake-vector solution requires terminal scenario nets.');
  }
  let minimum = first.netMinor;
  for (const scenarioNet of scenarioNets.slice(1)) {
    if (scenarioNet.netMinor < minimum) {
      minimum = scenarioNet.netMinor;
    }
  }
  return minimum;
}

function requireConstraint(
  constraintsByKey: ReadonlyMap<string, B1NormalizedLegConstraint>,
  selectionEquivalenceKey: string,
  venueOrBookmakerId: string,
): B1NormalizedLegConstraint {
  const constraint = constraintsByKey.get(buildConstraintKey(selectionEquivalenceKey, venueOrBookmakerId));
  if (constraint === undefined) {
    throw new Error('B1 generalized stake-vector policy validation lost a selected quote constraint.');
  }
  return constraint;
}

function buildConstraintKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}|${venueOrBookmakerId}`;
}

function terminalOutcomeCount(scenarios: readonly B1TerminalScenario[]): 2 | 3 {
  if (scenarios.length === 2) {
    return 2;
  }
  if (scenarios.length === 3) {
    return 3;
  }
  throw new Error('B1 terminal outcome count must be validated before solution assembly.');
}

function compareCandidateQuotes(
  left: B1AcceptedGrossOpportunityCandidate['selectedQuotes'][number],
  right: B1AcceptedGrossOpportunityCandidate['selectedQuotes'][number],
): number {
  const selectionComparison = left.selectionEquivalenceKey.localeCompare(right.selectionEquivalenceKey);
  if (selectionComparison !== 0) {
    return selectionComparison;
  }
  return left.venueOrBookmakerId.localeCompare(right.venueOrBookmakerId);
}
