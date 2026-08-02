import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1SettlementCompatibilityFlag } from '../contracts/b1-local-types.js';

export interface B1VoidRuleReplayRecord {
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly settlementRuleVersion: string;
  readonly settlementCompatibilityFlag: B1SettlementCompatibilityFlag;
  readonly voidRuleId: string;
}

export interface B1VoidRuleReplayAnalysis {
  readonly replayKind: 'deterministic_b1_void_rule_replay';
  readonly settlementRuleVersion: string;
  readonly voidRuleId: string;
  readonly comparedLegCount: number;
  readonly settlementCompatibility: 'compatible';
}

export function validateB1VoidRuleReplay(
  records: readonly B1VoidRuleReplayRecord[],
): BoundaryResult<B1VoidRuleReplayAnalysis> {
  if (records.length === 0) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_MISSING',
      'B1 void-rule replay requires explicit settlement records for every compared B1 leg.',
      'Accepted B1 settlement replay records for the compared cross-venue legs.',
    );
  }

  let settlementRuleVersion: string | undefined;
  let voidRuleId: string | undefined;
  const legKeys = new Set<string>();
  for (const record of records) {
    const validation = validateB1VoidRuleReplayRecord(record);
    if (!validation.ok) {
      return validation;
    }
    const legKey = buildB1VoidRuleLegKey(record.selectionEquivalenceKey, record.venueOrBookmakerId);
    legKeys.add(legKey);

    if (settlementRuleVersion === undefined) {
      settlementRuleVersion = record.settlementRuleVersion;
    } else if (settlementRuleVersion !== record.settlementRuleVersion) {
      return blocked(
        'B1_SETTLEMENT_RULE_MISMATCH',
        'B1 settlement replay blocks cross-venue candidates with mismatched settlement rule versions.',
        'One explicit compatible settlement_rule_version across every compared B1 leg.',
      );
    }

    if (voidRuleId === undefined) {
      voidRuleId = record.voidRuleId;
    } else if (voidRuleId !== record.voidRuleId) {
      return blocked(
        'B1_VOID_RULE_MISMATCH',
        'B1 settlement replay blocks cross-venue candidates with mismatched void rules.',
        'One explicit compatible void_rule_id across every compared B1 leg.',
      );
    }
  }

  if (settlementRuleVersion === undefined || voidRuleId === undefined) {
    throw new Error('B1 void-rule replay lost validated settlement evidence.');
  }

  return accepted(Object.freeze({
    replayKind: 'deterministic_b1_void_rule_replay',
    settlementRuleVersion,
    voidRuleId,
    comparedLegCount: legKeys.size,
    settlementCompatibility: 'compatible',
  }));
}

function validateB1VoidRuleReplayRecord(
  record: B1VoidRuleReplayRecord,
): BoundaryResult<B1VoidRuleReplayRecord> {
  if (record.selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 settlement replay requires selection equivalence evidence for every replayed leg.',
      'B1 settlement replay selection_equivalence_key.',
    );
  }
  if (record.venueOrBookmakerId.length === 0) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 settlement replay requires venue evidence for every replayed leg.',
      'B1 settlement replay venue_or_bookmaker_id.',
    );
  }
  if (record.settlementRuleVersion.length === 0) {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 settlement replay requires an explicit settlement rule version.',
      'B1 settlement_rule_version for every compared leg.',
    );
  }
  if (record.settlementCompatibilityFlag !== 'compatible') {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 settlement replay requires explicit compatible settlement evidence before false-positive analysis.',
      'B1 settlement_compatibility_flag=compatible for every compared leg.',
    );
  }
  if (record.voidRuleId.length === 0) {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 settlement replay requires an explicit void-rule id.',
      'B1 void_rule_id for every compared leg.',
    );
  }
  return accepted(Object.freeze({ ...record }));
}

function buildB1VoidRuleLegKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}\u0000${venueOrBookmakerId}`;
}
