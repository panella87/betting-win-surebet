import { createHash } from 'node:crypto';
import type { Blocker, BoundaryResult } from '../contracts/local-types.js';
import { accepted, blocked } from '../contracts/local-types.js';
import type { B1FalsePositiveReport } from './b1-false-positive-report.js';

export interface B1BacktestReportCandidateSummary {
  readonly candidateId: string;
  readonly status: 'accepted' | 'blocked';
  readonly stage:
    | 'gross'
    | 'stake_vector'
    | 'net_economics'
    | 'fillability'
    | 'settlement'
    | 'accepted';
  readonly canonicalEventId?: string;
  readonly marketEquivalenceKey?: string;
  readonly venuePairKey?: string;
  readonly grossSpreadPpm?: bigint;
  readonly netSpreadPpm?: bigint;
  readonly worstCaseNetMinor?: bigint;
  readonly settledNetMinor?: bigint;
  readonly falsePositive?: boolean;
  readonly blockers?: readonly Blocker[];
}

export interface B1BacktestReportMetrics {
  readonly marketsCompared: number;
  readonly uniqueEvents: number;
  readonly venuePairs: number;
  readonly candidateCount: number;
  readonly grossPositiveCount: number;
  readonly netPositiveCount: number;
  readonly fillableCandidateCount: number;
  readonly falsePositiveRate: B1BacktestFalsePositiveRate;
  readonly meanGrossSpreadBps: bigint;
  readonly meanNetSpreadBps: bigint;
  readonly worstCaseNetMinor: bigint;
  readonly settlementMismatchBlockCount: number;
  readonly quoteStalenessBlockCount: number;
  readonly capacityBlockCount: number;
  readonly limitBlockCount: number;
  readonly feeBlockCount: number;
}

export type B1BacktestFalsePositiveRate =
  | {
      readonly status: 'accepted';
      readonly falsePositiveRateBps: bigint;
    }
  | {
      readonly status: 'blocked';
      readonly blockers: readonly Blocker[];
    };

export interface B1BacktestReportInput {
  readonly sourceManifestHash: string;
  readonly upstreamLockFingerprint: string;
  readonly fixtureKind: 'deterministic_b1_multi_venue_fixture';
  readonly runtimeEvidence: false;
  readonly upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1';
  readonly candidateSummaries: readonly B1BacktestReportCandidateSummary[];
  readonly uniqueEventIds: readonly string[];
  readonly falsePositiveReport: BoundaryResult<B1FalsePositiveReport>;
}

export interface B1BacktestReport {
  readonly reportKind: 'deterministic_b1_cross_venue_backtest_report';
  readonly sourceManifestHash: string;
  readonly upstreamLockFingerprint: string;
  readonly fixtureKind: 'deterministic_b1_multi_venue_fixture';
  readonly runtimeEvidence: false;
  readonly upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1';
  readonly runHash: string;
  readonly metrics: B1BacktestReportMetrics;
  readonly candidateSummaries: readonly B1BacktestReportCandidateSummary[];
  readonly falsePositiveReport: BoundaryResult<B1FalsePositiveReport>;
  readonly offlineFalsificationStatus:
    | 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED'
    | 'B1_FALSIFIED_NET_EDGE_DISAPPEARED'
    | 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT';
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
}

export function createB1BacktestReport(input: B1BacktestReportInput): BoundaryResult<B1BacktestReport> {
  if (input.candidateSummaries.length === 0) {
    return blocked(
      'B1_BACKTEST_CANDIDATES_EMPTY',
      'B1 deterministic offline backtesting requires at least one derived candidate summary.',
      'Pinned B1 deterministic fixture rows that derive at least one cross-venue candidate.',
    );
  }

  const normalizedCandidateSummaries: B1BacktestReportCandidateSummary[] = [];
  for (const candidate of input.candidateSummaries) {
    const normalized = normalizeCandidateSummary(candidate);
    if (!normalized.ok) {
      return normalized;
    }
    normalizedCandidateSummaries.push(normalized.value);
  }

  const metrics = calculateMetrics(
    normalizedCandidateSummaries,
    Object.freeze([...new Set(input.uniqueEventIds)]),
    input.falsePositiveReport,
  );
  const reportWithoutHash = Object.freeze({
    reportKind: 'deterministic_b1_cross_venue_backtest_report' as const,
    sourceManifestHash: input.sourceManifestHash,
    upstreamLockFingerprint: input.upstreamLockFingerprint,
    fixtureKind: input.fixtureKind,
    runtimeEvidence: input.runtimeEvidence,
    upstreamReadiness: input.upstreamReadiness,
    metrics,
    candidateSummaries: Object.freeze(normalizedCandidateSummaries),
    falsePositiveReport: input.falsePositiveReport,
    offlineFalsificationStatus: deriveOfflineFalsificationStatus(metrics),
    executable: false as const,
    liveReadiness: 'not_authorized_bws_900_parked' as const,
  });

  return accepted(Object.freeze({
    ...reportWithoutHash,
    runHash: createHash('sha256').update(stableJson(reportWithoutHash)).digest('hex'),
  }));
}

function normalizeCandidateSummary(
  candidate: B1BacktestReportCandidateSummary,
): BoundaryResult<B1BacktestReportCandidateSummary> {
  if (candidate.candidateId.trim().length === 0) {
    return blocked(
      'B1_BACKTEST_CANDIDATE_ID_MISSING',
      'B1 deterministic offline backtesting requires stable non-empty candidate ids.',
      'Stable B1 cross-venue candidate id.',
    );
  }
  if (candidate.status === 'blocked') {
    if (candidate.blockers === undefined || candidate.blockers.length === 0) {
      return blocked(
        'B1_BACKTEST_BLOCKED_CANDIDATE_EVIDENCE_MISSING',
        'B1 deterministic offline backtesting requires blocker evidence for every blocked candidate.',
        'B1 blocker evidence for blocked backtest candidates.',
      );
    }
    return accepted(Object.freeze({
      ...candidate,
      blockers: Object.freeze(candidate.blockers.map((blocker) => Object.freeze({ ...blocker }))),
    }));
  }
  if (candidate.status !== 'accepted') {
    return blocked(
      'B1_BACKTEST_CANDIDATE_STATUS_INVALID',
      'B1 deterministic offline backtesting requires accepted or blocked candidate status.',
      'B1 candidate status accepted or blocked.',
    );
  }
  if (
    candidate.grossSpreadPpm === undefined
    || candidate.netSpreadPpm === undefined
    || candidate.worstCaseNetMinor === undefined
    || candidate.settledNetMinor === undefined
    || candidate.falsePositive === undefined
  ) {
    return blocked(
      'B1_BACKTEST_ACCEPTED_CANDIDATE_METRICS_MISSING',
      'B1 deterministic offline backtesting requires gross, net, settlement and false-positive metrics for accepted candidates.',
      'Complete B1 accepted candidate backtest metrics.',
    );
  }
  if (candidate.blockers !== undefined) {
    return blocked(
      'B1_BACKTEST_ACCEPTED_CANDIDATE_BLOCKERS_UNEXPECTED',
      'B1 deterministic offline backtesting forbids blockers on accepted candidate summaries.',
      'Accepted B1 backtest candidate without blockers.',
    );
  }
  return accepted(Object.freeze({ ...candidate }));
}

function calculateMetrics(
  candidates: readonly B1BacktestReportCandidateSummary[],
  uniqueEventIds: readonly string[],
  falsePositiveReport: BoundaryResult<B1FalsePositiveReport>,
): B1BacktestReportMetrics {
  const acceptedCandidates = candidates.filter((candidate) => candidate.status === 'accepted');
  const positiveGrossCandidates = candidates.filter((candidate) => candidate.grossSpreadPpm !== undefined);
  const positiveNetCandidates = acceptedCandidates.filter((candidate) => (
    candidate.netSpreadPpm !== undefined && candidate.netSpreadPpm > 0n
  ));

  return Object.freeze({
    marketsCompared: candidates.length,
    uniqueEvents: uniqueEventIds.length,
    venuePairs: new Set(candidates.map((candidate) => candidate.venuePairKey).filter(isPresentString)).size,
    candidateCount: candidates.length,
    grossPositiveCount: positiveGrossCandidates.length,
    netPositiveCount: positiveNetCandidates.length,
    fillableCandidateCount: acceptedCandidates.length,
    falsePositiveRate: falsePositiveReport.ok
      ? Object.freeze({ status: 'accepted' as const, falsePositiveRateBps: falsePositiveReport.value.falsePositiveRateBps })
      : Object.freeze({ status: 'blocked' as const, blockers: falsePositiveReport.blockers }),
    meanGrossSpreadBps: meanPpmAsBps(positiveGrossCandidates.map((candidate) => candidate.grossSpreadPpm as bigint)),
    meanNetSpreadBps: meanPpmAsBps(positiveNetCandidates.map((candidate) => candidate.netSpreadPpm as bigint)),
    worstCaseNetMinor: minimumOptionalBigInt(acceptedCandidates.map((candidate) => candidate.worstCaseNetMinor)),
    settlementMismatchBlockCount: countBlockers(candidates, [
      'B1_SETTLEMENT_RULE_MISMATCH',
      'B1_SETTLEMENT_REPLAY_SCENARIO_CONFLICT',
      'B1_SETTLEMENT_REPLAY_CORRECTION_CONFLICT',
    ]),
    quoteStalenessBlockCount: countBlockers(candidates, [
      'B1_QUOTE_AGE_ABOVE_THRESHOLD',
      'B1_RETRIEVAL_LAG_ABOVE_THRESHOLD',
      'B1_QUOTE_AGE_PENALTY_LIMIT_EXCEEDED',
    ]),
    capacityBlockCount: countBlockers(candidates, [
      'B1_CAPACITY_MISSING',
      'B1_STAKE_VECTOR_CAPACITY_EXHAUSTED',
      'B1_STAKE_VECTOR_CAPACITY_INVALID',
    ]),
    limitBlockCount: countBlockers(candidates, [
      'B1_VENUE_LIMIT_MISSING',
      'B1_RESIDUAL_EXPOSURE_LIMIT_EXCEEDED',
      'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
    ]),
    feeBlockCount: countBlockers(candidates, [
      'B1_FEE_MATRIX_ENTRY_MISSING',
      'B1_FEE_MATRIX_ENTRY_DUPLICATE',
      'B1_FEE_CHARGE_INVALID',
    ]),
  });
}

function deriveOfflineFalsificationStatus(metrics: B1BacktestReportMetrics): B1BacktestReport['offlineFalsificationStatus'] {
  if (metrics.fillableCandidateCount > 0) {
    return 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED';
  }
  if (metrics.grossPositiveCount > 0 && metrics.netPositiveCount === 0) {
    return 'B1_FALSIFIED_NET_EDGE_DISAPPEARED';
  }
  return 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT';
}

function countBlockers(
  candidates: readonly B1BacktestReportCandidateSummary[],
  codes: readonly string[],
): number {
  const codeSet = new Set(codes);
  let count = 0;
  for (const candidate of candidates) {
    if (candidate.blockers === undefined) {
      continue;
    }
    for (const blocker of candidate.blockers) {
      if (codeSet.has(blocker.code)) {
        count += 1;
      }
    }
  }
  return count;
}

function meanPpmAsBps(values: readonly bigint[]): bigint {
  if (values.length === 0) {
    return 0n;
  }
  let total = 0n;
  for (const value of values) {
    total += value;
  }
  return (total / BigInt(values.length)) / 100n;
}

function minimumOptionalBigInt(values: readonly (bigint | undefined)[]): bigint {
  let minimum: bigint | undefined;
  for (const value of values) {
    if (value === undefined) {
      continue;
    }
    if (minimum === undefined || value < minimum) {
      minimum = value;
    }
  }
  if (minimum === undefined) {
    return 0n;
  }
  return minimum;
}

function isPresentString(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}

function stableJson(value: unknown): string {
  if (value === undefined) {
    throw new Error('B1 backtest report stable JSON cannot serialize undefined values.');
  }
  if (typeof value === 'bigint') {
    return JSON.stringify({ bigint: value.toString() });
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
