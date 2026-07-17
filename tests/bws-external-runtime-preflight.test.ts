import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  createBwsExternalRuntimeCampaignManifest,
  createBwsSoakCampaign,
  executeBwsSoakCampaign,
  recordBwsSoakCampaignCheckpoint,
  runBwsExternalRuntimePreflightCli,
  validatePinnedBettingWinStrategyExportIntake,
} from '../packages/bootstrap/src/index.js';
import { readBettingWinUpstreamLock } from '../packages/upstream/src/index.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-16T19:00:00.000Z';
const SEQUENTIAL_TEST_OPTIONS = Object.freeze({ concurrency: false });

test('external runtime preflight builds a deterministic export-mode manifest without leaking secrets', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = await createFixture();
  try {
    const first = await createBwsExternalRuntimeCampaignManifest(createExportRequest(fixture));
    const second = await createBwsExternalRuntimeCampaignManifest(createExportRequest(fixture));

    assert.equal(first.manifest.semanticFingerprint, second.manifest.semanticFingerprint);
    assert.equal(first.manifest.schema, 'bws.external_runtime_campaign.v1');
    assert.equal(first.manifest.selectedInput.mode, 'export');
    assert.equal(first.manifest.policy.selectedMode, 'export');
    assert.equal(first.manifest.release.semanticFingerprint, fixture.releaseSemanticFingerprint);
    assert.equal(first.manifest.evidence.soakState.file, resolve(fixture.exportSoakStateFile));

    const payload = readFileSync(first.outputFile, 'utf-8');
    assert.ok(!payload.includes('super-secret-password'));
    assert.ok(!payload.includes('credential'));

    const schema = JSON.parse(readFileSync(join(REPO_ROOT, 'schemas', 'bws-external-runtime-campaign.v1.schema.json'), 'utf-8')) as {
      properties: { schema: { const: string } };
    };
    assert.equal(schema.properties.schema.const, 'bws.external_runtime_campaign.v1');
  } finally {
    fixture.dispose();
  }
});

test('external runtime preflight API mode inspects a loopback contract endpoint and CLI prepare prints json', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = await createFixture();
  const capture = createCaptureStream();
  const server = createServer((request, response) => {
    if (request.url === '/contract') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ contractVersion: '1.0.0' }));
      return;
    }
    response.writeHead(404);
    response.end();
  });

  await new Promise<void>((resolvePromise) => {
    server.listen(0, '127.0.0.1', () => resolvePromise());
  });

  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  const apiBaseUrl = `http://127.0.0.1:${String(address.port)}`;
  writeApiEnvFile(fixture.apiEnvFile, apiBaseUrl);

  try {
    const exitCode = await runBwsExternalRuntimePreflightCli(
      [
        'prepare',
        '--mode',
        'api',
        '--release-dir',
        fixture.releaseDirectory,
        '--env-file',
        fixture.apiEnvFile,
        '--install-verification-file',
        fixture.installVerificationApiFile,
        '--migration-status-file',
        fixture.migrationStatusFile,
        '--backup-manifest-file',
        fixture.backupManifestFile,
        '--restore-verification-file',
        fixture.restoreVerificationFile,
        '--soak-manifest-file',
        fixture.apiSoakManifestFile,
        '--soak-state-file',
        fixture.apiSoakStateFile,
        '--runtime-dir',
        fixture.runtimeDirectory,
        '--evidence-dir',
        fixture.evidenceDirectory,
        '--output-file',
        fixture.apiManifestOutputFile,
        '--campaign-duration-hours',
        '72',
        '--campaign-max-cycles',
        '200',
        '--campaign-cycle-timeout-minutes',
        '360',
        '--minimum-available-bytes',
        '1',
        '--expected-upstream-lock-fingerprint',
        fixture.upstreamLockFingerprint,
        '--checkpoint-id',
        'api-checkpoint-001',
        '--api-base-url',
        apiBaseUrl,
        '--contract-version',
        '1.0.0',
        '--page-size',
        '25',
        '--max-pages-per-resource',
        '4',
        '--timeout-ms',
        '1000',
        '--retry-limit',
        '1',
        '--retry-backoff-ms',
        '10',
        '--inspect-contract',
      ],
      REPO_ROOT,
      capture.stream,
    );
    assert.equal(exitCode, 0);

    const parsed = JSON.parse(capture.read()) as {
      manifest: {
        selectedInput: {
          mode: 'api';
          contractInspection: { endpoint: string; verifiedContractVersion: string };
        };
      };
    };
    assert.equal(parsed.manifest.selectedInput.mode, 'api');
    assert.equal(parsed.manifest.selectedInput.contractInspection.verifiedContractVersion, '1.0.0');
    assert.equal(parsed.manifest.selectedInput.contractInspection.endpoint, `${apiBaseUrl}/contract`);
  } finally {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error === undefined) {
          resolvePromise();
          return;
        }
        rejectPromise(error);
      });
    });
    fixture.dispose();
  }
});

test('external runtime preflight rejects credential-bearing API URLs', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = await createFixture();
  writeApiEnvFile(fixture.apiEnvFile, 'http://127.0.0.1:4301');
  try {
    await assert.rejects(
      () =>
        createBwsExternalRuntimeCampaignManifest({
          ...createApiRequest(fixture),
          envFile: fixture.apiEnvFile,
          selectedInput: Object.freeze({
            ...createApiRequest(fixture).selectedInput,
            apiBaseUrl: 'http://user:password@127.0.0.1:4301',
          }),
        }),
      /must not include embedded credentials/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('external runtime preflight rejects install verification evidence for a different selected mode', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      () =>
        createBwsExternalRuntimeCampaignManifest({
          ...createApiRequest(fixture),
          installVerificationFile: fixture.installVerificationExportFile,
        }),
      /install verification evidence for the same selected upstream mode/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('external runtime preflight rejects incomplete soak evidence that does not reach cleanup verification', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      () =>
        createBwsExternalRuntimeCampaignManifest({
          ...createExportRequest(fixture),
          soakManifestFile: fixture.incompleteSoakManifestFile,
          soakStateFile: fixture.incompleteSoakStateFile,
        }),
      /cleanup_verified|duration budget/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('external runtime preflight rejects soak evidence without retained managed runtime wall-clock proof', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = await createFixture();
  try {
    const state = JSON.parse(readFileSync(fixture.exportSoakStateFile, 'utf-8')) as Record<string, unknown>;
    delete state.runtimeEvidence;
    writeFileSync(fixture.exportSoakStateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');

    await assert.rejects(
      () => createBwsExternalRuntimeCampaignManifest(createExportRequest(fixture)),
      /managed runtime wall-clock proof/i,
    );
  } finally {
    fixture.dispose();
  }
});

function createExportRequest(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return Object.freeze({
    backupManifestFile: fixture.backupManifestFile,
    campaignCycleTimeoutMinutes: 360,
    campaignDurationHours: 72,
    campaignMaxCycles: 200,
    envFile: fixture.exportEnvFile,
    evidenceDirectory: fixture.evidenceDirectory,
    installVerificationFile: fixture.installVerificationExportFile,
    migrationStatusFile: fixture.migrationStatusFile,
    minimumAvailableBytes: 1,
    now: () => TEST_TIMESTAMP,
    outputFile: fixture.exportManifestOutputFile,
    releaseDirectory: fixture.releaseDirectory,
    repositoryRoot: REPO_ROOT,
    restoreVerificationFile: fixture.restoreVerificationFile,
    runtimeDirectory: fixture.runtimeDirectory,
    selectedInput: Object.freeze({
      contractAlias: 'betting-win-strategy-export.v1',
      contractSchema: 'betting-win.strategy-export.v1',
      expectedSha256: fixture.exportSha256,
      expectedUpstreamLockFingerprint: fixture.upstreamLockFingerprint,
      exportPath: fixture.exportPath,
      mode: 'export' as const,
      providerGenerationIds: fixture.providerGenerationIds,
      sourceLineageRecordIds: fixture.sourceLineageRecordIds,
      surebetProfile: 'surebet_standard_binary_v0',
    }),
    soakManifestFile: fixture.exportSoakManifestFile,
    soakStateFile: fixture.exportSoakStateFile,
  });
}

function createApiRequest(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return Object.freeze({
    backupManifestFile: fixture.backupManifestFile,
    campaignCycleTimeoutMinutes: 360,
    campaignDurationHours: 72,
    campaignMaxCycles: 200,
    envFile: fixture.apiEnvFile,
    evidenceDirectory: fixture.evidenceDirectory,
    installVerificationFile: fixture.installVerificationApiFile,
    migrationStatusFile: fixture.migrationStatusFile,
    minimumAvailableBytes: 1,
    now: () => TEST_TIMESTAMP,
    outputFile: fixture.apiManifestOutputFile,
    releaseDirectory: fixture.releaseDirectory,
    repositoryRoot: REPO_ROOT,
    restoreVerificationFile: fixture.restoreVerificationFile,
    runtimeDirectory: fixture.runtimeDirectory,
    selectedInput: Object.freeze({
      apiBaseUrl: 'http://127.0.0.1:4301',
      checkpointId: 'api-checkpoint-001',
      contractVersion: '1.0.0',
      expectedUpstreamLockFingerprint: fixture.upstreamLockFingerprint,
      inspectContract: false,
      maxPagesPerResource: 4,
      mode: 'api' as const,
      pageSize: 25,
      retryBackoffMs: 10,
      retryLimit: 1,
      timeoutMs: 1000,
    }),
    soakManifestFile: fixture.apiSoakManifestFile,
    soakStateFile: fixture.apiSoakStateFile,
  });
}

async function createFixture() {
  resetSharedObservabilityDirectory();
  const tempDirectory = mkdtempSync(join(REPO_ROOT, 'artifacts', 'bws-external-runtime-preflight-'));
  const releaseDirectoryAbsolute = join(tempDirectory, 'release');
  const runtimeDirectoryAbsolute = join(tempDirectory, 'runtime');
  const evidenceDirectoryAbsolute = join(tempDirectory, 'evidence');
  const exportEnvFileAbsolute = join(tempDirectory, 'bws-export.env');
  const apiEnvFileAbsolute = join(tempDirectory, 'bws-api.env');
  const installVerificationExportFileAbsolute = join(tempDirectory, 'install-verification-export.json');
  const installVerificationApiFileAbsolute = join(tempDirectory, 'install-verification-api.json');
  const migrationStatusFileAbsolute = join(tempDirectory, 'migration-status.json');
  const backupManifestFileAbsolute = join(tempDirectory, 'backup-manifest.json');
  const restoreVerificationFileAbsolute = join(tempDirectory, 'restore-verification.json');
  const exportManifestOutputFileAbsolute = join(tempDirectory, 'external-runtime-export.json');
  const apiManifestOutputFileAbsolute = join(tempDirectory, 'external-runtime-api.json');
  const upstreamLock = readBettingWinUpstreamLock(join(REPO_ROOT, 'config', 'betting-win.upstream.lock.json'), REPO_ROOT);
  const upstreamLockFingerprint = stableObjectFingerprint(upstreamLock);
  const releaseSemanticFingerprint = 'd'.repeat(64);
  const sourceManifestSha256 = 'e'.repeat(64);
  const exportFixtureAbsolute = join(tempDirectory, 'pinned-export.json');
  writePinnedExportFixture(exportFixtureAbsolute);
  const exportPath = relative(REPO_ROOT, exportFixtureAbsolute);
  const exportSha256 = fileSha256(exportFixtureAbsolute);
  const intake = validatePinnedBettingWinStrategyExportIntake({
    expectedSha256: exportSha256,
    exportPath,
    repositoryRoot: REPO_ROOT,
    upstreamLock,
  });
  assert.ok(intake.ok);

  mkdirTempDir(releaseDirectoryAbsolute);
  mkdirTempDir(runtimeDirectoryAbsolute);
  mkdirTempDir(evidenceDirectoryAbsolute);
  mkdirTempDir(join(releaseDirectoryAbsolute, 'config'));

  writeFileSync(
    join(releaseDirectoryAbsolute, 'release-manifest.json'),
    `${JSON.stringify({
      cockpit: {
        apiBaseUrl: 'http://127.0.0.1:4312',
      },
      policy: {
        executionEnabled: false,
        providerConnections: 'disabled',
        runtimeMode: 'paper',
      },
      releaseId: 'bws-release-test-001',
      schema: 'bws.release_manifest.v1',
      semanticFingerprint: releaseSemanticFingerprint,
      source: {
        sourceManifestSha256,
      },
      upstreamLock: {
        fingerprintSha256: upstreamLockFingerprint,
      },
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(releaseDirectoryAbsolute, 'config', 'betting-win.upstream.lock.json'),
    readFileSync(join(REPO_ROOT, 'config', 'betting-win.upstream.lock.json'), 'utf-8'),
    'utf-8',
  );
  writeFileSync(
    installVerificationExportFileAbsolute,
    `${JSON.stringify({
      preflight: {
        policy: {
          selectedMode: 'export',
        },
      },
      schema: 'bws.release_install_verification.v1',
      semanticFingerprint: releaseSemanticFingerprint,
      verifiedChecks: ['non_mutating_preflight_passed'],
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    installVerificationApiFileAbsolute,
    `${JSON.stringify({
      preflight: {
        policy: {
          selectedMode: 'api',
        },
      },
      schema: 'bws.release_install_verification.v1',
      semanticFingerprint: releaseSemanticFingerprint,
      verifiedChecks: ['non_mutating_preflight_passed'],
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    migrationStatusFileAbsolute,
    `${JSON.stringify({
      compatibility: { reasons: [], status: 'compatible' },
      database: {
        connectionTarget: '127.0.0.1:5432/surebet_private',
        currentDatabase: 'surebet_private',
        currentUser: 'surebet',
        requestedDatabase: 'surebet_private',
        requestedUser: 'surebet',
      },
      migrationLedger: {
        pending: [],
      },
      schema: 'bws.database_migration_status.v1',
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    backupManifestFileAbsolute,
    `${JSON.stringify({
      createdAt: TEST_TIMESTAMP,
      database: {
        connectionTarget: '127.0.0.1:5432/surebet_private',
        currentDatabase: 'surebet_private',
        currentUser: 'surebet',
        requestedDatabase: 'surebet_private',
        requestedUser: 'surebet',
      },
      schema: 'bws.database_backup_manifest.v1',
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    restoreVerificationFileAbsolute,
    `${JSON.stringify({
      backupManifest: JSON.parse(readFileSync(backupManifestFileAbsolute, 'utf-8')),
      createdAt: TEST_TIMESTAMP,
      schema: 'bws.database_restore_verification.v1',
      serverRestartsVerified: true,
    }, null, 2)}\n`,
    'utf-8',
  );

  const exportSoak = await createSoakEvidence({
    mode: 'export',
    outputDirectory: join(tempDirectory, 'soak-export'),
    releaseSemanticFingerprint,
    runCompleteCampaign: true,
    upstreamLockFingerprint,
  });
  const apiSoak = await createSoakEvidence({
    mode: 'api',
    outputDirectory: join(tempDirectory, 'soak-api'),
    releaseSemanticFingerprint,
    runCompleteCampaign: true,
    upstreamLockFingerprint,
  });
  const incompleteExportSoak = await createSoakEvidence({
    mode: 'export',
    outputDirectory: join(tempDirectory, 'soak-export-incomplete'),
    releaseSemanticFingerprint,
    runCompleteCampaign: false,
    upstreamLockFingerprint,
  });

  writeExportEnvFile(exportEnvFileAbsolute);
  writeApiEnvFile(apiEnvFileAbsolute, 'http://127.0.0.1:4301');

  return Object.freeze({
    apiEnvFile: apiEnvFileAbsolute,
    apiManifestOutputFile: apiManifestOutputFileAbsolute,
    apiSoakManifestFile: apiSoak.manifestFile,
    apiSoakStateFile: apiSoak.stateFile,
    backupManifestFile: backupManifestFileAbsolute,
    dispose() {
      removeDirectoryWithRetries(tempDirectory);
      removeDirectoryWithRetries(join(REPO_ROOT, 'runtime', 'bws-observability'));
    },
    evidenceDirectory: evidenceDirectoryAbsolute,
    exportEnvFile: exportEnvFileAbsolute,
    exportManifestOutputFile: exportManifestOutputFileAbsolute,
    exportPath,
    exportSha256,
    incompleteSoakManifestFile: incompleteExportSoak.manifestFile,
    exportSoakManifestFile: exportSoak.manifestFile,
    exportSoakStateFile: exportSoak.stateFile,
    incompleteSoakStateFile: incompleteExportSoak.stateFile,
    installVerificationApiFile: installVerificationApiFileAbsolute,
    installVerificationExportFile: installVerificationExportFileAbsolute,
    migrationStatusFile: migrationStatusFileAbsolute,
    providerGenerationIds: intake.value.providerGenerationIds,
    releaseDirectory: releaseDirectoryAbsolute,
    releaseSemanticFingerprint,
    restoreVerificationFile: restoreVerificationFileAbsolute,
    runtimeDirectory: runtimeDirectoryAbsolute,
    sourceLineageRecordIds: intake.value.sourceLineageRecordIds,
    tempDirectory,
    upstreamLockFingerprint,
  });
}

function resetSharedObservabilityDirectory(): void {
  removeDirectoryWithRetries(join(REPO_ROOT, 'runtime', 'bws-observability'));
}

async function createSoakEvidence(request: Readonly<{
  readonly mode: 'api' | 'export';
  readonly outputDirectory: string;
  readonly releaseSemanticFingerprint: string;
  readonly runCompleteCampaign: boolean;
  readonly upstreamLockFingerprint: string;
}>) {
  mkdirTempDir(request.outputDirectory);
  const manifestFile = join(request.outputDirectory, 'manifest.json');
  const stateFile = join(request.outputDirectory, 'state.json');
  const checkpointDirectory = join(request.outputDirectory, 'checkpoints');
  const evidenceDirectory = join(request.outputDirectory, 'evidence');
  const runtimeDirectory = join(request.outputDirectory, 'runtime');
  await createBwsSoakCampaign({
    checkpointDirectory: relative(REPO_ROOT, checkpointDirectory),
    databaseIdentity: 'surebet_private',
    durationMs: 7_200_000,
    evidenceDirectory: relative(REPO_ROOT, evidenceDirectory),
    failureSchedule: Object.freeze([
      Object.freeze({
        expectedRecovery: 'resume_campaign' as const,
        injectionId: `inject-${request.mode}-worker`,
        stage: 'after_cycle' as const,
        target: 'worker_crash_after_checkpoint' as const,
        triggerCycleNumber: 2,
      }),
    ]),
    manifestOutputFile: relative(REPO_ROOT, manifestFile),
    maxCycles: 2,
    now: () => TEST_TIMESTAMP,
    releaseSemanticFingerprint: request.releaseSemanticFingerprint,
    repositoryRoot: REPO_ROOT,
    resume: false,
    runtimeDirectory: relative(REPO_ROOT, runtimeDirectory),
    seed: `seed-${request.mode}-bws600`,
    selectedUpstreamMode: request.mode,
    stateFile: relative(REPO_ROOT, stateFile),
    intervalMs: 3_600_000,
  });
  if (request.runCompleteCampaign) {
    await executeBwsSoakCampaign({
      executeUntilCycleNumber: 2,
      manifestFile: relative(REPO_ROOT, manifestFile),
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      resultFile: relative(REPO_ROOT, join(request.outputDirectory, 'result.json')),
      stateFile: relative(REPO_ROOT, stateFile),
    });
    writeSoakRuntimeEvidenceState(stateFile, 7_200_000, 2);
  } else {
    await recordBwsSoakCampaignCheckpoint({
      classification: 'cycle_observed',
      cycleNumber: 1,
      details: Object.freeze({ mode: request.mode }),
      manifestFile: relative(REPO_ROOT, manifestFile),
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      stateFile: relative(REPO_ROOT, stateFile),
      status: 'completed',
    });
  }
  return Object.freeze({
    manifestFile,
    stateFile,
  });
}

function writeSoakRuntimeEvidenceState(
  stateFile: string,
  elapsedWallClockMs: number,
  observationCount: number,
): void {
  const parsed = JSON.parse(readFileSync(stateFile, 'utf-8')) as Record<string, unknown>;
  parsed.runtimeEvidence = Object.freeze({
    completedAt: TEST_TIMESTAMP,
    elapsedWallClockMs,
    lastObservedAt: TEST_TIMESTAMP,
    observationCount,
    requiredDurationMs: 7_200_000,
    runner: 'managed_runtime',
    startedAt: TEST_TIMESTAMP,
  });
  writeFileSync(stateFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf-8');
}

function writeExportEnvFile(path: string): void {
  writeFileSync(
    path,
    [
      'BETTING_WIN_REPO_PATH=/home/dev/app_testing/betting-win',
      'BWS_UPSTREAM_LOCK_PATH=./config/betting-win.upstream.lock.json',
      'BWS_UPSTREAM_MODE=export',
      'BWS_UPSTREAM_EXPORT_SELECTION_PATH=/tmp/operator-selection.json',
      'BWS_API_PORT=4312',
      'SUREBET_RUNTIME_MODE=paper',
      'SUREBET_PROVIDER_CONNECTIONS=disabled',
      'SUREBET_EXECUTION_ENABLED=false',
      'SUREBET_PG_DATABASE=surebet_private',
      'SUREBET_PG_USER=surebet',
      'SUREBET_PG_PORT=5432',
      'SUREBET_PG_HOST=127.0.0.1',
      'SUREBET_PG_PASSWORD=super-secret-password',
    ].join('\n') + '\n',
    'utf-8',
  );
}

function writeApiEnvFile(path: string, apiBaseUrl: string): void {
  writeFileSync(
    path,
    [
      'BETTING_WIN_REPO_PATH=/home/dev/app_testing/betting-win',
      'BWS_UPSTREAM_LOCK_PATH=./config/betting-win.upstream.lock.json',
      'BWS_UPSTREAM_MODE=api',
      'BWS_UPSTREAM_API_CHECKPOINT_ID=api-checkpoint-001',
      `BWS_UPSTREAM_API_BASE_URL=${apiBaseUrl}`,
      'BWS_UPSTREAM_API_CONTRACT_VERSION=1.0.0',
      'BWS_UPSTREAM_API_PAGE_SIZE=25',
      'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE=4',
      'BWS_UPSTREAM_API_RETRY_LIMIT=1',
      'BWS_UPSTREAM_API_RETRY_BACKOFF_MS=10',
      'BWS_UPSTREAM_API_TIMEOUT_MS=1000',
      'BWS_API_PORT=4312',
      'SUREBET_RUNTIME_MODE=paper',
      'SUREBET_PROVIDER_CONNECTIONS=disabled',
      'SUREBET_EXECUTION_ENABLED=false',
      'SUREBET_PG_DATABASE=surebet_private',
      'SUREBET_PG_USER=surebet',
      'SUREBET_PG_PORT=5432',
      'SUREBET_PG_HOST=127.0.0.1',
      'SUREBET_PG_PASSWORD=super-secret-password',
    ].join('\n') + '\n',
    'utf-8',
  );
}

function mkdirTempDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function fileSha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function writePinnedExportFixture(path: string): void {
  const payload = Object.freeze({
    binding: Object.freeze({
      endpointId: 'endpoint-001',
      providerId: 'provider-001',
    }),
    collectionReport: Object.freeze({
      acceptedObservationCount: 1,
    }),
    quoteStore: Object.freeze({
      generationResolutions: Object.freeze([
        Object.freeze({
          providerGenerationId: 'generation-001',
          recordId: 'lineage-001',
        }),
      ]),
      normalizedEvidence: Object.freeze([
        Object.freeze({
          normalizedEvidenceId: 'normalized-evidence-001',
          provider: 'provider-001',
          providerGenerationId: 'generation-001',
          sourceLineageRecordId: 'lineage-001',
        }),
      ]),
      normalizedRejections: Object.freeze([]),
    }),
    rawStore: Object.freeze({
      observations: Object.freeze([
        Object.freeze({
          observationId: 'observation-001',
        }),
      ]),
      sourceLineageEvents: Object.freeze([
        Object.freeze({
          eventId: 'lineage-event-001',
        }),
      ]),
      sourceLineageRecords: Object.freeze([
        Object.freeze({
          provider: 'provider-001',
          recordId: 'lineage-001',
        }),
      ]),
    }),
  });
  const collectionReportSha256 = createHash('sha256')
    .update(stableJsonStringifyForTest(payload.collectionReport))
    .digest('hex');
  const payloadSha256 = createHash('sha256')
    .update(stableJsonStringifyForTest(payload))
    .digest('hex');
  writeFileSync(
    path,
    `${JSON.stringify({
      collectionReportSha256,
      endpointId: 'endpoint-001',
      exportId: 'export-001',
      exportKind: 'pinned_provider_history_bundle',
      exportProfile: 'provider_history_fixture_bundle_v1',
      exportedAt: TEST_TIMESTAMP,
      fixtureId: 'fixture-001',
      liveTransportAllowed: false,
      normalizedEvidenceIds: ['normalized-evidence-001'],
      payload,
      payloadSha256,
      phase: 'F2-005F',
      providerGenerationIds: ['generation-001'],
      providerId: 'provider-001',
      schemaVersion: '1.0.0',
      sourceLineageRecordIds: ['lineage-001'],
      transportMode: 'fixture',
    }, null, 2)}\n`,
    'utf-8',
  );
}

function stableObjectFingerprint(value: unknown): string {
  return createHash('sha256').update(stableJsonStringifyForTest(value)).digest('hex');
}

function stableJsonStringifyForTest(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringifyForTest(entry)).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJsonStringifyForTest((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function createCaptureStream() {
  let buffer = '';
  return Object.freeze({
    read() {
      return buffer;
    },
    stream: {
      write(chunk: string) {
        buffer += chunk;
        return true;
      },
    } as unknown as NodeJS.WriteStream,
  });
}

function removeDirectoryWithRetries(path: string): void {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    rmSync(path, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
    if (!existsSync(path)) {
      return;
    }
    sleepSynchronously(25);
  }
  rmSync(path, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
}

function sleepSynchronously(durationMs: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, durationMs);
}
