export type IsoTimestamp = string;
export type FirstLaneId = 'polymarket_standard_binary_complete_set_v0';
export type PaperMode = 'paper_only';
export type ProviderConnectionPolicy = 'prohibited';
export type CompleteSetFamily = 'same_venue_complete_set';

export interface LaneSpec {
  readonly laneId: FirstLaneId;
  readonly venue: 'polymarket';
  readonly family: CompleteSetFamily;
  readonly mode: PaperMode;
  readonly providerConnection: ProviderConnectionPolicy;
}

export const FIRST_LANE_SPEC: LaneSpec = Object.freeze({
  laneId: 'polymarket_standard_binary_complete_set_v0',
  venue: 'polymarket',
  family: 'same_venue_complete_set',
  mode: 'paper_only',
  providerConnection: 'prohibited',
});

export interface BettingWinReference {
  readonly source: 'betting-win';
  readonly contractVersion: string;
  readonly manifestHash: string;
}

export interface MarketIdentity {
  readonly canonicalEventId: string;
  readonly canonicalMarketId: string;
  readonly providerMarketId: string;
  readonly providerGeneration: string;
}

export interface RuleProfileSummary {
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
}

export type OutcomeSide = 'yes' | 'no';

export interface CompleteSetLeg {
  readonly legId: string;
  readonly outcome: OutcomeSide;
  readonly market: MarketIdentity;
  readonly rules: RuleProfileSummary;
}

export interface TerminalScenario {
  readonly scenarioId: string;
  readonly winningOutcome: OutcomeSide;
  readonly description: string;
}

export interface ScenarioCashflowRow {
  readonly scenarioId: string;
  readonly legId: string;
  readonly stakeMinor: bigint;
  readonly payoutMinor: bigint;
  readonly feeMinor: bigint;
  readonly costMinor: bigint;
}

export interface QuoteDepthEvidence {
  readonly evidenceId: string;
  readonly observedAt: IsoTimestamp;
  readonly priceMinor: bigint;
  readonly availableSizeMinor: bigint;
  readonly currency: 'USDC' | 'USD' | 'UNKNOWN';
}

export interface CapacityConstraint {
  readonly legId: string;
  readonly maxStakeMinor: bigint;
  readonly minStakeMinor: bigint;
}

export interface Blocker {
  readonly code: string;
  readonly message: string;
  readonly evidenceRequired: string;
}

export interface BlockedResult {
  readonly ok: false;
  readonly blockers: readonly Blocker[];
}

export interface AcceptedResult<T> {
  readonly ok: true;
  readonly value: T;
}

export type BoundaryResult<T> = AcceptedResult<T> | BlockedResult;

export function blocked(code: string, message: string, evidenceRequired: string): BlockedResult {
  return { ok: false, blockers: [{ code, message, evidenceRequired }] };
}

export function accepted<T>(value: T): AcceptedResult<T> {
  return { ok: true, value };
}
