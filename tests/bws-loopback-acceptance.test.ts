import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import {
  type BwsServiceRuntimeEnvironment,
  createBwsOperationalStatusSnapshot,
  createBwsReadOnlyQueryHttpHandler,
  createBwsReadOnlyQueryService,
  createPrivatePaperRuntimeJobHandler,
  describeBwsReadOnlyQueryServiceBoundary,
  resolveBwsServiceRuntimeConfig,
  runBoundedWorkerPass,
  runDeterministicStandardBinaryBacktest,
  validatePinnedBettingWinBundleIntake,
  type BwsReadOnlyQueryDependencies,
  type PersistedPrivatePaperRuntimeJobPayload,
  type StandardBinaryBacktestExecutionPlan,
} from '../packages/bootstrap/src/index.js';
import type { BettingWinResourceRecord } from '../packages/bootstrap/src/contracts/betting-win-resource-records.js';
import { createBacktestStrategyLedgerEntry } from '../packages/bootstrap/src/strategy/strategy-ledger.js';
import type { JsonValue } from '../packages/persistence/src/types.js';
import {
  readBettingWinUpstreamLock,
  verifyBettingWinUpstreamLock,
} from '../packages/upstream/src/index.js';
import {
  BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV,
  BWS_OPERATOR_COCKPIT_DATA_MODE_ENV,
  buildBwsOperatorCockpitPageModel,
  describeBwsOperatorCockpitProcessDefinition,
  loadBwsOperatorCockpitSnapshot,
  resolveBwsOperatorCockpitBrowserConfig,
} from '../apps/web/src/index.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-15T12:00:00.000Z';
const UPSTREAM_LOCK_PATH = 'config/betting-win.upstream.lock.json';
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';
const PINNED_EXPORT_ID = 'provider-history-export.fixture-001.20260715t120000000z.fixture';
const PINNED_PROVIDER_ID = 'polymarket';
const PINNED_ENDPOINT_ID = 'endpoint-001';
const PINNED_EXPORT_KIND = 'pinned_provider_history_bundle';
const PINNED_EXPORT_PROFILE = 'provider_history_fixture_bundle_v1';
const PINNED_PROVIDER_GENERATION_IDS = Object.freeze(['generation-510-001']);

test('loopback acceptance assembles migration, intake, backtest, paper worker, API, cockpit, and readiness on the closed local stack', { skip: !hasDisposableDatabaseTestConfig() }, async () => {
  const database = createDisposableDatabaseContext();
  try {
    applySurebetMigrations(database.databaseConfig);

    const verifiedUpstreamLock = verifyBettingWinUpstreamLock(
      readBettingWinUpstreamLock(UPSTREAM_LOCK_PATH, REPO_ROOT),
      { repositoryRoot: REPO_ROOT },
    );
    const upstreamLocks = new SurebetUpstreamLockRepository(database.databaseConfig);
    const importRuns = new SurebetImportRunRepository(database.databaseConfig);
    const pinnedExports = new SurebetPinnedStrategyExportRepository(database.databaseConfig);
    const strategyLedger = new SurebetStrategyLedgerRepository(database.databaseConfig);
    const jobs = new SurebetWorkerJobRepository(database.databaseConfig);

    const lockRecord = upstreamLocks.put({
      lock: verifiedUpstreamLock,
      lockRecordId: 'lock-510-001',
    });

    importRuns.create({
      importRunId: 'import-510-001',
      metadata: Object.freeze({
        contractSchema: verifiedUpstreamLock.contractSchema,
        intakeMode: 'loopback_acceptance',
      }),
      requestedAt: TEST_TIMESTAMP,
      sourceKind: 'workspace_export_bundle',
      sourceLocator: '/tmp/bws-510/export.json',
      startedAt: TEST_TIMESTAMP,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
    assert.equal(intake.ok, true);

    importRuns.finalize({
      completedAt: '2026-07-15T12:00:10.000Z',
      importRunId: 'import-510-001',
      importedRecordCount: intake.value.records.length,
      outcome: 'succeeded',
    });

    const pinnedExport = pinnedExports.create({
      contractAlias: verifiedUpstreamLock.contractAlias,
      contractSchema: verifiedUpstreamLock.contractSchema,
      endpointId: PINNED_ENDPOINT_ID,
      exportId: PINNED_EXPORT_ID,
      exportKind: PINNED_EXPORT_KIND,
      exportProfile: PINNED_EXPORT_PROFILE,
      exportedAt: intake.value.bundle.exportedAt,
      importRunId: 'import-510-001',
      importedAt: TEST_TIMESTAMP,
      intakeRecordId: 'intake-510-001',
      normalizedEvidenceIds: ['normalized-510-001'],
      payloadSha256: '5'.repeat(64),
      providerGenerationIds: PINNED_PROVIDER_GENERATION_IDS,
      providerId: PINNED_PROVIDER_ID,
      sourceLineageRecordIds: ['lineage-510-001'],
      sourceLocator: '/tmp/bws-510/pinned-export.json',
      sourceSha256: '4'.repeat(64),
      surebetProfile: verifiedUpstreamLock.surebetProfile,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    const backtest = runDeterministicStandardBinaryBacktest({
      bundle: intake.value.bundle,
      executionPlans: [sampleExecutionPlan()],
      records: intake.value.records,
    });
    assert.equal(backtest.ok, true);

    const backtestLedgerEntry = createBacktestStrategyLedgerEntry({
      run: backtest.value,
      upstreamLock: verifiedUpstreamLock,
    });
    assert.equal(backtestLedgerEntry.ok, true);

    strategyLedger.create({
      entry: backtestLedgerEntry.value,
      pinnedStrategyExportRecordId: pinnedExport.intakeRecordId,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });

    const payload: PersistedPrivatePaperRuntimeJobPayload = {
      candidatePlans: [
        {
          candidateId: 'market-002',
          completionEvents: [
            { legId: 'market-002:yes', occurredAt: '2026-07-01T00:00:02.600Z', stakeMinor: '100', type: 'reserve' },
            { legId: 'market-002:no', occurredAt: '2026-07-01T00:00:02.700Z', stakeMinor: '100', type: 'reserve' },
            { legId: 'market-002:yes', occurredAt: '2026-07-01T00:00:02.800Z', stakeMinor: '100', type: 'fill' },
            { legId: 'market-002:no', occurredAt: '2026-07-01T00:00:02.900Z', stakeMinor: '100', type: 'fill' },
          ],
          decisionTimestamp: '2026-07-01T00:00:02.500Z',
          manualKill: false,
          maxQuoteAgeMs: 2_000,
        },
      ],
      cycleId: 'cycle-510-001',
      maxCandidatesPerCycle: 1,
      pinnedStrategyExportRecordId: pinnedExport.intakeRecordId,
      runtimeId: 'runtime-510-001',
      schema: 'bws.private_paper_runtime_job.v1',
      source: {
        exportedAt: intake.value.bundle.exportedAt,
        kind: 'pinned_records',
        records: serializeRecords(intake.value.records),
        sourceBundleKind: 'resource_export',
        sourceManifestHash: intake.value.bundle.reference.manifestHash,
      },
      upstreamLockRecordId: lockRecord.lockRecordId,
    };

    jobs.create({
      availableAt: TEST_TIMESTAMP,
      jobId: 'private-paper-job-510-001',
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: payload as unknown as JsonValue,
      queueName: 'private-paper',
      retryDelaysMs: Object.freeze([]),
    });

    const workerResult = await runBoundedWorkerPass({
      handlers: Object.freeze({
        private_paper_runtime_cycle_v1: createPrivatePaperRuntimeJobHandler({
          strategyLedger,
          upstreamLocks,
        }),
      }),
      jobs,
      leaseDurationMs: 2_000,
      maxJobs: 1,
      now: createDeterministicClock('2026-07-15T12:00:20.000Z'),
      queueName: 'private-paper',
      workerId: 'worker-510-001',
    });
    assert.equal(workerResult.ok, true);
    assert.equal(workerResult.value.completedCount, 1);

    const service = createBwsReadOnlyQueryService({
      importRuns,
      pinnedStrategyExports: pinnedExports,
      strategyLedger,
      upstreamLocks,
    } satisfies BwsReadOnlyQueryDependencies, {
      generatedAt: () => TEST_TIMESTAMP,
      maxPageSize: 25,
    });
    assert.equal(service.ok, true);

    const apiPort = await reserveLoopbackPort();
    const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
    const runtimeConfig = resolveBwsServiceRuntimeConfig(
      createRuntimeEnvironment(database.databaseConfig, apiPort),
      REPO_ROOT,
    );
    assert.equal(runtimeConfig.upstream.lock.commitSha, verifiedUpstreamLock.commitSha);
    assert.equal(runtimeConfig.upstream.repoPath, verifiedUpstreamLock.repositoryPath);

    const cockpitConfig = resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: apiBaseUrl,
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
    });
    const operationalStatus = createBwsOperationalStatusSnapshot({
      cockpitProcessDefinition: describeBwsOperatorCockpitProcessDefinition(cockpitConfig),
      config: runtimeConfig,
      generatedAt: TEST_TIMESTAMP,
      queryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
      strategyEvidencePolicy: {
        liveState: 'not_claimed',
        privacy: 'private_only',
        profitabilityState: 'not_reported',
        publicDistributionState: 'withheld',
      },
      workerHandlerKinds: ['private_paper_runtime_cycle_v1'],
    });
    assert.equal(operationalStatus.ok, true);

    const server = createServer(createBwsReadOnlyQueryHttpHandler(service.value, {
      getOperationalStatusSnapshot: () => operationalStatus.value,
    }));
    server.listen(apiPort, '127.0.0.1');
    await once(server, 'listening');
    try {
      const healthResponse = await fetch(`${apiBaseUrl}/health`);
      assert.equal(healthResponse.status, 200);
      const healthBody = await healthResponse.json() as {
        readonly health: {
          readonly status: string;
        };
        readonly ok: boolean;
      };
      assert.equal(healthBody.ok, true);
      assert.equal(healthBody.health.status, 'healthy');

      const readinessResponse = await fetch(`${apiBaseUrl}/readiness`);
      assert.equal(readinessResponse.status, 200);
      const readinessBody = await readinessResponse.json() as {
        readonly observability: {
          readonly configuration: {
            readonly persistence: {
              readonly password?: string;
            };
          };
          readonly processDefinitions: readonly unknown[];
        };
        readonly readiness: {
          readonly status: string;
        };
      };
      assert.equal(readinessBody.readiness.status, 'ready');
      assert.equal(readinessBody.observability.configuration.persistence.password, '[redacted]');
      assert.equal(readinessBody.observability.processDefinitions.length, 3);

      const cockpitSnapshot = await loadBwsOperatorCockpitSnapshot(cockpitConfig, {
        evidenceScope: Object.freeze({
          providerId: PINNED_PROVIDER_ID,
        }),
        includePinnedStrategyExports: true,
      });
      assert.equal(cockpitSnapshot.acceptedBacktests.page.returnedCount, 1);
      assert.equal(cockpitSnapshot.acceptedPaperRuns.page.returnedCount, 1);
      assert.equal(cockpitSnapshot.blockedBacktests.page.returnedCount, 0);
      assert.equal(cockpitSnapshot.blockedPaperRuns.page.returnedCount, 0);
      assert.equal(cockpitSnapshot.pinnedStrategyExports?.page.returnedCount, 1);

      const overview = buildBwsOperatorCockpitPageModel('/', cockpitSnapshot);
      assert.equal(overview.cards[0]?.value, '1');
      assert.equal(overview.cards[2]?.value, '1');

      const evidence = buildBwsOperatorCockpitPageModel('/evidence', cockpitSnapshot);
      assert.equal(evidence.rows.length, 1);
      assert.equal(evidence.rows[0]?.values['providerId'], PINNED_PROVIDER_ID);

      const paperRuns = buildBwsOperatorCockpitPageModel('/paper-runs', cockpitSnapshot);
      assert.equal(paperRuns.rows.length, 1);
      assert.equal(paperRuns.rows[0]?.values['runKind'], 'private_paper_runtime_cycle');
    } finally {
      server.close();
      await once(server, 'close');
    }
  } finally {
    dropDisposableDatabase(database.adminConfig, database.databaseName);
  }
});

function sampleExecutionPlan(): StandardBinaryBacktestExecutionPlan {
  return Object.freeze({
    canonicalMarketId: 'market-002',
    completionEvents: Object.freeze([
      { legId: 'market-002:yes', occurredAt: '2026-07-01T00:00:02.600Z', stakeMinor: 100n, type: 'reserve' as const },
      { legId: 'market-002:no', occurredAt: '2026-07-01T00:00:02.700Z', stakeMinor: 100n, type: 'reserve' as const },
      { legId: 'market-002:yes', occurredAt: '2026-07-01T00:00:02.800Z', stakeMinor: 100n, type: 'fill' as const },
      { legId: 'market-002:no', occurredAt: '2026-07-01T00:00:02.900Z', stakeMinor: 100n, type: 'fill' as const },
    ]),
    decisionTimestamp: '2026-07-01T00:00:02.500Z',
    manualKill: false,
    maxQuoteAgeMs: 2_000,
  }) satisfies StandardBinaryBacktestExecutionPlan;
}

function serializeRecords(records: readonly BettingWinResourceRecord[]): readonly JsonValue[] {
  return Object.freeze(
    records.map((record) => {
      switch (record.recordType) {
        case 'identity':
          return Object.freeze({ ...record }) as JsonValue;
        case 'rules':
          return Object.freeze({ ...record }) as JsonValue;
        case 'quotes':
          return Object.freeze({
            availableSizeMinor: record.evidence.availableSizeMinor.toString(),
            canonicalMarketId: record.canonicalMarketId,
            costMinor: record.costMinor.toString(),
            currency: record.evidence.currency,
            evidenceId: record.evidence.evidenceId,
            feeMinor: record.feeMinor.toString(),
            minStakeMinor: record.minStakeMinor.toString(),
            observedAt: record.evidence.observedAt,
            outcome: record.outcome,
            priceMinor: record.evidence.priceMinor.toString(),
            quoteSourceManifestHash: record.quoteSourceManifestHash,
            recordType: 'quotes',
          }) as JsonValue;
        case 'settlement':
          return Object.freeze({ ...record }) as JsonValue;
      }
    }),
  );
}

function createDeterministicClock(start: string): () => string {
  const startedAt = Date.parse(start);
  let offset = 0;
  return () => {
    const next = new Date(startedAt + offset).toISOString();
    offset += 1;
    return next;
  };
}

async function reserveLoopbackPort(): Promise<number> {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  const port = (address as AddressInfo).port;
  server.close();
  await once(server, 'close');
  return port;
}

function createRuntimeEnvironment(
  databaseConfig: SurebetPersistenceConfig,
  apiPort: number,
) : BwsServiceRuntimeEnvironment {
  const bettingWinRepoPath = requireProcessEnvString('BETTING_WIN_REPO_PATH');
  const baseEnvironment = {
    BETTING_WIN_REPO_PATH: bettingWinRepoPath,
    BWS_API_PORT: String(apiPort),
    BWS_UPSTREAM_LOCK_PATH: UPSTREAM_LOCK_PATH,
    BWS_WORKER_ID: 'worker-510-acceptance',
    BWS_WORKER_LEASE_DURATION_MS: '2000',
    BWS_WORKER_QUEUE_NAME: 'private-paper',
    SUREBET_EXECUTION_ENABLED: 'false',
    SUREBET_PROVIDER_CONNECTIONS: 'disabled',
    SUREBET_RUNTIME_MODE: 'paper',
    SUREBET_PG_DATABASE: databaseConfig.database,
    ...(databaseConfig.password === undefined
      ? {}
      : { SUREBET_PG_PASSWORD: databaseConfig.password }),
    SUREBET_PG_PORT: String(databaseConfig.port),
    SUREBET_PG_USER: databaseConfig.user,
  } satisfies BwsServiceRuntimeEnvironment;

  if (databaseConfig.host !== undefined) {
    return Object.freeze({
      ...baseEnvironment,
      SUREBET_PG_HOST: databaseConfig.host,
    });
  }

  if (databaseConfig.socketDirectory === undefined) {
    throw new Error('Disposable database runtime environment requires a host or socketDirectory.');
  }

  return Object.freeze({
    ...baseEnvironment,
    SUREBET_PG_SOCKET_DIRECTORY: databaseConfig.socketDirectory,
  });
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
  const databaseName = `bws_510_${Date.now()}_${process.pid}`;
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

function withPassword(config: SurebetPersistenceConfig): NodeJS.ProcessEnv {
  const passwordEnvironmentKey = ['PG', 'PASSWORD'].join('');
  return config.password === undefined
    ? process.env
    : { ...process.env, [passwordEnvironmentKey]: config.password };
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

function requireProcessEnvString(name: string): string {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be set for loopback acceptance tests.`);
  }
  return value;
}
