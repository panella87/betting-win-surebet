import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';
import type { B1NormalizedVenueLimit } from './b1-venue-limit-model.js';

export type B1CapacitySource = 'observed_quote_depth' | 'explicit_conservative_proxy';

export interface B1CapacityPolicy {
  readonly requiredStakeMinor: bigint;
  readonly allowMissingCapacityProxy: boolean;
  readonly conservativeProxyCapacityMinor?: bigint;
}

export interface B1CapacityDecision {
  readonly row: B1MultiVenueMarketRow;
  readonly venueLimit: B1NormalizedVenueLimit;
  readonly capacitySource: B1CapacitySource;
  readonly requiredStakeMinor: bigint;
  readonly observedAvailableSizeMinor: bigint;
  readonly acceptedCapacityMinor: bigint;
  readonly conservativeProxyCapacityMinor?: bigint;
}

export function evaluateB1QuoteCapacity(
  row: B1MultiVenueMarketRow,
  venueLimit: B1NormalizedVenueLimit,
  policy: B1CapacityPolicy,
): BoundaryResult<B1CapacityDecision> {
  const validatedRow = validateCapacityRow(row);
  if (!validatedRow.ok) {
    return validatedRow;
  }
  const validatedVenueLimit = validateCapacityVenueLimit(venueLimit);
  if (!validatedVenueLimit.ok) {
    return validatedVenueLimit;
  }
  if (typeof policy !== 'object' || policy === null) {
    return blocked(
      'B1_CAPACITY_POLICY_MISSING',
      'B1 capacity evaluation requires an explicit policy object.',
      'Explicit B1 capacity policy.',
    );
  }
  const capacityRow = validatedRow.value;
  const capacityVenueLimit = validatedVenueLimit.value;
  if (capacityVenueLimit.venueOrBookmakerId !== capacityRow.venueOrBookmakerId) {
    return blocked(
      'B1_CAPACITY_VENUE_LIMIT_MISMATCH',
      'B1 capacity evaluation requires venue limit evidence for the quote venue.',
      'B1 venue limit evidence matching venue_or_bookmaker_id.',
    );
  }
  if (typeof policy.requiredStakeMinor !== 'bigint' || policy.requiredStakeMinor <= 0n) {
    return blocked(
      'B1_REQUIRED_STAKE_INVALID',
      'B1 capacity evaluation requires a positive required stake.',
      'Positive B1 required stake.',
    );
  }
  if (typeof policy.allowMissingCapacityProxy !== 'boolean') {
    return blocked(
      'B1_CAPACITY_PROXY_POLICY_INVALID',
      'B1 capacity evaluation requires an explicit missing-capacity proxy policy.',
      'Explicit B1 missing-capacity proxy policy.',
    );
  }
  if (policy.requiredStakeMinor < capacityVenueLimit.minStakeMinor) {
    return blocked(
      'B1_REQUIRED_STAKE_BELOW_VENUE_MIN',
      'B1 required stake is below the venue minimum stake.',
      'B1 required stake at or above the venue minimum.',
    );
  }

  const capacity = resolveCapacity(row, policy);
  if (!capacity.ok) {
    return capacity;
  }

  const acceptedCapacityMinor = minimumBigInt(capacity.value.capacityMinor, capacityVenueLimit.maxStakeMinor);
  if (acceptedCapacityMinor < capacityVenueLimit.minStakeMinor) {
    return blocked(
      'B1_CAPACITY_BELOW_VENUE_MIN',
      'B1 accepted capacity is below the venue minimum stake.',
      'B1 capacity at or above the venue minimum stake.',
    );
  }
  if (policy.requiredStakeMinor > acceptedCapacityMinor) {
    return blocked(
      'B1_CAPACITY_OR_LIMIT_INSUFFICIENT',
      'B1 required stake exceeds available quote capacity or venue limits.',
      'B1 quote capacity and venue limits sufficient for the required stake.',
    );
  }

  if (capacity.value.capacitySource === 'explicit_conservative_proxy') {
    return accepted(Object.freeze({
      row,
      venueLimit,
      capacitySource: capacity.value.capacitySource,
      requiredStakeMinor: policy.requiredStakeMinor,
      observedAvailableSizeMinor: capacityRow.availableSizeMinor,
      acceptedCapacityMinor,
      conservativeProxyCapacityMinor: capacity.value.capacityMinor,
    }));
  }

  return accepted(Object.freeze({
    row,
    venueLimit,
    capacitySource: capacity.value.capacitySource,
    requiredStakeMinor: policy.requiredStakeMinor,
    observedAvailableSizeMinor: capacityRow.availableSizeMinor,
    acceptedCapacityMinor,
  }));
}

function validateCapacityRow(row: B1MultiVenueMarketRow): BoundaryResult<B1MultiVenueMarketRow> {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) {
    return blocked(
      'B1_CAPACITY_ROW_INVALID',
      'B1 capacity evaluation requires a structured quote row.',
      'Structured B1 quote row with venue and capacity evidence.',
    );
  }
  if (typeof row.venueOrBookmakerId !== 'string' || row.venueOrBookmakerId.trim().length === 0) {
    return blocked(
      'B1_CAPACITY_ROW_VENUE_INVALID',
      'B1 capacity evaluation requires a non-empty quote venue.',
      'B1 quote row with venue_or_bookmaker_id.',
    );
  }
  if (typeof row.availableSizeMinor !== 'bigint') {
    return blocked(
      'B1_CAPACITY_AVAILABLE_SIZE_INVALID',
      'B1 capacity evaluation requires bigint quote capacity evidence.',
      'Bigint B1 available_size_minor evidence.',
    );
  }
  if (row.availableSizeMinor < 0n) {
    return blocked(
      'B1_CAPACITY_AVAILABLE_SIZE_NEGATIVE',
      'B1 capacity evaluation requires non-negative quote capacity evidence.',
      'Non-negative B1 available_size_minor evidence.',
    );
  }
  return accepted(row);
}

function validateCapacityVenueLimit(venueLimit: B1NormalizedVenueLimit): BoundaryResult<B1NormalizedVenueLimit> {
  if (typeof venueLimit !== 'object' || venueLimit === null || Array.isArray(venueLimit)) {
    return blocked(
      'B1_CAPACITY_VENUE_LIMIT_INVALID',
      'B1 capacity evaluation requires a structured venue limit.',
      'Structured B1 venue limit with bigint stake limits.',
    );
  }
  if (typeof venueLimit.venueOrBookmakerId !== 'string' || venueLimit.venueOrBookmakerId.trim().length === 0) {
    return blocked(
      'B1_CAPACITY_VENUE_LIMIT_VENUE_INVALID',
      'B1 capacity evaluation requires a non-empty venue limit venue.',
      'B1 venue limit with venue_or_bookmaker_id.',
    );
  }
  if (typeof venueLimit.minStakeMinor !== 'bigint' || typeof venueLimit.maxStakeMinor !== 'bigint') {
    return blocked(
      'B1_CAPACITY_VENUE_LIMIT_BIGINT_INVALID',
      'B1 capacity evaluation requires bigint venue stake limits.',
      'Bigint B1 venue min/max stake limits.',
    );
  }
  if (venueLimit.minStakeMinor <= 0n || venueLimit.maxStakeMinor <= 0n) {
    return blocked(
      'B1_CAPACITY_VENUE_LIMIT_NON_POSITIVE',
      'B1 capacity evaluation requires positive venue stake limits.',
      'Positive B1 venue min/max stake limits.',
    );
  }
  if (venueLimit.maxStakeMinor < venueLimit.minStakeMinor) {
    return blocked(
      'B1_CAPACITY_VENUE_LIMIT_RANGE_INVALID',
      'B1 capacity evaluation requires venue maximum stake to cover the minimum stake.',
      'Consistent B1 venue stake limits.',
    );
  }
  return accepted(venueLimit);
}

function resolveCapacity(
  row: B1MultiVenueMarketRow,
  policy: B1CapacityPolicy,
): BoundaryResult<{ readonly capacitySource: B1CapacitySource; readonly capacityMinor: bigint }> {
  if (row.availableSizeMinor > 0n) {
    return accepted(Object.freeze({
      capacitySource: 'observed_quote_depth',
      capacityMinor: row.availableSizeMinor,
    }));
  }
  if (!policy.allowMissingCapacityProxy) {
    return blocked(
      'B1_CAPACITY_MISSING',
      'B1 quote capacity is missing and no explicit conservative proxy is configured.',
      'B1 available_size_minor evidence or explicit conservative proxy capacity.',
    );
  }
  if (typeof policy.conservativeProxyCapacityMinor !== 'bigint' || policy.conservativeProxyCapacityMinor <= 0n) {
    return blocked(
      'B1_CAPACITY_PROXY_MISSING',
      'B1 missing-capacity proxy mode requires a positive conservative capacity.',
      'Positive explicit conservative B1 capacity proxy.',
    );
  }
  return accepted(Object.freeze({
    capacitySource: 'explicit_conservative_proxy',
    capacityMinor: policy.conservativeProxyCapacityMinor,
  }));
}

function minimumBigInt(first: bigint, second: bigint): bigint {
  if (first <= second) {
    return first;
  }
  return second;
}
