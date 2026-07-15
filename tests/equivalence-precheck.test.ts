import test from 'node:test';
import assert from 'node:assert/strict';
import { precheckCompleteSetEquivalence } from '../src/identity/equivalence-precheck.js';
import { sampleLeg } from './helpers.js';

test('equivalence precheck accepts canonical standard-binary legs and returns the terminal scenarios', () => {
  const result = precheckCompleteSetEquivalence([sampleLeg('yes'), sampleLeg('no')]);

  assert.equal(result.ok, true);
  assert.equal(result.value.legCount, 2);
  assert.equal(
    result.value.marketGroupKey,
    'event-001|market-001|generation-001|rules-001|result-source-001|finality-001|standard_binary_terminal_scenarios_v0',
  );
  assert.deepEqual(result.value.scenarioIds, ['yes_wins', 'no_wins']);
});

test('equivalence precheck rejects false-friend identity mismatches', () => {
  const noLeg = sampleLeg('no');
  const result = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      market: {
        ...noLeg.market,
        canonicalEventId: 'event-002',
      },
    },
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STANDARD_BINARY_FALSE_FRIEND_MISMATCH',
      message: 'Standard-binary equivalence rejects legs that do not share the same canonical event and market identity.',
      evidenceRequired: 'Canonical event and market identity aligned across the candidate legs.',
    },
  ]);
});

test('equivalence precheck rejects provider-generation, rule, and finality mismatches', () => {
  const noLeg = sampleLeg('no');

  const providerGeneration = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      market: {
        ...noLeg.market,
        providerGeneration: 'generation-002',
      },
    },
  ]);
  assert.equal(providerGeneration.ok, false);
  assert.equal(providerGeneration.blockers[0]?.code, 'STANDARD_BINARY_PROVIDER_GENERATION_MISMATCH');

  const rules = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      rules: {
        ...noLeg.rules,
        resultSourceId: 'result-source-002',
      },
    },
  ]);
  assert.equal(rules.ok, false);
  assert.equal(rules.blockers[0]?.code, 'STANDARD_BINARY_RULE_MISMATCH');

  const finality = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      rules: {
        ...noLeg.rules,
        finalityPolicyId: 'finality-002',
      },
    },
  ]);
  assert.equal(finality.ok, false);
  assert.equal(finality.blockers[0]?.code, 'STANDARD_BINARY_FINALITY_MISMATCH');
});

test('equivalence precheck rejects blank canonical identity, provider generation, rule, and finality fields', () => {
  const noLeg = sampleLeg('no');

  const canonicalIdentity = precheckCompleteSetEquivalence([
    {
      ...sampleLeg('yes'),
      market: {
        ...sampleLeg('yes').market,
        canonicalEventId: '   ',
      },
    },
    noLeg,
  ]);
  assert.equal(canonicalIdentity.ok, false);
  assert.equal(canonicalIdentity.blockers[0]?.code, 'MARKET_GROUP_IDENTITY_UNRESOLVED');

  const providerGeneration = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      market: {
        ...noLeg.market,
        providerGeneration: '   ',
      },
    },
  ]);
  assert.equal(providerGeneration.ok, false);
  assert.equal(providerGeneration.blockers[0]?.code, 'STANDARD_BINARY_PROVIDER_GENERATION_MISMATCH');

  const rules = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      rules: {
        ...noLeg.rules,
        ruleProfileId: '   ',
      },
    },
  ]);
  assert.equal(rules.ok, false);
  assert.equal(rules.blockers[0]?.code, 'STANDARD_BINARY_RULE_MISMATCH');

  const finality = precheckCompleteSetEquivalence([
    sampleLeg('yes'),
    {
      ...noLeg,
      rules: {
        ...noLeg.rules,
        finalityPolicyId: '   ',
      },
    },
  ]);
  assert.equal(finality.ok, false);
  assert.equal(finality.blockers[0]?.code, 'STANDARD_BINARY_FINALITY_MISMATCH');
});

test('equivalence precheck rejects incomplete terminal-scenario coverage', () => {
  const result = precheckCompleteSetEquivalence([sampleLeg('yes'), sampleLeg('yes')]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'STANDARD_BINARY_TERMINAL_SCENARIO_INCOMPLETE',
      message: 'Standard-binary equivalence requires explicit YES and NO terminal-scenario coverage.',
      evidenceRequired: 'Canonical YES and NO legs for the standard-binary terminal scenarios.',
    },
  ]);
});
