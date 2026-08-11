import test from 'node:test';
import assert from 'node:assert/strict';
import { toCapacityConstraint } from '../src/quotes/quote-capacity.js';
import { checkQuoteFreshness } from '../src/quotes/quote-freshness.js';

test('capacity requires positive available size', () => {
  const result = toCapacityConstraint('leg-yes', { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 51n, availableSizeMinor: 0n, currency: 'USDC' }, 100n);
  assert.equal(result.ok, false);
});

test('capacity rejects malformed leg identity before accepted construction', () => {
  const result = toCapacityConstraint(
    '' as unknown as string,
    { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 51n, availableSizeMinor: 250n, currency: 'USDC' },
    100n,
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'CAPACITY_LEG_ID_INVALID',
      message: 'Capacity derivation requires a non-empty leg identity.',
      evidenceRequired: 'Non-empty local leg id for each quote/depth capacity constraint.',
    },
  ]);
});

test('capacity rejects malformed retained depth before comparisons and construction', () => {
  for (const availableSizeMinor of [undefined, '250', 250, null]) {
    const result = toCapacityConstraint(
      'leg-yes',
      { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 51n, availableSizeMinor, currency: 'USDC' } as unknown as Parameters<typeof toCapacityConstraint>[1],
      100n,
    );

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'CAPACITY_EVIDENCE_INVALID',
        message: 'Capacity derivation requires bigint retained quote/depth capacity.',
        evidenceRequired: 'Bigint availableSizeMinor from betting-win quote/depth evidence.',
      },
    ]);
  }
});

test('capacity rejects malformed minimum stake before comparisons and construction', () => {
  for (const minStakeMinor of [undefined, '100', 100, null]) {
    const result = toCapacityConstraint(
      'leg-yes',
      { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 51n, availableSizeMinor: 250n, currency: 'USDC' },
      minStakeMinor as unknown as bigint,
    );

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'CAPACITY_MIN_STAKE_INVALID',
        message: 'Capacity derivation requires a positive minimum stake for every leg.',
        evidenceRequired: 'Positive local minimum stake for each quote/depth leg.',
      },
    ]);
  }
});

test('capacity rejects retained depth below the leg minimum stake', () => {
  const result = toCapacityConstraint(
    'leg-yes',
    { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 51n, availableSizeMinor: 99n, currency: 'USDC' },
    100n,
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'CAPACITY_EVIDENCE_BELOW_MIN_STAKE',
      message: 'Retained quote/depth capacity must cover the minimum stake for each complete-set leg.',
      evidenceRequired: 'betting-win quote/depth evidence with available size at or above the local minimum stake.',
    },
  ]);
});

test('capacity preserves the provided minimum stake when depth is sufficient', () => {
  const result = toCapacityConstraint(
    'leg-yes',
    { evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 49n, availableSizeMinor: 250n, currency: 'USDC' },
    100n,
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    legId: 'leg-yes',
    minStakeMinor: 100n,
    maxStakeMinor: 250n,
  });
});

test('freshness accepts quote inside window', () => {
  const result = checkQuoteFreshness({ evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' }, Date.parse('2026-06-30T00:00:05.000Z'), 10_000);
  assert.equal(result.ok, true);
});

test('freshness rejects parseable non-canonical quote timestamps', () => {
  for (const observedAt of ['2026-06-30', '2026-06-30T00:00:00Z']) {
    const result = checkQuoteFreshness(
      { evidenceId: 'quote-002', observedAt, priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' },
      Date.parse('2026-06-30T00:00:05.000Z'),
      10_000,
    );

    assert.equal(result.ok, false, observedAt);
    assert.deepEqual(result.blockers, [
      {
        code: 'QUOTE_TIMESTAMP_INVALID',
        message: 'Quote evidence observedAt must be a canonical ISO-8601 UTC millisecond timestamp.',
        evidenceRequired: 'Canonical quote observedAt timestamp formatted as YYYY-MM-DDTHH:mm:ss.mmmZ.',
      },
    ]);
  }
});

test('freshness rejects invalid evaluation timestamp input', () => {
  const result = checkQuoteFreshness(
    { evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' },
    Number.NaN,
    10_000,
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'QUOTE_EVALUATION_TIME_INVALID',
      message: 'Quote freshness evaluation requires a finite observation timestamp.',
      evidenceRequired: 'Finite quote freshness evaluation timestamp.',
    },
  ]);
});

test('freshness rejects invalid max-age window input', () => {
  const result = checkQuoteFreshness(
    { evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00.000Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' },
    Date.parse('2026-06-30T00:00:05.000Z'),
    -1,
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'QUOTE_FRESHNESS_WINDOW_INVALID',
      message: 'Quote freshness evaluation requires a non-negative integer max-age window.',
      evidenceRequired: 'Non-negative integer quote freshness max-age window.',
    },
  ]);
});
