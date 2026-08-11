import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import type { ScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import { validateScenarioCashflowMatrix } from '../scenarios/scenario-cashflow.js';
import type {
  PaperGroupCompletionState,
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
  if (
    typeof input !== 'object'
    || input === null
    || typeof input.matrix !== 'object'
    || input.matrix === null
    || !Array.isArray(input.matrix.rows)
  ) {
    return blocked(
      'RESIDUAL_EXPOSURE_INPUT_INVALID',
      'Residual exposure analysis requires a structured scenario cash-flow matrix.',
      'Structured residual exposure input with scenario cash-flow matrix rows.',
    );
  }
  if (
    typeof input.completion !== 'object'
    || input.completion === null
    || !Array.isArray(input.completion.legs)
  ) {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_AGGREGATE_INVALID',
      'Residual exposure analysis requires structured completion evidence.',
      'Structured local paper completion group evidence.',
    );
  }

  const matrixValidation = validateScenarioCashflowMatrix(input.matrix.rows);
  if (!matrixValidation.ok) {
    return matrixValidation;
  }

  if (typeof input.completion.manualKill !== 'boolean') {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_AGGREGATE_INVALID',
      'Residual exposure analysis requires completion manualKill to be an explicit boolean.',
      'Explicit boolean manualKill evidence for the local paper completion group.',
    );
  }
  if (!isPaperGroupCompletionState(input.completion.groupState)) {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_AGGREGATE_INVALID',
      'Residual exposure analysis requires a supported aggregate completion group state.',
      'Supported local paper completion groupState evidence.',
    );
  }
  for (const leg of input.completion.legs) {
    const legContainerValidation = validateResidualCompletionLegContainer(leg);
    if (!legContainerValidation.ok) {
      return legContainerValidation;
    }
  }
  const expectedGroupState = derivePaperGroupCompletionState(input.completion.legs, input.completion.manualKill);
  if (input.completion.groupState !== expectedGroupState) {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_GROUP_STATE_MISMATCH',
      'Residual exposure analysis requires aggregate completion group state to match leg snapshots.',
      'Local paper completion groupState derived from completion leg snapshots.',
    );
  }

  if (input.completion.groupState !== 'group_incomplete') {
    return blocked(
      'RESIDUAL_EXPOSURE_GROUP_STATE_INVALID',
      'Residual exposure analysis only supports incomplete local paper groups.',
      'A local paper group_incomplete completion snapshot.',
    );
  }

  const completionLegIds = new Set<string>();
  for (const leg of input.completion.legs) {
    const snapshotValidation = validateResidualCompletionLegSnapshot(leg);
    if (!snapshotValidation.ok) {
      return snapshotValidation;
    }

    if (completionLegIds.has(leg.legId)) {
      return blocked(
        'RESIDUAL_EXPOSURE_DUPLICATE_COMPLETION_LEG',
        'Residual exposure analysis requires exactly one completion snapshot per incomplete group leg id.',
        'Unique incomplete local paper completion leg ids.',
      );
    }
    completionLegIds.add(leg.legId);
  }

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

function validateResidualCompletionLegSnapshot(
  leg: PaperLegCompletionSnapshot,
): BoundaryResult<PaperLegCompletionSnapshot> {
  const legContainerValidation = validateResidualCompletionLegContainer(leg);
  if (!legContainerValidation.ok) {
    return legContainerValidation;
  }
  if (!supportsResidualExposureState(leg.state)) {
    return blocked(
      'RESIDUAL_EXPOSURE_STATE_INCONSISTENT',
      'Residual exposure analysis only supports incomplete local paper groups composed of filled, failed, or stale legs.',
      'Incomplete local paper completion snapshots limited to filled, failed, and stale legs.',
    );
  }

  if (typeof leg.reservedStakeMinor !== 'bigint' || typeof leg.filledStakeMinor !== 'bigint') {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_SNAPSHOT_STATE_STAKE_MISMATCH',
      'Residual exposure analysis requires completion leg state to match stake evidence.',
      'State-aligned local paper completion leg stake evidence.',
    );
  }

  if (leg.state === 'leg_filled') {
    if (leg.reservedStakeMinor !== 0n || leg.filledStakeMinor <= 0n) {
      return blocked(
        'RESIDUAL_EXPOSURE_COMPLETION_SNAPSHOT_STATE_STAKE_MISMATCH',
        'Residual exposure analysis requires completion leg state to match stake evidence.',
        'State-aligned local paper completion leg stake evidence.',
      );
    }
    return accepted(leg);
  }

  if (leg.reservedStakeMinor !== 0n || leg.filledStakeMinor !== 0n) {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_SNAPSHOT_STATE_STAKE_MISMATCH',
      'Residual exposure analysis requires completion leg state to match stake evidence.',
      'State-aligned local paper completion leg stake evidence.',
    );
  }

  return accepted(leg);
}

function validateResidualCompletionLegContainer(
  leg: PaperLegCompletionSnapshot,
): BoundaryResult<undefined> {
  if (
    typeof leg !== 'object'
    || leg === null
    || Array.isArray(leg)
    || typeof leg.legId !== 'string'
    || typeof leg.state !== 'string'
  ) {
    return blocked(
      'RESIDUAL_EXPOSURE_COMPLETION_AGGREGATE_INVALID',
      'Residual exposure analysis requires structured completion leg evidence.',
      'Structured local paper completion leg snapshots.',
    );
  }
  return accepted(undefined);
}

function derivePaperGroupCompletionState(
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

function isPaperGroupCompletionState(value: string): value is PaperGroupCompletionState {
  return value === 'group_open'
    || value === 'group_reserved'
    || value === 'group_settlement_pending'
    || value === 'group_complete'
    || value === 'group_incomplete'
    || value === 'group_killed';
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
