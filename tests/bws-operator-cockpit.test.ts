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

  assert.deepEqual(
    normalizeBwsOperatorCockpitPinnedExportScope({
      providerId: ' polymarket ',
      upstreamLockRecordId: ' lock-001 ',
    }),
    Object.freeze({
      providerId: 'polymarket',
      upstreamLockRecordId: 'lock-001',
    }),
  );
});

test('BWS operator cockpit route list preserves the bounded surface required by BWS-420', () => {
  const routes = listBwsOperatorCockpitRoutes();
  assert.deepEqual(
    routes.map((route) => route.path),
    ['/', '/opportunities', '/evidence', '/backtests', '/paper-runs', '/exposure', '/blockers'],
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
  assert.equal(loaded.pinnedStrategyExports?.page.returnedCount, snapshot.pinnedStrategyExports?.page.returnedCount);
  assert.equal(requestedUrls.length, 7);
  assert.match(requestedUrls[4] ?? '', /private-paper-runtime-cycles/);
  assert.match(requestedUrls[5] ?? '', /acceptanceState=blocked/);
  assert.match(requestedUrls[6] ?? '', /providerId=polymarket/);
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
    const payload = url.pathname.endsWith('/strategy-ledger')
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
    apiBaseUrl: 'https://cockpit.invalid',
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

  assert.match(requestedUrls[0] ?? '', /acceptanceState=blocked/);
  assert.match(requestedUrls[0] ?? '', /runKind=private_paper_runtime_cycle/);
  assert.match(requestedUrls[1] ?? '', /providerId=polymarket/);
  assert.match(requestedUrls[1] ?? '', /expand=provenance/);
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
      apiBaseUrl: 'https://cockpit.invalid',
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
      apiBaseUrl: 'https://cockpit.invalid',
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
      apiBaseUrl: 'https://cockpit.invalid',
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

test('BWS operator cockpit API client fails closed when strategy-ledger rows escape the requested acceptance or run scope', async () => {
  const snapshot = createMockBwsOperatorCockpitSnapshot();
  const mismatchedScope = structuredClone(snapshot.acceptedBacktests);
  const mismatchedItems = mismatchedScope.page.items as unknown as Array<{
    entry: {
      acceptanceState: string;
      report: {
        acceptanceState: string;
        runKind: string;
      };
      runKind: string;
    };
  }>;

  mismatchedItems[0]!.entry = {
    ...mismatchedItems[0]!.entry,
    acceptanceState: 'blocked',
    report: {
      ...mismatchedItems[0]!.entry.report,
      acceptanceState: 'blocked',
      runKind: 'private_paper_runtime_cycle',
    },
    runKind: 'private_paper_runtime_cycle',
  };

  const client = createBwsOperatorCockpitApiClient(
    {
      apiBaseUrl: 'https://cockpit.invalid',
      dataMode: 'api',
    },
    async () => Object.freeze({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(mismatchedScope);
      },
    }),
  );

  await assert.rejects(
    () => client.queryStrategyLedger({
      expand: 'provenance',
      filters: {
        acceptanceState: 'accepted_local_evidence',
        runKind: 'deterministic_standard_binary_backtest',
      },
      pageSize: 8,
    }),
    /did not match requested accepted_local_evidence/,
  );
});

test('BWS operator cockpit validation contract includes the web workspace in root validation', () => {
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
  ) as {
    scripts?: Record<string, string>;
  };

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
});
