import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import type { ScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import { validateScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import type {
  PaperGroupCompletionSnapshot,
  PaperLegCompletionSnapshot,
  PaperLegCompletionState,
} from './leg-completion.js';

export interface ResidualExposureInput {
  readonly completion: PaperGroupCompletionSnapshot;
  readonly matrix: ScenarioCashflowMatrix;
}

export interface ResidualExposureScenarioNet {
  readonly scenarioId: string;
  readonly netMinor: bigint;
}

export interface ResidualExposureAnalysis {
  readonly groupState: 'group_incomplete';
  readonly filledLegIds: readonly string[];
  readonly excludedLegIds: readonly string[];
  readonly scenarioNets: readonly ResidualExposureScenarioNet[];
  readonly worstCaseNetMinor: bigint;
}

export function analyzeResidualExposure(input: ResidualExposureInput): BoundaryResult<ResidualExposureAnalysis> {
  const matrixValidation = validateScenarioCashflowMatrix(input.matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }

  if (input.completion.groupState !== 'group_incomplete') {
    return blocked(
      'RESIDUAL_EXPOSURE_GROUP_STATE_INVALID',
      'Residual exposure analysis only supports incomplete local paper groups.',
      'A local paper group_incomplete completion snapshot.',
    );
  }

  const completionLegIds = new Set(input.completion.legs.map((leg) => leg.legId));
  const rowsByLegId = new Map<string, Map<string, ScenarioCashflowMatrix['rows'][number]>>();
  const scenarioIdSet = new Set<string>();
  for (const row of input.matrix.rows) {
    if (!completionLegIds.has(row.legId)) {
      return blocked(
        'RESIDUAL_EXPOSURE_UNKNOWN_MATRIX_LEG',
        'Residual exposure analysis requires scenario rows to match the incomplete local paper group legs.',
        'Scenario cash-flow rows aligned to the incomplete local paper group leg ids.',
      );
    }

    scenarioIdSet.add(row.scenarioId);
    const rowsForLeg = rowsByLegId.get(row.legId) ?? new Map<string, ScenarioCashflowMatrix['rows'][number]>();
    if (rowsForLeg.has(row.scenarioId)) {
      return blocked(
        'RESIDUAL_EXPOSURE_SCENARIO_DUPLICATE',
        'Residual exposure analysis requires exactly one scenario row per leg and terminal scenario.',
        'One deterministic scenario cash-flow row per leg and terminal scenario.',
      );
    }
    rowsForLeg.set(row.scenarioId, row);
    rowsByLegId.set(row.legId, rowsForLeg);
  }

  const scenarioIds = [...scenarioIdSet].sort();
  if (scenarioIds.length === 0) {
    return blocked(
      'RESIDUAL_EXPOSURE_SCENARIOS_MISSING',
      'Residual exposure analysis requires at least one terminal scenario row.',
      'Terminal scenario cash-flow rows for the incomplete local paper group.',
    );
  }

  const filledLegIds: string[] = [];
  const excludedLegIds: string[] = [];
  for (const leg of input.completion.legs) {
    if (!supportsResidualExposureState(leg.state)) {
      return blocked(
        'RESIDUAL_EXPOSURE_STATE_INCONSISTENT',
        'Residual exposure analysis only supports incomplete local paper groups composed of filled, failed, or stale legs.',
        'Incomplete local paper completion snapshots limited to filled, failed, and stale legs.',
      );
    }

    const rowsForLeg = rowsByLegId.get(leg.legId);
    if (!rowsForLeg) {
      return blocked(
        'RESIDUAL_EXPOSURE_LEG_ROWS_MISSING',
        'Residual exposure analysis requires scenario rows for every incomplete group leg.',
        'Scenario cash-flow rows for every leg in the incomplete local paper group.',
      );
    }

    for (const scenarioId of scenarioIds) {
      const row = rowsForLeg.get(scenarioId);
      if (!row) {
        return blocked(
          'RESIDUAL_EXPOSURE_SCENARIOS_MISSING',
          'Residual exposure analysis requires every incomplete group leg to cover every terminal scenario.',
          'Complete scenario cash-flow coverage for each incomplete local paper leg.',
        );
      }
      if (leg.state === 'leg_filled' && row.stakeMinor !== leg.filledStakeMinor) {
        return blocked(
          'RESIDUAL_EXPOSURE_FILLED_STAKE_MISMATCH',
          'Residual exposure analysis requires filled leg stake to match the scenario cash-flow rows.',
          'Filled local paper stake aligned to the deterministic scenario cash-flow matrix.',
        );
      }
    }

    if (leg.state === 'leg_filled') {
      filledLegIds.push(leg.legId);
    } else {
      excludedLegIds.push(leg.legId);
    }
  }

  const scenarioNets = Object.freeze(
    scenarioIds.map((scenarioId) =>
      Object.freeze({
        scenarioId,
        netMinor: sumScenarioNetForFilledLegs(input.completion.legs, rowsByLegId, scenarioId),
      }),
    ),
  );

  const firstScenarioNet = scenarioNets[0];
  if (!firstScenarioNet) {
    return blocked(
      'RESIDUAL_EXPOSURE_SCENARIOS_MISSING',
      'Residual exposure analysis requires at least one terminal scenario row.',
      'Terminal scenario cash-flow rows for the incomplete local paper group.',
    );
  }

  return accepted(
    Object.freeze({
      groupState: 'group_incomplete',
      filledLegIds: Object.freeze([...filledLegIds]),
      excludedLegIds: Object.freeze([...excludedLegIds]),
      scenarioNets,
      worstCaseNetMinor: scenarioNets.reduce(
        (currentWorstCaseNetMinor, scenarioNet) =>
          scenarioNet.netMinor < currentWorstCaseNetMinor ? scenarioNet.netMinor : currentWorstCaseNetMinor,
        firstScenarioNet.netMinor,
      ),
    }),
  );
}

function supportsResidualExposureState(state: PaperLegCompletionState): boolean {
  return state === 'leg_filled' || state === 'leg_failed' || state === 'leg_stale';
}

function sumScenarioNetForFilledLegs(
  legs: readonly PaperLegCompletionSnapshot[],
  rowsByLegId: ReadonlyMap<string, ReadonlyMap<string, ScenarioCashflowMatrix['rows'][number]>>,
  scenarioId: string,
): bigint {
  let netMinor = 0n;
  for (const leg of legs) {
    if (leg.state !== 'leg_filled') {
      continue;
    }

    const row = rowsByLegId.get(leg.legId)?.get(scenarioId);
    if (!row) {
      continue;
    }

    netMinor += row.payoutMinor - row.stakeMinor - row.feeMinor - row.costMinor;
  }
  return netMinor;
}
