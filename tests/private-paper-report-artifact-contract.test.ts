import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlockedOpportunityReport } from '../src/reporting/opportunity-report.js';
import {
  createPrivateRunReport,
  validatePrivateRunReportArtifact,
} from '../src/reporting/private-run-report.js';

const SOURCE_MANIFEST_HASH = 'b'.repeat(64);

test('private paper report artifact contract accepts a valid single-candidate report', () => {
  const report = createPrivateRunReport(
    'run-100',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-100', [
        { code: 'LOCAL_BLOCKER', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
    {
      canonicalMarketId: 'candidate-100',
      ruleProfileId: 'rules-100',
      resultSourceId: 'result-source-100',
      finalityPolicyId: 'finality-100',
      finalityAuthorityId: 'authority-100',
      replayManifestHash: 'c'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:09:00.000Z',
      scenarioId: 'yes_wins',
      finalOutcome: 'yes',
    },
  );

  const validation = validatePrivateRunReportArtifact(report);
  assert.equal(validation.ok, true);
});

test('private paper report artifact contract rejects missing settlement summaries for single-candidate reports', () => {
  const report = createPrivateRunReport(
    'run-101',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-101', [
        { code: 'LOCAL_BLOCKER', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
    {
      canonicalMarketId: 'candidate-101',
      ruleProfileId: 'rules-101',
      resultSourceId: 'result-source-101',
      finalityPolicyId: 'finality-101',
      finalityAuthorityId: 'authority-101',
      replayManifestHash: 'd'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:10:00.000Z',
      scenarioId: 'no_wins',
      finalOutcome: 'no',
    },
  );

  const invalidReport = { ...report } as Record<string, unknown>;
  delete invalidReport.settlementSummaries;
  const validation = validatePrivateRunReportArtifact(invalidReport as unknown as Parameters<
    typeof validatePrivateRunReportArtifact
  >[0]);

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARIES_INVALID',
      message:
        'Private paper-mode artifacts with a single settlement summary must also expose settlementSummaries.',
      evidenceRequired:
        'Serialized private paper-mode run artifact with settlement summaries when settlement context is present.',
    },
  ]);
});
