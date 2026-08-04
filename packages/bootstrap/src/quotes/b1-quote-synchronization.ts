import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';
import {
  compareB1MarketEquivalence,
  type B1MarketEquivalence,
} from '../identity/b1-market-equivalence.js';

export interface B1QuoteSynchronizationPolicy {
  readonly comparisonTimeUtc: string;
  readonly maxQuoteAgeMs: bigint;
  readonly maxRetrievalLagMs: bigint;
  readonly maxComparisonWindowMs: bigint;
  readonly requireOpenMarketStatus: boolean;
}

export interface B1SynchronizedQuoteRow {
  readonly row: B1MultiVenueMarketRow;
  readonly snapshotEpochMs: bigint;
  readonly retrievedEpochMs: bigint;
  readonly quoteAgeMs: bigint;
  readonly retrievalLagMs: bigint;
}

export interface B1SynchronizedQuotePair {
  readonly equivalence: B1MarketEquivalence;
  readonly first: B1SynchronizedQuoteRow;
  readonly second: B1SynchronizedQuoteRow;
  readonly comparisonTimeUtc: string;
  readonly comparisonWindowMs: bigint;
  readonly maxQuoteAgeMs: bigint;
  readonly maxRetrievalLagMs: bigint;
  readonly maxComparisonWindowMs: bigint;
}

export function synchronizeB1VenueQuotePair(
  first: B1MultiVenueMarketRow,
  second: B1MultiVenueMarketRow,
  policy: B1QuoteSynchronizationPolicy,
): BoundaryResult<B1SynchronizedQuotePair> {
  const normalizedPolicy = normalizeB1QuoteSynchronizationPolicy(policy);
  if (!normalizedPolicy.ok) {
    return normalizedPolicy;
  }

  const equivalence = compareB1MarketEquivalence(first, second);
  if (!equivalence.ok) {
    return equivalence;
  }

  const firstSynchronized = synchronizeB1QuoteRow(first, normalizedPolicy.value);
  if (!firstSynchronized.ok) {
    return firstSynchronized;
  }
  const secondSynchronized = synchronizeB1QuoteRow(second, normalizedPolicy.value);
  if (!secondSynchronized.ok) {
    return secondSynchronized;
  }

  const comparisonWindowMs = absoluteBigIntDifference(
    firstSynchronized.value.snapshotEpochMs,
    secondSynchronized.value.snapshotEpochMs,
  );
  if (comparisonWindowMs > normalizedPolicy.value.maxComparisonWindowMs) {
    return blocked(
      'B1_COMPARISON_WINDOW_EXCEEDED',
      'B1 cross-venue quote comparison requires venue quotes inside the configured synchronization window.',
      'B1 venue quotes with snapshot_time_utc values inside the configured comparison window.',
    );
  }

  return accepted(Object.freeze({
    equivalence: equivalence.value,
    first: firstSynchronized.value,
    second: secondSynchronized.value,
    comparisonTimeUtc: normalizedPolicy.value.comparisonTimeUtc,
    comparisonWindowMs,
    maxQuoteAgeMs: normalizedPolicy.value.maxQuoteAgeMs,
    maxRetrievalLagMs: normalizedPolicy.value.maxRetrievalLagMs,
    maxComparisonWindowMs: normalizedPolicy.value.maxComparisonWindowMs,
  }));
}

function normalizeB1QuoteSynchronizationPolicy(
  policy: B1QuoteSynchronizationPolicy,
): BoundaryResult<B1QuoteSynchronizationPolicy & { readonly comparisonEpochMs: bigint }> {
  if (typeof policy !== 'object' || policy === null) {
    return blocked(
      'B1_QUOTE_SYNC_POLICY_MISSING',
      'B1 quote synchronization requires an explicit policy object.',
      'Explicit B1 quote synchronization policy.',
    );
  }
  const comparisonEpochMs = parseIsoEpochMs(
    policy.comparisonTimeUtc,
    'B1_COMPARISON_TIME_INVALID',
    'B1 quote synchronization requires a valid comparison_time_utc timestamp.',
    'Valid B1 comparison time.',
  );
  if (!comparisonEpochMs.ok) {
    return comparisonEpochMs;
  }
  if (policy.maxQuoteAgeMs < 0n) {
    return blocked(
      'B1_QUOTE_AGE_LIMIT_INVALID',
      'B1 quote synchronization requires a non-negative quote-age limit.',
      'Non-negative B1 max quote age.',
    );
  }
  if (policy.maxRetrievalLagMs < 0n) {
    return blocked(
      'B1_RETRIEVAL_LAG_LIMIT_INVALID',
      'B1 quote synchronization requires a non-negative retrieval-lag limit.',
      'Non-negative B1 max retrieval lag.',
    );
  }
  if (policy.maxComparisonWindowMs < 0n) {
    return blocked(
      'B1_COMPARISON_WINDOW_INVALID',
      'B1 quote synchronization requires a non-negative comparison window.',
      'Non-negative B1 quote comparison window.',
    );
  }
  if (typeof policy.requireOpenMarketStatus !== 'boolean') {
    return blocked(
      'B1_MARKET_STATUS_POLICY_INVALID',
      'B1 quote synchronization requires an explicit market-status policy.',
      'Explicit B1 market-status synchronization policy.',
    );
  }

  return accepted(Object.freeze({
    comparisonTimeUtc: policy.comparisonTimeUtc,
    comparisonEpochMs: comparisonEpochMs.value,
    maxQuoteAgeMs: policy.maxQuoteAgeMs,
    maxRetrievalLagMs: policy.maxRetrievalLagMs,
    maxComparisonWindowMs: policy.maxComparisonWindowMs,
    requireOpenMarketStatus: policy.requireOpenMarketStatus,
  }));
}

function synchronizeB1QuoteRow(
  row: B1MultiVenueMarketRow,
  policy: B1QuoteSynchronizationPolicy & { readonly comparisonEpochMs: bigint },
): BoundaryResult<B1SynchronizedQuoteRow> {
  if (policy.requireOpenMarketStatus && row.marketStatus !== 'open') {
    return blocked(
      'B1_MARKET_STATUS_NOT_OPEN',
      'B1 quote synchronization requires an open market when the policy demands open quotes.',
      'Open B1 market_status evidence.',
    );
  }

  const snapshotEpochMs = parseIsoEpochMs(
    row.snapshotTimeUtc,
    'B1_SNAPSHOT_TIME_INVALID',
    'B1 quote synchronization requires a valid snapshot_time_utc timestamp.',
    'Valid B1 snapshot timestamp.',
  );
  if (!snapshotEpochMs.ok) {
    return snapshotEpochMs;
  }
  const retrievedEpochMs = parseIsoEpochMs(
    row.retrievedAtUtc,
    'B1_RETRIEVED_AT_INVALID',
    'B1 quote synchronization requires a valid retrieved_at_utc timestamp.',
    'Valid B1 retrieval timestamp.',
  );
  if (!retrievedEpochMs.ok) {
    return retrievedEpochMs;
  }
  if (snapshotEpochMs.value > policy.comparisonEpochMs || retrievedEpochMs.value > policy.comparisonEpochMs) {
    return blocked(
      'B1_QUOTE_FUTURE_TIMESTAMP',
      'B1 quote timestamps must not be in the future relative to the comparison time.',
      'B1 quote timestamps at or before comparison_time_utc.',
    );
  }

  const retrievalLagMs = retrievedEpochMs.value - snapshotEpochMs.value;
  if (retrievalLagMs < 0n) {
    return blocked(
      'B1_RETRIEVAL_LAG_NEGATIVE',
      'B1 retrieval lag must not be negative.',
      'B1 retrieved_at_utc at or after snapshot_time_utc.',
    );
  }
  const computedQuoteAgeMs = policy.comparisonEpochMs - snapshotEpochMs.value;
  if (row.quoteAgeMs !== computedQuoteAgeMs) {
    return blocked(
      'B1_QUOTE_AGE_MISMATCH',
      'B1 quote age must equal comparison_time_utc minus snapshot_time_utc.',
      'B1 quote_age_ms consistent with comparison_time_utc and snapshot_time_utc.',
    );
  }
  if (computedQuoteAgeMs > policy.maxQuoteAgeMs) {
    return blocked(
      'B1_QUOTE_STALENESS_BLOCK',
      'B1 quote age exceeds the configured freshness threshold.',
      'Fresh B1 quote_age_ms evidence.',
    );
  }
  if (retrievalLagMs > policy.maxRetrievalLagMs) {
    return blocked(
      'B1_RETRIEVAL_LAG_BLOCK',
      'B1 retrieval lag exceeds the configured threshold.',
      'B1 retrieved_at_utc close enough to snapshot_time_utc.',
    );
  }

  return accepted(Object.freeze({
    row,
    snapshotEpochMs: snapshotEpochMs.value,
    retrievedEpochMs: retrievedEpochMs.value,
    quoteAgeMs: computedQuoteAgeMs,
    retrievalLagMs,
  }));
}

function parseIsoEpochMs(
  value: string,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<bigint> {
  if (typeof value !== 'string') {
    return blocked(code, message, evidenceRequired);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(BigInt(parsed));
}

function absoluteBigIntDifference(first: bigint, second: bigint): bigint {
  if (first >= second) {
    return first - second;
  }
  return second - first;
}
