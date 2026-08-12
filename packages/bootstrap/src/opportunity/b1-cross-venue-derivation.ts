import {
  accepted,
  blocked,
  type Blocker,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';
import {
  compareB1MarketOutcomeSetEquivalence,
  type B1MarketOutcomeSetEquivalence,
} from '../identity/b1-market-equivalence.js';
import {
  synchronizeB1VenueQuotePair,
  type B1QuoteSynchronizationPolicy,
  type B1SynchronizedQuotePair,
  type B1SynchronizedQuoteRow,
} from '../quotes/b1-quote-synchronization.js';
import {
  calculateB1GrossSpread,
  parseB1DecimalOddsMicro,
  type B1GrossQuoteContribution,
} from './b1-gross-spread.js';

export interface B1AcceptedGrossOpportunityCandidate {
  readonly ok: true;
  readonly candidateId: string;
  readonly grossOpportunityKind: 'deterministic_gross_cross_venue_candidate';
  readonly marketEquivalenceKey: string;
  readonly canonicalEventId: string;
  readonly marketType: string;
  readonly period: string;
  readonly lineValue: string;
  readonly currency: string;
  readonly venuePairKey: string;
  readonly firstVenueOrBookmakerId: string;
  readonly secondVenueOrBookmakerId: string;
  readonly terminalOutcomeCount: number;
  readonly comparisonTimeUtc: string;
  readonly maxComparisonWindowMs: bigint;
  readonly impliedProbabilityPpmSum: bigint;
  readonly grossSpreadPpm: bigint;
  readonly selectedQuotes: readonly B1GrossQuoteContribution[];
  readonly synchronizedQuotePairs: readonly B1SynchronizedQuotePair[];
  readonly records: readonly B1MultiVenueMarketRow[];
}

export interface B1BlockedGrossOpportunityCandidate {
  readonly ok: false;
  readonly candidateId: string;
  readonly marketEquivalenceKey: string;
  readonly venuePairKey: string;
  readonly blockers: readonly Blocker[];
  readonly records: readonly B1MultiVenueMarketRow[];
}

export type B1GrossOpportunityCandidate =
  | B1AcceptedGrossOpportunityCandidate
  | B1BlockedGrossOpportunityCandidate;

export function deriveB1CrossVenueGrossOpportunityCandidates(
  rows: readonly B1MultiVenueMarketRow[],
  quotePolicy: B1QuoteSynchronizationPolicy,
): BoundaryResult<readonly B1GrossOpportunityCandidate[]> {
  if (!Array.isArray(rows)) {
    return blocked(
      'B1_GROSS_INPUT_ROWS_INVALID',
      'B1 gross derivation requires multi-venue market rows as an array.',
      'Array of B1 multi-venue market rows.',
    );
  }
  if (rows.length === 0) {
    return blocked(
      'B1_GROSS_INPUT_ROWS_EMPTY',
      'B1 gross derivation requires at least one multi-venue market row.',
      'B1 multi-venue market rows.',
    );
  }
  for (const row of rows) {
    if (!isB1GrossInputRow(row)) {
      return blocked(
        'B1_GROSS_INPUT_ROW_INVALID',
        'B1 gross derivation requires structured multi-venue market row inputs.',
        'Structured B1 multi-venue market rows.',
      );
    }
  }

  const rowsByMarket = groupRowsByMarketEquivalence(rows);
  const candidates: B1GrossOpportunityCandidate[] = [];
  for (const [marketEquivalenceKey, marketRows] of sortedEntries(rowsByMarket)) {
    if (marketRows.some((row) => normalizeVenueId(row.venueOrBookmakerId) === undefined)) {
      candidates.push(blockedCandidate(
        `${marketEquivalenceKey}|venue-pair-missing`,
        marketEquivalenceKey,
        'venue-pair-missing',
        [{
          code: 'B1_VENUE_PAIR_INCOMPLETE',
          message: 'B1 gross derivation requires non-empty venue evidence for every row.',
          evidenceRequired: 'B1 rows with non-empty venue_or_bookmaker_id values.',
        }],
        marketRows,
      ));
      continue;
    }
    const rowsByVenue = groupRowsByVenue(marketRows);
    const venueIds = Array.from(rowsByVenue.keys()).sort();
    if (venueIds.length < 2) {
      candidates.push(blockedCandidate(
        `${marketEquivalenceKey}|venue-pair-missing`,
        marketEquivalenceKey,
        'venue-pair-missing',
        [{
          code: 'B1_VENUE_PAIR_INCOMPLETE',
          message: 'B1 gross derivation requires at least two venues for a market.',
          evidenceRequired: 'B1 rows for two distinct venue_or_bookmaker_id values.',
        }],
        marketRows,
      ));
      continue;
    }

    for (let firstIndex = 0; firstIndex < venueIds.length; firstIndex += 1) {
      const firstVenueId = venueIds[firstIndex];
      if (firstVenueId === undefined) {
        throw new Error('B1 venue id iteration produced an undefined first venue.');
      }
      for (let secondIndex = firstIndex + 1; secondIndex < venueIds.length; secondIndex += 1) {
        const secondVenueId = venueIds[secondIndex];
        if (secondVenueId === undefined) {
          throw new Error('B1 venue id iteration produced an undefined second venue.');
        }
        const firstRows = rowsByVenue.get(firstVenueId);
        const secondRows = rowsByVenue.get(secondVenueId);
        if (firstRows === undefined || secondRows === undefined) {
          throw new Error('B1 venue row grouping lost a venue present in the deterministic venue index.');
        }
        candidates.push(deriveVenuePairGrossCandidate(marketEquivalenceKey, firstRows, secondRows, quotePolicy));
      }
    }
  }

  return accepted(Object.freeze(candidates));
}

function deriveVenuePairGrossCandidate(
  marketEquivalenceKey: string,
  firstRows: readonly B1MultiVenueMarketRow[],
  secondRows: readonly B1MultiVenueMarketRow[],
  quotePolicy: B1QuoteSynchronizationPolicy,
): B1GrossOpportunityCandidate {
  const candidateId = buildCandidateId(marketEquivalenceKey, firstRows, secondRows);
  const venuePairKey = buildVenuePairKeyForRows(firstRows, secondRows);
  const records = Object.freeze([...firstRows, ...secondRows]);

  const outcomeSetEquivalence = compareB1MarketOutcomeSetEquivalence(firstRows, secondRows);
  if (!outcomeSetEquivalence.ok) {
    return blockedCandidate(
      candidateId,
      marketEquivalenceKey,
      venuePairKey,
      outcomeSetEquivalence.blockers,
      records,
    );
  }

  const synchronizedPairs: B1SynchronizedQuotePair[] = [];
  const selectedRows: B1SynchronizedQuoteRow[] = [];
  const secondRowsBySelection = indexRowsBySelection(secondRows);
  for (const firstRow of sortRowsBySelection(firstRows)) {
    const secondRow = secondRowsBySelection.get(firstRow.selectionEquivalenceKey);
    if (secondRow === undefined) {
      return blockedCandidate(
        candidateId,
        marketEquivalenceKey,
        venuePairKey,
        [{
          code: 'B1_OUTCOME_SET_INCOMPLETE',
          message: 'B1 market outcome sets must contain every terminal outcome on both venues.',
          evidenceRequired: 'Selection equivalence evidence for every terminal outcome.',
        }],
        records,
      );
    }

    const synchronizedPair = synchronizeB1VenueQuotePair(firstRow, secondRow, quotePolicy);
    if (!synchronizedPair.ok) {
      return blockedCandidate(
        candidateId,
        marketEquivalenceKey,
        venuePairKey,
        synchronizedPair.blockers,
        records,
      );
    }
    synchronizedPairs.push(synchronizedPair.value);

    const selectedRow = selectBestGrossQuote(synchronizedPair.value.first, synchronizedPair.value.second);
    if (!selectedRow.ok) {
      return blockedCandidate(
        candidateId,
        marketEquivalenceKey,
        venuePairKey,
        selectedRow.blockers,
        records,
      );
    }
    selectedRows.push(selectedRow.value);
  }

  const grossSpread = calculateB1GrossSpread(selectedRows.map((selectedRow) => ({
    selectionEquivalenceKey: selectedRow.row.selectionEquivalenceKey,
    outcomeName: selectedRow.row.outcomeName,
    outcomeSide: selectedRow.row.outcomeSide,
    venueOrBookmakerId: selectedRow.row.venueOrBookmakerId,
    decimalOdds: selectedRow.row.decimalOdds,
  })));
  if (!grossSpread.ok) {
    return blockedCandidate(
      candidateId,
      marketEquivalenceKey,
      venuePairKey,
      grossSpread.blockers,
      records,
    );
  }

  return acceptedCandidate(
    candidateId,
    outcomeSetEquivalence.value,
    grossSpread.value.impliedProbabilityPpmSum,
    grossSpread.value.grossSpreadPpm,
    grossSpread.value.quoteContributions,
    synchronizedPairs,
    records,
  );
}

function acceptedCandidate(
  candidateId: string,
  outcomeSetEquivalence: B1MarketOutcomeSetEquivalence,
  impliedProbabilityPpmSum: bigint,
  grossSpreadPpm: bigint,
  selectedQuotes: readonly B1GrossQuoteContribution[],
  synchronizedQuotePairs: readonly B1SynchronizedQuotePair[],
  records: readonly B1MultiVenueMarketRow[],
): B1AcceptedGrossOpportunityCandidate {
  const firstSynchronizedQuotePair = synchronizedQuotePairs[0];
  if (firstSynchronizedQuotePair === undefined) {
    throw new Error('B1 accepted gross candidate requires synchronized quote pairs.');
  }

  return Object.freeze({
    ok: true,
    candidateId,
    grossOpportunityKind: 'deterministic_gross_cross_venue_candidate',
    marketEquivalenceKey: outcomeSetEquivalence.marketEquivalenceKey,
    canonicalEventId: outcomeSetEquivalence.canonicalEventId,
    marketType: outcomeSetEquivalence.marketType,
    period: outcomeSetEquivalence.period,
    lineValue: outcomeSetEquivalence.lineValue,
    currency: outcomeSetEquivalence.currency,
    venuePairKey: outcomeSetEquivalence.venuePair.key,
    firstVenueOrBookmakerId: outcomeSetEquivalence.venuePair.firstVenueOrBookmakerId,
    secondVenueOrBookmakerId: outcomeSetEquivalence.venuePair.secondVenueOrBookmakerId,
    terminalOutcomeCount: outcomeSetEquivalence.terminalOutcomeCount,
    comparisonTimeUtc: firstSynchronizedQuotePair.comparisonTimeUtc,
    maxComparisonWindowMs: maxComparisonWindow(synchronizedQuotePairs),
    impliedProbabilityPpmSum,
    grossSpreadPpm,
    selectedQuotes: Object.freeze([...selectedQuotes]),
    synchronizedQuotePairs: Object.freeze([...synchronizedQuotePairs]),
    records,
  });
}

function blockedCandidate(
  candidateId: string,
  marketEquivalenceKey: string,
  venuePairKey: string,
  blockers: readonly Blocker[],
  records: readonly B1MultiVenueMarketRow[],
): B1BlockedGrossOpportunityCandidate {
  return Object.freeze({
    ok: false,
    candidateId,
    marketEquivalenceKey,
    venuePairKey,
    blockers: Object.freeze(blockers.map((blocker) => Object.freeze({ ...blocker }))),
    records,
  });
}

function selectBestGrossQuote(
  first: B1SynchronizedQuoteRow,
  second: B1SynchronizedQuoteRow,
): BoundaryResult<B1SynchronizedQuoteRow> {
  const firstOdds = parseB1DecimalOddsMicro(first.row.decimalOdds);
  if (!firstOdds.ok) {
    return firstOdds;
  }
  const secondOdds = parseB1DecimalOddsMicro(second.row.decimalOdds);
  if (!secondOdds.ok) {
    return secondOdds;
  }

  if (firstOdds.value > secondOdds.value) {
    return accepted(first);
  }
  if (secondOdds.value > firstOdds.value) {
    return accepted(second);
  }
  if (first.row.venueOrBookmakerId <= second.row.venueOrBookmakerId) {
    return accepted(first);
  }
  return accepted(second);
}

function groupRowsByMarketEquivalence(
  rows: readonly B1MultiVenueMarketRow[],
): ReadonlyMap<string, readonly B1MultiVenueMarketRow[]> {
  const groups = new Map<string, B1MultiVenueMarketRow[]>();
  for (const row of rows) {
    let marketRows = groups.get(row.marketEquivalenceKey);
    if (marketRows === undefined) {
      marketRows = [];
      groups.set(row.marketEquivalenceKey, marketRows);
    }
    marketRows.push(row);
  }
  return new Map(sortedEntries(groups).map(([key, value]) => [key, Object.freeze(sortRowsBySelection(value))]));
}

function groupRowsByVenue(
  rows: readonly B1MultiVenueMarketRow[],
): ReadonlyMap<string, readonly B1MultiVenueMarketRow[]> {
  const groups = new Map<string, B1MultiVenueMarketRow[]>();
  for (const row of rows) {
    const venueId = normalizeVenueId(row.venueOrBookmakerId);
    if (venueId === undefined) {
      continue;
    }
    let venueRows = groups.get(venueId);
    if (venueRows === undefined) {
      venueRows = [];
      groups.set(venueId, venueRows);
    }
    venueRows.push(row);
  }
  return new Map(sortedEntries(groups).map(([key, value]) => [key, Object.freeze(sortRowsBySelection(value))]));
}

function indexRowsBySelection(
  rows: readonly B1MultiVenueMarketRow[],
): ReadonlyMap<string, B1MultiVenueMarketRow> {
  const indexed = new Map<string, B1MultiVenueMarketRow>();
  for (const row of rows) {
    indexed.set(row.selectionEquivalenceKey, row);
  }
  return indexed;
}

function sortRowsBySelection(rows: readonly B1MultiVenueMarketRow[]): readonly B1MultiVenueMarketRow[] {
  return [...rows].sort((first, second) => {
    const selectionOrder = first.selectionEquivalenceKey.localeCompare(second.selectionEquivalenceKey);
    if (selectionOrder !== 0) {
      return selectionOrder;
    }
    return first.venueOrBookmakerId.localeCompare(second.venueOrBookmakerId);
  });
}

function sortedEntries<T>(map: ReadonlyMap<string, T>): readonly (readonly [string, T])[] {
  return [...map.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function buildCandidateId(
  marketEquivalenceKey: string,
  firstRows: readonly B1MultiVenueMarketRow[],
  secondRows: readonly B1MultiVenueMarketRow[],
): string {
  return `${marketEquivalenceKey}|${buildVenuePairKeyForRows(firstRows, secondRows)}`;
}

function buildVenuePairKeyForRows(
  firstRows: readonly B1MultiVenueMarketRow[],
  secondRows: readonly B1MultiVenueMarketRow[],
): string {
  const firstRow = firstRows[0];
  const secondRow = secondRows[0];
  if (firstRow === undefined || secondRow === undefined) {
    return 'venue-pair-missing';
  }
  const firstRowVenue = normalizeVenueId(firstRow.venueOrBookmakerId);
  const secondRowVenue = normalizeVenueId(secondRow.venueOrBookmakerId);
  if (firstRowVenue === undefined || secondRowVenue === undefined) {
    return 'venue-pair-missing';
  }
  const ordered = [firstRowVenue, secondRowVenue].sort();
  const firstVenue = ordered[0];
  const secondVenue = ordered[1];
  if (firstVenue === undefined || secondVenue === undefined) {
    return 'venue-pair-missing';
  }
  return `${firstVenue}::${secondVenue}`;
}

function normalizeVenueId(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isB1GrossInputRow(value: unknown): value is B1MultiVenueMarketRow {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && typeof (value as { readonly canonicalEventId?: unknown }).canonicalEventId === 'string'
    && typeof (value as { readonly marketEquivalenceKey?: unknown }).marketEquivalenceKey === 'string'
    && typeof (value as { readonly marketType?: unknown }).marketType === 'string'
    && typeof (value as { readonly period?: unknown }).period === 'string'
    && typeof (value as { readonly lineValue?: unknown }).lineValue === 'string'
    && typeof (value as { readonly outcomeName?: unknown }).outcomeName === 'string'
    && typeof (value as { readonly outcomeSide?: unknown }).outcomeSide === 'string'
    && typeof (value as { readonly providerGenerationId?: unknown }).providerGenerationId === 'string'
    && typeof (value as { readonly venueOrBookmakerId?: unknown }).venueOrBookmakerId === 'string'
    && typeof (value as { readonly selectionEquivalenceKey?: unknown }).selectionEquivalenceKey === 'string'
    && typeof (value as { readonly snapshotTimeUtc?: unknown }).snapshotTimeUtc === 'string'
    && typeof (value as { readonly retrievedAtUtc?: unknown }).retrievedAtUtc === 'string'
    && typeof (value as { readonly quoteAgeMs?: unknown }).quoteAgeMs === 'bigint'
    && typeof (value as { readonly decimalOdds?: unknown }).decimalOdds === 'string'
    && typeof (value as { readonly currency?: unknown }).currency === 'string'
    && typeof (value as { readonly marketStatus?: unknown }).marketStatus === 'string'
    && typeof (value as { readonly settlementRuleVersion?: unknown }).settlementRuleVersion === 'string'
    && typeof (value as { readonly settlementCompatibilityFlag?: unknown }).settlementCompatibilityFlag === 'string'
    && typeof (value as { readonly voidRuleId?: unknown }).voidRuleId === 'string'
    && typeof (value as { readonly normalizedEvidenceId?: unknown }).normalizedEvidenceId === 'string';
}

function maxComparisonWindow(synchronizedQuotePairs: readonly B1SynchronizedQuotePair[]): bigint {
  let max = 0n;
  for (const synchronizedQuotePair of synchronizedQuotePairs) {
    if (synchronizedQuotePair.comparisonWindowMs > max) {
      max = synchronizedQuotePair.comparisonWindowMs;
    }
  }
  return max;
}
