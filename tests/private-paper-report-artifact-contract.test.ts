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

test('private paper report artifact contract rejects malformed candidate reports without throwing', () => {
  const report = createPrivateRunReport(
    'run-102',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-102', [
        { code: 'LOCAL_BLOCKER', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
  );

  const invalidReport = {
    ...report,
    blockerCount: 0,
    candidateReports: [
      {
        reportKind: 'private_paper_opportunity',
        laneId: 'wrong-lane',
        candidateId: 'candidate-102',
        accepted: true,
        status: 'fixture_candidate_only',
        blockers: [],
      },
    ],
  };
  const validation = validatePrivateRunReportArtifact(invalidReport as unknown as Parameters<
    typeof validatePrivateRunReportArtifact
  >[0]);

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'PRIVATE_RUN_REPORT_CANDIDATE_LANE_ID_INVALID',
      message: 'Private paper-mode candidate reports must include the first-lane identifier.',
      evidenceRequired: 'Serialized private paper-mode candidate report with the repo first-lane id.',
    },
  ]);
});

test('private paper report artifact contract rejects blocked candidate reports without blocker evidence', () => {
  const report = createPrivateRunReport(
    'run-103',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-103', [
        { code: 'LOCAL_BLOCKER', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
  );
  const invalidReport = {
    ...report,
    blockerCount: 0,
    candidateReports: [
      {
        ...report.candidateReports[0],
        blockers: [],
      },
    ],
  };

  const validation = validatePrivateRunReportArtifact(invalidReport as unknown as Parameters<
    typeof validatePrivateRunReportArtifact
  >[0]);

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'PRIVATE_RUN_REPORT_CANDIDATE_SHAPE_INVALID',
      message:
        'Private paper-mode artifacts must keep candidate reports in the supported blocked or opportunity shape.',
      evidenceRequired:
        'Serialized private paper-mode candidate reports with lane/status/blocker and stake-vector fields aligned to reportKind.',
    },
  ]);
});

test('private paper report artifact contract rejects settlement summaries for unknown candidates', () => {
  const report = createPrivateRunReport(
    'run-104',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-104-a', [
        { code: 'LOCAL_BLOCKER_A', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
      createBlockedOpportunityReport('candidate-104-b', [
        { code: 'LOCAL_BLOCKER_B', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
    [
      {
        canonicalMarketId: 'candidate-104-a',
        ruleProfileId: 'rules-104-a',
        resultSourceId: 'result-source-104-a',
        finalityPolicyId: 'finality-104-a',
        finalityAuthorityId: 'authority-104-a',
        replayManifestHash: 'e'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:11:00.000Z',
        scenarioId: 'yes_wins',
        finalOutcome: 'yes',
      },
      {
        canonicalMarketId: 'candidate-104-b',
        ruleProfileId: 'rules-104-b',
        resultSourceId: 'result-source-104-b',
        finalityPolicyId: 'finality-104-b',
        finalityAuthorityId: 'authority-104-b',
        replayManifestHash: 'f'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:12:00.000Z',
        scenarioId: 'no_wins',
        finalOutcome: 'no',
      },
    ],
  );
  assert.equal(validatePrivateRunReportArtifact(report).ok, true);
  const settlementSummaries = report.settlementSummaries;
  if (settlementSummaries === undefined) {
    throw new Error('Expected generated multi-settlement report to include settlement summaries.');
  }
  const invalidReport = {
    ...report,
    settlementSummaries: [
      {
        ...settlementSummaries[0],
        candidateId: 'candidate-104-missing',
        canonicalMarketId: 'candidate-104-missing',
      },
      settlementSummaries[1],
    ],
  };

  const validation = validatePrivateRunReportArtifact(invalidReport as unknown as Parameters<
    typeof validatePrivateRunReportArtifact
  >[0]);

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'PRIVATE_RUN_REPORT_SETTLEMENT_CANDIDATE_INVALID',
      message: 'Private paper-mode settlement summaries must reference known non-empty candidate ids.',
      evidenceRequired: 'Serialized private paper-mode settlement summaries keyed to candidateReports.',
    },
  ]);
});

test('private paper report artifact contract rejects invalid settlement replay metadata', () => {
  const report = createPrivateRunReport(
    'run-105',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-105', [
        { code: 'LOCAL_BLOCKER', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
    {
      canonicalMarketId: 'candidate-105',
      ruleProfileId: 'rules-105',
      resultSourceId: 'result-source-105',
      finalityPolicyId: 'finality-105',
      finalityAuthorityId: 'authority-105',
      replayManifestHash: 'a'.repeat(64),
      replayAcceptedAt: '2026-07-01T00:13:00.000Z',
      scenarioId: 'yes_wins',
      finalOutcome: 'yes',
    },
  );
  const settlement = report.settlement;
  if (settlement === undefined) {
    throw new Error('Expected generated single-settlement report to include legacy settlement.');
  }
  const invalidSettlement = {
    ...settlement,
    replayManifestHash: 'not-a-sha',
    replayAcceptedAt: 'not-a-date',
    scenarioId: '',
    finalOutcome: 'maybe',
  };
  const invalidReport = {
    ...report,
    settlement: invalidSettlement,
    settlementSummaries: [invalidSettlement],
  };

  const validation = validatePrivateRunReportArtifact(invalidReport as unknown as Parameters<
    typeof validatePrivateRunReportArtifact
  >[0]);

  assert.equal(validation.ok, false);
  assert.deepEqual(validation.blockers, [
    {
      code: 'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARY_SHAPE_INVALID',
      message: 'Private paper-mode settlement summaries must include complete non-empty replay metadata.',
      evidenceRequired: 'Serialized private paper-mode settlement summaries with complete replay metadata fields.',
    },
  ]);
});
