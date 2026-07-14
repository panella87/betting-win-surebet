import type { Blocker } from '../contracts/local-types.js';
import { FIRST_LANE_SPEC, type FirstLaneId } from '../contracts/local-types.js';

export interface PrivateBlockedReport {
  readonly reportKind: 'private_paper_blocked';
  readonly laneId: FirstLaneId;
  readonly candidateId: string;
  readonly accepted: false;
  readonly status: 'blocked';
  readonly blockers: readonly Blocker[];
}

export function createPrivateBlockedReport(candidateId: string, blockers: readonly Blocker[]): PrivateBlockedReport {
  if (candidateId.trim().length === 0) {
    throw new Error('Private blocked report requires a non-empty candidate id.');
  }
  if (blockers.length === 0) {
    throw new Error('Private blocked report requires at least one blocker.');
  }

  return Object.freeze({
    reportKind: 'private_paper_blocked',
    laneId: FIRST_LANE_SPEC.laneId,
    candidateId,
    accepted: false,
    status: 'blocked',
    blockers: Object.freeze(blockers.map((blocker) => Object.freeze({ ...blocker }))),
  });
}

export function summarizeBlockers(blockers: readonly Blocker[]): string {
  if (blockers.length === 0) return 'no_blockers_recorded';
  return blockers.map((blocker) => `${blocker.code}: ${blocker.evidenceRequired}`).join('\n');
}
