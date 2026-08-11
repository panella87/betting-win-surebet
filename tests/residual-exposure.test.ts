import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResidualExposure } from '../src/simulation/residual-exposure.js';
import { simulatePaperGroupCompletion } from '../src/simulation/leg-completion.js';
import type { ScenarioCashflowMatrix } from '../src/scenarios/scenario-cashflow.js';

test('residual exposure analysis returns deterministic scenario nets for an incomplete group', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.filledLegIds, ['market-001:yes']);
  assert.deepEqual(result.value.excludedLegIds, ['market-001:no']);
  assert.deepEqual(result.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: -105n },
    { scenarioId: 'yes_wins', netMinor: 110n },
  ]);
  assert.equal(result.value.worstCaseNetMinor, -105n);
});

test('residual exposure analysis rejects group states outside incomplete local paper groups', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_GROUP_STATE_INVALID',
      message: 'Residual exposure analysis only supports incomplete local paper groups.',
      evidenceRequired: 'A local paper group_incomplete completion snapshot.',
    },
  ]);
});

test('residual exposure analysis rejects forged incomplete aggregate state with all-filled legs', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion: Object.freeze({
      ...completion,
      groupState: 'group_incomplete',
    }),
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_COMPLETION_GROUP_STATE_MISMATCH',
      message: 'Residual exposure analysis requires aggregate completion group state to match leg snapshots.',
      evidenceRequired: 'Local paper completion groupState derived from completion leg snapshots.',
    },
  ]);
});

test('residual exposure analysis rejects duplicate completion leg snapshots', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);
  const firstLeg = completion.legs[0];
  assert.ok(firstLeg);

  const result = analyzeResidualExposure({
    completion: Object.freeze({
      ...completion,
      legs: Object.freeze([firstLeg, firstLeg, ...completion.legs.slice(1)]),
    }),
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_DUPLICATE_COMPLETION_LEG',
      message: 'Residual exposure analysis requires exactly one completion snapshot per incomplete group leg id.',
      evidenceRequired: 'Unique incomplete local paper completion leg ids.',
    },
  ]);
});

test('residual exposure analysis rejects incomplete groups with unsupported leg states', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_STATE_INCONSISTENT',
      message: 'Residual exposure analysis only supports incomplete local paper groups composed of filled, failed, or stale legs.',
      evidenceRequired: 'Incomplete local paper completion snapshots limited to filled, failed, and stale legs.',
    },
  ]);
});

test('residual exposure analysis rejects forged residual leg state and stake shapes before arithmetic', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);
  const yesLeg = completion.legs[0];
  const noLeg = completion.legs[1];
  assert.ok(yesLeg);
  assert.ok(noLeg);

  const matrix = createScenarioMatrix([
    { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
    { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
  ]);

  for (const forgedLeg of [
    Object.freeze({ ...yesLeg, reservedStakeMinor: 1n }),
    Object.freeze({ ...yesLeg, filledStakeMinor: 0n }),
    Object.freeze({ ...noLeg, filledStakeMinor: 1n }),
    Object.freeze({ ...noLeg, state: 'leg_stale' as const, reservedStakeMinor: 1n }),
    Object.freeze({ ...yesLeg, filledStakeMinor: '100' }),
  ]) {
    const result = analyzeResidualExposure({
      completion: Object.freeze({
        ...completion,
        legs: Object.freeze([forgedLeg, forgedLeg.legId === yesLeg.legId ? noLeg : yesLeg] as never),
      }),
      matrix,
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'RESIDUAL_EXPOSURE_COMPLETION_SNAPSHOT_STATE_STAKE_MISMATCH',
        message: 'Residual exposure analysis requires completion leg state to match stake evidence.',
        evidenceRequired: 'State-aligned local paper completion leg stake evidence.',
      },
    ]);
  }
});

test('residual exposure analysis rejects missing terminal scenario coverage', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_SCENARIOS_MISSING',
      message: 'Residual exposure analysis requires every incomplete group leg to cover every terminal scenario.',
      evidenceRequired: 'Complete scenario cash-flow coverage for each incomplete local paper leg.',
    },
  ]);
});

test('residual exposure analysis rejects whole standard-binary scenario omission', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
      message: 'Scenario cash-flow builder requires every standard-binary terminal scenario.',
      evidenceRequired: 'Complete YES-wins and NO-wins scenario coverage.',
    },
  ]);
});

test('residual exposure analysis rejects scenario rows for unknown group legs', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-002:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_UNKNOWN_MATRIX_LEG',
      message: 'Residual exposure analysis requires scenario rows to match the incomplete local paper group legs.',
      evidenceRequired: 'Scenario cash-flow rows aligned to the incomplete local paper group leg ids.',
    },
  ]);
});

test('residual exposure analysis rejects filled stake mismatches against scenario rows', () => {
  const completion = createCompletionSnapshot([
    createLeg('market-001:yes', 'leg_filled', 0n, 150n, '2026-07-02T00:17:05.000Z'),
    createLeg('market-001:no', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
  ]);

  const result = analyzeResidualExposure({
    completion,
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESIDUAL_EXPOSURE_FILLED_STAKE_MISMATCH',
      message: 'Residual exposure analysis requires filled leg stake to match the scenario cash-flow rows.',
      evidenceRequired: 'Filled local paper stake aligned to the deterministic scenario cash-flow matrix.',
    },
  ]);
});

function createCompletionSnapshot(
  legs: readonly ReturnType<typeof createLeg>[],
) {
  const result = simulatePaperGroupCompletion({
    legs,
    manualKill: false,
  });

  assert.equal(result.ok, true);
  return result.value;
}

function createLeg(
  legId: string,
  state:
    | 'leg_open'
    | 'leg_reserved'
    | 'leg_filled'
    | 'leg_failed'
    | 'leg_stale'
    | 'leg_settlement_pending',
  reservedStakeMinor: bigint,
  filledStakeMinor: bigint,
  updatedAt: string,
) {
  return {
    legId,
    state,
    reservedStakeMinor,
    filledStakeMinor,
    updatedAt,
  } as const;
}

function createScenarioMatrix(rows: readonly ScenarioCashflowMatrix['rows'][number][]): ScenarioCashflowMatrix {
  return {
    rows: Object.freeze([...rows]),
  };
}
