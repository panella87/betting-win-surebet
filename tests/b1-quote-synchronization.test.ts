import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';
import type { B1MultiVenueMarketRow } from '../src/contracts/b1-local-types.js';
import {
  evaluateB1QuoteCapacity,
  type B1CapacityPolicy,
} from '../src/quotes/b1-capacity-model.js';
import {
  synchronizeB1VenueQuotePair,
  type B1QuoteSynchronizationPolicy,
} from '../src/quotes/b1-quote-synchronization.js';
import {
  normalizeB1VenueLimitPolicy,
  type B1VenueLimitPolicy,
} from '../src/quotes/b1-venue-limit-model.js';

const FIXTURE_PATH = 'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json';

function fixtureRows(): readonly B1MultiVenueMarketRow[] {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as unknown;
  const parsed = parseBettingWinB1DeterministicFixture(raw);
  assert.equal(parsed.ok, true);
  return parsed.value.rows;
}

function fixturePair(): [B1MultiVenueMarketRow, B1MultiVenueMarketRow] {
  const rows = fixtureRows();
  const first = rows[0];
  const second = rows[1];
  assert.ok(first);
  assert.ok(second);
  return [first, second];
}

function cloneRow(row: B1MultiVenueMarketRow, overrides: Partial<B1MultiVenueMarketRow>): B1MultiVenueMarketRow {
  return Object.freeze({
    ...row,
    ...overrides,
  });
}

function quotePolicy(): B1QuoteSynchronizationPolicy {
  return Object.freeze({
    comparisonTimeUtc: '2026-07-01T00:00:02.250Z',
    maxQuoteAgeMs: 1500n,
    maxRetrievalLagMs: 1000n,
    maxComparisonWindowMs: 500n,
    requireOpenMarketStatus: true,
  });
}

function venueLimit(row: B1MultiVenueMarketRow, maxStakeMinor: bigint): B1VenueLimitPolicy {
  return Object.freeze({
    venueOrBookmakerId: row.venueOrBookmakerId,
    minStakeMinor: 100000n,
    maxStakeMinor,
    source: 'upstream_venue_limit',
  });
}

function capacityPolicy(requiredStakeMinor: bigint): B1CapacityPolicy {
  return Object.freeze({
    requiredStakeMinor,
    allowMissingCapacityProxy: false,
  });
}

test('B1 quote synchronization records quote age, retrieval lag, and comparison window', () => {
  const [first, second] = fixturePair();

  const result = synchronizeB1VenueQuotePair(first, second, quotePolicy());

  assert.equal(result.ok, true);
  assert.equal(result.value.equivalence.venuePair.key, 'venue-a::venue-b');
  assert.equal(result.value.first.quoteAgeMs, 1250n);
  assert.equal(result.value.first.retrievalLagMs, 1000n);
  assert.equal(result.value.second.quoteAgeMs, 750n);
  assert.equal(result.value.second.retrievalLagMs, 750n);
  assert.equal(result.value.comparisonWindowMs, 500n);
});

test('B1 quote synchronization blocks stale quote age', () => {
  const [first, second] = fixturePair();

  const result = synchronizeB1VenueQuotePair(first, second, Object.freeze({
    ...quotePolicy(),
    maxQuoteAgeMs: 1249n,
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_QUOTE_STALENESS_BLOCK',
      message: 'B1 quote age exceeds the configured freshness threshold.',
      evidenceRequired: 'Fresh B1 quote_age_ms evidence.',
    },
  ]);
});

test('B1 quote synchronization rejects missing bigint policy limits', () => {
  const [first, second] = fixturePair();

  const result = synchronizeB1VenueQuotePair(first, second, Object.freeze({
    ...quotePolicy(),
    maxQuoteAgeMs: undefined,
  }) as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_QUOTE_AGE_LIMIT_INVALID',
      message: 'B1 quote synchronization requires a non-negative quote-age limit.',
      evidenceRequired: 'Non-negative B1 max quote age.',
    },
  ]);
});

test('B1 quote synchronization rejects noncanonical timestamps', () => {
  const [first, second] = fixturePair();

  for (const [result, code] of [
    [
      synchronizeB1VenueQuotePair(first, second, Object.freeze({
        ...quotePolicy(),
        comparisonTimeUtc: '2026-07-01',
      })),
      'B1_COMPARISON_TIME_INVALID',
    ],
    [
      synchronizeB1VenueQuotePair(cloneRow(first, { snapshotTimeUtc: '2026-07-01' }), second, quotePolicy()),
      'B1_SNAPSHOT_TIME_INVALID',
    ],
    [
      synchronizeB1VenueQuotePair(first, cloneRow(second, { retrievedAtUtc: '2026-07-01 00:00:02Z' }), quotePolicy()),
      'B1_RETRIEVED_AT_INVALID',
    ],
  ] as const) {
    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, code);
  }
});

test('B1 quote synchronization rejects understated and overstated quote-age evidence', () => {
  const [first, second] = fixturePair();
  const understated = cloneRow(first, { quoteAgeMs: 0n });
  const overstated = cloneRow(second, { quoteAgeMs: 751n });

  for (const result of [
    synchronizeB1VenueQuotePair(understated, second, quotePolicy()),
    synchronizeB1VenueQuotePair(first, overstated, quotePolicy()),
  ]) {

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'B1_QUOTE_AGE_MISMATCH',
        message: 'B1 quote age must equal comparison_time_utc minus snapshot_time_utc.',
        evidenceRequired: 'B1 quote_age_ms consistent with comparison_time_utc and snapshot_time_utc.',
      },
    ]);
  }
});

test('B1 quote synchronization blocks venue quotes outside the comparison window', () => {
  const [first, second] = fixturePair();
  const outsideWindow = cloneRow(second, {
    quoteAgeMs: 650n,
    snapshotTimeUtc: '2026-07-01T00:00:01.600Z',
  });

  const result = synchronizeB1VenueQuotePair(first, outsideWindow, quotePolicy());

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_COMPARISON_WINDOW_EXCEEDED',
      message: 'B1 cross-venue quote comparison requires venue quotes inside the configured synchronization window.',
      evidenceRequired: 'B1 venue quotes with snapshot_time_utc values inside the configured comparison window.',
    },
  ]);
});

test('B1 quote synchronization blocks future timestamps', () => {
  const [first, second] = fixturePair();
  const future = cloneRow(second, { retrievedAtUtc: '2026-07-01T00:00:03.000Z' });

  const result = synchronizeB1VenueQuotePair(first, future, quotePolicy());

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_QUOTE_FUTURE_TIMESTAMP',
      message: 'B1 quote timestamps must not be in the future relative to the comparison time.',
      evidenceRequired: 'B1 quote timestamps at or before comparison_time_utc.',
    },
  ]);
});

test('B1 venue limit and capacity accept observed quote depth inside venue limits', () => {
  const [first] = fixturePair();
  const limit = normalizeB1VenueLimitPolicy(first, venueLimit(first, 800000n));
  assert.equal(limit.ok, true);

  const result = evaluateB1QuoteCapacity(first, limit.value, capacityPolicy(700000n));

  assert.equal(result.ok, true);
  assert.equal(result.value.capacitySource, 'observed_quote_depth');
  assert.equal(result.value.observedAvailableSizeMinor, 1200000n);
  assert.equal(result.value.acceptedCapacityMinor, 800000n);
  assert.equal(result.value.requiredStakeMinor, 700000n);
});

test('B1 venue limit and capacity reject malformed required policy values', () => {
  const [first] = fixturePair();
  const blankVenueLimit = normalizeB1VenueLimitPolicy(first, Object.freeze({
    venueOrBookmakerId: '   ',
    minStakeMinor: 100000n,
    maxStakeMinor: 800000n,
    source: 'upstream_venue_limit',
  }) as never);
  assert.equal(blankVenueLimit.ok, false);
  assert.equal(blankVenueLimit.blockers[0]?.code, 'B1_VENUE_LIMIT_VENUE_MISSING');

  const invalidLimit = normalizeB1VenueLimitPolicy(first, Object.freeze({
    venueOrBookmakerId: first.venueOrBookmakerId,
    minStakeMinor: undefined,
    maxStakeMinor: 800000n,
    source: 'upstream_venue_limit',
  }) as never);
  assert.equal(invalidLimit.ok, false);
  assert.equal(invalidLimit.blockers[0]?.code, 'B1_VENUE_MIN_STAKE_INVALID');

  const limit = normalizeB1VenueLimitPolicy(first, venueLimit(first, 800000n));
  assert.equal(limit.ok, true);

  const missingRequiredStake = evaluateB1QuoteCapacity(first, limit.value, Object.freeze({
    requiredStakeMinor: undefined,
    allowMissingCapacityProxy: false,
  }) as never);
  assert.equal(missingRequiredStake.ok, false);
  assert.equal(missingRequiredStake.blockers[0]?.code, 'B1_REQUIRED_STAKE_INVALID');

  const noDepth = cloneRow(first, { availableSizeMinor: 0n });
  const missingProxyCapacity = evaluateB1QuoteCapacity(noDepth, limit.value, Object.freeze({
    requiredStakeMinor: 700000n,
    allowMissingCapacityProxy: true,
    conservativeProxyCapacityMinor: undefined,
  }) as never);
  assert.equal(missingProxyCapacity.ok, false);
  assert.equal(missingProxyCapacity.blockers[0]?.code, 'B1_CAPACITY_PROXY_MISSING');
});

test('B1 capacity blocks missing depth when no conservative proxy is configured', () => {
  const [first] = fixturePair();
  const noDepth = cloneRow(first, { availableSizeMinor: 0n });
  const limit = normalizeB1VenueLimitPolicy(noDepth, venueLimit(noDepth, 800000n));
  assert.equal(limit.ok, true);

  const result = evaluateB1QuoteCapacity(noDepth, limit.value, capacityPolicy(700000n));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_CAPACITY_MISSING',
      message: 'B1 quote capacity is missing and no explicit conservative proxy is configured.',
      evidenceRequired: 'B1 available_size_minor evidence or explicit conservative proxy capacity.',
    },
  ]);
});

test('B1 capacity records explicit conservative proxy decisions', () => {
  const [first] = fixturePair();
  const noDepth = cloneRow(first, { availableSizeMinor: 0n });
  const limit = normalizeB1VenueLimitPolicy(noDepth, venueLimit(noDepth, 500000n));
  assert.equal(limit.ok, true);

  const result = evaluateB1QuoteCapacity(noDepth, limit.value, Object.freeze({
    requiredStakeMinor: 400000n,
    allowMissingCapacityProxy: true,
    conservativeProxyCapacityMinor: 450000n,
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.capacitySource, 'explicit_conservative_proxy');
  assert.equal(result.value.observedAvailableSizeMinor, 0n);
  assert.equal(result.value.acceptedCapacityMinor, 450000n);
  assert.equal(result.value.conservativeProxyCapacityMinor, 450000n);
});

test('B1 venue limit model blocks mismatched venue evidence', () => {
  const [first] = fixturePair();

  const result = normalizeB1VenueLimitPolicy(first, Object.freeze({
    venueOrBookmakerId: 'venue-c',
    minStakeMinor: 100000n,
    maxStakeMinor: 500000n,
    source: 'upstream_venue_limit',
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_VENUE_LIMIT_VENUE_MISMATCH',
      message: 'B1 venue limit policy must match the quote venue.',
      evidenceRequired: 'B1 venue limit evidence for the same venue_or_bookmaker_id.',
    },
  ]);
});
