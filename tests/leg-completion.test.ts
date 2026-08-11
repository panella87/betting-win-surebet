import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatePaperGroupCompletion } from '../src/simulation/leg-completion.js';
import { partialFillModelStatus } from '../src/simulation/partial-fill.js';


test('partial fill status points to the implemented local completion modules', () => {
  const result = partialFillModelStatus();

  assert.equal(result.ok, true);
  assert.equal(result.value.implementation, 'local_fixture_completion_state_machine');
  assert.equal(result.value.realUpstreamAcceptance, 'blocked_until_pinned_betting_win_interface');
  assert.equal(result.value.implementationModule, 'src/simulation/leg-completion.ts');
  assert.equal(result.value.residualExposureModule, 'src/simulation/residual-exposure.ts');
});

test('leg completion simulation derives the expected local paper group states', () => {
  const cases = [
    {
      name: 'group_open',
      legs: [
        createLeg('leg-1', 'leg_open', 0n, 0n, '2026-07-02T00:17:05.000Z'),
        createLeg('leg-2', 'leg_open', 0n, 0n, '2026-07-02T00:17:05.000Z'),
      ],
      expectedGroupState: 'group_open',
    },
    {
      name: 'group_reserved',
      legs: [
        createLeg('leg-1', 'leg_open', 0n, 0n, '2026-07-02T00:17:05.000Z'),
        createLeg('leg-2', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'),
      ],
      expectedGroupState: 'group_reserved',
    },
    {
      name: 'group_complete',
      legs: [
        createLeg('leg-1', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
        createLeg('leg-2', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
      ],
      expectedGroupState: 'group_complete',
    },
    {
      name: 'group_settlement_pending',
      legs: [
        createLeg('leg-1', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
        createLeg('leg-2', 'leg_settlement_pending', 0n, 100n, '2026-07-02T00:17:05.000Z'),
      ],
      expectedGroupState: 'group_settlement_pending',
    },
    {
      name: 'group_incomplete_from_failed_leg',
      legs: [
        createLeg('leg-1', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
        createLeg('leg-2', 'leg_failed', 0n, 0n, '2026-07-02T00:17:05.000Z'),
      ],
      expectedGroupState: 'group_incomplete',
    },
    {
      name: 'group_incomplete_from_stale_leg',
      legs: [
        createLeg('leg-1', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
        createLeg('leg-2', 'leg_stale', 0n, 0n, '2026-07-02T00:17:05.000Z'),
      ],
      expectedGroupState: 'group_incomplete',
    },
  ] as const;

  for (const testCase of cases) {
    const result = simulatePaperGroupCompletion({
      legs: testCase.legs,
      manualKill: false,
    });

    assert.equal(result.ok, true, testCase.name);
    assert.equal(result.value.groupState, testCase.expectedGroupState, testCase.name);
  }
});

test('leg completion simulation marks the group as killed when manual kill is raised', () => {
  const result = simulatePaperGroupCompletion({
    legs: [
      createLeg('leg-1', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'),
      createLeg('leg-2', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    ],
    manualKill: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.groupState, 'group_killed');
});

test('leg completion simulation rejects malformed manual kill evidence', () => {
  const result = simulatePaperGroupCompletion({
    legs: [
      createLeg('leg-1', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'),
      createLeg('leg-2', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'),
    ],
    manualKill: 'false',
  } as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'LEG_COMPLETION_MANUAL_KILL_INVALID',
      message: 'Leg completion simulation requires manualKill to be an explicit boolean.',
      evidenceRequired: 'Explicit boolean manualKill evidence for the local paper completion group.',
    },
  ]);
});

test('leg completion simulation rejects malformed top-level and leg containers without throwing', () => {
  const malformedInput = simulatePaperGroupCompletion(null as never);
  assert.equal(malformedInput.ok, false);
  assert.equal(malformedInput.blockers[0]?.code, 'LEG_COMPLETION_INPUT_INVALID');

  const malformedLegs = simulatePaperGroupCompletion({
    legs: null,
    manualKill: false,
  } as never);
  assert.equal(malformedLegs.ok, false);
  assert.equal(malformedLegs.blockers[0]?.code, 'LEG_COMPLETION_LEGS_INVALID');

  const malformedLeg = simulatePaperGroupCompletion({
    legs: [null],
    manualKill: false,
  } as never);
  assert.equal(malformedLeg.ok, false);
  assert.equal(malformedLeg.blockers[0]?.code, 'LEG_COMPLETION_LEG_INVALID');

  const malformedLegId = simulatePaperGroupCompletion({
    legs: [
      {
        ...createLeg('leg-1', 'leg_open', 0n, 0n, '2026-07-02T00:17:05.000Z'),
        legId: undefined,
      },
    ],
    manualKill: false,
  } as never);
  assert.equal(malformedLegId.ok, false);
  assert.equal(malformedLegId.blockers[0]?.code, 'LEG_COMPLETION_LEG_ID_MISSING');

  const malformedTimestamp = simulatePaperGroupCompletion({
    legs: [
      {
        ...createLeg('leg-1', 'leg_open', 0n, 0n, '2026-07-02T00:17:05.000Z'),
        updatedAt: undefined,
      },
    ],
    manualKill: false,
  } as never);
  assert.equal(malformedTimestamp.ok, false);
  assert.equal(malformedTimestamp.blockers[0]?.code, 'LEG_COMPLETION_TIMESTAMP_INVALID');
});

test('leg completion simulation rejects malformed runtime stake field shapes', () => {
  const cases = [
    {
      name: 'filled stake string',
      leg: { ...createLeg('leg-1', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'), filledStakeMinor: '100' },
    },
    {
      name: 'filled stake missing',
      leg: {
        legId: 'leg-2',
        state: 'leg_filled',
        reservedStakeMinor: 0n,
        updatedAt: '2026-07-02T00:17:05.000Z',
      },
    },
    {
      name: 'reserved stake string',
      leg: { ...createLeg('leg-3', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'), reservedStakeMinor: '100' },
    },
    {
      name: 'reserved stake number',
      leg: { ...createLeg('leg-4', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'), reservedStakeMinor: 100 },
    },
    {
      name: 'filled stake null',
      leg: { ...createLeg('leg-5', 'leg_filled', 0n, 100n, '2026-07-02T00:17:05.000Z'), filledStakeMinor: null },
    },
    {
      name: 'reserved stake object',
      leg: { ...createLeg('leg-6', 'leg_reserved', 100n, 0n, '2026-07-02T00:17:05.000Z'), reservedStakeMinor: {} },
    },
  ] as const;

  for (const testCase of cases) {
    const result = simulatePaperGroupCompletion({
      legs: [Object.freeze(testCase.leg)],
      manualKill: false,
    } as never);

    assert.equal(result.ok, false, testCase.name);
    assert.deepEqual(
      result.blockers,
      [
        {
          code: 'LEG_COMPLETION_STAKE_INVALID',
          message: 'Leg completion simulation requires reserved and filled stake amounts encoded as bigint minor units.',
          evidenceRequired: 'Bigint local paper reserved and filled stake amounts.',
        },
      ],
      testCase.name,
    );
  }
});

test('leg completion simulation rejects state and stake mismatches', () => {
  const result = simulatePaperGroupCompletion({
    legs: [createLeg('leg-1', 'leg_reserved', 0n, 0n, '2026-07-02T00:17:05.000Z')],
    manualKill: false,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'LEG_COMPLETION_STATE_STAKE_MISMATCH',
      message: 'Reserved legs require positive reserved stake and zero filled stake.',
      evidenceRequired: 'State-aligned local paper stake amounts for each leg snapshot.',
    },
  ]);
});

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
