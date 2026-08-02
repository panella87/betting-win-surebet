import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';

export interface B1SelectionEquivalence {
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly outcomeSide: string;
  readonly canonicalSelectionIds: readonly string[];
}

export function compareB1SelectionEquivalence(
  first: B1MultiVenueMarketRow,
  second: B1MultiVenueMarketRow,
): BoundaryResult<B1SelectionEquivalence> {
  if (first.selectionEquivalenceKey.length === 0 || second.selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 selection equivalence key is required before cross-venue comparison.',
      'B1 selection_equivalence_key for both rows.',
    );
  }
  if (first.selectionEquivalenceKey !== second.selectionEquivalenceKey) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 rows do not share an accepted selection equivalence key.',
      'Matching B1 selection_equivalence_key values.',
    );
  }
  if (first.outcomeSide !== second.outcomeSide) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 rows with different outcome sides cannot be compared as the same terminal selection.',
      'Selection equivalence evidence for the same terminal outcome.',
    );
  }

  const canonicalSelectionIds = Array.from(new Set([
    first.canonicalSelectionId,
    second.canonicalSelectionId,
  ])).sort();

  return accepted(Object.freeze({
    selectionEquivalenceKey: first.selectionEquivalenceKey,
    outcomeName: first.outcomeName,
    outcomeSide: first.outcomeSide,
    canonicalSelectionIds: Object.freeze(canonicalSelectionIds),
  }));
}
