import type { CompleteSetLeg } from '../contracts/local-types.js';

export function buildMarketGroupKey(legs: readonly CompleteSetLeg[]): string {
  const encodedTuples = legs.map((leg) => JSON.stringify([
    leg.market.canonicalEventId,
    leg.market.canonicalMarketId,
    leg.market.providerGeneration,
    leg.rules.ruleProfileId,
    leg.rules.resultSourceId,
    leg.rules.finalityPolicyId,
    'standard_binary_terminal_scenarios_v0',
  ]));
  return `[${[...new Set(encodedTuples)].sort().join(',')}]`;
}
