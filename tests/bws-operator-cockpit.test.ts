import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV,
  BWS_OPERATOR_COCKPIT_DATA_MODE_ENV,
  buildBwsOperatorCockpitPageModel,
  createBwsOperatorCockpitApiClient,
  createMockBwsOperatorCockpitSnapshot,
  describeBwsOperatorCockpitProcessDefinition,
  loadBwsOperatorCockpitSnapshot,
  listBwsOperatorCockpitRoutes,
  normalizeBwsOperatorCockpitPinnedExportScope,
  readBwsOperatorCockpitUrlState,
  resolveBwsOperatorCockpitBrowserConfig,
  type BwsOperatorCockpitFetchLike,
} from '../apps/web/src/index.js';

test('BWS operator cockpit browser config fails closed on missing mode and missing API base URL', () => {
  assert.throws(
    () => resolveBwsOperatorCockpitBrowserConfig({}),
    new RegExp(`${BWS_OPERATOR_COCKPIT_DATA_MODE_ENV} must be explicitly set to mock or api`),
  );

  assert.throws(
    () => resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
    }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} is required in api mode`),
  );

  assert.deepEqual(
    resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'mock',
    }),
    Object.freeze({ dataMode: 'mock' }),
  );
});

test('BWS operator cockpit browser config rejects non-http API URLs, non-loopback hosts, embedded credentials, and query fragments', () => {
  assert.throws(
    () => resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'file:///tmp/bws-api',
    }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must use http or https`),
  );

  assert.throws(
    () => resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'https://cockpit.invalid',
    }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must stay on an explicit loopback host`),
  );

  assert.throws(
    () => resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'https://operator:secret@cockpit.invalid',
    }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must not include embedded credentials`),
  );

  assert.throws(
    () => resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'https://cockpit.invalid/read-only?cursor=1#fragment',
    }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must not include query or hash components`),
  );

  assert.throws(
    () =>
      createBwsOperatorCockpitApiClient({
        apiBaseUrl: 'https://cockpit.invalid',
        dataMode: 'api',
    }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must stay on an explicit loopback host`),
  );
  assert.throws(
    () =>
      createBwsOperatorCockpitApiClient({
        apiBaseUrl: 'http://127.0.0.1:4312/prefix',
        dataMode: 'api',
      }),
    new RegExp(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must not include path components`),
  );

  assert.deepEqual(
    resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'http://127.0.0.1:4312',
    }),
    Object.freeze({
      apiBaseUrl: 'http://127.0.0.1:4312',
      dataMode: 'api',
    }),
  );
});

test('BWS operator cockpit process metadata stays loopback-only in explicit api mode', () => {
  const processDefinition = describeBwsOperatorCockpitProcessDefinition(
    resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'http://127.0.0.1:4312',
    }),
  );
  assert.equal(processDefinition.exposure, 'loopback_only');
  assert.deepEqual(processDefinition.networkBindings, [
    Object.freeze({
      exposure: 'loopback_only',
      host: '127.0.0.1',
      port: 4312,
      protocol: 'http',
      purpose: 'operator_cockpit',
    }),
  ]);
});

test('BWS operator cockpit URL state rejects unsafe page integers', () => {
  assert.throws(
    () => readBwsOperatorCockpitUrlState('?page=9007199254740993'),
    /BWS cockpit page state must be a safe non-negative integer/,
  );

  assert.throws(
    () => readBwsOperatorCockpitUrlState(`?page=${'9'.repeat(400)}`),
    /BWS cockpit page state must be a safe non-negative integer/,
  );

  assert.equal(readBwsOperatorCockpitUrlState('?page=42').page, 42);
});

test('BWS operator cockpit pinned export scope rejects unbounded and malformed filters', () => {
  assert.throws(
    () => normalizeBwsOperatorCockpitPinnedExportScope({}),
    /Pinned strategy export queries require at least one explicit scope filter/,
  );

  assert.throws(
    () => normalizeBwsOperatorCockpitPinnedExportScope({
      sourceSha256: 'ABC',
    }),
    /sourceSha256 must be a 64-character lower-case SHA-256 value/,
  );
  assert.throws(
    () => normalizeBwsOperatorCockpitPinnedExportScope({
      sourceSha256: 'A'.repeat(64),
    }),
    /sourceSha256 must be a 64-character lower-case SHA-256 value/,
  );
  assert.throws(
    () => normalizeBwsOperatorCockpitPinnedExportScope({
      sourceSha256: ` ${'a'.repeat(64)} `,
    }),
    /sourceSha256 must be a 64-character lower-case SHA-256 value/,
  );

  assert.deepEqual(
    normalizeBwsOperatorCockpitPinnedExportScope({
      providerId: ' polymarket ',
      sourceSha256: 'a'.repeat(64),
      upstreamLockRecordId: ' lock-001 ',
    }),
    Object.freeze({
      providerId: 'polymarket',
      sourceSha256: 'a'.repeat(64),
      upstreamLockRecordId: 'lock-001',
    }),
  );
});

test('BWS operator cockpit route list preserves the bounded surface required by BWS-420', () => {
  const routes = listBwsOperatorCockpitRoutes();
  assert.deepEqual(
    routes.map((route) => route.path),
    ['/', '/opportunities', '/evidence', '/backtests', '/paper-runs', '/exposure', '/blockers', '/b1-research'],
  );
});

test('BWS operator cockpit page models derive overview, evidence, exposure, and blockers from typed snapshot data', () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();

  const overview = buildBwsOperatorCockpitPageModel('/', snapshot);
  assert.equal(overview.cards[0]?.label, 'Accepted Backtests');
  assert.equal(overview.rows.length, 4);

  const evidence = buildBwsOperatorCockpitPageModel('/evidence', snapshot);
  assert.equal(evidence.cards[0]?.value, '1');
  assert.equal(evidence.rows[0]?.values['providerId'], 'polymarket');

  const exposure = buildBwsOperatorCockpitPageModel('/exposure', snapshot);
  assert.equal(exposure.rows.length, 2);
  assert.equal(exposure.rows[0]?.values['completionGroupState'], 'group_complete');

  const blockers = buildBwsOperatorCockpitPageModel('/blockers', snapshot);
  assert.equal(blockers.rows.length, 2);
  assert.match(blockers.rows[0]?.values['blockerCodes'] ?? '', /QUOTE_FRESHNESS_EXCEEDED|RESIDUAL_EXPOSURE_FLOOR_TRIGGERED/);

  const b1Research = buildBwsOperatorCockpitPageModel('/b1-research', snapshot);
  assert.equal(b1Research.cards[0]?.value, '1');
  assert.equal(b1Research.rows[0]?.values['upstreamReadiness'], 'blocked_until_betting_win_b1_multi_venue_markets_v1');
});

test('BWS operator cockpit evidence cards stay bound to strategy-ledger rows instead of dead-lettered runtime-only cycles', () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const mutated = Object.freeze({
    ...structuredClone(snapshot),
    blockedPaperRuns: Object.freeze({
      ...snapshot.blockedPaperRuns,
      page: Object.freeze({
        ...snapshot.blockedPaperRuns.page,
        items: Object.freeze([]),
        returnedCount: 0,
      }),
    }),
  });

  const evidence = buildBwsOperatorCockpitPageModel('/evidence', mutated);
  assert.equal(evidence.cards[2]?.value, '2');
  assert.equal(evidence.cards[3]?.value, '1');
});

test('BWS operator cockpit page models derive opportunities, backtests, and paper runs from typed snapshot data', () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();

  const opportunities = buildBwsOperatorCockpitPageModel('/opportunities', snapshot);
  assert.equal(opportunities.cards[0]?.value, '4');
  assert.equal(opportunities.rows.length, 4);
  assert.equal(opportunities.rows[0]?.values['candidateId'], 'candidate-backtest-accepted-001');

  const backtests = buildBwsOperatorCockpitPageModel('/backtests', snapshot);
  assert.equal(backtests.cards[0]?.value, '1');
  assert.equal(backtests.rows.length, 2);
  assert.equal(backtests.rows[1]?.values['acceptanceState'], 'blocked');

  const paperRuns = buildBwsOperatorCockpitPageModel('/paper-runs', snapshot);
  assert.equal(paperRuns.cards[0]?.value, '1');
  assert.equal(paperRuns.rows.length, 2);
  assert.equal(paperRuns.rows[1]?.values['jobStatus'], 'dead_lettered');
});

test('BWS operator cockpit snapshot loader keeps evidence reads explicitly scoped in mock mode', async () => {
  const withoutEvidence = await loadBwsOperatorCockpitSnapshot(
    resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'mock',
    }),
    {
      includePinnedStrategyExports: true,
    },
  );
  assert.equal(withoutEvidence.pinnedStrategyExports, undefined);
  assert.equal(withoutEvidence.pinnedExportScope, undefined);

  const withEvidence = await loadBwsOperatorCockpitSnapshot(
    resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'mock',
    }),
    {
      evidenceScope: Object.freeze({ providerId: 'polymarket' }),
      includePinnedStrategyExports: true,
    },
  );
  assert.equal(withEvidence.pinnedStrategyExports?.page.returnedCount, 1);
  assert.equal(withEvidence.pinnedExportScope?.providerId, 'polymarket');
});

test('BWS operator cockpit snapshot loader aggregates the bounded API snapshot with an explicit evidence scope', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const requestedUrls: string[] = [];

  const fetchImpl: BwsOperatorCockpitFetchLike = async (input) => {
    requestedUrls.push(input);
    const url = new URL(input);
    if (url.pathname.endsWith('/pinned-strategy-exports')) {
      return Object.freeze({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(snapshot.pinnedStrategyExports);
        },
      });
    }
    if (url.pathname.endsWith('/b1/backtest-runs')) {
      return Object.freeze({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(snapshot.b1BacktestRuns);
        },
      });
    }
    if (url.pathname.endsWith('/private-paper-runtime-cycles')) {
      const acceptanceState = url.searchParams.get('acceptanceState');
      const payload = acceptanceState === 'accepted_local_evidence'
        ? snapshot.acceptedRuntimeCycles
        : snapshot.blockedRuntimeCycles;
      return Object.freeze({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(payload);
        },
      });
    }

    const acceptanceState = url.searchParams.get('acceptanceState');
    const runKind = url.searchParams.get('runKind');
    const payload = acceptanceState === 'accepted_local_evidence' && runKind === 'deterministic_standard_binary_backtest'
      ? snapshot.acceptedBacktests
      : acceptanceState === 'blocked' && runKind === 'deterministic_standard_binary_backtest'
        ? snapshot.blockedBacktests
        : acceptanceState === 'accepted_local_evidence' && runKind === 'private_paper_runtime_cycle'
          ? snapshot.acceptedPaperRuns
          : snapshot.blockedPaperRuns;
    return Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(payload);
      },
    });
  };

  const loaded = await loadBwsOperatorCockpitSnapshot(
    resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: 'http://127.0.0.1:4312',
    }),
    {
      evidenceScope: Object.freeze({ providerId: 'polymarket' }),
      includePinnedStrategyExports: true,
    },
    fetchImpl,
  );

  assert.equal(loaded.acceptedBacktests.page.returnedCount, snapshot.acceptedBacktests.page.returnedCount);
  assert.equal(loaded.blockedBacktests.page.returnedCount, snapshot.blockedBacktests.page.returnedCount);
  assert.equal(loaded.acceptedPaperRuns.page.returnedCount, snapshot.acceptedPaperRuns.page.returnedCount);
  assert.equal(loaded.blockedPaperRuns.page.returnedCount, snapshot.blockedPaperRuns.page.returnedCount);
  assert.equal(loaded.acceptedRuntimeCycles.page.returnedCount, snapshot.acceptedRuntimeCycles.page.returnedCount);
  assert.equal(loaded.blockedRuntimeCycles.page.returnedCount, snapshot.blockedRuntimeCycles.page.returnedCount);
  assert.equal(loaded.b1BacktestRuns.page.returnedCount, snapshot.b1BacktestRuns.page.returnedCount);
  assert.equal(loaded.pinnedStrategyExports?.page.returnedCount, snapshot.pinnedStrategyExports?.page.returnedCount);
  assert.equal(requestedUrls.length, 8);
  assert.match(requestedUrls[4] ?? '', /private-paper-runtime-cycles/);
  assert.match(requestedUrls[5] ?? '', /acceptanceState=blocked/);
  assert.notEqual(requestedUrls[6], undefined);
  assert.notEqual(requestedUrls[7], undefined);
  if (requestedUrls[6] === undefined || requestedUrls[7] === undefined) {
    throw new Error('Expected B1 research and pinned export cockpit requests.');
  }
  assert.match(requestedUrls[6], /b1\/backtest-runs/);
  assert.match(requestedUrls[7], /providerId=polymarket/);
});

test('BWS operator cockpit models fail closed on ambiguous blocked candidate summaries', () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const cloned = structuredClone(snapshot);
  const firstBlockedPaperRun = (cloned.blockedPaperRuns.page.items as unknown as Array<{
    entry: {
      report: {
        candidates: Array<{
          blockerCodes: string[];
          blockerCount: number;
        }>;
      };
    };
  }>)[0];
  assert.notEqual(firstBlockedPaperRun, undefined);
  if (firstBlockedPaperRun === undefined) {
    throw new Error('Expected blocked paper mock data.');
  }

  firstBlockedPaperRun.entry.report.candidates[0] = {
    ...firstBlockedPaperRun.entry.report.candidates[0]!,
    blockerCodes: [],
    blockerCount: 0,
  };

  assert.throws(
    () => buildBwsOperatorCockpitPageModel('/blockers', cloned),
    /Blocked candidate summaries must carry explicit blocker codes/,
  );
});

test('BWS operator cockpit models fail closed when grouped surfaces leak the wrong acceptance or run scope', () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const cloned = structuredClone(snapshot);
  const acceptedBacktest = (cloned.acceptedBacktests.page.items as unknown as Array<{
    entry: {
      acceptanceState: string;
      runKind: string;
    };
  }>)[0];
  assert.notEqual(acceptedBacktest, undefined);
  if (acceptedBacktest === undefined) {
    throw new Error('Expected accepted backtest mock data.');
  }

  acceptedBacktest.entry = {
    ...acceptedBacktest.entry,
    acceptanceState: 'blocked',
    runKind: 'private_paper_runtime_cycle',
  };

  assert.throws(
    () => buildBwsOperatorCockpitPageModel('/', cloned),
    /acceptedBacktests item .* acceptanceState blocked instead of accepted_local_evidence/,
  );
});

test('BWS operator cockpit API client builds bounded read-only requests and parses typed responses', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const requestedUrls: string[] = [];

  const fetchImpl: BwsOperatorCockpitFetchLike = async (input) => {
    requestedUrls.push(input);
    const url = new URL(input);
    const payload = url.pathname.endsWith('/b1/backtest-runs')
      ? snapshot.b1BacktestRuns
      : url.pathname.endsWith('/strategy-ledger')
      ? snapshot.blockedPaperRuns
      : snapshot.pinnedStrategyExports;
    return Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(payload);
      },
    });
  };

  const client = createBwsOperatorCockpitApiClient({
    apiBaseUrl: 'http://127.0.0.1:4312',
    dataMode: 'api',
  }, fetchImpl);

  const strategyLedger = await client.queryStrategyLedger({
    expand: 'provenance',
    filters: {
      acceptanceState: 'blocked',
      runKind: 'private_paper_runtime_cycle',
    },
    pageSize: 8,
  });
  assert.equal(strategyLedger.resource, 'strategy_ledger_entries');

  const evidence = await client.queryPinnedStrategyExports({
    expand: 'provenance',
    filters: {
      providerId: 'polymarket',
    },
    pageSize: 8,
  });
  assert.equal(evidence.resource, 'pinned_strategy_exports');

  const b1Research = await client.queryB1BacktestRuns({
    expand: 'reporting',
    filters: {
      offlineFalsificationStatus: 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
    },
    pageSize: 8,
  });
  assert.equal(b1Research.resource, 'b1_backtest_runs');

  assert.match(requestedUrls[0] ?? '', /acceptanceState=blocked/);
  assert.match(requestedUrls[0] ?? '', /runKind=private_paper_runtime_cycle/);
  assert.match(requestedUrls[1] ?? '', /providerId=polymarket/);
  assert.match(requestedUrls[1] ?? '', /expand=provenance/);
  assert.notEqual(requestedUrls[2], undefined);
  if (requestedUrls[2] === undefined) {
    throw new Error('Expected B1 research cockpit client request.');
  }
  assert.match(requestedUrls[2], /offlineFalsificationStatus=B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED/);
});

test('BWS operator cockpit API client rejects malformed non-string filters before fetch', async () => {
  let fetchCallCount = 0;
  const fetchImpl: BwsOperatorCockpitFetchLike = async () => {
    fetchCallCount += 1;
    throw new Error('Malformed cockpit requests must fail before fetch.');
  };
  const client = createBwsOperatorCockpitApiClient({
    apiBaseUrl: 'http://127.0.0.1:4312',
    dataMode: 'api',
  }, fetchImpl);

  await assert.rejects(
    () => client.queryStrategyLedger({
      expand: 'provenance',
      filters: {
        acceptanceState: 'blocked',
        reportId: null,
        runKind: 'private_paper_runtime_cycle',
      },
      pageSize: 8,
    } as never),
    /reportId must be a string when provided/,
  );
  await assert.rejects(
    () => client.queryPinnedStrategyExports({
      expand: 'provenance',
      filters: {
        providerId: 123,
      },
      pageSize: 8,
    } as never),
    /providerId must be a non-empty string when provided/,
  );
  await assert.rejects(
    () => client.queryB1BacktestRuns({
      expand: 'reporting',
      filters: {
        runId: null,
      },
      pageSize: 8,
    } as never),
    /runId must be a string when provided/,
  );
  await assert.rejects(
    () => client.queryPrivatePaperRuntimeCycles({
      expand: 'provenance',
      filters: {
        acceptanceState: 'blocked',
        runtimeId: null,
      },
      pageSize: 8,
    } as never),
    /runtimeId must be a string when provided/,
  );
  assert.equal(fetchCallCount, 0);
});

test('BWS operator cockpit API client fails closed on malformed committed-HEAD provenance and ambiguous blocked candidates', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const malformedProvenance = structuredClone(snapshot.acceptedBacktests);
  const malformedBlocked = structuredClone(snapshot.blockedPaperRuns);
  const malformedPinnedExports = structuredClone(snapshot.pinnedStrategyExports);
  const provenanceItems = malformedProvenance.page.items as unknown as Array<{
    provenance: {
      upstreamLock: Record<string, unknown>;
    };
  }>;
  const blockedItems = malformedBlocked.page.items as unknown as Array<{
    entry: {
      report: {
        candidates: Array<Record<string, unknown>>;
      };
    };
  }>;
  const pinnedExportItems = (malformedPinnedExports?.page.items ?? []) as unknown as Array<{
    record: Record<string, unknown>;
  }>;

  provenanceItems[0]!.provenance.upstreamLock = {
    ...provenanceItems[0]!.provenance.upstreamLock,
    sourceView: 'workspace_head',
  };
  blockedItems[0]!.entry.report.candidates[0] = {
    ...blockedItems[0]!.entry.report.candidates[0]!,
    blockerCodes: [],
  };
  pinnedExportItems[0]!.record = {
    ...pinnedExportItems[0]!.record,
    sourceSha256: 'bad',
  };

  const malformedProvenanceClient = createBwsOperatorCockpitApiClient(
    {
      apiBaseUrl: 'http://127.0.0.1:4312',
      dataMode: 'api',
    },
    async () => Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(malformedProvenance);
      },
    }),
  );

  await assert.rejects(
    () => malformedProvenanceClient.queryStrategyLedger({
      expand: 'provenance',
      filters: {
        acceptanceState: 'accepted_local_evidence',
        runKind: 'deterministic_standard_binary_backtest',
      },
      pageSize: 8,
    }),
    /sourceView must stay on committed_git_head/,
  );

  const malformedBlockedClient = createBwsOperatorCockpitApiClient(
    {
      apiBaseUrl: 'http://127.0.0.1:4312',
      dataMode: 'api',
    },
    async () => Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(malformedBlocked);
      },
    }),
  );

  await assert.rejects(
    () => malformedBlockedClient.queryStrategyLedger({
      expand: 'provenance',
      filters: {
        acceptanceState: 'blocked',
        runKind: 'private_paper_runtime_cycle',
      },
      pageSize: 8,
    }),
    /blockerCodes must contain explicit blocker codes/,
  );

  const malformedPinnedExportClient = createBwsOperatorCockpitApiClient(
    {
      apiBaseUrl: 'http://127.0.0.1:4312',
      dataMode: 'api',
    },
    async () => Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(malformedPinnedExports);
      },
    }),
  );

  await assert.rejects(
    () => malformedPinnedExportClient.queryPinnedStrategyExports({
      expand: 'provenance',
      filters: {
        providerId: 'polymarket',
      },
      pageSize: 8,
    }),
    /sourceSha256 must be a 64-character lower-case SHA-256 value/,
  );
});

test('BWS operator cockpit API client rejects uppercase response hashes and Git identifiers without normalizing them', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();

  const uppercaseCommit = structuredClone(snapshot.acceptedBacktests);
  const uppercaseCommitItems = uppercaseCommit.page.items as unknown as Array<{
    entry: {
      report: {
        upstream: Record<string, unknown>;
      };
    };
    provenance: {
      upstreamLock: Record<string, unknown>;
    };
  }>;
  uppercaseCommitItems[0]!.entry.report.upstream = {
    ...uppercaseCommitItems[0]!.entry.report.upstream,
    commitSha: 'A'.repeat(40),
  };
  uppercaseCommitItems[0]!.provenance.upstreamLock = {
    ...uppercaseCommitItems[0]!.provenance.upstreamLock,
    commitSha: 'A'.repeat(40),
  };

  const uppercaseSha = structuredClone(snapshot.acceptedBacktests);
  const uppercaseShaItems = uppercaseSha.page.items as unknown as Array<{
    entry: {
      report: {
        upstream: Record<string, unknown>;
      };
    };
    provenance: {
      upstreamLock: Record<string, unknown>;
    };
  }>;
  uppercaseShaItems[0]!.entry.report.upstream = {
    ...uppercaseShaItems[0]!.entry.report.upstream,
    trackedTreeListingSha256: 'B'.repeat(64),
  };
  uppercaseShaItems[0]!.provenance.upstreamLock = {
    ...uppercaseShaItems[0]!.provenance.upstreamLock,
    trackedTreeListingSha256: 'B'.repeat(64),
  };

  const createClientFor = (payload: unknown) =>
    createBwsOperatorCockpitApiClient(
      {
        apiBaseUrl: 'http://127.0.0.1:4312',
        dataMode: 'api',
      },
      async () => Object.freeze({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(payload);
        },
      }),
    );

  await assert.rejects(
    () => createClientFor(uppercaseCommit).queryStrategyLedger({
      expand: 'provenance',
      filters: {
        acceptanceState: 'accepted_local_evidence',
        runKind: 'deterministic_standard_binary_backtest',
      },
      pageSize: 8,
    }),
    /commitSha must be a 40-character lower-case Git identifier/,
  );

  await assert.rejects(
    () => createClientFor(uppercaseSha).queryStrategyLedger({
      expand: 'provenance',
      filters: {
        acceptanceState: 'accepted_local_evidence',
        runKind: 'deterministic_standard_binary_backtest',
      },
      pageSize: 8,
    }),
    /trackedTreeListingSha256 must be a 64-character lower-case SHA-256 value/,
  );
});

test('BWS operator cockpit API client fails closed when strategy-ledger rows escape the requested scope', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const createClient = () =>
    createBwsOperatorCockpitApiClient(
      {
        apiBaseUrl: 'http://127.0.0.1:4312',
        dataMode: 'api',
      },
      async () => Object.freeze({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(snapshot.acceptedBacktests);
        },
      }),
    );

  for (const [filter, expectedMessage] of [
    [{ acceptanceState: 'blocked' }, /acceptanceState accepted_local_evidence did not match requested blocked/],
    [{ pinnedStrategyExportRecordId: 'pinned-export-requested' }, /pinnedStrategyExportRecordId intake-001 did not match requested pinned-export-requested/],
    [{ reportId: 'report-requested' }, /reportId report-backtest-accepted-001 did not match requested report-requested/],
    [{ runFingerprintSha256: '9'.repeat(64) }, /runFingerprintSha256 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa did not match requested/],
    [{ runKind: 'private_paper_runtime_cycle' }, /runKind deterministic_standard_binary_backtest did not match requested private_paper_runtime_cycle/],
    [{ runReferenceId: 'run-reference-requested' }, /runReferenceId backtest-run-001 did not match requested run-reference-requested/],
    [{ sourceKind: 'read_only_query' }, /sourceKind resource_export did not match requested read_only_query/],
    [{ sourceManifestHash: 'c'.repeat(64) }, /sourceManifestHash bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb did not match requested/],
    [{ upstreamLockRecordId: 'lock-requested' }, /upstreamLockRecordId lock-001 did not match requested lock-requested/],
  ] as const) {
    await assert.rejects(
      () => createClient().queryStrategyLedger({
        expand: 'provenance',
        filters: filter,
        pageSize: 8,
      }),
      expectedMessage,
    );
  }
});

test('BWS operator cockpit API client fails closed on inconsistent counts and escaped non-strategy scopes', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const mismatchedCount = structuredClone(snapshot.pinnedStrategyExports);
  const mismatchedPinned = structuredClone(snapshot.pinnedStrategyExports);
  const mismatchedRuntime = structuredClone(snapshot.blockedRuntimeCycles);
  const mismatchedB1 = structuredClone(snapshot.b1BacktestRuns);
  const missingB1Status = structuredClone(snapshot.b1BacktestRuns);

  if (mismatchedCount === undefined || mismatchedPinned === undefined) {
    throw new Error('Expected pinned export mock response.');
  }
  (mismatchedCount.page as { returnedCount: number }).returnedCount = 0;

  const pinnedItems = mismatchedPinned.page.items as unknown as Array<{
    record: { providerId: string; sourceSha256: string };
  }>;
  pinnedItems[0]!.record = {
    ...pinnedItems[0]!.record,
    providerId: 'kalshi',
    sourceSha256: '6'.repeat(64),
  };

  const b1Items = mismatchedB1.page.items as unknown as Array<{
    run: { offlineFalsificationStatus: string; report: { offlineFalsificationStatus: string } };
  }>;
  b1Items[0]!.run = {
    ...b1Items[0]!.run,
    offlineFalsificationStatus: 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
    report: {
      ...b1Items[0]!.run.report,
      offlineFalsificationStatus: 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
    },
  };
  const missingB1StatusItems = missingB1Status.page.items as unknown as Array<{
    run: Record<string, unknown>;
  }>;
  delete missingB1StatusItems[0]!.run['offlineFalsificationStatus'];

  const createClientFor = (payload: unknown) =>
    createBwsOperatorCockpitApiClient(
      {
        apiBaseUrl: 'http://127.0.0.1:4312',
        dataMode: 'api',
      },
      async () => Object.freeze({
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify(payload);
        },
      }),
    );

  await assert.rejects(
    () => createClientFor(mismatchedCount).queryPinnedStrategyExports({
      expand: 'provenance',
      filters: {
        providerId: 'polymarket',
      },
      pageSize: 8,
    }),
    /page\.returnedCount 0 must match page\.items length 1/,
  );

  await assert.rejects(
    () => createClientFor(mismatchedPinned).queryPinnedStrategyExports({
      expand: 'provenance',
      filters: {
        providerId: 'polymarket',
      },
      pageSize: 8,
    }),
    /pinned_strategy_exports response providerId kalshi did not match requested polymarket/,
  );

  await assert.rejects(
    () => createClientFor(mismatchedRuntime).queryPrivatePaperRuntimeCycles({
      expand: 'provenance',
      filters: {
        acceptanceState: 'accepted_local_evidence',
      },
      pageSize: 8,
    }),
    /private_paper_runtime_cycles response acceptanceState blocked did not match requested accepted_local_evidence/,
  );

  await assert.rejects(
    () => createClientFor(mismatchedB1).queryB1BacktestRuns({
      expand: 'reporting',
      filters: {
        offlineFalsificationStatus: 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
      },
      pageSize: 8,
    }),
    /b1_backtest_runs response offlineFalsificationStatus B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT did not match requested B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED/,
  );

  await assert.rejects(
    () => createClientFor(missingB1Status).queryB1BacktestRuns({
      expand: 'reporting',
      filters: {
        runId: 'b1-run-001',
      },
      pageSize: 8,
    }),
    /page\.items\[0\]\.run\.offlineFalsificationStatus must be a non-empty string/,
  );

  for (const [reportOverrides, expectedMessage] of [
    [{ reportKind: 'forged_report' }, /page\.items\[0\]\.run\.report\.reportKind must remain deterministic_b1_cross_venue_backtest_report/],
    [{ runtimeEvidence: true }, /page\.items\[0\]\.run\.report\.runtimeEvidence must stay false/],
    [{ executable: true }, /page\.items\[0\]\.run\.report\.executable must stay false/],
    [{ liveReadiness: 'ready' }, /page\.items\[0\]\.run\.report\.liveReadiness must keep BWS-900 parked/],
    [{ upstreamReadiness: 'ready' }, /page\.items\[0\]\.run\.report\.upstreamReadiness must preserve the upstream B1 blocker/],
    [
      { offlineFalsificationStatus: 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT' },
      /page\.items\[0\]\.run\.report\.offlineFalsificationStatus must match run\.offlineFalsificationStatus/,
    ],
  ] as const) {
    const malformedB1Report = structuredClone(snapshot.b1BacktestRuns);
    const malformedB1ReportItems = malformedB1Report.page.items as unknown as Array<{
      run: {
        report: Record<string, unknown>;
      };
    }>;
    malformedB1ReportItems[0]!.run.report = {
      ...malformedB1ReportItems[0]!.run.report,
      ...reportOverrides,
    };
    await assert.rejects(
      () => createClientFor(malformedB1Report).queryB1BacktestRuns({
        expand: 'reporting',
        filters: {
          runId: 'b1-run-001',
        },
        pageSize: 8,
      }),
      expectedMessage,
    );
  }

  for (const [filter, expectedMessage] of [
    [{ runId: 'b1-run-requested' }, /b1_backtest_runs response runId b1-run-001 did not match requested b1-run-requested/],
    [
      { sourceManifestHash: 'a'.repeat(64) },
      /b1_backtest_runs response sourceManifestHash 8888888888888888888888888888888888888888888888888888888888888888 did not match requested/,
    ],
    [
      { upstreamCheckpointId: 'b1-checkpoint-requested' },
      /b1_backtest_runs response upstreamCheckpointId b1-checkpoint-001 did not match requested b1-checkpoint-requested/,
    ],
    [
      { upstreamLockFingerprint: 'b'.repeat(64) },
      /b1_backtest_runs response upstreamLockFingerprint 9999999999999999999999999999999999999999999999999999999999999999 did not match requested/,
    ],
  ] as const) {
    await assert.rejects(
      () => createClientFor(snapshot.b1BacktestRuns).queryB1BacktestRuns({
        expand: 'reporting',
        filters: filter,
        pageSize: 8,
      }),
      expectedMessage,
    );
  }

  for (const [filter, expectedMessage] of [
    [{ queueName: 'private-paper-requested' }, /private_paper_runtime_cycles response queueName private-paper did not match requested private-paper-requested/],
    [{ runtimeId: 'runtime-requested' }, /private_paper_runtime_cycles response runtimeId runtime-001 did not match requested runtime-requested/],
    [
      { schedulerCheckpointId: 'scheduler-requested' },
      /private_paper_runtime_cycles response schedulerCheckpointId scheduler-001 did not match requested scheduler-requested/,
    ],
    [
      { upstreamLockRecordId: 'lock-requested' },
      /private_paper_runtime_cycles response upstreamLockRecordId lock-001 did not match requested lock-requested/,
    ],
  ] as const) {
    await assert.rejects(
      () => createClientFor(snapshot.blockedRuntimeCycles).queryPrivatePaperRuntimeCycles({
        expand: 'provenance',
        filters: filter,
        pageSize: 8,
      }),
      expectedMessage,
    );
  }

  for (const [filter, expectedMessage] of [
    [{ endpointId: 'endpoint-requested' }, /pinned_strategy_exports response endpointId endpoint-pm-primary did not match requested endpoint-requested/],
    [
      { exportId: 'provider-history-export.requested' },
      /pinned_strategy_exports response exportId provider-history-export\.mock-001 did not match requested provider-history-export\.requested/,
    ],
    [{ importRunId: 'import-requested' }, /pinned_strategy_exports response importRunId import-run-001 did not match requested import-requested/],
    [
      { sourceSha256: 'a'.repeat(64) },
      /pinned_strategy_exports response sourceSha256 5555555555555555555555555555555555555555555555555555555555555555 did not match requested/,
    ],
    [{ upstreamLockRecordId: 'lock-requested' }, /pinned_strategy_exports response upstreamLockRecordId lock-001 did not match requested lock-requested/],
  ] as const) {
    await assert.rejects(
      () => createClientFor(snapshot.pinnedStrategyExports).queryPinnedStrategyExports({
        expand: 'provenance',
        filters: filter,
        pageSize: 8,
      }),
      expectedMessage,
    );
  }
});

test('BWS operator cockpit validation contract includes the web workspace in root validation', () => {
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
  ) as {
    scripts?: Record<string, string>;
  };
  const cockpitBuilder = readFileSync(
    join(process.cwd(), 'scripts', 'build_bws_operator_cockpit.mjs'),
    'utf-8',
  );
  const webPackageJson = JSON.parse(
    readFileSync(join(process.cwd(), 'apps', 'web', 'package.json'), 'utf-8'),
  ) as { scripts?: Record<string, string> };

  assert.match(
    packageJson.scripts?.['validate:web'] ?? '',
    /npm run --workspace @betting-win-surebet\/web typecheck/,
  );
  assert.match(
    packageJson.scripts?.['validate:web'] ?? '',
    /BWS_API_PORT=4312 npm run build:runtime-cockpit/,
  );
  assert.match(
    packageJson.scripts?.['validate:starter'] ?? '',
    /npm run validate:web/,
  );
  assert.equal(webPackageJson.scripts?.build, 'node node_modules/vite/bin/vite.js build');
  assert.match(cockpitBuilder, /port > 65535/);
  assert.match(cockpitBuilder, /BWS_API_PORT must be a TCP port in the range 1\.\.65535/);
});
