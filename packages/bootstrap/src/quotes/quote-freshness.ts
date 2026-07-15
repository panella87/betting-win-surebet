import { accepted, blocked, type BoundaryResult, type QuoteDepthEvidence } from '../contracts/local-types.js';

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
  const observedAtMs = Date.parse(evidence.observedAt);
  if (!Number.isFinite(observedAtMs)) {
    return blocked('QUOTE_TIMESTAMP_INVALID', 'Quote evidence must include an ISO timestamp.', 'Valid observedAt timestamp.');
  }
  const ageMs = observedNowMs - observedAtMs;
  if (ageMs < 0 || ageMs > maxAgeMs) {
    return blocked('QUOTE_EVIDENCE_STALE', 'Quote evidence is outside the accepted freshness window.', 'Fresh betting-win quote/depth evidence.');
  }
  return accepted({ evidence, ageMs });
}
