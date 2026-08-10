import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';
import {
  compareB1SelectionEquivalence,
  type B1SelectionEquivalence,
} from './b1-selection-equivalence.js';
import {
  createB1VenuePairKey,
  type B1VenuePairKey,
} from './b1-venue-pair-key.js';

export interface B1MarketEquivalence {
  readonly marketEquivalenceKey: string;
  readonly canonicalEventId: string;
  readonly marketType: string;
  readonly period: string;
  readonly lineValue: string;
  readonly currency: string;
  readonly settlementRuleVersion: string;
  readonly voidRuleId: string;
  readonly selection: B1SelectionEquivalence;
  readonly venuePair: B1VenuePairKey;
}

export interface B1MarketOutcomeSetEquivalence {
  readonly marketEquivalenceKey: string;
  readonly canonicalEventId: string;
  readonly marketType: string;
  readonly period: string;
  readonly lineValue: string;
  readonly currency: string;
  readonly settlementRuleVersion: string;
  readonly voidRuleId: string;
  readonly terminalOutcomeCount: number;
  readonly selections: readonly B1SelectionEquivalence[];
  readonly venuePair: B1VenuePairKey;
}

export function compareB1MarketEquivalence(
  first: B1MultiVenueMarketRow,
  second: B1MultiVenueMarketRow,
): BoundaryResult<B1MarketEquivalence> {
  if (first.marketEquivalenceKey.length === 0 || second.marketEquivalenceKey.length === 0) {
    return blocked(
      'B1_MARKET_EQUIVALENCE_MISSING',
      'B1 market equivalence key is required before cross-venue comparison.',
      'B1 market_equivalence_key for both rows.',
    );
  }
  if (first.marketEquivalenceKey !== second.marketEquivalenceKey) {
    return blocked(
      'B1_MARKET_EQUIVALENCE_MISSING',
      'B1 rows do not share an accepted market equivalence key.',
      'Matching B1 market_equivalence_key values.',
    );
  }
  if (first.canonicalEventId !== second.canonicalEventId) {
    return blocked(
      'B1_MARKET_EQUIVALENCE_MISSING',
      'B1 rows must share the same canonical event before quote comparison.',
      'Matching B1 canonical_event_id values or accepted event equivalence evidence.',
    );
  }
  if (first.marketType !== second.marketType) {
    return blocked(
      'B1_MARKET_TYPE_MISMATCH',
      'B1 rows must share the same market type before quote comparison.',
      'Matching B1 market_type values.',
    );
  }
  if (first.period !== second.period) {
    return blocked(
      'B1_PERIOD_MISMATCH',
      'B1 rows must share the same period before quote comparison.',
      'Matching B1 period values.',
    );
  }
  if (first.lineValue !== second.lineValue) {
    return blocked(
      'B1_LINE_VALUE_MISMATCH',
      'B1 spread or totals rows must share the same line value before quote comparison.',
      'Matching B1 line_value values.',
    );
  }
  if (first.currency !== second.currency) {
    return blocked(
      'B1_CURRENCY_MISMATCH',
      'B1 rows must share the same currency before quote comparison.',
      'Matching B1 currency values.',
    );
  }
  if (first.settlementCompatibilityFlag !== 'compatible' || second.settlementCompatibilityFlag !== 'compatible') {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 rows require compatible settlement evidence before quote comparison.',
      'Explicit compatible B1 settlement compatibility evidence.',
    );
  }
  if (first.settlementRuleVersion !== second.settlementRuleVersion) {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 rows must share the same settlement rule version before quote comparison.',
      'Matching B1 settlement_rule_version values.',
    );
  }
  if (first.voidRuleId !== second.voidRuleId) {
    return blocked(
      'B1_VOID_RULE_MISMATCH',
      'B1 rows must share the same void rule before quote comparison.',
      'Matching B1 void_rule_id values.',
    );
  }

  const selection = compareB1SelectionEquivalence(first, second);
  if (!selection.ok) {
    return selection;
  }
  const venuePair = createB1VenuePairKey(first, second);
  if (!venuePair.ok) {
    return venuePair;
  }

  return accepted(Object.freeze({
    marketEquivalenceKey: first.marketEquivalenceKey,
    canonicalEventId: first.canonicalEventId,
    marketType: first.marketType,
    period: first.period,
    lineValue: first.lineValue,
    currency: first.currency,
    settlementRuleVersion: first.settlementRuleVersion,
    voidRuleId: first.voidRuleId,
    selection: selection.value,
    venuePair: venuePair.value,
  }));
}

export function compareB1MarketOutcomeSetEquivalence(
  firstVenueRows: readonly B1MultiVenueMarketRow[],
  secondVenueRows: readonly B1MultiVenueMarketRow[],
): BoundaryResult<B1MarketOutcomeSetEquivalence> {
  if (firstVenueRows.length === 0 || secondVenueRows.length === 0) {
    return blocked(
      'B1_OUTCOME_SET_INCOMPLETE',
      'B1 market outcome-set comparison requires rows for both venues.',
      'Complete terminal outcome rows for both B1 venues.',
    );
  }
  if (firstVenueRows.length !== secondVenueRows.length) {
    return blocked(
      'B1_OUTCOME_SET_INCOMPLETE',
      'B1 market outcome sets must have the same terminal outcome cardinality.',
      'Matching complete terminal outcome sets for both B1 venues.',
    );
  }
  if (!isSupportedOutcomeSetCardinality(firstVenueRows.length)) {
    return blocked(
      'B1_OUTCOME_SET_INCOMPLETE',
      'B1 market outcome sets must have a supported terminal outcome cardinality before quote comparison.',
      'Complete supported B1 terminal outcome sets with exactly 2 or 3 outcomes.',
    );
  }

  const firstIndex = indexBySelectionEquivalence(firstVenueRows);
  if (!firstIndex.ok) {
    return firstIndex;
  }
  const secondIndex = indexBySelectionEquivalence(secondVenueRows);
  if (!secondIndex.ok) {
    return secondIndex;
  }

  const selections: B1SelectionEquivalence[] = [];
  let venuePair: B1VenuePairKey | undefined;
  let representativeMarket: B1MarketEquivalence | undefined;
  for (const first of firstVenueRows) {
    const second = secondIndex.value.get(first.selectionEquivalenceKey);
    if (second === undefined) {
      return blocked(
        'B1_OUTCOME_SET_INCOMPLETE',
        'B1 market outcome sets must contain every terminal outcome on both venues.',
        'Selection equivalence evidence for every terminal outcome.',
      );
    }

    const comparison = compareB1MarketEquivalence(first, second);
    if (!comparison.ok) {
      return comparison;
    }
    selections.push(comparison.value.selection);
    if (venuePair === undefined) {
      venuePair = comparison.value.venuePair;
      representativeMarket = comparison.value;
    } else {
      if (venuePair.key !== comparison.value.venuePair.key) {
        return blocked(
          'B1_OUTCOME_SET_INCOMPLETE',
          'B1 market outcome sets must compare the same venue pair for every terminal outcome.',
          'Consistent venue pair evidence across the complete outcome set.',
        );
      }
      if (representativeMarket === undefined) {
        throw new Error('B1 outcome-set equivalence lost representative market context after venue initialization.');
      }
      const contextConsistency = compareOutcomeSetMarketContext(representativeMarket, comparison.value);
      if (!contextConsistency.ok) {
        return contextConsistency;
      }
    }
  }

  if (venuePair === undefined || representativeMarket === undefined) {
    return blocked(
      'B1_OUTCOME_SET_INCOMPLETE',
      'B1 market outcome-set comparison requires at least one terminal outcome.',
      'Complete terminal outcome rows for both B1 venues.',
    );
  }

  return accepted(Object.freeze({
    marketEquivalenceKey: representativeMarket.marketEquivalenceKey,
    canonicalEventId: representativeMarket.canonicalEventId,
    marketType: representativeMarket.marketType,
    period: representativeMarket.period,
    lineValue: representativeMarket.lineValue,
    currency: representativeMarket.currency,
    settlementRuleVersion: representativeMarket.settlementRuleVersion,
    voidRuleId: representativeMarket.voidRuleId,
    terminalOutcomeCount: selections.length,
    selections: Object.freeze(selections),
    venuePair,
  }));
}

function isSupportedOutcomeSetCardinality(terminalOutcomeCount: number): terminalOutcomeCount is 2 | 3 {
  return terminalOutcomeCount === 2 || terminalOutcomeCount === 3;
}

function compareOutcomeSetMarketContext(
  representative: B1MarketEquivalence,
  next: B1MarketEquivalence,
): BoundaryResult<undefined> {
  if (representative.marketEquivalenceKey !== next.marketEquivalenceKey) {
    return blocked(
      'B1_MARKET_EQUIVALENCE_MISSING',
      'B1 market outcome sets must share one accepted market equivalence key.',
      'One B1 market_equivalence_key across every terminal outcome.',
    );
  }
  if (representative.canonicalEventId !== next.canonicalEventId) {
    return blocked(
      'B1_MARKET_EQUIVALENCE_MISSING',
      'B1 market outcome sets must share one canonical event across every terminal outcome.',
      'One B1 canonical_event_id across every terminal outcome.',
    );
  }
  if (representative.marketType !== next.marketType) {
    return blocked(
      'B1_MARKET_TYPE_MISMATCH',
      'B1 market outcome sets must share one market type across every terminal outcome.',
      'One B1 market_type across every terminal outcome.',
    );
  }
  if (representative.period !== next.period) {
    return blocked(
      'B1_PERIOD_MISMATCH',
      'B1 market outcome sets must share one period across every terminal outcome.',
      'One B1 period across every terminal outcome.',
    );
  }
  if (representative.lineValue !== next.lineValue) {
    return blocked(
      'B1_LINE_VALUE_MISMATCH',
      'B1 market outcome sets must share one line value across every terminal outcome.',
      'One B1 line_value across every terminal outcome.',
    );
  }
  if (representative.currency !== next.currency) {
    return blocked(
      'B1_CURRENCY_MISMATCH',
      'B1 market outcome sets must share one currency across every terminal outcome.',
      'One B1 currency across every terminal outcome.',
    );
  }
  if (representative.settlementRuleVersion !== next.settlementRuleVersion) {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 market outcome sets must share one settlement rule version across every terminal outcome.',
      'One B1 settlement_rule_version across every terminal outcome.',
    );
  }
  if (representative.voidRuleId !== next.voidRuleId) {
    return blocked(
      'B1_VOID_RULE_MISMATCH',
      'B1 market outcome sets must share one void rule across every terminal outcome.',
      'One B1 void_rule_id across every terminal outcome.',
    );
  }
  return accepted(undefined);
}

function indexBySelectionEquivalence(
  rows: readonly B1MultiVenueMarketRow[],
): BoundaryResult<ReadonlyMap<string, B1MultiVenueMarketRow>> {
  const indexed = new Map<string, B1MultiVenueMarketRow>();
  for (const row of rows) {
    if (row.selectionEquivalenceKey.length === 0) {
      return blocked(
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1 selection equivalence key is required for every terminal outcome.',
        'B1 selection_equivalence_key for every outcome-set row.',
      );
    }
    if (indexed.has(row.selectionEquivalenceKey)) {
      return blocked(
        'B1_OUTCOME_SET_INCOMPLETE',
        'B1 market outcome sets must not contain duplicate terminal outcome evidence.',
        'One row per selection_equivalence_key for each venue.',
      );
    }
    indexed.set(row.selectionEquivalenceKey, row);
  }
  return accepted(indexed);
}
