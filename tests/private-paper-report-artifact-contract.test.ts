import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlockedOpportunityReport,
  createPrivateOpportunityReport,
} from '../src/reporting/opportunity-report.js';
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

test('private paper report artifact contract rejects unsupported retained fields', () => {
  const report = createPrivateRunReport(
    'run-106',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-106-a', [
        { code: 'LOCAL_BLOCKER', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
      createPrivateOpportunityReport('candidate-106-b', {
        stakes: Object.freeze([
          Object.freeze({ legId: 'candidate-106-b:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
          Object.freeze({ legId: 'candidate-106-b:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
        ]),
        scenarioNets: Object.freeze([
          Object.freeze({ scenarioId: 'no_wins', netMinor: 15n }),
          Object.freeze({ scenarioId: 'yes_wins', netMinor: 5n }),
        ]),
        worstCaseNetMinor: 5n,
      }),
    ],
    [
      {
        canonicalMarketId: 'candidate-106-a',
        ruleProfileId: 'rules-106-a',
        resultSourceId: 'result-source-106-a',
        finalityPolicyId: 'finality-106-a',
        finalityAuthorityId: 'authority-106-a',
        replayManifestHash: '1'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:14:00.000Z',
        scenarioId: 'yes_wins',
        finalOutcome: 'yes',
      },
      {
        canonicalMarketId: 'candidate-106-b',
        ruleProfileId: 'rules-106-b',
        resultSourceId: 'result-source-106-b',
        finalityPolicyId: 'finality-106-b',
        finalityAuthorityId: 'authority-106-b',
        replayManifestHash: '2'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:15:00.000Z',
        scenarioId: 'no_wins',
        finalOutcome: 'no',
      },
    ],
  );
  const settlementSummaries = report.settlementSummaries;
  if (settlementSummaries === undefined) {
    throw new Error('Expected generated multi-settlement report to include settlement summaries.');
  }

  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      liveReady: false,
    },
    'PRIVATE_RUN_REPORT_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        {
          ...report.candidateReports[0],
          profitMinor: 0,
        },
        report.candidateReports[1],
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        report.candidateReports[0],
        {
          ...report.candidateReports[1],
          executionEnabled: false,
        },
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      settlementSummaries: [
        {
          ...settlementSummaries[0],
          profitMinor: 0,
        },
        settlementSummaries[1],
      ],
    },
    'PRIVATE_RUN_REPORT_SETTLEMENT_UNSUPPORTED_FIELDS',
  );
});

test('private paper report artifact contract rejects unsupported nested opportunity summaries', () => {
  const report = createPrivateRunReport(
    'run-108',
    SOURCE_MANIFEST_HASH,
    [
      createPrivateOpportunityReport(
        'candidate-108',
        {
          stakes: Object.freeze([
            Object.freeze({ legId: 'candidate-108:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
            Object.freeze({ legId: 'candidate-108:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
          ]),
          scenarioNets: Object.freeze([
            Object.freeze({ scenarioId: 'no_wins', netMinor: -5n }),
            Object.freeze({ scenarioId: 'yes_wins', netMinor: 5n }),
          ]),
          worstCaseNetMinor: -5n,
        },
        {
          groupState: 'group_incomplete',
          filledLegIds: Object.freeze(['candidate-108:no']),
          excludedLegIds: Object.freeze(['candidate-108:yes']),
          scenarioNets: Object.freeze([
            Object.freeze({ scenarioId: 'no_wins', netMinor: -100n }),
            Object.freeze({ scenarioId: 'yes_wins', netMinor: -50n }),
          ]),
          worstCaseNetMinor: -100n,
        },
      ),
    ],
  );
  const candidateReport = report.candidateReports[0];
  if (candidateReport === undefined || candidateReport.reportKind !== 'private_paper_opportunity') {
    throw new Error('Expected fixture run report to contain one opportunity candidate.');
  }
  const firstStake = candidateReport.stakeVector.stakes[0];
  const secondStake = candidateReport.stakeVector.stakes[1];
  const firstStakeScenarioNet = candidateReport.stakeVector.scenarioNets[0];
  const secondStakeScenarioNet = candidateReport.stakeVector.scenarioNets[1];
  const residualExposure = candidateReport.residualExposure;
  if (
    firstStake === undefined
    || secondStake === undefined
    || firstStakeScenarioNet === undefined
    || secondStakeScenarioNet === undefined
    || residualExposure === undefined
  ) {
    throw new Error('Expected fixture opportunity candidate to contain complete nested summaries.');
  }
  const firstResidualScenarioNet = residualExposure.scenarioNets[0];
  const secondResidualScenarioNet = residualExposure.scenarioNets[1];
  if (firstResidualScenarioNet === undefined || secondResidualScenarioNet === undefined) {
    throw new Error('Expected fixture opportunity candidate to contain residual scenario nets.');
  }

  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        {
          ...candidateReport,
          stakeVector: {
            ...candidateReport.stakeVector,
            unsupportedStakeVectorField: true,
          },
        },
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        {
          ...candidateReport,
          stakeVector: {
            ...candidateReport.stakeVector,
            stakes: [
              {
                ...firstStake,
                unsupportedStakeField: true,
              },
              secondStake,
            ],
          },
        },
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        {
          ...candidateReport,
          stakeVector: {
            ...candidateReport.stakeVector,
            scenarioNets: [
              {
                ...firstStakeScenarioNet,
                unsupportedScenarioNetField: true,
              },
              secondStakeScenarioNet,
            ],
          },
        },
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        {
          ...candidateReport,
          residualExposure: {
            ...residualExposure,
            unsupportedResidualField: true,
          },
        },
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [
        {
          ...candidateReport,
          residualExposure: {
            ...residualExposure,
            scenarioNets: [
              {
                ...firstResidualScenarioNet,
                unsupportedResidualScenarioNetField: true,
              },
              secondResidualScenarioNet,
            ],
          },
        },
      ],
    },
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
  );
});

test('private paper report artifact contract rejects invalid stake-vector amount summaries', () => {
  const report = createPrivateRunReport(
    'run-109',
    SOURCE_MANIFEST_HASH,
    [
      createPrivateOpportunityReport('candidate-109', {
        stakes: Object.freeze([
          Object.freeze({ legId: 'candidate-109:no', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
          Object.freeze({ legId: 'candidate-109:yes', unitCount: 1n, stakeQuantumMinor: 100n, stakeMinor: 100n }),
        ]),
        scenarioNets: Object.freeze([
          Object.freeze({ scenarioId: 'no_wins', netMinor: -5n }),
          Object.freeze({ scenarioId: 'yes_wins', netMinor: 5n }),
        ]),
        worstCaseNetMinor: -5n,
      }),
    ],
  );
  const candidateReport = report.candidateReports[0];
  if (candidateReport === undefined || candidateReport.reportKind !== 'private_paper_opportunity') {
    throw new Error('Expected fixture run report to contain one opportunity candidate.');
  }
  const firstStake = candidateReport.stakeVector.stakes[0];
  const secondStake = candidateReport.stakeVector.stakes[1];
  if (firstStake === undefined || secondStake === undefined) {
    throw new Error('Expected fixture opportunity candidate to contain stake summaries.');
  }

  for (const stakeOverride of [
    { unitCount: 0n },
    { unitCount: '-1' },
    { stakeQuantumMinor: 0n },
    { stakeMinor: 0n },
    { stakeMinor: -100n },
    { unitCount: 2n, stakeQuantumMinor: 100n, stakeMinor: 199n },
  ]) {
    assertPrivateRunReportBlockedWithCode(
      {
        ...report,
        candidateReports: [
          {
            ...candidateReport,
            stakeVector: {
              ...candidateReport.stakeVector,
              stakes: [
                {
                  ...firstStake,
                  ...stakeOverride,
                },
                secondStake,
              ],
            },
          },
        ],
      },
      'PRIVATE_RUN_REPORT_CANDIDATE_SHAPE_INVALID',
    );
  }
});

test('private paper report artifact contract rejects non-canonical candidate and settlement order', () => {
  const report = createPrivateRunReport(
    'run-107',
    SOURCE_MANIFEST_HASH,
    [
      createBlockedOpportunityReport('candidate-107-a', [
        { code: 'LOCAL_BLOCKER_A', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
      createBlockedOpportunityReport('candidate-107-b', [
        { code: 'LOCAL_BLOCKER_B', message: 'missing local fixture', evidenceRequired: 'repo-local fixture evidence' },
      ]),
    ],
    [
      {
        canonicalMarketId: 'candidate-107-a',
        ruleProfileId: 'rules-107-a',
        resultSourceId: 'result-source-107-a',
        finalityPolicyId: 'finality-107-a',
        finalityAuthorityId: 'authority-107-a',
        replayManifestHash: '3'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:16:00.000Z',
        scenarioId: 'yes_wins',
        finalOutcome: 'yes',
      },
      {
        canonicalMarketId: 'candidate-107-b',
        ruleProfileId: 'rules-107-b',
        resultSourceId: 'result-source-107-b',
        finalityPolicyId: 'finality-107-b',
        finalityAuthorityId: 'authority-107-b',
        replayManifestHash: '4'.repeat(64),
        replayAcceptedAt: '2026-07-01T00:17:00.000Z',
        scenarioId: 'no_wins',
        finalOutcome: 'no',
      },
    ],
  );
  const settlementSummaries = report.settlementSummaries;
  if (settlementSummaries === undefined) {
    throw new Error('Expected generated multi-settlement report to include settlement summaries.');
  }

  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      candidateReports: [report.candidateReports[1], report.candidateReports[0]],
    },
    'PRIVATE_RUN_REPORT_CANDIDATES_ORDER_INVALID',
  );
  assertPrivateRunReportBlockedWithCode(
    {
      ...report,
      settlementSummaries: [settlementSummaries[1], settlementSummaries[0]],
    },
    'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARIES_ORDER_INVALID',
  );
});

function assertPrivateRunReportBlockedWithCode(
  report: unknown,
  code: string,
): void {
  const validation = validatePrivateRunReportArtifact(report as Parameters<typeof validatePrivateRunReportArtifact>[0]);
  assert.equal(validation.ok, false);
  if (validation.ok) {
    throw new Error(`Expected private run report validation blocker ${code}.`);
  }
  assert.equal(validation.blockers[0]?.code, code);
}
