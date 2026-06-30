import { accepted, blocked, type BoundaryResult, type QuoteDepthEvidence } from '../contracts/local-types.js';

export interface FreshQuoteEvidence {
  readonly evidence: QuoteDepthEvidence;
  readonly ageMs: number;
}

export function checkQuoteFreshness(evidence: QuoteDepthEvidence, observedNowMs: number, maxAgeMs: number): BoundaryResult<FreshQuoteEvidence> {
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
