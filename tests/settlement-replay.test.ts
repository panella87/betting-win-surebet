import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import {
  parseBettingWinResourceRecords,
  type BettingWinResourceRecord,
  type BettingWinSettlementRecord,
} from '../src/contracts/betting-win-resource-records.js';
import { assembleStandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';
import { simulateNonAtomicPaperGroupCompletion } from '../src/simulation/non-atomic-completion.js';
import {
  consumeStandardBinarySettlementReplay,
  consumeStandardBinarySettlementReplaySequence,
  reconcileNonAtomicSettlementReplay,
} from '../src/simulation/settlement-replay.js';
import { solveStandardBinaryStakeVector, type StakeVectorInputContract } from '../src/solver/stake-vector.js';

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

test('settlement replay sequence resolves idempotent duplicates and later corrections', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();
  const result = consumeStandardBinarySettlementReplaySequence(completeSet, [
    settlementRecord,
    { ...settlementRecord },
    {
      ...settlementRecord,
      replayManifestHash: 'd'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:06:00.000Z',
      finalOutcome: 'no',
    },
  ]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    settlement: {
      canonicalMarketId: 'market-001',
      ruleProfileId: 'rules-001',
      resultSourceId: 'result-source-001',
      finalityPolicyId: 'finality-001',
      finalityAuthorityId: 'authority-001',
      replayManifestHash: 'd'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:06:00.000Z',
      scenarioId: 'no_wins',
      finalOutcome: 'no',
    },
    replayCount: 3,
    uniqueReplayCount: 2,
    correctionCount: 1,
    finalityProgressionCount: 0,
  });
});

test('settlement replay sequence rejects replay idempotency mismatches and authority conflicts', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();

  const idempotencyMismatch = consumeStandardBinarySettlementReplaySequence(completeSet, [
    settlementRecord,
    {
      ...settlementRecord,
      finalOutcome: 'no',
    },
  ]);
  assert.equal(idempotencyMismatch.ok, false);
  assert.deepEqual(idempotencyMismatch.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_IDEMPOTENCY_MISMATCH',
      message: 'Settlement replay consumption requires each replay manifest hash to resolve to exactly one accepted settlement payload.',
      evidenceRequired: 'Idempotent accepted settlement replay records keyed by replay manifest hash.',
    },
  ]);

  const authorityMismatch = consumeStandardBinarySettlementReplaySequence(completeSet, [
    settlementRecord,
    {
      ...settlementRecord,
      replayManifestHash: 'd'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:06:00.000Z',
      finalityAuthorityId: 'authority-002',
    },
  ]);
  assert.equal(authorityMismatch.ok, false);
  assert.deepEqual(authorityMismatch.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISMATCH',
      message: 'Settlement replay consumption requires one finality authority across accepted replay corrections.',
      evidenceRequired: 'Accepted settlement replay records from one finality authority for the complete-set.',
    },
  ]);
});

test('settlement replay sequence rejects ambiguous correction ordering', () => {
  const completeSet = loadCompleteSet();
  const settlementRecord = loadSettlementRecord();
  const result = consumeStandardBinarySettlementReplaySequence(completeSet, [
    settlementRecord,
    {
      ...settlementRecord,
      replayManifestHash: 'd'.repeat(64),
    },
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_CORRECTION_CONFLICT',
      message: 'Settlement replay consumption requires a strict replay acceptance order for corrections and finality progression.',
      evidenceRequired: 'Accepted settlement replay records with an unambiguous replayAcceptedAt order.',
    },
  ]);
});

test('settlement replay reconciliation closes an incomplete non-atomic group against the corrected final scenario', () => {
  const completeSet = loadCompleteSet();
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const completionSimulation = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'reserve', stakeMinor: 200n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:01.000Z' },
      { legId: 'market-001:yes', type: 'reject', occurredAt: '2026-07-13T10:00:02.000Z' },
      { legId: 'market-001:no', type: 'expire', occurredAt: '2026-07-13T10:00:03.000Z' },
    ],
  });
  assert.equal(completionSimulation.ok, true);

  const settlementRecord = loadSettlementRecord();
  const result = reconcileNonAtomicSettlementReplay({
    completeSet,
    completionSimulation: completionSimulation.value,
    stakeVector: solved.value,
    matrix: input.matrix,
    settlementRecords: [
      settlementRecord,
      {
        ...settlementRecord,
        replayManifestHash: 'd'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:06:00.000Z',
        finalOutcome: 'no',
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    settlement: {
      canonicalMarketId: 'market-001',
      ruleProfileId: 'rules-001',
      resultSourceId: 'result-source-001',
      finalityPolicyId: 'finality-001',
      finalityAuthorityId: 'authority-001',
      replayManifestHash: 'd'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:06:00.000Z',
      scenarioId: 'no_wins',
      finalOutcome: 'no',
    },
    replayCount: 2,
    uniqueReplayCount: 2,
    correctionCount: 1,
    finalityProgressionCount: 0,
    completionGroupState: 'group_incomplete',
    settledNetMinor: -105n,
    filledLegIds: ['market-001:yes'],
    excludedLegIds: ['market-001:no'],
  });
});

test('settlement replay reconciliation rejects incomplete groups without residual exposure output', () => {
  const completeSet = loadCompleteSet();
  const input = createTwoUnitSolvedInput();
  const solved = solveStandardBinaryStakeVector(input);
  assert.equal(solved.ok, true);

  const completionSimulation = simulateNonAtomicPaperGroupCompletion({
    stakeVector: solved.value,
    matrix: input.matrix,
    manualKill: false,
    events: [
      { legId: 'market-001:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-13T10:00:00.000Z' },
      { legId: 'market-001:no', type: 'reject', occurredAt: '2026-07-13T10:00:01.000Z' },
    ],
  });
  assert.equal(completionSimulation.ok, true);

  const settlementRecord = loadSettlementRecord();
  const result = reconcileNonAtomicSettlementReplay({
    completeSet,
    completionSimulation: {
      completion: completionSimulation.value.completion,
    },
    stakeVector: solved.value,
    matrix: input.matrix,
    settlementRecords: [settlementRecord],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_MISSING',
      message: 'Settlement replay reconciliation requires residual exposure evidence for incomplete non-atomic groups.',
      evidenceRequired: 'Residual exposure output from the validated non-atomic completion simulation.',
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

function createTwoUnitSolvedInput(): StakeVectorInputContract {
  return {
    matrix: {
      rows: Object.freeze([
        Object.freeze({ scenarioId: 'yes_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 215n, feeMinor: 5n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'no_wins', legId: 'market-001:yes', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'yes_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 0n, feeMinor: 5n, costMinor: 0n }),
        Object.freeze({ scenarioId: 'no_wins', legId: 'market-001:no', stakeMinor: 100n, payoutMinor: 225n, feeMinor: 5n, costMinor: 0n }),
      ]),
    },
    capacityConstraints: Object.freeze([
      Object.freeze({ legId: 'market-001:yes', minStakeMinor: 200n, maxStakeMinor: 200n }),
      Object.freeze({ legId: 'market-001:no', minStakeMinor: 200n, maxStakeMinor: 200n }),
    ]),
    roundingConstraints: Object.freeze([
      Object.freeze({ legId: 'market-001:yes', stepMinor: 100n }),
      Object.freeze({ legId: 'market-001:no', stepMinor: 100n }),
    ]),
  };
}
