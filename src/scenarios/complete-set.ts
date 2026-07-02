import type {
  BettingWinIdentityRecord,
  BettingWinQuoteRecord,
  BettingWinResourceRecord,
  BettingWinRuleRecord,
  BettingWinSettlementRecord,
} from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type BoundaryResult, type CompleteSetLeg, type OutcomeSide } from '../contracts/local-types.js';
import { standardBinaryTerminalScenarios } from './terminal-scenario.js';

export interface StandardBinaryCompleteSet {
  readonly canonicalEventId: string;
  readonly canonicalMarketId: string;
  readonly providerGeneration: string;
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
  readonly legs: readonly CompleteSetLeg[];
  readonly quotesByOutcome: Readonly<Record<OutcomeSide, BettingWinQuoteRecord>>;
  readonly scenarioIds: readonly string[];
}

export interface StandardBinaryCompleteSetLegs {
  readonly legs: readonly CompleteSetLeg[];
  readonly scenarioIds: readonly string[];
}

export function assembleStandardBinaryCompleteSet(
  records: readonly BettingWinResourceRecord[],
): BoundaryResult<StandardBinaryCompleteSet> {
  const identityRecords = records.filter(isIdentityRecord);
  if (identityRecords.length !== 1) {
    return blocked(
      'COMPLETE_SET_IDENTITY_UNRESOLVED',
      'Standard-binary complete-set assembly requires exactly one canonical identity record.',
      'One local betting-win identity record for the candidate market.',
    );
  }

  const identity = identityRecords[0];
  if (!identity) {
    return blocked(
      'COMPLETE_SET_IDENTITY_UNRESOLVED',
      'Standard-binary complete-set assembly requires exactly one canonical identity record.',
      'One local betting-win identity record for the candidate market.',
    );
  }
  if (hasUnknownMarker(identity.providerGeneration)) {
    return blocked(
      'COMPLETE_SET_PROVIDER_GENERATION_UNKNOWN',
      'Standard-binary complete-set assembly rejects unknown provider generation.',
      'Resolved provider generation from a local betting-win identity record.',
    );
  }

  const ruleRecords = records.filter(isRuleOrSettlementRecord);
  for (const ruleRecord of ruleRecords) {
    if (ruleRecord.canonicalMarketId !== identity.canonicalMarketId) {
      return blocked(
        'COMPLETE_SET_MARKET_IDENTITY_MISMATCH',
        'Standard-binary complete-set assembly requires every rule and settlement record to match the canonical market identity.',
        'Canonical market identity aligned across local rules and settlement records.',
      );
    }
  }

  const primaryRuleRecord = ruleRecords.find(isRuleRecord);
  if (!primaryRuleRecord) {
    return blocked(
      'COMPLETE_SET_RULE_PROFILE_MISSING',
      'Standard-binary complete-set assembly requires a local rules record.',
      'Local rule profile, result source, and finality policy for the candidate market.',
    );
  }
  if (hasUnknownMarker(primaryRuleRecord.ruleProfileId)) {
    return blocked(
      'COMPLETE_SET_RULE_PROFILE_MISMATCH',
      'Standard-binary complete-set assembly rejects unknown rule profiles.',
      'Resolved local rule profile for the candidate market.',
    );
  }
  if (hasUnknownMarker(primaryRuleRecord.resultSourceId)) {
    return blocked(
      'COMPLETE_SET_RESULT_SOURCE_UNRESOLVED',
      'Standard-binary complete-set assembly requires a resolved result source.',
      'Resolved local result source for the candidate market.',
    );
  }
  if (hasUnknownMarker(primaryRuleRecord.finalityPolicyId)) {
    return blocked(
      'COMPLETE_SET_FINALITY_POLICY_UNRESOLVED',
      'Standard-binary complete-set assembly requires a resolved finality policy.',
      'Resolved local finality policy for the candidate market.',
    );
  }

  for (const ruleRecord of ruleRecords) {
    if (
      ruleRecord.ruleProfileId !== primaryRuleRecord.ruleProfileId ||
      ruleRecord.resultSourceId !== primaryRuleRecord.resultSourceId ||
      ruleRecord.finalityPolicyId !== primaryRuleRecord.finalityPolicyId
    ) {
      return blocked(
        'COMPLETE_SET_RULE_PROFILE_MISMATCH',
        'Standard-binary complete-set assembly requires matching rule profile, result source, and finality policy across local records.',
        'Consistent local rule/finality records for the candidate market.',
      );
    }
  }

  const quoteRecords = records.filter(isQuoteRecord);
  const quotesForMarket = quoteRecords.filter((quoteRecord) => quoteRecord.canonicalMarketId === identity.canonicalMarketId);
  if (quotesForMarket.length !== quoteRecords.length) {
    return blocked(
      'COMPLETE_SET_MARKET_IDENTITY_MISMATCH',
      'Standard-binary complete-set assembly requires every quote record to match the canonical market identity.',
      'Canonical market identity aligned across local quote records.',
    );
  }

  const quotesByOutcome = new Map<OutcomeSide, BettingWinQuoteRecord>();
  for (const quoteRecord of quotesForMarket) {
    if (quotesByOutcome.has(quoteRecord.outcome)) {
      return blocked(
        'COMPLETE_SET_DUPLICATE_OUTCOME',
        'Standard-binary complete-set assembly requires exactly one quote record per outcome.',
        'One local YES quote and one local NO quote for the candidate market.',
      );
    }
    quotesByOutcome.set(quoteRecord.outcome, quoteRecord);
  }

  const yesQuote = quotesByOutcome.get('yes');
  const noQuote = quotesByOutcome.get('no');
  if (!yesQuote || !noQuote) {
    return blocked(
      'COMPLETE_SET_INCOMPLETE',
      'Standard-binary complete-set assembly requires both YES and NO quote records.',
      'One local YES quote and one local NO quote for the candidate market.',
    );
  }

  const legs: readonly CompleteSetLeg[] = Object.freeze([
    createLeg(identity, primaryRuleRecord, 'yes'),
    createLeg(identity, primaryRuleRecord, 'no'),
  ]);
  const validated = validateStandardBinaryCompleteSet(legs);
  if (!validated.ok) {
    return validated;
  }

  return accepted(
    Object.freeze({
      canonicalEventId: identity.canonicalEventId,
      canonicalMarketId: identity.canonicalMarketId,
      providerGeneration: identity.providerGeneration,
      ruleProfileId: primaryRuleRecord.ruleProfileId,
      resultSourceId: primaryRuleRecord.resultSourceId,
      finalityPolicyId: primaryRuleRecord.finalityPolicyId,
      legs,
      quotesByOutcome: Object.freeze({
        yes: yesQuote,
        no: noQuote,
      }),
      scenarioIds: validated.value.scenarioIds,
    }),
  );
}

export function validateStandardBinaryCompleteSet(legs: readonly CompleteSetLeg[]): BoundaryResult<StandardBinaryCompleteSetLegs> {
  const outcomeSet = new Set(legs.map((leg) => leg.outcome));
  if (legs.length !== 2 || outcomeSet.size !== 2 || !outcomeSet.has('yes') || !outcomeSet.has('no')) {
    return blocked('NOT_STANDARD_BINARY_COMPLETE_SET', 'The first lane requires exactly one yes leg and one no leg.', 'Canonical yes/no complete-set legs.');
  }
  return accepted({
    legs: Object.freeze([...legs]),
    scenarioIds: standardBinaryTerminalScenarios().map((scenario) => scenario.scenarioId),
  });
}

function createLeg(identity: BettingWinIdentityRecord, rules: BettingWinRuleRecord, outcome: OutcomeSide): CompleteSetLeg {
  return Object.freeze({
    legId: `${identity.canonicalMarketId}:${outcome}`,
    outcome,
    market: Object.freeze({
      canonicalEventId: identity.canonicalEventId,
      canonicalMarketId: identity.canonicalMarketId,
      providerMarketId: identity.providerMarketId,
      providerGeneration: identity.providerGeneration,
    }),
    rules: Object.freeze({
      ruleProfileId: rules.ruleProfileId,
      resultSourceId: rules.resultSourceId,
      finalityPolicyId: rules.finalityPolicyId,
    }),
  });
}

function hasUnknownMarker(value: string): boolean {
  return value.trim().toLowerCase() === 'unknown';
}

function isIdentityRecord(record: BettingWinResourceRecord): record is BettingWinIdentityRecord {
  return record.recordType === 'identity';
}

function isRuleRecord(record: BettingWinResourceRecord): record is BettingWinRuleRecord {
  return record.recordType === 'rules';
}

function isSettlementRecord(record: BettingWinResourceRecord): record is BettingWinSettlementRecord {
  return record.recordType === 'settlement';
}

function isRuleOrSettlementRecord(record: BettingWinResourceRecord): record is BettingWinRuleRecord | BettingWinSettlementRecord {
  return isRuleRecord(record) || isSettlementRecord(record);
}

function isQuoteRecord(record: BettingWinResourceRecord): record is BettingWinQuoteRecord {
  return record.recordType === 'quotes';
}
