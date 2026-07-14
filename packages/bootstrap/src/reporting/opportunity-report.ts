import type { Blocker } from '../contracts/local-types.js';
import { FIRST_LANE_SPEC, type FirstLaneId } from '../contracts/local-types.js';
import type { ResidualExposureAnalysis, ResidualExposureScenarioNet } from '../simulation/residual-exposure.js';
import type { SolvedStakeVectorLeg, StakeVectorScenarioNet, StakeVectorSolution } from '../solver/stake-vector.js';
import { createPrivateBlockedReport, type PrivateBlockedReport } from './blocker-report.js';

export interface PrivatePaperStakeSummary {
  readonly stakes: readonly SolvedStakeVectorLeg[];
  readonly scenarioNets: readonly StakeVectorScenarioNet[];
  readonly worstCaseNetMinor: bigint;
}

export interface PrivatePaperResidualSummary {
  readonly groupState: 'group_incomplete';
  readonly filledLegIds: readonly string[];
  readonly excludedLegIds: readonly string[];
  readonly scenarioNets: readonly ResidualExposureScenarioNet[];
  readonly worstCaseNetMinor: bigint;
}

export interface PrivateOpportunityReport {
  readonly reportKind: 'private_paper_opportunity';
  readonly laneId: FirstLaneId;
  readonly candidateId: string;
  readonly accepted: false;
  readonly status: 'fixture_candidate_only';
  readonly blockers: readonly Blocker[];
  readonly stakeVector: PrivatePaperStakeSummary;
  readonly residualExposure?: PrivatePaperResidualSummary;
}

export type PrivateCandidateReport = PrivateBlockedReport | PrivateOpportunityReport;

export function createBlockedOpportunityReport(candidateId: string, blockers: readonly Blocker[]): PrivateBlockedReport {
  return createPrivateBlockedReport(candidateId, blockers);
}

export function createPrivateOpportunityReport(
  candidateId: string,
  stakeVector: StakeVectorSolution,
  residualExposure?: ResidualExposureAnalysis,
): PrivateOpportunityReport {
  if (candidateId.trim().length === 0) {
    throw new Error('Private opportunity report requires a non-empty candidate id.');
  }

  const report: PrivateOpportunityReport = {
    reportKind: 'private_paper_opportunity',
    laneId: FIRST_LANE_SPEC.laneId,
    candidateId,
    accepted: false,
    status: 'fixture_candidate_only',
    blockers: Object.freeze([]),
    stakeVector: Object.freeze({
      stakes: Object.freeze(stakeVector.stakes.map((stake) => Object.freeze({ ...stake }))),
      scenarioNets: Object.freeze(stakeVector.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
      worstCaseNetMinor: stakeVector.worstCaseNetMinor,
    }),
  };

  if (residualExposure === undefined) {
    return Object.freeze(report);
  }

  return Object.freeze({
    ...report,
    residualExposure: Object.freeze({
      groupState: 'group_incomplete',
      filledLegIds: Object.freeze([...residualExposure.filledLegIds]),
      excludedLegIds: Object.freeze([...residualExposure.excludedLegIds]),
      scenarioNets: Object.freeze(residualExposure.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
      worstCaseNetMinor: residualExposure.worstCaseNetMinor,
    }),
  });
}
