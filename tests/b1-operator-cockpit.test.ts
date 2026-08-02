import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBwsOperatorCockpitPageModel,
  createMockBwsOperatorCockpitSnapshot,
  createBwsOperatorCockpitApiClient,
  type BwsOperatorCockpitFetchLike,
} from '../apps/web/src/index.js';

test('BWS-810 cockpit renders B1 research reporting with closed policy markers', () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const model = buildBwsOperatorCockpitPageModel('/b1-research', snapshot);

  assert.equal(model.cards[0]?.label, 'B1 Research Runs');
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0]?.values['upstreamReadiness'], 'blocked_until_betting_win_b1_multi_venue_markets_v1');
  assert.notEqual(model.note, undefined);
  if (model.note === undefined) {
    throw new Error('B1 cockpit model note is required.');
  }
  assert.match(model.note, /no runtime-evidence claim/);
});

test('BWS-810 cockpit API client requests B1 reporting through the read-only API', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const requestedUrls: string[] = [];
  const fetchImpl: BwsOperatorCockpitFetchLike = async (input) => {
    requestedUrls.push(input);
    return Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(snapshot.b1BacktestRuns);
      },
    });
  };
  const client = createBwsOperatorCockpitApiClient({
    apiBaseUrl: 'http://127.0.0.1:4312',
    dataMode: 'api',
  }, fetchImpl);

  const response = await client.queryB1BacktestRuns({
    expand: 'reporting',
    filters: Object.freeze({
      offlineFalsificationStatus: 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
    }),
    pageSize: 8,
  });

  assert.equal(response.resource, 'b1_backtest_runs');
  assert.notEqual(requestedUrls[0], undefined);
  if (requestedUrls[0] === undefined) {
    throw new Error('B1 cockpit client did not issue a request.');
  }
  assert.match(requestedUrls[0], /\/api\/read-only\/b1\/backtest-runs/);
  assert.match(requestedUrls[0], /expand=reporting/);
});
