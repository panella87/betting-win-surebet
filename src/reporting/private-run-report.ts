import { accepted, blocked, FIRST_LANE_SPEC, type BoundaryResult, type FirstLaneId } from '../contracts/local-types.js';
import type { ConsumedSettlementReplay } from '../simulation/settlement-replay.js';
import type { PrivateCandidateReport } from './opportunity-report.js';

const MANIFEST_HASH_PATTERN = /^[0-9a-f]{64}$/;
const FORBIDDEN_REPORT_TEXT_PATTERN = /(profit|profitable|execution|ready|signal)/i;

export interface PrivateRunSettlementSummary {
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
  readonly finalityAuthorityId: string;
  readonly replayManifestHash: string;
  readonly replayAcceptedAt: string;
  readonly scenarioId: string;
  readonly finalOutcome: 'yes' | 'no';
}

export interface PrivateRunReport {
  readonly reportKind: 'private_paper_run';
  readonly laneId: FirstLaneId;
  readonly runId: string;
  readonly sourceManifestHash: string;
  readonly accepted: false;
  readonly status: 'fixture_results_only';
  readonly candidateReports: readonly PrivateCandidateReport[];
  readonly blockerCount: number;
  readonly settlement?: PrivateRunSettlementSummary;
  readonly settlementSummaries?: readonly PrivateRunSettlementSummary[];
}

export function createPrivateRunReport(
  runId: string,
  sourceManifestHash: string,
  candidateReports: readonly PrivateCandidateReport[],
  settlements?: ConsumedSettlementReplay | readonly ConsumedSettlementReplay[],
): PrivateRunReport {
  if (runId.trim().length === 0) {
    throw new Error('Private run report requires a non-empty run id.');
  }
  if (!MANIFEST_HASH_PATTERN.test(sourceManifestHash)) {
    throw new Error('Private run report requires a 64-character lower-case source manifest hash.');
  }
  if (candidateReports.length === 0) {
    throw new Error('Private run report requires at least one candidate report.');
  }

  const sortedCandidateReports = [...candidateReports]
    .map((candidateReport) => cloneCandidateReport(candidateReport))
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));

  const report: PrivateRunReport = {
    reportKind: 'private_paper_run',
    laneId: FIRST_LANE_SPEC.laneId,
    runId,
    sourceManifestHash,
    accepted: false,
    status: 'fixture_results_only',
    candidateReports: Object.freeze(sortedCandidateReports),
    blockerCount: sortedCandidateReports.reduce(
      (currentBlockerCount, candidateReport) => currentBlockerCount + candidateReport.blockers.length,
      0,
    ),
  };

  const settlementSummaries = toSettlementSummaries(settlements);
  if (settlementSummaries.length === 0) {
    return Object.freeze(report);
  }

  const reportWithSettlementSummaries: PrivateRunReport = {
    ...report,
    settlementSummaries: Object.freeze(settlementSummaries),
  };

  if (settlementSummaries.length !== 1) {
    return Object.freeze(reportWithSettlementSummaries);
  }

  const singleSettlementSummary = settlementSummaries[0];
  if (singleSettlementSummary === undefined) {
    return Object.freeze(reportWithSettlementSummaries);
  }

  return Object.freeze({
    ...reportWithSettlementSummaries,
    settlement: singleSettlementSummary,
  });
}

export function validatePrivateRunReportArtifact(report: PrivateRunReport): BoundaryResult<undefined> {
  if (report.reportKind !== 'private_paper_run') {
    return blocked(
      'PRIVATE_RUN_REPORT_KIND_INVALID',
      'Private paper-mode artifacts must use the private_paper_run report kind.',
      'Serialized private paper-mode run artifact with reportKind=private_paper_run.',
    );
  }
  if (report.laneId !== FIRST_LANE_SPEC.laneId) {
    return blocked(
      'PRIVATE_RUN_REPORT_LANE_ID_INVALID',
      'Private paper-mode artifacts must include the first-lane identifier.',
      'Serialized private paper-mode run artifact with the repo first-lane id.',
    );
  }
  if (report.runId.trim().length === 0) {
    return blocked(
      'PRIVATE_RUN_REPORT_RUN_ID_MISSING',
      'Private paper-mode artifacts must include a non-empty run id.',
      'Serialized private paper-mode run artifact with a non-empty run id.',
    );
  }
  if (!MANIFEST_HASH_PATTERN.test(report.sourceManifestHash)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SOURCE_MANIFEST_HASH_INVALID',
      'Private paper-mode artifacts must include a 64-character lower-case source manifest hash.',
      'Serialized private paper-mode run artifact with the source bundle manifest hash.',
    );
  }
  if (report.accepted !== false) {
    return blocked(
      'PRIVATE_RUN_REPORT_ACCEPTED_FLAG_INVALID',
      'Private paper-mode artifacts must remain accepted=false.',
      'Serialized private paper-mode run artifact with accepted=false.',
    );
  }
  if (report.status !== 'fixture_results_only') {
    return blocked(
      'PRIVATE_RUN_REPORT_STATUS_INVALID',
      'Private paper-mode artifacts must remain fixture_results_only.',
      'Serialized private paper-mode run artifact with status=fixture_results_only.',
    );
  }
  if (report.candidateReports.length === 0) {
    return blocked(
      'PRIVATE_RUN_REPORT_CANDIDATES_MISSING',
      'Private paper-mode artifacts must include at least one candidate report.',
      'Serialized private paper-mode run artifact with candidate reports.',
    );
  }

  const computedBlockerCount = report.candidateReports.reduce(
    (currentBlockerCount, candidateReport) => currentBlockerCount + candidateReport.blockers.length,
    0,
  );
  if (report.blockerCount !== computedBlockerCount) {
    return blocked(
      'PRIVATE_RUN_REPORT_BLOCKER_COUNT_INVALID',
      'Private paper-mode artifacts must keep blockerCount aligned with candidate report blockers.',
      'Serialized private paper-mode run artifact with blockerCount matching the candidate reports.',
    );
  }

  const settlementSummaries = report.settlementSummaries;
  if (report.settlement !== undefined) {
    if (settlementSummaries === undefined || settlementSummaries.length !== 1) {
      return blocked(
        'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARIES_INVALID',
        'Private paper-mode artifacts with a single settlement summary must also expose settlementSummaries.',
        'Serialized private paper-mode run artifact with settlement summaries when settlement context is present.',
      );
    }
    if (settlementSummaries[0]?.candidateId !== report.settlement.candidateId) {
      return blocked(
        'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARY_MISMATCH',
        'Private paper-mode artifacts must keep settlement and settlementSummaries aligned for single-candidate runs.',
        'Serialized private paper-mode run artifact with aligned single-candidate settlement fields.',
      );
    }
  }

  for (const text of collectStrings(report)) {
    if (FORBIDDEN_REPORT_TEXT_PATTERN.test(text)) {
      return blocked(
        'PRIVATE_RUN_REPORT_FORBIDDEN_LANGUAGE',
        'Private paper-mode artifacts must not contain public-signal, profitability, or execution-readiness language.',
        'Serialized private paper-mode run artifact without forbidden public/execution/profitability language.',
      );
    }
  }

  return accepted(undefined);
}

function toSettlementSummaries(
  settlements: ConsumedSettlementReplay | readonly ConsumedSettlementReplay[] | undefined,
): readonly PrivateRunSettlementSummary[] {
  if (settlements === undefined) {
    return Object.freeze([]);
  }
  const settlementList = Array.isArray(settlements) ? settlements : [settlements];
  return Object.freeze(
    settlementList
      .map((settlement) =>
        Object.freeze({
          candidateId: settlement.canonicalMarketId,
          canonicalMarketId: settlement.canonicalMarketId,
          ruleProfileId: settlement.ruleProfileId,
          resultSourceId: settlement.resultSourceId,
          finalityPolicyId: settlement.finalityPolicyId,
          finalityAuthorityId: settlement.finalityAuthorityId,
          replayManifestHash: settlement.replayManifestHash,
          replayAcceptedAt: settlement.replayAcceptedAt,
          scenarioId: settlement.scenarioId,
          finalOutcome: settlement.finalOutcome,
        }),
      )
      .sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
  );
}

function cloneCandidateReport(candidateReport: PrivateCandidateReport): PrivateCandidateReport {
  if (candidateReport.reportKind === 'private_paper_blocked') {
    return Object.freeze({
      reportKind: 'private_paper_blocked',
      laneId: candidateReport.laneId,
      candidateId: candidateReport.candidateId,
      accepted: false,
      status: 'blocked',
      blockers: Object.freeze(candidateReport.blockers.map((blocker) => Object.freeze({ ...blocker }))),
    });
  }

  if (candidateReport.residualExposure === undefined) {
    return Object.freeze({
      reportKind: 'private_paper_opportunity',
      laneId: candidateReport.laneId,
      candidateId: candidateReport.candidateId,
      accepted: false,
      status: 'fixture_candidate_only',
      blockers: Object.freeze([]),
      stakeVector: Object.freeze({
        stakes: Object.freeze(candidateReport.stakeVector.stakes.map((stake) => Object.freeze({ ...stake }))),
        scenarioNets: Object.freeze(candidateReport.stakeVector.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
        worstCaseNetMinor: candidateReport.stakeVector.worstCaseNetMinor,
      }),
    });
  }

  return Object.freeze({
    reportKind: 'private_paper_opportunity',
    laneId: candidateReport.laneId,
    candidateId: candidateReport.candidateId,
    accepted: false,
    status: 'fixture_candidate_only',
    blockers: Object.freeze([]),
    stakeVector: Object.freeze({
      stakes: Object.freeze(candidateReport.stakeVector.stakes.map((stake) => Object.freeze({ ...stake }))),
      scenarioNets: Object.freeze(candidateReport.stakeVector.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
      worstCaseNetMinor: candidateReport.stakeVector.worstCaseNetMinor,
    }),
    residualExposure: Object.freeze({
      groupState: 'group_incomplete',
      filledLegIds: Object.freeze([...candidateReport.residualExposure.filledLegIds]),
      excludedLegIds: Object.freeze([...candidateReport.residualExposure.excludedLegIds]),
      scenarioNets: Object.freeze(candidateReport.residualExposure.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
      worstCaseNetMinor: candidateReport.residualExposure.worstCaseNetMinor,
    }),
  });
}

function collectStrings(value: unknown): readonly string[] {
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
