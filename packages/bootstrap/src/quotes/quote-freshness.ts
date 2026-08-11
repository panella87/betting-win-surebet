import { accepted, blocked, type BoundaryResult, type QuoteDepthEvidence } from '../contracts/local-types.js';

const CANONICAL_ISO_UTC_MILLISECOND_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export interface FreshQuoteEvidence {
  readonly evidence: QuoteDepthEvidence;
  readonly ageMs: number;
}

export function checkQuoteFreshness(evidence: QuoteDepthEvidence, observedNowMs: number, maxAgeMs: number): BoundaryResult<FreshQuoteEvidence> {
  if (!Number.isFinite(observedNowMs)) {
    return blocked(
      'QUOTE_EVALUATION_TIME_INVALID',
      'Quote freshness evaluation requires a finite observation timestamp.',
      'Finite quote freshness evaluation timestamp.',
    );
  }
  if (!Number.isInteger(maxAgeMs) || maxAgeMs < 0) {
    return blocked(
      'QUOTE_FRESHNESS_WINDOW_INVALID',
      'Quote freshness evaluation requires a non-negative integer max-age window.',
      'Non-negative integer quote freshness max-age window.',
    );
  }
  const observedAt = parseCanonicalObservedAt(evidence.observedAt);
  if (!observedAt.ok) {
    return observedAt;
  }
  const ageMs = observedNowMs - observedAt.value.observedAtMs;
  if (ageMs < 0 || ageMs > maxAgeMs) {
    return blocked('QUOTE_EVIDENCE_STALE', 'Quote evidence is outside the accepted freshness window.', 'Fresh betting-win quote/depth evidence.');
  }
  return accepted({ evidence, ageMs });
}

function parseCanonicalObservedAt(observedAt: unknown): BoundaryResult<{ readonly observedAtMs: number }> {
  if (typeof observedAt !== 'string' || !CANONICAL_ISO_UTC_MILLISECOND_TIMESTAMP_REGEX.test(observedAt)) {
    return invalidQuoteTimestamp();
  }

  const parsed = new Date(observedAt);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== observedAt) {
    return invalidQuoteTimestamp();
  }

  return accepted({ observedAtMs: parsed.valueOf() });
}

function invalidQuoteTimestamp(): BoundaryResult<never> {
  return blocked(
    'QUOTE_TIMESTAMP_INVALID',
    'Quote evidence observedAt must be a canonical ISO-8601 UTC millisecond timestamp.',
    'Canonical quote observedAt timestamp formatted as YYYY-MM-DDTHH:mm:ss.mmmZ.',
  );
}
