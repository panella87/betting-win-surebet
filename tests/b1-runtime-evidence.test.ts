import test from 'node:test';
import assert from 'node:assert/strict';
import type { B1BacktestReport, B1BacktestReportMetrics } from '../src/reporting/b1-backtest-report.js';
import type {
  B1RuntimeAcceptanceEvidence,
  B1RuntimeAcceptancePolicy,
} from '../src/operations/b1-runtime-evidence.js';
import {
  classifyB1OfflineAcceptanceAndKillCriteria,
  evaluateB1RuntimeEvidenceAcceptance,
} from '../src/operations/b1-runtime-evidence.js';

const RUN_HASH = '1'.repeat(64);

test('BWS-820 classifies accepted offline thresholds without execution or public claims', () => {
  const result = classifyB1OfflineAcceptanceAndKillCriteria(sampleInput({}));

  assert.equal(result.ok, true);
  assert.equal(result.value.status, 'accepted');
  assert.equal(result.value.terminalCode, 'B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET');
  assert.equal(result.value.runtimeEvidence, false);
  assert.equal(result.value.executable, false);
  assert.equal(result.value.liveReadiness, 'not_authorized_bws_900_parked');
  assert.equal(result.value.publicSignals, 'forbidden');
  assert.equal(result.value.metrics.candidateToFillConversionRateBps, 10_000n);
  assert.equal(Object.hasOwn(result.value, 'profitabilityClaim'), false);
  assert.equal(Object.hasOwn(result.value, 'publicSignal'), false);
});

test('BWS-820 runtime evidence gate blocks deterministic fixtures as upstream evidence', () => {
  const result = evaluateB1RuntimeEvidenceAcceptance(sampleInput({
    evidence: sampleEvidence({ inputSource: 'deterministic_fixture' }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.status, 'blocked');
  assert.equal(result.value.terminalCode, 'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT');
  assert.deepEqual(result.value.blockers.map((blocker) => blocker.code), ['B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT']);
});

test('BWS-820 blocks insufficient acceptance coverage with explicit evidence requirements', () => {
  const result = classifyB1OfflineAcceptanceAndKillCriteria(sampleInput({
    report: sampleReport({
      metrics: sampleMetrics({ marketsCompared: 49_999 }),
    }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.status, 'blocked');
  assert.equal(result.value.terminalCode, 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT');
  assert.equal(result.value.blockers[0]?.code, 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT');
});

test('BWS-820 falsifies the B1 hypothesis when net edge disappears', () => {
  const result = classifyB1OfflineAcceptanceAndKillCriteria(sampleInput({
    report: sampleReport({
      metrics: sampleMetrics({
        netPositiveCount: 0,
        worstCaseNetMinor: 0n,
      }),
      offlineFalsificationStatus: 'B1_FALSIFIED_NET_EDGE_DISAPPEARED',
    }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.status, 'falsified');
  assert.equal(result.value.terminalCode, 'B1_FALSIFIED_NET_EDGE_DISAPPEARED');
  assert.deepEqual(result.value.killCriteria, ['B1_FALSIFIED_NET_EDGE_DISAPPEARED']);
});

test('BWS-820 maps kill criteria to deterministic terminal outcomes', () => {
  const cases = [
    {
      name: 'quote staleness',
      input: sampleInput({
        report: sampleReport({
          metrics: sampleMetrics({ quoteStalenessBlockCount: 1 }),
        }),
      }),
      terminalCode: 'B1_KILLED_QUOTE_STALENESS_EXPLAINS_GROSS_EDGE',
    },
    {
      name: 'false positives',
      input: sampleInput({
        report: sampleReport({
          metrics: sampleMetrics({
            falsePositiveRate: Object.freeze({
              falsePositiveRateBps: 501n,
              status: 'accepted' as const,
            }),
          }),
        }),
      }),
      terminalCode: 'B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH',
    },
    {
      name: 'capital lock',
      input: sampleInput({
        evidence: sampleEvidence({ capitalUtilizationBps: 9_001n }),
      }),
      terminalCode: 'B1_KILLED_CAPITAL_LOCK_UNACCEPTABLE',
    },
  ] as const;

  for (const entry of cases) {
    const result = classifyB1OfflineAcceptanceAndKillCriteria(entry.input);
    assert.equal(result.ok, true, entry.name);
    assert.equal(result.value.status, 'killed', entry.name);
    assert.equal(result.value.terminalCode, entry.terminalCode, entry.name);
    assert.deepEqual(result.value.killCriteria, [entry.terminalCode], entry.name);
  }
});

test('BWS-820 maps operational blockers to deterministic terminal outcomes', () => {
  const cases = [
    {
      input: sampleInput({
        report: sampleReport({
          metrics: sampleMetrics({ capacityBlockCount: 1 }),
        }),
      }),
      terminalCode: 'B1_BLOCKED_CAPACITY_OR_LIMITS',
    },
    {
      input: sampleInput({
        report: sampleReport({
          metrics: sampleMetrics({ settlementMismatchBlockCount: 1 }),
        }),
      }),
      terminalCode: 'B1_BLOCKED_SETTLEMENT_COMPATIBILITY',
    },
    {
      input: sampleInput({
        report: sampleReport({
          metrics: sampleMetrics({
            candidateCount: 10,
            fillableCandidateCount: 1,
          }),
        }),
      }),
      terminalCode: 'B1_BLOCKED_FILLABILITY_EVIDENCE',
    },
  ] as const;

  for (const entry of cases) {
    const result = classifyB1OfflineAcceptanceAndKillCriteria(entry.input);
    assert.equal(result.ok, true);
    assert.equal(result.value.status, 'blocked');
    assert.equal(result.value.terminalCode, entry.terminalCode);
    assert.equal(result.value.blockers.length > 0, true);
  }
});

test('BWS-820 blocks ambiguous false-positive denominators', () => {
  const result = classifyB1OfflineAcceptanceAndKillCriteria(sampleInput({
    report: sampleReport({
      metrics: sampleMetrics({
        falsePositiveRate: Object.freeze({
          blockers: Object.freeze([
            Object.freeze({
              code: 'B1_FALSE_POSITIVE_RATE_DENOMINATOR_MISSING',
              evidenceRequired: 'B1 accepted or blocked false-positive denominator evidence.',
              message: 'B1 false-positive rate denominator is missing.',
            }),
          ]),
          status: 'blocked' as const,
        }),
      }),
    }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.status, 'blocked');
  assert.equal(result.value.terminalCode, 'B1_BLOCKED_SETTLEMENT_COMPATIBILITY');
  assert.equal(result.value.blockers[0]?.code, 'B1_FALSE_POSITIVE_RATE_DENOMINATOR_MISSING');
});

function sampleInput(
  overrides: Partial<{
    readonly report: B1BacktestReport;
    readonly evidence: B1RuntimeAcceptanceEvidence;
    readonly policy: B1RuntimeAcceptancePolicy;
  }>,
) {
  const report = overrides.report;
  const evidence = overrides.evidence;
  const policy = overrides.policy;
  return Object.freeze({
    report: report === undefined ? sampleReport({}) : report,
    evidence: evidence === undefined ? sampleEvidence({}) : evidence,
    policy: policy === undefined ? samplePolicy({}) : policy,
  });
}

function sampleReport(overrides: Partial<B1BacktestReport>): B1BacktestReport {
  return Object.freeze({
    candidateSummaries: Object.freeze([]),
    executable: false,
    falsePositiveReport: Object.freeze({
      ok: true as const,
      value: Object.freeze({
        acceptedSettlementCount: 1,
        blockedSettlementCount: 0,
        candidateCount: 1,
        executable: false,
        falsePositiveCount: 0,
        falsePositiveRateBps: 0n,
        liveReadiness: 'not_authorized_bws_900_parked' as const,
        observations: Object.freeze([
          Object.freeze({
            candidateId: 'candidate-b1-accepted',
            falsePositive: false,
            settledNetMinor: 1n,
            settlementStatus: 'accepted' as const,
          }),
        ]),
        reportKind: 'deterministic_b1_false_positive_report' as const,
        settlementCompatibilityBlockCount: 0,
        settlementMismatchBlockCount: 0,
        voidRuleMismatchBlockCount: 0,
      }),
    }),
    fixtureKind: 'deterministic_b1_multi_venue_fixture',
    liveReadiness: 'not_authorized_bws_900_parked',
    metrics: sampleMetrics({}),
    offlineFalsificationStatus: 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
    reportKind: 'deterministic_b1_cross_venue_backtest_report',
    runHash: RUN_HASH,
    runtimeEvidence: false,
    sourceManifestHash: '2'.repeat(64),
    upstreamLockFingerprint: '3'.repeat(64),
    upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1',
    ...overrides,
  });
}

function sampleMetrics(overrides: Partial<B1BacktestReportMetrics>): B1BacktestReportMetrics {
  return Object.freeze({
    candidateCount: 50_000,
    capacityBlockCount: 0,
    falsePositiveRate: Object.freeze({
      falsePositiveRateBps: 0n,
      status: 'accepted' as const,
    }),
    feeBlockCount: 0,
    fillableCandidateCount: 50_000,
    grossPositiveCount: 50_000,
    limitBlockCount: 0,
    marketsCompared: 50_000,
    meanGrossSpreadBps: 12n,
    meanNetSpreadBps: 5n,
    netPositiveCount: 50_000,
    quoteStalenessBlockCount: 0,
    settlementMismatchBlockCount: 0,
    uniqueEvents: 8_000,
    venuePairs: 3,
    worstCaseNetMinor: 1n,
    ...overrides,
  });
}

function sampleEvidence(overrides: Partial<B1RuntimeAcceptanceEvidence>): B1RuntimeAcceptanceEvidence {
  return Object.freeze({
    capitalUtilizationBps: 2_500n,
    dataWindowDays: 730,
    evidenceKind: 'deterministic_b1_runtime_acceptance_evidence',
    inputSource: 'accepted_betting_win_b1_multi_venue_markets_v1',
    marketTypes: Object.freeze(['moneyline', 'spread', 'totals']),
    rerunRunHashes: Object.freeze([RUN_HASH, RUN_HASH, RUN_HASH]),
    sports: Object.freeze(['soccer', 'nba', 'mlb']),
    ...overrides,
  });
}

function samplePolicy(overrides: Partial<B1RuntimeAcceptancePolicy>): B1RuntimeAcceptancePolicy {
  return Object.freeze({
    maximumCapitalUtilizationBps: 9_000n,
    maximumCapacityBlockCount: 0,
    maximumFalsePositiveRateBps: 500n,
    maximumFeeBlockCount: 0,
    maximumLimitBlockCount: 0,
    maximumQuoteStalenessBlockCount: 0,
    minimumCandidateToFillConversionRateBps: 5_000n,
    minimumDataWindowDays: 730,
    minimumMarketsCompared: 50_000,
    minimumUniqueEvents: 8_000,
    minimumVenuePairs: 3,
    minimumWorstCaseNetMinor: 1n,
    requiredMarketTypes: Object.freeze(['moneyline', 'spread', 'totals']),
    requiredSports: Object.freeze(['soccer', 'nba', 'mlb']),
    rerunsRequired: 3,
    ...overrides,
  });
}
