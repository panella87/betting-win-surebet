import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  collectBwsDiagnosticsBundle,
  createBwsStructuredLogger,
  registerBwsEvidenceArtifact,
  summarizeBwsEvidenceIndex,
  type BwsServiceRuntimeConfig,
} from '../packages/bootstrap/src/index.js';

const TEST_TIMESTAMP = '2026-07-16T08:30:00.000Z';

test('structured observability logs rotate and redact sensitive fields', () => {
  const repositoryRoot = createRepositoryFixture();
  try {
    const logger = createBwsStructuredLogger({
      logDirectory: 'runtime/test-logs',
      maxBytes: 220,
      maxFiles: 2,
      now: () => TEST_TIMESTAMP,
      processIdentity: Object.freeze({
        nodeVersion: process.version,
        pid: 1234,
        ppid: 1,
        processName: 'bws-test-process',
        repositoryRoot,
        startedAt: TEST_TIMESTAMP,
      }),
      repositoryRoot,
      runtimeId: 'runtime-structured-001',
      selectedUpstreamMode: 'api',
    });

    logger.write({
      details: Object.freeze({
        password: 'secret-password',
        url: 'http://127.0.0.1:4312/path?token=abc',
      }),
      eventCode: 'first_event',
      serviceRole: 'api',
    });
    logger.write({
      details: Object.freeze({
        queueName: 'queue-a',
      }),
      eventCode: 'second_event',
      serviceRole: 'api',
    });
    logger.write({
      details: Object.freeze({
        assetFingerprint: 'f'.repeat(64),
      }),
      eventCode: 'third_event',
      serviceRole: 'cockpit',
    });

    const currentLog = readFileSync(join(repositoryRoot, 'runtime/test-logs/api.jsonl'), 'utf-8');
    const rotatedLog = readFileSync(join(repositoryRoot, 'runtime/test-logs/api.jsonl.1'), 'utf-8');
    assert.match(currentLog, /second_event/);
    assert.match(rotatedLog, /first_event/);
    assert.match(rotatedLog, /"\[redacted\]"/);
    assert.match(rotatedLog, /http:\/\/127\.0\.0\.1:4312/);
    assert.equal(existsSync(join(repositoryRoot, 'runtime/test-logs/api.jsonl.2')), false);
  } finally {
    rmSync(repositoryRoot, { force: true, recursive: true });
  }
});

test('evidence index deduplicates repeated registrations and diagnostics bundles capture recent state', async () => {
  const repositoryRoot = createRepositoryFixture();
  try {
    mkdirSync(join(repositoryRoot, 'runtime/bws-operator-lifecycle'), { recursive: true });
    writeFileSync(
      join(repositoryRoot, 'runtime/bws-operator-lifecycle/state.json'),
      `${JSON.stringify({
        configFingerprint: 'c'.repeat(64),
        configuration: { api: { bindHost: '127.0.0.1', port: 4312 } },
        processes: [{ lifecycleToken: 'runtime-diag-001', pid: 999, procStartTicks: '1000', processName: 'bws-read-only-api', roles: ['api'] }],
        repositoryRoot,
        runtimeId: 'runtime-diag-001',
        runtimeBaseUrl: 'http://127.0.0.1:4312',
        schema: 'bws.operator_lifecycle_state.v2',
        service: 'full_stack',
        sourceFingerprints: { sourceManifestSha256: 'a'.repeat(64) },
        stateRecordedAt: TEST_TIMESTAMP,
      }, null, 2)}\n`,
      'utf-8',
    );

    const logger = createBwsStructuredLogger({
      now: () => TEST_TIMESTAMP,
      processIdentity: Object.freeze({
        nodeVersion: process.version,
        pid: 4321,
        ppid: 1,
        processName: 'bws-test-observability',
        repositoryRoot,
        startedAt: TEST_TIMESTAMP,
      }),
      repositoryRoot,
      runtimeId: 'runtime-diag-001',
      selectedUpstreamMode: 'export',
    });
    logger.write({
      details: Object.freeze({ queueName: 'queue-a' }),
      eventCode: 'diagnostic_event',
      serviceRole: 'private_paper_scheduler',
    });

    const artifactPath = join(repositoryRoot, 'runtime/example-evidence.json');
    writeFileSync(artifactPath, `${JSON.stringify({ ok: true }, null, 2)}\n`, 'utf-8');
    registerBwsEvidenceArtifact({
      artifactPath,
      artifactSchema: 'bws.example_artifact.v1',
      createdAt: TEST_TIMESTAMP,
      repositoryRoot,
      retentionClass: 'runtime',
      runtimeId: 'runtime-diag-001',
      sourceFingerprint: 'a'.repeat(64),
    });
    registerBwsEvidenceArtifact({
      artifactPath,
      artifactSchema: 'bws.example_artifact.v1',
      createdAt: TEST_TIMESTAMP,
      repositoryRoot,
      retentionClass: 'runtime',
      runtimeId: 'runtime-diag-001',
      sourceFingerprint: 'a'.repeat(64),
    });

    const summary = summarizeBwsEvidenceIndex(repositoryRoot);
    assert.equal(summary.entryCount, 1);
    assert.equal(summary.recentEntries[0]?.path, 'runtime/example-evidence.json');

    const diagnostics = await collectBwsDiagnosticsBundle({
      config: createRuntimeConfig(repositoryRoot),
      environment: Object.freeze({
        BETTING_WIN_REPO_PATH: join(repositoryRoot, '..', 'betting-win'),
        BWS_API_PORT: '4312',
        BWS_UPSTREAM_LOCK_PATH: 'config/betting-win.upstream.lock.json',
        BWS_WORKER_ID: 'worker-a',
        BWS_WORKER_LEASE_DURATION_MS: '15000',
        BWS_WORKER_QUEUE_NAME: 'queue-a',
        SUREBET_EXECUTION_ENABLED: 'false',
        SUREBET_PG_DATABASE: 'surebet_local',
        SUREBET_PG_PORT: '5432',
        SUREBET_PG_USER: 'surebet',
        SUREBET_PROVIDER_CONNECTIONS: 'disabled',
        SUREBET_RUNTIME_MODE: 'paper',
      }),
      fetchJson: async <T>(url: string) => {
        if (url.endsWith('/metrics')) {
          return Object.freeze({
            ok: true,
            value: Object.freeze({
              api: Object.freeze({
                requestMetrics: Object.freeze({
                  api: Object.freeze({ errorCount: 0, requestCount: 1, responseBytes: 32, totalDurationMs: 1 }),
                  cockpit: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
                  health: Object.freeze({ errorCount: 0, requestCount: 1, responseBytes: 20, totalDurationMs: 1 }),
                  metrics: Object.freeze({ errorCount: 0, requestCount: 1, responseBytes: 32, totalDurationMs: 1 }),
                  readiness: Object.freeze({ errorCount: 0, requestCount: 1, responseBytes: 20, totalDurationMs: 1 }),
                }),
                runtimeId: 'runtime-diag-001',
                status: 'ready',
              }),
              cockpit: Object.freeze({
                requestMetrics: Object.freeze({ errorCount: 0, requestCount: 0, responseBytes: 0, totalDurationMs: 0 }),
                status: 'ready',
              }),
              database: Object.freeze({
                connectivity: 'available',
                pendingMigrationCount: 0,
                status: 'compatible',
              }),
              evidence: Object.freeze({
                entryCount: 1,
                lastCreatedAt: TEST_TIMESTAMP,
                lastRuntimeId: 'runtime-diag-001',
              }),
              generatedAt: TEST_TIMESTAMP,
              runtime: Object.freeze({
                lifecycleState: 'running',
                runtimeId: 'runtime-diag-001',
              }),
              scheduler: Object.freeze({
                lifecycleState: 'running',
              }),
              schema: 'bws.metrics_snapshot.v1',
              sourceFingerprint: 'a'.repeat(64),
              upstream: Object.freeze({
                lifecycleState: 'running',
                mode: 'export',
              }),
              worker: Object.freeze({
                lifecycleState: 'running',
              }),
            }),
          }) as Readonly<{ readonly ok: true; readonly value: T }>;
        }
        return Object.freeze({
          ok: true,
          value: Object.freeze({ ok: true, generatedAt: TEST_TIMESTAMP }),
        }) as Readonly<{ readonly ok: true; readonly value: T }>;
      },
      migrationStatus: Object.freeze({
        compatibility: Object.freeze({
          reasons: Object.freeze([]),
          status: 'compatible',
        }),
        database: Object.freeze({
          database: 'surebet_local',
          serverVersion: '16.3',
        }),
        drain: Object.freeze({
          reasons: Object.freeze([]),
          required: false,
        }),
        generatedAt: TEST_TIMESTAMP,
        migrationLedger: Object.freeze({
          applied: Object.freeze([]),
          available: Object.freeze([]),
          checksumMismatches: Object.freeze([]),
          pending: Object.freeze([]),
        }),
        ownership: Object.freeze({
          schemaExists: true,
          tableNames: Object.freeze([]),
        }),
        schema: 'bws.database_migration_status.v1',
      }) as never,
      now: () => TEST_TIMESTAMP,
      queueSummary: Object.freeze({
        deadLetteredCount: 0,
        leasedCount: 0,
        outstandingCount: 0,
        pendingCount: 0,
        queueName: 'queue-a',
        retryWaitCount: 0,
        succeededCount: 0,
      }) as never,
      repositoryRoot,
    });

    const manifestPath = join(repositoryRoot, diagnostics.bundleManifestFile);
    assert.equal(existsSync(manifestPath), true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      readonly configurationPresence: Record<string, boolean>;
      readonly evidenceIndex: {
        readonly entryCount: number;
      };
      readonly logs: Record<string, readonly {
        readonly eventCode: string;
      }[]>;
      readonly schema: string;
      readonly sourceFingerprints: {
        readonly sourceManifestSha256: string;
      };
    };
    assert.equal(manifest.schema, 'bws.diagnostics_bundle.v1');
    assert.equal(manifest.configurationPresence.BWS_API_PORT, true);
    assert.equal(manifest.evidenceIndex.entryCount, 1);
    assert.equal(manifest.logs.private_paper_scheduler?.[0]?.eventCode, 'diagnostic_event');
    assert.equal(manifest.sourceFingerprints.sourceManifestSha256.length, 64);
  } finally {
    rmSync(repositoryRoot, { force: true, recursive: true });
  }
});

function createRepositoryFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'bws-observability-'));
  mkdirSync(join(root, 'config'), { recursive: true });
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ name: 'bws-observability-fixture', version: '0.0.0-test' }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(root, 'SOURCE_MANIFEST.json'),
    `${JSON.stringify({ generatedAt: TEST_TIMESTAMP, overlay: 'none' }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(root, 'config/betting-win.upstream.lock.json'),
    `${JSON.stringify({
      commitSha: 'a'.repeat(40),
      contractAlias: 'betting-win-strategy-export.v1',
      contractSchema: 'betting-win.strategy-export.v1',
      gitTreeSha: 'b'.repeat(40),
      capabilities: [],
      packageVersion: '0.48.0',
      packageVersions: {
        'betting-win': '0.48.0',
      },
      repository: 'betting-win',
      repositoryPath: join(root, '..', 'betting-win'),
      schema: 'betting-win-surebet-upstream-lock-v1',
      sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
      sourceView: 'committed_git_head',
      surebetProfile: 'surebet_standard_binary_v0',
      trackedTreeListingSha256: 'c'.repeat(64),
      verifiedAt: TEST_TIMESTAMP,
    }, null, 2)}\n`,
    'utf-8',
  );
  return root;
}

function createRuntimeConfig(repositoryRoot: string): BwsServiceRuntimeConfig {
  return Object.freeze({
    api: Object.freeze({
      bindHost: '127.0.0.1',
      port: 4312,
    }),
    persistence: Object.freeze({
      database: 'surebet_local',
      host: '127.0.0.1',
      port: 5432,
      user: 'surebet',
    }),
    policy: Object.freeze({
      executionEnabled: false,
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    }),
    processDefinitions: Object.freeze([]),
    upstream: Object.freeze({
      lock: Object.freeze({
        commitSha: 'a'.repeat(40),
        contractAlias: 'betting-win-strategy-export.v1',
        contractSchema: 'betting-win.strategy-export.v1',
        gitTreeSha: 'b'.repeat(40),
        capabilities: Object.freeze([]),
        packageVersion: '0.48.0',
        packageVersions: Object.freeze({
          'betting-win': '0.48.0',
        }),
        repository: 'betting-win',
        repositoryPath: join(repositoryRoot, '..', 'betting-win'),
        schema: 'betting-win-surebet-upstream-lock-v1',
        sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
        sourceView: 'committed_git_head',
        surebetProfile: 'surebet_standard_binary_v0',
        trackedTreeListingSha256: 'c'.repeat(64),
        verifiedAt: TEST_TIMESTAMP,
      }),
      lockPath: 'config/betting-win.upstream.lock.json',
      repoPath: join(repositoryRoot, '..', 'betting-win'),
    }),
    worker: Object.freeze({
      leaseDurationMs: 15_000,
      queueName: 'queue-a',
      workerId: 'worker-a',
    }),
  }) as unknown as BwsServiceRuntimeConfig;
}
