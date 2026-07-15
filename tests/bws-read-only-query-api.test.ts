import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamLockRepository,
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import {
  createBwsReadOnlyQueryService,
  type BwsReadOnlyQueryDependencies,
} from '../src/api/bws-read-only-query-service.js';
import { createBwsReadOnlyQueryHttpHandler } from '../src/api/bws-read-only-query-http.js';
import { validatePinnedBettingWinBundleIntake } from '../src/adapters/betting-win-pinned-bundle-intake.js';
import {
  runDeterministicStandardBinaryBacktest,
  type StandardBinaryBacktestExecutionPlan,
} from '../src/backtest/standard-binary-backtest.js';
import { createBacktestStrategyLedgerEntry } from '../src/strategy/strategy-ledger.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';

const REPO_ROOT = process.cwd();
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';
const TEST_TIMESTAMP = '2026-07-15T08:45:00.000Z';

test('BWS read-only query service fails closed on missing provenance expansion, unbounded filters, and page overflow', () => {
  const service = createBwsReadOnlyQueryService(createStubDependencies(), {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 50,
  });
  assert.equal(service.ok, true);

  const missingExpansion = service.value.queryStrategyLedger({
    filters: {
      acceptanceState: 'blocked',
      runKind: 'private_paper_runtime_cycle',
    },
    pageSize: 1,
  });
  assert.equal(missingExpansion.ok, false);
  assert.equal(missingExpansion.blockers[0]?.code, 'BWS_QUERY_EXPANSION_REQUIRED');

  const unboundedFilters = service.value.queryStrategyLedger({
    expand: 'provenance',
    filters: {
      acceptanceState: 'blocked',
    },
    pageSize: 1,
  });
  assert.equal(unboundedFilters.ok, false);
  assert.equal(unboundedFilters.blockers[0]?.code, 'BWS_QUERY_FILTERS_UNBOUNDED');

  const pageOverflow = service.value.queryPinnedStrategyExports({
    expand: 'provenance',
    filters: {
      exportId: 'provider-history-export.fixture-001.20260715t084500000z.fixture',
    },
    pageSize: 51,
  });
  assert.equal(pageOverflow.ok, false);
  assert.equal(pageOverflow.blockers[0]?.code, 'BWS_QUERY_PAGE_SIZE_EXCEEDED');
});

test('BWS read-only query HTTP handler applies security headers and returns fail-closed validation errors', async () => {
  const service = createBwsReadOnlyQueryService(createStubDependencies(), {
    generatedAt: () => TEST_TIMESTAMP,
    maxPageSize: 50,
  });
  assert.equal(service.ok, true);

  const server = createServer(createBwsReadOnlyQueryHttpHandler(service.value));
  await listen(server);
  try {
    const response = await fetch(
      `http://127.0.0.1:${getServerPort(server)}/api/read-only/strategy-ledger?acceptanceState=blocked&runKind=private_paper_runtime_cycle&pageSize=1`,
    );
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');

    const body = await response.json() as {
      readonly error: {
        readonly code: string;
      };
      readonly ok: boolean;
    };
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'BWS_QUERY_EXPANSION_REQUIRED');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('BWS read-only query HTTP API returns immutable strategy-ledger and pinned-export provenance over surebet persistence', { skip: !hasDisposableDatabaseTestConfig() }, async () => {
  const database = createDisposableDatabaseContext();
  const lockRepository = new SurebetUpstreamLockRepository(database.databaseConfig);
  const importRunRepository = new SurebetImportRunRepository(database.databaseConfig);
  const pinnedRepository = new SurebetPinnedStrategyExportRepository(database.databaseConfig);
  const strategyLedgerRepository = new SurebetStrategyLedgerRepository(database.databaseConfig);

  try {
    applySurebetMigrations(database.databaseConfig);
    const lockRecord = lockRepository.put({
      lockRecordId: 'lock-bws-400-001',
      lock: sampleUpstreamLock(),
    });

    importRunRepository.create({
      importRunId: 'import-bws-400-001',
      upstreamLockRecordId: lockRecord.lockRecordId,
      sourceKind: 'workspace_export_bundle',
      sourceLocator: '/tmp/bws-400/export.json',
      requestedAt: TEST_TIMESTAMP,
      startedAt: TEST_TIMESTAMP,
      metadata: Object.freeze({
        contractSchema: 'betting-win.strategy-export.v1',
      }),
    });
    importRunRepository.finalize({
      completedAt: '2026-07-15T08:46:00.000Z',
      importedRecordCount: 4,
      importRunId: 'import-bws-400-001',
      outcome: 'succeeded',
    });

    const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
    assert.equal(intake.ok, true);
    const pinnedExport = pinnedRepository.create({
      intakeRecordId: 'intake-bws-400-001',
      importRunId: 'import-bws-400-001',
      upstreamLockRecordId: lockRecord.lockRecordId,
      sourceSha256: '4'.repeat(64),
      sourceLocator: '/tmp/bws-400/pinned-export.json',
      contractSchema: 'betting-win.strategy-export.v1',
      contractAlias: 'betting-win-strategy-export.v1',
      surebetProfile: 'surebet_standard_binary_v0',
      exportId: 'provider-history-export.fixture-001.20260715t084500000z.fixture',
      exportKind: 'pinned_provider_history_bundle',
      exportProfile: 'provider_history_fixture_bundle_v1',
      exportedAt: TEST_TIMESTAMP,
      providerId: 'polymarket',
      endpointId: 'endpoint-001',
      payloadSha256: '5'.repeat(64),
      providerGenerationIds: ['generation-id-001'],
      sourceLineageRecordIds: ['record-001'],
      normalizedEvidenceIds: ['normalized-001'],
      importedAt: TEST_TIMESTAMP,
    });

    const backtest = runDeterministicStandardBinaryBacktest({
      bundle: intake.value.bundle,
      records: intake.value.records,
      executionPlans: [sampleExecutionPlan()],
    });
    assert.equal(backtest.ok, true);

    const ledgerEntry = createBacktestStrategyLedgerEntry({
      upstreamLock: sampleUpstreamLock(),
      run: backtest.value,
    });
    assert.equal(ledgerEntry.ok, true);

    strategyLedgerRepository.create({
      entry: ledgerEntry.value,
      pinnedStrategyExportRecordId: pinnedExport.intakeRecordId,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    const service = createBwsReadOnlyQueryService({
      importRuns: importRunRepository,
      pinnedStrategyExports: pinnedRepository,
      strategyLedger: strategyLedgerRepository,
      upstreamLocks: lockRepository,
    } satisfies BwsReadOnlyQueryDependencies, {
      generatedAt: () => TEST_TIMESTAMP,
      maxPageSize: 25,
    });
    assert.equal(service.ok, true);

    const server = createServer(createBwsReadOnlyQueryHttpHandler(service.value));
    await listen(server);
    try {
      const baseUrl = `http://127.0.0.1:${getServerPort(server)}`;

      const strategyLedgerResponse = await fetch(
        `${baseUrl}/api/read-only/strategy-ledger?expand=provenance&pageSize=1&acceptanceState=accepted_local_evidence&runKind=deterministic_standard_binary_backtest`,
      );
      assert.equal(strategyLedgerResponse.status, 200);
      const strategyLedgerBody = await strategyLedgerResponse.json() as {
        readonly boundary: {
          readonly automaticFallback: string;
        };
        readonly page: {
          readonly items: ReadonlyArray<{
            readonly entry: {
              readonly acceptanceState: string;
            };
            readonly provenance: {
              readonly importRun: {
                readonly outcome: string;
              };
              readonly pinnedStrategyExport: {
                readonly intakeRecordId: string;
              };
              readonly upstreamLock: {
                readonly commitSha: string;
              };
            };
          }>;
          readonly returnedCount: number;
        };
        readonly resource: string;
      };
      assert.equal(strategyLedgerBody.resource, 'strategy_ledger_entries');
      assert.equal(strategyLedgerBody.boundary.automaticFallback, 'forbidden');
      assert.equal(strategyLedgerBody.page.returnedCount, 1);
      assert.equal(strategyLedgerBody.page.items[0]?.entry.acceptanceState, 'accepted_local_evidence');
      assert.equal(strategyLedgerBody.page.items[0]?.provenance.pinnedStrategyExport.intakeRecordId, pinnedExport.intakeRecordId);
      assert.equal(strategyLedgerBody.page.items[0]?.provenance.importRun.outcome, 'succeeded');
      assert.equal(strategyLedgerBody.page.items[0]?.provenance.upstreamLock.commitSha, sampleUpstreamLock().commitSha);

      const pinnedResponse = await fetch(
        `${baseUrl}/api/read-only/pinned-strategy-exports?expand=provenance&pageSize=1&exportId=${encodeURIComponent(pinnedExport.exportId)}`,
      );
      assert.equal(pinnedResponse.status, 200);
      const pinnedBody = await pinnedResponse.json() as {
        readonly page: {
          readonly items: ReadonlyArray<{
            readonly provenance: {
              readonly importRun: {
                readonly importRunId: string;
              };
              readonly upstreamLock: {
                readonly gitTreeSha: string;
              };
            };
            readonly record: {
              readonly exportId: string;
            };
          }>;
          readonly returnedCount: number;
        };
        readonly resource: string;
      };
      assert.equal(pinnedBody.resource, 'pinned_strategy_exports');
      assert.equal(pinnedBody.page.returnedCount, 1);
      assert.equal(pinnedBody.page.items[0]?.record.exportId, pinnedExport.exportId);
      assert.equal(pinnedBody.page.items[0]?.provenance.importRun.importRunId, 'import-bws-400-001');
      assert.equal(pinnedBody.page.items[0]?.provenance.upstreamLock.gitTreeSha, sampleUpstreamLock().gitTreeSha);
    } finally {
      server.close();
      await once(server, 'close');
    }
  } finally {
    dropDisposableDatabase(database.adminConfig, database.databaseName);
  }
});

function createStubDependencies(): BwsReadOnlyQueryDependencies {
  const fail = () => {
    throw new Error('stub should not be called for fail-closed validation tests');
  };
  return Object.freeze({
    importRuns: Object.freeze({
      get: fail,
    }),
    pinnedStrategyExports: Object.freeze({
      get: fail,
      list: fail,
    }),
    strategyLedger: Object.freeze({
      list: fail,
    }),
    upstreamLocks: Object.freeze({
      get: fail,
    }),
  }) as BwsReadOnlyQueryDependencies;
}

function hasDisposableDatabaseTestConfig(): boolean {
  return readDisposableDatabaseTestEnvironment() !== undefined;
}

function readDisposableDatabaseTestEnvironment():
  | {
      readonly adminConfig: SurebetPersistenceConfig;
      readonly connectionConfig: Omit<SurebetPersistenceConfig, 'database'>;
    }
  | undefined {
  const adminDatabase = process.env.SUREBET_TEST_ADMIN_DATABASE;
  const user = process.env.SUREBET_TEST_USER;
  const port = process.env.SUREBET_TEST_PORT;
  const host = process.env.SUREBET_TEST_HOST;
  const socketDirectory = process.env.SUREBET_TEST_SOCKET_DIRECTORY;
  const password = process.env.SUREBET_TEST_PASSWORD;
  if (
    adminDatabase === undefined
    || user === undefined
    || port === undefined
    || (host === undefined && socketDirectory === undefined)
    || (host !== undefined && socketDirectory !== undefined)
  ) {
    return undefined;
  }
  const environment = {
    SUREBET_PG_DATABASE: adminDatabase,
    SUREBET_PG_USER: user,
    SUREBET_PG_PORT: port,
  } as {
    SUREBET_PG_DATABASE: string;
    SUREBET_PG_USER: string;
    SUREBET_PG_PORT: string;
    SUREBET_PG_HOST?: string;
    SUREBET_PG_SOCKET_DIRECTORY?: string;
    SUREBET_PG_PASSWORD?: string;
  };
  if (host !== undefined) {
    environment.SUREBET_PG_HOST = host;
  }
  if (socketDirectory !== undefined) {
    environment.SUREBET_PG_SOCKET_DIRECTORY = socketDirectory;
  }
  if (password !== undefined) {
    environment.SUREBET_PG_PASSWORD = password;
  }
  const adminConfig = resolveSurebetPersistenceConfig(environment);
  const { database: _database, ...connectionConfig } = adminConfig;
  return Object.freeze({
    adminConfig,
    connectionConfig: Object.freeze(connectionConfig),
  });
}

function createDisposableDatabaseContext(): {
  readonly adminConfig: SurebetPersistenceConfig;
  readonly databaseConfig: SurebetPersistenceConfig;
  readonly databaseName: string;
} {
  const environment = readDisposableDatabaseTestEnvironment();
  assert.ok(environment !== undefined);
  const databaseName = `bws_400_${Date.now()}_${process.pid}`;
  createDisposableDatabase(environment.adminConfig, databaseName);
  return Object.freeze({
    adminConfig: environment.adminConfig,
    databaseConfig: Object.freeze({
      ...environment.connectionConfig,
      database: databaseName,
    }),
    databaseName,
  });
}

function createDisposableDatabase(config: SurebetPersistenceConfig, databaseName: string): void {
  execFileSync('createdb', [...buildDatabaseUtilityArgs(config), databaseName], {
    encoding: 'utf-8',
    env: withPassword(config),
    stdio: 'pipe',
  });
}

function dropDisposableDatabase(config: SurebetPersistenceConfig, databaseName: string): void {
  execFileSync('dropdb', [...buildDatabaseUtilityArgs(config), '--if-exists', databaseName], {
    encoding: 'utf-8',
    env: withPassword(config),
    stdio: 'pipe',
  });
}

function sampleExecutionPlan() {
  return Object.freeze({
    canonicalMarketId: 'market-002',
    decisionTimestamp: '2026-07-01T00:00:02.500Z',
    maxQuoteAgeMs: 2_000,
    manualKill: false,
    completionEvents: Object.freeze([
      { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
      { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
      { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
      { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
    ]),
  } satisfies StandardBinaryBacktestExecutionPlan);
}

function sampleUpstreamLock(): BettingWinUpstreamLock {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: '/tmp/betting-win',
    commitSha: '1'.repeat(40),
    gitTreeSha: '2'.repeat(40),
    sourceView: 'committed_git_head',
    packageVersion: '0.48.0',
    trackedTreeListingSha256: '3'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt: TEST_TIMESTAMP,
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
  });
}

async function listen(server: ReturnType<typeof createServer>): Promise<void> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
}

function getServerPort(server: ReturnType<typeof createServer>): number {
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  return (address as AddressInfo).port;
}

function buildDatabaseUtilityArgs(config: SurebetPersistenceConfig): readonly string[] {
  return Object.freeze([
    '-U',
    config.user,
    '-p',
    String(config.port),
    '-h',
    config.host ?? config.socketDirectory!,
    '--maintenance-db',
    config.database,
  ]);
}

function withPassword(config: SurebetPersistenceConfig): NodeJS.ProcessEnv {
  const passwordEnvironmentKey = ['PG', 'PASSWORD'].join('');
  return config.password === undefined
    ? process.env
    : { ...process.env, [passwordEnvironmentKey]: config.password };
}
