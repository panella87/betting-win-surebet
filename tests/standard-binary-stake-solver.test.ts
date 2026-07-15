import test from 'node:test';
import assert from 'node:assert/strict';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { parseBettingWinResourceRecords, type BettingWinQuoteRecord } from '../src/contracts/betting-win-resource-records.js';
import { deriveStandardBinaryOpportunityCandidates } from '../src/opportunity/standard-binary-derivation.js';
import { solveStandardBinaryCompleteSetStakeVector } from '../src/opportunity/standard-binary-stake-solver.js';
import type { StandardBinaryCompleteSet } from '../src/scenarios/complete-set.js';

const REPO_ROOT = process.cwd();
const ACCEPTED_LOCAL_BUNDLE = 'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json';

test('standard-binary complete-set stake solving integrates quote freshness, capacity, rounding, and fixed-point payout terms', () => {
  const completeSet = loadAcceptedCompleteSet();
  const result = solveStandardBinaryCompleteSetStakeVector(completeSet, {
    observedNowMs: Date.parse('2026-07-01T00:00:03.000Z'),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.stakes, [
    { legId: 'market-002:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n },
    { legId: 'market-002:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n },
  ]);
  assert.deepEqual(result.value.scenarioNets, [
    { scenarioId: 'no_wins', netMinor: 15n },
    { scenarioId: 'yes_wins', netMinor: 5n },
  ]);
});

test('standard-binary complete-set stake solving fails closed on stale quote evidence', () => {
  const completeSet = loadAcceptedCompleteSet();
  const result = solveStandardBinaryCompleteSetStakeVector(completeSet, {
    observedNowMs: Date.parse('2026-07-01T00:02:03.000Z'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'QUOTE_EVIDENCE_STALE',
      message: 'Quote evidence is outside the accepted freshness window.',
      evidenceRequired: 'Fresh betting-win quote/depth evidence.',
    },
  ]);
});

test('standard-binary complete-set stake solving fails closed on retained depth below the minimum stake', () => {
  const completeSet = mutateQuote(loadAcceptedCompleteSet(), 'yes', {
    evidence: {
      availableSizeMinor: 99n,
    },
  });
  const result = solveStandardBinaryCompleteSetStakeVector(completeSet, {
    observedNowMs: Date.parse('2026-07-01T00:00:03.000Z'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'CAPACITY_EVIDENCE_BELOW_MIN_STAKE',
      message: 'Retained quote/depth capacity must cover the minimum stake for each complete-set leg.',
      evidenceRequired: 'betting-win quote/depth evidence with available size at or above the local minimum stake.',
    },
  ]);
});

function loadAcceptedCompleteSet(): StandardBinaryCompleteSet {
  const bundle = readLocalBettingWinExportBundle(ACCEPTED_LOCAL_BUNDLE, REPO_ROOT);
  assert.equal(bundle.ok, true);

  const parsedRecords = parseBettingWinResourceRecords(bundle.value.records);
  assert.equal(parsedRecords.ok, true);

  const candidates = deriveStandardBinaryOpportunityCandidates(parsedRecords.value);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.ok, true);
  return candidates[0].completeSet;
}

function mutateQuote(
  completeSet: StandardBinaryCompleteSet,
  outcome: keyof StandardBinaryCompleteSet['quotesByOutcome'],
  overrides: {
    readonly minStakeMinor?: bigint;
    readonly evidence?: Partial<BettingWinQuoteRecord['evidence']>;
  },
): StandardBinaryCompleteSet {
  const currentQuote = completeSet.quotesByOutcome[outcome];
  const mutatedQuote = Object.freeze({
    ...currentQuote,
    minStakeMinor: overrides.minStakeMinor ?? currentQuote.minStakeMinor,
    evidence: Object.freeze({
      ...currentQuote.evidence,
      ...overrides.evidence,
    }),
  });

  return Object.freeze({
    ...completeSet,
    quotesByOutcome: Object.freeze({
      ...completeSet.quotesByOutcome,
      [outcome]: mutatedQuote,
    }),
  });
}
