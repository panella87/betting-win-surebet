import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlockedOpportunityReport } from '../src/reporting/opportunity-report.js';
import { summarizeBlockers } from '../src/reporting/blocker-report.js';

test('private report records blockers without acceptance claim', () => {
  const blockers = [{ code: 'UPSTREAM_CONTRACT_MISSING', message: 'missing', evidenceRequired: 'pinned export' }];
  const report = createBlockedOpportunityReport('candidate-001', blockers);
  assert.equal(report.accepted, false);
  assert.match(summarizeBlockers(report.blockers), /UPSTREAM_CONTRACT_MISSING/);
});
