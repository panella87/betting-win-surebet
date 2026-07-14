import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SurebetImportRunRepository,
  SurebetPersistenceError,
  SurebetUpstreamLockRepository,
  applySurebetMigrations,
  loadSurebetMigrationFiles,
  listAppliedSurebetMigrations,
  resolveSurebetPersistenceConfig,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';

const TEST_TIMESTAMP = '2026-07-14T10:00:00.000Z';

test('surebet persistence config fails closed on missing or ambiguous required settings', () => {
  assert.throws(
    () => resolveSurebetPersistenceConfig({}),
    (error: unknown) => error instanceof SurebetPersistenceError && error.code === 'SUREBET_PERSISTENCE_CONFIG_MISSING',
  );

  assert.throws(
    () =>
      resolveSurebetPersistenceConfig({
        SUREBET_PG_DATABASE: 'surebet',
        SUREBET_PG_USER: 'surebet',
        SUREBET_PG_PORT: '5432',
      }),
    (error: unknown) => error instanceof SurebetPersistenceError && error.code === 'SUREBET_PERSISTENCE_TARGET_INVALID',
  );

  assert.throws(
    () =>
      resolveSurebetPersistenceConfig({
        SUREBET_PG_DATABASE: 'surebet',
        SUREBET_PG_USER: 'surebet',
        SUREBET_PG_PORT: 'invalid',
        SUREBET_PG_HOST: '127.0.0.1',
      }),
    (error: unknown) => error instanceof SurebetPersistenceError && error.code === 'SUREBET_PERSISTENCE_CONFIG_INVALID',
  );

  const resolved = resolveSurebetPersistenceConfig({
    SUREBET_PG_DATABASE: 'surebet',
    SUREBET_PG_USER: 'surebet',
    SUREBET_PG_PORT: '5432',
    SUREBET_PG_SOCKET_DIRECTORY: '/var/run/postgresql',
  });
  assert.deepEqual(resolved, {
    database: 'surebet',
    user: 'surebet',
    port: 5432,
    socketDirectory: '/var/run/postgresql',
  });
});

test('surebet migration loader rejects empty or transaction-managed migration files', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bws-migrations-'));
  try {
    const emptyRoot = join(tempRoot, 'empty');
    mkdirSync(emptyRoot, { recursive: true });
    assert.throws(
      () => loadSurebetMigrationFiles(emptyRoot, '.'),
      (error: unknown) => error instanceof SurebetPersistenceError && error.code === 'SUREBET_MIGRATIONS_DIRECTORY_EMPTY',
    );

    const invalidRoot = join(tempRoot, 'invalid');
    mkdirSync(invalidRoot, { recursive: true });
    writeFileSync(join(invalidRoot, '001_bad.sql'), 'BEGIN;\nSELECT 1;\nCOMMIT;\n', 'utf-8');
    assert.throws(
      () => loadSurebetMigrationFiles(invalidRoot, '.'),
      (error: unknown) => error instanceof SurebetPersistenceError && error.code === 'SUREBET_MIGRATION_TRANSACTION_CONTROL_FORBIDDEN',
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('surebet migrations and repositories pass disposable PostgreSQL idempotency and restart proof when explicit test config is provided', { skip: !hasDisposableDatabaseTestConfig() }, () => {
  const testEnvironment = readDisposableDatabaseTestEnvironment();
  assert.ok(testEnvironment !== undefined);
  const databaseName = `bws_120_${Date.now()}_${process.pid}`;
  const adminConfig = testEnvironment.adminConfig;
  const databaseConfig: SurebetPersistenceConfig = Object.freeze({
    ...testEnvironment.connectionConfig,
    database: databaseName,
  });

  createDisposableDatabase(adminConfig, databaseName);
  try {
    const firstApply = applySurebetMigrations(databaseConfig);
    assert.equal(firstApply.applied.length, 1);
    assert.equal(firstApply.skipped.length, 0);

    const secondApply = applySurebetMigrations(databaseConfig);
    assert.equal(secondApply.applied.length, 0);
    assert.equal(secondApply.skipped.length, 1);

    const migratedTables = listUserTables(databaseConfig);
    assert.deepEqual(migratedTables, [
      'surebet.import_runs',
      'surebet.schema_migrations',
      'surebet.upstream_locks',
    ]);

    const lockRepository = new SurebetUpstreamLockRepository(databaseConfig);
    const persistedLock = lockRepository.put({
      lockRecordId: 'lock-001',
      lock: sampleUpstreamLock(),
    });
    assert.equal(persistedLock.lockRecordId, 'lock-001');
    assert.equal(lockRepository.put({ lockRecordId: 'lock-001', lock: sampleUpstreamLock() }).lockRecordId, 'lock-001');

    const importRuns = new SurebetImportRunRepository(databaseConfig);
    const createdRun = importRuns.create({
      importRunId: 'import-001',
      upstreamLockRecordId: persistedLock.lockRecordId,
      sourceKind: 'workspace_export_bundle',
      sourceLocator: '/tmp/export.json',
      requestedAt: TEST_TIMESTAMP,
      startedAt: TEST_TIMESTAMP,
      metadata: { expectedSchema: 'betting-win.strategy-export.v1' },
    });
    assert.equal(createdRun.outcome, 'running');

    const restartedImportRuns = new SurebetImportRunRepository(databaseConfig);
    const finalizedRun = restartedImportRuns.finalize({
      importRunId: 'import-001',
      outcome: 'succeeded',
      completedAt: '2026-07-14T10:05:00.000Z',
      importedRecordCount: 42,
    });
    assert.equal(finalizedRun.outcome, 'succeeded');
    assert.equal(finalizedRun.importedRecordCount, 42);
    assert.equal(
      restartedImportRuns.finalize({
        importRunId: 'import-001',
        outcome: 'succeeded',
        completedAt: '2026-07-14T10:05:00.000Z',
        importedRecordCount: 42,
      }).outcome,
      'succeeded',
    );

    assert.deepEqual(
      listAppliedSurebetMigrations(databaseConfig).map((migration) => migration.migrationName),
      ['001_create_upstream_locks_and_import_runs.sql'],
    );
  } finally {
    dropDisposableDatabase(adminConfig, databaseName);
  }
});

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

function listUserTables(config: SurebetPersistenceConfig): readonly string[] {
  const output = execFileSync(
    'psql',
    [
      '-X',
      '--set=ON_ERROR_STOP=1',
      '--no-psqlrc',
      '-A',
      '-t',
      '-d',
      config.database,
      '-U',
      config.user,
      '-p',
      String(config.port),
      '-h',
      config.host ?? config.socketDirectory!,
      '--command',
      `
SELECT schemaname || '.' || tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'public')
ORDER BY schemaname, tablename;
`,
    ],
    {
      encoding: 'utf-8',
      env: withPassword(config),
      stdio: 'pipe',
    },
  );
  return Object.freeze(output.trim().split('\n').filter((line) => line.length > 0));
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
