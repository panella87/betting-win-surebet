import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateB1VoidRuleReplay,
} from '../src/simulation/b1-void-rule-replay.js';

test('B1 void-rule replay rejects malformed top-level containers without throwing', () => {
  const malformedRecords = validateB1VoidRuleReplay(null as never);
  assert.equal(malformedRecords.ok, false);
  assert.deepEqual(malformedRecords.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      message: 'B1 void-rule replay requires settlement records as an array.',
      evidenceRequired: 'Array of structured B1 settlement replay records.',
    },
  ]);

  const malformedRecord = validateB1VoidRuleReplay(Object.freeze([null]) as never);
  assert.equal(malformedRecord.ok, false);
  assert.deepEqual(malformedRecord.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      message: 'B1 void-rule replay requires structured settlement replay records.',
      evidenceRequired: 'Structured B1 settlement replay record fields.',
    },
  ]);
});

test('B1 void-rule replay accepts compatible structured records', () => {
  const result = validateB1VoidRuleReplay(Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-a',
      settlementRuleVersion: ' settlement-rule-v1 ',
      settlementCompatibilityFlag: 'compatible',
      voidRuleId: ' void-rule-push-refund-v1 ',
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-b',
      settlementRuleVersion: 'settlement-rule-v1',
      settlementCompatibilityFlag: 'compatible',
      voidRuleId: 'void-rule-push-refund-v1',
    }),
  ]));

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    replayKind: 'deterministic_b1_void_rule_replay',
    settlementRuleVersion: 'settlement-rule-v1',
    voidRuleId: 'void-rule-push-refund-v1',
    comparedLegCount: 2,
    settlementCompatibility: 'compatible',
  });
});
