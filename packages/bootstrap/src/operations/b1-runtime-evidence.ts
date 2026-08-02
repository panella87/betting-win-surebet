import type { B1BacktestReport } from '../reporting/b1-backtest-report.js';
import type { Blocker, BoundaryResult } from '../contracts/local-types.js';
import { accepted, blocked } from '../contracts/local-types.js';

export type B1RuntimeEvidenceInputSource =
  | 'deterministic_fixture'
  | 'accepted_betting_win_b1_multi_venue_markets_v1';

export interface B1RuntimeAcceptanceEvidence {
  readonly evidenceKind: 'deterministic_b1_runtime_acceptance_evidence';
  readonly inputSource: B1RuntimeEvidenceInputSource;
  readonly dataWindowDays: number;
  readonly sports: readonly string[];
  readonly marketTypes: readonly string[];
  readonly rerunRunHashes: readonly string[];
  readonly capitalUtilizationBps: bigint;
}

export interface B1RuntimeAcceptancePolicy {
  readonly minimumDataWindowDays: number;
  readonly minimumMarketsCompared: number;
  readonly minimumUniqueEvents: number;
  readonly minimumVenuePairs: number;
  readonly requiredSports: readonly string[];
  readonly requiredMarketTypes: readonly string[];
  readonly rerunsRequired: number;
  readonly minimumWorstCaseNetMinor: bigint;
  readonly minimumCandidateToFillConversionRateBps: bigint;
  readonly maximumFalsePositiveRateBps: bigint;
  readonly maximumCapitalUtilizationBps: bigint;
  readonly maximumQuoteStalenessBlockCount: number;
  readonly maximumCapacityBlockCount: number;
  readonly maximumLimitBlockCount: number;
  readonly maximumFeeBlockCount: number;
}

export interface B1RuntimeAcceptanceInput {
  readonly report: B1BacktestReport;
  readonly evidence: B1RuntimeAcceptanceEvidence;
  readonly policy: B1RuntimeAcceptancePolicy;
}

export type B1RuntimeAcceptanceStatus = 'accepted' | 'falsified' | 'killed' | 'blocked';

export type B1RuntimeAcceptanceTerminalCode =
  | 'B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET'
  | 'B1_FALSIFIED_NET_EDGE_DISAPPEARED'
  | 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT'
  | 'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT'
  | 'B1_BLOCKED_SETTLEMENT_COMPATIBILITY'
  | 'B1_BLOCKED_FILLABILITY_EVIDENCE'
  | 'B1_BLOCKED_CAPACITY_OR_LIMITS'
  | 'B1_KILLED_QUOTE_STALENESS_EXPLAINS_GROSS_EDGE'
  | 'B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH'
  | 'B1_KILLED_CAPITAL_LOCK_UNACCEPTABLE';

export interface B1RuntimeAcceptanceMetrics {
  readonly marketsCompared: number;
  readonly uniqueEvents: number;
  readonly venuePairs: number;
  readonly candidateCount: number;
  readonly grossPositiveCount: number;
  readonly netPositiveCount: number;
  readonly fillableCandidateCount: number;
  readonly candidateToFillConversionRateBps: bigint;
  readonly falsePositiveRate:
    | {
        readonly status: 'accepted';
        readonly falsePositiveRateBps: bigint;
      }
    | {
        readonly status: 'blocked';
        readonly blockers: readonly Blocker[];
      };
  readonly worstCaseNetMinor: bigint;
  readonly settlementMismatchBlockCount: number;
  readonly quoteStalenessBlockCount: number;
  readonly capacityBlockCount: number;
  readonly limitBlockCount: number;
  readonly feeBlockCount: number;
  readonly capitalUtilizationBps: bigint;
}

export interface B1RuntimeAcceptanceDecision {
  readonly decisionKind: 'deterministic_b1_runtime_evidence_acceptance_v1';
  readonly status: B1RuntimeAcceptanceStatus;
  readonly terminalCode: B1RuntimeAcceptanceTerminalCode;
  readonly blockers: readonly Blocker[];
  readonly killCriteria: readonly B1RuntimeAcceptanceTerminalCode[];
  readonly metrics: B1RuntimeAcceptanceMetrics;
  readonly inputSource: B1RuntimeEvidenceInputSource;
  readonly runtimeEvidence: false;
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
  readonly publicSignals: 'forbidden';
}

export function classifyB1OfflineAcceptanceAndKillCriteria(
  input: B1RuntimeAcceptanceInput,
): BoundaryResult<B1RuntimeAcceptanceDecision> {
  const validation = validateB1RuntimeAcceptanceInput(input);
  if (!validation.ok) {
    return validation;
  }

  const metrics = runtimeAcceptanceMetrics(input);
  const dataBlockers = dataCoverageBlockers(input, metrics);
  if (dataBlockers.length > 0) {
    return accepted(decision(input, metrics, 'blocked', 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT', dataBlockers, []));
  }
  if (metrics.falsePositiveRate.status === 'blocked') {
    return accepted(
      decision(
        input,
        metrics,
        'blocked',
        'B1_BLOCKED_SETTLEMENT_COMPATIBILITY',
        metrics.falsePositiveRate.blockers,
        [],
      ),
    );
  }
  if (metrics.falsePositiveRate.falsePositiveRateBps > input.policy.maximumFalsePositiveRateBps) {
    return accepted(
      decision(
        input,
        metrics,
        'killed',
        'B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH',
        [],
        ['B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH'],
      ),
    );
  }
  if (
    input.report.offlineFalsificationStatus === 'B1_FALSIFIED_NET_EDGE_DISAPPEARED'
    || metrics.netPositiveCount === 0
    || metrics.worstCaseNetMinor < input.policy.minimumWorstCaseNetMinor
  ) {
    return accepted(
      decision(
        input,
        metrics,
        'falsified',
        'B1_FALSIFIED_NET_EDGE_DISAPPEARED',
        [],
        ['B1_FALSIFIED_NET_EDGE_DISAPPEARED'],
      ),
    );
  }
  if (metrics.quoteStalenessBlockCount > input.policy.maximumQuoteStalenessBlockCount) {
    return accepted(
      decision(
        input,
        metrics,
        'killed',
        'B1_KILLED_QUOTE_STALENESS_EXPLAINS_GROSS_EDGE',
        [],
        ['B1_KILLED_QUOTE_STALENESS_EXPLAINS_GROSS_EDGE'],
      ),
    );
  }
  if (
    metrics.capacityBlockCount > input.policy.maximumCapacityBlockCount
    || metrics.limitBlockCount > input.policy.maximumLimitBlockCount
    || metrics.feeBlockCount > input.policy.maximumFeeBlockCount
  ) {
    return accepted(
      decision(
        input,
        metrics,
        'blocked',
        'B1_BLOCKED_CAPACITY_OR_LIMITS',
        [blocker(
          'B1_BLOCKED_CAPACITY_OR_LIMITS',
          'B1 acceptance requires capacity, venue limits and fee blockers to remain within explicit policy.',
          'Accepted B1 capacity, venue-limit and fee blocker thresholds.',
        )],
        [],
      ),
    );
  }
  if (metrics.candidateToFillConversionRateBps < input.policy.minimumCandidateToFillConversionRateBps) {
    return accepted(
      decision(
        input,
        metrics,
        'blocked',
        'B1_BLOCKED_FILLABILITY_EVIDENCE',
        [blocker(
          'B1_BLOCKED_FILLABILITY_EVIDENCE',
          'B1 acceptance requires the fillable-candidate conversion rate to meet explicit policy.',
          'Conservative B1 fillability evidence above the configured threshold.',
        )],
        [],
      ),
    );
  }
  if (metrics.capitalUtilizationBps > input.policy.maximumCapitalUtilizationBps) {
    return accepted(
      decision(
        input,
        metrics,
        'killed',
        'B1_KILLED_CAPITAL_LOCK_UNACCEPTABLE',
        [],
        ['B1_KILLED_CAPITAL_LOCK_UNACCEPTABLE'],
      ),
    );
  }
  if (metrics.settlementMismatchBlockCount > 0) {
    return accepted(
      decision(
        input,
        metrics,
        'blocked',
        'B1_BLOCKED_SETTLEMENT_COMPATIBILITY',
        [blocker(
          'B1_BLOCKED_SETTLEMENT_COMPATIBILITY',
          'B1 acceptance requires settlement and void-rule compatibility blockers to be absent.',
          'Accepted settlement compatibility and void-rule replay evidence.',
        )],
        [],
      ),
    );
  }

  return accepted(decision(input, metrics, 'accepted', 'B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET', [], []));
}

export function evaluateB1RuntimeEvidenceAcceptance(
  input: B1RuntimeAcceptanceInput,
): BoundaryResult<B1RuntimeAcceptanceDecision> {
  const validation = validateB1RuntimeAcceptanceInput(input);
  if (!validation.ok) {
    return validation;
  }
  const metrics = runtimeAcceptanceMetrics(input);
  if (input.evidence.inputSource === 'deterministic_fixture') {
    return accepted(
      decision(
        input,
        metrics,
        'blocked',
        'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT',
        [blocker(
          'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT',
          'B1 runtime evidence cannot be accepted from deterministic fixtures.',
          'Accepted betting-win.b1_multi_venue_markets.v1 read-only API evidence.',
        )],
        [],
      ),
    );
  }
  return classifyB1OfflineAcceptanceAndKillCriteria(input);
}

function validateB1RuntimeAcceptanceInput(input: B1RuntimeAcceptanceInput): BoundaryResult<undefined> {
  if (typeof input !== 'object' || input === null) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_INPUT_MISSING',
      'B1 runtime evidence acceptance requires an explicit report, evidence and policy.',
      'Explicit B1 runtime acceptance input.',
    );
  }
  const reportValidation = validateReportBoundary(input.report);
  if (!reportValidation.ok) {
    return reportValidation;
  }
  const evidenceValidation = validateEvidence(input.evidence);
  if (!evidenceValidation.ok) {
    return evidenceValidation;
  }
  return validatePolicy(input.policy);
}

function validateReportBoundary(report: B1BacktestReport): BoundaryResult<undefined> {
  if (typeof report !== 'object' || report === null) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_REPORT_MISSING',
      'B1 runtime evidence acceptance requires a deterministic B1 backtest report.',
      'Deterministic B1 backtest report.',
    );
  }
  if (report.runtimeEvidence !== false || report.executable !== false) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_POLICY_VIOLATION',
      'B1 acceptance reports must keep runtime evidence and execution disabled until upstream and BWS-900 gates are met.',
      'B1 report with runtimeEvidence=false and executable=false.',
    );
  }
  if (report.liveReadiness !== 'not_authorized_bws_900_parked') {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_LIVE_READINESS_FORBIDDEN',
      'B1 runtime evidence acceptance must preserve the parked BWS-900 live-readiness gate.',
      'B1 report with liveReadiness=not_authorized_bws_900_parked.',
    );
  }
  if (Object.hasOwn(report, 'profitabilityClaim') || Object.hasOwn(report, 'publicSignal')) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_PUBLIC_CLAIM_FORBIDDEN',
      'B1 acceptance evidence must not contain profitability or public-signal fields.',
      'Private B1 research evidence without profitabilityClaim or publicSignal fields.',
    );
  }
  return accepted(undefined);
}

function validateEvidence(evidence: B1RuntimeAcceptanceEvidence): BoundaryResult<undefined> {
  if (typeof evidence !== 'object' || evidence === null) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_EVIDENCE_MISSING',
      'B1 runtime evidence acceptance requires explicit coverage evidence.',
      'B1 runtime acceptance evidence.',
    );
  }
  if (evidence.evidenceKind !== 'deterministic_b1_runtime_acceptance_evidence') {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_EVIDENCE_KIND_INVALID',
      'B1 runtime evidence acceptance requires the exact evidence schema marker.',
      'deterministic_b1_runtime_acceptance_evidence.',
    );
  }
  if (
    evidence.inputSource !== 'deterministic_fixture'
    && evidence.inputSource !== 'accepted_betting_win_b1_multi_venue_markets_v1'
  ) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_INPUT_SOURCE_INVALID',
      'B1 runtime evidence acceptance requires an explicit fixture or accepted upstream B1 input source.',
      'deterministic_fixture or accepted_betting_win_b1_multi_venue_markets_v1.',
    );
  }
  if (!isNonNegativeInteger(evidence.dataWindowDays)) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_DATA_WINDOW_INVALID',
      'B1 runtime evidence acceptance requires an explicit non-negative integer data-window day count.',
      'Non-negative integer B1 dataWindowDays.',
    );
  }
  if (!Array.isArray(evidence.sports) || !Array.isArray(evidence.marketTypes) || !Array.isArray(evidence.rerunRunHashes)) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_COVERAGE_ARRAYS_INVALID',
      'B1 runtime evidence acceptance requires explicit sports, marketTypes and rerunRunHashes arrays.',
      'B1 coverage arrays.',
    );
  }
  for (const runHash of evidence.rerunRunHashes) {
    if (!isSha256(runHash)) {
      return blocked(
        'B1_RUNTIME_ACCEPTANCE_RERUN_HASH_INVALID',
        'B1 runtime evidence acceptance requires every rerun hash to be a SHA-256 value.',
        'B1 deterministic rerun report hashes.',
      );
    }
  }
  if (evidence.capitalUtilizationBps < 0n) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_CAPITAL_UTILIZATION_INVALID',
      'B1 runtime evidence acceptance requires non-negative capital utilization.',
      'B1 capital utilization in basis points.',
    );
  }
  return accepted(undefined);
}

function validatePolicy(policy: B1RuntimeAcceptancePolicy): BoundaryResult<undefined> {
  if (typeof policy !== 'object' || policy === null) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_POLICY_MISSING',
      'B1 runtime evidence acceptance requires an explicit acceptance policy.',
      'B1 runtime acceptance policy.',
    );
  }
  for (const [key, value] of [
    ['minimumDataWindowDays', policy.minimumDataWindowDays],
    ['minimumMarketsCompared', policy.minimumMarketsCompared],
    ['minimumUniqueEvents', policy.minimumUniqueEvents],
    ['minimumVenuePairs', policy.minimumVenuePairs],
    ['rerunsRequired', policy.rerunsRequired],
    ['maximumQuoteStalenessBlockCount', policy.maximumQuoteStalenessBlockCount],
    ['maximumCapacityBlockCount', policy.maximumCapacityBlockCount],
    ['maximumLimitBlockCount', policy.maximumLimitBlockCount],
    ['maximumFeeBlockCount', policy.maximumFeeBlockCount],
  ] as const) {
    if (!isNonNegativeInteger(value)) {
      return blocked(
        'B1_RUNTIME_ACCEPTANCE_POLICY_INTEGER_INVALID',
        `B1 runtime evidence acceptance policy requires ${key} to be a non-negative integer.`,
        `Non-negative integer ${key}.`,
      );
    }
  }
  if (!Array.isArray(policy.requiredSports) || !Array.isArray(policy.requiredMarketTypes)) {
    return blocked(
      'B1_RUNTIME_ACCEPTANCE_POLICY_COVERAGE_INVALID',
      'B1 runtime evidence acceptance policy requires explicit requiredSports and requiredMarketTypes arrays.',
      'B1 required sports and market types.',
    );
  }
  for (const [key, value] of [
    ['minimumWorstCaseNetMinor', policy.minimumWorstCaseNetMinor],
    ['minimumCandidateToFillConversionRateBps', policy.minimumCandidateToFillConversionRateBps],
    ['maximumFalsePositiveRateBps', policy.maximumFalsePositiveRateBps],
    ['maximumCapitalUtilizationBps', policy.maximumCapitalUtilizationBps],
  ] as const) {
    if (value < 0n) {
      return blocked(
        'B1_RUNTIME_ACCEPTANCE_POLICY_BIGINT_INVALID',
        `B1 runtime evidence acceptance policy requires ${key} to be non-negative.`,
        `Non-negative ${key}.`,
      );
    }
  }
  return accepted(undefined);
}

function dataCoverageBlockers(
  input: B1RuntimeAcceptanceInput,
  metrics: B1RuntimeAcceptanceMetrics,
): readonly Blocker[] {
  const blockers: Blocker[] = [];
  if (input.evidence.dataWindowDays < input.policy.minimumDataWindowDays) {
    blockers.push(blocker(
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
      'B1 acceptance requires the explicit data window to meet policy.',
      'B1 data-window coverage at or above the minimum.',
    ));
  }
  if (metrics.marketsCompared < input.policy.minimumMarketsCompared) {
    blockers.push(blocker(
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
      'B1 acceptance requires the compared-market count to meet policy.',
      'B1 compared-market count at or above the minimum.',
    ));
  }
  if (metrics.uniqueEvents < input.policy.minimumUniqueEvents) {
    blockers.push(blocker(
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
      'B1 acceptance requires the unique-event count to meet policy.',
      'B1 unique-event count at or above the minimum.',
    ));
  }
  if (metrics.venuePairs < input.policy.minimumVenuePairs) {
    blockers.push(blocker(
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
      'B1 acceptance requires the venue-pair count to meet policy.',
      'B1 venue-pair count at or above the minimum.',
    ));
  }
  for (const sport of input.policy.requiredSports) {
    if (!input.evidence.sports.includes(sport)) {
      blockers.push(blocker(
        'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
        'B1 acceptance requires every policy-required sport to be present.',
        `B1 sport coverage including ${sport}.`,
      ));
    }
  }
  for (const marketType of input.policy.requiredMarketTypes) {
    if (!input.evidence.marketTypes.includes(marketType)) {
      blockers.push(blocker(
        'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
        'B1 acceptance requires every policy-required market type to be present.',
        `B1 market-type coverage including ${marketType}.`,
      ));
    }
  }
  if (input.evidence.rerunRunHashes.length < input.policy.rerunsRequired) {
    blockers.push(blocker(
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
      'B1 acceptance requires the configured number of deterministic reruns.',
      'B1 deterministic rerun hashes at or above the required count.',
    ));
  } else if (new Set(input.evidence.rerunRunHashes).size !== 1) {
    blockers.push(blocker(
      'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
      'B1 acceptance requires deterministic reruns to retain the same report hash.',
      'Identical B1 deterministic rerun hashes.',
    ));
  }
  return Object.freeze(blockers);
}

function runtimeAcceptanceMetrics(input: B1RuntimeAcceptanceInput): B1RuntimeAcceptanceMetrics {
  const reportMetrics = input.report.metrics;
  return Object.freeze({
    marketsCompared: reportMetrics.marketsCompared,
    uniqueEvents: reportMetrics.uniqueEvents,
    venuePairs: reportMetrics.venuePairs,
    candidateCount: reportMetrics.candidateCount,
    grossPositiveCount: reportMetrics.grossPositiveCount,
    netPositiveCount: reportMetrics.netPositiveCount,
    fillableCandidateCount: reportMetrics.fillableCandidateCount,
    candidateToFillConversionRateBps: candidateToFillConversionRateBps(
      reportMetrics.fillableCandidateCount,
      reportMetrics.candidateCount,
    ),
    falsePositiveRate: reportMetrics.falsePositiveRate,
    worstCaseNetMinor: reportMetrics.worstCaseNetMinor,
    settlementMismatchBlockCount: reportMetrics.settlementMismatchBlockCount,
    quoteStalenessBlockCount: reportMetrics.quoteStalenessBlockCount,
    capacityBlockCount: reportMetrics.capacityBlockCount,
    limitBlockCount: reportMetrics.limitBlockCount,
    feeBlockCount: reportMetrics.feeBlockCount,
    capitalUtilizationBps: input.evidence.capitalUtilizationBps,
  });
}

function candidateToFillConversionRateBps(fillableCandidateCount: number, candidateCount: number): bigint {
  if (candidateCount === 0) {
    return 0n;
  }
  return (BigInt(fillableCandidateCount) * 10_000n) / BigInt(candidateCount);
}

function decision(
  input: B1RuntimeAcceptanceInput,
  metrics: B1RuntimeAcceptanceMetrics,
  status: B1RuntimeAcceptanceStatus,
  terminalCode: B1RuntimeAcceptanceTerminalCode,
  blockers: readonly Blocker[],
  killCriteria: readonly B1RuntimeAcceptanceTerminalCode[],
): B1RuntimeAcceptanceDecision {
  return Object.freeze({
    decisionKind: 'deterministic_b1_runtime_evidence_acceptance_v1',
    status,
    terminalCode,
    blockers: Object.freeze(blockers.map((entry) => Object.freeze({ ...entry }))),
    killCriteria: Object.freeze([...killCriteria]),
    metrics,
    inputSource: input.evidence.inputSource,
    runtimeEvidence: false,
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
    publicSignals: 'forbidden',
  });
}

function blocker(code: string, message: string, evidenceRequired: string): Blocker {
  return Object.freeze({ code, message, evidenceRequired });
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0;
}

function isSha256(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
