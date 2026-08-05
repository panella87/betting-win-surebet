import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';

export interface B1VenuePairKey {
  readonly key: string;
  readonly firstVenueOrBookmakerId: string;
  readonly secondVenueOrBookmakerId: string;
}

export function createB1VenuePairKey(
  first: B1MultiVenueMarketRow,
  second: B1MultiVenueMarketRow,
): BoundaryResult<B1VenuePairKey> {
  const firstVenue = normalizeVenueId(first.venueOrBookmakerId);
  const secondVenue = normalizeVenueId(second.venueOrBookmakerId);
  if (firstVenue === undefined || secondVenue === undefined) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 venue pair key requires two non-empty venues.',
      'Two non-empty venue_or_bookmaker_id values.',
    );
  }
  if (firstVenue === secondVenue) {
    return blocked(
      'B1_VENUE_PAIR_SAME_VENUE',
      'B1 venue pair comparison requires two distinct venues.',
      'Two distinct venue_or_bookmaker_id values.',
    );
  }

  const ordered = [firstVenue, secondVenue].sort();
  const firstVenueOrBookmakerId = ordered[0];
  const secondVenueOrBookmakerId = ordered[1];
  if (firstVenueOrBookmakerId === undefined || secondVenueOrBookmakerId === undefined) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 venue pair key requires exactly two venues.',
      'Two venue_or_bookmaker_id values.',
    );
  }

  return accepted(Object.freeze({
    key: `${firstVenueOrBookmakerId}::${secondVenueOrBookmakerId}`,
    firstVenueOrBookmakerId,
    secondVenueOrBookmakerId,
  }));
}

function normalizeVenueId(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
