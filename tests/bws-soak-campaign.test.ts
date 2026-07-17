import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { setTimeout as sleepFor } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import {
  createBwsSoakCampaign,
  executeBwsSoakCampaign,
  getManagedBwsOperatorStackStatus,
  parseBwsSoakFailureSchedule,
  recordBwsSoakCampaignCheckpoint,
  readBwsSoakCampaignExecutionResult,
  runBwsSoakCampaignRuntime,
  runBwsSoakCampaignCli,
  startManagedBwsOperatorStack,
  stopManagedBwsOperatorStack,
  validateBwsSoakCampaignExecution,
  type BwsLifecycleRequest,
  type BwsOperatorLifecycleManagedProcessDescriptor,
  type BwsServiceRuntimeEnvironment,
  type BwsSoakCampaignManifest,
} from '../packages/bootstrap/src/index.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-16T16:00:00.000Z';
const SEQUENTIAL_TEST_OPTIONS = Object.freeze({ concurrency: false });
const SOAK_FAILURE_MATRIX_TARGETS = Object.freeze([
  'upstream_timeout',
  'api_malformed_response',
  'export_sha_replacement',
  'upstream_contract_profile_mismatch',
  'database_connection_interruption',
  'scheduler_crash_before_enqueue',
  'scheduler_crash_after_enqueue',
  'worker_crash_before_checkpoint',
  'worker_crash_after_checkpoint',
  'lease_expiry_stale_claim_recovery',
  'api_crash_and_restart',
  'cockpit_asset_mismatch',
  'partial_stack_startup',
  'interrupted_shutdown',
  'supervisor_crash',
  'evidence_publication_failure',
  'backup_interruption',
  'upgrade_interruption',
] as const);

test('soak campaign prepare is deterministic for identical inputs and records checkpoints', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    const first = await createBwsSoakCampaign(createCampaignRequest(fixture));
    fixture.resetCampaignFiles();
    const second = await createBwsSoakCampaign(createCampaignRequest(fixture));
    assert.equal(first.manifest.semanticFingerprint, second.manifest.semanticFingerprint);
    assert.equal(first.manifest.campaignId, second.manifest.campaignId);
    assert.equal(first.manifest.resumeGuard.failureScheduleFingerprint, second.manifest.resumeGuard.failureScheduleFingerprint);
    assert.equal(first.state.currentCheckpointSequence, 1);
    assert.equal(first.state.lastCheckpointFile?.includes('campaign_initialized'), true);

    const checkpoint = await recordBwsSoakCampaignCheckpoint({
      classification: 'cycle_observed',
      cycleNumber: 1,
      details: Object.freeze({
        queueDepth: 2,
        selectedFailureInjection: 'inject-upstream-timeout',
      }),
      manifestFile: join(fixture.campaignDirectory, 'manifest.json'),
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      stateFile: join(fixture.campaignDirectory, 'state.json'),
      status: 'completed',
    });

    assert.equal(checkpoint.state.completedCycleCount, 1);
    assert.equal(checkpoint.checkpoint.sequence, 2);
    assert.equal(checkpoint.checkpoint.status, 'completed');
    assert.equal(checkpoint.checkpoint.classification, 'cycle_observed');
  } finally {
    fixture.dispose();
  }
});

test('soak campaign resume preserves the original manifest and records a resume checkpoint', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    const prepared = await createBwsSoakCampaign(createCampaignRequest(fixture));
    const resumed = await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      now: () => '2026-07-16T17:00:00.000Z',
      resume: true,
    });

    assert.equal(resumed.action, 'resumed');
    assert.equal(resumed.manifest.createdAt, prepared.manifest.createdAt);
    assert.equal(resumed.state.currentCheckpointSequence, 2);
    assert.equal(resumed.state.lastCheckpointFile?.includes('campaign_resumed'), true);
  } finally {
    fixture.dispose();
  }
});

test('soak campaign resume rejects mismatched identity inputs', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign(createCampaignRequest(fixture));

    await assert.rejects(
      () =>
        createBwsSoakCampaign({
          ...createCampaignRequest(fixture),
          releaseSemanticFingerprint: 'b'.repeat(64),
          resume: true,
        }),
      /semantic fingerprint changed/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign prepare rejects impossible observation budgets and out-of-range failures', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await assert.rejects(
      () =>
        createBwsSoakCampaign({
          ...createCampaignRequest(fixture),
          intervalMs: 60_000,
          maxCycles: 10,
        }),
      /intervalMs \* maxCycles >= durationMs/i,
    );

    await assert.rejects(
      () =>
        createBwsSoakCampaign({
          ...createCampaignRequest(fixture),
          failureSchedule: Object.freeze([
            Object.freeze({
              expectedRecovery: 'restart_component' as const,
              injectionId: 'inject-upstream-timeout-too-late',
              notes: 'invalid trigger beyond max cycles',
              stage: 'during_cycle' as const,
              target: 'upstream_timeout' as const,
              triggerCycleNumber: 401,
            }),
          ]),
        }),
      /must not exceed maxCycles=400/i,
    );

    await assert.rejects(
      () =>
        createBwsSoakCampaign({
          ...createCampaignRequest(fixture),
          failureSchedule: Object.freeze([
            Object.freeze({
              expectedRecovery: 'resume_campaign' as const,
              injectionId: 'inject-recovery-without-primary',
              stage: 'during_recovery' as const,
              target: 'worker_crash_after_checkpoint' as const,
              triggerCycleNumber: 2,
            }),
          ]),
        }),
      /must include a non-during_recovery injection/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign checkpoints fail closed on repeated or out-of-range cycle progress', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign(createCampaignRequest(fixture));
    await recordBwsSoakCampaignCheckpoint({
      classification: 'cycle_observed',
      cycleNumber: 1,
      manifestFile: fixture.manifestFile,
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      stateFile: fixture.stateFile,
      status: 'completed',
    });

    await assert.rejects(
      () =>
        recordBwsSoakCampaignCheckpoint({
          classification: 'cycle_observed',
          cycleNumber: 1,
          manifestFile: fixture.manifestFile,
          now: () => TEST_TIMESTAMP,
          repositoryRoot: REPO_ROOT,
          stateFile: fixture.stateFile,
          status: 'completed',
        }),
      /must advance beyond the persisted completedCycleCount/i,
    );

    await assert.rejects(
      () =>
        recordBwsSoakCampaignCheckpoint({
          classification: 'cycle_observed',
          cycleNumber: 401,
          manifestFile: fixture.manifestFile,
          now: () => TEST_TIMESTAMP,
          repositoryRoot: REPO_ROOT,
          stateFile: fixture.stateFile,
          status: 'completed',
        }),
      /must not exceed maxCycles=400/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign CLI prints help and prepare writes schema-aligned output', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  const capture = createCaptureStream();
  try {
    const helpExitCode = await runBwsSoakCampaignCli(['--help'], REPO_ROOT, capture.stream);
    assert.equal(helpExitCode, 0);
    assert.match(capture.read(), /BWS-592 foundation tranche/);
    assert.match(capture.read(), /<prepare\|checkpoint\|execute\|run-runtime\|validate>/);

    writeFileSync(
      fixture.failureScheduleFile,
      `${JSON.stringify(sampleFailureSchedule(), null, 2)}\n`,
      'utf-8',
    );
    const exitCode = await runBwsSoakCampaignCli(
      [
        'prepare',
        '--manifest-output',
        fixture.manifestFile,
        '--state-file',
        fixture.stateFile,
        '--checkpoint-dir',
        fixture.checkpointDirectory,
        '--duration-ms',
        '7200000',
        '--interval-ms',
        '30000',
        '--max-cycles',
        '400',
        '--seed',
        'seed-592-foundation',
        '--upstream-mode',
        'export',
        '--release-fingerprint',
        'a'.repeat(64),
        '--database-identity',
        'surebet_test_db_592',
        '--runtime-dir',
        fixture.runtimeDirectory,
        '--evidence-dir',
        fixture.evidenceDirectory,
        '--failure-schedule-file',
        fixture.failureScheduleFile,
      ],
      REPO_ROOT,
      capture.stream,
    );
    assert.equal(exitCode, 0);

    const payload = JSON.parse(capture.readAfterFirstJson()) as {
      manifest: BwsSoakCampaignManifest;
    };
    assert.equal(payload.manifest.schema, 'bws.soak_campaign.v1');
    assert.equal(payload.manifest.observation.durationMs, 7_200_000);
    assert.equal(payload.manifest.closedBoundary.providerConnections, 'disabled');

    const schema = JSON.parse(readFileSync(join(REPO_ROOT, 'schemas', 'bws-soak-campaign.v1.schema.json'), 'utf-8')) as {
      properties: { schema: { const: string } };
      required: readonly string[];
    };
    assert.equal(schema.properties.schema.const, 'bws.soak_campaign.v1');
    assert.ok(schema.required.includes('resumeGuard'));
    assert.ok(schema.required.includes('failureSchedule'));
  } finally {
    fixture.dispose();
  }
});

test('soak campaign CLI execute writes result output and retained schemas stay explicit', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  const capture = createCaptureStream();
  try {
    await createBwsSoakCampaign(createCampaignRequest(fixture));
    const exitCode = await runBwsSoakCampaignCli(
      [
        'execute',
        '--manifest-file',
        fixture.manifestFile,
        '--state-file',
        fixture.stateFile,
        '--result-file',
        fixture.resultFile,
        '--execute-until-cycle-number',
        '4',
      ],
      REPO_ROOT,
      capture.stream,
    );
    assert.equal(exitCode, 0);

    const payload = JSON.parse(capture.readAfterFirstJson()) as {
      schema: string;
      failures: readonly unknown[];
      finalCompletedCycleCount: number;
    };
    assert.equal(payload.schema, 'bws.soak_campaign_result.v1');
    assert.equal(payload.failures.length, 2);
    assert.equal(payload.finalCompletedCycleCount, 4);

    const schemaFiles = [
      'bws-soak-campaign-state.v1.schema.json',
      'bws-soak-campaign-checkpoint.v1.schema.json',
      'bws-soak-campaign-result.v1.schema.json',
      'bws-soak-campaign-validation.v1.schema.json',
    ] as const;
    for (const schemaFile of schemaFiles) {
      const schema = JSON.parse(readFileSync(join(REPO_ROOT, 'schemas', schemaFile), 'utf-8')) as {
        properties: { schema: { const: string } };
      };
      assert.match(schema.properties.schema.const, /^bws\.soak_campaign_/);
    }
  } finally {
    fixture.dispose();
  }
});

test('soak campaign CLI run-runtime fails closed when the caller does not provide an explicit integration module', SEQUENTIAL_TEST_OPTIONS, async () => {
  const capture = createCaptureStream();
  await assert.rejects(
    () => runBwsSoakCampaignCli(['run-runtime'], REPO_ROOT, capture.stream),
    /Missing required --integration-module value/,
  );
});

test('soak campaign CLI run-runtime executes through a repo-local caller integration module', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  const capture = createCaptureStream();
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 2_000,
      failureSchedule: Object.freeze([
        Object.freeze({
          expectedRecovery: 'restart_component' as const,
          injectionId: 'inject-cli-runtime-restart',
          stage: 'after_cycle' as const,
          target: 'worker_crash_after_checkpoint' as const,
          triggerCycleNumber: 1,
        }),
      ]),
      maxCycles: 2,
      intervalMs: 1_000,
    });
    const integrationModuleAbsolute = join(fixture.tempDirectoryAbsolute, 'cli-runtime-integration.mjs');
    writeFileSync(
      integrationModuleAbsolute,
      createCliRuntimeIntegrationModuleSource({
        diagnosticsDirectoryAbsolute: join(fixture.tempDirectoryAbsolute, 'cli-runtime-diagnostics'),
        diagnosticsDirectoryRelative: relative(REPO_ROOT, join(fixture.tempDirectoryAbsolute, 'cli-runtime-diagnostics')),
        diagnosticsManifestRelative: relative(REPO_ROOT, join(fixture.tempDirectoryAbsolute, 'cli-runtime-diagnostics', 'diagnostics.json')),
        expectedManifestFile: fixture.manifestFile,
        expectedResultFile: fixture.resultFile,
        expectedStateFile: fixture.stateFile,
        runtimeStateDirectory: relative(REPO_ROOT, join(fixture.tempDirectoryAbsolute, 'cli-runtime-state')),
        stopEvidenceAbsolute: join(fixture.tempDirectoryAbsolute, 'cli-runtime-diagnostics', 'stop-evidence.json'),
        stopEvidenceRelative: relative(REPO_ROOT, join(fixture.tempDirectoryAbsolute, 'cli-runtime-diagnostics', 'stop-evidence.json')),
      }),
      'utf-8',
    );

    const exitCode = await runBwsSoakCampaignCli(
      [
        'run-runtime',
        '--manifest-file',
        fixture.manifestFile,
        '--state-file',
        fixture.stateFile,
        '--result-file',
        fixture.resultFile,
        '--integration-module',
        relative(REPO_ROOT, integrationModuleAbsolute),
      ],
      REPO_ROOT,
      capture.stream,
    );
    assert.equal(exitCode, 0);

    const payload = JSON.parse(capture.readAfterFirstJson()) as {
      execution: {
        failures: ReadonlyArray<{ details: Record<string, unknown> }>;
        runtimeEvidence?: { runner: string };
      };
      validation: { ok: boolean };
    };
    assert.equal(payload.validation.ok, true);
    assert.equal(payload.execution.runtimeEvidence?.runner, 'managed_runtime');
    assert.equal(payload.execution.failures[0]?.details['recoveryMode'], 'cli_integration_module');

    const persisted = readBwsSoakCampaignExecutionResult(join(REPO_ROOT, fixture.resultFile));
    assert.notEqual(persisted.runtimeEvidence?.completedAt, undefined);
    assert.equal(persisted.failures[0]?.details['recoveryMode'], 'cli_integration_module');
  } finally {
    fixture.dispose();
  }
});

test('repo-owned soak runtime integration derives lifecycle state from the prepared manifest and exposes explicit hooks', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign(createCampaignRequest(fixture));
    const integrationModule = await import(
      pathToFileURL(join(REPO_ROOT, 'dist', 'packages', 'bootstrap', 'src', 'operations', 'bws-soak-runtime-integration.js')).href,
    ) as {
      createSoakRuntimeIntegration: (context: Readonly<{
        readonly manifestFile: string;
        readonly repositoryRoot: string;
        readonly resultFile: string;
        readonly stateFile: string;
      }>) => Promise<{
        readonly dependencies: Readonly<Record<string, unknown>>;
        readonly lifecycleRequest: BwsLifecycleRequest;
      }>;
    };
    const integration = await integrationModule.createSoakRuntimeIntegration(
      Object.freeze({
        manifestFile: fixture.manifestFile,
        repositoryRoot: REPO_ROOT,
        resultFile: fixture.resultFile,
        stateFile: fixture.stateFile,
      }),
    );

    assert.equal(integration.lifecycleRequest.repositoryRoot, REPO_ROOT);
    assert.equal(integration.lifecycleRequest.runtimeStateDirectory, fixture.runtimeDirectory);
    assert.equal(typeof integration.dependencies['executeFailure'], 'function');
    assert.equal(typeof integration.dependencies['verifyDatabaseCleanup'], 'function');
  } finally {
    fixture.dispose();
  }
});

test('soak campaign execution retains deterministic failure, cleanup, and validation evidence', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  const executedFailures: string[] = [];
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 120_000,
      maxCycles: 4,
    });
    const result = await executeBwsSoakCampaign({
      executeUntilCycleNumber: 4,
      manifestFile: fixture.manifestFile,
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
      stateFile: fixture.stateFile,
      dependencies: Object.freeze({
        async executeFailure({ failure, cycleNumber }) {
          executedFailures.push(failure.injectionId);
          return Object.freeze({
            details: Object.freeze({
              recoveryOwner: `cycle-${String(cycleNumber)}`,
            }),
            recovered: true,
          });
        },
        async observeCycle({ cycleNumber }) {
          return Object.freeze({
            apiReady: true,
            cockpitReady: true,
            queueDepth: cycleNumber,
            workerCheckpointId: `worker-${String(cycleNumber)}`,
          });
        },
        async verifyCleanup({ executedCycles, failures }) {
          return Object.freeze({
            executedCycleCount: executedCycles.length,
            failureCount: failures.length,
            leakedDatabases: 0,
            leakedProcesses: 0,
          });
        },
      }),
    });

    assert.deepEqual(result.executedCycles, [1, 2, 3, 4]);
    assert.equal(result.failures.length, 2);
    assert.equal(result.finalCompletedCycleCount, 4);
    assert.equal(result.cleanup.verified, true);
    assert.deepEqual(executedFailures, [
      'inject-upstream-timeout',
      'inject-worker-crash-after-checkpoint',
    ]);

    const persisted = readBwsSoakCampaignExecutionResult(join(REPO_ROOT, fixture.resultFile));
    assert.equal(persisted.schema, 'bws.soak_campaign_result.v1');
    assert.equal(persisted.artifactInventory.length >= 3, true);

    const validation = validateBwsSoakCampaignExecution({
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
    });
    assert.equal(validation.ok, true);
    assert.equal(validation.executedCycleCount, 4);
    assert.equal(validation.failuresVerified, 2);
    assert.equal(validation.checkpointCount >= 9, true);

    const capture = createCaptureStream();
    const exitCode = await runBwsSoakCampaignCli(
      ['validate', '--result-file', fixture.resultFile],
      REPO_ROOT,
      capture.stream,
    );
    assert.equal(exitCode, 0);
    assert.match(capture.read(), /bws\.soak_campaign_validation\.v1/);
  } finally {
    fixture.dispose();
  }
});

test('soak campaign default execution retains explicit failure-matrix ownership and recovery evidence for every target', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    const failureSchedule = SOAK_FAILURE_MATRIX_TARGETS.map((target, index) =>
      Object.freeze({
        expectedRecovery: index % 2 === 0 ? 'restart_component' as const : 'resume_campaign' as const,
        injectionId: `matrix-${String(index + 1).padStart(2, '0')}-${target}`,
        stage: index % 3 === 0 ? 'before_cycle' as const : index % 3 === 1 ? 'during_cycle' as const : 'after_cycle' as const,
        target,
        triggerCycleNumber: index + 1,
      }),
    );
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: SOAK_FAILURE_MATRIX_TARGETS.length,
      failureSchedule: Object.freeze(failureSchedule),
      maxCycles: SOAK_FAILURE_MATRIX_TARGETS.length,
      intervalMs: 1,
    });

    const result = await executeBwsSoakCampaign({
      executeUntilCycleNumber: SOAK_FAILURE_MATRIX_TARGETS.length,
      manifestFile: fixture.manifestFile,
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
      stateFile: fixture.stateFile,
    });

    assert.equal(result.failures.length, SOAK_FAILURE_MATRIX_TARGETS.length);
    for (const failure of result.failures) {
      assert.equal(failure.descriptor.ownershipBoundary, 'campaign_owned_only');
      assert.match(failure.descriptor.expectedEffect, /_/);
      assert.equal(failure.details['component'], failure.descriptor.component);
      assert.equal(failure.details['cleanupScope'], failure.descriptor.cleanupScope);
      assert.equal(failure.details['ownershipBoundary'], failure.descriptor.ownershipBoundary);
      assert.equal(failure.details['recoveryEvidence'], failure.descriptor.recoveryEvidence);
    }

    const validation = validateBwsSoakCampaignExecution({
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
    });
    assert.equal(validation.ok, true);
    assert.equal(validation.failuresVerified, SOAK_FAILURE_MATRIX_TARGETS.length);

    const persisted = readBwsSoakCampaignExecutionResult(join(REPO_ROOT, fixture.resultFile));
    assert.deepEqual(
      persisted.failures.map((entry) => entry.target).sort(),
      [...SOAK_FAILURE_MATRIX_TARGETS].sort(),
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign execution runs during_recovery injections after the primary failure stage', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  const executedFailures: string[] = [];
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 120_000,
      failureSchedule: Object.freeze([
        Object.freeze({
          expectedRecovery: 'restart_component' as const,
          injectionId: 'inject-primary-before-cycle',
          stage: 'before_cycle' as const,
          target: 'upstream_timeout' as const,
          triggerCycleNumber: 2,
        }),
        Object.freeze({
          expectedRecovery: 'resume_campaign' as const,
          injectionId: 'inject-during-recovery',
          stage: 'during_recovery' as const,
          target: 'worker_crash_after_checkpoint' as const,
          triggerCycleNumber: 2,
        }),
      ]),
      maxCycles: 4,
    });

    const result = await executeBwsSoakCampaign({
      executeUntilCycleNumber: 4,
      manifestFile: fixture.manifestFile,
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
      stateFile: fixture.stateFile,
      dependencies: Object.freeze({
        async executeFailure({ failure }) {
          executedFailures.push(failure.injectionId);
          return Object.freeze({
            details: Object.freeze({
              recoveryOwner: failure.injectionId,
            }),
            recovered: true,
          });
        },
        async observeCycle({ cycleNumber }) {
          return Object.freeze({
            queueDepth: cycleNumber,
          });
        },
        async verifyCleanup() {
          return Object.freeze({
            leakedDatabases: 0,
            leakedProcesses: 0,
          });
        },
      }),
    });

    assert.equal(result.failures.length, 2);
    assert.deepEqual(executedFailures, [
      'inject-primary-before-cycle',
      'inject-during-recovery',
    ]);
    assert.equal(
      validateBwsSoakCampaignExecution({
        repositoryRoot: REPO_ROOT,
        resultFile: fixture.resultFile,
      }).ok,
      true,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign execution fails closed when a scheduled failure does not recover', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign(createCampaignRequest(fixture));
    await assert.rejects(
      () =>
        executeBwsSoakCampaign({
          executeUntilCycleNumber: 2,
          manifestFile: fixture.manifestFile,
          now: () => TEST_TIMESTAMP,
          repositoryRoot: REPO_ROOT,
          resultFile: fixture.resultFile,
          stateFile: fixture.stateFile,
          dependencies: Object.freeze({
            async executeFailure() {
              return Object.freeze({
                details: Object.freeze({
                  recoveryOwner: 'cycle-2',
                }),
                recovered: false,
              });
            },
            async observeCycle({ cycleNumber }) {
              return Object.freeze({
                queueDepth: cycleNumber,
              });
            },
          }),
        }),
      /did not recover cleanly/i,
    );

    const state = JSON.parse(readFileSync(join(REPO_ROOT, fixture.stateFile), 'utf-8')) as {
      currentCheckpointSequence: number;
      lastCheckpointFile?: string;
    };
    assert.equal(state.currentCheckpointSequence >= 3, true);
    assert.ok(state.lastCheckpointFile !== undefined);
    const lastCheckpoint = JSON.parse(readFileSync(join(REPO_ROOT, state.lastCheckpointFile ?? ''), 'utf-8')) as {
      classification: string;
      status: string;
    };
    assert.equal(lastCheckpoint.classification, 'recovery_verified');
    assert.equal(lastCheckpoint.status, 'failed');
  } finally {
    fixture.dispose();
  }
});

test('soak campaign validation fails closed when the executed cycles do not satisfy the duration budget', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign(createCampaignRequest(fixture));
    await executeBwsSoakCampaign({
      executeUntilCycleNumber: 4,
      manifestFile: fixture.manifestFile,
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
      stateFile: fixture.stateFile,
    });

    assert.throws(
      () =>
        validateBwsSoakCampaignExecution({
          repositoryRoot: REPO_ROOT,
          resultFile: fixture.resultFile,
        }),
      /duration budget/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign execution fails closed when cleanup verification reports leaked ownership', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 120_000,
      maxCycles: 4,
    });

    await assert.rejects(
      () =>
        executeBwsSoakCampaign({
          executeUntilCycleNumber: 4,
          manifestFile: fixture.manifestFile,
          now: () => TEST_TIMESTAMP,
          repositoryRoot: REPO_ROOT,
          resultFile: fixture.resultFile,
          stateFile: fixture.stateFile,
          dependencies: Object.freeze({
            async verifyCleanup() {
              return Object.freeze({
                leakedDatabases: 0,
                leakedProcesses: 1,
              });
            },
          }),
        }),
      /leakedProcesses=0/i,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign runtime runner starts an owned stack, records diagnostics-backed observations, recovers a bounded child crash, and cleans up owned processes', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  const lifecycleFixture = await createRuntimeLifecycleFixture(fixture.tempDirectoryAbsolute);
  let runtimeClockMs = 0;
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 2_000,
      failureSchedule: Object.freeze([
        Object.freeze({
          expectedRecovery: 'restart_component' as const,
          injectionId: 'inject-owned-worker-restart',
          stage: 'after_cycle' as const,
          target: 'worker_crash_after_checkpoint' as const,
          triggerCycleNumber: 1,
        }),
      ]),
      maxCycles: 2,
      intervalMs: 1_000,
    });

    let diagnosticsSequence = 0;
    const result = await runBwsSoakCampaignRuntime({
      lifecycleRequest: lifecycleFixture.request,
      manifestFile: fixture.manifestFile,
      measureNowMs: () => runtimeClockMs,
      now: () => TEST_TIMESTAMP,
      repositoryRoot: REPO_ROOT,
      resultFile: fixture.resultFile,
      sleep: async (durationMs) => {
        runtimeClockMs += durationMs;
      },
      stateFile: fixture.stateFile,
      dependencies: Object.freeze({
        async collectDiagnostics() {
          diagnosticsSequence += 1;
          const lifecycleStatus = await getManagedBwsOperatorStackStatus(lifecycleFixture.request);
          const diagnosticsFile = join(
            lifecycleFixture.diagnosticsDirectoryAbsolute,
            `diagnostics-${String(diagnosticsSequence).padStart(4, '0')}.json`,
          );
          writeFileSync(
            diagnosticsFile,
            `${JSON.stringify(createDiagnosticsBundleManifest(lifecycleStatus, diagnosticsSequence), null, 2)}\n`,
            'utf-8',
          );
          return Object.freeze({
            bundleDirectory: relative(REPO_ROOT, lifecycleFixture.diagnosticsDirectoryAbsolute),
            bundleManifestFile: relative(REPO_ROOT, diagnosticsFile),
            generatedAt: TEST_TIMESTAMP,
            manifestSha256: 'f'.repeat(64),
            schema: 'bws.diagnostics_bundle.v1' as const,
          });
        },
        async executeFailure({ failure }) {
          assert.equal(failure.injectionId, 'inject-owned-worker-restart');
          const statusBeforeCrash = await getManagedBwsOperatorStackStatus(lifecycleFixture.request);
          const workerProcess = statusBeforeCrash.processes.find((entry) => entry.kind === 'private_paper_worker');
          assert.notEqual(workerProcess, undefined);
          process.kill(workerProcess!.pid, 'SIGTERM');
          await waitForExit(workerProcess!.pid);
          const restarted = await startManagedBwsOperatorStack(lifecycleFixture.request);
          assert.equal(restarted.outcome, 'stale_state_cleaned');
          return Object.freeze({
            details: Object.freeze({
              recoveredLifecycleOutcome: restarted.outcome,
              recoveryMode: 'restarted_owned_stack',
            }),
            recovered: true,
          });
        },
        summarizeEvidenceIndex() {
          return Object.freeze({
            entryCount: diagnosticsSequence,
            lastCreatedAt: TEST_TIMESTAMP,
            lastRuntimeId: `runtime-${String(diagnosticsSequence).padStart(4, '0')}`,
            recentEntries: Object.freeze([]),
            schema: 'bws.evidence_index_summary.v1' as const,
          });
        },
        async verifyDatabaseCleanup() {
          return Object.freeze({
            leakedDatabases: 0,
          });
        },
      }),
    });

    assert.equal(result.stackOwnership, 'started');
    assert.equal(result.lifecycleStart.outcome, 'started');
    assert.equal(result.lifecycleStop.outcome, 'stopped');
    assert.equal(result.validation.ok, true);
    assert.equal(result.execution.cleanup.details['leakedProcesses'], 0);
    assert.equal(result.execution.failures.length, 1);
    assert.equal(result.execution.failures[0]!.details['recoveryMode'], 'restarted_owned_stack');
    assert.equal(result.execution.runtimeEvidence?.elapsedWallClockMs, 2_000);
    assert.equal(result.execution.runtimeEvidence?.requiredDurationMs, 2_000);
    assert.equal(result.execution.runtimeEvidence?.observationCount, 2);
    assert.equal(result.execution.runtimeEvidence?.completedAt, TEST_TIMESTAMP);

    const persisted = readBwsSoakCampaignExecutionResult(join(REPO_ROOT, fixture.resultFile));
    assert.equal(persisted.runtimeEvidence?.elapsedWallClockMs, 2_000);
    assert.equal(persisted.runtimeEvidence?.runner, 'managed_runtime');
    const observedCheckpoint = persisted.checkpointFiles
      .map((path) => JSON.parse(readFileSync(join(REPO_ROOT, path), 'utf-8')) as { classification: string; details: Record<string, unknown> })
      .find((entry) => entry.classification === 'cycle_observed');
    assert.notEqual(observedCheckpoint, undefined);
    assert.match(String(observedCheckpoint!.details['diagnosticsManifestFile']), /diagnostics-0001\.json/);
  } finally {
    await lifecycleFixture.dispose();
    fixture.dispose();
  }
});

test('soak campaign runtime runner rejects synthetic runtime failure defaults', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 1_000,
      failureSchedule: Object.freeze([
        Object.freeze({
          expectedRecovery: 'restart_component' as const,
          injectionId: 'reject-synthetic-runtime-failure-defaults',
          stage: 'after_cycle' as const,
          target: 'worker_crash_after_checkpoint' as const,
          triggerCycleNumber: 1,
        }),
      ]),
      maxCycles: 1,
      intervalMs: 1_000,
    });

    await assert.rejects(
      () =>
        runBwsSoakCampaignRuntime({
          manifestFile: fixture.manifestFile,
          now: () => TEST_TIMESTAMP,
          repositoryRoot: REPO_ROOT,
          resultFile: fixture.resultFile,
          sleep: async () => undefined,
          stateFile: fixture.stateFile,
          dependencies: Object.freeze({
            async verifyDatabaseCleanup() {
              return Object.freeze({
                leakedDatabases: 0,
              });
            },
          }),
        }),
      /requires an explicit executeFailure dependency/,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak campaign runtime runner rejects synthetic database cleanup defaults', SEQUENTIAL_TEST_OPTIONS, async () => {
  const fixture = createFixture();
  try {
    await createBwsSoakCampaign({
      ...createCampaignRequest(fixture),
      durationMs: 1_000,
      failureSchedule: Object.freeze([
        Object.freeze({
          expectedRecovery: 'restart_component' as const,
          injectionId: 'reject-synthetic-runtime-cleanup-defaults',
          stage: 'after_cycle' as const,
          target: 'worker_crash_after_checkpoint' as const,
          triggerCycleNumber: 1,
        }),
      ]),
      maxCycles: 1,
      intervalMs: 1_000,
    });

    await assert.rejects(
      () =>
        runBwsSoakCampaignRuntime({
          manifestFile: fixture.manifestFile,
          now: () => TEST_TIMESTAMP,
          repositoryRoot: REPO_ROOT,
          resultFile: fixture.resultFile,
          sleep: async () => undefined,
          stateFile: fixture.stateFile,
          dependencies: Object.freeze({
            async executeFailure() {
              return Object.freeze({
                details: Object.freeze({
                  recoveryMode: 'restarted_owned_stack',
                }),
                recovered: true,
              });
            },
          }),
        }),
      /requires explicit verifyDatabaseCleanup proof/,
    );
  } finally {
    fixture.dispose();
  }
});

test('soak failure schedule parser fails closed on duplicate injection ids', SEQUENTIAL_TEST_OPTIONS, () => {
  const duplicated = JSON.stringify([
    sampleFailureSchedule()[0],
    sampleFailureSchedule()[0],
  ]);
  assert.throws(
    () => parseBwsSoakFailureSchedule(duplicated),
    /duplicate injectionId/i,
  );
});

function createCampaignRequest(fixture: ReturnType<typeof createFixture>) {
  return Object.freeze({
    checkpointDirectory: fixture.checkpointDirectory,
    databaseIdentity: 'surebet_test_db_592',
    durationMs: 7_200_000,
    evidenceDirectory: fixture.evidenceDirectory,
    failureSchedule: sampleFailureSchedule(),
    manifestOutputFile: fixture.manifestFile,
    maxCycles: 400,
    now: () => TEST_TIMESTAMP,
    releaseSemanticFingerprint: 'a'.repeat(64),
    repositoryRoot: REPO_ROOT,
    resume: false,
    runtimeDirectory: fixture.runtimeDirectory,
    seed: 'seed-592-foundation',
    selectedUpstreamMode: 'export' as const,
    stateFile: fixture.stateFile,
    intervalMs: 30_000,
  });
}

function sampleFailureSchedule() {
  return Object.freeze([
    Object.freeze({
      expectedRecovery: 'restart_component' as const,
      injectionId: 'inject-upstream-timeout',
      notes: 'bounded failure for deterministic resume proof',
      stage: 'during_cycle' as const,
      target: 'upstream_timeout' as const,
      triggerCycleNumber: 2,
    }),
    Object.freeze({
      expectedRecovery: 'resume_campaign' as const,
      injectionId: 'inject-worker-crash-after-checkpoint',
      stage: 'after_cycle' as const,
      target: 'worker_crash_after_checkpoint' as const,
      triggerCycleNumber: 4,
    }),
  ]);
}

function createFixture() {
  resetSharedObservabilityDirectory();
  const tempDirectory = mkdtempSync(join(REPO_ROOT, 'artifacts', 'bws-soak-campaign-'));
  const campaignDirectoryAbsolute = join(tempDirectory, 'campaign');
  const checkpointDirectoryAbsolute = join(campaignDirectoryAbsolute, 'checkpoints');
  const evidenceDirectoryAbsolute = join(tempDirectory, 'evidence');
  const runtimeDirectoryAbsolute = join(tempDirectory, 'runtime');
  const manifestFileAbsolute = join(campaignDirectoryAbsolute, 'manifest.json');
  const resultFileAbsolute = join(campaignDirectoryAbsolute, 'result.json');
  const stateFileAbsolute = join(campaignDirectoryAbsolute, 'state.json');
  const failureScheduleFileAbsolute = join(tempDirectory, 'failure-schedule.json');
  return Object.freeze({
    campaignDirectory: relative(REPO_ROOT, campaignDirectoryAbsolute),
    checkpointDirectory: relative(REPO_ROOT, checkpointDirectoryAbsolute),
    dispose() {
      removeDirectoryWithRetries(tempDirectory);
      removeDirectoryWithRetries(join(REPO_ROOT, 'runtime', 'bws-observability'));
    },
    evidenceDirectory: relative(REPO_ROOT, evidenceDirectoryAbsolute),
    failureScheduleFile: relative(REPO_ROOT, failureScheduleFileAbsolute),
    manifestFile: relative(REPO_ROOT, manifestFileAbsolute),
    resultFile: relative(REPO_ROOT, resultFileAbsolute),
    resetCampaignFiles() {
      removeDirectoryWithRetries(campaignDirectoryAbsolute);
      removeDirectoryWithRetries(evidenceDirectoryAbsolute);
      removeDirectoryWithRetries(runtimeDirectoryAbsolute);
    },
    runtimeDirectory: relative(REPO_ROOT, runtimeDirectoryAbsolute),
    stateFile: relative(REPO_ROOT, stateFileAbsolute),
    tempDirectoryAbsolute: tempDirectory,
  });
}

function resetSharedObservabilityDirectory(): void {
  removeDirectoryWithRetries(join(REPO_ROOT, 'runtime', 'bws-observability'));
}

function createCaptureStream() {
  let buffer = '';
  return Object.freeze({
    read() {
      return buffer;
    },
    readAfterFirstJson() {
      const marker = buffer.indexOf('{');
      return marker === -1 ? '' : buffer.slice(marker);
    },
    stream: {
      write(chunk: string) {
        buffer += chunk;
        return true;
      },
    } as unknown as NodeJS.WriteStream,
  });
}

function createCliRuntimeIntegrationModuleSource(input: Readonly<{
  readonly diagnosticsDirectoryAbsolute: string;
  readonly diagnosticsDirectoryRelative: string;
  readonly diagnosticsManifestRelative: string;
  readonly expectedManifestFile: string;
  readonly expectedResultFile: string;
  readonly expectedStateFile: string;
  readonly runtimeStateDirectory: string;
  readonly stopEvidenceAbsolute: string;
  readonly stopEvidenceRelative: string;
}>): string {
  const diagnosticsPayload = `${JSON.stringify({
    generatedAt: TEST_TIMESTAMP,
    health: { status: 'healthy' },
    metrics: {
      api: { status: 'ready' },
      cockpit: { status: 'ready' },
      runtime: { lifecycleState: 'running', runtimeId: 'cli-runtime' },
      scheduler: { lifecycleState: 'running', runtimeId: 'cli-runtime' },
      upstream: { lifecycleState: 'running', runtimeId: 'cli-runtime' },
      worker: { lifecycleState: 'running', runtimeId: 'cli-runtime' },
    },
    queueSummary: {
      deadLetteredCount: 0,
      leasedCount: 0,
      pendingCount: 0,
      queueName: 'private-paper',
      retryWaitCount: 0,
      succeededCount: 1,
    },
    readiness: { status: 'ready' },
    schema: 'bws.diagnostics_bundle.v1',
  }, null, 2)}\n`;
  const stopEvidencePayload = `${JSON.stringify({ stoppedAt: TEST_TIMESTAMP }, null, 2)}\n`;
  return [
    "import { mkdirSync, writeFileSync } from 'node:fs';",
    `const TEST_TIMESTAMP = ${JSON.stringify(TEST_TIMESTAMP)};`,
    `const diagnosticsDirectoryAbsolute = ${JSON.stringify(input.diagnosticsDirectoryAbsolute)};`,
    `const diagnosticsDirectoryRelative = ${JSON.stringify(input.diagnosticsDirectoryRelative)};`,
    `const diagnosticsManifestRelative = ${JSON.stringify(input.diagnosticsManifestRelative)};`,
    `const expectedManifestFile = ${JSON.stringify(input.expectedManifestFile)};`,
    `const expectedResultFile = ${JSON.stringify(input.expectedResultFile)};`,
    `const expectedStateFile = ${JSON.stringify(input.expectedStateFile)};`,
    `const runtimeStateDirectory = ${JSON.stringify(input.runtimeStateDirectory)};`,
    `const stopEvidenceAbsolute = ${JSON.stringify(input.stopEvidenceAbsolute)};`,
    `const stopEvidenceRelative = ${JSON.stringify(input.stopEvidenceRelative)};`,
    `const diagnosticsPayload = ${JSON.stringify(diagnosticsPayload)};`,
    `const stopEvidencePayload = ${JSON.stringify(stopEvidencePayload)};`,
    "let running = false;",
    "let observationCount = 0;",
    "let lifecycleSequence = 0;",
    "function createLifecycleResult(command, outcome) {",
    "  lifecycleSequence += 1;",
    "  return Object.freeze({",
    "    command,",
    "    configuration: Object.freeze({}),",
    "    evidenceFile: stopEvidenceRelative,",
    "    generatedAt: TEST_TIMESTAMP,",
    "    health: Object.freeze({ ok: true, statusCode: 200, url: 'http://127.0.0.1:4312/health', body: Object.freeze({ status: 'healthy' }) }),",
    "    outcome,",
    "    process: Object.freeze({ ownership: 'missing' }),",
    "    processes: Object.freeze([]),",
    "    readiness: Object.freeze({ ok: true, statusCode: 200, url: 'http://127.0.0.1:4312/readiness', body: Object.freeze({ status: 'ready' }) }),",
    "    runtimeId: `cli-runtime-${String(lifecycleSequence).padStart(4, '0')}`,",
    "    service: 'full_stack',",
    "    sourceFingerprints: Object.freeze({",
    "      packageVersion: '0.1.0-bws-full-platform',",
    "      sourceManifestGeneratedAt: TEST_TIMESTAMP,",
    "      sourceManifestOverlay: 'test',",
    "      sourceManifestSha256: 'a'.repeat(64),",
    "      upstreamCommitSha: 'b'.repeat(40),",
    "      upstreamGitTreeSha: 'c'.repeat(40),",
    "      upstreamTrackedTreeListingSha256: 'd'.repeat(64),",
    "    }),",
    "    stack: Object.freeze({",
    "      blockers: Object.freeze([]),",
    "      components: Object.freeze({",
    "        api: running ? 'ready' : 'missing',",
    "        cockpit: running ? 'ready' : 'missing',",
    "        private_paper_scheduler: running ? 'ready' : 'missing',",
    "        private_paper_worker: running ? 'ready' : 'missing',",
    "        upstream_convergence: running ? 'ready' : 'missing',",
    "      }),",
    "      healthStatus: running ? 'healthy' : 'blocked',",
    "      readinessStatus: running ? 'ready' : 'blocked',",
    "      roles: Object.freeze([]),",
    "      shutdownOrder: Object.freeze(['api', 'cockpit', 'private_paper_worker', 'private_paper_scheduler', 'upstream_convergence']),",
    "    }),",
    "    stateFile: `${runtimeStateDirectory}/state.json`,",
    "  });",
    "}",
    "export async function createSoakRuntimeIntegration(context) {",
    "  if (context === null || typeof context !== 'object') {",
    "    throw new Error('expected soak runtime integration context object');",
    "  }",
    "  if (context.manifestFile !== expectedManifestFile) {",
    "    throw new Error(`expected manifestFile=${expectedManifestFile}`);",
    "  }",
    "  if (context.resultFile !== expectedResultFile) {",
    "    throw new Error(`expected resultFile=${expectedResultFile}`);",
    "  }",
    "  if (context.stateFile !== expectedStateFile) {",
    "    throw new Error(`expected stateFile=${expectedStateFile}`);",
    "  }",
    "  return Object.freeze({",
    "    lifecycleRequest: Object.freeze({ runtimeStateDirectory }),",
    "    dependencies: Object.freeze({",
    "      async collectDiagnostics() {",
    "        observationCount += 1;",
    "        mkdirSync(diagnosticsDirectoryAbsolute, { recursive: true });",
    "        writeFileSync(`${diagnosticsDirectoryAbsolute}/diagnostics.json`, diagnosticsPayload, 'utf-8');",
    "        return Object.freeze({",
    "          bundleDirectory: diagnosticsDirectoryRelative,",
    "          bundleManifestFile: diagnosticsManifestRelative,",
    "          generatedAt: TEST_TIMESTAMP,",
    "          manifestSha256: 'f'.repeat(64),",
    "          schema: 'bws.diagnostics_bundle.v1',",
    "        });",
    "      },",
    "      async executeFailure() {",
    "        return Object.freeze({",
    "          details: Object.freeze({ recoveryMode: 'cli_integration_module' }),",
    "          recovered: true,",
    "        });",
    "      },",
    "      async getLifecycleStatus() {",
    "        return createLifecycleResult('status', running ? 'running' : 'not_running');",
    "      },",
    "      async startLifecycle() {",
    "        running = true;",
    "        return createLifecycleResult('start', 'started');",
    "      },",
    "      async stopLifecycle() {",
    "        running = false;",
    "        mkdirSync(diagnosticsDirectoryAbsolute, { recursive: true });",
    "        writeFileSync(stopEvidenceAbsolute, stopEvidencePayload, 'utf-8');",
    "        return createLifecycleResult('stop', 'stopped');",
    "      },",
    "      summarizeEvidenceIndex() {",
    "        return Object.freeze({",
    "          entryCount: observationCount,",
    "          lastCreatedAt: TEST_TIMESTAMP,",
    "          lastRuntimeId: 'cli-runtime',",
    "          recentEntries: Object.freeze([]),",
    "          schema: 'bws.evidence_index_summary.v1',",
    "        });",
    "      },",
    "      async verifyDatabaseCleanup() {",
    "        return Object.freeze({ leakedDatabases: 0 });",
    "      },",
    "    }),",
    "  });",
    "}",
  ].join('\n');
}

async function createRuntimeLifecycleFixture(baseDirectoryAbsolute: string): Promise<{
  readonly diagnosticsDirectoryAbsolute: string;
  readonly dispose: () => Promise<void>;
  readonly request: BwsLifecycleRequest;
}> {
  const diagnosticsDirectoryAbsolute = join(baseDirectoryAbsolute, 'runtime-diagnostics');
  const runtimeStateDirectoryAbsolute = join(baseDirectoryAbsolute, 'runtime-lifecycle-state');
  const apiStubPath = join(baseDirectoryAbsolute, 'runtime-api-stub.mjs');
  const convergenceStubPath = join(baseDirectoryAbsolute, 'runtime-upstream-stub.mjs');
  const schedulerStubPath = join(baseDirectoryAbsolute, 'runtime-scheduler-stub.mjs');
  const workerStubPath = join(baseDirectoryAbsolute, 'runtime-worker-stub.mjs');
  const port = await reserveLoopbackPort();
  mkdirSync(diagnosticsDirectoryAbsolute, { recursive: true });

  writeFileSync(apiStubPath, createRuntimeApiStubSource(port), 'utf-8');
  writeFileSync(convergenceStubPath, createRuntimeIdleStubSource(), 'utf-8');
  writeFileSync(schedulerStubPath, createRuntimeIdleStubSource(), 'utf-8');
  writeFileSync(workerStubPath, createRuntimeIdleStubSource(), 'utf-8');

  const environment: BwsServiceRuntimeEnvironment = Object.freeze({
    BETTING_WIN_REPO_PATH: readUpstreamRepositoryPath(),
    BWS_API_PORT: String(port),
    BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS: '1000',
    BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS: '1000',
    BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH: '1',
    BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS: '1000',
    BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS: '100',
    BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS: '1000',
    BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS: '1000',
    BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS: '1',
    BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS: '1000',
    BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS: '100',
    BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS: '1000',
    BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS: '1000',
    BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS: '1000',
    BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS: '100',
    BWS_UPSTREAM_LOCK_PATH: 'config/betting-win.upstream.lock.json',
    BWS_UPSTREAM_MODE: 'export',
    BWS_WORKER_ID: 'worker-test-001',
    BWS_WORKER_LEASE_DURATION_MS: '1000',
    BWS_WORKER_QUEUE_NAME: 'private-paper',
    SUREBET_EXECUTION_ENABLED: 'false',
    SUREBET_PG_DATABASE: 'surebet_test',
    SUREBET_PG_HOST: '127.0.0.1',
    SUREBET_PG_PORT: '5432',
    SUREBET_PG_USER: 'surebet',
    SUREBET_PROVIDER_CONNECTIONS: 'disabled',
    SUREBET_RUNTIME_MODE: 'paper',
  });
  const managedProcessDescriptors = Object.freeze([
    Object.freeze({
      commandArguments: Object.freeze(['run']),
      entryPointPath: convergenceStubPath,
      kind: 'upstream_convergence' as const,
      processName: 'bws-upstream-convergence-service',
      roles: Object.freeze(['upstream_convergence'] as const),
    }),
    Object.freeze({
      commandArguments: Object.freeze(['run']),
      entryPointPath: schedulerStubPath,
      kind: 'private_paper_scheduler' as const,
      processName: 'bws-private-paper-scheduler-service',
      roles: Object.freeze(['private_paper_scheduler'] as const),
    }),
    Object.freeze({
      commandArguments: Object.freeze(['run']),
      entryPointPath: workerStubPath,
      kind: 'private_paper_worker' as const,
      processName: 'bws-private-paper-worker-service',
      roles: Object.freeze(['private_paper_worker'] as const),
    }),
    Object.freeze({
      entryPointPath: apiStubPath,
      kind: 'api_runtime' as const,
      processName: 'bws-read-only-api',
      roles: Object.freeze(['cockpit', 'api'] as const),
    }),
  ] satisfies readonly BwsOperatorLifecycleManagedProcessDescriptor[]);
  const request: BwsLifecycleRequest = Object.freeze({
    environment,
    managedProcessDescriptors,
    repositoryRoot: REPO_ROOT,
    runtimeStateDirectory: relative(REPO_ROOT, runtimeStateDirectoryAbsolute),
  });

  return Object.freeze({
    diagnosticsDirectoryAbsolute,
    async dispose() {
      try {
        await stopManagedBwsOperatorStack(request);
      } catch {
        // best-effort campaign-owned cleanup
      }
      rmSync(diagnosticsDirectoryAbsolute, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
      rmSync(runtimeStateDirectoryAbsolute, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
      rmSync(apiStubPath, { force: true, maxRetries: 5, retryDelay: 20 });
      rmSync(convergenceStubPath, { force: true, maxRetries: 5, retryDelay: 20 });
      rmSync(schedulerStubPath, { force: true, maxRetries: 5, retryDelay: 20 });
      rmSync(workerStubPath, { force: true, maxRetries: 5, retryDelay: 20 });
    },
    request,
  });
}

function createDiagnosticsBundleManifest(
  lifecycleStatus: Awaited<ReturnType<typeof getManagedBwsOperatorStackStatus>>,
  sequence: number,
): Record<string, unknown> {
  return Object.freeze({
    generatedAt: TEST_TIMESTAMP,
    health: Object.freeze({
      status: lifecycleStatus.stack.healthStatus === 'healthy' ? 'healthy' : 'blocked',
    }),
    metrics: Object.freeze({
      api: Object.freeze({
        status: lifecycleStatus.stack.components.api === 'ready' ? 'ready' : 'blocked',
      }),
      cockpit: Object.freeze({
        status: lifecycleStatus.stack.components.cockpit === 'ready' ? 'ready' : 'blocked',
      }),
      runtime: Object.freeze({
        lifecycleState: lifecycleStatus.outcome === 'running' ? 'running' : 'stopped',
        runtimeId: lifecycleStatus.runtimeId,
      }),
      scheduler: Object.freeze({
        lifecycleState: lifecycleStatus.stack.components.private_paper_scheduler === 'ready' ? 'running' : 'blocked',
        runtimeId: lifecycleStatus.runtimeId,
      }),
      upstream: Object.freeze({
        lifecycleState: lifecycleStatus.stack.components.upstream_convergence === 'ready' ? 'running' : 'blocked',
        runtimeId: lifecycleStatus.runtimeId,
      }),
      worker: Object.freeze({
        lifecycleState: lifecycleStatus.stack.components.private_paper_worker === 'ready' ? 'running' : 'blocked',
        runtimeId: lifecycleStatus.runtimeId,
      }),
    }),
    queueSummary: Object.freeze({
      deadLetteredCount: 0,
      leasedCount: 0,
      pendingCount: 0,
      queueName: 'private-paper',
      retryWaitCount: 0,
      succeededCount: sequence,
    }),
    readiness: Object.freeze({
      status: lifecycleStatus.stack.readinessStatus === 'ready' ? 'ready' : 'blocked',
    }),
    schema: 'bws.diagnostics_bundle.v1',
  });
}

function createRuntimeApiStubSource(port: number): string {
  return [
    "import { createServer } from 'node:http';",
    `const port = ${String(port)};`,
    "const body = JSON.stringify({ ok: true, health: { status: 'healthy' }, readiness: { status: 'ready', components: { cockpit: 'ready' } } });",
    "const server = createServer((request, response) => {",
    "  if (request.url === '/health' || request.url === '/readiness') {",
    "    response.statusCode = 200;",
    "    response.setHeader('content-type', 'application/json');",
    "    response.end(body);",
    "    return;",
    "  }",
    "  response.statusCode = 404;",
    "  response.end('not found');",
    "});",
    "server.listen(port, '127.0.0.1');",
    "let closing = false;",
    "for (const signal of ['SIGINT', 'SIGTERM']) {",
    "  process.on(signal, () => {",
    "    if (closing) {",
    "      return;",
    "    }",
    "    closing = true;",
    "    server.close(() => process.exit(0));",
    "  });",
    "}",
  ].join('\n');
}

function createRuntimeIdleStubSource(): string {
  return [
    "const interval = setInterval(() => undefined, 250);",
    "let closing = false;",
    "for (const signal of ['SIGINT', 'SIGTERM']) {",
    "  process.on(signal, () => {",
    "    if (closing) {",
    "      return;",
    "    }",
    "    closing = true;",
    "    clearInterval(interval);",
    "    process.exit(0);",
    "  });",
    "}",
  ].join('\n');
}

function readUpstreamRepositoryPath(): string {
  const parsed = JSON.parse(readFileSync(join(REPO_ROOT, 'config', 'betting-win.upstream.lock.json'), 'utf-8')) as {
    repositoryPath?: unknown;
  };
  if (typeof parsed.repositoryPath !== 'string' || parsed.repositoryPath.trim().length === 0) {
    throw new Error('config/betting-win.upstream.lock.json must retain repositoryPath for runtime soak tests.');
  }
  return parsed.repositoryPath;
}

async function reserveLoopbackPort(): Promise<number> {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  if (address === null || typeof address === 'string') {
    throw new Error('Loopback test server did not return an AddressInfo record.');
  }
  const port = address.port;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForExit(pid: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5_000) {
    if (!isAlive(pid)) {
      return;
    }
    await sleepFor(25);
  }
  throw new Error(`Timed out waiting for pid ${String(pid)} to exit.`);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
      return false;
    }
    throw error;
  }
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
