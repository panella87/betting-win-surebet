import test from 'node:test';
import assert from 'node:assert/strict';
import { toCapacityConstraint } from '../src/quotes/quote-capacity.js';
import { checkQuoteFreshness } from '../src/quotes/quote-freshness.js';

test('capacity requires positive available size', () => {
  const result = toCapacityConstraint('leg-yes', { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00Z', priceMinor: 51n, availableSizeMinor: 0n, currency: 'USDC' }, 100n);
  assert.equal(result.ok, false);
});

test('capacity rejects retained depth below the leg minimum stake', () => {
  const result = toCapacityConstraint(
    'leg-yes',
    { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00Z', priceMinor: 51n, availableSizeMinor: 99n, currency: 'USDC' },
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
    { evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00Z', priceMinor: 49n, availableSizeMinor: 250n, currency: 'USDC' },
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
  const result = checkQuoteFreshness({ evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' }, Date.parse('2026-06-30T00:00:05Z'), 10_000);
  assert.equal(result.ok, true);
});

test('freshness rejects invalid evaluation timestamp input', () => {
  const result = checkQuoteFreshness(
    { evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' },
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
    { evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' },
    Date.parse('2026-06-30T00:00:05Z'),
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
