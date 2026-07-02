import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { parseBettingWinResourceRecords, type BettingWinResourceRecord } from '../src/contracts/betting-win-resource-records.js';
import { assembleStandardBinaryCompleteSet, validateStandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';
import { sampleLeg } from './helpers.js';

const REPO_ROOT = process.cwd();

test('standard binary complete set requires yes and no legs', () => {
  assert.equal(validateStandardBinaryCompleteSet([sampleLeg('yes'), sampleLeg('no')]).ok, true);
  assert.equal(validateStandardBinaryCompleteSet([sampleLeg('yes')]).ok, false);
});

test('standard binary complete-set assembly accepts validated local records', () => {
  const result = assembleStandardBinaryCompleteSet(loadCompleteResourceRecords());

  assert.equal(result.ok, true);
  assert.equal(result.value.canonicalEventId, 'event-001');
  assert.equal(result.value.canonicalMarketId, 'market-001');
  assert.equal(result.value.providerGeneration, 'generation-001');
  assert.equal(result.value.ruleProfileId, 'rules-001');
  assert.equal(result.value.resultSourceId, 'result-source-001');
  assert.equal(result.value.finalityPolicyId, 'finality-001');
  assert.deepEqual(result.value.scenarioIds, ['yes_wins', 'no_wins']);
  assert.equal(result.value.legs.length, 2);
  assert.equal(result.value.quotesByOutcome.yes.outcome, 'yes');
  assert.equal(result.value.quotesByOutcome.no.outcome, 'no');
  assert.equal(result.value.quotesByOutcome.yes.evidence.priceMinor, 510000n);
});

test('standard binary complete-set assembly rejects unresolved identity', () => {
  const records = loadValidResourceRecords().filter((record) => record.recordType !== 'identity');
  const result = assembleStandardBinaryCompleteSet(records);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'COMPLETE_SET_IDENTITY_UNRESOLVED',
      message: 'Standard-binary complete-set assembly requires exactly one canonical identity record.',
      evidenceRequired: 'One local betting-win identity record for the candidate market.',
    },
  ]);
});

test('standard binary complete-set assembly rejects unknown provider generation', () => {
  const records = loadValidResourceRecords().map((record) =>
    record.recordType === 'identity' ? { ...record, providerGeneration: 'unknown' } : record,
  );
  const result = assembleStandardBinaryCompleteSet(records);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'COMPLETE_SET_PROVIDER_GENERATION_UNKNOWN',
      message: 'Standard-binary complete-set assembly rejects unknown provider generation.',
      evidenceRequired: 'Resolved provider generation from a local betting-win identity record.',
    },
  ]);
});

test('standard binary complete-set assembly rejects unresolved result source and finality policy', () => {
  const unknownResultSource = loadValidResourceRecords().map((record) =>
    record.recordType === 'rules' ? { ...record, resultSourceId: 'unknown' } : record,
  );
  const resultSource = assembleStandardBinaryCompleteSet(unknownResultSource);

  assert.equal(resultSource.ok, false);
  assert.deepEqual(resultSource.blockers, [
    {
      code: 'COMPLETE_SET_RESULT_SOURCE_UNRESOLVED',
      message: 'Standard-binary complete-set assembly requires a resolved result source.',
      evidenceRequired: 'Resolved local result source for the candidate market.',
    },
  ]);

  const unknownFinalityPolicy = loadValidResourceRecords().map((record) =>
    record.recordType === 'rules' ? { ...record, finalityPolicyId: 'unknown' } : record,
  );
  const finalityPolicy = assembleStandardBinaryCompleteSet(unknownFinalityPolicy);

  assert.equal(finalityPolicy.ok, false);
  assert.deepEqual(finalityPolicy.blockers, [
    {
      code: 'COMPLETE_SET_FINALITY_POLICY_UNRESOLVED',
      message: 'Standard-binary complete-set assembly requires a resolved finality policy.',
      evidenceRequired: 'Resolved local finality policy for the candidate market.',
    },
  ]);
});

test('standard binary complete-set assembly rejects mismatched local rule records', () => {
  const records = [
    ...loadValidResourceRecords(),
    {
      recordType: 'settlement' as const,
      canonicalMarketId: 'market-001',
      ruleProfileId: 'rules-002',
      resultSourceId: 'result-source-001',
      finalityPolicyId: 'finality-001',
      finalityAuthorityId: 'authority-001',
      replayManifestHash: 'd'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:06:00.000Z',
      acceptanceStatus: 'accepted' as const,
      finalOutcome: 'yes' as const,
    },
  ];
  const result = assembleStandardBinaryCompleteSet(records);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'COMPLETE_SET_RULE_PROFILE_MISMATCH',
      message: 'Standard-binary complete-set assembly requires matching rule profile, result source, and finality policy across local records.',
      evidenceRequired: 'Consistent local rule/finality records for the candidate market.',
    },
  ]);
});

test('standard binary complete-set assembly rejects incomplete quote coverage', () => {
  const records = loadValidResourceRecords().filter(
    (record) => !(record.recordType === 'quotes' && record.outcome === 'no'),
  );
  const result = assembleStandardBinaryCompleteSet(records);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'COMPLETE_SET_INCOMPLETE',
      message: 'Standard-binary complete-set assembly requires both YES and NO quote records.',
      evidenceRequired: 'One local YES quote and one local NO quote for the candidate market.',
    },
  ]);
});

function loadValidResourceRecords(): readonly BettingWinResourceRecord[] {
  const bundle = readLocalBettingWinExportBundle(
    'tests/fixtures/local-only-export-bundles/valid-resource-records-export.json',
    REPO_ROOT,
  );
  assert.equal(bundle.ok, true);

  const records = parseBettingWinResourceRecords(bundle.value.records);
  assert.equal(records.ok, true);
  return records.value;
}

function loadCompleteResourceRecords(): readonly BettingWinResourceRecord[] {
  return [
    ...loadValidResourceRecords(),
    {
      recordType: 'quotes',
      canonicalMarketId: 'market-001',
      outcome: 'no',
      quoteSourceManifestHash: 'e'.repeat(64),
      minStakeMinor: 1000n,
      feeMinor: 25n,
      costMinor: 0n,
      evidence: {
        evidenceId: 'quote-002',
        observedAt: '2026-07-01T00:00:02.000Z',
        priceMinor: 490000n,
        availableSizeMinor: 1200000n,
        currency: 'USDC',
      },
    },
  ];
}
