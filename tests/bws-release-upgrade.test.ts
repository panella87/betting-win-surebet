import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import {
  createBwsDatabaseBackup,
  createBwsReleasePackage,
  createBwsReleaseUpgradePlan,
  type BwsMigrationStatusResult,
  getBwsDatabaseMigrationStatus,
  type BwsReleaseManifest,
  recoverBwsReleaseUpgrade,
  runBwsReleaseUpgradeCli,
  verifyBwsDatabaseRestore,
  verifyBwsReleaseInstallation,
} from '../packages/bootstrap/src/index.js';
import {
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  type SurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';

const REPO_ROOT = process.cwd();
const COCKPIT_METADATA_FILE = join(REPO_ROOT, 'dist', 'apps', 'web', 'bws-cockpit-build.json');
const TEST_TEMP_ROOT = join(REPO_ROOT, '..', '.bws-release-upgrade-tests');
const TEST_TIMESTAMP = '2026-07-16T14:15:00.000Z';
const RELEASE_TEST_TIMESTAMP = '2026-07-16T14:15:00Z';

let cachedReleaseFixture: Promise<ReleaseFixture> | undefined;

interface ReleaseFixture {
  readonly outputDirectory: string;
  readonly result: Awaited<ReturnType<typeof createBwsReleasePackage>>;
}

test('release upgrade CLI prints help without side effects', async () => {
  const capture = createCaptureStream();
  const exitCode = await runBwsReleaseUpgradeCli(['--help'], REPO_ROOT, capture.stream);
  assert.equal(exitCode, 0);
  assert.match(capture.read(), /<plan\|apply\|rollback-decision\|recover>/);
  assert.match(capture.read(), /BWS-591/);
});

test('release upgrade plan is deterministic and fails closed when restore evidence is missing', async () => {
  const fixture = await createUpgradeFixture({ targetKind: 'version-only' });
  try {
    const migrationStatus = createCompatibleMigrationStatus(fixture.currentRelease.result.releaseDirectory);
    const planOne = await createBwsReleaseUpgradePlan({
      backupPath: fixture.backupDirectory,
      currentReleaseDirectory: fixture.currentRelease.result.releaseDirectory,
      envFile: fixture.currentEnvFile,
      evidenceDirectory: fixture.evidenceDirectory,
      now: () => TEST_TIMESTAMP,
      outputFile: join(fixture.evidenceDirectory, 'plan-one.json'),
      repositoryRoot: fixture.currentRelease.result.releaseDirectory,
      restoreVerificationFile: fixture.restoreVerificationFile,
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      targetInstallVerificationFile: fixture.targetInstallVerificationFile,
      targetReleaseDirectory: fixture.targetRelease.result.releaseDirectory,
      upgradeDependencies: {
        async getLifecycleStatus() {
          return sampleLifecycleSnapshot('not_running');
        },
        getMigrationStatus() {
          return migrationStatus;
        },
      },
    });
    const planTwo = await createBwsReleaseUpgradePlan({
      backupPath: fixture.backupDirectory,
      currentReleaseDirectory: fixture.currentRelease.result.releaseDirectory,
      envFile: fixture.currentEnvFile,
      evidenceDirectory: fixture.evidenceDirectory,
      now: () => TEST_TIMESTAMP,
      outputFile: join(fixture.evidenceDirectory, 'plan-two.json'),
      repositoryRoot: fixture.currentRelease.result.releaseDirectory,
      restoreVerificationFile: fixture.restoreVerificationFile,
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      targetInstallVerificationFile: fixture.targetInstallVerificationFile,
      targetReleaseDirectory: fixture.targetRelease.result.releaseDirectory,
      upgradeDependencies: {
        async getLifecycleStatus() {
          return sampleLifecycleSnapshot('not_running');
        },
        getMigrationStatus() {
          return migrationStatus;
        },
      },
    });

    assert.equal(planOne.status, 'ready');
    assert.equal(planOne.planFingerprint, planTwo.planFingerprint);
    assert.notEqual(planOne.currentRelease.semanticFingerprint, planOne.targetRelease.semanticFingerprint);

    await assert.rejects(
      () =>
        createBwsReleaseUpgradePlan({
          backupPath: fixture.backupDirectory,
          currentReleaseDirectory: fixture.currentRelease.result.releaseDirectory,
          envFile: fixture.currentEnvFile,
          evidenceDirectory: fixture.evidenceDirectory,
          now: () => TEST_TIMESTAMP,
          outputFile: join(fixture.evidenceDirectory, 'plan-missing-restore.json'),
          repositoryRoot: fixture.currentRelease.result.releaseDirectory,
          restoreVerificationFile: join(fixture.evidenceDirectory, 'missing-restore.json'),
          runtimeStateDirectory: fixture.runtimeStateDirectory,
          targetInstallVerificationFile: fixture.targetInstallVerificationFile,
          targetReleaseDirectory: fixture.targetRelease.result.releaseDirectory,
          upgradeDependencies: {
            async getLifecycleStatus() {
              return sampleLifecycleSnapshot('not_running');
            },
            getMigrationStatus() {
              return migrationStatus;
            },
          },
        }),
      /does not exist|ENOENT|restore verification/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('release upgrade apply resumes from checkpoints and performs explicit rollback after readiness failure', async () => {
  const fixture = await createUpgradeFixture({ targetKind: 'version-only' });
  try {
    const migrationStatus = createCompatibleMigrationStatus(fixture.currentRelease.result.releaseDirectory);
    const plan = await createBwsReleaseUpgradePlan({
      backupPath: fixture.backupDirectory,
      currentReleaseDirectory: fixture.currentRelease.result.releaseDirectory,
      envFile: fixture.currentEnvFile,
      evidenceDirectory: fixture.evidenceDirectory,
      now: () => TEST_TIMESTAMP,
      outputFile: join(fixture.evidenceDirectory, 'resume-plan.json'),
      repositoryRoot: fixture.currentRelease.result.releaseDirectory,
      restoreVerificationFile: fixture.restoreVerificationFile,
      runtimeStateDirectory: fixture.runtimeStateDirectory,
      targetInstallVerificationFile: fixture.targetInstallVerificationFile,
      targetReleaseDirectory: fixture.targetRelease.result.releaseDirectory,
      upgradeDependencies: {
        async getLifecycleStatus() {
          return sampleLifecycleSnapshot('not_running');
        },
        getMigrationStatus() {
          return migrationStatus;
        },
      },
    });

    await assert.rejects(
      () =>
        recoverBwsReleaseUpgrade({
          explicitIntent: 'recover',
          now: () => TEST_TIMESTAMP,
          planFile: join(fixture.evidenceDirectory, 'resume-plan.json'),
          planFingerprint: plan.planFingerprint,
          rollbackOnFailure: true,
          upgradeDependencies: {
            applyMigrations() {
              return Object.freeze({ appliedCount: 0, skippedCount: migrationStatus.migrationLedger.applied.length });
            },
            async getLifecycleStatus() {
              return sampleLifecycleSnapshot('not_running');
            },
            getMigrationStatus() {
              return migrationStatus;
            },
            async startLifecycle(request) {
              if (request.repositoryRoot === fixture.targetRelease.result.releaseDirectory) {
                throw new Error('target readiness failed');
              }
              return sampleLifecycleSnapshot('started');
            },
            async stopLifecycle() {
              return sampleLifecycleSnapshot('stopped');
            },
            testHooks: Object.freeze({
              failAfterCheckpoint: 'migrations_completed',
            }),
          },
        }),
      /Injected failure after checkpoint migrations_completed/,
    );

    const result = await recoverBwsReleaseUpgrade({
      explicitIntent: 'recover',
      now: () => TEST_TIMESTAMP,
      planFile: join(fixture.evidenceDirectory, 'resume-plan.json'),
      planFingerprint: plan.planFingerprint,
      rollbackOnFailure: true,
      upgradeDependencies: {
        applyMigrations() {
          return Object.freeze({ appliedCount: 0, skippedCount: migrationStatus.migrationLedger.applied.length });
        },
        async getLifecycleStatus() {
          return sampleLifecycleSnapshot('not_running');
        },
        getMigrationStatus() {
          return migrationStatus;
        },
        async startLifecycle(request) {
          if (request.repositoryRoot === fixture.targetRelease.result.releaseDirectory) {
            throw new Error('target readiness failed');
          }
          return sampleLifecycleSnapshot('started');
        },
        async stopLifecycle() {
          return sampleLifecycleSnapshot('stopped');
        },
      },
    });

    assert.equal(result.outcome, 'recovery_complete');
    const checkpointDirectory = join(fixture.evidenceDirectory, 'checkpoints');
    const classifications = listCheckpointClassifications(checkpointDirectory);
    assert.deepEqual(
      classifications,
      [
        'planned_not_started',
        'drained_before_backup',
        'backup_verified',
        'target_staged',
        'migrations_started',
        'migrations_completed',
        'readiness_failed',
        'rollback_allowed',
        'recovery_complete',
      ],
    );
  } finally {
    fixture.dispose();
  }
});

test(
  'schema-changing target upgrade blocks rollback after real disposable PostgreSQL migration apply',
  { skip: !hasDisposableDatabaseTestConfig() || !hasPgUtilityCommands() },
  async () => {
    const fixture = await createUpgradeFixture({ targetKind: 'schema-change' });
    const database = createDisposableDatabaseContext();
    try {
      applySurebetMigrations(database.databaseConfig);

      const backup = createBwsDatabaseBackup({
        outputPath: fixture.backupDirectory,
        persistenceConfig: database.databaseConfig,
        repositoryRoot: REPO_ROOT,
      });
      const restoreVerification = await verifyBwsDatabaseRestore({
        backupPath: backup.backupDirectory,
        persistenceConfig: database.databaseConfig,
        repositoryRoot: REPO_ROOT,
      });
      writeFileSync(
        fixture.restoreVerificationFile,
        `${JSON.stringify(restoreVerification, null, 2)}\n`,
        'utf-8',
      );
      writeEnvironmentFile(fixture.currentEnvFile, fixture.currentRelease.result.releaseDirectory, database.databaseConfig);

      const plan = await createBwsReleaseUpgradePlan({
        backupPath: fixture.backupDirectory,
        currentReleaseDirectory: fixture.currentRelease.result.releaseDirectory,
        envFile: fixture.currentEnvFile,
        evidenceDirectory: fixture.evidenceDirectory,
        now: () => TEST_TIMESTAMP,
        outputFile: join(fixture.evidenceDirectory, 'pg-plan.json'),
        repositoryRoot: fixture.currentRelease.result.releaseDirectory,
        restoreVerificationFile: fixture.restoreVerificationFile,
        runtimeStateDirectory: fixture.runtimeStateDirectory,
        targetInstallVerificationFile: fixture.targetInstallVerificationFile,
        targetReleaseDirectory: fixture.targetRelease.result.releaseDirectory,
        upgradeDependencies: {
          async getLifecycleStatus() {
            return sampleLifecycleSnapshot('not_running');
          },
          async startLifecycle() {
            throw new Error('target readiness failed');
          },
          async stopLifecycle() {
            return sampleLifecycleSnapshot('stopped');
          },
        },
      });

      const result = await recoverBwsReleaseUpgrade({
        explicitIntent: 'recover',
        now: () => TEST_TIMESTAMP,
        planFile: join(fixture.evidenceDirectory, 'pg-plan.json'),
        planFingerprint: plan.planFingerprint,
        rollbackOnFailure: true,
        upgradeDependencies: {
          async getLifecycleStatus() {
            return sampleLifecycleSnapshot('not_running');
          },
          async startLifecycle() {
            throw new Error('target readiness failed');
          },
          async stopLifecycle() {
            return sampleLifecycleSnapshot('stopped');
          },
        },
      });

      assert.equal(result.outcome, 'rollback_blocked');
      const targetStatus = getBwsDatabaseMigrationStatus({
        persistenceConfig: database.databaseConfig,
        repositoryRoot: fixture.targetRelease.result.releaseDirectory,
      });
      assert.equal(targetStatus.migrationLedger.pending.length, 0);
      assert.equal(
        targetStatus.migrationLedger.applied.length
          > getBwsDatabaseMigrationStatus({
            persistenceConfig: database.databaseConfig,
            repositoryRoot: fixture.currentRelease.result.releaseDirectory,
          }).migrationLedger.available.length,
        true,
      );
    } finally {
      dropDisposableDatabase(database.adminConfig, database.databaseName);
      fixture.dispose();
    }
  },
);

async function createUpgradeFixture(
  options: Readonly<{
    readonly targetKind: 'schema-change' | 'version-only';
  }>,
): Promise<{
  readonly backupDirectory: string;
  readonly currentEnvFile: string;
  readonly currentRelease: ReleaseFixture;
  readonly dispose: () => void;
  readonly evidenceDirectory: string;
  readonly restoreVerificationFile: string;
  readonly runtimeStateDirectory: string;
  readonly targetInstallVerificationFile: string;
  readonly targetRelease: ReleaseFixture;
}> {
  await ensureRuntimeCockpitBuild();
  const currentRelease = await getReleaseFixture();
  const tempRoot = createRepoTempDirectory('fixture-');
  const evidenceDirectory = join(currentRelease.result.releaseDirectory, 'runtime', `bws-release-upgrade-${Date.now()}`);
  const runtimeStateDirectory = join(currentRelease.result.releaseDirectory, 'runtime', `bws-lifecycle-${Date.now()}`);
  const backupDirectory = join(evidenceDirectory, 'backup');
  const restoreVerificationFile = join(evidenceDirectory, 'restore-verification.json');
  const currentEnvFile = join(evidenceDirectory, 'private.env');
  mkdirSync(evidenceDirectory, { recursive: true });
  mkdirSync(runtimeStateDirectory, { recursive: true });
  writeEnvironmentFile(currentEnvFile, currentRelease.result.releaseDirectory, samplePersistenceConfig());

  const targetRepositoryRoot = join(tempRoot, 'target-repo');
  copyRepositoryForRelease(targetRepositoryRoot);
  mutateTargetRepository(targetRepositoryRoot, options.targetKind);
  execFileSync(
    'python3',
    ['scripts/regenerate_source_manifest.py'],
    {
      cwd: targetRepositoryRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    },
  );
  const targetReleaseOutput = join(tempRoot, 'target-release-output');
  const targetResult = await createBwsReleasePackage({
    outputDirectory: targetReleaseOutput,
    repositoryRoot: targetRepositoryRoot,
  });
  const targetRelease = Object.freeze({
    outputDirectory: targetReleaseOutput,
    result: targetResult,
  });
  const targetInstallVerificationFile = join(tempRoot, 'target-install-verification.json');
  const targetEnvFile = join(tempRoot, 'target.private.env');
  writeEnvironmentFile(targetEnvFile, targetRelease.result.releaseDirectory, samplePersistenceConfig());
  const targetInstallVerification = await verifyBwsReleaseInstallation({
    envFile: targetEnvFile,
    now: () => RELEASE_TEST_TIMESTAMP,
    releaseDirectory: targetRelease.result.releaseDirectory,
    runCommand: samplePreflightCommandRunner,
    scratchDirectory: join(tempRoot, 'scratch'),
  });
  writeFileSync(
    targetInstallVerificationFile,
    `${JSON.stringify(targetInstallVerification, null, 2)}\n`,
    'utf-8',
  );
  createSyntheticBackupEvidence(
    currentRelease.result.releaseDirectory,
    backupDirectory,
    restoreVerificationFile,
  );

  return Object.freeze({
    backupDirectory,
    currentEnvFile,
    currentRelease,
    dispose() {
      rmSync(tempRoot, { force: true, recursive: true });
      rmSync(evidenceDirectory, { force: true, recursive: true });
    },
    evidenceDirectory,
    restoreVerificationFile,
    runtimeStateDirectory,
    targetInstallVerificationFile,
    targetRelease,
  });
}

async function getReleaseFixture(): Promise<ReleaseFixture> {
  if (cachedReleaseFixture !== undefined) {
    return cachedReleaseFixture;
  }
  cachedReleaseFixture = (async () => {
    await ensureRuntimeCockpitBuild();
    const outputDirectory = createRepoTempDirectory('current-');
    const result = await createBwsReleasePackage({
      outputDirectory,
      repositoryRoot: REPO_ROOT,
    });
    return Object.freeze({
      outputDirectory,
      result,
    });
  })();
  return cachedReleaseFixture;
}

function createRepoTempDirectory(prefix: string): string {
  mkdirSync(TEST_TEMP_ROOT, { recursive: true });
  return mkdtempSync(join(TEST_TEMP_ROOT, prefix));
}

async function ensureRuntimeCockpitBuild(): Promise<void> {
  if (existsSync(COCKPIT_METADATA_FILE)) {
    return;
  }
  execFileSync(
    'npm',
    ['run', 'build:runtime-cockpit'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env: {
        ...process.env,
        BWS_API_PORT: '4312',
      },
      stdio: 'pipe',
    },
  );
}

function createCompatibleMigrationStatus(repositoryRoot: string): BwsMigrationStatusResult {
  const manifest = readReleaseManifest(repositoryRoot);
  const applied = manifest.migrationInventory.map((entry) => Object.freeze({
    appliedAt: TEST_TIMESTAMP,
    migrationName: entry.migrationName,
    sha256: entry.sha256,
  }));
  return Object.freeze({
    compatibility: Object.freeze({
      reasons: Object.freeze([]),
      status: 'compatible',
    }),
    database: Object.freeze({
      connectionTarget: '127.0.0.1',
      currentDatabase: 'surebet_test',
      currentUser: 'surebet',
      requestedDatabase: 'surebet_test',
      requestedUser: 'surebet',
      serverVersion: '16.3',
      serverVersionNum: '160003',
    }),
    drain: Object.freeze({
      activeLifecycleDetected: false,
      reasons: Object.freeze([]),
      requiredForMigrationApply: false,
      stateFilePath: join(repositoryRoot, 'runtime', 'bws-operator-lifecycle', 'state.json'),
    }),
    generatedAt: TEST_TIMESTAMP,
    migrationLedger: Object.freeze({
      applied: Object.freeze(applied),
      available: Object.freeze(manifest.migrationInventory.map((entry) => Object.freeze({
        migrationName: entry.migrationName,
        path: entry.path,
        sha256: entry.sha256,
      }))),
      checksumMismatches: Object.freeze([]),
      pending: Object.freeze([]),
    }),
    ownership: Object.freeze({
      migrationScope: 'surebet_only_verified',
      schema: 'surebet',
      schemaExists: true,
      schemaOwnedObjectCount: 1,
    }),
    schema: 'bws.database_migration_status.v1',
  });
}

function createSyntheticBackupEvidence(
  repositoryRoot: string,
  backupDirectory: string,
  restoreVerificationFile: string,
): void {
  const migrationStatus = createCompatibleMigrationStatus(repositoryRoot);
  const backupManifest = Object.freeze({
    backupDumpFile: 'surebet.dump',
    createdAt: TEST_TIMESTAMP,
    database: migrationStatus.database,
    migrationLedger: migrationStatus.migrationLedger,
    rowCounts: Object.freeze([]),
    schema: 'bws.database_backup_manifest.v1',
  });
  const dumpContents = 'synthetic surebet backup\n';
  mkdirSync(backupDirectory, { recursive: true });
  writeFileSync(join(backupDirectory, 'surebet.dump'), dumpContents, 'utf-8');
  writeFileSync(join(backupDirectory, 'manifest.json'), `${JSON.stringify(backupManifest, null, 2)}\n`, 'utf-8');
  const dumpSha = sha256Text(dumpContents);
  const manifestSha = sha256Text(`${JSON.stringify(backupManifest, null, 2)}\n`);
  writeFileSync(
    join(backupDirectory, 'SHA256SUMS'),
    `${dumpSha}  surebet.dump\n${manifestSha}  manifest.json\n`,
    'utf-8',
  );
  const restoreVerification = Object.freeze({
    apiChecks: Object.freeze({
      firstRun: Object.freeze([]),
      secondRun: Object.freeze([]),
    }),
    backupManifest,
    createdAt: TEST_TIMESTAMP,
    disposableDatabase: 'surebet_restore_verify',
    migrationStatus,
    restoredRowCounts: Object.freeze([]),
    schema: 'bws.database_restore_verification.v1',
    serverRestartsVerified: true,
  });
  writeFileSync(
    restoreVerificationFile,
    `${JSON.stringify(restoreVerification, null, 2)}\n`,
    'utf-8',
  );
}

function copyRepositoryForRelease(targetRoot: string): void {
  cpSync(REPO_ROOT, targetRoot, {
    dereference: false,
    filter(sourcePath) {
      const relativePath = sourcePath.startsWith(REPO_ROOT)
        ? sourcePath.slice(REPO_ROOT.length).replace(/^\/+/, '')
        : sourcePath;
      if (relativePath.length === 0) {
        return true;
      }
      if (
        relativePath === '.env'
        || relativePath.startsWith('.git/')
        || relativePath === '.git'
        || relativePath.startsWith('artifacts/')
        || relativePath === 'artifacts'
        || relativePath.startsWith('runtime/')
        || relativePath === 'runtime'
        || relativePath.startsWith('logs/')
        || relativePath === 'logs'
        || relativePath.startsWith('backups/')
        || relativePath === 'backups'
        || relativePath.startsWith('output/')
        || relativePath === 'output'
        || relativePath.startsWith('node_modules/')
        || relativePath === 'node_modules'
      ) {
        return false;
      }
      return true;
    },
    recursive: true,
  });
}

function mutateTargetRepository(
  repositoryRoot: string,
  targetKind: 'schema-change' | 'version-only',
): void {
  const packageJsonPath = join(repositoryRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string };
  packageJson.version = targetKind === 'version-only'
    ? '0.1.0-bws-full-platform-upgrade-target'
    : '0.1.0-bws-full-platform-schema-target';
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8');
  if (targetKind === 'schema-change') {
    const migrationPath = join(
      repositoryRoot,
      'packages',
      'persistence',
      'src',
      'migrations',
      '20260716T150000Z_bws_591_upgrade_marker.sql',
    );
    writeFileSync(
      migrationPath,
      [
        'CREATE TABLE IF NOT EXISTS surebet.bws_591_upgrade_marker (',
        '  marker text PRIMARY KEY',
        ');',
      ].join('\n') + '\n',
      'utf-8',
    );
  }
}

function readReleaseManifest(releaseDirectory: string): BwsReleaseManifest {
  return JSON.parse(readFileSync(join(releaseDirectory, 'release-manifest.json'), 'utf-8')) as BwsReleaseManifest;
}

function writeEnvironmentFile(
  envFile: string,
  releaseDirectory: string,
  persistenceConfig: SurebetPersistenceConfig,
): void {
  const manifest = readReleaseManifest(releaseDirectory);
  const apiPort = new URL(manifest.cockpit.apiBaseUrl).port;
  const hostLine = persistenceConfig.host === undefined
    ? `SUREBET_PG_SOCKET_DIRECTORY=${persistenceConfig.socketDirectory}`
    : `SUREBET_PG_HOST=${persistenceConfig.host}`;
  const lines = [
    'BETTING_WIN_REPO_PATH=/operator/read-only/betting-win',
    'BWS_UPSTREAM_LOCK_PATH=./config/betting-win.upstream.lock.json',
    'BWS_UPSTREAM_MODE=export',
    'BWS_UPSTREAM_EXPORT_SELECTION_PATH=/operator/input/export-selection.json',
    `BWS_API_PORT=${apiPort}`,
    'BWS_WORKER_ID=worker-bws-upgrade-001',
    'BWS_WORKER_QUEUE_NAME=private-paper',
    'BWS_WORKER_LEASE_DURATION_MS=30000',
    'BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS=60000',
    'BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS=1000',
    'BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS=30000',
    'BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS=30000',
    'BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS=60000',
    'BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS=1000',
    'BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS=30000',
    'BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS=30000',
    'BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH=128',
    'BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS=5000',
    'BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS=1000',
    'BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS=30000',
    'BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS=30000',
    'BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS=128',
    'SUREBET_RUNTIME_MODE=paper',
    'SUREBET_PROVIDER_CONNECTIONS=disabled',
    'SUREBET_EXECUTION_ENABLED=false',
    `SUREBET_PG_DATABASE=${persistenceConfig.database}`,
    `SUREBET_PG_USER=${persistenceConfig.user}`,
    `SUREBET_PG_PORT=${persistenceConfig.port}`,
    hostLine,
    ...(persistenceConfig.password === undefined ? [] : [`SUREBET_PG_PASSWORD=${persistenceConfig.password}`]),
  ];
  writeFileSync(envFile, `${lines.join('\n')}\n`, 'utf-8');
}

function samplePersistenceConfig(): SurebetPersistenceConfig {
  return Object.freeze({
    database: 'surebet_private',
    host: '127.0.0.1',
    port: 5432,
    user: 'surebet',
  });
}

function samplePreflightCommandRunner(
  command: string,
  _args: readonly string[],
): string {
  if (command === 'node') {
    return 'v20.14.0\n';
  }
  if (command === 'npm') {
    return '10.8.1\n';
  }
  if (command === 'psql') {
    return 'psql (PostgreSQL) 16.3\n';
  }
  throw new Error(`Unexpected command: ${command}`);
}

function sampleLifecycleSnapshot(
  outcome: 'not_running' | 'started' | 'stopped',
): Readonly<{
  readonly blockers: readonly string[];
  readonly healthStatus: 'healthy';
  readonly outcome: 'not_running' | 'started' | 'stopped';
  readonly readinessStatus: 'ready';
  readonly runtimeId: string;
  readonly stateFile: string;
}> {
  return Object.freeze({
    blockers: Object.freeze([]),
    healthStatus: 'healthy',
    outcome,
    readinessStatus: 'ready',
    runtimeId: 'upgrade-runtime-001',
    stateFile: 'runtime/bws-operator-lifecycle/state.json',
  });
}

function listCheckpointClassifications(checkpointDirectory: string): readonly string[] {
  return Object.freeze(
    execFileSync(
      'python3',
      [
        '-c',
        [
          'import json',
          'import pathlib',
          'import sys',
          'paths = sorted(pathlib.Path(sys.argv[1]).glob("*.json"))',
          'print(json.dumps([json.loads(path.read_text())["classification"] for path in paths]))',
        ].join('\n'),
        checkpointDirectory,
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
    ).trim().length === 0
      ? []
      : JSON.parse(
        execFileSync(
          'python3',
          [
            '-c',
            [
              'import json',
              'import pathlib',
              'import sys',
              'paths = sorted(pathlib.Path(sys.argv[1]).glob("*.json"))',
              'print(json.dumps([json.loads(path.read_text())["classification"] for path in paths]))',
            ].join('\n'),
            checkpointDirectory,
          ],
          {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe',
          },
        ),
      ) as readonly string[],
  );
}

function sha256Text(value: string): string {
  return execFileSync(
    'python3',
    [
      '-c',
      [
        'import hashlib',
        'import sys',
        'print(hashlib.sha256(sys.argv[1].encode("utf-8")).hexdigest())',
      ].join('\n'),
      value,
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    },
  ).trim();
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
  const databaseUrl = process.env.DB_URL_TEST;
  let adminConfig: SurebetPersistenceConfig | undefined;
  if (explicitTuple !== undefined) {
    adminConfig = resolveSurebetPersistenceConfig(explicitTuple);
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

function parseDatabaseUrl(url: string): Record<string, string> {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\/+/, '');
  if (databaseName.length === 0) {
    throw new Error('DB_URL_TEST must include a database name.');
  }
  const values: Record<string, string> = {
    SUREBET_PG_DATABASE: databaseName,
    SUREBET_PG_PORT: parsed.port.length === 0 ? '5432' : parsed.port,
    SUREBET_PG_USER: decodeURIComponent(parsed.username),
  };
  if (parsed.hostname.length > 0) {
    values['SUREBET_PG_HOST'] = parsed.hostname;
  }
  if (parsed.password.length > 0) {
    values['SUREBET_PG_PASSWORD'] = decodeURIComponent(parsed.password);
  }
  return values;
}

function createDisposableDatabaseContext(): {
  readonly adminConfig: SurebetPersistenceConfig;
  readonly databaseConfig: SurebetPersistenceConfig;
  readonly databaseName: string;
} {
  const environment = readDisposableDatabaseTestEnvironment();
  if (environment === undefined) {
    throw new Error('Disposable PostgreSQL test configuration is not available.');
  }
  const databaseName = `surebet_bws591_${Date.now()}_${process.pid}`;
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
  execFileSync('createdb', buildPgUtilityArgs(config, databaseName), {
    encoding: 'utf-8',
    env: buildPgUtilityEnvironment(config),
    stdio: 'pipe',
  });
}

function dropDisposableDatabase(config: SurebetPersistenceConfig, databaseName: string): void {
  execFileSync('dropdb', ['--if-exists', ...buildPgUtilityArgs(config, databaseName)], {
    encoding: 'utf-8',
    env: buildPgUtilityEnvironment(config),
    stdio: 'pipe',
  });
}

function buildPgUtilityArgs(config: SurebetPersistenceConfig, databaseName: string): readonly string[] {
  const args = [
    '-U',
    config.user,
    '-p',
    String(config.port),
    '--maintenance-db',
    config.database,
  ];
  if (config.host !== undefined) {
    args.push('-h', config.host);
  }
  if (config.socketDirectory !== undefined) {
    args.push('-h', config.socketDirectory);
  }
  args.push(databaseName);
  return Object.freeze(args);
}

function buildPgUtilityEnvironment(config: SurebetPersistenceConfig): NodeJS.ProcessEnv {
  const passwordKey = ['PG', 'PASSWORD'].join('');
  return {
    ...process.env,
    ...(config.password === undefined ? {} : { [passwordKey]: config.password }),
  };
}
