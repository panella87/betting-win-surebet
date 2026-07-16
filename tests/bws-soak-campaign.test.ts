import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  createBwsSoakCampaign,
  executeBwsSoakCampaign,
  parseBwsSoakFailureSchedule,
  recordBwsSoakCampaignCheckpoint,
  readBwsSoakCampaignExecutionResult,
  runBwsSoakCampaignCli,
  validateBwsSoakCampaignExecution,
  type BwsSoakCampaignManifest,
} from '../packages/bootstrap/src/index.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-16T16:00:00.000Z';

test('soak campaign prepare is deterministic for identical inputs and records checkpoints', async () => {
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

test('soak campaign resume preserves the original manifest and records a resume checkpoint', async () => {
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

test('soak campaign resume rejects mismatched identity inputs', async () => {
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

test('soak campaign prepare rejects impossible observation budgets and out-of-range failures', async () => {
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

test('soak campaign checkpoints fail closed on repeated or out-of-range cycle progress', async () => {
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

test('soak campaign CLI prints help and prepare writes schema-aligned output', async () => {
  const fixture = createFixture();
  const capture = createCaptureStream();
  try {
    const helpExitCode = await runBwsSoakCampaignCli(['--help'], REPO_ROOT, capture.stream);
    assert.equal(helpExitCode, 0);
    assert.match(capture.read(), /BWS-592 foundation tranche/);
    assert.match(capture.read(), /<prepare\|checkpoint\|execute\|validate>/);

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

test('soak campaign CLI execute writes result output and retained schemas stay explicit', async () => {
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

test('soak campaign execution retains deterministic failure, cleanup, and validation evidence', async () => {
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

test('soak campaign execution runs during_recovery injections after the primary failure stage', async () => {
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

test('soak campaign execution fails closed when a scheduled failure does not recover', async () => {
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

test('soak campaign validation fails closed when the executed cycles do not satisfy the duration budget', async () => {
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

test('soak campaign execution fails closed when cleanup verification reports leaked ownership', async () => {
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

test('soak failure schedule parser fails closed on duplicate injection ids', () => {
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
      rmSync(tempDirectory, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
      rmSync(join(REPO_ROOT, 'runtime', 'bws-observability'), { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
    },
    evidenceDirectory: relative(REPO_ROOT, evidenceDirectoryAbsolute),
    failureScheduleFile: relative(REPO_ROOT, failureScheduleFileAbsolute),
    manifestFile: relative(REPO_ROOT, manifestFileAbsolute),
    resultFile: relative(REPO_ROOT, resultFileAbsolute),
    resetCampaignFiles() {
      rmSync(campaignDirectoryAbsolute, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
      rmSync(evidenceDirectoryAbsolute, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
      rmSync(runtimeDirectoryAbsolute, { force: true, recursive: true, maxRetries: 5, retryDelay: 20 });
    },
    runtimeDirectory: relative(REPO_ROOT, runtimeDirectoryAbsolute),
    stateFile: relative(REPO_ROOT, stateFileAbsolute),
  });
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
