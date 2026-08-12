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

test('non-atomic completion rejects same-leg same-timestamp reserve and fill ties in every input order', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const reserveEvent = { legId: 'market-001:yes', type: 'reserve' as const, stakeMinor: 100n, occurredAt: '2026-07-13T10:00:00.000Z' };
  const fillEvent = { legId: 'market-001:yes', type: 'fill' as const, stakeMinor: 100n, occurredAt: '2026-07-13T10:00:00.000Z' };

  for (const events of [
    [reserveEvent, fillEvent],
    [fillEvent, reserveEvent],
  ]) {
    const result = simulateNonAtomicPaperGroupCompletion({
      stakeVector: solved.value,
      matrix: input.matrix,
      manualKill: false,
      events,
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'NON_ATOMIC_COMPLETION_EVENT_ORDER_AMBIGUOUS',
        message: 'Non-atomic completion simulation rejects same-leg events with identical timestamps.',
        evidenceRequired: 'Unambiguous non-atomic completion event ordering per leg and timestamp.',
      },
    ]);
  }
});

test('non-atomic completion accepts cross-leg same-timestamp events when replay order is otherwise valid', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 200n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:no', type: 'fill', stakeMinor: 200n, occurredAt: '2026-07-13T10:00:00.000Z' },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.completion.groupState, 'group_complete');
  assert.equal(result.value.residualExposure, undefined);
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

test('non-atomic completion rejects rollback after terminal reject', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:yes', type: 'reject', occurredAt: '2026-07-13T10:00:01.000Z' },
      { legId: 'market-001:yes', type: 'rollback', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:02.000Z' },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_ROLLBACK_AFTER_TERMINAL_FORBIDDEN',
      message: 'Non-atomic completion simulation does not allow rollback events after rejection or expiry.',
      evidenceRequired: 'Event order that does not roll back a terminally rejected or expired leg.',
    },
  ]);
});

test('non-atomic completion rejects rollback after terminal expire', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:yes', type: 'expire', occurredAt: '2026-07-13T10:00:01.000Z' },
      { legId: 'market-001:yes', type: 'rollback', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:02.000Z' },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_ROLLBACK_AFTER_TERMINAL_FORBIDDEN',
      message: 'Non-atomic completion simulation does not allow rollback events after rejection or expiry.',
      evidenceRequired: 'Event order that does not roll back a terminally rejected or expired leg.',
    },
  ]);
});

test('non-atomic completion rejects malformed manual kill evidence', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: 'false',
    events: [],
  } as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_MANUAL_KILL_INVALID',
      message: 'Non-atomic completion simulation requires manualKill to be an explicit boolean.',
      evidenceRequired: 'Explicit boolean manualKill evidence for the non-atomic completion group.',
    },
  ]);
});

test('non-atomic completion rejects malformed boundary containers without throwing', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const malformedInput = simulateNonAtomicPaperGroupCompletion(null as never);
  assert.equal(malformedInput.ok, false);
  assert.equal(malformedInput.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_INPUT_INVALID');

  const malformedEvents = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: null,
  } as never);
  assert.equal(malformedEvents.ok, false);
  assert.equal(malformedEvents.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_EVENTS_INVALID');

  const malformedStakeVector = simulateNonAtomicPaperGroupCompletion({
    stakeVector: null,
    matrix: input.matrix,
    manualKill: false,
    events: [],
  } as never);
  assert.equal(malformedStakeVector.ok, false);
  assert.equal(malformedStakeVector.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_STAKE_VECTOR_INVALID');

  const malformedStakeLeg = simulateNonAtomicPaperGroupCompletion({
    stakeVector: {
      ...solved.value,
      stakes: [null],
    },
    matrix: input.matrix,
    manualKill: false,
    events: [],
  } as never);
  assert.equal(malformedStakeLeg.ok, false);
  assert.equal(malformedStakeLeg.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_STAKE_PLAN_INVALID');

  const malformedMatrix = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: null,
    manualKill: false,
    events: [],
  } as never);
  assert.equal(malformedMatrix.ok, false);
  assert.equal(malformedMatrix.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_MATRIX_INVALID');

  const malformedEvent = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [null],
  } as never);
  assert.equal(malformedEvent.ok, false);
  assert.equal(malformedEvent.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_EVENT_INVALID');

  const malformedEventTimestamp = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'reserve', stakeMinor: 100n, occurredAt: undefined },
    ],
  } as never);
  assert.equal(malformedEventTimestamp.ok, false);
  assert.equal(malformedEventTimestamp.blockers[0]?.code, 'NON_ATOMIC_COMPLETION_EVENT_TIMESTAMP_INVALID');
});

test('non-atomic completion rejects non-bigint event stake before arithmetic', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'reserve', stakeMinor: 100, occurredAt: '2026-07-13T10:00:00.000Z' },
    ],
  } as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_EVENT_STAKE_INVALID',
      message: 'Non-atomic completion event reserve requires a positive fixed-point stake amount.',
      evidenceRequired: 'Positive fixed-point stake amounts for reserve, fill, and rollback events.',
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

test('non-atomic completion rejects whole standard-binary scenario omission', () => {
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: {
      rows: Object.freeze(input.matrix.rows.filter((row) => row.scenarioId === 'yes_wins')),
    },
    manualKill: false,
    events: [],
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

test('non-atomic completion accepts a solved quantum smaller than the scenario stake when scaling is integral', () => {
  const input = createSmallerQuantumSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);
  assert.equal(solved.value.stakes[0]?.stakeQuantumMinor, 50n);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 50n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:no', type: 'expire', occurredAt: '2026-07-13T10:00:01.000Z' },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.completion.groupState, 'group_incomplete');
  assert.deepEqual(result.value.residualExposure?.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: -50n },
    { scenarioId: 'yes_wins', netMinor: 60n },
  ]);
});

test('non-atomic completion rejects a smaller solved quantum when matrix scaling is fractional', () => {
  const input = createSmallerQuantumSolvedInput();
  const fractionalMatrixInput = createSmallerQuantumSolvedInput(221n);
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const result = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: fractionalMatrixInput.matrix,
    manualKill: false,
    events: [],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'NON_ATOMIC_COMPLETION_MATRIX_QUANTUM_MISMATCH',
      message: 'Non-atomic completion simulation requires solved stake quanta to scale scenario cash-flow rows to integer minor units.',
      evidenceRequired: 'Solved stake quanta with integral deterministic scenario cash-flow contributions.',
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

function createSmallerQuantumSolvedInput(winningPayoutMinor = 220n): StakeVectorInputContract {
  return {
    matrix: {
      rows: Object.freeze([
        Object.freeze({ scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: winningPayoutMinor, feeMinor: 0n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: winningPayoutMinor, feeMinor: 0n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 0n, costMinor: 0n }),
      ]),
    },
    capacityConstraints: Object.freeze([
      Object.freeze({ legId: 'market-001:no', minStakeMinor: 150n, maxStakeMinor: 150n }),
      Object.freeze({ legId: 'market-001:yes', minStakeMinor: 150n, maxStakeMinor: 150n }),
    ]),
    roundingConstraints: Object.freeze([
      Object.freeze({ legId: 'market-001:no', stepMinor: 50n }),
      Object.freeze({ legId: 'market-001:yes', stepMinor: 50n }),
    ]),
  };
}
