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
  if (!Array.isArray(records)) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      'B1 void-rule replay requires settlement records as an array.',
      'Array of structured B1 settlement replay records.',
    );
  }
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
    const validatedRecord = validation.value;
    const legKey = buildB1VoidRuleLegKey(validatedRecord.selectionEquivalenceKey, validatedRecord.venueOrBookmakerId);
    legKeys.add(legKey);

    if (settlementRuleVersion === undefined) {
      settlementRuleVersion = validatedRecord.settlementRuleVersion;
    } else if (settlementRuleVersion !== validatedRecord.settlementRuleVersion) {
      return blocked(
        'B1_SETTLEMENT_RULE_MISMATCH',
        'B1 settlement replay blocks cross-venue candidates with mismatched settlement rule versions.',
        'One explicit compatible settlement_rule_version across every compared B1 leg.',
      );
    }

    if (voidRuleId === undefined) {
      voidRuleId = validatedRecord.voidRuleId;
    } else if (voidRuleId !== validatedRecord.voidRuleId) {
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
  if (
    typeof record !== 'object'
    || record === null
    || Array.isArray(record)
    || typeof record.selectionEquivalenceKey !== 'string'
    || typeof record.venueOrBookmakerId !== 'string'
    || typeof record.settlementRuleVersion !== 'string'
    || typeof record.settlementCompatibilityFlag !== 'string'
    || typeof record.voidRuleId !== 'string'
  ) {
    return blocked(
      'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      'B1 void-rule replay requires structured settlement replay records.',
      'Structured B1 settlement replay record fields.',
    );
  }
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
  if (record.settlementRuleVersion.trim().length === 0) {
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
  if (record.voidRuleId.trim().length === 0) {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 settlement replay requires an explicit void-rule id.',
      'B1 void_rule_id for every compared leg.',
    );
  }
  return accepted(Object.freeze({
    ...record,
    settlementRuleVersion: record.settlementRuleVersion.trim(),
    voidRuleId: record.voidRuleId.trim(),
  }));
}

function buildB1VoidRuleLegKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}\u0000${venueOrBookmakerId}`;
}
