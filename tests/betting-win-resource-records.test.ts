import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import {
  parseBettingWinResourceRecord,
  parseBettingWinResourceRecords,
} from '../src/contracts/betting-win-resource-records.js';

const REPO_ROOT = process.cwd();

test('resource record parser rejects unsupported local record types', () => {
  const result = parseBettingWinResourceRecord({ recordType: 'unsupported' });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RESOURCE_RECORD_TYPE_INVALID',
      message: 'Local betting-win resource records must declare a supported recordType.',
      evidenceRequired: 'Supported local recordType in fixture records.',
    },
  ]);
});

test('resource record parser accepts repo-local fixture records and freezes parsed values', () => {
  const bundle = readLocalBettingWinExportBundle(
    'tests/fixtures/local-only-export-bundles/valid-resource-records-export.json',
    REPO_ROOT,
  );

  assert.equal(bundle.ok, true);

  const result = parseBettingWinResourceRecords(bundle.value.records);

  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(result.value.length, 4);
  const [identityRecord, ruleRecord, quoteRecord, settlementRecord] = result.value;

  assert.ok(identityRecord);
  assert.ok(ruleRecord);
  assert.ok(quoteRecord);
  assert.ok(settlementRecord);
  assert.equal(identityRecord.recordType, 'identity');
  assert.equal(ruleRecord.recordType, 'rules');
  assert.equal(quoteRecord.recordType, 'quotes');
  assert.equal(settlementRecord.recordType, 'settlement');
  assert.equal(quoteRecord.evidence.priceMinor, 510000n);
  assert.equal(quoteRecord.evidence.availableSizeMinor, 1200000n);
  assert.equal(quoteRecord.minStakeMinor, 1000n);
  assert.equal(Object.isFrozen(quoteRecord), true);
  assert.equal(Object.isFrozen(quoteRecord.evidence), true);
});

test('resource record parser rejects incomplete rules fixtures before later market assembly', () => {
  const result = parseBettingWinResourceRecord({
    recordType: 'rules',
    canonicalMarketId: 'market-001',
    ruleProfileId: 'rules-001',
    resultSourceId: '',
    finalityPolicyId: 'finality-001',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'RULE_RECORD_RESULT_SOURCE_ID_MISSING',
      message: 'Rule record resultSourceId is required.',
      evidenceRequired: 'Result source id from a local betting-win fixture.',
    },
  ]);
});

test('resource record parser rejects invalid quote manifest hashes and minor-unit values', () => {
  const badManifest = parseBettingWinResourceRecord({
    recordType: 'quotes',
    canonicalMarketId: 'market-001',
    outcome: 'yes',
    quoteSourceManifestHash: 'bad-hash',
    evidenceId: 'quote-001',
    observedAt: '2026-07-01T00:00:01.000Z',
    priceMinor: '510000',
    availableSizeMinor: '1200000',
    minStakeMinor: '1000',
    feeMinor: '25',
    costMinor: '0',
    currency: 'USDC',
  });

  assert.equal(badManifest.ok, false);
  assert.deepEqual(badManifest.blockers, [
    {
      code: 'QUOTE_RECORD_MANIFEST_HASH_INVALID',
      message: 'Quote record quoteSourceManifestHash must be 64 hexadecimal characters.',
      evidenceRequired: 'Local quote source manifest hash.',
    },
  ]);

  const badMinorUnits = parseBettingWinResourceRecord({
    recordType: 'quotes',
    canonicalMarketId: 'market-001',
    outcome: 'yes',
    quoteSourceManifestHash: 'b'.repeat(64),
    evidenceId: 'quote-001',
    observedAt: '2026-07-01T00:00:01.000Z',
    priceMinor: '-1',
    availableSizeMinor: '1200000',
    minStakeMinor: '1000',
    feeMinor: '25',
    costMinor: '0',
    currency: 'USDC',
  });

  assert.equal(badMinorUnits.ok, false);
  assert.deepEqual(badMinorUnits.blockers, [
    {
      code: 'QUOTE_RECORD_PRICE_INVALID',
      message: 'Quote record priceMinor must be a non-negative integer string or bigint.',
      evidenceRequired: 'Local quote price minor units.',
    },
  ]);
});

test('resource record parser rejects settlement fixtures without accepted replay authority and final outcome', () => {
  const result = parseBettingWinResourceRecord({
    recordType: 'settlement',
    canonicalMarketId: 'market-001',
    ruleProfileId: 'rules-001',
    resultSourceId: 'result-source-001',
    finalityPolicyId: 'finality-001',
    finalityAuthorityId: '',
    replayManifestHash: 'c'.repeat(64),
    replayAcceptedAt: '2026-07-01T00:05:00.000Z',
    acceptanceStatus: 'accepted',
    finalOutcome: 'yes',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SETTLEMENT_RECORD_FINALITY_AUTHORITY_ID_MISSING',
      message: 'Settlement record finalityAuthorityId is required.',
      evidenceRequired: 'Finality authority id from a local betting-win fixture.',
    },
  ]);
});
