import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  createBwsFinalLocalAcceptanceCleanupResult,
  createBwsFinalLocalAcceptanceManifest,
  createBwsFinalLocalAcceptanceRecoveryResult,
  createBwsFinalLocalAcceptanceRuntimeResult,
  createBwsReleasePackage,
  runBwsFinalLocalAcceptanceStageOne,
  type BwsMigrationStatusResult,
  type BwsReleaseManifest,
} from '../packages/bootstrap/src/index.js';
import type { SurebetPersistenceConfig } from '../packages/persistence/src/index.js';

const REPO_ROOT = process.cwd();
const COCKPIT_METADATA_FILE = join(REPO_ROOT, 'dist', 'apps', 'web', 'bws-cockpit-build.json');
const TEST_PASSWORD = 'super-secret-final-acceptance-password';
const TEST_TIMESTAMP = '2026-07-17T09:30:00.000Z';

interface ReleaseFixture {
  readonly outputDirectory: string;
  readonly result: Awaited<ReturnType<typeof createBwsReleasePackage>>;
}

let cachedReleaseFixture: Promise<ReleaseFixture> | undefined;

test('final local acceptance stage 1 verifies a clean-room extracted release and writes deterministic migration evidence', async () => {
  const fixture = await getReleaseFixture();
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-stage1-'));
  const envFile = join(tempDirectory, 'private.env');
  const extractionDirectory = join(tempDirectory, 'clean-room');
  const scratchDirectory = join(tempDirectory, 'scratch');
  const outputFile = join(tempDirectory, 'stage1-result.json');
  const migrationStatusFile = join(tempDirectory, 'stage1-migration-status.json');
  const fakePsqlPath = createFakePostgreSqlClient('16.3');
  const persistenceConfig = samplePersistenceConfig();
  const calls: string[] = [];

  try {
    writePrivateEnvironmentFile(envFile, fixture.result.manifest, TEST_PASSWORD);

    await withPatchedPath(dirname(fakePsqlPath), async () => {
      const result = await runBwsFinalLocalAcceptanceStageOne({
        archivePath: fixture.result.archiveFile,
        envFile,
        extractionDirectory,
        migrationStatusFile,
        now: () => TEST_TIMESTAMP,
        outputFile,
        persistenceConfig,
        repositoryRoot: REPO_ROOT,
        scratchDirectory,
        stageDependencies: Object.freeze({
          applyMigrations(config) {
            calls.push(`apply:${config.database}`);
          },
          getMigrationStatus(input) {
            calls.push(`status:${input.repositoryRoot}`);
            return sampleMigrationStatus(input.repositoryRoot);
          },
        }),
      });

      assert.equal(result.schema, 'bws.final_local_acceptance_stage1.v1');
      assert.equal(result.createdAt, TEST_TIMESTAMP);
      assert.equal(result.release.semanticFingerprint, fixture.result.semanticFingerprint);
      assert.equal(result.installVerification.semanticFingerprint, fixture.result.semanticFingerprint);
      assert.equal(result.migration.compatibilityStatus, 'compatible');
      assert.equal(result.migration.pendingMigrationCount, 0);
      assert.equal(result.sourceBoundary.extractedTreeMatchesSourceCheckoutRoot, false);
      assert.equal(result.sourceBoundary.extractedTreeContainsGitMetadata, false);
      assert.ok(result.extraction.extractedReleaseDirectory.startsWith(extractionDirectory));
      assert.ok(result.installVerification.verifiedChecks.includes('non_mutating_preflight_passed'));
      assert.deepEqual(calls, [
        `apply:${persistenceConfig.database}`,
        `status:${result.extraction.extractedReleaseDirectory}`,
      ]);

      const persistedResult = JSON.parse(readFileSync(outputFile, 'utf-8')) as {
        readonly semanticFingerprint: string;
      };
      const persistedMigrationStatus = JSON.parse(readFileSync(migrationStatusFile, 'utf-8')) as {
        readonly schema: string;
      };
      assert.equal(persistedResult.semanticFingerprint, result.semanticFingerprint);
      assert.equal(persistedMigrationStatus.schema, 'bws.database_migration_status.v1');
      assert.equal(existsSync(result.installVerification.resultFile), true);
    });
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
    rmSync(dirname(fakePsqlPath), { force: true, recursive: true });
  }
});

test('final local acceptance stage 1 fails closed when the clean-room migration status is not fully converged', async () => {
  const fixture = await getReleaseFixture();
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-stage1-blocked-'));
  const envFile = join(tempDirectory, 'private.env');
  const extractionDirectory = join(tempDirectory, 'clean-room');
  const scratchDirectory = join(tempDirectory, 'scratch');
  const outputFile = join(tempDirectory, 'stage1-result.json');
  const migrationStatusFile = join(tempDirectory, 'stage1-migration-status.json');
  const fakePsqlPath = createFakePostgreSqlClient('16.3');

  try {
    writePrivateEnvironmentFile(envFile, fixture.result.manifest, TEST_PASSWORD);

    await withPatchedPath(dirname(fakePsqlPath), async () => {
      await assert.rejects(
        () =>
          runBwsFinalLocalAcceptanceStageOne({
            archivePath: fixture.result.archiveFile,
            envFile,
            extractionDirectory,
            migrationStatusFile,
            now: () => TEST_TIMESTAMP,
            outputFile,
            persistenceConfig: samplePersistenceConfig(),
            repositoryRoot: REPO_ROOT,
            scratchDirectory,
            stageDependencies: Object.freeze({
              applyMigrations() {
                return;
              },
              getMigrationStatus(input) {
                return sampleMigrationStatus(input.repositoryRoot, {
                  pendingMigrationCount: 1,
                });
              },
            }),
          }),
        /zero pending migrations/i,
      );
    });
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
    rmSync(dirname(fakePsqlPath), { force: true, recursive: true });
  }
});

test('final local acceptance runtime evidence binds api/export runtime proof plus paper autopilot summary', () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-runtime-'));
  try {
    const apiLifecycleEvidenceFile = join(tempDirectory, 'api-lifecycle.json');
    const apiDiagnosticsManifestFile = join(tempDirectory, 'api-diagnostics.json');
    const apiHandoffFile = join(tempDirectory, 'api-handoff.json');
    const exportLifecycleEvidenceFile = join(tempDirectory, 'export-lifecycle.json');
    const exportDiagnosticsManifestFile = join(tempDirectory, 'export-diagnostics.json');
    const exportHandoffFile = join(tempDirectory, 'export-handoff.json');
    const apiRuntimeEvidenceFile = join(tempDirectory, 'api-runtime-evidence.json');
    const exportRuntimeEvidenceFile = join(tempDirectory, 'export-runtime-evidence.json');
    const paperAutopilotSummaryFile = join(tempDirectory, 'paper-autopilot-summary.txt');
    const telegramCaptureFile = join(tempDirectory, 'paper-autopilot-telegram.txt');
    const outputFile = join(tempDirectory, 'runtime-result.json');

    writeJsonFile(apiLifecycleEvidenceFile, { ok: true });
    writeJsonFile(apiDiagnosticsManifestFile, { ok: true });
    writeJsonFile(apiHandoffFile, { ok: true });
    writeJsonFile(exportLifecycleEvidenceFile, { ok: true });
    writeJsonFile(exportDiagnosticsManifestFile, { ok: true });
    writeJsonFile(exportHandoffFile, { ok: true });
    writeJsonFile(apiRuntimeEvidenceFile, sampleRuntimeEvidenceDocument('api', apiLifecycleEvidenceFile, apiDiagnosticsManifestFile, apiHandoffFile));
    writeJsonFile(exportRuntimeEvidenceFile, sampleRuntimeEvidenceDocument('export', exportLifecycleEvidenceFile, exportDiagnosticsManifestFile, exportHandoffFile));
    writeFileSync(
      paperAutopilotSummaryFile,
      'final_status=PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY\nstop_reason=runtime_window_ready_local_only\n',
      'utf-8',
    );
    writeFileSync(
      telegramCaptureFile,
      'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY|runtime_window_ready_local_only|0\n',
      'utf-8',
    );

    const result = createBwsFinalLocalAcceptanceRuntimeResult({
      outputFile,
      paperAutopilotSummaryFile,
      repositoryRoot: REPO_ROOT,
      runtimeEvidenceFiles: [exportRuntimeEvidenceFile, apiRuntimeEvidenceFile],
      telegramDryRunCaptureFile: telegramCaptureFile,
    });

    assert.equal(result.schema, 'bws.final_local_acceptance_runtime.v1');
    assert.deepEqual(result.modesVerified, ['api', 'export']);
    assert.equal(result.runtimeEvidence.length, 2);
    assert.equal(result.paperAutopilot.finalStatus, 'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY');
    assert.equal(existsSync(outputFile), true);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test('final local acceptance recovery evidence requires successful, rollback, and interrupted-recovery proof', () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-recovery-'));
  try {
    const files = createRecoveryEvidenceFixture(tempDirectory, 'c'.repeat(64));
    const outputFile = join(tempDirectory, 'recovery-result.json');

    const result = createBwsFinalLocalAcceptanceRecoveryResult({
      backupManifestFile: files.backupManifestFile,
      failedReadinessUpgradeResultFile: files.failedReadinessUpgradeResultFile,
      interruptedRecoveryResultFile: files.interruptedRecoveryResultFile,
      outputFile,
      repositoryRoot: REPO_ROOT,
      restoreVerificationFile: files.restoreVerificationFile,
      retentionPlanFile: files.retentionPlanFile,
      rollbackAllowedDecisionFile: files.rollbackAllowedDecisionFile,
      rollbackBlockedDecisionFile: files.rollbackBlockedDecisionFile,
      successfulUpgradePlanFile: files.successfulUpgradePlanFile,
      successfulUpgradeResultFile: files.successfulUpgradeResultFile,
    });

    assert.equal(result.schema, 'bws.final_local_acceptance_recovery.v1');
    assert.equal(result.successfulUpgrade.targetReleaseSemanticFingerprint, 'c'.repeat(64));
    assert.equal(result.recoveryExercises.failedReadinessTerminalCheckpoint, 'readiness_failed');
    assert.equal(existsSync(outputFile), true);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test('final local acceptance manifest binds stage results, soak evidence, and external preflight output', () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-finalize-'));
  try {
    const releaseSemanticFingerprint = 'd'.repeat(64);
    const upstreamLockFingerprint = 'e'.repeat(64);
    const soakSemanticFingerprint = 'f'.repeat(64);
    const artifactArchiveSha256 = '1'.repeat(64);
    const stageOneFile = join(tempDirectory, 'stage1.json');
    const runtimeResultFile = join(tempDirectory, 'runtime.json');
    const recoveryResultFile = join(tempDirectory, 'recovery.json');
    const cleanupResultFile = join(tempDirectory, 'cleanup.json');
    const soakManifestFile = join(tempDirectory, 'soak-manifest.json');
    const soakResultFile = join(tempDirectory, 'soak-result.json');
    const soakValidationFile = join(tempDirectory, 'soak-validation.json');
    const externalRuntimeCampaignFile = join(tempDirectory, 'external-runtime-campaign.json');
    const outputFile = join(tempDirectory, 'final-acceptance.json');

    writeJsonFile(stageOneFile, sampleStageOneDocument(releaseSemanticFingerprint, upstreamLockFingerprint));
    writeJsonFile(runtimeResultFile, sampleRuntimeStageResultDocument());
    writeJsonFile(recoveryResultFile, sampleRecoveryStageResultDocument(releaseSemanticFingerprint));
    writeJsonFile(cleanupResultFile, sampleCleanupStageResultDocument());
    writeJsonFile(soakManifestFile, sampleSoakManifestDocument(soakSemanticFingerprint, releaseSemanticFingerprint));
    writeJsonFile(soakResultFile, sampleSoakResultDocument(soakSemanticFingerprint, artifactArchiveSha256));
    writeJsonFile(soakValidationFile, sampleSoakValidationDocument(artifactArchiveSha256));
    writeJsonFile(
      externalRuntimeCampaignFile,
      sampleExternalRuntimeCampaignDocument(releaseSemanticFingerprint, upstreamLockFingerprint),
    );

    const result = createBwsFinalLocalAcceptanceManifest({
      acceptanceArtifactArchiveSha256: artifactArchiveSha256,
      cleanupResultFile,
      externalRuntimeCampaignFile,
      outputFile,
      recoveryResultFile,
      repositoryRoot: REPO_ROOT,
      runtimeResultFile,
      soakManifestFile,
      soakResultFile,
      soakValidationFile,
      stageOneFile,
    });

    assert.equal(result.schema, 'bws.final_local_acceptance.v1');
    assert.equal(result.release.semanticFingerprint, releaseSemanticFingerprint);
    assert.equal(result.externalRuntimeCampaign.selectedMode, 'export');
    assert.equal(result.cleanup.verified, true);
    assert.equal(existsSync(outputFile), true);
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

test('final local acceptance manifest fails closed on release fingerprint mismatches', () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-finalize-blocked-'));
  try {
    const stageOneFile = join(tempDirectory, 'stage1.json');
    const runtimeResultFile = join(tempDirectory, 'runtime.json');
    const recoveryResultFile = join(tempDirectory, 'recovery.json');
    const cleanupResultFile = join(tempDirectory, 'cleanup.json');
    const soakManifestFile = join(tempDirectory, 'soak-manifest.json');
    const soakResultFile = join(tempDirectory, 'soak-result.json');
    const soakValidationFile = join(tempDirectory, 'soak-validation.json');
    const externalRuntimeCampaignFile = join(tempDirectory, 'external-runtime-campaign.json');
    const outputFile = join(tempDirectory, 'final-acceptance.json');

    writeJsonFile(stageOneFile, sampleStageOneDocument('a'.repeat(64), 'b'.repeat(64)));
    writeJsonFile(runtimeResultFile, sampleRuntimeStageResultDocument());
    writeJsonFile(recoveryResultFile, sampleRecoveryStageResultDocument('a'.repeat(64)));
    writeJsonFile(cleanupResultFile, sampleCleanupStageResultDocument());
    writeJsonFile(soakManifestFile, sampleSoakManifestDocument('c'.repeat(64), 'a'.repeat(64)));
    writeJsonFile(soakResultFile, sampleSoakResultDocument('c'.repeat(64), 'd'.repeat(64)));
    writeJsonFile(soakValidationFile, sampleSoakValidationDocument('d'.repeat(64)));
    writeJsonFile(
      externalRuntimeCampaignFile,
      sampleExternalRuntimeCampaignDocument('f'.repeat(64), 'b'.repeat(64)),
    );

    assert.throws(
      () =>
        createBwsFinalLocalAcceptanceManifest({
          acceptanceArtifactArchiveSha256: 'd'.repeat(64),
          cleanupResultFile,
          externalRuntimeCampaignFile,
          outputFile,
          recoveryResultFile,
          repositoryRoot: REPO_ROOT,
          runtimeResultFile,
          soakManifestFile,
          soakResultFile,
          soakValidationFile,
          stageOneFile,
        }),
      /release fingerprints to match/i,
    );
  } finally {
    rmSync(tempDirectory, { force: true, recursive: true });
  }
});

async function getReleaseFixture(): Promise<ReleaseFixture> {
  if (cachedReleaseFixture !== undefined) {
    return cachedReleaseFixture;
  }
  cachedReleaseFixture = (async () => {
    await ensureRuntimeCockpitBuild();
    const outputDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-release-'));
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

async function ensureRuntimeCockpitBuild(): Promise<void> {
  const compiledWebEntry = join(REPO_ROOT, 'dist', 'apps', 'web', 'src', 'index.js');
  if (!existsSync(COCKPIT_METADATA_FILE)) {
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
  assert.equal(existsSync(compiledWebEntry), true);
}

function createFakePostgreSqlClient(version: string): string {
  const fakeBinDirectory = mkdtempSync(join(tmpdir(), 'bws-final-acceptance-fake-bin-'));
  const fakePsqlPath = join(fakeBinDirectory, 'psql');
  writeFileSync(fakePsqlPath, `#!/usr/bin/env bash\nprintf 'psql (PostgreSQL) ${version}\\n'\n`, 'utf-8');
  chmodSync(fakePsqlPath, 0o755);
  return fakePsqlPath;
}

async function withPatchedPath(fakeBinDirectory: string, callback: () => Promise<void>): Promise<void> {
  const previousPath = process.env.PATH;
  process.env.PATH = `${fakeBinDirectory}:${previousPath === undefined ? '' : previousPath}`;
  try {
    await callback();
  } finally {
    if (previousPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = previousPath;
    }
  }
}

function samplePersistenceConfig(): SurebetPersistenceConfig {
  return Object.freeze({
    database: 'surebet_final_acceptance',
    host: '127.0.0.1',
    password: TEST_PASSWORD,
    port: 5432,
    user: 'surebet',
  });
}

function sampleMigrationStatus(
  repositoryRoot: string,
  overrides: Readonly<{
    readonly pendingMigrationCount?: number;
  }> = {},
): BwsMigrationStatusResult {
  const pendingMigrationCount = overrides.pendingMigrationCount ?? 0;
  return Object.freeze({
    compatibility: Object.freeze({
      reasons: Object.freeze([]),
      status: 'compatible' as const,
    }),
    database: Object.freeze({
      connectionTarget: '127.0.0.1:5432',
      currentDatabase: 'surebet_final_acceptance',
      currentUser: 'surebet',
      requestedDatabase: 'surebet_final_acceptance',
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
      applied: Object.freeze([
        Object.freeze({
          appliedAt: TEST_TIMESTAMP,
          migrationName: '0001_init_surebet.sql',
          sha256: 'a'.repeat(64),
        }),
      ]),
      available: Object.freeze([
        Object.freeze({
          migrationName: '0001_init_surebet.sql',
          path: 'packages/persistence/migrations/0001_init_surebet.sql',
          sha256: 'a'.repeat(64),
        }),
      ]),
      checksumMismatches: Object.freeze([]),
      pending: Object.freeze(
        Array.from({ length: pendingMigrationCount }, (_, index) =>
          Object.freeze({
            migrationName: `000${index + 2}_pending.sql`,
            path: `packages/persistence/migrations/000${index + 2}_pending.sql`,
            sha256: 'b'.repeat(64),
          })),
      ),
    }),
    ownership: Object.freeze({
      migrationScope: 'surebet_only_verified' as const,
      schema: 'surebet' as const,
      schemaExists: true,
      schemaOwnedObjectCount: 12,
    }),
    schema: 'bws.database_migration_status.v1',
  });
}

function writePrivateEnvironmentFile(envFile: string, manifest: BwsReleaseManifest, password: string): void {
  const port = new URL(manifest.cockpit.apiBaseUrl).port;
  const lines = [
    'BETTING_WIN_REPO_PATH=/operator/read-only/betting-win',
    'BWS_UPSTREAM_LOCK_PATH=./config/betting-win.upstream.lock.json',
    'BWS_UPSTREAM_MODE=export',
    'BWS_UPSTREAM_EXPORT_SELECTION_PATH=/operator/input/export-selection.json',
    `BWS_API_PORT=${port}`,
    'BWS_WORKER_ID=worker-bws-final-acceptance-001',
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
    'SUREBET_PG_DATABASE=surebet_final_acceptance',
    'SUREBET_PG_USER=surebet',
    'SUREBET_PG_PORT=5432',
    'SUREBET_PG_HOST=127.0.0.1',
    `SUREBET_PG_PASSWORD=${password}`,
  ];
  writeFileSync(envFile, `${lines.join('\n')}\n`, 'utf-8');
}

function writeJsonFile(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function sampleRuntimeEvidenceDocument(
  mode: 'api' | 'export',
  lifecycleEvidenceFile: string,
  diagnosticsManifestFile: string,
  handoffFile: string,
): Record<string, unknown> {
  return {
    finalStatus: 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
    generatedAt: TEST_TIMESTAMP,
    latestDiagnosticsManifestFile: diagnosticsManifestFile,
    latestRuntimeHandoffFile: handoffFile,
    latestRuntimeHandoffLatestFile: handoffFile,
    observation: {
      endedAt: TEST_TIMESTAMP,
      intervalMs: 1000,
      maxDurationMs: 2000,
      sampleCount: 1,
      samples: [
        {
          apiStatus: 'ready',
          cockpitStatus: 'ready',
          databaseStatus: 'compatible',
          diagnosticsBundleDirectory: dirname(diagnosticsManifestFile),
          diagnosticsManifestFile,
          evidenceEntryCount: 1,
          generatedAt: TEST_TIMESTAMP,
          healthStatus: 'healthy',
          lifecycleEvidenceFile,
          lifecycleOutcome: 'running',
          readinessStatus: 'ready',
          runtimeLifecycleState: 'running',
          schedulerLifecycleState: 'running',
          upstreamLifecycleState: 'running',
          workerLifecycleState: 'running',
        },
      ],
      startedAt: TEST_TIMESTAMP,
    },
    runtimeHandoff: {
      archive: {
        archiveFile: 'artifacts/runtime-source.tar.gz',
        sha256: '9'.repeat(64),
        sizeBytes: 42,
      },
      generatedAt: TEST_TIMESTAMP,
      handoff: {
        automation: {
          integrationStatus: 'pending_protected_controller_review',
          machineReadableFormat: 'json',
          nextGate: 'BWS-600',
        },
        closedBoundary: {
          automaticFallback: 'forbidden',
          execution: 'disabled',
          providerConnections: 'disabled',
          runtimeMode: 'paper',
        },
        currentTask: 'BWS-580',
        generatedAt: TEST_TIMESTAMP,
        packaging: {
          sourceHandoffArchive: {
            archiveFile: 'artifacts/runtime-source.tar.gz',
            sha256: '9'.repeat(64),
            sizeBytes: 42,
          },
        },
        process: {
          command: ['node', 'dist/app.js'],
          commandCwd: REPO_ROOT,
          entryPointPath: 'dist/app.js',
          kind: 'api_runtime',
          lifecycleToken: 'token-1',
          pid: 123,
          processName: 'node',
          procStartTicks: '10',
          roles: ['api'],
          startedAt: TEST_TIMESTAMP,
        },
        program: 'BWS_FULL_PLATFORM_IMPLEMENTATION_V1',
        repository: {
          name: 'betting-win-surebet',
          root: REPO_ROOT,
        },
        runtime: {
          command: 'status',
          configuration: {
            policy: {
              executionEnabled: false,
              providerConnections: 'disabled',
            },
          },
          evidenceFile: lifecycleEvidenceFile,
          health: { ok: true, statusCode: 200, url: 'http://127.0.0.1/health', body: {} },
          outcome: 'running',
          readiness: { ok: true, statusCode: 200, url: 'http://127.0.0.1/readiness', body: {} },
          service: 'full_stack',
          stateFile: lifecycleEvidenceFile,
        },
        safeLocalTerminalGate: 'BWS-580',
        schema: 'bws.paper_runtime_handoff.v1',
        sourceFingerprints: {
          packageVersion: '0.48.0',
          sourceManifestGeneratedAt: TEST_TIMESTAMP,
          sourceManifestOverlay: 'baseline',
          sourceManifestSha256: '8'.repeat(64),
          upstreamCommitSha: 'commit',
          upstreamGitTreeSha: 'tree',
          upstreamTrackedTreeListingSha256: '7'.repeat(64),
        },
      },
      handoffFile,
      latestHandoffFile: handoffFile,
    },
    schema: 'bws.paper_runtime_evidence.v1',
    selectedUpstreamMode: mode,
    stackOwnership: 'started',
    stackStopDisposition: 'stopped_started_stack',
    stopReason: 'runtime_window_ready_local_only',
  };
}

interface RecoveryEvidenceFixture {
  readonly backupManifestFile: string;
  readonly failedReadinessUpgradeResultFile: string;
  readonly interruptedRecoveryResultFile: string;
  readonly restoreVerificationFile: string;
  readonly retentionPlanFile: string;
  readonly rollbackAllowedDecisionFile: string;
  readonly rollbackBlockedDecisionFile: string;
  readonly successfulUpgradePlanFile: string;
  readonly successfulUpgradeResultFile: string;
}

function createRecoveryEvidenceFixture(tempDirectory: string, targetReleaseSemanticFingerprint: string): RecoveryEvidenceFixture {
  const files = {
    backupManifestFile: join(tempDirectory, 'backup-manifest.json'),
    restoreVerificationFile: join(tempDirectory, 'restore-verification.json'),
    retentionPlanFile: join(tempDirectory, 'retention-plan.json'),
    successfulUpgradePlanFile: join(tempDirectory, 'successful-upgrade-plan.json'),
    successfulUpgradeResultFile: join(tempDirectory, 'successful-upgrade-result.json'),
    failedReadinessUpgradeResultFile: join(tempDirectory, 'failed-readiness-upgrade-result.json'),
    rollbackAllowedDecisionFile: join(tempDirectory, 'rollback-allowed-decision.json'),
    rollbackBlockedDecisionFile: join(tempDirectory, 'rollback-blocked-decision.json'),
    interruptedRecoveryResultFile: join(tempDirectory, 'interrupted-recovery-result.json'),
  };

  writeJsonFile(files.backupManifestFile, {
    schema: 'bws.database_backup_manifest.v1',
    createdAt: TEST_TIMESTAMP,
    database: {
      currentDatabase: 'surebet_final_acceptance',
      requestedDatabase: 'surebet_final_acceptance',
    },
    migrationLedger: { pending: [] },
    rowCounts: [],
  });
  writeJsonFile(files.restoreVerificationFile, {
    schema: 'bws.database_restore_verification.v1',
    backupManifest: { schema: 'bws.database_backup_manifest.v1' },
    createdAt: TEST_TIMESTAMP,
    serverRestartsVerified: true,
  });
  writeJsonFile(files.retentionPlanFile, {
    schema: 'bws.database_retention_plan.v1',
    planFingerprint: '4'.repeat(64),
  });
  writeJsonFile(files.successfulUpgradePlanFile, {
    schema: 'bws.upgrade_plan.v1',
    planFingerprint: '5'.repeat(64),
    status: 'ready',
  });
  writeJsonFile(files.successfulUpgradeResultFile, {
    schema: 'bws.upgrade_result.v1',
    outcome: 'upgrade_applied',
    planFingerprint: '5'.repeat(64),
    targetRelease: {
      semanticFingerprint: targetReleaseSemanticFingerprint,
    },
    terminalCheckpoint: 'target_started',
  });
  writeJsonFile(files.failedReadinessUpgradeResultFile, {
    schema: 'bws.upgrade_result.v1',
    outcome: 'rollback_applied',
    planFingerprint: '6'.repeat(64),
    targetRelease: {
      semanticFingerprint: targetReleaseSemanticFingerprint,
    },
    terminalCheckpoint: 'readiness_failed',
  });
  writeJsonFile(files.rollbackAllowedDecisionFile, {
    schema: 'bws.rollback_decision.v1',
    rollbackStatus: 'allowed',
  });
  writeJsonFile(files.rollbackBlockedDecisionFile, {
    schema: 'bws.rollback_decision.v1',
    rollbackStatus: 'blocked',
  });
  writeJsonFile(files.interruptedRecoveryResultFile, {
    schema: 'bws.recovery_result.v1',
    outcome: 'recovery_complete',
  });
  return files satisfies RecoveryEvidenceFixture;
}

function sampleStageOneDocument(releaseSemanticFingerprint: string, upstreamLockFingerprintSha256: string): Record<string, unknown> {
  return {
    schema: 'bws.final_local_acceptance_stage1.v1',
    createdAt: TEST_TIMESTAMP,
    extraction: {
      archiveFile: '/tmp/archive.tar.gz',
      archiveSha256: '1'.repeat(64),
      cleanRoomRoot: '/tmp/clean-room',
      extractedReleaseDirectory: '/tmp/clean-room/release',
      sourceCheckoutIndependentInstallVerified: true,
    },
    installVerification: {
      resultFile: '/tmp/install-result.json',
      semanticFingerprint: releaseSemanticFingerprint,
      verifiedChecks: ['non_mutating_preflight_passed'],
    },
    migration: {
      compatibilityStatus: 'compatible',
      currentDatabase: 'surebet_final_acceptance',
      migrationStatusFile: '/tmp/migration-status.json',
      pendingMigrationCount: 0,
      requestedDatabase: 'surebet_final_acceptance',
    },
    release: {
      releaseId: 'bws-release-test',
      semanticFingerprint: releaseSemanticFingerprint,
      sourceManifestSha256: '2'.repeat(64),
      upstreamLockFingerprintSha256,
    },
    semanticFingerprint: '3'.repeat(64),
    sourceBoundary: {
      extractedTreeContainsGitMetadata: false,
      extractedTreeMatchesSourceCheckoutRoot: false,
      repositoryRoot: REPO_ROOT,
    },
  };
}

function sampleRuntimeStageResultDocument(): Record<string, unknown> {
  return {
    schema: 'bws.final_local_acceptance_runtime.v1',
    createdAt: TEST_TIMESTAMP,
    closedBoundary: {
      automaticFallback: 'forbidden',
      executionEnabled: false,
      listenerExposure: 'loopback_only',
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    },
    modesVerified: ['api', 'export'],
    paperAutopilot: {
      finalStatus: 'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
      stopReason: 'runtime_window_ready_local_only',
      summaryFile: '/tmp/paper-autopilot-summary.txt',
      telegramDryRunCaptureFile: '/tmp/paper-autopilot-telegram.txt',
    },
    runtimeEvidence: [],
    semanticFingerprint: '6'.repeat(64),
  };
}

function sampleRecoveryStageResultDocument(targetReleaseSemanticFingerprint: string): Record<string, unknown> {
  return {
    schema: 'bws.final_local_acceptance_recovery.v1',
    backupRestore: {
      backupManifestFile: '/tmp/backup-manifest.json',
      restoreVerificationFile: '/tmp/restore-verification.json',
      retentionPlanFile: '/tmp/retention-plan.json',
    },
    createdAt: TEST_TIMESTAMP,
    interruptedRecovery: {
      outcome: 'recovery_complete',
      resultFile: '/tmp/interrupted-recovery-result.json',
    },
    rollbackDecisions: {
      allowedDecisionFile: '/tmp/rollback-allowed-decision.json',
      blockedDecisionFile: '/tmp/rollback-blocked-decision.json',
    },
    recoveryExercises: {
      failedReadinessResultFile: '/tmp/failed-readiness-upgrade-result.json',
      failedReadinessTerminalCheckpoint: 'readiness_failed',
    },
    semanticFingerprint: '7'.repeat(64),
    successfulUpgrade: {
      planFile: '/tmp/successful-upgrade-plan.json',
      planFingerprint: '8'.repeat(64),
      resultFile: '/tmp/successful-upgrade-result.json',
      targetReleaseSemanticFingerprint,
    },
  };
}

function sampleCleanupStageResultDocument(): Record<string, unknown> {
  return {
    schema: 'bws.final_local_acceptance_cleanup.v1',
    createdAt: TEST_TIMESTAMP,
    leakedLeaseCount: 0,
    leakedProcessIds: [],
    remainingTemporaryFiles: [],
    semanticFingerprint: '9'.repeat(64),
    temporaryDirectories: ['/tmp/clean-room'],
    verified: true,
  };
}

function sampleSoakManifestDocument(semanticFingerprint: string, releaseSemanticFingerprint: string): Record<string, unknown> {
  return {
    schema: 'bws.soak_campaign.v1',
    semanticFingerprint,
    release: {
      semanticFingerprint: releaseSemanticFingerprint,
    },
  };
}

function sampleSoakResultDocument(campaignSemanticFingerprint: string, artifactArchiveSha256: string): Record<string, unknown> {
  return {
    schema: 'bws.soak_campaign_result.v1',
    artifactArchiveSha256,
    campaignSemanticFingerprint,
  };
}

function sampleSoakValidationDocument(artifactArchiveSha256: string): Record<string, unknown> {
  return {
    schema: 'bws.soak_campaign_validation.v1',
    artifactArchiveSha256,
    ok: true,
  };
}

function sampleExternalRuntimeCampaignDocument(releaseSemanticFingerprint: string, upstreamLockFingerprintSha256: string): Record<string, unknown> {
  return {
    schema: 'bws.external_runtime_campaign.v1',
    semanticFingerprint: 'a'.repeat(64),
    policy: {
      executionEnabled: false,
      providerConnections: 'disabled',
      runtimeMode: 'paper',
      selectedMode: 'export',
    },
    release: {
      semanticFingerprint: releaseSemanticFingerprint,
    },
    upstreamLock: {
      fingerprintSha256: upstreamLockFingerprintSha256,
    },
  };
}
