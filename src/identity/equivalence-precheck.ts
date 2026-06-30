import { accepted, blocked, type BoundaryResult, type CompleteSetLeg } from '../contracts/local-types.js';
import { buildMarketGroupKey } from './market-group-key.js';

export interface EquivalencePrecheck {
  readonly marketGroupKey: string;
  readonly legCount: number;
}

export function precheckCompleteSetEquivalence(legs: readonly CompleteSetLeg[]): BoundaryResult<EquivalencePrecheck> {
  if (legs.length !== 2) {
    return blocked('STANDARD_BINARY_REQUIRES_TWO_LEGS', 'The first lane requires exactly yes and no legs.', 'Two canonical legs.');
  }
  const outcomes = new Set(legs.map((leg) => leg.outcome));
  if (!outcomes.has('yes') || !outcomes.has('no')) {
    return blocked('STANDARD_BINARY_OUTCOMES_MISSING', 'The first lane requires yes/no outcome coverage.', 'Canonical yes/no legs.');
  }
  const groupKey = buildMarketGroupKey(legs);
  if (groupKey.length === 0 || groupKey.includes('unknown')) {
    return blocked('MARKET_GROUP_IDENTITY_UNRESOLVED', 'Market identity must be canonical and generation-resolved.', 'betting-win canonical identity.');
  }
  return accepted({ marketGroupKey: groupKey, legCount: legs.length });
}
