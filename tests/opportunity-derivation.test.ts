import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import {
  parseBettingWinResourceRecords,
  type BettingWinResourceRecord,
} from '../src/contracts/betting-win-resource-records.js';
import { deriveStandardBinaryOpportunityCandidates } from '../src/opportunity/standard-binary-derivation.js';

const REPO_ROOT = process.cwd();

test('standard-binary opportunity derivation groups candidates deterministically across bundle record order', () => {
  const records = loadBundleRecords('tests/fixtures/private-paper-mode-smoke/multi-candidate-bundle.json');

  const first = summarizeCandidates(deriveStandardBinaryOpportunityCandidates(records));
  const second = summarizeCandidates(deriveStandardBinaryOpportunityCandidates([...records].reverse()));

  assert.deepEqual(first, second);
  assert.deepEqual(first, [
    {
      ok: true,
      candidateId: 'market-002',
      canonicalMarketId: 'market-002',
      blockerCodes: [],
      marketGroupKey:
        'event-002|market-002|generation-002|rules-002|result-source-002|finality-002|standard_binary_terminal_scenarios_v0',
      quoteOutcomes: ['no', 'yes'],
    },
    {
      ok: true,
      candidateId: 'market-003',
      canonicalMarketId: 'market-003',
      blockerCodes: [],
      marketGroupKey:
        'event-003|market-003|generation-003|rules-003|result-source-003|finality-003|standard_binary_terminal_scenarios_v0',
      quoteOutcomes: ['no', 'yes'],
    },
  ]);
});

test('standard-binary opportunity derivation preserves incomplete complete-set blockers', () => {
  const records = loadBundleRecords('tests/fixtures/local-only-export-bundles/valid-resource-records-export.json');
  const candidates = deriveStandardBinaryOpportunityCandidates(records);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.ok, false);
  assert.deepEqual(candidates[0]?.blockers, [
    {
      code: 'COMPLETE_SET_INCOMPLETE',
      message: 'Standard-binary complete-set assembly requires both YES and NO quote records.',
      evidenceRequired: 'One local YES quote and one local NO quote for the candidate market.',
    },
  ]);
});

test('standard-binary opportunity derivation rejects reciprocal-odds shortcuts across false-friend markets', () => {
  const candidates = deriveStandardBinaryOpportunityCandidates([
    {
      recordType: 'identity',
      canonicalEventId: 'event-010',
      canonicalMarketId: 'market-010',
      providerMarketId: 'provider-market-010',
      providerGeneration: 'generation-010',
    },
    {
      recordType: 'rules',
      canonicalMarketId: 'market-010',
      ruleProfileId: 'rules-010',
      resultSourceId: 'result-source-010',
      finalityPolicyId: 'finality-010',
    },
    {
      recordType: 'quotes',
      canonicalMarketId: 'market-010',
      outcome: 'yes',
      quoteSourceManifestHash: 'a'.repeat(64),
      minStakeMinor: 100n,
      feeMinor: 0n,
      costMinor: 0n,
      evidence: {
        evidenceId: 'quote-010-yes',
        observedAt: '2026-07-01T00:00:01.000Z',
        priceMinor: 300000n,
        availableSizeMinor: 1000n,
        currency: 'USDC',
      },
    },
    {
      recordType: 'identity',
      canonicalEventId: 'event-011',
      canonicalMarketId: 'market-011',
      providerMarketId: 'provider-market-011',
      providerGeneration: 'generation-011',
    },
    {
      recordType: 'rules',
      canonicalMarketId: 'market-011',
      ruleProfileId: 'rules-011',
      resultSourceId: 'result-source-011',
      finalityPolicyId: 'finality-011',
    },
    {
      recordType: 'quotes',
      canonicalMarketId: 'market-011',
      outcome: 'no',
      quoteSourceManifestHash: 'b'.repeat(64),
      minStakeMinor: 100n,
      feeMinor: 0n,
      costMinor: 0n,
      evidence: {
        evidenceId: 'quote-011-no',
        observedAt: '2026-07-01T00:00:02.000Z',
        priceMinor: 400000n,
        availableSizeMinor: 1000n,
        currency: 'USDC',
      },
    },
  ]);

  assert.deepEqual(summarizeCandidates(candidates), [
    {
      ok: false,
      candidateId: 'market-010',
      canonicalMarketId: 'market-010',
      blockerCodes: ['COMPLETE_SET_INCOMPLETE'],
      marketGroupKey: undefined,
      quoteOutcomes: [],
    },
    {
      ok: false,
      candidateId: 'market-011',
      canonicalMarketId: 'market-011',
      blockerCodes: ['COMPLETE_SET_INCOMPLETE'],
      marketGroupKey: undefined,
      quoteOutcomes: [],
    },
  ]);
});

function loadBundleRecords(bundlePath: string): readonly BettingWinResourceRecord[] {
  const bundle = readLocalBettingWinExportBundle(bundlePath, REPO_ROOT);
  assert.equal(bundle.ok, true);

  const parsedRecords = parseBettingWinResourceRecords(bundle.value.records);
  assert.equal(parsedRecords.ok, true);
  return parsedRecords.value;
}

function summarizeCandidates(
  candidates: ReturnType<typeof deriveStandardBinaryOpportunityCandidates>,
): readonly {
  readonly ok: boolean;
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly blockerCodes: readonly string[];
  readonly marketGroupKey: string | undefined;
  readonly quoteOutcomes: readonly string[];
}[] {
  return candidates.map((candidate) => candidate.ok
    ? {
        ok: true,
        candidateId: candidate.candidateId,
        canonicalMarketId: candidate.canonicalMarketId,
        blockerCodes: Object.freeze([]),
        marketGroupKey: candidate.marketGroupKey,
        quoteOutcomes: Object.freeze(candidate.completeSet.legs.map((leg) => leg.outcome).sort()),
      }
    : {
        ok: false,
        candidateId: candidate.candidateId,
        canonicalMarketId: candidate.canonicalMarketId,
        blockerCodes: Object.freeze(candidate.blockers.map((blocker) => blocker.code)),
        marketGroupKey: undefined,
        quoteOutcomes: Object.freeze([]),
      });
}
