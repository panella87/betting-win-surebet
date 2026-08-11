import test from 'node:test';
import assert from 'node:assert/strict';
import { solveStandardBinaryStakeVector } from '../src/solver/stake-vector.js';
import type { ScenarioCashflowMatrix } from '../src/scenarios/scenario-cashflow.js';

test('stake-vector solver returns a deterministic local paper stake vector for a valid standard-binary matrix', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.stakes, [
    {
      legId: 'market-001:no',
      unitCount: 1n,
      stakeQuantumMinor: 100n,
      stakeMinor: 100n,
    },
    {
      legId: 'market-001:yes',
      unitCount: 1n,
      stakeQuantumMinor: 100n,
      stakeMinor: 100n,
    },
  ]);
  assert.deepEqual(result.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: 15n },
    { scenarioId: 'yes_wins', netMinor: 5n },
  ]);
  assert.equal(result.value.worstCaseNetMinor, 5n);
});

test('stake-vector solver rejects malformed top-level input containers without throwing', () => {
  const malformedInput = solveStandardBinaryStakeVector(null as never);
  assert.equal(malformedInput.ok, false);
  assert.equal(malformedInput.blockers[0]?.code, 'STAKE_VECTOR_INPUT_INVALID');

  const malformedInputArray = solveStandardBinaryStakeVector([] as never);
  assert.equal(malformedInputArray.ok, false);
  assert.equal(malformedInputArray.blockers[0]?.code, 'STAKE_VECTOR_INPUT_INVALID');

  const malformedMatrix = solveStandardBinaryStakeVector({
    matrix: null,
    capacityConstraints: [],
    roundingConstraints: [],
  } as never);
  assert.equal(malformedMatrix.ok, false);
  assert.equal(malformedMatrix.blockers[0]?.code, 'STAKE_VECTOR_MATRIX_INVALID');

  const malformedMatrixArray = solveStandardBinaryStakeVector({
    matrix: [],
    capacityConstraints: [],
    roundingConstraints: [],
  } as never);
  assert.equal(malformedMatrixArray.ok, false);
  assert.equal(malformedMatrixArray.blockers[0]?.code, 'STAKE_VECTOR_MATRIX_INVALID');

  const malformedMatrixRow = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([null] as never),
    capacityConstraints: [],
    roundingConstraints: [],
  });
  assert.equal(malformedMatrixRow.ok, false);
  assert.equal(malformedMatrixRow.blockers[0]?.code, 'SCENARIO_CASHFLOW_ROW_INVALID');

  const malformedCapacity = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: null,
    roundingConstraints: [],
  } as never);
  assert.equal(malformedCapacity.ok, false);
  assert.equal(malformedCapacity.blockers[0]?.code, 'STAKE_VECTOR_CAPACITY_INVALID');

  const malformedRounding = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [],
    roundingConstraints: null,
  } as never);
  assert.equal(malformedRounding.ok, false);
  assert.equal(malformedRounding.blockers[0]?.code, 'STAKE_VECTOR_ROUNDING_INVALID');
});

test('stake-vector solver returns a blocker when capacity cannot cover both terminal scenarios', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 160n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 300n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 100n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 100n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 100n },
      { legId: 'market-001:yes', stepMinor: 100n },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STAKE_VECTOR_CAPACITY_EXHAUSTED',
      message: 'Stake-vector solving cannot fit a non-negative local paper stake vector inside the supplied capacity and rounding limits.',
      evidenceRequired: 'Larger local capacity bounds or a tighter local scenario cash-flow matrix.',
    },
  ]);
});

test('stake-vector solver returns a blocker when a minimum stake exceeds the local max capacity', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 200n, maxStakeMinor: 100n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'CAPACITY_CONSTRAINT_INVERTED',
      message: 'Minimum stake cannot exceed maximum capacity.',
      evidenceRequired: 'Consistent capacity constraint.',
    },
  ]);
});

test('stake-vector solver returns a blocker for malformed capacity numeric fields', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: undefined, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ] as never,
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'CAPACITY_CONSTRAINT_INVALID',
      message: 'Capacity constraints must use bigint minor-unit values.',
      evidenceRequired: 'Bigint min/max capacity constraint.',
    },
  ]);
});

test('stake-vector solver returns a blocker for unknown capacity constraints', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:extra', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STAKE_VECTOR_CAPACITY_UNKNOWN_LEG',
      message: 'Stake-vector solving requires capacity constraints to match matrix legs.',
      evidenceRequired: 'Capacity constraints keyed only by validated complete-set leg ids.',
    },
  ]);
});

test('stake-vector solver returns a blocker for malformed rounding numeric fields', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: undefined },
      { legId: 'market-001:yes', stepMinor: 50n },
    ] as never,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STAKE_VECTOR_ROUNDING_STEP_INVALID',
      message: 'Stake-vector solving requires a positive rounding step for every leg.',
      evidenceRequired: 'Positive local stake rounding step for each complete-set leg.',
    },
  ]);
});

test('stake-vector solver returns a blocker for malformed rounding leg identities', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: undefined, stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
    ],
  } as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STAKE_VECTOR_ROUNDING_INVALID',
      message: 'Stake-vector solving requires rounding constraints with non-empty leg ids.',
      evidenceRequired: 'Structured local stake rounding constraints keyed by leg id.',
    },
  ]);
});

test('stake-vector solver returns a blocker for unknown rounding constraints', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
      { legId: 'market-001:extra', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STAKE_VECTOR_ROUNDING_UNKNOWN_LEG',
      message: 'Stake-vector solving requires rounding constraints to match matrix legs.',
      evidenceRequired: 'Rounding constraints keyed only by validated complete-set leg ids.',
    },
  ]);
});

test('stake-vector solver applies fee and cost rows to worst-case exposure', () => {
  const withoutFees = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 100n },
      { legId: 'market-001:yes', stepMinor: 100n },
    ],
  });
  const withFees = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 5n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 5n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 100n },
      { legId: 'market-001:yes', stepMinor: 100n },
    ],
  });

  assert.equal(withoutFees.ok, true);
  assert.equal(withFees.ok, true);
  assert.deepEqual(withoutFees.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: 25n },
    { scenarioId: 'yes_wins', netMinor: 15n },
  ]);
  assert.equal(withoutFees.value.worstCaseNetMinor, 15n);
  assert.deepEqual(withFees.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: 10n },
    { scenarioId: 'yes_wins', netMinor: 0n },
  ]);
  assert.equal(withFees.value.worstCaseNetMinor, 0n);
});

test('stake-vector solver rounds to the local stake quantum and preserves deterministic dust', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 100n },
      { legId: 'market-001:yes', stepMinor: 250n },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.stakes, [
    {
      legId: 'market-001:no',
      unitCount: 4n,
      stakeQuantumMinor: 100n,
      stakeMinor: 400n,
    },
    {
      legId: 'market-001:yes',
      unitCount: 1n,
      stakeQuantumMinor: 500n,
      stakeMinor: 500n,
    },
  ]);
  assert.deepEqual(result.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: 0n },
    { scenarioId: 'yes_wins', netMinor: 175n },
  ]);
  assert.equal(result.value.worstCaseNetMinor, 0n);
});

test('stake-vector solver supports exact min max capacity at a smaller deterministic rounding quantum', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 220n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 220n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 150n, maxStakeMinor: 150n },
      { legId: 'market-001:yes', minStakeMinor: 150n, maxStakeMinor: 150n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 50n },
      { legId: 'market-001:yes', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.stakes, [
    {
      legId: 'market-001:no',
      unitCount: 3n,
      stakeQuantumMinor: 50n,
      stakeMinor: 150n,
    },
    {
      legId: 'market-001:yes',
      unitCount: 3n,
      stakeQuantumMinor: 50n,
      stakeMinor: 150n,
    },
  ]);
  assert.deepEqual(result.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: 30n },
    { scenarioId: 'yes_wins', netMinor: 30n },
  ]);
  assert.equal(result.value.worstCaseNetMinor, 30n);
});

test('stake-vector solver blocks impossible non-negative worst-case exposure before capacity search', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 190n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 190n, feeMinor: 0n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 1000n },
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 1000n },
    ],
    roundingConstraints: [
      { legId: 'market-001:no', stepMinor: 100n },
      { legId: 'market-001:yes', stepMinor: 100n },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STAKE_VECTOR_WORST_CASE_NEGATIVE',
      message: 'Stake-vector solving cannot reach non-negative worst-case exposure with the supplied local cash-flow rows.',
      evidenceRequired: 'Local quote terms that can cover both standard-binary terminal scenarios.',
    },
  ]);
});

test('stake-vector solver returns stakes and scenario nets in deterministic order', () => {
  const result = solveStandardBinaryStakeVector({
    matrix: createScenarioMatrix([
      { scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n },
      { scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n },
    ]),
    capacityConstraints: [
      { legId: 'market-001:yes', minStakeMinor: 100n, maxStakeMinor: 600n },
      { legId: 'market-001:no', minStakeMinor: 100n, maxStakeMinor: 600n },
    ],
    roundingConstraints: [
      { legId: 'market-001:yes', stepMinor: 50n },
      { legId: 'market-001:no', stepMinor: 50n },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.stakes.map((stake) => stake.legId), ['market-001:no', 'market-001:yes']);
  assert.deepEqual(result.value.scenarioNets.map((scenarioNet) => scenarioNet.scenarioId), ['no_wins', 'yes_wins']);
});

function createScenarioMatrix(rows: ScenarioCashflowMatrix['rows']): ScenarioCashflowMatrix {
  return {
    rows: Object.freeze([...rows]),
  };
}
