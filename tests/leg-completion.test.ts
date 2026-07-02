import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatePaperGroupCompletion } from '../src/simulation/leg-completion.js';

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
