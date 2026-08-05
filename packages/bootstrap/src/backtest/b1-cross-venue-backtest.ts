import type { Blocker, BoundaryResult } from '../contracts/local-types.js';
import { accepted, blocked } from '../contracts/local-types.js';
import type { B1DeterministicFixture, B1MultiVenueMarketRow } from '../contracts/b1-local-types.js';
import { deriveB1CrossVenueGrossOpportunityCandidates, type B1GrossOpportunityCandidate } from '../opportunity/b1-cross-venue-derivation.js';
import type { B1QuoteSynchronizationPolicy } from '../quotes/b1-quote-synchronization.js';
import { solveB1GeneralizedStakeVector, type B1GeneralizedStakeVectorPolicy } from '../solver/b1-generalized-stake-vector.js';
import { evaluateB1NetEconomics } from '../economics/b1-net-spread.js';
import type { B1CapitalLockPolicy } from '../economics/b1-capital-lock.js';
import type { B1FeeMatrix } from '../economics/b1-fee-matrix.js';
import type { B1QuoteAgePenaltyPolicy } from '../economics/b1-lateness-penalty.js';
import { simulateB1FillRejectionTimeout, type B1FillabilityEvent } from '../simulation/b1-leg-completion.js';
import { analyzeB1SettlementReplay, type B1SettlementReplayRecord } from '../simulation/b1-settlement-replay.js';
import { createB1FalsePositiveReport, type B1FalsePositiveObservation } from '../reporting/b1-false-positive-report.js';
import {
  createB1BacktestReport,
  type B1BacktestReport,
  type B1BacktestReportCandidateSummary,
} from '../reporting/b1-backtest-report.js';

export interface B1CrossVenueBacktestPlan {
  readonly candidateId: string;
  readonly stakeVectorPolicy: B1GeneralizedStakeVectorPolicy;
  readonly feeMatrix: B1FeeMatrix;
  readonly quoteAgePenaltyPolicy: B1QuoteAgePenaltyPolicy;
  readonly capitalLockPolicy: B1CapitalLockPolicy;
  readonly fillabilityEvents: readonly B1FillabilityEvent[];
  readonly maxResidualExposureMinor: bigint;
  readonly settlementRecords: readonly B1SettlementReplayRecord[];
}

export interface B1CrossVenueBacktestInput {
  readonly fixture: B1DeterministicFixture;
  readonly quotePolicy: B1QuoteSynchronizationPolicy;
  readonly plans: readonly B1CrossVenueBacktestPlan[];
}

export interface B1CrossVenueBacktestRun {
  readonly runKind: 'deterministic_b1_cross_venue_offline_backtest';
  readonly report: B1BacktestReport;
  readonly candidateResults: readonly B1CrossVenueBacktestCandidateResult[];
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

export type B1CrossVenueBacktestCandidateResult =
  | B1CrossVenueBacktestAcceptedCandidateResult
  | B1CrossVenueBacktestBlockedCandidateResult;

export interface B1CrossVenueBacktestAcceptedCandidateResult {
  readonly ok: true;
  readonly candidateId: string;
  readonly grossCandidate: Extract<B1GrossOpportunityCandidate, { readonly ok: true }>;
  readonly netCandidate: ReturnType<typeof evaluateB1NetEconomics> extends BoundaryResult<infer T> ? T : never;
  readonly fillabilitySimulation: ReturnType<typeof simulateB1FillRejectionTimeout> extends BoundaryResult<infer T> ? T : never;
  readonly settlementReplay: ReturnType<typeof analyzeB1SettlementReplay> extends BoundaryResult<infer T> ? T : never;
}

export interface B1CrossVenueBacktestBlockedCandidateResult {
  readonly ok: false;
  readonly candidateId: string;
  readonly stage:
    | 'gross'
    | 'stake_vector'
    | 'net_economics'
    | 'fillability'
    | 'settlement';
  readonly blockers: readonly Blocker[];
  readonly grossCandidate?: B1GrossOpportunityCandidate;
}

export function runDeterministicB1CrossVenueBacktest(
  input: B1CrossVenueBacktestInput,
): BoundaryResult<B1CrossVenueBacktestRun> {
  const inputValidation = validateB1CrossVenueBacktestInput(input);
  if (!inputValidation.ok) {
    return inputValidation;
  }

  const grossCandidates = deriveB1CrossVenueGrossOpportunityCandidates(input.fixture.rows, input.quotePolicy);
  if (!grossCandidates.ok) {
    return grossCandidates;
  }

  const plansByCandidateId = indexBacktestPlans(input.plans);
  if (!plansByCandidateId.ok) {
    return plansByCandidateId;
  }

  const candidateIds = new Set(grossCandidates.value.map((candidate) => candidate.candidateId));
  for (const plan of input.plans) {
    if (!candidateIds.has(plan.candidateId)) {
      return blocked(
        'B1_BACKTEST_PLAN_UNKNOWN_CANDIDATE',
        'B1 deterministic offline backtesting requires every plan to target a derived gross candidate.',
        'B1 backtest plans keyed by derived candidate id.',
      );
    }
  }

  const candidateResults: B1CrossVenueBacktestCandidateResult[] = [];
  const falsePositiveObservations: B1FalsePositiveObservation[] = [];
  for (const grossCandidate of grossCandidates.value) {
    const candidateResult = runCandidateBacktest(grossCandidate, plansByCandidateId.value.get(grossCandidate.candidateId));
    candidateResults.push(candidateResult);
    if (candidateResult.ok) {
      falsePositiveObservations.push(Object.freeze({
        candidateId: candidateResult.candidateId,
        settlementStatus: 'accepted',
        settledNetMinor: candidateResult.settlementReplay.settledNetMinor,
        falsePositive: candidateResult.settlementReplay.falsePositive,
      }));
    } else if (candidateResult.stage === 'settlement') {
      falsePositiveObservations.push(Object.freeze({
        candidateId: candidateResult.candidateId,
        settlementStatus: 'blocked',
        blockers: candidateResult.blockers,
      }));
    }
  }

  const falsePositiveReport = createB1FalsePositiveReport(falsePositiveObservations);
  const report = createB1BacktestReport({
    sourceManifestHash: input.fixture.manifest.sourceManifestHash,
    upstreamLockFingerprint: input.fixture.manifest.upstreamLockFingerprint,
    fixtureKind: input.fixture.fixtureKind,
    runtimeEvidence: input.fixture.runtimeEvidence,
    upstreamReadiness: input.fixture.upstreamReadiness,
    uniqueEventIds: Object.freeze(input.fixture.rows.map((row) => row.canonicalEventId)),
    candidateSummaries: Object.freeze(candidateResults.map(toReportCandidateSummary)),
    falsePositiveReport,
  });
  if (!report.ok) {
    return report;
  }

  return accepted(Object.freeze({
    runKind: 'deterministic_b1_cross_venue_offline_backtest',
    report: report.value,
    candidateResults: Object.freeze(candidateResults),
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  }));
}

function validateB1CrossVenueBacktestInput(input: B1CrossVenueBacktestInput): BoundaryResult<undefined> {
  if (typeof input !== 'object' || input === null) {
    return blocked(
      'B1_BACKTEST_INPUT_MISSING',
      'B1 deterministic offline backtesting requires an explicit fixture, quote policy and candidate plans.',
      'Explicit B1 cross-venue backtest input.',
    );
  }
  if (typeof input.fixture !== 'object' || input.fixture === null) {
    return blocked(
      'B1_BACKTEST_FIXTURE_MISSING',
      'B1 deterministic offline backtesting requires an explicit fixture object.',
      'Explicit B1 deterministic fixture input.',
    );
  }
  if (input.fixture.fixtureKind !== 'deterministic_b1_multi_venue_fixture') {
    return blocked(
      'B1_BACKTEST_FIXTURE_KIND_INVALID',
      'B1 deterministic offline backtesting requires the deterministic B1 fixture kind.',
      'B1 deterministic fixtureKind marker.',
    );
  }
  if (input.fixture.runtimeEvidence !== false) {
    return blocked(
      'B1_BACKTEST_FIXTURE_RUNTIME_EVIDENCE_FORBIDDEN',
      'B1 deterministic offline backtesting fixtures must never be treated as runtime evidence.',
      'Repo-local B1 deterministic fixture with runtimeEvidence=false.',
    );
  }
  if (input.fixture.upstreamReadiness !== 'blocked_until_betting_win_b1_multi_venue_markets_v1') {
    return blocked(
      'B1_BACKTEST_UPSTREAM_READINESS_CLAIM_FORBIDDEN',
      'B1 deterministic offline backtesting must preserve the real upstream B1 API blocker.',
      'B1 fixture upstreamReadiness blocked until betting-win exposes the accepted B1 resource.',
    );
  }
  if (!Array.isArray(input.fixture.rows)) {
    return blocked(
      'B1_BACKTEST_ROWS_INVALID',
      'B1 deterministic offline backtesting requires fixture rows as an array.',
      'B1 deterministic fixture rows array.',
    );
  }
  if (input.fixture.rows.length === 0) {
    return blocked(
      'B1_BACKTEST_ROWS_EMPTY',
      'B1 deterministic offline backtesting requires at least one fixture row.',
      'B1 deterministic fixture rows.',
    );
  }
  const rowsValidation = validateB1BacktestFixtureRows(input.fixture.rows);
  if (!rowsValidation.ok) {
    return rowsValidation;
  }
  if (
    typeof input.fixture.manifest !== 'object'
    || input.fixture.manifest === null
    || typeof input.fixture.manifest.sourceManifestHash !== 'string'
    || input.fixture.manifest.sourceManifestHash.trim().length === 0
    || typeof input.fixture.manifest.upstreamLockFingerprint !== 'string'
    || input.fixture.manifest.upstreamLockFingerprint.trim().length === 0
  ) {
    return blocked(
      'B1_BACKTEST_FIXTURE_MANIFEST_INVALID',
      'B1 deterministic offline backtesting requires fixture manifest provenance.',
      'B1 fixture manifest with source manifest hash and upstream lock fingerprint.',
    );
  }
  if (!Array.isArray(input.plans) || input.plans.length === 0) {
    return blocked(
      'B1_BACKTEST_PLANS_MISSING',
      'B1 deterministic offline backtesting requires explicit candidate plans.',
      'B1 backtest plans for derived gross candidates.',
    );
  }
  if (typeof input.quotePolicy !== 'object' || input.quotePolicy === null) {
    return blocked(
      'B1_BACKTEST_QUOTE_POLICY_MISSING',
      'B1 deterministic offline backtesting requires an explicit quote synchronization policy.',
      'Explicit B1 quote synchronization policy.',
    );
  }
  return accepted(undefined);
}

function validateB1BacktestFixtureRows(rows: readonly B1MultiVenueMarketRow[]): BoundaryResult<undefined> {
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) {
      return blocked(
        'B1_BACKTEST_ROW_INVALID',
        'B1 deterministic offline backtesting requires object-shaped fixture rows.',
        'Object-shaped B1 deterministic fixture rows.',
      );
    }
    for (const field of [
      'canonicalEventId',
      'marketEquivalenceKey',
      'selectionEquivalenceKey',
      'venueOrBookmakerId',
      'marketType',
      'period',
      'lineValue',
      'currency',
      'settlementRuleVersion',
      'voidRuleId',
      'outcomeName',
      'outcomeSide',
      'snapshotTimeUtc',
      'retrievedAtUtc',
      'decimalOdds',
      'marketStatus',
    ] as const) {
      if (typeof row[field] !== 'string' || row[field].trim().length === 0) {
        return blocked(
          'B1_BACKTEST_ROW_INVALID',
          'B1 deterministic offline backtesting requires complete non-empty fixture row identity and quote fields.',
          'B1 deterministic fixture rows with non-empty market, selection, venue and quote identity fields.',
        );
      }
    }
    for (const field of ['quoteAgeMs', 'priceMinorOrProbabilityMinor', 'availableSizeMinor'] as const) {
      if (typeof row[field] !== 'bigint') {
        return blocked(
          'B1_BACKTEST_ROW_INVALID',
          'B1 deterministic offline backtesting requires bigint quote fields.',
          'B1 deterministic fixture rows with bigint quote age, price and capacity fields.',
        );
      }
    }
  }
  return accepted(undefined);
}

function indexBacktestPlans(
  plans: readonly B1CrossVenueBacktestPlan[],
): BoundaryResult<ReadonlyMap<string, B1CrossVenueBacktestPlan>> {
  const indexed = new Map<string, B1CrossVenueBacktestPlan>();
  for (const plan of plans) {
    if (typeof plan !== 'object' || plan === null) {
      return blocked(
        'B1_BACKTEST_PLAN_INVALID',
        'B1 deterministic offline backtesting requires object-shaped candidate plans.',
        'Object-shaped B1 backtest plans.',
      );
    }
    if (typeof plan.candidateId !== 'string' || plan.candidateId.trim().length === 0) {
      return blocked(
        'B1_BACKTEST_PLAN_CANDIDATE_ID_MISSING',
        'B1 deterministic offline backtesting requires non-empty plan candidate ids.',
        'B1 backtest plan candidate id.',
      );
    }
    const planShape = validateBacktestPlanShape(plan);
    if (!planShape.ok) {
      return planShape;
    }
    if (indexed.has(plan.candidateId)) {
      return blocked(
        'B1_BACKTEST_PLAN_DUPLICATE',
        'B1 deterministic offline backtesting requires at most one explicit plan per candidate.',
        'Unique B1 backtest plan keyed by candidate id.',
      );
    }
    indexed.set(plan.candidateId, plan);
  }
  return accepted(indexed);
}

function validateBacktestPlanShape(plan: B1CrossVenueBacktestPlan): BoundaryResult<undefined> {
  if (
    typeof plan.stakeVectorPolicy !== 'object'
    || plan.stakeVectorPolicy === null
    || !Array.isArray(plan.stakeVectorPolicy.legConstraints)
  ) {
    return blocked(
      'B1_STAKE_VECTOR_POLICY_MISSING',
      'B1 generalized stake-vector solving requires an explicit policy with leg constraints.',
      'B1 generalized stake-vector policy with legConstraints.',
    );
  }
  if (typeof plan.feeMatrix !== 'object' || plan.feeMatrix === null || !Array.isArray(plan.feeMatrix.entries)) {
    return blocked(
      'B1_FEE_MATRIX_MISSING',
      'B1 net economics requires an explicit fee matrix.',
      'B1 fee matrix entries for selected venue outcomes.',
    );
  }
  if (typeof plan.quoteAgePenaltyPolicy !== 'object' || plan.quoteAgePenaltyPolicy === null) {
    return blocked(
      'B1_QUOTE_AGE_PENALTY_POLICY_MISSING',
      'B1 net economics requires an explicit quote-age penalty policy.',
      'Explicit B1 quote-age penalty policy.',
    );
  }
  if (typeof plan.capitalLockPolicy !== 'object' || plan.capitalLockPolicy === null) {
    return blocked(
      'B1_CAPITAL_LOCK_POLICY_MISSING',
      'B1 net economics requires an explicit capital lock policy.',
      'Explicit B1 capital lock policy.',
    );
  }
  if (!Array.isArray(plan.fillabilityEvents)) {
    return blocked(
      'B1_FILLABILITY_INPUT_MISSING',
      'B1 fillability simulation requires explicit fillability events.',
      'B1 fillability event array.',
    );
  }
  if (typeof plan.maxResidualExposureMinor !== 'bigint' || plan.maxResidualExposureMinor < 0n) {
    return blocked(
      'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
      'B1 fillability simulation requires a non-negative residual exposure limit.',
      'Non-negative B1 max residual exposure minor units.',
    );
  }
  if (!Array.isArray(plan.settlementRecords)) {
    return blocked(
      'B1_BACKTEST_PLAN_SETTLEMENT_RECORDS_INVALID',
      'B1 deterministic offline backtesting requires explicit settlement replay records for every candidate plan.',
      'B1 backtest plan settlementRecords array.',
    );
  }
  return accepted(undefined);
}

function runCandidateBacktest(
  grossCandidate: B1GrossOpportunityCandidate,
  plan: B1CrossVenueBacktestPlan | undefined,
): B1CrossVenueBacktestCandidateResult {
  if (!grossCandidate.ok) {
    return blockedCandidate(grossCandidate.candidateId, 'gross', grossCandidate.blockers, grossCandidate);
  }
  if (plan === undefined) {
    return blockedCandidate(grossCandidate.candidateId, 'stake_vector', [{
      code: 'B1_BACKTEST_PLAN_MISSING',
      message: 'B1 deterministic offline backtesting requires an explicit plan for every accepted gross candidate.',
      evidenceRequired: 'B1 backtest plan keyed by accepted gross candidate id.',
    }], grossCandidate);
  }

  const stakeVector = solveB1GeneralizedStakeVector(grossCandidate, plan.stakeVectorPolicy);
  if (!stakeVector.ok) {
    return blockedCandidate(grossCandidate.candidateId, 'stake_vector', stakeVector.blockers, grossCandidate);
  }

  const netCandidate = evaluateB1NetEconomics(grossCandidate, {
    stakeAssumptions: stakeVector.value.stakeAssumptions,
    feeMatrix: plan.feeMatrix,
    quoteAgePenaltyPolicy: plan.quoteAgePenaltyPolicy,
    capitalLockPolicy: plan.capitalLockPolicy,
  });
  if (!netCandidate.ok) {
    return blockedCandidate(grossCandidate.candidateId, 'net_economics', netCandidate.blockers, grossCandidate);
  }

  const fillabilitySimulation = simulateB1FillRejectionTimeout({
    stakeVector: stakeVector.value,
    events: plan.fillabilityEvents,
    maxResidualExposureMinor: plan.maxResidualExposureMinor,
  });
  if (!fillabilitySimulation.ok) {
    return blockedCandidate(grossCandidate.candidateId, 'fillability', fillabilitySimulation.blockers, grossCandidate);
  }

  const settlementReplay = analyzeB1SettlementReplay({
    candidateId: grossCandidate.candidateId,
    matrix: stakeVector.value.scenarioCashflowMatrix,
    fillabilitySimulation: fillabilitySimulation.value,
    settlementRecords: plan.settlementRecords,
  });
  if (!settlementReplay.ok) {
    return blockedCandidate(grossCandidate.candidateId, 'settlement', settlementReplay.blockers, grossCandidate);
  }

  return Object.freeze({
    ok: true,
    candidateId: grossCandidate.candidateId,
    grossCandidate,
    netCandidate: netCandidate.value,
    fillabilitySimulation: fillabilitySimulation.value,
    settlementReplay: settlementReplay.value,
  });
}

function blockedCandidate(
  candidateId: string,
  stage: B1CrossVenueBacktestBlockedCandidateResult['stage'],
  blockers: readonly Blocker[],
  grossCandidate?: B1GrossOpportunityCandidate,
): B1CrossVenueBacktestBlockedCandidateResult {
  const result = {
    ok: false as const,
    candidateId,
    stage,
    blockers: Object.freeze(blockers.map((blocker) => Object.freeze({ ...blocker }))),
  };
  if (grossCandidate === undefined) {
    return Object.freeze(result);
  }
  return Object.freeze({
    ...result,
    grossCandidate,
  });
}

function toReportCandidateSummary(
  result: B1CrossVenueBacktestCandidateResult,
): B1BacktestReportCandidateSummary {
  if (!result.ok) {
    const blockedSummary: {
      candidateId: string;
      status: 'blocked';
      stage: B1CrossVenueBacktestBlockedCandidateResult['stage'];
      canonicalEventId?: string;
      marketEquivalenceKey?: string;
      venuePairKey?: string;
      grossSpreadPpm?: bigint;
      blockers: readonly Blocker[];
    } = {
      candidateId: result.candidateId,
      status: 'blocked',
      stage: result.stage,
      blockers: result.blockers,
    };
    if (result.grossCandidate !== undefined) {
      blockedSummary.marketEquivalenceKey = result.grossCandidate.marketEquivalenceKey;
      blockedSummary.venuePairKey = result.grossCandidate.venuePairKey;
      if (result.grossCandidate.ok) {
        blockedSummary.canonicalEventId = result.grossCandidate.canonicalEventId;
        blockedSummary.grossSpreadPpm = result.grossCandidate.grossSpreadPpm;
      }
    }
    return Object.freeze(blockedSummary);
  }
  return Object.freeze({
    candidateId: result.candidateId,
    status: 'accepted',
    stage: 'accepted',
    canonicalEventId: result.grossCandidate.canonicalEventId,
    marketEquivalenceKey: result.grossCandidate.marketEquivalenceKey,
    venuePairKey: result.grossCandidate.venuePairKey,
    grossSpreadPpm: result.grossCandidate.grossSpreadPpm,
    netSpreadPpm: result.netCandidate.netSpreadPpm,
    worstCaseNetMinor: result.netCandidate.worstCaseNetMinor,
    settledNetMinor: result.settlementReplay.settledNetMinor,
    falsePositive: result.settlementReplay.falsePositive,
  });
}
