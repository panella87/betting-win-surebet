import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeB1ResidualExposure,
} from '../src/simulation/b1-residual-exposure.js';

test('B1 residual exposure analysis scales filled legs across terminal scenarios', () => {
  const result = analyzeB1ResidualExposure(twoWayMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), 5_000n);

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
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

test('B1 residual exposure analysis rejects malformed top-level containers without throwing', () => {
  const malformedMatrix = analyzeB1ResidualExposure(null as never, Object.freeze([]), 0n);
  assert.equal(malformedMatrix.ok, false);
  assert.deepEqual(malformedMatrix.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_MATRIX_INVALID',
      message: 'B1 residual exposure simulation requires a structured scenario cash-flow matrix.',
      evidenceRequired: 'Structured B1 scenario cash-flow matrix with rows.',
    },
  ]);

  const malformedMatrixArray = analyzeB1ResidualExposure([] as never, Object.freeze([]), 0n);
  assert.equal(malformedMatrixArray.ok, false);
  assert.equal(malformedMatrixArray.blockers[0]?.code, 'B1_RESIDUAL_EXPOSURE_MATRIX_INVALID');

  const malformedRows = analyzeB1ResidualExposure({ rows: null } as never, Object.freeze([]), 0n);
  assert.equal(malformedRows.ok, false);
  assert.equal(malformedRows.blockers[0]?.code, 'B1_RESIDUAL_EXPOSURE_MATRIX_INVALID');

  const malformedLegs = analyzeB1ResidualExposure(twoWayMatrix(), null as never, 0n);
  assert.equal(malformedLegs.ok, false);
  assert.equal(malformedLegs.blockers[0]?.code, 'B1_RESIDUAL_EXPOSURE_LEG_INVALID');
});

test('B1 residual exposure analysis fails closed on missing leg snapshots', () => {
  const result = analyzeB1ResidualExposure(twoWayMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
  ]), 5_000n);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_MATRIX_LEG_MISSING',
      message: 'B1 residual exposure simulation requires a leg snapshot for every scenario cash-flow leg.',
      evidenceRequired: 'B1 leg snapshots aligned to the complete scenario cash-flow matrix.',
    },
  ]);
});

test('B1 residual exposure analysis fails closed on malformed leg evidence without throwing', () => {
  for (const malformedLeg of [
    null,
    [],
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000,
    }),
  ]) {
    const result = analyzeB1ResidualExposure(twoWayMatrix(), Object.freeze([
      malformedLeg,
      Object.freeze({
        legId: 'b1_leg:event-001:moneyline:home:venue-a',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        plannedStakeMinor: 10_000n,
        liveFilledStakeMinor: 0n,
      }),
    ]) as never, 5_000n);

    assert.equal(result.ok, false);
    assert.equal(result.blockers.length, 1);
    assert.match(result.blockers[0]?.code ?? '', /^B1_RESIDUAL_EXPOSURE_(LEG|STAKE)_INVALID$/);
  }
});

test('B1 residual exposure analysis fails closed on fractional partial payout scaling', () => {
  const result = analyzeB1ResidualExposure(fractionalPartialPayoutMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), 5_000n);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_PAYOUT_SCALING_FRACTIONAL',
      message: 'B1 residual exposure simulation requires partial payout scaling to resolve to integer minor units.',
      evidenceRequired: 'B1 scenario cash-flow payout scaling with no fractional minor-unit remainder.',
    },
  ]);
});

test('B1 residual exposure analysis blocks zero-stake matrix rows before payout arithmetic', () => {
  const result = analyzeB1ResidualExposure(zeroStakeMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), 5_000n);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_STAKE_NOT_POSITIVE',
      message: 'B1 scenario cash-flow validation requires positive stake rows.',
      evidenceRequired: 'Positive B1 scenario cash-flow stake amounts in integer minor units.',
    },
  ]);
});

test('B1 residual exposure analysis is not reached for malformed scenario winner matrices', () => {
  const result = analyzeB1ResidualExposure(malformedWinnerMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), 5_000n);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
      message: 'B1 scenario cash-flow validation requires the positive payout row to match the declared winner.',
      evidenceRequired: 'One winning B1 terminal outcome per scenario.',
    },
  ]);
});

test('B1 residual exposure analysis is not reached for scenario leg-key venue drift', () => {
  const result = analyzeB1ResidualExposure(venueDriftMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), 5_000n);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_LEG_KEY_DRIFT',
      message: 'B1 scenario cash-flow validation requires each selection to keep one stable venue across terminal scenarios.',
      evidenceRequired: 'Stable B1 scenario-by-leg-key coverage keyed by selection_equivalence_key and venue_or_bookmaker_id.',
    },
  ]);
});

test('B1 residual exposure analysis fails closed on invalid limits', () => {
  const result = analyzeB1ResidualExposure(twoWayMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), -1n);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
      message: 'B1 residual exposure simulation requires a non-negative explicit exposure limit.',
      evidenceRequired: 'Non-negative B1 residual exposure limit in integer minor units.',
    },
  ]);
});

test('B1 residual exposure analysis requires an explicit bigint limit', () => {
  const result = analyzeB1ResidualExposure(twoWayMatrix(), Object.freeze([
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:away:venue-b',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 5_000n,
    }),
    Object.freeze({
      legId: 'b1_leg:event-001:moneyline:home:venue-a',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      plannedStakeMinor: 10_000n,
      liveFilledStakeMinor: 0n,
    }),
  ]), undefined as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
      message: 'B1 residual exposure simulation requires a non-negative explicit exposure limit.',
      evidenceRequired: 'Non-negative B1 residual exposure limit in integer minor units.',
    },
  ]);
});

function twoWayMatrix() {
  return Object.freeze({
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
  });
}

function malformedWinnerMatrix() {
  return Object.freeze({
    rows: Object.freeze([
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 10_000n,
        payoutMinor: 0n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        stakeMinor: 10_000n,
        payoutMinor: 21_000n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 10_000n,
        payoutMinor: 21_000n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        stakeMinor: 10_000n,
        payoutMinor: 0n,
      }),
    ]),
  });
}

function venueDriftMatrix() {
  return Object.freeze({
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
        venueOrBookmakerId: 'venue-x',
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
  });
}

function fractionalPartialPayoutMatrix() {
  return Object.freeze({
    rows: Object.freeze(twoWayMatrix().rows.map((row) => Object.freeze({
      ...row,
      payoutMinor: row.scenarioId === 'b1_terminal:event-001:moneyline:away'
        && row.selectionEquivalenceKey === 'event-001:moneyline:away'
        ? 21_001n
        : row.payoutMinor,
    }))),
  });
}

function zeroStakeMatrix() {
  return Object.freeze({
    rows: Object.freeze(twoWayMatrix().rows.map((row, index) => Object.freeze({
      ...row,
      stakeMinor: index === 0 ? 0n : row.stakeMinor,
    }))),
  });
}
