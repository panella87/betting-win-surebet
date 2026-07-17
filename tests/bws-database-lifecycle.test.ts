import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createBwsDatabaseBackup,
  createBacktestStrategyLedgerEntry,
  getBwsDatabaseMigrationStatus,
  planBwsDatabaseRetention,
  applyBwsDatabaseRetention,
  runBwsDatabaseLifecycleCli,
  runDeterministicStandardBinaryBacktest,
  validatePinnedBettingWinBundleIntake,
  verifyBwsDatabaseRestore,
  type StandardBinaryBacktestExecutionPlan,
} from '../packages/bootstrap/src/index.js';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamApiConvergenceRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  type JsonValue,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';
import type { BettingWinResourceRecord } from '../packages/bootstrap/src/contracts/betting-win-resource-records.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-16T07:45:00.000Z';
const FIXTURE_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';

test('database lifecycle CLI prints help without side effects', async () => {
  const capture = createCaptureStream();
  const exitCode = await runBwsDatabaseLifecycleCli(['--help'], REPO_ROOT, capture.stream);
  assert.equal(exitCode, 0);
  assert.match(capture.read(), /migration-status\|backup\|restore-verify/);
  assert.match(capture.read(), /retention-plan/);
});

test('database backup rejects existing output paths unless overwrite is explicitly allowed', () => {
  const root = mkdtempSync(join(tmpdir(), 'bws-db-backup-existing-'));
  const outputPath = join(root, 'backup-dir');
  mkdirSync(outputPath, { recursive: true });
  try {
    assert.throws(
      () =>
        createBwsDatabaseBackup({
          outputPath,
          persistenceConfig: samplePersistenceConfig(),
          repositoryRoot: REPO_ROOT,
        }),
      /overwrite was not allowed/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('database restore verification rejects checksum mismatches before touching PostgreSQL utilities', async () => {
  const root = mkdtempSync(join(tmpdir(), 'bws-db-restore-checksum-'));
  const backupPath = join(root, 'backup');
  mkdirSync(backupPath, { recursive: true });
  writeFileSync(join(backupPath, 'surebet.dump'), 'dump-bytes\n', 'utf-8');
  writeFileSync(
    join(backupPath, 'manifest.json'),
    `${JSON.stringify(
      {
        backupDumpFile: 'surebet.dump',
        createdAt: TEST_TIMESTAMP,
        database: {
          connectionTarget: '127.0.0.1',
          currentDatabase: 'surebet_test',
          currentUser: 'surebet',
          requestedDatabase: 'surebet_test',
          requestedUser: 'surebet',
          serverVersion: '16.0',
          serverVersionNum: '160000',
        },
        migrationLedger: {
          applied: [],
          available: [],
          checksumMismatches: [],
          pending: [],
        },
        rowCounts: [],
        schema: 'bws.database_backup_manifest.v1',
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  writeFileSync(
    join(backupPath, 'SHA256SUMS'),
    `${'0'.repeat(64)}  surebet.dump\n${'1'.repeat(64)}  manifest.json\n`,
    'utf-8',
  );
  try {
    await assert.rejects(
      () =>
        verifyBwsDatabaseRestore({
          backupPath,
          persistenceConfig: samplePersistenceConfig(),
          repositoryRoot: REPO_ROOT,
        }),
      /Checksum mismatch for surebet\.dump/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test(
  'database lifecycle backup, restore verification, migration status, and retention apply pass on disposable PostgreSQL proof',
  { skip: !hasDisposableDatabaseTestConfig() || !hasPgUtilityCommands() },
  async () => {
    const database = createDisposableDatabaseContext();
    const backupRoot = mkdtempSync(join(tmpdir(), 'bws-db-backup-proof-'));
    try {
      applySurebetMigrations(database.databaseConfig);
      await seedDatabase(database.databaseConfig);

      const migrationStatus = getBwsDatabaseMigrationStatus({
        persistenceConfig: database.databaseConfig,
        repositoryRoot: REPO_ROOT,
      });
      assert.equal(migrationStatus.compatibility.status, 'compatible');
      assert.equal(migrationStatus.migrationLedger.pending.length, 0);
      assert.equal(migrationStatus.migrationLedger.checksumMismatches.length, 0);

      const backupPath = join(backupRoot, 'bws-proof-backup');
      const backup = createBwsDatabaseBackup({
        outputPath: backupPath,
        persistenceConfig: database.databaseConfig,
        repositoryRoot: REPO_ROOT,
      });
      assert.equal(readFileSync(backup.manifestFile, 'utf-8').includes('"schema": "bws.database_backup_manifest.v1"'), true);
      assert.equal(readFileSync(backup.sha256File, 'utf-8').includes('surebet.dump'), true);
      assert.equal(backup.manifest.rowCounts.some((row) => row.rowCount > 0), true);

      const restoreVerification = await verifyBwsDatabaseRestore({
        backupPath,
        persistenceConfig: database.databaseConfig,
        repositoryRoot: REPO_ROOT,
      });
      assert.equal(restoreVerification.serverRestartsVerified, true);
      assert.equal(
        restoreVerification.apiChecks.firstRun.map((entry) => entry.returnedCount).every((count) => count >= 1),
        true,
      );
      assert.deepEqual(
        restoreVerification.restoredRowCounts.map((row) => row.rowCount),
        backup.manifest.rowCounts.map((row) => row.rowCount),
      );

      const retentionPlan = planBwsDatabaseRetention({
        cutoff: '2100-01-01T00:00:00.000Z',
        maxRows: 5,
        persistenceConfig: database.databaseConfig,
        repositoryRoot: REPO_ROOT,
        scope: 'import_runs',
      });
      assert.equal(retentionPlan.plannedDeleteCount, 1);
      assert.equal(retentionPlan.totalEligibleRows, 1);
      assert.deepEqual(retentionPlan.candidates[0]?.primaryKey, { importRunId: 'import-585-prunable' });

      const retentionApply = applyBwsDatabaseRetention({
        cutoff: '2100-01-01T00:00:00.000Z',
        maxRows: 5,
        persistenceConfig: database.databaseConfig,
        planFingerprint: retentionPlan.planFingerprint,
        repositoryRoot: REPO_ROOT,
        scope: 'import_runs',
      });
      assert.equal(retentionApply.deletedCount, 1);

      const retainedImportRuns = new SurebetImportRunRepository(database.databaseConfig);
      assert.equal(retainedImportRuns.get('import-585-prunable'), undefined);
      assert.notEqual(retainedImportRuns.get('import-585-001'), undefined);
    } finally {
      rmSync(backupRoot, { force: true, recursive: true });
      dropDisposableDatabase(database.adminConfig, database.databaseName);
    }
  },
);

async function seedDatabase(config: SurebetPersistenceConfig): Promise<void> {
  const upstreamLocks = new SurebetUpstreamLockRepository(config);
  const importRuns = new SurebetImportRunRepository(config);
  const pinnedExports = new SurebetPinnedStrategyExportRepository(config);
  const schedulerCheckpoints = new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(config);
  const strategyLedger = new SurebetStrategyLedgerRepository(config);
  const upstreamApiCheckpoints = new SurebetUpstreamApiConvergenceRepository(config);
  const jobs = new SurebetWorkerJobRepository(config);

  const upstreamLock = sampleUpstreamLock();
  const lockRecord = upstreamLocks.put({
    lock: upstreamLock,
    lockRecordId: 'lock-585-001',
  });

  importRuns.create({
    importRunId: 'import-585-001',
    metadata: Object.freeze({
      contractSchema: upstreamLock.contractSchema,
      intakeMode: 'database_lifecycle_test',
    }),
    requestedAt: '2026-07-16T07:45:00.000Z',
    sourceKind: 'workspace_export_bundle',
    sourceLocator: '/tmp/bws-585/export.json',
    startedAt: '2026-07-16T07:45:01.000Z',
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  const intake = validatePinnedBettingWinBundleIntake(FIXTURE_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  importRuns.finalize({
    completedAt: '2026-07-16T07:45:02.000Z',
    importRunId: 'import-585-001',
    importedRecordCount: intake.value.records.length,
    outcome: 'succeeded',
  });

  const pinnedExport = pinnedExports.create({
    contractAlias: upstreamLock.contractAlias,
    contractSchema: upstreamLock.contractSchema,
    endpointId: 'endpoint-585-001',
    exportId: 'provider-history-export.fixture-585.20260716t074500000z.fixture',
    exportKind: 'pinned_provider_history_bundle',
    exportProfile: 'provider_history_fixture_bundle_v1',
    exportedAt: intake.value.bundle.exportedAt,
    importRunId: 'import-585-001',
    importedAt: '2026-07-16T07:45:03.000Z',
    intakeRecordId: 'intake-585-001',
    normalizedEvidenceIds: ['normalized-585-001'],
    payloadSha256: '5'.repeat(64),
    providerGenerationIds: ['generation-585-001'],
    providerId: 'restore-verification',
    sourceLineageRecordIds: ['lineage-585-001'],
    sourceLocator: '/tmp/bws-585/pinned-export.json',
    sourceSha256: '4'.repeat(64),
    surebetProfile: upstreamLock.surebetProfile,
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  const backtest = runDeterministicStandardBinaryBacktest({
    bundle: intake.value.bundle,
    executionPlans: [sampleExecutionPlan()],
    records: intake.value.records,
  });
  assert.equal(backtest.ok, true);
  const backtestEntry = createBacktestStrategyLedgerEntry({
    run: backtest.value,
    upstreamLock,
  });
  assert.equal(backtestEntry.ok, true);
  strategyLedger.create({
    entry: backtestEntry.value,
    pinnedStrategyExportRecordId: pinnedExport.intakeRecordId,
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  upstreamApiCheckpoints.create({
    apiBaseUrl: 'http://127.0.0.1:4585',
    checkpointId: 'checkpoint-api-585-001',
    completedCycleCount: 1,
    contractVersion: 'v1',
    currentCycleNumber: 2,
    currentResource: 'identity',
    currentResourcePageCount: 0,
    maxPagesPerResource: 4,
    mode: 'api',
    pageSize: 2,
    retryBackoffMs: 250,
    retryLimit: 0,
    timeoutMs: 1000,
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  schedulerCheckpoints.create({
    configSha256: 'a'.repeat(64),
    mode: 'api',
    queueName: 'private-paper',
    runtimeId: 'runtime-585-001',
    schedulerCheckpointId: 'scheduler-585-001',
    upstreamCheckpointId: 'checkpoint-api-585-001',
    upstreamLockRecordId: lockRecord.lockRecordId,
  });
  schedulerCheckpoints.advance({
    lastScheduledApiCycleNumber: 1,
    lastScheduledAt: '2026-07-16T07:45:04.000Z',
    lastScheduledJobId: 'private-paper:scheduler-585-001:cycle:1',
    lastScheduledSourceId: 'api-cycle:checkpoint-api-585-001:1',
    schedulerCheckpointId: 'scheduler-585-001',
  });

  jobs.create({
    availableAt: '2026-07-16T07:45:05.000Z',
    jobId: 'private-paper:scheduler-585-001:cycle:1',
    jobKind: 'private_paper_runtime_cycle_v1',
    payload: Object.freeze({
      cycleId: 'scheduler-585-001:cycle:1',
      maxCandidatesPerCycle: 1,
      runtimeId: 'runtime-585-001',
      schema: 'bws.private_paper_runtime_job.v1',
      source: Object.freeze({
        kind: 'pinned_records',
        sourceManifestHash: '6'.repeat(64),
      }),
      upstreamLockRecordId: lockRecord.lockRecordId,
    }) as unknown as JsonValue,
    queueName: 'private-paper',
    retryDelaysMs: Object.freeze([]),
  });
  const leased = jobs.claimNext({
    claimedAt: '2026-07-16T07:45:06.000Z',
    leaseDurationMs: 1_000,
    leaseToken: 'lease-585-001',
    queueName: 'private-paper',
    workerId: 'worker-585-001',
  });
  assert.notEqual(leased, undefined);
  jobs.recordCheckpoint({
    checkpoint: Object.freeze({ progress: 'first-pass' }) as unknown as JsonValue,
    checkpointId: 'checkpoint-585-001',
    jobId: leased!.jobId,
    leaseToken: 'lease-585-001',
    recordedAt: '2026-07-16T07:45:06.500Z',
    workerId: 'worker-585-001',
  });
  jobs.fail({
    errorCode: 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED',
    errorDetails: Object.freeze({ evidenceRequired: 'loopback proof' }) as unknown as JsonValue,
    failedAt: '2026-07-16T07:45:07.000Z',
    jobId: leased!.jobId,
    leaseToken: 'lease-585-001',
    workerId: 'worker-585-001',
  });

  importRuns.create({
    importRunId: 'import-585-prunable',
    metadata: Object.freeze({
      contractSchema: upstreamLock.contractSchema,
      intakeMode: 'retention_candidate',
    }),
    requestedAt: '2026-07-15T07:45:00.000Z',
    sourceKind: 'workspace_export_bundle',
    sourceLocator: '/tmp/bws-585/prunable-export.json',
    startedAt: '2026-07-15T07:45:01.000Z',
    upstreamLockRecordId: lockRecord.lockRecordId,
  });
  importRuns.finalize({
    completedAt: '2026-07-15T07:45:02.000Z',
    failureCode: 'BWS_IMPORT_FAILED',
    failureDetails: Object.freeze({ retained: false }) as unknown as JsonValue,
    importRunId: 'import-585-prunable',
    importedRecordCount: 0,
    outcome: 'failed',
  });
}

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

function samplePersistenceConfig(): SurebetPersistenceConfig {
  return Object.freeze({
    database: 'surebet_test',
    host: '127.0.0.1',
    port: 5432,
    user: 'surebet',
  });
}

function sampleUpstreamLock(): BettingWinUpstreamLock {
  return Object.freeze({
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
    commitSha: '1'.repeat(40),
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    gitTreeSha: '2'.repeat(40),
    packageVersion: '0.48.0',
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    repository: 'betting-win',
    repositoryPath: join(tmpdir(), 'betting-win-upstream-read-only'),
    schema: 'betting-win-surebet-upstream-lock-v1',
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    sourceView: 'committed_git_head',
    surebetProfile: 'surebet_standard_binary_v0',
    trackedTreeListingSha256: '3'.repeat(64),
    verifiedAt: TEST_TIMESTAMP,
  });
}

function createCaptureStream(): {
  readonly read: () => string;
  readonly stream: NodeJS.WriteStream;
} {
  let output = '';
  return Object.freeze({
    read: () => output,
    stream: {
      write(chunk: string | Uint8Array): boolean {
        output += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
        return true;
      },
    } as unknown as NodeJS.WriteStream,
  });
}

function hasDisposableDatabaseTestConfig(): boolean {
  return readDisposableDatabaseTestEnvironment() !== undefined;
}

function hasPgUtilityCommands(): boolean {
  return ['createdb', 'dropdb', 'pg_dump', 'pg_restore'].every((command) => commandExists(command));
}

function commandExists(command: string): boolean {
  try {
    execFileSync('bash', ['-lc', `command -v ${command}`], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function readDisposableDatabaseTestEnvironment():
  | {
      readonly adminConfig: SurebetPersistenceConfig;
      readonly connectionConfig: Omit<SurebetPersistenceConfig, 'database'>;
    }
  | undefined {
  const explicitTuple = readDisposableTupleFromValues(process.env);
  const fileValues = readRepoLocalEnvValues();
  const fileTuple = readDisposableTupleFromValues(Object.fromEntries(fileValues));
  const databaseUrl = process.env.DB_URL_TEST ?? fileValues.get('DB_URL_TEST');

  let adminConfig: SurebetPersistenceConfig | undefined;
  if (explicitTuple !== undefined) {
    adminConfig = resolveSurebetPersistenceConfig(explicitTuple);
  } else if (fileTuple !== undefined) {
    adminConfig = resolveSurebetPersistenceConfig(fileTuple);
  } else if (typeof databaseUrl === 'string' && databaseUrl.trim().length > 0) {
    adminConfig = resolveSurebetPersistenceConfig(parseDatabaseUrl(databaseUrl));
  } else {
    return undefined;
  }

  const { database: _database, ...connectionConfig } = adminConfig;
  return Object.freeze({
    adminConfig,
    connectionConfig: Object.freeze(connectionConfig),
  });
}

function readDisposableTupleFromValues(
  values: Partial<Record<string, string | undefined>>,
):
  | {
      SUREBET_PG_DATABASE: string;
      SUREBET_PG_USER: string;
      SUREBET_PG_PORT: string;
      SUREBET_PG_HOST?: string;
      SUREBET_PG_PASSWORD?: string;
      SUREBET_PG_SOCKET_DIRECTORY?: string;
    }
  | undefined {
  const adminDatabase = values['SUREBET_TEST_ADMIN_DATABASE'];
  const user = values['SUREBET_TEST_USER'];
  const port = values['SUREBET_TEST_PORT'];
  const host = values['SUREBET_TEST_HOST'];
  const socketDirectory = values['SUREBET_TEST_SOCKET_DIRECTORY'];
  const password = values['SUREBET_TEST_PASSWORD'];
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
    SUREBET_PG_PASSWORD?: string;
    SUREBET_PG_SOCKET_DIRECTORY?: string;
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
  return environment;
}

function readRepoLocalEnvValues(): Map<string, string> {
  const envPath = join(REPO_ROOT, '.env');
  if (!existsSync(envPath)) {
    return new Map();
  }
  const values = new Map<string, string>();
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values.set(key, stripOptionalQuotes(value));
  }
  return values;
}

function stripOptionalQuotes(value: string): string {
  if (
    value.length >= 2
    && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseDatabaseUrl(
  rawValue: string,
): {
  SUREBET_PG_DATABASE: string;
  SUREBET_PG_USER: string;
  SUREBET_PG_PORT: string;
  SUREBET_PG_HOST?: string;
  SUREBET_PG_PASSWORD?: string;
} {
  const parsed = new URL(rawValue);
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DB_URL_TEST must use the postgresql: or postgres: protocol.');
  }
  const database = parsed.pathname.replace(/^\//, '');
  if (database.length === 0) {
    throw new Error('DB_URL_TEST must include a maintenance database.');
  }
  if (parsed.username.length === 0 || parsed.hostname.length === 0 || parsed.port.length === 0) {
    throw new Error('DB_URL_TEST must include explicit user, host, and port components.');
  }
  const environment = {
    SUREBET_PG_DATABASE: database,
    SUREBET_PG_HOST: parsed.hostname,
    SUREBET_PG_PORT: parsed.port,
    SUREBET_PG_USER: decodeURIComponent(parsed.username),
  } as {
    SUREBET_PG_DATABASE: string;
    SUREBET_PG_HOST: string;
    SUREBET_PG_PASSWORD?: string;
    SUREBET_PG_PORT: string;
    SUREBET_PG_USER: string;
  };
  if (parsed.password.length > 0) {
    environment.SUREBET_PG_PASSWORD = decodeURIComponent(parsed.password);
  }
  return environment;
}

function createDisposableDatabaseContext(): {
  readonly adminConfig: SurebetPersistenceConfig;
  readonly databaseConfig: SurebetPersistenceConfig;
  readonly databaseName: string;
} {
  const environment = readDisposableDatabaseTestEnvironment();
  assert.ok(environment !== undefined);
  const databaseName = `bws_585_${Date.now()}_${process.pid}`;
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
