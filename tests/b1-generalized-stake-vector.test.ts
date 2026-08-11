import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';
import type { B1MultiVenueMarketRow } from '../src/contracts/b1-local-types.js';
import {
  deriveB1CrossVenueGrossOpportunityCandidates,
  type B1AcceptedGrossOpportunityCandidate,
} from '../src/opportunity/b1-cross-venue-derivation.js';
import {
  buildB1GrossQuoteContribution,
} from '../src/opportunity/b1-gross-spread.js';
import {
  solveB1GeneralizedStakeVector,
  type B1GeneralizedStakeVectorPolicy,
} from '../src/solver/b1-generalized-stake-vector.js';
import {
  roundUpB1StakeMinor,
} from '../src/solver/b1-rounding.js';

const FIXTURE_PATH = 'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json';

function fixtureRows(): readonly B1MultiVenueMarketRow[] {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as unknown;
  const parsed = parseBettingWinB1DeterministicFixture(raw);
  assert.equal(parsed.ok, true);
  return parsed.value.rows;
}

function cloneRow(row: B1MultiVenueMarketRow, overrides: Partial<B1MultiVenueMarketRow>): B1MultiVenueMarketRow {
  return Object.freeze({
    ...row,
    ...overrides,
  });
}

function twoOutcomeGrossRows(): readonly B1MultiVenueMarketRow[] {
  const rows = fixtureRows();
  const homeA = rows[0];
  const homeB = rows[1];
  assert.ok(homeA);
  assert.ok(homeB);
  const normalizedHomeB = cloneRow(homeB, { decimalOdds: '2.00' });
  const awayA = cloneRow(homeA, {
    canonicalSelectionId: 'selection-away-a',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
    decimalOdds: '1.85',
  });
  const awayB = cloneRow(homeB, {
    canonicalSelectionId: 'selection-away-b',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
    decimalOdds: '2.10',
  });
  return Object.freeze([awayB, homeA, normalizedHomeB, awayA]);
}

function acceptedTwoWayGrossCandidate(): B1AcceptedGrossOpportunityCandidate {
  const result = deriveB1CrossVenueGrossOpportunityCandidates(twoOutcomeGrossRows(), Object.freeze({
    comparisonTimeUtc: '2026-07-01T00:00:02.250Z',
    maxQuoteAgeMs: 1500n,
    maxRetrievalLagMs: 1000n,
    maxComparisonWindowMs: 500n,
    requireOpenMarketStatus: true,
  }));
  assert.equal(result.ok, true);
  const candidate = result.value[0];
  assert.ok(candidate);
  assert.equal(candidate.ok, true);
  return candidate;
}

function twoWayPolicy(overrides: Partial<B1GeneralizedStakeVectorPolicy> = {}): B1GeneralizedStakeVectorPolicy {
  return Object.freeze({
    legConstraints: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        minStakeMinor: 10_000n,
        maxStakeMinor: 50_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        minStakeMinor: 10_000n,
        maxStakeMinor: 50_000n,
        stakeStepMinor: 1n,
      }),
    ]),
    targetWorstCaseNetMinor: 500n,
    maximumTotalRoundingLossMinor: 0n,
    maxSearchIterations: 128,
    ...overrides,
  });
}

test('B1 generalized stake-vector solver returns deterministic 2-way integer stake assumptions', () => {
  const result = solveB1GeneralizedStakeVector(acceptedTwoWayGrossCandidate(), twoWayPolicy());

  assert.equal(result.ok, true);
  assert.equal(result.value.stakeVectorKind, 'deterministic_b1_generalized_stake_vector');
  assert.equal(result.value.terminalOutcomeCount, 2);
  assert.deepEqual(result.value.stakeAssumptions, [
    { selectionEquivalenceKey: 'event-001:moneyline:away', stakeMinor: 10_000n },
    { selectionEquivalenceKey: 'event-001:moneyline:home', stakeMinor: 10_000n },
  ]);
  assert.equal(result.value.totalStakeMinor, 20_000n);
  assert.equal(result.value.totalRoundingLossMinor, 0n);
  assert.deepEqual(result.value.scenarioNets, [
    {
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      payoutMinor: 21_000n,
      netMinor: 1_000n,
    },
    {
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      payoutMinor: 21_000n,
      netMinor: 1_000n,
    },
  ]);
  assert.equal(result.value.worstCaseNetMinor, 1_000n);
  assert.equal(result.value.executable, false);
  assert.equal(result.value.liveReadiness, 'not_authorized_bws_900_parked');
});

test('B1 generalized stake-vector solver supports 3-way complete-market portfolios', () => {
  const result = solveB1GeneralizedStakeVector(threeWayGrossCandidate(), Object.freeze({
    legConstraints: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-002:moneyline:away',
        venueOrBookmakerId: 'venue-c',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-002:moneyline:draw',
        venueOrBookmakerId: 'venue-b',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-002:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
    ]),
    targetWorstCaseNetMinor: 400n,
    maximumTotalRoundingLossMinor: 0n,
    maxSearchIterations: 64,
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.terminalOutcomeCount, 3);
  assert.deepEqual(result.value.stakeAssumptions, [
    { selectionEquivalenceKey: 'event-002:moneyline:away', stakeMinor: 1_000n },
    { selectionEquivalenceKey: 'event-002:moneyline:draw', stakeMinor: 1_059n },
    { selectionEquivalenceKey: 'event-002:moneyline:home', stakeMinor: 1_125n },
  ]);
  assert.equal(result.value.totalStakeMinor, 3_184n);
  assert.equal(result.value.worstCaseNetMinor, 416n);
  assert.equal(result.value.scenarioCashflowMatrix.rows.length, 9);
});

test('B1 generalized stake-vector solver fails closed on explicit rounding-loss limits', () => {
  const result = solveB1GeneralizedStakeVector(acceptedTwoWayGrossCandidate(), twoWayPolicy({
    legConstraints: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        minStakeMinor: 10_000n,
        maxStakeMinor: 50_000n,
        stakeStepMinor: 3_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        minStakeMinor: 10_000n,
        maxStakeMinor: 50_000n,
        stakeStepMinor: 3_000n,
      }),
    ]),
    maximumTotalRoundingLossMinor: 0n,
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_STAKE_VECTOR_ROUNDING_LOSS',
      message: 'B1 generalized stake-vector solving rejects stake rounding loss above the explicit policy limit.',
      evidenceRequired: 'B1 stake steps fine enough to keep total rounding loss within policy.',
    },
  ]);
});

test('B1 generalized stake-vector solver rejects malformed bigint policy fields', () => {
  const missingTargetPolicy = Object.freeze({
    ...twoWayPolicy(),
    targetWorstCaseNetMinor: undefined,
  });
  const missingTarget = solveB1GeneralizedStakeVector(acceptedTwoWayGrossCandidate(), missingTargetPolicy as never);
  assert.equal(missingTarget.ok, false);
  assert.equal(missingTarget.blockers[0]?.code, 'B1_STAKE_VECTOR_POLICY_INVALID');

  const missingConstraintCapacityPolicy = Object.freeze({
    ...twoWayPolicy(),
    legConstraints: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        minStakeMinor: undefined,
        maxStakeMinor: 50_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        minStakeMinor: 10_000n,
        maxStakeMinor: 50_000n,
        stakeStepMinor: 1n,
      }),
    ]),
  });
  const missingConstraintCapacity = solveB1GeneralizedStakeVector(acceptedTwoWayGrossCandidate(), missingConstraintCapacityPolicy as never);
  assert.equal(missingConstraintCapacity.ok, false);
  assert.equal(missingConstraintCapacity.blockers[0]?.code, 'B1_STAKE_VECTOR_CAPACITY_INVALID');
});

test('B1 generalized stake-vector solver rejects malformed leg constraint entries before field access', () => {
  const malformedConstraints: readonly {
    readonly name: string;
    readonly constraint: unknown;
    readonly code: string;
  }[] = Object.freeze([
    Object.freeze({
      name: 'null constraint',
      constraint: null,
      code: 'B1_STAKE_VECTOR_CONSTRAINT_INVALID',
    }),
    Object.freeze({
      name: 'array constraint',
      constraint: Object.freeze([]),
      code: 'B1_STAKE_VECTOR_CONSTRAINT_INVALID',
    }),
    Object.freeze({
      name: 'scalar constraint',
      constraint: 10,
      code: 'B1_STAKE_VECTOR_CONSTRAINT_INVALID',
    }),
    Object.freeze({
      name: 'malformed object constraint',
      constraint: Object.freeze({}),
      code: 'B1_SELECTION_EQUIVALENCE_MISSING',
    }),
  ]);

  for (const malformedConstraint of malformedConstraints) {
    assert.doesNotThrow(() => {
      const result = solveB1GeneralizedStakeVector(acceptedTwoWayGrossCandidate(), Object.freeze({
        ...twoWayPolicy(),
        legConstraints: Object.freeze([
          malformedConstraint.constraint,
          Object.freeze({
            selectionEquivalenceKey: 'event-001:moneyline:home',
            venueOrBookmakerId: 'venue-a',
            minStakeMinor: 10_000n,
            maxStakeMinor: 50_000n,
            stakeStepMinor: 1n,
          }),
        ]),
      }) as never);

      assert.equal(result.ok, false, malformedConstraint.name);
      assert.equal(result.blockers[0]?.code, malformedConstraint.code, malformedConstraint.name);
    }, malformedConstraint.name);
  }
});

test('B1 stake rounding blocks malformed direct bigint inputs without throwing', () => {
  const missingRawStake = roundUpB1StakeMinor(undefined as never, 5n);
  assert.equal(missingRawStake.ok, false);
  assert.equal(missingRawStake.blockers[0]?.code, 'B1_STAKE_NOT_POSITIVE');

  const missingStep = roundUpB1StakeMinor(10_000n, undefined as never);
  assert.equal(missingStep.ok, false);
  assert.equal(missingStep.blockers[0]?.code, 'B1_STAKE_VECTOR_ROUNDING_STEP_INVALID');
});

test('B1 generalized stake-vector solver blocks unsupported outcome cardinality', () => {
  const result = solveB1GeneralizedStakeVector(fourWayGrossCandidate(), Object.freeze({
    legConstraints: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-003:market:o1',
        venueOrBookmakerId: 'venue-a',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-003:market:o2',
        venueOrBookmakerId: 'venue-b',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-003:market:o3',
        venueOrBookmakerId: 'venue-c',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-003:market:o4',
        venueOrBookmakerId: 'venue-d',
        minStakeMinor: 1_000n,
        maxStakeMinor: 10_000n,
        stakeStepMinor: 1n,
      }),
    ]),
    targetWorstCaseNetMinor: 1n,
    maximumTotalRoundingLossMinor: 0n,
    maxSearchIterations: 16,
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_STAKE_VECTOR_OUTCOME_COUNT_UNSUPPORTED',
      message: 'B1 generalized stake-vector solving supports only complete 2-way and 3-way terminal outcome sets.',
      evidenceRequired: 'Complete B1 2-way or 3-way selected quote set.',
    },
  ]);
});

function threeWayGrossCandidate(): B1AcceptedGrossOpportunityCandidate {
  return buildSyntheticGrossCandidate('event-002:moneyline', [
    {
      selectionEquivalenceKey: 'event-002:moneyline:home',
      outcomeName: 'Home',
      outcomeSide: 'home',
      venueOrBookmakerId: 'venue-a',
      decimalOdds: '3.20',
    },
    {
      selectionEquivalenceKey: 'event-002:moneyline:draw',
      outcomeName: 'Draw',
      outcomeSide: 'draw',
      venueOrBookmakerId: 'venue-b',
      decimalOdds: '3.40',
    },
    {
      selectionEquivalenceKey: 'event-002:moneyline:away',
      outcomeName: 'Away',
      outcomeSide: 'away',
      venueOrBookmakerId: 'venue-c',
      decimalOdds: '3.60',
    },
  ]);
}

function fourWayGrossCandidate(): B1AcceptedGrossOpportunityCandidate {
  return buildSyntheticGrossCandidate('event-003:market', [
    {
      selectionEquivalenceKey: 'event-003:market:o1',
      outcomeName: 'One',
      outcomeSide: 'one',
      venueOrBookmakerId: 'venue-a',
      decimalOdds: '4.80',
    },
    {
      selectionEquivalenceKey: 'event-003:market:o2',
      outcomeName: 'Two',
      outcomeSide: 'two',
      venueOrBookmakerId: 'venue-b',
      decimalOdds: '4.90',
    },
    {
      selectionEquivalenceKey: 'event-003:market:o3',
      outcomeName: 'Three',
      outcomeSide: 'three',
      venueOrBookmakerId: 'venue-c',
      decimalOdds: '5.00',
    },
    {
      selectionEquivalenceKey: 'event-003:market:o4',
      outcomeName: 'Four',
      outcomeSide: 'four',
      venueOrBookmakerId: 'venue-d',
      decimalOdds: '5.10',
    },
  ]);
}

function buildSyntheticGrossCandidate(
  marketEquivalenceKey: string,
  quoteInputs: readonly {
    readonly selectionEquivalenceKey: string;
    readonly outcomeName: string;
    readonly outcomeSide: string;
    readonly venueOrBookmakerId: string;
    readonly decimalOdds: string;
  }[],
): B1AcceptedGrossOpportunityCandidate {
  const selectedQuotes = quoteInputs.map((quote) => {
    const contribution = buildB1GrossQuoteContribution(quote);
    assert.equal(contribution.ok, true);
    return contribution.value;
  });
  const impliedProbabilityPpmSum = selectedQuotes.reduce(
    (sum, quote) => sum + quote.impliedProbabilityPpm,
    0n,
  );
  return Object.freeze({
    ok: true,
    candidateId: `${marketEquivalenceKey}|synthetic`,
    grossOpportunityKind: 'deterministic_gross_cross_venue_candidate',
    marketEquivalenceKey,
    canonicalEventId: 'synthetic-event',
    marketType: 'moneyline',
    period: 'full-game',
    lineValue: '0',
    currency: 'USD',
    venuePairKey: 'synthetic-venue-cluster',
    firstVenueOrBookmakerId: 'venue-a',
    secondVenueOrBookmakerId: 'venue-b',
    terminalOutcomeCount: selectedQuotes.length,
    comparisonTimeUtc: '2026-07-01T00:00:02.250Z',
    maxComparisonWindowMs: 500n,
    impliedProbabilityPpmSum,
    grossSpreadPpm: 1_000_000n - impliedProbabilityPpmSum,
    selectedQuotes: Object.freeze(selectedQuotes),
    synchronizedQuotePairs: Object.freeze([]),
    records: Object.freeze([]),
  });
}
