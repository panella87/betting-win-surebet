import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlockedOpportunityReport,
  createPrivateOpportunityReport,
} from '../src/reporting/opportunity-report.js';
import { summarizeBlockers } from '../src/reporting/blocker-report.js';
import { createPrivateRunReport } from '../src/reporting/private-run-report.js';

test('private report records blockers without acceptance claim', () => {
  const blockers = [{ code: 'UPSTREAM_CONTRACT_MISSING', message: 'missing', evidenceRequired: 'pinned export' }];
  const report = createBlockedOpportunityReport('candidate-001', blockers);
  assert.equal(report.accepted, false);
  assert.equal(report.reportKind, 'private_paper_blocked');
  assert.equal(report.status, 'blocked');
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.blockers), true);
  assert.match(summarizeBlockers(report.blockers), /UPSTREAM_CONTRACT_MISSING/);
  assertNoForbiddenReportLanguage(report);
});

test('private opportunity report assembles deterministic local stake and residual summaries', () => {
  const report = createPrivateOpportunityReport(
    'candidate-002',
    {
      stakes: Object.freeze([
        Object.freeze({ legId: 'market-001:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
        Object.freeze({ legId: 'market-001:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
      ]),
      scenarioNets: Object.freeze([
        Object.freeze({ scenarioId: 'no_wins', netMinor: 15n }),
        Object.freeze({ scenarioId: 'yes_wins', netMinor: 5n }),
      ]),
      worstCaseNetMinor: 5n,
    },
    {
      groupState: 'group_incomplete',
      filledLegIds: Object.freeze(['market-001:yes']),
      excludedLegIds: Object.freeze(['market-001:no']),
      scenarioNets: Object.freeze([
        Object.freeze({ scenarioId: 'no_wins', netMinor: -100n }),
        Object.freeze({ scenarioId: 'yes_wins', netMinor: 110n }),
      ]),
      worstCaseNetMinor: -100n,
    },
  );

  assert.equal(report.accepted, false);
  assert.equal(report.reportKind, 'private_paper_opportunity');
  assert.equal(report.status, 'fixture_candidate_only');
  assert.deepEqual(report.blockers, []);
  assert.equal(report.stakeVector.worstCaseNetMinor, 5n);
  assert.deepEqual(report.residualExposure?.filledLegIds, ['market-001:yes']);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.stakeVector.stakes), true);
  assert.equal(Object.isFrozen(report.residualExposure?.scenarioNets), true);
  assertNoForbiddenReportLanguage(report);
});

test('private run report assembles candidate reports in deterministic order with settlement context', () => {
  const blockedReport = createBlockedOpportunityReport('candidate-002', [
    { code: 'QUOTE_STALE', message: 'stale local quote', evidenceRequired: 'fresh local quote evidence' },
  ]);
  const opportunityReport = createPrivateOpportunityReport('candidate-001', {
    stakes: Object.freeze([
      Object.freeze({ legId: 'market-001:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
      Object.freeze({ legId: 'market-001:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
    ]),
    scenarioNets: Object.freeze([
      Object.freeze({ scenarioId: 'no_wins', netMinor: 15n }),
      Object.freeze({ scenarioId: 'yes_wins', netMinor: 5n }),
    ]),
    worstCaseNetMinor: 5n,
  });

  const report = createPrivateRunReport(
    'run-001',
    [blockedReport, opportunityReport],
    {
      canonicalMarketId: 'market-001',
      ruleProfileId: 'rules-001',
      resultSourceId: 'result-source-001',
      finalityPolicyId: 'finality-001',
      finalityAuthorityId: 'authority-001',
      replayManifestHash: 'f'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:07:00.000Z',
      scenarioId: 'yes_wins',
      finalOutcome: 'yes',
    },
  );

  assert.equal(report.accepted, false);
  assert.equal(report.reportKind, 'private_paper_run');
  assert.equal(report.status, 'fixture_results_only');
  assert.deepEqual(report.candidateReports.map((candidateReport) => candidateReport.candidateId), ['candidate-001', 'candidate-002']);
  assert.equal(report.blockerCount, 1);
  assert.equal(report.settlement?.scenarioId, 'yes_wins');
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.candidateReports), true);
  assertNoForbiddenReportLanguage(report);
});

function assertNoForbiddenReportLanguage(value: unknown): void {
  for (const text of collectStrings(value)) {
    assert.doesNotMatch(text, /(profit|profitable|execution|ready|signal)/i);
  }
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStrings(entry));
  }

  return Object.values(value).flatMap((entry) => collectStrings(entry));
}
