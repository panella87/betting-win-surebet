export const B1_MULTI_VENUE_MARKETS_SCHEMA = 'betting-win.b1_multi_venue_markets.v1' as const;
export const B1_MULTI_VENUE_MARKETS_ALIAS = 'betting-win-b1-multi-venue-markets.v1' as const;
export const B1_LOCAL_FIXTURE_KIND = 'deterministic_b1_multi_venue_fixture' as const;
export const B1_UPSTREAM_READINESS_BLOCKER = 'blocked_until_betting_win_b1_multi_venue_markets_v1' as const;

export type B1ContractSchema = typeof B1_MULTI_VENUE_MARKETS_SCHEMA;
export type B1ContractAlias = typeof B1_MULTI_VENUE_MARKETS_ALIAS;
export type B1LocalFixtureKind = typeof B1_LOCAL_FIXTURE_KIND;
export type B1UpstreamReadinessBlocker = typeof B1_UPSTREAM_READINESS_BLOCKER;
export type B1Currency = 'USD' | 'USDC';
export type B1VenueType = 'sportsbook' | 'exchange' | 'prediction_market';
export type B1SettlementCompatibilityFlag = 'compatible' | 'incompatible';
export type B1IsoTimestamp = string;
export type B1DecimalString = string;

export interface B1MultiVenueManifest {
  readonly contractSchema: B1ContractSchema;
  readonly contractAlias: B1ContractAlias;
  readonly surebetProfile: 'b1_cross_venue_offline_falsification_v1';
  readonly sourceManifestHash: string;
  readonly upstreamLockFingerprint: string;
  readonly providerGenerationIds: readonly string[];
  readonly sourceLineageRecordIds: readonly string[];
  readonly normalizedEvidenceIds: readonly string[];
  readonly retentionPolicy: string;
  readonly licenseScope: string;
  readonly knownCoverageGaps: readonly string[];
}

export interface B1MultiVenueMarketRow {
  readonly exportId: string;
  readonly exportSchemaVersion: B1ContractSchema;
  readonly sourceCommit: string;
  readonly sourceRunId: string;
  readonly createdAtUtc: B1IsoTimestamp;
  readonly dataWindowStartUtc: B1IsoTimestamp;
  readonly dataWindowEndUtc: B1IsoTimestamp;
  readonly canonicalEventId: string;
  readonly canonicalMarketId: string;
  readonly canonicalSelectionId: string;
  readonly marketEquivalenceKey: string;
  readonly selectionEquivalenceKey: string;
  readonly sport: string;
  readonly league: string;
  readonly season: string;
  readonly eventStartTimeUtc: B1IsoTimestamp;
  readonly marketType: string;
  readonly period: string;
  readonly lineValue: B1DecimalString;
  readonly outcomeName: string;
  readonly outcomeSide: string;
  readonly providerId: string;
  readonly venueOrBookmakerId: string;
  readonly venueType: B1VenueType;
  readonly snapshotTimeUtc: B1IsoTimestamp;
  readonly retrievedAtUtc: B1IsoTimestamp;
  readonly quoteAgeMs: bigint;
  readonly decimalOdds: B1DecimalString;
  readonly priceMinorOrProbabilityMinor: bigint;
  readonly availableSizeMinor: bigint;
  readonly currency: B1Currency;
  readonly marketStatus: string;
  readonly settlementRuleVersion: string;
  readonly settlementCompatibilityFlag: B1SettlementCompatibilityFlag;
  readonly voidRuleId: string;
  readonly sourceLineageId: string;
  readonly rawPayloadHash: string;
  readonly qualityFlags: readonly string[];
}

export interface B1DeterministicFixture {
  readonly fixtureKind: B1LocalFixtureKind;
  readonly runtimeEvidence: false;
  readonly upstreamReadiness: B1UpstreamReadinessBlocker;
  readonly manifest: B1MultiVenueManifest;
  readonly rows: readonly B1MultiVenueMarketRow[];
}
