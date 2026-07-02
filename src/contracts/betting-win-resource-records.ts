import {
  accepted,
  blocked,
  type BoundaryResult,
  type IsoTimestamp,
  type MarketIdentity,
  type OutcomeSide,
  type QuoteDepthEvidence,
  type RuleProfileSummary,
} from './local-types.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/i;
const MINOR_UNITS_REGEX = /^(0|[1-9][0-9]*)$/;

export const BETTING_WIN_RESOURCE_RECORD_TYPES = ['identity', 'rules', 'quotes', 'settlement'] as const;
const QUOTE_RECORD_CURRENCIES = ['USDC', 'USD', 'UNKNOWN'] as const;

export type BettingWinResourceRecordType = (typeof BETTING_WIN_RESOURCE_RECORD_TYPES)[number];
export type QuoteRecordCurrency = (typeof QUOTE_RECORD_CURRENCIES)[number];

export interface BettingWinIdentityRecord extends MarketIdentity {
  readonly recordType: 'identity';
}

export interface BettingWinRuleRecord extends RuleProfileSummary {
  readonly recordType: 'rules';
  readonly canonicalMarketId: string;
}

export interface BettingWinQuoteRecord {
  readonly recordType: 'quotes';
  readonly canonicalMarketId: string;
  readonly outcome: OutcomeSide;
  readonly quoteSourceManifestHash: string;
  readonly minStakeMinor: bigint;
  readonly feeMinor: bigint;
  readonly costMinor: bigint;
  readonly evidence: QuoteDepthEvidence;
}

export interface BettingWinSettlementRecord {
  readonly recordType: 'settlement';
  readonly canonicalMarketId: string;
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
  readonly finalityAuthorityId: string;
  readonly replayManifestHash: string;
  readonly replayAcceptedAt: IsoTimestamp;
  readonly acceptanceStatus: 'accepted';
  readonly finalOutcome: OutcomeSide;
}

export type BettingWinResourceRecord =
  | BettingWinIdentityRecord
  | BettingWinRuleRecord
  | BettingWinQuoteRecord
  | BettingWinSettlementRecord;

export function parseBettingWinResourceRecord(value: unknown): BoundaryResult<BettingWinResourceRecord> {
  if (typeof value !== 'object' || value === null) {
    return blocked(
      'RESOURCE_RECORD_NOT_OBJECT',
      'Local betting-win resource records must be JSON objects.',
      'Local betting-win fixture records.',
    );
  }

  const candidate = value as Record<string, unknown>;
  if (!isResourceRecordType(candidate.recordType)) {
    return blocked(
      'RESOURCE_RECORD_TYPE_INVALID',
      'Local betting-win resource records must declare a supported recordType.',
      'Supported local recordType in fixture records.',
    );
  }

  switch (candidate.recordType) {
    case 'identity':
      return parseIdentityRecord(candidate);
    case 'rules':
      return parseRuleRecord(candidate);
    case 'quotes':
      return parseQuoteRecord(candidate);
    case 'settlement':
      return parseSettlementRecord(candidate);
  }
}

export function parseBettingWinResourceRecords(value: unknown): BoundaryResult<readonly BettingWinResourceRecord[]> {
  if (!Array.isArray(value)) {
    return blocked(
      'RESOURCE_RECORDS_NOT_ARRAY',
      'Local betting-win resource records must be provided as an array.',
      'Local betting-win fixture record array.',
    );
  }

  const parsedRecords: BettingWinResourceRecord[] = [];
  for (const record of value) {
    const parsed = parseBettingWinResourceRecord(record);
    if (!parsed.ok) {
      return parsed;
    }
    parsedRecords.push(parsed.value);
  }

  return accepted(Object.freeze(parsedRecords));
}

function parseIdentityRecord(candidate: Record<string, unknown>): BoundaryResult<BettingWinIdentityRecord> {
  const canonicalEventId = requireNonEmptyString(
    candidate.canonicalEventId,
    'IDENTITY_RECORD_EVENT_ID_MISSING',
    'Identity record canonicalEventId is required.',
    'Canonical event identity from a local betting-win fixture.',
  );
  if (!canonicalEventId.ok) {
    return canonicalEventId;
  }

  const canonicalMarketId = requireNonEmptyString(
    candidate.canonicalMarketId,
    'IDENTITY_RECORD_MARKET_ID_MISSING',
    'Identity record canonicalMarketId is required.',
    'Canonical market identity from a local betting-win fixture.',
  );
  if (!canonicalMarketId.ok) {
    return canonicalMarketId;
  }

  const providerMarketId = requireNonEmptyString(
    candidate.providerMarketId,
    'IDENTITY_RECORD_PROVIDER_MARKET_ID_MISSING',
    'Identity record providerMarketId is required.',
    'Provider market identity from a local betting-win fixture.',
  );
  if (!providerMarketId.ok) {
    return providerMarketId;
  }

  const providerGeneration = requireNonEmptyString(
    candidate.providerGeneration,
    'IDENTITY_RECORD_PROVIDER_GENERATION_MISSING',
    'Identity record providerGeneration is required.',
    'Provider generation from a local betting-win fixture.',
  );
  if (!providerGeneration.ok) {
    return providerGeneration;
  }

  return accepted(
    Object.freeze({
      recordType: 'identity',
      canonicalEventId: canonicalEventId.value,
      canonicalMarketId: canonicalMarketId.value,
      providerMarketId: providerMarketId.value,
      providerGeneration: providerGeneration.value,
    }),
  );
}

function parseRuleRecord(candidate: Record<string, unknown>): BoundaryResult<BettingWinRuleRecord> {
  const canonicalMarketId = requireNonEmptyString(
    candidate.canonicalMarketId,
    'RULE_RECORD_MARKET_ID_MISSING',
    'Rule record canonicalMarketId is required.',
    'Canonical market identity from a local betting-win fixture.',
  );
  if (!canonicalMarketId.ok) {
    return canonicalMarketId;
  }

  const ruleProfileId = requireNonEmptyString(
    candidate.ruleProfileId,
    'RULE_RECORD_PROFILE_ID_MISSING',
    'Rule record ruleProfileId is required.',
    'Rule profile id from a local betting-win fixture.',
  );
  if (!ruleProfileId.ok) {
    return ruleProfileId;
  }

  const resultSourceId = requireNonEmptyString(
    candidate.resultSourceId,
    'RULE_RECORD_RESULT_SOURCE_ID_MISSING',
    'Rule record resultSourceId is required.',
    'Result source id from a local betting-win fixture.',
  );
  if (!resultSourceId.ok) {
    return resultSourceId;
  }

  const finalityPolicyId = requireNonEmptyString(
    candidate.finalityPolicyId,
    'RULE_RECORD_FINALITY_POLICY_ID_MISSING',
    'Rule record finalityPolicyId is required.',
    'Finality policy id from a local betting-win fixture.',
  );
  if (!finalityPolicyId.ok) {
    return finalityPolicyId;
  }

  return accepted(
    Object.freeze({
      recordType: 'rules',
      canonicalMarketId: canonicalMarketId.value,
      ruleProfileId: ruleProfileId.value,
      resultSourceId: resultSourceId.value,
      finalityPolicyId: finalityPolicyId.value,
    }),
  );
}

function parseQuoteRecord(candidate: Record<string, unknown>): BoundaryResult<BettingWinQuoteRecord> {
  const canonicalMarketId = requireNonEmptyString(
    candidate.canonicalMarketId,
    'QUOTE_RECORD_MARKET_ID_MISSING',
    'Quote record canonicalMarketId is required.',
    'Canonical market identity from a local betting-win fixture.',
  );
  if (!canonicalMarketId.ok) {
    return canonicalMarketId;
  }

  const outcome = requireOutcomeSide(
    candidate.outcome,
    'QUOTE_RECORD_OUTCOME_INVALID',
    'Quote record outcome must be yes or no.',
    'Outcome-specific local quote record.',
  );
  if (!outcome.ok) {
    return outcome;
  }

  const quoteSourceManifestHash = requireManifestHash(
    candidate.quoteSourceManifestHash,
    'QUOTE_RECORD_MANIFEST_HASH_INVALID',
    'Quote record quoteSourceManifestHash must be 64 hexadecimal characters.',
    'Local quote source manifest hash.',
  );
  if (!quoteSourceManifestHash.ok) {
    return quoteSourceManifestHash;
  }

  const evidenceId = requireNonEmptyString(
    candidate.evidenceId,
    'QUOTE_RECORD_EVIDENCE_ID_MISSING',
    'Quote record evidenceId is required.',
    'Local quote evidence id.',
  );
  if (!evidenceId.ok) {
    return evidenceId;
  }

  const observedAt = requireIsoTimestamp(
    candidate.observedAt,
    'QUOTE_RECORD_TIMESTAMP_INVALID',
    'Quote record observedAt must be an ISO-8601 UTC timestamp.',
    'Local quote timestamp.',
  );
  if (!observedAt.ok) {
    return observedAt;
  }

  const priceMinor = requireMinorUnits(
    candidate.priceMinor,
    'QUOTE_RECORD_PRICE_INVALID',
    'Quote record priceMinor must be a non-negative integer string or bigint.',
    'Local quote price minor units.',
  );
  if (!priceMinor.ok) {
    return priceMinor;
  }

  const availableSizeMinor = requireMinorUnits(
    candidate.availableSizeMinor,
    'QUOTE_RECORD_CAPACITY_INVALID',
    'Quote record availableSizeMinor must be a non-negative integer string or bigint.',
    'Local quote available size minor units.',
  );
  if (!availableSizeMinor.ok) {
    return availableSizeMinor;
  }

  const minStakeMinor = requireMinorUnits(
    candidate.minStakeMinor,
    'QUOTE_RECORD_MIN_STAKE_INVALID',
    'Quote record minStakeMinor must be a non-negative integer string or bigint.',
    'Local quote minimum stake minor units.',
  );
  if (!minStakeMinor.ok) {
    return minStakeMinor;
  }

  const feeMinor = requireMinorUnits(
    candidate.feeMinor,
    'QUOTE_RECORD_FEE_INVALID',
    'Quote record feeMinor must be a non-negative integer string or bigint.',
    'Local quote fee minor units.',
  );
  if (!feeMinor.ok) {
    return feeMinor;
  }

  const costMinor = requireMinorUnits(
    candidate.costMinor,
    'QUOTE_RECORD_COST_INVALID',
    'Quote record costMinor must be a non-negative integer string or bigint.',
    'Local quote cost minor units.',
  );
  if (!costMinor.ok) {
    return costMinor;
  }

  const currency = requireQuoteCurrency(
    candidate.currency,
    'QUOTE_RECORD_CURRENCY_INVALID',
    'Quote record currency must be a supported local quote currency.',
    'Local quote currency.',
  );
  if (!currency.ok) {
    return currency;
  }

  return accepted(
    Object.freeze({
      recordType: 'quotes',
      canonicalMarketId: canonicalMarketId.value,
      outcome: outcome.value,
      quoteSourceManifestHash: quoteSourceManifestHash.value,
      minStakeMinor: minStakeMinor.value,
      feeMinor: feeMinor.value,
      costMinor: costMinor.value,
      evidence: Object.freeze({
        evidenceId: evidenceId.value,
        observedAt: observedAt.value,
        priceMinor: priceMinor.value,
        availableSizeMinor: availableSizeMinor.value,
        currency: currency.value,
      }),
    }),
  );
}

function parseSettlementRecord(candidate: Record<string, unknown>): BoundaryResult<BettingWinSettlementRecord> {
  const canonicalMarketId = requireNonEmptyString(
    candidate.canonicalMarketId,
    'SETTLEMENT_RECORD_MARKET_ID_MISSING',
    'Settlement record canonicalMarketId is required.',
    'Canonical market identity from a local betting-win fixture.',
  );
  if (!canonicalMarketId.ok) {
    return canonicalMarketId;
  }

  const ruleProfileId = requireNonEmptyString(
    candidate.ruleProfileId,
    'SETTLEMENT_RECORD_RULE_PROFILE_ID_MISSING',
    'Settlement record ruleProfileId is required.',
    'Rule profile id from a local betting-win fixture.',
  );
  if (!ruleProfileId.ok) {
    return ruleProfileId;
  }

  const resultSourceId = requireNonEmptyString(
    candidate.resultSourceId,
    'SETTLEMENT_RECORD_RESULT_SOURCE_ID_MISSING',
    'Settlement record resultSourceId is required.',
    'Result source id from a local betting-win fixture.',
  );
  if (!resultSourceId.ok) {
    return resultSourceId;
  }

  const finalityPolicyId = requireNonEmptyString(
    candidate.finalityPolicyId,
    'SETTLEMENT_RECORD_FINALITY_POLICY_ID_MISSING',
    'Settlement record finalityPolicyId is required.',
    'Finality policy id from a local betting-win fixture.',
  );
  if (!finalityPolicyId.ok) {
    return finalityPolicyId;
  }

  const finalityAuthorityId = requireNonEmptyString(
    candidate.finalityAuthorityId,
    'SETTLEMENT_RECORD_FINALITY_AUTHORITY_ID_MISSING',
    'Settlement record finalityAuthorityId is required.',
    'Finality authority id from a local betting-win fixture.',
  );
  if (!finalityAuthorityId.ok) {
    return finalityAuthorityId;
  }

  const replayManifestHash = requireManifestHash(
    candidate.replayManifestHash,
    'SETTLEMENT_RECORD_MANIFEST_HASH_INVALID',
    'Settlement record replayManifestHash must be 64 hexadecimal characters.',
    'Local settlement replay manifest hash.',
  );
  if (!replayManifestHash.ok) {
    return replayManifestHash;
  }

  const replayAcceptedAt = requireIsoTimestamp(
    candidate.replayAcceptedAt,
    'SETTLEMENT_RECORD_ACCEPTED_AT_INVALID',
    'Settlement record replayAcceptedAt must be an ISO-8601 UTC timestamp.',
    'Local settlement replay acceptance timestamp.',
  );
  if (!replayAcceptedAt.ok) {
    return replayAcceptedAt;
  }

  if (candidate.acceptanceStatus !== 'accepted') {
    return blocked(
      'SETTLEMENT_RECORD_ACCEPTANCE_STATUS_INVALID',
      'Settlement record acceptanceStatus must be accepted.',
      'Accepted local settlement replay fixture.',
    );
  }

  const finalOutcome = requireOutcomeSide(
    candidate.finalOutcome,
    'SETTLEMENT_RECORD_OUTCOME_INVALID',
    'Settlement record finalOutcome must be yes or no.',
    'Accepted local settlement replay outcome.',
  );
  if (!finalOutcome.ok) {
    return finalOutcome;
  }

  return accepted(
    Object.freeze({
      recordType: 'settlement',
      canonicalMarketId: canonicalMarketId.value,
      ruleProfileId: ruleProfileId.value,
      resultSourceId: resultSourceId.value,
      finalityPolicyId: finalityPolicyId.value,
      finalityAuthorityId: finalityAuthorityId.value,
      replayManifestHash: replayManifestHash.value,
      replayAcceptedAt: replayAcceptedAt.value,
      acceptanceStatus: 'accepted',
      finalOutcome: finalOutcome.value,
    }),
  );
}

function isResourceRecordType(value: unknown): value is BettingWinResourceRecordType {
  return typeof value === 'string' && BETTING_WIN_RESOURCE_RECORD_TYPES.includes(value as BettingWinResourceRecordType);
}

function requireNonEmptyString(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireManifestHash(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || !MANIFEST_HASH_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireIsoTimestamp(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<IsoTimestamp> {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireOutcomeSide(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<OutcomeSide> {
  if (value !== 'yes' && value !== 'no') {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireMinorUnits(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<bigint> {
  if (typeof value === 'bigint') {
    if (value < 0n) {
      return blocked(code, message, evidenceRequired);
    }
    return accepted(value);
  }
  if (typeof value !== 'string' || !MINOR_UNITS_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(BigInt(value));
}

function requireQuoteCurrency(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<QuoteDepthEvidence['currency']> {
  if (typeof value !== 'string' || !QUOTE_RECORD_CURRENCIES.includes(value as QuoteRecordCurrency)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value as QuoteDepthEvidence['currency']);
}
