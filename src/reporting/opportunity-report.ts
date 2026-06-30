import type { Blocker } from '../contracts/local-types.js';

export interface PrivateOpportunityReport {
  readonly reportKind: 'private_paper_candidate';
  readonly candidateId: string;
  readonly accepted: false;
  readonly blockers: readonly Blocker[];
}

export function createBlockedOpportunityReport(candidateId: string, blockers: readonly Blocker[]): PrivateOpportunityReport {
  return Object.freeze({ reportKind: 'private_paper_candidate', candidateId, accepted: false, blockers: Object.freeze([...blockers]) });
}
