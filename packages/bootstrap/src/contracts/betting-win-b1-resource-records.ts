import {
  accepted,
  blocked,
  type BoundaryResult,
} from './local-types.js';
import {
  B1_LOCAL_FIXTURE_KIND,
  B1_MULTI_VENUE_MARKETS_ALIAS,
  B1_MULTI_VENUE_MARKETS_SCHEMA,
  B1_UPSTREAM_READINESS_BLOCKER,
  type B1Currency,
  type B1DeterministicFixture,
  type B1IsoTimestamp,
  type B1MultiVenueManifest,
  type B1MultiVenueMarketRow,
  type B1SettlementCompatibilityFlag,
  type B1VenueType,
} from './b1-local-types.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/;
const MINOR_UNITS_REGEX = /^(0|[1-9][0-9]*)$/;
const DECIMAL_STRING_REGEX = /^(0|[1-9][0-9]*)(\.[0-9]+)?$/;
const COMMIT_SHA_REGEX = /^[0-9a-f]{40}$/;
const B1_CURRENCIES = ['USD', 'USDC'] as const;
const B1_VENUE_TYPES = ['sportsbook', 'exchange', 'prediction_market'] as const;
const B1_SETTLEMENT_COMPATIBILITY_FLAGS = ['compatible', 'incompatible'] as const;

export function parseBettingWinB1DeterministicFixture(value: unknown): BoundaryResult<B1DeterministicFixture> {
  if (typeof value !== 'object' || value === null) {
    return blocked(
      'B1_FIXTURE_NOT_OBJECT',
      'B1 deterministic fixture must be a JSON object.',
      'Repo-local deterministic B1 fixture wrapper.',
    );
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.fixtureKind !== B1_LOCAL_FIXTURE_KIND) {
    return blocked(
      'B1_FIXTURE_KIND_INVALID',
      'B1 deterministic fixture must declare the local fixture kind.',
      'Fixture kind proving this is not upstream runtime evidence.',
    );
  }
  if (candidate.runtimeEvidence !== false) {
    return blocked(
      'B1_FIXTURE_RUNTIME_EVIDENCE_FORBIDDEN',
      'B1 deterministic fixtures must explicitly declare runtimeEvidence as false.',
      'A local fixture that cannot satisfy upstream runtime evidence.',
    );
  }
  if (candidate.upstreamReadiness !== B1_UPSTREAM_READINESS_BLOCKER) {
    return blocked(
      'B1_FIXTURE_UPSTREAM_READINESS_CLAIM_INVALID',
      'B1 deterministic fixtures must preserve the upstream readiness blocker.',
      'Blocked readiness marker until betting-win exposes the accepted B1 resource.',
    );
  }

  const manifest = parseB1MultiVenueManifest(candidate.manifest);
  if (!manifest.ok) {
    return manifest;
  }
  const rows = parseB1MultiVenueMarketRows(candidate.rows);
  if (!rows.ok) {
    return rows;
  }
  const lineageBinding = validateFixtureLineageBinding(manifest.value, rows.value);
  if (!lineageBinding.ok) {
    return lineageBinding;
  }

  return accepted(
    Object.freeze({
      fixtureKind: B1_LOCAL_FIXTURE_KIND,
      runtimeEvidence: false,
      upstreamReadiness: B1_UPSTREAM_READINESS_BLOCKER,
      manifest: manifest.value,
      rows: rows.value,
    }),
  );
}

export function parseB1MultiVenueManifest(value: unknown): BoundaryResult<B1MultiVenueManifest> {
  if (typeof value !== 'object' || value === null) {
    return blocked(
      'B1_MANIFEST_NOT_OBJECT',
      'B1 manifest must be a JSON object.',
      'B1 multi-venue manifest.',
    );
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.contractSchema !== B1_MULTI_VENUE_MARKETS_SCHEMA) {
    return blocked(
      'B1_CONTRACT_SCHEMA_MISMATCH',
      'B1 manifest must use the accepted schema marker.',
      'betting-win B1 multi-venue schema marker.',
    );
  }
  if (candidate.contractAlias !== B1_MULTI_VENUE_MARKETS_ALIAS) {
    return blocked(
      'B1_CONTRACT_ALIAS_MISMATCH',
      'B1 manifest must use the accepted schema alias.',
      'betting-win B1 multi-venue schema alias.',
    );
  }
  if (candidate.surebetProfile !== 'b1_cross_venue_offline_falsification_v1') {
    return blocked(
      'B1_SUREBET_PROFILE_MISMATCH',
      'B1 manifest must declare the offline falsification profile.',
      'B1 offline falsification surebet profile.',
    );
  }

  const sourceManifestHash = requireManifestHash(
    candidate.sourceManifestHash,
    'B1_SOURCE_MANIFEST_HASH_INVALID',
    'B1 manifest sourceManifestHash must be 64 hexadecimal characters.',
    'B1 source manifest hash.',
  );
  if (!sourceManifestHash.ok) {
    return sourceManifestHash;
  }
  const upstreamLockFingerprint = requireManifestHash(
    candidate.upstreamLockFingerprint,
    'B1_UPSTREAM_LOCK_FINGERPRINT_INVALID',
    'B1 manifest upstreamLockFingerprint must be 64 hexadecimal characters.',
    'B1 upstream lock fingerprint.',
  );
  if (!upstreamLockFingerprint.ok) {
    return upstreamLockFingerprint;
  }
  const providerGenerationIds = requireNonEmptyStringArray(
    candidate.providerGenerationIds,
    'B1_PROVIDER_GENERATION_IDS_MISSING',
    'B1 manifest providerGenerationIds must contain at least one id.',
    'B1 provider generation ids from betting-win.',
  );
  if (!providerGenerationIds.ok) {
    return providerGenerationIds;
  }
  const sourceLineageRecordIds = requireNonEmptyStringArray(
    candidate.sourceLineageRecordIds,
    'B1_SOURCE_LINEAGE_RECORD_IDS_MISSING',
    'B1 manifest sourceLineageRecordIds must contain at least one id.',
    'B1 source lineage record ids from betting-win.',
  );
  if (!sourceLineageRecordIds.ok) {
    return sourceLineageRecordIds;
  }
  const normalizedEvidenceIds = requireNonEmptyStringArray(
    candidate.normalizedEvidenceIds,
    'B1_NORMALIZED_EVIDENCE_IDS_MISSING',
    'B1 manifest normalizedEvidenceIds must contain at least one id.',
    'B1 normalized evidence ids from betting-win.',
  );
  if (!normalizedEvidenceIds.ok) {
    return normalizedEvidenceIds;
  }
  const retentionPolicy = requireNonEmptyString(
    candidate.retentionPolicy,
    'B1_RETENTION_POLICY_MISSING',
    'B1 manifest retentionPolicy is required.',
    'B1 retention policy.',
  );
  if (!retentionPolicy.ok) {
    return retentionPolicy;
  }
  const licenseScope = requireNonEmptyString(
    candidate.licenseScope,
    'B1_LICENSE_SCOPE_MISSING',
    'B1 manifest licenseScope is required.',
    'B1 license scope.',
  );
  if (!licenseScope.ok) {
    return licenseScope;
  }
  const knownCoverageGaps = requireStringArray(
    candidate.knownCoverageGaps,
    'B1_KNOWN_COVERAGE_GAPS_INVALID',
    'B1 manifest knownCoverageGaps must be an array of strings.',
    'B1 known coverage gap list.',
  );
  if (!knownCoverageGaps.ok) {
    return knownCoverageGaps;
  }

  return accepted(
    Object.freeze({
      contractSchema: B1_MULTI_VENUE_MARKETS_SCHEMA,
      contractAlias: B1_MULTI_VENUE_MARKETS_ALIAS,
      surebetProfile: 'b1_cross_venue_offline_falsification_v1',
      sourceManifestHash: sourceManifestHash.value,
      upstreamLockFingerprint: upstreamLockFingerprint.value,
      providerGenerationIds: providerGenerationIds.value,
      sourceLineageRecordIds: sourceLineageRecordIds.value,
      normalizedEvidenceIds: normalizedEvidenceIds.value,
      retentionPolicy: retentionPolicy.value,
      licenseScope: licenseScope.value,
      knownCoverageGaps: knownCoverageGaps.value,
    }),
  );
}

export function parseB1MultiVenueMarketRows(value: unknown): BoundaryResult<readonly B1MultiVenueMarketRow[]> {
  if (!Array.isArray(value)) {
    return blocked(
      'B1_ROWS_NOT_ARRAY',
      'B1 multi-venue rows must be provided as an array.',
      'B1 multi-venue market rows.',
    );
  }
  if (value.length === 0) {
    return blocked(
      'B1_ROWS_EMPTY',
      'B1 deterministic fixtures must contain at least one row.',
      'B1 multi-venue market rows.',
    );
  }

  const rows: B1MultiVenueMarketRow[] = [];
  for (const row of value) {
    const parsed = parseB1MultiVenueMarketRow(row);
    if (!parsed.ok) {
      return parsed;
    }
    rows.push(parsed.value);
  }
  return accepted(Object.freeze(rows));
}

function validateFixtureLineageBinding(
  manifest: B1MultiVenueManifest,
  rows: readonly B1MultiVenueMarketRow[],
): BoundaryResult<undefined> {
  const manifestLineageIds = new Set(manifest.sourceLineageRecordIds);
  const rowLineageIds = new Set(rows.map((row) => row.sourceLineageId));
  for (const rowLineageId of rowLineageIds) {
    if (!manifestLineageIds.has(rowLineageId)) {
      return blocked(
        'B1_SOURCE_LINEAGE_ROW_NOT_IN_MANIFEST',
        'B1 fixture rows must be bound to manifest sourceLineageRecordIds.',
        'Every row source_lineage_id represented in the B1 manifest lineage ids.',
      );
    }
  }
  for (const manifestLineageId of manifestLineageIds) {
    if (!rowLineageIds.has(manifestLineageId)) {
      return blocked(
        'B1_SOURCE_LINEAGE_MANIFEST_ID_UNUSED',
        'B1 manifest sourceLineageRecordIds must be represented by fixture rows.',
        'Every manifest source lineage id represented by at least one B1 row.',
      );
    }
  }
  return accepted(undefined);
}

export function parseB1MultiVenueMarketRow(value: unknown): BoundaryResult<B1MultiVenueMarketRow> {
  if (typeof value !== 'object' || value === null) {
    return blocked(
      'B1_ROW_NOT_OBJECT',
      'B1 multi-venue market row must be a JSON object.',
      'B1 multi-venue market row.',
    );
  }

  const candidate = value as Record<string, unknown>;
  const exportId = requireNonEmptyString(candidate.export_id, 'B1_EXPORT_ID_MISSING', 'B1 row export_id is required.', 'B1 export id.');
  if (!exportId.ok) {
    return exportId;
  }
  if (candidate.export_schema_version !== B1_MULTI_VENUE_MARKETS_SCHEMA) {
    return blocked(
      'B1_ROW_SCHEMA_MISMATCH',
      'B1 row export_schema_version must match the accepted B1 schema.',
      'B1 row schema marker.',
    );
  }
  const sourceCommit = requireCommitSha(candidate.source_commit, 'B1_SOURCE_COMMIT_INVALID', 'B1 row source_commit must be a 40-character commit SHA.', 'B1 source commit.');
  if (!sourceCommit.ok) {
    return sourceCommit;
  }
  const sourceRunId = requireNonEmptyString(candidate.source_run_id, 'B1_SOURCE_RUN_ID_MISSING', 'B1 row source_run_id is required.', 'B1 source run id.');
  if (!sourceRunId.ok) {
    return sourceRunId;
  }
  const createdAtUtc = requireIsoTimestamp(candidate.created_at_utc, 'B1_CREATED_AT_INVALID', 'B1 row created_at_utc must be an ISO-8601 UTC timestamp.', 'B1 row creation timestamp.');
  if (!createdAtUtc.ok) {
    return createdAtUtc;
  }
  const dataWindowStartUtc = requireIsoTimestamp(candidate.data_window_start_utc, 'B1_DATA_WINDOW_START_INVALID', 'B1 row data_window_start_utc must be an ISO-8601 UTC timestamp.', 'B1 data window start.');
  if (!dataWindowStartUtc.ok) {
    return dataWindowStartUtc;
  }
  const dataWindowEndUtc = requireIsoTimestamp(candidate.data_window_end_utc, 'B1_DATA_WINDOW_END_INVALID', 'B1 row data_window_end_utc must be an ISO-8601 UTC timestamp.', 'B1 data window end.');
  if (!dataWindowEndUtc.ok) {
    return dataWindowEndUtc;
  }
  const canonicalEventId = requireNonEmptyString(candidate.canonical_event_id, 'B1_CANONICAL_EVENT_ID_MISSING', 'B1 row canonical_event_id is required.', 'B1 canonical event id.');
  if (!canonicalEventId.ok) {
    return canonicalEventId;
  }
  const canonicalMarketId = requireNonEmptyString(candidate.canonical_market_id, 'B1_CANONICAL_MARKET_ID_MISSING', 'B1 row canonical_market_id is required.', 'B1 canonical market id.');
  if (!canonicalMarketId.ok) {
    return canonicalMarketId;
  }
  const canonicalSelectionId = requireNonEmptyString(candidate.canonical_selection_id, 'B1_CANONICAL_SELECTION_ID_MISSING', 'B1 row canonical_selection_id is required.', 'B1 canonical selection id.');
  if (!canonicalSelectionId.ok) {
    return canonicalSelectionId;
  }
  const marketEquivalenceKey = requireNonEmptyString(candidate.market_equivalence_key, 'B1_MARKET_EQUIVALENCE_MISSING', 'B1 row market_equivalence_key is required before quote comparison.', 'B1 market equivalence key.');
  if (!marketEquivalenceKey.ok) {
    return marketEquivalenceKey;
  }
  const selectionEquivalenceKey = requireNonEmptyString(candidate.selection_equivalence_key, 'B1_SELECTION_EQUIVALENCE_MISSING', 'B1 row selection_equivalence_key is required before quote comparison.', 'B1 selection equivalence key.');
  if (!selectionEquivalenceKey.ok) {
    return selectionEquivalenceKey;
  }
  const sport = requireNonEmptyString(candidate.sport, 'B1_SPORT_MISSING', 'B1 row sport is required.', 'B1 sport.');
  if (!sport.ok) {
    return sport;
  }
  const league = requireNonEmptyString(candidate.league, 'B1_LEAGUE_MISSING', 'B1 row league is required.', 'B1 league.');
  if (!league.ok) {
    return league;
  }
  const season = requireNonEmptyString(candidate.season, 'B1_SEASON_MISSING', 'B1 row season is required.', 'B1 season.');
  if (!season.ok) {
    return season;
  }
  const eventStartTimeUtc = requireIsoTimestamp(candidate.event_start_time_utc, 'B1_EVENT_START_INVALID', 'B1 row event_start_time_utc must be an ISO-8601 UTC timestamp.', 'B1 event start time.');
  if (!eventStartTimeUtc.ok) {
    return eventStartTimeUtc;
  }
  const marketType = requireNonEmptyString(candidate.market_type, 'B1_MARKET_TYPE_MISSING', 'B1 row market_type is required.', 'B1 market type.');
  if (!marketType.ok) {
    return marketType;
  }
  const period = requireNonEmptyString(candidate.period, 'B1_PERIOD_MISSING', 'B1 row period is required.', 'B1 period.');
  if (!period.ok) {
    return period;
  }
  const lineValue = requireDecimalString(candidate.line_value, 'B1_LINE_VALUE_INVALID', 'B1 row line_value must be a decimal string.', 'B1 line value.');
  if (!lineValue.ok) {
    return lineValue;
  }
  const outcomeName = requireNonEmptyString(candidate.outcome_name, 'B1_OUTCOME_NAME_MISSING', 'B1 row outcome_name is required.', 'B1 outcome name.');
  if (!outcomeName.ok) {
    return outcomeName;
  }
  const outcomeSide = requireNonEmptyString(candidate.outcome_side, 'B1_OUTCOME_SIDE_MISSING', 'B1 row outcome_side is required.', 'B1 outcome side.');
  if (!outcomeSide.ok) {
    return outcomeSide;
  }
  const providerId = requireNonEmptyString(candidate.provider_id, 'B1_PROVIDER_ID_MISSING', 'B1 row provider_id is required.', 'B1 provider id from betting-win.');
  if (!providerId.ok) {
    return providerId;
  }
  const venueOrBookmakerId = requireNonEmptyString(candidate.venue_or_bookmaker_id, 'B1_VENUE_OR_BOOKMAKER_ID_MISSING', 'B1 row venue_or_bookmaker_id is required.', 'B1 venue or bookmaker id.');
  if (!venueOrBookmakerId.ok) {
    return venueOrBookmakerId;
  }
  const venueType = requireVenueType(candidate.venue_type, 'B1_VENUE_TYPE_INVALID', 'B1 row venue_type is unsupported.', 'B1 venue type.');
  if (!venueType.ok) {
    return venueType;
  }
  const snapshotTimeUtc = requireIsoTimestamp(candidate.snapshot_time_utc, 'B1_SNAPSHOT_TIME_INVALID', 'B1 row snapshot_time_utc must be an ISO-8601 UTC timestamp.', 'B1 snapshot timestamp.');
  if (!snapshotTimeUtc.ok) {
    return snapshotTimeUtc;
  }
  const retrievedAtUtc = requireIsoTimestamp(candidate.retrieved_at_utc, 'B1_RETRIEVED_AT_INVALID', 'B1 row retrieved_at_utc must be an ISO-8601 UTC timestamp.', 'B1 retrieval timestamp.');
  if (!retrievedAtUtc.ok) {
    return retrievedAtUtc;
  }
  const quoteAgeMs = requireMinorUnits(candidate.quote_age_ms, 'B1_QUOTE_AGE_INVALID', 'B1 row quote_age_ms must be a non-negative integer string or bigint.', 'B1 quote age.');
  if (!quoteAgeMs.ok) {
    return quoteAgeMs;
  }
  const decimalOdds = requireDecimalString(candidate.decimal_odds, 'B1_DECIMAL_ODDS_INVALID', 'B1 row decimal_odds must be a decimal string.', 'B1 decimal odds.');
  if (!decimalOdds.ok) {
    return decimalOdds;
  }
  const priceMinorOrProbabilityMinor = requireMinorUnits(candidate.price_minor_or_probability_minor, 'B1_PRICE_MINOR_OR_PROBABILITY_INVALID', 'B1 row price_minor_or_probability_minor must be a non-negative integer string or bigint.', 'B1 price or probability minor units.');
  if (!priceMinorOrProbabilityMinor.ok) {
    return priceMinorOrProbabilityMinor;
  }
  const availableSizeMinor = requireMinorUnits(candidate.available_size_minor, 'B1_AVAILABLE_SIZE_INVALID', 'B1 row available_size_minor must be a non-negative integer string or bigint.', 'B1 available size minor units.');
  if (!availableSizeMinor.ok) {
    return availableSizeMinor;
  }
  const currency = requireCurrency(candidate.currency, 'B1_CURRENCY_MISMATCH', 'B1 row currency is unsupported.', 'B1 supported currency.');
  if (!currency.ok) {
    return currency;
  }
  const marketStatus = requireNonEmptyString(candidate.market_status, 'B1_MARKET_STATUS_MISSING', 'B1 row market_status is required.', 'B1 market status.');
  if (!marketStatus.ok) {
    return marketStatus;
  }
  const settlementRuleVersion = requireNonEmptyString(candidate.settlement_rule_version, 'B1_SETTLEMENT_RULE_VERSION_MISSING', 'B1 row settlement_rule_version is required.', 'B1 settlement rule version.');
  if (!settlementRuleVersion.ok) {
    return settlementRuleVersion;
  }
  const settlementCompatibilityFlag = requireSettlementCompatibilityFlag(candidate.settlement_compatibility_flag);
  if (!settlementCompatibilityFlag.ok) {
    return settlementCompatibilityFlag;
  }
  const voidRuleId = requireNonEmptyString(candidate.void_rule_id, 'B1_VOID_RULE_ID_MISSING', 'B1 row void_rule_id is required.', 'B1 void rule id.');
  if (!voidRuleId.ok) {
    return voidRuleId;
  }
  const sourceLineageId = requireNonEmptyString(candidate.source_lineage_id, 'B1_PROVIDER_LINEAGE_MISSING', 'B1 row source_lineage_id is required.', 'B1 source lineage id.');
  if (!sourceLineageId.ok) {
    return sourceLineageId;
  }
  const rawPayloadHash = requireManifestHash(candidate.raw_payload_hash, 'B1_RAW_PAYLOAD_HASH_INVALID', 'B1 row raw_payload_hash must be 64 hexadecimal characters.', 'B1 raw payload hash.');
  if (!rawPayloadHash.ok) {
    return rawPayloadHash;
  }
  const qualityFlags = requireStringArray(candidate.quality_flags, 'B1_QUALITY_FLAGS_INVALID', 'B1 row quality_flags must be an array of strings.', 'B1 row quality flags.');
  if (!qualityFlags.ok) {
    return qualityFlags;
  }

  return accepted(
    Object.freeze({
      exportId: exportId.value,
      exportSchemaVersion: B1_MULTI_VENUE_MARKETS_SCHEMA,
      sourceCommit: sourceCommit.value,
      sourceRunId: sourceRunId.value,
      createdAtUtc: createdAtUtc.value,
      dataWindowStartUtc: dataWindowStartUtc.value,
      dataWindowEndUtc: dataWindowEndUtc.value,
      canonicalEventId: canonicalEventId.value,
      canonicalMarketId: canonicalMarketId.value,
      canonicalSelectionId: canonicalSelectionId.value,
      marketEquivalenceKey: marketEquivalenceKey.value,
      selectionEquivalenceKey: selectionEquivalenceKey.value,
      sport: sport.value,
      league: league.value,
      season: season.value,
      eventStartTimeUtc: eventStartTimeUtc.value,
      marketType: marketType.value,
      period: period.value,
      lineValue: lineValue.value,
      outcomeName: outcomeName.value,
      outcomeSide: outcomeSide.value,
      providerId: providerId.value,
      venueOrBookmakerId: venueOrBookmakerId.value,
      venueType: venueType.value,
      snapshotTimeUtc: snapshotTimeUtc.value,
      retrievedAtUtc: retrievedAtUtc.value,
      quoteAgeMs: quoteAgeMs.value,
      decimalOdds: decimalOdds.value,
      priceMinorOrProbabilityMinor: priceMinorOrProbabilityMinor.value,
      availableSizeMinor: availableSizeMinor.value,
      currency: currency.value,
      marketStatus: marketStatus.value,
      settlementRuleVersion: settlementRuleVersion.value,
      settlementCompatibilityFlag: settlementCompatibilityFlag.value,
      voidRuleId: voidRuleId.value,
      sourceLineageId: sourceLineageId.value,
      rawPayloadHash: rawPayloadHash.value,
      qualityFlags: qualityFlags.value,
    }),
  );
}

function requireNonEmptyString(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
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

function requireCommitSha(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || !COMMIT_SHA_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireIsoTimestamp(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<B1IsoTimestamp> {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) {
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

function requireDecimalString(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || !DECIMAL_STRING_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireStringArray(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<readonly string[]> {
  if (!Array.isArray(value)) {
    return blocked(code, message, evidenceRequired);
  }
  const parsed: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      return blocked(code, message, evidenceRequired);
    }
    parsed.push(item);
  }
  return accepted(Object.freeze(parsed));
}

function requireNonEmptyStringArray(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<readonly string[]> {
  const parsed = requireStringArray(value, code, message, evidenceRequired);
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.value.length === 0) {
    return blocked(code, message, evidenceRequired);
  }
  const seen = new Set<string>();
  for (const item of parsed.value) {
    if (item.length === 0 || item !== item.trim() || seen.has(item)) {
      return blocked(code, message, evidenceRequired);
    }
    seen.add(item);
  }
  return parsed;
}

function requireCurrency(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<B1Currency> {
  if (typeof value !== 'string' || !B1_CURRENCIES.includes(value as B1Currency)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value as B1Currency);
}

function requireVenueType(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<B1VenueType> {
  if (typeof value !== 'string' || !B1_VENUE_TYPES.includes(value as B1VenueType)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value as B1VenueType);
}

function requireSettlementCompatibilityFlag(value: unknown): BoundaryResult<B1SettlementCompatibilityFlag> {
  if (value === 'unknown') {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      'B1 row settlement_compatibility_flag must be explicit before quote comparison.',
      'Explicit B1 settlement compatibility evidence.',
    );
  }
  if (typeof value !== 'string' || !B1_SETTLEMENT_COMPATIBILITY_FLAGS.includes(value as B1SettlementCompatibilityFlag)) {
    return blocked(
      'B1_SETTLEMENT_COMPATIBILITY_INVALID',
      'B1 row settlement_compatibility_flag is unsupported.',
      'Explicit B1 settlement compatibility evidence.',
    );
  }
  return accepted(value as B1SettlementCompatibilityFlag);
}
