import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateNonAtomicPaperGroupCompletion } from '../src/simulation/non-atomic-completion.js';
import { solveStandardBinaryStakeVector, type StakeVectorInputContract } from '../src/solver/stake-vector.js';

test('non-atomic completion integrates partial fill and residual exposure on top of the solved stake vector', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'reserve', stakeMinor: 200n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:01.000Z' },
      { legId: 'market-001:yes', type: 'reject', occurredAt: '2026-07-13T10:00:02.000Z' },
      { legId: 'market-001:no', type: 'expire', occurredAt: '2026-07-13T10:00:03.000Z' },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.completion.groupState, 'group_incomplete');
  assert.deepEqual(result.value.completion.legs, [
    {
      legId: 'market-001:no',
      plannedStakeMinor: 200n,
      reservedStakeMinor: 0n,
      liveFilledStakeMinor: 0n,
      rolledBackStakeMinor: 0n,
      updatedAt: '2026-07-13T10:00:03.000Z',
      state: 'leg_expired',
    },
    {
      legId: 'market-001:yes',
      plannedStakeMinor: 200n,
      reservedStakeMinor: 0n,
      liveFilledStakeMinor: 100n,
      rolledBackStakeMinor: 0n,
      updatedAt: '2026-07-13T10:00:02.000Z',
      state: 'leg_partial',
    },
  ]);
  assert.deepEqual(result.value.residualExposure, {
    groupState: 'group_incomplete',
    exposedLegIds: ['market-001:yes'],
    excludedLegIds: ['market-001:no'],
    scenarioNets: [
      { scenarioId: 'no_wins', netMinor: -105n },
      { scenarioId: 'yes_wins', netMinor: 110n },
    ],
    worstCaseNetMinor: -105n,
    worstCaseScenarioId: 'no_wins',
  });
});

test('non-atomic completion reconstructs the same state after replay restart regardless of input event order', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const orderedEvents = [
    { legId: 'market-001:yes', type: 'reserve', stakeMinor: 200n, occurredAt: '2026-07-13T10:00:00.000Z' },
    { legId: 'market-001:yes', type: 'fill', stakeMinor: 200n, occurredAt: '2026-07-13T10:00:01.000Z' },
    { legId: 'market-001:yes', type: 'rollback', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:02.000Z' },
    { legId: 'market-001:no', type: 'reject', occurredAt: '2026-07-13T10:00:03.000Z' },
  ] as const;

  const replayed = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [orderedEvents[3], orderedEvents[1], orderedEvents[0], orderedEvents[2]],
  });
  const original = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: orderedEvents,
  });

  assert.equal(replayed.ok, true);
  assert.equal(original.ok, true);
  assert.deepEqual(replayed.value, original.value);
  assert.equal(original.value.residualExposure?.worstCaseScenarioId, 'no_wins');
});

test('non-atomic completion rejects rollback amounts that exceed the currently live fill', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'rollback', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:00.000Z' },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_ROLLBACK_EXCEEDS_LIVE_FILL',
      message: 'Non-atomic completion simulation requires rollback stake to stay within the currently live filled stake.',
      evidenceRequired: 'Rollback events bounded by previously filled stake on the same leg.',
    },
  ]);
});

test('non-atomic completion rejects missing scenario rows for a solved leg', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: {
      rows: Object.freeze(input.matrix.rows.filter((row) => !(row.legId === 'market-001:no' && row.scenarioId === 'yes_wins'))),
    },
    manualKill: false,
    events: [],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_SCENARIOS_MISSING',
      message: 'Non-atomic completion simulation requires every solved leg to cover every terminal scenario exactly once.',
      evidenceRequired: 'Complete terminal scenario cash-flow rows for each solved completion leg.',
    },
  ]);
});

test('non-atomic completion rejects live fill amounts that do not match the solved stake quantum', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 150n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:no', type: 'reject', occurredAt: '2026-07-13T10:00:01.000Z' },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_FILLED_STAKE_MISMATCH',
      message: 'Non-atomic residual exposure analysis requires live filled stake to align to the solved stake quantum.',
      evidenceRequired: 'Live filled stake amounts aligned to the deterministic solved stake quantum.',
    },
  ]);
});

function createTwoUnitSolvedInput(): StakeVectorInputContract {
  return {
    matrix: {
      rows: Object.freeze([
        Object.freeze({ scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n }),
      ]),
    },
    capacityConstraints: Object.freeze([
      Object.freeze({ legId: 'market-001:yes', minStakeMinor: 200n, maxStakeMinor: 200n }),
      Object.freeze({ legId: 'market-001:no', minStakeMinor: 200n, maxStakeMinor: 200n }),
    ]),
    roundingConstraints: Object.freeze([
      Object.freeze({ legId: 'market-001:yes', stepMinor: 100n }),
      Object.freeze({ legId: 'market-001:no', stepMinor: 100n }),
    ]),
  };
}
