import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';
import type { B1DeterministicFixture, B1MultiVenueMarketRow } from '../src/contracts/b1-local-types.js';
import {
  runDeterministicB1CrossVenueBacktest,
  type B1CrossVenueBacktestPlan,
} from '../src/backtest/b1-cross-venue-backtest.js';
import { createB1FalsePositiveReport } from '../src/reporting/b1-false-positive-report.js';
import { createB1BacktestReport } from '../src/reporting/b1-backtest-report.js';

const FIXTURE_PATH = 'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json';
const CANDIDATE_ID = 'event-001:moneyline:full-game|venue-a::venue-b';

test('B1 cross-venue backtest composes deterministic offline falsification evidence without runtime claims', () => {
  const first = runDeterministicB1CrossVenueBacktest(backtestInput(false));
  const second = runDeterministicB1CrossVenueBacktest(backtestInput(true));

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.value.report.runHash, second.value.report.runHash);
  assert.equal(first.value.runKind, 'deterministic_b1_cross_venue_offline_backtest');
  assert.equal(first.value.executable, false);
  assert.equal(first.value.liveReadiness, 'not_authorized_bws_900_parked');
  assert.equal(first.value.report.reportKind, 'deterministic_b1_cross_venue_backtest_report');
  assert.equal(first.value.report.runtimeEvidence, false);
  assert.equal(first.value.report.upstreamReadiness, 'blocked_until_betting_win_b1_multi_venue_markets_v1');
  assert.equal(first.value.report.executable, false);
  assert.equal(first.value.report.liveReadiness, 'not_authorized_bws_900_parked');
  assert.equal(first.value.report.offlineFalsificationStatus, 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED');
  assert.equal(first.value.report.metrics.marketsCompared, 1);
  assert.equal(first.value.report.metrics.uniqueEvents, 1);
  assert.equal(first.value.report.metrics.venuePairs, 1);
  assert.equal(first.value.report.metrics.candidateCount, 1);
  assert.equal(first.value.report.metrics.grossPositiveCount, 1);
  assert.equal(first.value.report.metrics.netPositiveCount, 1);
  assert.equal(first.value.report.metrics.fillableCandidateCount, 1);
  assert.equal(first.value.report.metrics.falsePositiveRate.status, 'accepted');
  assert.equal(first.value.report.metrics.worstCaseNetMinor, 964n);
  assert.equal(first.value.report.candidateSummaries[0]?.grossSpreadPpm, 47_618n);
  assert.equal(first.value.report.candidateSummaries[0]?.netSpreadPpm, 48_127n);
  assert.equal(first.value.candidateResults[0]?.ok, true);
  assert.equal(Object.hasOwn(first.value.report, 'profitabilityClaim'), false);
  assert.equal(Object.hasOwn(first.value.report, 'publicSignal'), false);
});

test('B1 cross-venue backtest fails closed when an accepted gross candidate has no explicit plan', () => {
  const result = runDeterministicB1CrossVenueBacktest({
    ...backtestInput(false),
    plans: Object.freeze([]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_BACKTEST_PLANS_MISSING',
      message: 'B1 deterministic offline backtesting requires explicit candidate plans.',
      evidenceRequired: 'B1 backtest plans for derived gross candidates.',
    },
  ]);
});

test('B1 cross-venue backtest rejects malformed input without uncaught dereferences', () => {
  for (const [input, code] of [
    [{ quotePolicy: {}, plans: [] }, 'B1_BACKTEST_FIXTURE_MISSING'],
    [{ fixture: null, quotePolicy: quotePolicy(), plans: [backtestPlan()] }, 'B1_BACKTEST_FIXTURE_MISSING'],
    [{
      fixture: {
        fixtureKind: 'deterministic_b1_multi_venue_fixture',
        runtimeEvidence: false,
        upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1',
        rows: 'not-array',
      },
      quotePolicy: quotePolicy(),
      plans: [backtestPlan()],
    }, 'B1_BACKTEST_ROWS_INVALID'],
    [{
      fixture: { ...twoOutcomeFixture(), fixtureKind: 'live_fixture_claim' },
      quotePolicy: quotePolicy(),
      plans: [backtestPlan()],
    }, 'B1_BACKTEST_FIXTURE_KIND_INVALID'],
    [{
      fixture: { ...twoOutcomeFixture(), rows: [{}] },
      quotePolicy: quotePolicy(),
      plans: [backtestPlan()],
    }, 'B1_BACKTEST_ROW_INVALID'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: undefined,
      plans: [backtestPlan()],
    }, 'B1_BACKTEST_QUOTE_POLICY_MISSING'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: quotePolicy(),
      plans: 'not-array',
    }, 'B1_BACKTEST_PLANS_MISSING'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: quotePolicy(),
      plans: [undefined],
    }, 'B1_BACKTEST_PLAN_INVALID'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: quotePolicy(),
      plans: [{ ...backtestPlan(), candidateId: '   ' }],
    }, 'B1_BACKTEST_PLAN_CANDIDATE_ID_MISSING'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: quotePolicy(),
      plans: [{ ...backtestPlan(), settlementRecords: undefined }],
    }, 'B1_BACKTEST_PLAN_SETTLEMENT_RECORDS_INVALID'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: quotePolicy(),
      plans: [{ ...backtestPlan(), maxResidualExposureMinor: undefined }],
    }, 'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID'],
    [{
      fixture: twoOutcomeFixture(),
      quotePolicy: quotePolicy(),
      plans: [{ ...backtestPlan(), fillabilityEvents: undefined }],
    }, 'B1_FILLABILITY_INPUT_MISSING'],
  ] as const) {
    const result = runDeterministicB1CrossVenueBacktest(input as never);

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, code);
  }
});

test('B1 backtest report rejects invalid safety markers and source hashes', () => {
  const falsePositiveReport = createB1FalsePositiveReport(Object.freeze([
    Object.freeze({
      candidateId: CANDIDATE_ID,
      settlementStatus: 'accepted' as const,
      settledNetMinor: 100n,
      falsePositive: false,
    }),
  ]));
  assert.equal(falsePositiveReport.ok, true);
  const validInput = Object.freeze({
    sourceManifestHash: 'a'.repeat(64),
    upstreamLockFingerprint: 'b'.repeat(64),
    fixtureKind: 'deterministic_b1_multi_venue_fixture' as const,
    runtimeEvidence: false as const,
    upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1' as const,
    uniqueEventIds: Object.freeze(['event-001']),
    falsePositiveReport,
    candidateSummaries: Object.freeze([
      Object.freeze({
        candidateId: CANDIDATE_ID,
        status: 'accepted' as const,
        stage: 'accepted' as const,
        canonicalEventId: 'event-001',
        marketEquivalenceKey: 'event-001:moneyline:full-game',
        venuePairKey: 'venue-a::venue-b',
        grossSpreadPpm: 1_000n,
        netSpreadPpm: 900n,
        worstCaseNetMinor: 100n,
        settledNetMinor: 100n,
        falsePositive: false,
      }),
    ]),
  });
  const validCandidateSummary = validInput.candidateSummaries[0];
  assert.ok(validCandidateSummary);

  for (const [overrides, code] of [
    [{ sourceManifestHash: 'not-a-hash' }, 'B1_BACKTEST_SOURCE_MANIFEST_HASH_INVALID'],
    [{ upstreamLockFingerprint: 'not-a-hash' }, 'B1_BACKTEST_UPSTREAM_LOCK_FINGERPRINT_INVALID'],
    [{ fixtureKind: 'live_fixture_claim' }, 'B1_BACKTEST_FIXTURE_KIND_INVALID'],
    [{ runtimeEvidence: true }, 'B1_BACKTEST_RUNTIME_EVIDENCE_FORBIDDEN'],
    [{ upstreamReadiness: 'ready' }, 'B1_BACKTEST_UPSTREAM_READINESS_INVALID'],
    [{ uniqueEventIds: ['event-001', ''] }, 'B1_BACKTEST_UNIQUE_EVENT_ID_INVALID'],
    [{ candidateSummaries: [{ ...validCandidateSummary, stage: 'gross' }] }, 'B1_BACKTEST_CANDIDATE_STAGE_INVALID'],
    [{ candidateSummaries: [{ ...validCandidateSummary, grossSpreadPpm: '1000' }] }, 'B1_BACKTEST_ACCEPTED_CANDIDATE_METRICS_MISSING'],
    [{ candidateSummaries: [{ ...validCandidateSummary, venuePairKey: '   ' }] }, 'B1_BACKTEST_CANDIDATE_MARKER_INVALID'],
    [{ candidateSummaries: [{ ...validCandidateSummary, canonicalEventId: undefined }] }, 'B1_BACKTEST_CANDIDATE_MARKER_INVALID'],
    [{ candidateSummaries: [{ ...validCandidateSummary, marketEquivalenceKey: undefined }] }, 'B1_BACKTEST_CANDIDATE_MARKER_INVALID'],
    [{ candidateSummaries: [{ ...validCandidateSummary, venuePairKey: undefined }] }, 'B1_BACKTEST_CANDIDATE_MARKER_INVALID'],
  ] as const) {
    const result = createB1BacktestReport(Object.freeze({
      ...validInput,
      ...overrides,
    }) as never);

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, code);
  }
});

test('B1 cross-venue backtest records settlement blockers as false-positive denominator blockers', () => {
  const plan = backtestPlanWithSettlementRecords(settlementRecords('event-001:moneyline:draw'));
  const result = runDeterministicB1CrossVenueBacktest({
    fixture: twoOutcomeFixture(),
    quotePolicy: quotePolicy(),
    plans: Object.freeze([plan]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.candidateResults[0]?.ok, false);
  assert.equal(result.value.report.metrics.falsePositiveRate.status, 'blocked');
  assert.deepEqual(result.value.report.candidateSummaries[0]?.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
      message: 'B1 settlement replay requires the final outcome to resolve to one terminal B1 scenario.',
      evidenceRequired: 'B1 terminal scenario matching the accepted settlement final outcome.',
    },
  ]);
});

function backtestInput(reverseRows: boolean) {
  const fixture = twoOutcomeFixture();
  return Object.freeze({
    fixture: Object.freeze({
      ...fixture,
      rows: reverseRows ? Object.freeze([...fixture.rows].reverse()) : fixture.rows,
    }),
    quotePolicy: quotePolicy(),
    plans: Object.freeze([backtestPlan()]),
  });
}

function fixtureRows(): readonly B1MultiVenueMarketRow[] {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as unknown;
  const parsed = parseBettingWinB1DeterministicFixture(raw);
  assert.equal(parsed.ok, true);
  return parsed.value.rows;
}

function baseFixture(): B1DeterministicFixture {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as unknown;
  const parsed = parseBettingWinB1DeterministicFixture(raw);
  assert.equal(parsed.ok, true);
  return parsed.value;
}

function cloneRow(row: B1MultiVenueMarketRow, overrides: Partial<B1MultiVenueMarketRow>): B1MultiVenueMarketRow {
  return Object.freeze({
    ...row,
    ...overrides,
  });
}

function twoOutcomeFixture(): B1DeterministicFixture {
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
  return Object.freeze({
    ...baseFixture(),
    rows: Object.freeze([awayB, homeA, normalizedHomeB, awayA]),
  });
}

function quotePolicy() {
  return Object.freeze({
    comparisonTimeUtc: '2026-07-01T00:00:02.250Z',
    maxQuoteAgeMs: 1500n,
    maxRetrievalLagMs: 1000n,
    maxComparisonWindowMs: 500n,
    requireOpenMarketStatus: true,
  });
}

function backtestPlan(): B1CrossVenueBacktestPlan {
  return backtestPlanWithSettlementRecords(settlementRecords('event-001:moneyline:away'));
}

function backtestPlanWithSettlementRecords(
  settlementRecordsValue: B1CrossVenueBacktestPlan['settlementRecords'],
): B1CrossVenueBacktestPlan {
  return Object.freeze({
    candidateId: CANDIDATE_ID,
    stakeVectorPolicy: Object.freeze({
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
    }),
    feeMatrix: Object.freeze({
      entries: Object.freeze([
        Object.freeze({
          venueOrBookmakerId: 'venue-a',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
        Object.freeze({
          venueOrBookmakerId: 'venue-b',
          selectionEquivalenceKey: 'event-001:moneyline:away',
          feeBps: 10n,
          fixedFeeMinor: 0n,
        }),
      ]),
    }),
    quoteAgePenaltyPolicy: Object.freeze({
      maxAcceptedQuoteAgeMs: 1500n,
      penaltyBpsPerSecond: 0n,
      fixedPenaltyMinor: 5n,
    }),
    capitalLockPolicy: Object.freeze({
      lockDurationMs: 86_400_000n,
      annualizedCostBps: 1_000n,
      capitalBufferBps: 0n,
    }),
    fillabilityEvents: Object.freeze([
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        type: 'fill' as const,
        occurredAtUtc: '2026-07-01T00:00:03.000Z',
        stakeMinor: 10_000n,
      }),
      Object.freeze({
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        type: 'fill' as const,
        occurredAtUtc: '2026-07-01T00:00:04.000Z',
        stakeMinor: 10_000n,
      }),
    ]),
    maxResidualExposureMinor: 0n,
    settlementRecords: settlementRecordsValue,
  });
}

function settlementRecords(finalOutcomeSelectionEquivalenceKey: string) {
  return Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      settlementRuleVersion: 'settlement-v1',
      settlementCompatibilityFlag: 'compatible' as const,
      voidRuleId: 'void-rule-a',
      replayManifestHash: 'a'.repeat(64),
      replayAcceptedAtUtc: '2026-07-01T02:00:00.000Z',
      finalityAuthorityId: 'finality-authority-001',
      finalOutcomeSelectionEquivalenceKey,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      settlementRuleVersion: 'settlement-v1',
      settlementCompatibilityFlag: 'compatible' as const,
      voidRuleId: 'void-rule-a',
      replayManifestHash: 'a'.repeat(64),
      replayAcceptedAtUtc: '2026-07-01T02:00:00.000Z',
      finalityAuthorityId: 'finality-authority-001',
      finalOutcomeSelectionEquivalenceKey,
    }),
  ]);
}
