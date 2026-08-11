import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simulateB1FillRejectionTimeout,
} from '../src/simulation/b1-leg-completion.js';
import type { B1GeneralizedStakeVectorSolution } from '../src/solver/b1-generalized-stake-vector.js';

test('B1 fillability simulation accepts only fully filled offline stake vectors as fillable', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 0n,
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 10_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:04.000Z',
        stakeMinor: 10_000n,
      }),
    ]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.simulationKind, 'deterministic_b1_fill_rejection_timeout_simulation');
  assert.equal(result.value.groupState, 'group_filled');
  assert.equal(result.value.residualExposure, undefined);
  assert.deepEqual(result.value.legs.map((leg) => ({
    legId: leg.legId,
    liveFilledStakeMinor: leg.liveFilledStakeMinor,
    terminalDisposition: leg.terminalDisposition,
    state: leg.state,
  })), [
    {
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      liveFilledStakeMinor: 10_000n,
      terminalDisposition: 'none',
      state: 'leg_filled',
    },
    {
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      liveFilledStakeMinor: 10_000n,
      terminalDisposition: 'none',
      state: 'leg_filled',
    },
  ]);
  assert.equal(result.value.executable, false);
  assert.equal(result.value.unwindAttempted, false);
  assert.equal(result.value.liveReadiness, 'not_authorized_bws_900_parked');
});

test('B1 rejection and timeout simulation reports incomplete legs and in-limit residual exposure without unwind', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 5_000n,
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 5_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'reject',
        occurredAtUtc: '2026-07-01T00:00:04.000Z',
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        type: 'timeout',
        occurredAtUtc: '2026-07-01T00:00:05.000Z',
      }),
    ]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.groupState, 'group_incomplete');
  assert.equal(result.value.executable, false);
  assert.equal(result.value.unwindAttempted, false);
  assert.deepEqual(result.value.legs.map((leg) => ({
    legId: leg.legId,
    liveFilledStakeMinor: leg.liveFilledStakeMinor,
    unfilledStakeMinor: leg.unfilledStakeMinor,
    terminalDisposition: leg.terminalDisposition,
    state: leg.state,
  })), [
    {
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      liveFilledStakeMinor: 5_000n,
      unfilledStakeMinor: 5_000n,
      terminalDisposition: 'rejected',
      state: 'leg_partial',
    },
    {
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      liveFilledStakeMinor: 0n,
      unfilledStakeMinor: 10_000n,
      terminalDisposition: 'timed_out',
      state: 'leg_timed_out',
    },
  ]);
  assert.deepEqual(result.value.residualExposure, {
    exposureKind: 'deterministic_b1_residual_exposure',
    exposedLegIds: ['b1_leg:event-001:moneyline:away:venue-b'],
    excludedLegIds: ['b1_leg:event-001:moneyline:home:venue-a'],
    scenarioNets: [
      {
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        netMinor: 5_500n,
      },
      {
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        netMinor: -5_000n,
      },
    ],
    worstCaseNetMinor: -5_000n,
    worstCaseScenarioId: 'b1_terminal:event-001:moneyline:home',
    maxResidualExposureMinor: 5_000n,
    residualExposureWithinLimit: true,
  });
});

test('B1 fillability simulation fails closed when residual exposure exceeds the configured limit', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 4_000n,
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 5_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'reject',
        occurredAtUtc: '2026-07-01T00:00:04.000Z',
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        type: 'timeout',
        occurredAtUtc: '2026-07-01T00:00:05.000Z',
      }),
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_LIMIT_EXCEEDED',
      message: 'B1 fillability simulation requires residual exposure to stay within the configured limit.',
      evidenceRequired: 'Worst-case B1 residual exposure within maxResidualExposureMinor.',
    },
  ]);
});

test('B1 fillability simulation rejects non-bigint fill stakes before arithmetic', () => {
  for (const stakeMinor of [10_000, '10000']) {
    const result = simulateB1FillRejectionTimeout({
      stakeVector: solvedStakeVector(),
      maxResidualExposureMinor: 10_000n,
      events: Object.freeze([
        Object.freeze({
          selectionEquivalenceKey: 'event-001:moneyline:away',
          venueOrBookmakerId: 'venue-b',
          type: 'fill',
          occurredAtUtc: '2026-07-01T00:00:03.000Z',
          stakeMinor,
        }),
      ]),
    } as never);

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'B1_FILLABILITY_FILL_STAKE_INVALID',
        message: 'B1 fillability fill events require a positive integer minor-unit stake.',
        evidenceRequired: 'Positive B1 fill stake in integer minor units.',
      },
    ]);
  }
});

test('B1 fillability replay is deterministic after restart regardless of event order', () => {
  const events = Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      type: 'fill',
      occurredAtUtc: '2026-07-01T00:00:03.000Z',
      stakeMinor: 5_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      type: 'reject',
      occurredAtUtc: '2026-07-01T00:00:04.000Z',
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      type: 'timeout',
      occurredAtUtc: '2026-07-01T00:00:05.000Z',
    }),
  ] as const);

  const original = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 10_000n,
    events,
  });
  const replayed = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 10_000n,
    events: Object.freeze([events[2], events[0], events[1]]),
  });

  assert.equal(original.ok, true);
  assert.equal(replayed.ok, true);
  assert.deepEqual(replayed.value, original.value);
});

test('B1 fillability simulation rejects same-leg same-timestamp event ties in every input order', () => {
  const fillEvent = Object.freeze({
    selectionEquivalenceKey: 'event-001:moneyline:away',
    venueOrBookmakerId: 'venue-b',
    type: 'fill' as const,
    occurredAtUtc: '2026-07-01T00:00:03.000Z',
    stakeMinor: 5_000n,
  });
  const rejectEvent = Object.freeze({
    selectionEquivalenceKey: 'event-001:moneyline:away',
    venueOrBookmakerId: 'venue-b',
    type: 'reject' as const,
    occurredAtUtc: '2026-07-01T00:00:03.000Z',
  });

  for (const events of [
    Object.freeze([fillEvent, rejectEvent]),
    Object.freeze([rejectEvent, fillEvent]),
  ]) {
    const result = simulateB1FillRejectionTimeout({
      stakeVector: solvedStakeVector(),
      maxResidualExposureMinor: 10_000n,
      events,
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'B1_FILLABILITY_SAME_LEG_TIMESTAMP_AMBIGUOUS',
        message: 'B1 fillability simulation rejects same-leg events with identical timestamps.',
        evidenceRequired: 'Unambiguous B1 fillability event ordering per leg and timestamp.',
      },
    ]);
  }
});

test('B1 fillability simulation rejects calendar-invalid event timestamps before replay mutation', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 10_000n,
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 10_001n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        type: 'timeout',
        occurredAtUtc: '2026-02-31T00:00:00.000Z',
      }),
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FILLABILITY_EVENT_TIMESTAMP_INVALID',
      message: 'B1 fillability simulation requires ISO-8601 UTC timestamps for every event.',
      evidenceRequired: 'ISO-8601 UTC B1 fillability event timestamps.',
    },
  ]);
});

test('B1 fillability simulation requires an explicit bigint residual exposure limit', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 10_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:04.000Z',
        stakeMinor: 10_000n,
      }),
    ]),
  } as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
      message: 'B1 fillability simulation requires a non-negative explicit residual exposure limit.',
      evidenceRequired: 'Non-negative B1 residual exposure limit in integer minor units.',
    },
  ]);
});

test('B1 fillability simulation rejects rollback and unwind events explicitly', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 10_000n,
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'rollback',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 1_000n,
      }),
    ]) as never,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FILLABILITY_UNWIND_FORBIDDEN',
      message: 'B1 fillability simulation forbids rollback or unwind events for cross-venue B1 candidates.',
      evidenceRequired: 'Fill, reject or timeout events only; no unwind or execution mitigation.',
    },
  ]);
});

test('B1 fillability simulation fails closed when a fill exceeds the solved stake plan', () => {
  const result = simulateB1FillRejectionTimeout({
    stakeVector: solvedStakeVector(),
    maxResidualExposureMinor: 10_000n,
    events: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill',
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 10_001n,
      }),
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FILLABILITY_FILL_EXCEEDS_PLAN',
      message: 'B1 fillability simulation requires filled stake to stay within the solved stake plan.',
      evidenceRequired: 'B1 fills bounded by the solved generalized stake vector.',
    },
  ]);
});

function solvedStakeVector(): B1GeneralizedStakeVectorSolution {
  return Object.freeze({
    ok: true,
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    stakeVectorKind: 'deterministic_b1_generalized_stake_vector',
    terminalOutcomeCount: 2,
    terminalScenarios: Object.freeze([
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        outcomeName: 'Away',
        outcomeSide: 'away',
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        outcomeName: 'Home',
        outcomeSide: 'home',
      }),
    ]),
    stakes: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        outcomeName: 'Away',
        outcomeSide: 'away',
        venueOrBookmakerId: 'venue-b',
        decimalOddsMicro: 2_100_000n,
        rawStakeMinor: 10_000n,
        stakeMinor: 10_000n,
        stakeStepMinor: 1n,
        roundingLossMinor: 0n,
        payoutIfWonMinor: 21_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        outcomeName: 'Home',
        outcomeSide: 'home',
        venueOrBookmakerId: 'venue-a',
        decimalOddsMicro: 2_100_000n,
        rawStakeMinor: 10_000n,
        stakeMinor: 10_000n,
        stakeStepMinor: 1n,
        roundingLossMinor: 0n,
        payoutIfWonMinor: 21_000n,
      }),
    ]),
    stakeAssumptions: Object.freeze([
      Object.freeze({ selectionEquivalenceKey: 'event-001:moneyline:away', stakeMinor: 10_000n }),
      Object.freeze({ selectionEquivalenceKey: 'event-001:moneyline:home', stakeMinor: 10_000n }),
    ]),
    scenarioCashflowMatrix: Object.freeze({
      rows: Object.freeze([
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:away',
          winningSelectionEquivalenceKey: 'event-001:moneyline:away',
          selectionEquivalenceKey: 'event-001:moneyline:away',
          venueOrBookmakerId: 'venue-b',
          stakeMinor: 10_000n,
          payoutMinor: 21_000n,
        }),
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:away',
          winningSelectionEquivalenceKey: 'event-001:moneyline:away',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          venueOrBookmakerId: 'venue-a',
          stakeMinor: 10_000n,
          payoutMinor: 0n,
        }),
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:home',
          winningSelectionEquivalenceKey: 'event-001:moneyline:home',
          selectionEquivalenceKey: 'event-001:moneyline:away',
          venueOrBookmakerId: 'venue-b',
          stakeMinor: 10_000n,
          payoutMinor: 0n,
        }),
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:home',
          winningSelectionEquivalenceKey: 'event-001:moneyline:home',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          venueOrBookmakerId: 'venue-a',
          stakeMinor: 10_000n,
          payoutMinor: 21_000n,
        }),
      ]),
    }),
    scenarioNets: Object.freeze([
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        payoutMinor: 21_000n,
        netMinor: 1_000n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        payoutMinor: 21_000n,
        netMinor: 1_000n,
      }),
    ]),
    totalStakeMinor: 20_000n,
    totalRoundingLossMinor: 0n,
    worstCaseNetMinor: 1_000n,
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  });
}
