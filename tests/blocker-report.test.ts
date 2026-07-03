import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlockedOpportunityReport,
  createPrivateOpportunityReport,
} from '../src/reporting/opportunity-report.js';
import { summarizeBlockers } from '../src/reporting/blocker-report.js';
import { createPrivateRunReport, validatePrivateRunReportArtifact } from '../src/reporting/private-run-report.js';

const SOURCE_MANIFEST_HASH = 'a'.repeat(64);

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
    SOURCE_MANIFEST_HASH,
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
  assert.equal(report.sourceManifestHash, SOURCE_MANIFEST_HASH);
  assert.deepEqual(report.candidateReports.map((candidateReport) => candidateReport.candidateId), ['candidate-001', 'candidate-002']);
  assert.equal(report.blockerCount, 1);
  assert.equal(report.settlement?.scenarioId, 'yes_wins');
  assert.deepEqual(report.settlementSummaries?.map((settlement) => settlement.candidateId), ['market-001']);
  assert.equal(Object.isFrozen(report.settlementSummaries), true);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.candidateReports), true);
  assert.equal(validatePrivateRunReportArtifact(report).ok, true);
  assertNoForbiddenReportLanguage(report);
});


test('private run report keeps multiple settlement summaries keyed by candidate', () => {
  const firstReport = createPrivateOpportunityReport('candidate-001', {
    stakes: Object.freeze([Object.freeze({ legId: 'market-001:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n })]),
    scenarioNets: Object.freeze([Object.freeze({ scenarioId: 'yes_wins', netMinor: 5n })]),
    worstCaseNetMinor: 5n,
  });
  const secondReport = createPrivateOpportunityReport('candidate-002', {
    stakes: Object.freeze([Object.freeze({ legId: 'market-002:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n })]),
    scenarioNets: Object.freeze([Object.freeze({ scenarioId: 'no_wins', netMinor: 7n })]),
    worstCaseNetMinor: 7n,
  });

  const report = createPrivateRunReport('run-002', SOURCE_MANIFEST_HASH, [secondReport, firstReport], [
    {
      canonicalMarketId: 'candidate-002',
      ruleProfileId: 'rules-002',
      resultSourceId: 'result-source-002',
      finalityPolicyId: 'finality-002',
      finalityAuthorityId: 'authority-002',
      replayManifestHash: 'e'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:08:00.000Z',
      scenarioId: 'no_wins',
      finalOutcome: 'no',
    },
    {
      canonicalMarketId: 'candidate-001',
      ruleProfileId: 'rules-001',
      resultSourceId: 'result-source-001',
      finalityPolicyId: 'finality-001',
      finalityAuthorityId: 'authority-001',
      replayManifestHash: 'f'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:07:00.000Z',
      scenarioId: 'yes_wins',
      finalOutcome: 'yes',
    },
  ]);

  assert.equal(report.settlement, undefined);
  assert.deepEqual(report.candidateReports.map((candidateReport) => candidateReport.candidateId), ['candidate-001', 'candidate-002']);
  assert.deepEqual(report.settlementSummaries?.map((settlement) => ({
    candidateId: settlement.candidateId,
    scenarioId: settlement.scenarioId,
    finalOutcome: settlement.finalOutcome,
  })), [
    { candidateId: 'candidate-001', scenarioId: 'yes_wins', finalOutcome: 'yes' },
    { candidateId: 'candidate-002', scenarioId: 'no_wins', finalOutcome: 'no' },
  ]);
  assert.equal(validatePrivateRunReportArtifact(report).ok, true);
  assertNoForbiddenReportLanguage(report);
});

test('private run report artifact validator rejects an invalid source manifest hash', () => {
  const report = createPrivateRunReport(
    'run-003',
    SOURCE_MANIFEST_HASH,
    [createBlockedOpportunityReport('candidate-003', [{ code: 'LOCAL_BLOCKER', message: 'missing', evidenceRequired: 'fixture' }])],
  );

  const validation = validatePrivateRunReportArtifact({
    ...report,
    sourceManifestHash: 'invalid-hash',
  });

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'PRIVATE_RUN_REPORT_SOURCE_MANIFEST_HASH_INVALID',
      message: 'Private paper-mode artifacts must include a 64-character lower-case source manifest hash.',
      evidenceRequired: 'Serialized private paper-mode run artifact with the source bundle manifest hash.',
    },
  ]);
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
