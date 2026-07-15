import type { CompleteSetLeg } from '../contracts/local-types.js';

function cleanPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.:-]+/g, '_');
}

export function buildMarketGroupKey(legs: readonly CompleteSetLeg[]): string {
  const parts = legs.map((leg) => [
    leg.market.canonicalEventId,
    leg.market.canonicalMarketId,
    leg.market.providerGeneration,
    leg.rules.ruleProfileId,
    leg.rules.resultSourceId,
    leg.rules.finalityPolicyId,
    'standard_binary_terminal_scenarios_v0',
  ].map(cleanPart).join('|'));
  return [...new Set(parts)].sort().join('::');
}
