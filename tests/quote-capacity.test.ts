import test from 'node:test';
import assert from 'node:assert/strict';
import { toCapacityConstraint } from '../src/quotes/quote-capacity.js';
import { checkQuoteFreshness } from '../src/quotes/quote-freshness.js';

test('capacity requires positive available size', () => {
  const result = toCapacityConstraint('leg-yes', { evidenceId: 'quote-001', observedAt: '2026-06-30T00:00:00Z', priceMinor: 51n, availableSizeMinor: 0n, currency: 'USDC' });
  assert.equal(result.ok, false);
});

test('freshness accepts quote inside window', () => {
  const result = checkQuoteFreshness({ evidenceId: 'quote-002', observedAt: '2026-06-30T00:00:00Z', priceMinor: 49n, availableSizeMinor: 100n, currency: 'USDC' }, Date.parse('2026-06-30T00:00:05Z'), 10_000);
  assert.equal(result.ok, true);
});
