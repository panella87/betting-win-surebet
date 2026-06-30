import type { CompleteSetLeg } from '../src/contracts/local-types.js';

export function sampleLeg(outcome: 'yes' | 'no'): CompleteSetLeg {
  return {
    legId: `leg-${outcome}`,
    outcome,
    market: {
      canonicalEventId: 'event-001',
      canonicalMarketId: 'market-001',
      providerMarketId: `provider-market-${outcome}`,
      providerGeneration: 'generation-001',
    },
    rules: {
      ruleProfileId: 'rules-001',
      resultSourceId: 'result-source-001',
      finalityPolicyId: 'finality-001',
    },
  };
}
