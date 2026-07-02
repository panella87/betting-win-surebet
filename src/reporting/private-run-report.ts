import { FIRST_LANE_SPEC, type FirstLaneId } from '../contracts/local-types.js';
import type { ConsumedSettlementReplay } from '../simulation/settlement-replay.js';
import type { PrivateCandidateReport } from './opportunity-report.js';

export interface PrivateRunSettlementSummary {
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
  readonly accepted: false;
  readonly status: 'fixture_results_only';
  readonly candidateReports: readonly PrivateCandidateReport[];
  readonly blockerCount: number;
  readonly settlement?: PrivateRunSettlementSummary;
}

export function createPrivateRunReport(
  runId: string,
  candidateReports: readonly PrivateCandidateReport[],
  settlement?: ConsumedSettlementReplay,
): PrivateRunReport {
  if (runId.trim().length === 0) {
    throw new Error('Private run report requires a non-empty run id.');
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
    accepted: false,
    status: 'fixture_results_only',
    candidateReports: Object.freeze(sortedCandidateReports),
    blockerCount: sortedCandidateReports.reduce(
      (currentBlockerCount, candidateReport) => currentBlockerCount + candidateReport.blockers.length,
      0,
    ),
  };

  if (settlement === undefined) {
    return Object.freeze(report);
  }

  return Object.freeze({
    ...report,
    settlement: Object.freeze({
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
  });
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
