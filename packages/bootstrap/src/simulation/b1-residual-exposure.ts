import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import {
  validateB1ScenarioCashflowMatrix,
  type B1ScenarioCashflowMatrix,
  type B1ScenarioCashflowRow,
} from '../scenarios/b1-scenario-cashflow.js';

export interface B1ResidualExposureLeg {
  readonly legId: string;
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly plannedStakeMinor: bigint;
  readonly liveFilledStakeMinor: bigint;
}

export interface B1ResidualExposureScenarioNet {
  readonly scenarioId: string;
  readonly winningSelectionEquivalenceKey: string;
  readonly netMinor: bigint;
}

export interface B1ResidualExposureAnalysis {
  readonly exposureKind: 'deterministic_b1_residual_exposure';
  readonly exposedLegIds: readonly string[];
  readonly excludedLegIds: readonly string[];
  readonly scenarioNets: readonly B1ResidualExposureScenarioNet[];
  readonly worstCaseNetMinor: bigint;
  readonly worstCaseScenarioId: string;
  readonly maxResidualExposureMinor: bigint;
  readonly residualExposureWithinLimit: boolean;
}

export function analyzeB1ResidualExposure(
  matrix: B1ScenarioCashflowMatrix,
  legs: readonly B1ResidualExposureLeg[],
  maxResidualExposureMinor: bigint,
): BoundaryResult<B1ResidualExposureAnalysis> {
  if (typeof maxResidualExposureMinor !== 'bigint' || maxResidualExposureMinor < 0n) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
      'B1 residual exposure simulation requires a non-negative explicit exposure limit.',
      'Non-negative B1 residual exposure limit in integer minor units.',
    );
  }
  if (typeof matrix !== 'object' || matrix === null || Array.isArray(matrix) || !Array.isArray(matrix.rows)) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_MATRIX_INVALID',
      'B1 residual exposure simulation requires a structured scenario cash-flow matrix.',
      'Structured B1 scenario cash-flow matrix with rows.',
    );
  }

  const matrixValidation = validateB1ScenarioCashflowMatrix(matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }
  const matrixRows = matrixValidation.value.rows;

  if (!Array.isArray(legs)) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LEG_INVALID',
      'B1 residual exposure simulation requires structured residual exposure leg snapshots.',
      'Structured B1 residual exposure leg snapshot objects.',
    );
  }

  const legsByKey = new Map<string, B1ResidualExposureLeg>();
  const validatedLegs: B1ResidualExposureLeg[] = [];
  for (const leg of legs) {
    const legValidation = validateB1ResidualExposureLeg(leg);
    if (!legValidation.ok) {
      return legValidation;
    }
    const validatedLeg = legValidation.value;
    const key = buildB1ResidualLegKey(validatedLeg.selectionEquivalenceKey, validatedLeg.venueOrBookmakerId);
    if (legsByKey.has(key)) {
      return blocked(
        'B1_RESIDUAL_EXPOSURE_LEG_DUPLICATE',
        'B1 residual exposure simulation requires one leg per selection and venue.',
        'Unique B1 residual exposure legs keyed by selection_equivalence_key and venue_or_bookmaker_id.',
      );
    }
    legsByKey.set(key, validatedLeg);
    validatedLegs.push(validatedLeg);
  }

  const matrixKeys = new Set<string>();
  for (const row of matrixRows) {
    matrixKeys.add(buildB1ResidualLegKey(row.selectionEquivalenceKey, row.venueOrBookmakerId));
  }
  for (const key of matrixKeys) {
    if (!legsByKey.has(key)) {
      return blocked(
        'B1_RESIDUAL_EXPOSURE_MATRIX_LEG_MISSING',
        'B1 residual exposure simulation requires a leg snapshot for every scenario cash-flow leg.',
        'B1 leg snapshots aligned to the complete scenario cash-flow matrix.',
      );
    }
  }
  for (const key of legsByKey.keys()) {
    if (!matrixKeys.has(key)) {
      return blocked(
        'B1_RESIDUAL_EXPOSURE_LEG_UNKNOWN',
        'B1 residual exposure simulation requires every leg snapshot to match the scenario cash-flow matrix.',
        'B1 leg snapshots aligned to the complete scenario cash-flow matrix.',
      );
    }
  }

  const scenarioNets = buildScenarioNets(matrixRows, legsByKey);
  if (!scenarioNets.ok) {
    return scenarioNets;
  }

  const worstCase = minimumB1ResidualScenarioNet(scenarioNets.value);
  if (worstCase === undefined) {
    throw new Error('B1 residual exposure scenario net calculation produced no scenarios after matrix validation.');
  }

  const exposedLegIds = validatedLegs
    .filter((leg) => leg.liveFilledStakeMinor > 0n)
    .map((leg) => leg.legId)
    .sort();
  const excludedLegIds = validatedLegs
    .filter((leg) => leg.liveFilledStakeMinor === 0n)
    .map((leg) => leg.legId)
    .sort();

  return accepted(Object.freeze({
    exposureKind: 'deterministic_b1_residual_exposure',
    exposedLegIds: Object.freeze(exposedLegIds),
    excludedLegIds: Object.freeze(excludedLegIds),
    scenarioNets: scenarioNets.value,
    worstCaseNetMinor: worstCase.netMinor,
    worstCaseScenarioId: worstCase.scenarioId,
    maxResidualExposureMinor,
    residualExposureWithinLimit: worstCase.netMinor >= -maxResidualExposureMinor,
  }));
}

function validateB1ResidualExposureLeg(
  leg: B1ResidualExposureLeg,
): BoundaryResult<B1ResidualExposureLeg> {
  if (typeof leg !== 'object' || leg === null || Array.isArray(leg)) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LEG_INVALID',
      'B1 residual exposure simulation requires structured residual exposure leg snapshots.',
      'Structured B1 residual exposure leg snapshot objects.',
    );
  }
  if (typeof leg.legId !== 'string' || leg.legId.length === 0) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LEG_ID_MISSING',
      'B1 residual exposure simulation requires stable non-empty leg ids.',
      'Stable B1 fillability leg ids.',
    );
  }
  if (typeof leg.selectionEquivalenceKey !== 'string' || leg.selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 residual exposure simulation requires selection equivalence evidence for every leg.',
      'B1 selection_equivalence_key for every residual exposure leg.',
    );
  }
  if (typeof leg.venueOrBookmakerId !== 'string' || leg.venueOrBookmakerId.length === 0) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 residual exposure simulation requires venue evidence for every leg.',
      'B1 venue_or_bookmaker_id for every residual exposure leg.',
    );
  }
  if (typeof leg.plannedStakeMinor !== 'bigint' || typeof leg.liveFilledStakeMinor !== 'bigint') {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_STAKE_INVALID',
      'B1 residual exposure simulation requires integer minor-unit stake fields.',
      'B1 residual exposure stake fields encoded as bigint integer minor units.',
    );
  }
  if (leg.plannedStakeMinor <= 0n || leg.liveFilledStakeMinor < 0n) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_STAKE_INVALID',
      'B1 residual exposure simulation requires positive planned stakes and non-negative live fills.',
      'Positive B1 planned stake and non-negative live fill in integer minor units.',
    );
  }
  if (leg.liveFilledStakeMinor > leg.plannedStakeMinor) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_FILL_EXCEEDS_PLAN',
      'B1 residual exposure simulation requires live filled stake to stay within the solved stake plan.',
      'B1 live fills bounded by the solved stake vector.',
    );
  }
  return accepted(Object.freeze({ ...leg }));
}

function buildScenarioNets(
  rows: readonly B1ScenarioCashflowRow[],
  legsByKey: ReadonlyMap<string, B1ResidualExposureLeg>,
): BoundaryResult<readonly B1ResidualExposureScenarioNet[]> {
  const rowsByScenario = new Map<string, B1ScenarioCashflowRow[]>();
  for (const row of rows) {
    const scenarioRows = rowsByScenario.get(row.scenarioId);
    if (scenarioRows === undefined) {
      rowsByScenario.set(row.scenarioId, [row]);
    } else {
      scenarioRows.push(row);
    }
  }

  const scenarioNets: B1ResidualExposureScenarioNet[] = [];
  for (const [scenarioId, scenarioRows] of [...rowsByScenario.entries()].sort(compareScenarioEntries)) {
    let netMinor = 0n;
    let winningSelectionEquivalenceKey = '';
    for (const row of scenarioRows) {
      if (row.payoutMinor > 0n) {
        winningSelectionEquivalenceKey = row.winningSelectionEquivalenceKey;
      }
      const leg = legsByKey.get(buildB1ResidualLegKey(row.selectionEquivalenceKey, row.venueOrBookmakerId));
      if (leg === undefined) {
        throw new Error('B1 residual exposure matrix key validation lost a known leg.');
      }
      if (leg.liveFilledStakeMinor === 0n) {
        continue;
      }
      if (leg.liveFilledStakeMinor > row.stakeMinor) {
        return blocked(
          'B1_RESIDUAL_EXPOSURE_FILL_EXCEEDS_MATRIX_STAKE',
          'B1 residual exposure simulation requires live fills to stay within scenario cash-flow stake rows.',
          'B1 live fills bounded by the scenario cash-flow matrix stake.',
        );
      }
      const payoutNumeratorMinor = row.payoutMinor * leg.liveFilledStakeMinor;
      if (payoutNumeratorMinor % row.stakeMinor !== 0n) {
        return blocked(
          'B1_RESIDUAL_EXPOSURE_PAYOUT_SCALING_FRACTIONAL',
          'B1 residual exposure simulation requires partial payout scaling to resolve to integer minor units.',
          'B1 scenario cash-flow payout scaling with no fractional minor-unit remainder.',
        );
      }
      const payoutMinor = payoutNumeratorMinor / row.stakeMinor;
      netMinor += payoutMinor - leg.liveFilledStakeMinor;
    }
    if (winningSelectionEquivalenceKey.length === 0) {
      throw new Error('B1 residual exposure scenario has no winning selection after matrix validation.');
    }
    scenarioNets.push(Object.freeze({
      scenarioId,
      winningSelectionEquivalenceKey,
      netMinor,
    }));
  }

  return accepted(Object.freeze(scenarioNets));
}

function minimumB1ResidualScenarioNet(
  scenarioNets: readonly B1ResidualExposureScenarioNet[],
): B1ResidualExposureScenarioNet | undefined {
  let worstCase: B1ResidualExposureScenarioNet | undefined;
  for (const scenarioNet of scenarioNets) {
    if (worstCase === undefined || scenarioNet.netMinor < worstCase.netMinor) {
      worstCase = scenarioNet;
    }
  }
  return worstCase;
}

function compareScenarioEntries(
  left: readonly [string, readonly B1ScenarioCashflowRow[]],
  right: readonly [string, readonly B1ScenarioCashflowRow[]],
): number {
  return left[0].localeCompare(right[0]);
}

function buildB1ResidualLegKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}\u0000${venueOrBookmakerId}`;
}
