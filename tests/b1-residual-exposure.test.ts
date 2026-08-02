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
