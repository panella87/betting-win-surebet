import type { BettingWinResourceRecord } from '../contracts/betting-win-resource-records.js';
import type { Blocker } from '../contracts/local-types.js';
import { buildMarketGroupKey } from '../identity/market-group-key.js';
import { assembleStandardBinaryCompleteSet, type StandardBinaryCompleteSet } from '../scenarios/complete-set.js';

export interface AcceptedStandardBinaryOpportunityCandidate {
  readonly ok: true;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly marketGroupKey: string;
  readonly completeSet: StandardBinaryCompleteSet;
  readonly records: readonly BettingWinResourceRecord[];
}

export interface BlockedStandardBinaryOpportunityCandidate {
  readonly ok: false;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly blockers: readonly Blocker[];
  readonly records: readonly BettingWinResourceRecord[];
}

export type StandardBinaryOpportunityCandidate =
  | AcceptedStandardBinaryOpportunityCandidate
  | BlockedStandardBinaryOpportunityCandidate;

export function deriveStandardBinaryOpportunityCandidates(
  records: readonly BettingWinResourceRecord[],
): readonly StandardBinaryOpportunityCandidate[] {
  const recordsByMarket = new Map<string, BettingWinResourceRecord[]>();
  for (const record of records) {
    const currentRecords = recordsByMarket.get(record.canonicalMarketId) ?? [];
    currentRecords.push(record);
    recordsByMarket.set(record.canonicalMarketId, currentRecords);
  }

  return Object.freeze(
    [...recordsByMarket.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([canonicalMarketId, marketRecords]) => deriveCandidate(canonicalMarketId, marketRecords)),
  );
}

function deriveCandidate(
  canonicalMarketId: string,
  marketRecords: readonly BettingWinResourceRecord[],
): StandardBinaryOpportunityCandidate {
  const frozenRecords = Object.freeze([...marketRecords]);
  const completeSet = assembleStandardBinaryCompleteSet(frozenRecords);
  if (!completeSet.ok) {
    return Object.freeze({
      ok: false,
      candidateId: canonicalMarketId,
      canonicalMarketId,
      blockers: Object.freeze(completeSet.blockers.map((blocker) => Object.freeze({ ...blocker }))),
      records: frozenRecords,
    });
  }

  return Object.freeze({
    ok: true,
    candidateId: completeSet.value.canonicalMarketId,
    canonicalMarketId: completeSet.value.canonicalMarketId,
    marketGroupKey: buildMarketGroupKey(completeSet.value.legs),
    completeSet: completeSet.value,
    records: frozenRecords,
  });
}
