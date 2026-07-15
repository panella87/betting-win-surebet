import { accepted, blocked, type BoundaryResult, type CompleteSetLeg } from '../contracts/local-types.js';
import { standardBinaryTerminalScenarios } from '../scenarios/terminal-scenario.js';
import { buildMarketGroupKey } from './market-group-key.js';

export interface EquivalencePrecheck {
  readonly marketGroupKey: string;
  readonly legCount: number;
  readonly scenarioIds: readonly string[];
}

export function precheckCompleteSetEquivalence(legs: readonly CompleteSetLeg[]): BoundaryResult<EquivalencePrecheck> {
  if (legs.length !== 2) {
    return blocked('STANDARD_BINARY_REQUIRES_TWO_LEGS', 'The first lane requires exactly yes and no legs.', 'Two canonical legs.');
  }

  const outcomes = new Set(legs.map((leg) => leg.outcome));
  if (!outcomes.has('yes') || !outcomes.has('no')) {
    return blocked(
      'STANDARD_BINARY_TERMINAL_SCENARIO_INCOMPLETE',
      'Standard-binary equivalence requires explicit YES and NO terminal-scenario coverage.',
      'Canonical YES and NO legs for the standard-binary terminal scenarios.',
    );
  }

  const primaryLeg = legs[0];
  if (!primaryLeg) {
    return blocked('STANDARD_BINARY_REQUIRES_TWO_LEGS', 'The first lane requires exactly yes and no legs.', 'Two canonical legs.');
  }

  if (hasBlankValue(primaryLeg.market.canonicalEventId) || hasBlankValue(primaryLeg.market.canonicalMarketId)) {
    return blocked(
      'MARKET_GROUP_IDENTITY_UNRESOLVED',
      'Standard-binary equivalence requires a resolved canonical event id and canonical market id for every candidate leg.',
      'Resolved betting-win canonical event and market identity for every candidate leg.',
    );
  }

  if (hasBlankValue(primaryLeg.market.providerGeneration) || hasUnknownMarker(primaryLeg.market.providerGeneration)) {
    return blocked(
      'STANDARD_BINARY_PROVIDER_GENERATION_MISMATCH',
      'Standard-binary equivalence requires resolved provider generation for every candidate leg.',
      'Resolved provider generation aligned across the candidate legs.',
    );
  }

  if (
    hasBlankValue(primaryLeg.rules.ruleProfileId)
    || hasBlankValue(primaryLeg.rules.resultSourceId)
    || hasUnknownMarker(primaryLeg.rules.ruleProfileId)
    || hasUnknownMarker(primaryLeg.rules.resultSourceId)
  ) {
    return blocked(
      'STANDARD_BINARY_RULE_MISMATCH',
      'Standard-binary equivalence requires a resolved rule profile and result source for every candidate leg.',
      'Resolved rule profile and result source aligned across the candidate legs.',
    );
  }

  if (hasBlankValue(primaryLeg.rules.finalityPolicyId) || hasUnknownMarker(primaryLeg.rules.finalityPolicyId)) {
    return blocked(
      'STANDARD_BINARY_FINALITY_MISMATCH',
      'Standard-binary equivalence requires a resolved finality policy for every candidate leg.',
      'Resolved finality policy aligned across the candidate legs.',
    );
  }

  for (const leg of legs.slice(1)) {
    if (
      hasBlankValue(leg.market.canonicalEventId)
      || hasBlankValue(leg.market.canonicalMarketId)
    ) {
      return blocked(
        'MARKET_GROUP_IDENTITY_UNRESOLVED',
        'Standard-binary equivalence requires a resolved canonical event id and canonical market id for every candidate leg.',
        'Resolved betting-win canonical event and market identity for every candidate leg.',
      );
    }

    if (
      leg.market.canonicalEventId !== primaryLeg.market.canonicalEventId
      || leg.market.canonicalMarketId !== primaryLeg.market.canonicalMarketId
    ) {
      return blocked(
        'STANDARD_BINARY_FALSE_FRIEND_MISMATCH',
        'Standard-binary equivalence rejects legs that do not share the same canonical event and market identity.',
        'Canonical event and market identity aligned across the candidate legs.',
      );
    }

    if (
      hasBlankValue(leg.market.providerGeneration)
      || hasUnknownMarker(leg.market.providerGeneration)
      || leg.market.providerGeneration !== primaryLeg.market.providerGeneration
    ) {
      return blocked(
        'STANDARD_BINARY_PROVIDER_GENERATION_MISMATCH',
        'Standard-binary equivalence requires the same resolved provider generation across the candidate legs.',
        'Resolved provider generation aligned across the candidate legs.',
      );
    }

    if (
      hasBlankValue(leg.rules.ruleProfileId)
      || hasBlankValue(leg.rules.resultSourceId)
      || hasUnknownMarker(leg.rules.ruleProfileId)
      || hasUnknownMarker(leg.rules.resultSourceId)
      || leg.rules.ruleProfileId !== primaryLeg.rules.ruleProfileId
      || leg.rules.resultSourceId !== primaryLeg.rules.resultSourceId
    ) {
      return blocked(
        'STANDARD_BINARY_RULE_MISMATCH',
        'Standard-binary equivalence requires matching rule profile and result source across the candidate legs.',
        'Resolved rule profile and result source aligned across the candidate legs.',
      );
    }

    if (
      hasBlankValue(leg.rules.finalityPolicyId)
      || hasUnknownMarker(leg.rules.finalityPolicyId)
      || leg.rules.finalityPolicyId !== primaryLeg.rules.finalityPolicyId
    ) {
      return blocked(
        'STANDARD_BINARY_FINALITY_MISMATCH',
        'Standard-binary equivalence requires matching finality policy across the candidate legs.',
        'Resolved finality policy aligned across the candidate legs.',
      );
    }
  }

  const groupKey = buildMarketGroupKey(legs);
  if (groupKey.length === 0 || groupKey.includes('unknown')) {
    return blocked(
      'MARKET_GROUP_IDENTITY_UNRESOLVED',
      'Market identity must be canonical, generation-resolved, rule-aligned, and finality-aligned.',
      'betting-win canonical identity, rule, and finality references.',
    );
  }
  return accepted({
    marketGroupKey: groupKey,
    legCount: legs.length,
    scenarioIds: standardBinaryTerminalScenarios().map((scenario) => scenario.scenarioId),
  });
}

function hasUnknownMarker(value: string): boolean {
  return value.trim().toLowerCase() === 'unknown';
}

function hasBlankValue(value: string): boolean {
  return value.trim().length === 0;
}
