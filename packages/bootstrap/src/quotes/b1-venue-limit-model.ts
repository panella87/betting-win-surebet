import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';

export type B1VenueLimitSource = 'upstream_venue_limit' | 'operator_conservative_cap';

export interface B1VenueLimitPolicy {
  readonly venueOrBookmakerId: string;
  readonly minStakeMinor: bigint;
  readonly maxStakeMinor: bigint;
  readonly source: B1VenueLimitSource;
}

export interface B1NormalizedVenueLimit {
  readonly venueOrBookmakerId: string;
  readonly minStakeMinor: bigint;
  readonly maxStakeMinor: bigint;
  readonly source: B1VenueLimitSource;
}

export function normalizeB1VenueLimitPolicy(
  row: B1MultiVenueMarketRow,
  policy: B1VenueLimitPolicy,
): BoundaryResult<B1NormalizedVenueLimit> {
  if (typeof policy !== 'object' || policy === null) {
    return blocked(
      'B1_VENUE_LIMIT_POLICY_MISSING',
      'B1 venue limit evaluation requires an explicit policy object.',
      'Explicit B1 venue limit policy.',
    );
  }
  if (policy.venueOrBookmakerId !== row.venueOrBookmakerId) {
    return blocked(
      'B1_VENUE_LIMIT_VENUE_MISMATCH',
      'B1 venue limit policy must match the quote venue.',
      'B1 venue limit evidence for the same venue_or_bookmaker_id.',
    );
  }
  if (policy.source !== 'upstream_venue_limit' && policy.source !== 'operator_conservative_cap') {
    return blocked(
      'B1_VENUE_LIMIT_SOURCE_INVALID',
      'B1 venue limit source must be explicit.',
      'B1 upstream venue limit or explicit conservative operator cap.',
    );
  }
  if (policy.minStakeMinor <= 0n) {
    return blocked(
      'B1_VENUE_MIN_STAKE_INVALID',
      'B1 venue minimum stake must be positive.',
      'Positive B1 venue minimum stake.',
    );
  }
  if (policy.maxStakeMinor <= 0n) {
    return blocked(
      'B1_VENUE_MAX_STAKE_INVALID',
      'B1 venue maximum stake must be positive.',
      'Positive B1 venue maximum stake.',
    );
  }
  if (policy.maxStakeMinor < policy.minStakeMinor) {
    return blocked(
      'B1_VENUE_LIMIT_RANGE_INVALID',
      'B1 venue maximum stake must be greater than or equal to the minimum stake.',
      'Consistent B1 venue stake limits.',
    );
  }

  return accepted(Object.freeze({
    venueOrBookmakerId: policy.venueOrBookmakerId,
    minStakeMinor: policy.minStakeMinor,
    maxStakeMinor: policy.maxStakeMinor,
    source: policy.source,
  }));
}
