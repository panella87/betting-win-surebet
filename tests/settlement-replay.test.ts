import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import {
  parseBettingWinResourceRecords,
  type BettingWinResourceRecord,
  type BettingWinSettlementRecord,
} from '../src/contracts/betting-win-resource-records.js';
import { assembleStandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';
import { consumeStandardBinarySettlementReplay } from '../src/simulation/settlement-replay.js';

const REPO_ROOT = process.cwd();

test('settlement replay consumption maps an accepted local replay to a terminal scenario', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();
  const result = consumeStandardBinarySettlementReplay(completeSet, settlementRecord);

  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.value), true);
  assert.deepEqual(result.value, {
    canonicalMarketId: 'market-001',
    ruleProfileId: 'rules-001',
    resultSourceId: 'result-source-001',
    finalityPolicyId: 'finality-001',
    finalityAuthorityId: 'authority-001',
    replayManifestHash: 'c'.repeat(64),
    replayAcceptedAt: '2026-07-01T00:05:00.000Z',
    scenarioId: 'yes_wins',
    finalOutcome: 'yes',
  });
});

test('settlement replay consumption rejects missing finality authority and malformed replay manifest hash', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();

  const missingAuthority = consumeStandardBinarySettlementReplay(completeSet, {
    ...settlementRecord,
    finalityAuthorityId: '   ',
  });
  assert.equal(missingAuthority.ok, false);
  assert.deepEqual(missingAuthority.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISSING',
      message: 'Settlement replay consumption requires a finality authority id.',
      evidenceRequired: 'Accepted local settlement replay finality authority.',
    },
  ]);

  const malformedManifest = consumeStandardBinarySettlementReplay(completeSet, {
    ...settlementRecord,
    replayManifestHash: 'not-a-manifest-hash',
  });
  assert.equal(malformedManifest.ok, false);
  assert.deepEqual(malformedManifest.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_MANIFEST_HASH_INVALID',
      message: 'Settlement replay consumption requires a 64-character hexadecimal replay manifest hash.',
      evidenceRequired: 'Accepted local settlement replay manifest hash.',
    },
  ]);
});

test('settlement replay consumption rejects replay records that do not match the complete-set context', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();

  const mismatchedRuleProfile = consumeStandardBinarySettlementReplay(completeSet, {
    ...settlementRecord,
    ruleProfileId: 'rules-002',
  });
  assert.equal(mismatchedRuleProfile.ok, false);
  assert.deepEqual(mismatchedRuleProfile.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_RULE_PROFILE_MISMATCH',
      message: 'Settlement replay consumption requires the rule profile to match the complete-set.',
      evidenceRequired: 'Accepted local settlement replay fixture aligned to the complete-set rule profile.',
    },
  ]);
});

test('settlement replay consumption rejects final outcomes that cannot be mapped to a validated terminal scenario', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();
  const result = consumeStandardBinarySettlementReplay(
    {
      ...completeSet,
      scenarioIds: ['no_wins'],
    },
    settlementRecord,
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
      message: 'Settlement replay consumption requires a terminal scenario that matches the accepted final outcome.',
      evidenceRequired: 'Validated standard-binary terminal scenarios for the complete-set.',
    },
  ]);
});

function loadResourceRecords(): readonly BettingWinResourceRecord[] {
  const bundle = readLocalBettingWinExportBundle(
    'tests/fixtures/local-only-export-bundles/valid-resource-records-export.json',
    REPO_ROOT,
  );
  assert.equal(bundle.ok, true);

  const records = parseBettingWinResourceRecords(bundle.value.records);
  assert.equal(records.ok, true);
  return records.value;
}

function loadCompleteSet() {
  const records = loadResourceRecords();
  const completeSet = assembleStandardBinaryCompleteSet([
    ...records,
    {
      recordType: 'quotes' as const,
      canonicalMarketId: 'market-001',
      outcome: 'no' as const,
      quoteSourceManifestHash: 'e'.repeat(64),
      minStakeMinor: 1000n,
      feeMinor: 20n,
      costMinor: 5n,
      evidence: {
        evidenceId: 'quote-002',
        observedAt: '2026-07-01T00:00:02.000Z',
        priceMinor: 490000n,
        availableSizeMinor: 1200000n,
        currency: 'USDC' as const,
      },
    },
  ]);
  assert.equal(completeSet.ok, true);

  return completeSet.value;
}

function loadSettlementRecord(): BettingWinSettlementRecord {
  const settlementRecord = loadResourceRecords().find(
    (record): record is BettingWinSettlementRecord => record.recordType === 'settlement',
  );
  assert.ok(settlementRecord);
  return settlementRecord;
}
