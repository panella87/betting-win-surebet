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
  if (typeof input !== 'object' || input === null) {
    return blocked(
      'B1_BACKTEST_REPORT_INPUT_INVALID',
      'B1 deterministic offline backtest report requires an explicit input object.',
      'Object-shaped B1 backtest report input.',
    );
  }
  const markerValidation = validateReportMarkers(input);
  if (!markerValidation.ok) {
    return markerValidation;
  }
  if (!Array.isArray(input.candidateSummaries)) {
    return blocked(
      'B1_BACKTEST_CANDIDATES_INVALID',
      'B1 deterministic offline backtesting requires candidate summaries as an array.',
      'B1 candidate summary array.',
    );
  }
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

  const uniqueEventIds = normalizeUniqueEventIds(input.uniqueEventIds);
  if (!uniqueEventIds.ok) {
    return uniqueEventIds;
  }

  const metrics = calculateMetrics(
    normalizedCandidateSummaries,
    uniqueEventIds.value,
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

function validateReportMarkers(input: B1BacktestReportInput): BoundaryResult<undefined> {
  if (!isSha256(input.sourceManifestHash)) {
    return blocked(
      'B1_BACKTEST_SOURCE_MANIFEST_HASH_INVALID',
      'B1 deterministic offline backtest report requires a 64-hex source manifest hash.',
      'B1 source manifest SHA-256 hash.',
    );
  }
  if (!isSha256(input.upstreamLockFingerprint)) {
    return blocked(
      'B1_BACKTEST_UPSTREAM_LOCK_FINGERPRINT_INVALID',
      'B1 deterministic offline backtest report requires a 64-hex upstream lock fingerprint.',
      'B1 upstream lock fingerprint SHA-256 hash.',
    );
  }
  if (input.fixtureKind !== 'deterministic_b1_multi_venue_fixture') {
    return blocked(
      'B1_BACKTEST_FIXTURE_KIND_INVALID',
      'B1 deterministic offline backtest report requires the deterministic B1 fixture kind.',
      'B1 deterministic fixtureKind marker.',
    );
  }
  if (input.runtimeEvidence !== false) {
    return blocked(
      'B1_BACKTEST_RUNTIME_EVIDENCE_FORBIDDEN',
      'B1 deterministic offline backtest report must not claim runtime evidence.',
      'B1 report with runtimeEvidence=false.',
    );
  }
  if (input.upstreamReadiness !== 'blocked_until_betting_win_b1_multi_venue_markets_v1') {
    return blocked(
      'B1_BACKTEST_UPSTREAM_READINESS_INVALID',
      'B1 deterministic offline backtest report must preserve the real upstream B1 API blocker.',
      'B1 upstreamReadiness blocked until betting-win exposes the accepted B1 resource.',
    );
  }
  if (!Array.isArray(input.uniqueEventIds)) {
    return blocked(
      'B1_BACKTEST_UNIQUE_EVENTS_INVALID',
      'B1 deterministic offline backtest report requires unique event ids as an array.',
      'B1 unique event id array.',
    );
  }
  if (
    typeof input.falsePositiveReport !== 'object'
    || input.falsePositiveReport === null
    || typeof input.falsePositiveReport.ok !== 'boolean'
  ) {
    return blocked(
      'B1_BACKTEST_FALSE_POSITIVE_REPORT_INVALID',
      'B1 deterministic offline backtest report requires a validated false-positive report boundary result.',
      'Validated B1 false-positive report boundary result.',
    );
  }
  if (input.falsePositiveReport.ok) {
    if (
      typeof input.falsePositiveReport.value !== 'object'
      || input.falsePositiveReport.value === null
      || typeof input.falsePositiveReport.value.falsePositiveRateBps !== 'bigint'
    ) {
      return blocked(
        'B1_BACKTEST_FALSE_POSITIVE_REPORT_INVALID',
        'B1 deterministic offline backtest report requires accepted false-positive metrics.',
        'Accepted B1 false-positive report with bigint rate metrics.',
      );
    }
  } else if (!Array.isArray(input.falsePositiveReport.blockers)) {
    return blocked(
      'B1_BACKTEST_FALSE_POSITIVE_REPORT_INVALID',
      'B1 deterministic offline backtest report requires blocker evidence for blocked false-positive reports.',
      'Blocked B1 false-positive report with blockers.',
    );
  }
  return accepted(undefined);
}

function normalizeUniqueEventIds(uniqueEventIds: readonly string[]): BoundaryResult<readonly string[]> {
  const normalized: string[] = [];
  for (const eventId of uniqueEventIds) {
    if (typeof eventId !== 'string' || eventId.trim().length === 0) {
      return blocked(
        'B1_BACKTEST_UNIQUE_EVENT_ID_INVALID',
        'B1 deterministic offline backtest report requires non-empty unique event ids.',
        'B1 unique event ids without blank or invalid values.',
      );
    }
    normalized.push(eventId.trim());
  }
  return accepted(Object.freeze([...new Set(normalized)]));
}

function normalizeCandidateSummary(
  candidate: B1BacktestReportCandidateSummary,
): BoundaryResult<B1BacktestReportCandidateSummary> {
  if (typeof candidate !== 'object' || candidate === null) {
    return blocked(
      'B1_BACKTEST_CANDIDATE_INVALID',
      'B1 deterministic offline backtesting requires object-shaped candidate summaries.',
      'Object-shaped B1 candidate summary.',
    );
  }
  if (typeof candidate.candidateId !== 'string' || candidate.candidateId.trim().length === 0) {
    return blocked(
      'B1_BACKTEST_CANDIDATE_ID_MISSING',
      'B1 deterministic offline backtesting requires stable non-empty candidate ids.',
      'Stable B1 cross-venue candidate id.',
    );
  }
  if (candidate.status === 'blocked') {
    const markerValidation = validateCandidateMarkers(candidate, false);
    if (!markerValidation.ok) {
      return markerValidation;
    }
    if (candidate.stage === 'accepted') {
      return blocked(
        'B1_BACKTEST_CANDIDATE_STAGE_INVALID',
        'Blocked B1 backtest candidates must carry the blocked stage that produced blocker evidence.',
        'Blocked B1 candidate summary with a non-accepted stage.',
      );
    }
    if (candidate.blockers === undefined || candidate.blockers.length === 0) {
      return blocked(
        'B1_BACKTEST_BLOCKED_CANDIDATE_EVIDENCE_MISSING',
        'B1 deterministic offline backtesting requires blocker evidence for every blocked candidate.',
        'B1 blocker evidence for blocked backtest candidates.',
      );
    }
    return accepted(Object.freeze({
      ...candidate,
      candidateId: candidate.candidateId.trim(),
      blockers: Object.freeze(candidate.blockers.map((blocker) => Object.freeze({ ...blocker }))),
      ...markerValidation.value,
    }));
  }
  if (candidate.status !== 'accepted') {
    return blocked(
      'B1_BACKTEST_CANDIDATE_STATUS_INVALID',
      'B1 deterministic offline backtesting requires accepted or blocked candidate status.',
      'B1 candidate status accepted or blocked.',
    );
  }
  if (candidate.stage !== 'accepted') {
    return blocked(
      'B1_BACKTEST_CANDIDATE_STAGE_INVALID',
      'Accepted B1 backtest candidates must carry the accepted stage marker.',
      'Accepted B1 candidate summary with stage=accepted.',
    );
  }
  const markerValidation = validateCandidateMarkers(candidate, true);
  if (!markerValidation.ok) {
    return markerValidation;
  }
  if (
    typeof candidate.grossSpreadPpm !== 'bigint'
    || typeof candidate.netSpreadPpm !== 'bigint'
    || typeof candidate.worstCaseNetMinor !== 'bigint'
    || typeof candidate.settledNetMinor !== 'bigint'
    || typeof candidate.falsePositive !== 'boolean'
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
  return accepted(Object.freeze({
    ...candidate,
    candidateId: candidate.candidateId.trim(),
    ...markerValidation.value,
  }));
}

function validateCandidateMarkers(
  candidate: B1BacktestReportCandidateSummary,
  requireAllMarkers: boolean,
): BoundaryResult<Partial<B1BacktestReportCandidateSummary>> {
  const normalized: {
    canonicalEventId?: string;
    marketEquivalenceKey?: string;
    venuePairKey?: string;
  } = {};
  for (const field of ['canonicalEventId', 'marketEquivalenceKey', 'venuePairKey'] as const) {
    const value = candidate[field];
    if (value === undefined) {
      if (requireAllMarkers) {
        return blocked(
          'B1_BACKTEST_CANDIDATE_MARKER_INVALID',
          'B1 backtest candidate summary markers must be present as non-empty strings.',
          'Required non-empty B1 candidate canonical event, market equivalence and venue pair markers.',
        );
      }
      continue;
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      return blocked(
        'B1_BACKTEST_CANDIDATE_MARKER_INVALID',
        requireAllMarkers
          ? 'B1 backtest candidate summary markers must be present as non-empty strings.'
          : 'B1 backtest candidate summary markers must be non-empty strings when present.',
        requireAllMarkers
          ? 'Required non-empty B1 candidate canonical event, market equivalence and venue pair markers.'
          : 'Non-empty B1 candidate canonical event, market equivalence and venue pair markers.',
      );
    }
    normalized[field] = value.trim();
  }
  return accepted(Object.freeze(normalized));
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

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
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
