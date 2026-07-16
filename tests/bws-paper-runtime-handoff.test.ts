import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createBwsPaperRuntimeHandoff,
  runBwsPaperRuntimeHandoffCli,
  type BwsOperatorLifecycleCommandResult,
} from '../packages/bootstrap/src/index.js';

const TEST_TIMESTAMP = '2026-07-16T10:00:00.000Z';

test('paper runtime handoff writes a strict latest handoff plus immutable source archive metadata', async () => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'bws-paper-runtime-handoff-'));
  try {
    const result = await createBwsPaperRuntimeHandoff({
      createSourceHandoffArchive({ outputPath, repositoryRoot: root }) {
        mkdirSync(join(root, 'artifacts', 'bws-paper-runtime-handoff'), { recursive: true });
        writeFileSync(outputPath, 'runtime handoff archive bytes\n', 'utf-8');
        return Object.freeze({
          archiveFile: 'artifacts/bws-paper-runtime-handoff/source_handoff_20260716T100000000Z.tar.gz',
          sha256: createHash('sha256').update('runtime handoff archive bytes\n').digest('hex'),
          sizeBytes: Buffer.byteLength('runtime handoff archive bytes\n'),
        });
      },
      lifecycleStatus: sampleLifecycleStatus(),
      now: () => TEST_TIMESTAMP,
      repositoryRoot,
    });

    assert.equal(result.handoff.schema, 'bws.paper_runtime_handoff.v1');
    assert.equal(result.handoff.currentTask, 'BWS-580');
    assert.equal(result.handoff.runtime.outcome, 'running');
    assert.equal(result.handoff.automation.integrationStatus, 'pending_protected_controller_review');
    assert.equal(result.archive.archiveFile.startsWith('artifacts/bws-paper-runtime-handoff/'), true);
    assert.equal(existsSync(join(repositoryRoot, result.handoffFile)), true);
    assert.equal(existsSync(join(repositoryRoot, result.latestHandoffFile)), true);

    const latest = JSON.parse(readFileSync(join(repositoryRoot, result.latestHandoffFile), 'utf-8')) as {
      readonly packaging: {
        readonly sourceHandoffArchive: {
          readonly sha256: string;
        };
      };
      readonly runtime: {
        readonly evidenceFile: string;
      };
      readonly schema: string;
    };
    assert.equal(latest.schema, 'bws.paper_runtime_handoff.v1');
    assert.equal(latest.runtime.evidenceFile, 'runtime/bws-operator-lifecycle/read-only-api/evidence/latest.json');
    assert.equal(latest.packaging.sourceHandoffArchive.sha256, result.archive.sha256);
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

test('paper runtime handoff fails closed when lifecycle status is not healthy and ready', async () => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'bws-paper-runtime-handoff-blocked-'));
  try {
    await assert.rejects(
      () => createBwsPaperRuntimeHandoff({
        createSourceHandoffArchive() {
          throw new Error('archive creation must not run after readiness failure');
        },
        lifecycleStatus: {
          ...sampleLifecycleStatus(),
          health: Object.freeze({
            error: 'managed process is not running',
            url: 'http://127.0.0.1:4312/health',
          }),
        },
        now: () => TEST_TIMESTAMP,
        repositoryRoot,
      }),
      /requires a healthy runtime status probe/,
    );
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

test('paper runtime handoff CLI prints explicit help', async () => {
  const capture = createCaptureStream();
  const exitCode = await runBwsPaperRuntimeHandoffCli(['--help'], process.cwd(), capture.stream);
  assert.equal(exitCode, 0);
  assert.match(capture.read(), /machine-readable BWS private-paper runtime handoff/);
  assert.match(capture.read(), /BETTING_WIN_REPO_PATH/);
});

function sampleLifecycleStatus(): BwsOperatorLifecycleCommandResult {
  return Object.freeze({
    command: 'status',
    configuration: Object.freeze({
      api: Object.freeze({
        bindHost: '127.0.0.1',
        port: 4312,
      }),
      persistence: Object.freeze({
        database: 'surebet_test',
        host: '127.0.0.1',
        password: '[redacted]',
        port: 5432,
        user: 'surebet',
      }),
      policy: Object.freeze({
        executionEnabled: false,
        providerConnections: 'disabled',
        runtimeMode: 'paper',
      }),
      processDefinitions: Object.freeze([
        Object.freeze({
          automaticFallback: 'forbidden',
          boundary: '@betting-win-surebet/bootstrap:BWS-400',
          execution: 'disabled',
          exposure: 'loopback_only',
          networkBindings: Object.freeze([]),
          notes: Object.freeze(['api']),
          processName: 'bws-read-only-api',
          providerConnections: 'disabled',
          requiredEnvironmentKeys: Object.freeze(['BETTING_WIN_REPO_PATH']),
          role: 'api',
        }),
        Object.freeze({
          automaticFallback: 'forbidden',
          boundary: '@betting-win-surebet/bootstrap:BWS-410',
          execution: 'disabled',
          exposure: 'no_listener',
          networkBindings: Object.freeze([]),
          notes: Object.freeze(['worker']),
          processName: 'bws-private-paper-worker',
          providerConnections: 'disabled',
          requiredEnvironmentKeys: Object.freeze(['BETTING_WIN_REPO_PATH']),
          role: 'worker',
        }),
      ]),
      upstream: Object.freeze({
        commitSha: '0123456789abcdef0123456789abcdef01234567',
        contractAlias: 'betting-win-strategy-export.v1',
        contractSchema: 'betting-win.strategy-export.v1',
        gitTreeSha: '89abcdef0123456789abcdef0123456789abcdef',
        lockPath: 'config/betting-win.upstream.lock.json',
        repository: 'betting-win',
        repositoryPath: '/tmp/betting-win',
        sourceView: 'committed_git_head',
        surebetProfile: 'surebet_standard_binary_v0',
        trackedTreeListingSha256: 'a'.repeat(64),
        verifiedAt: TEST_TIMESTAMP,
      }),
      worker: Object.freeze({
        leaseDurationMs: 30000,
        queueName: 'private-paper',
        workerId: 'worker-001',
      }),
    }),
    evidenceFile: 'runtime/bws-operator-lifecycle/read-only-api/evidence/latest.json',
    generatedAt: TEST_TIMESTAMP,
    health: Object.freeze({
      body: Object.freeze({
        health: Object.freeze({ status: 'healthy' }),
        ok: true,
      }),
      ok: true,
      statusCode: 200,
      url: 'http://127.0.0.1:4312/health',
    }),
    outcome: 'running',
    process: Object.freeze({
      command: Object.freeze(['/usr/bin/node', 'dist/packages/bootstrap/src/cli/bws-read-only-api.js']),
      commandCwd: '/tmp/repo',
      entryPointPath: '/tmp/repo/dist/packages/bootstrap/src/cli/bws-read-only-api.js',
      lifecycleToken: 'lifecycle-token-001',
      pid: 1234,
      processName: 'bws-read-only-api',
      procStartTicks: '123456',
      startedAt: TEST_TIMESTAMP,
    }),
    readiness: Object.freeze({
      body: Object.freeze({
        observability: Object.freeze({}),
        readiness: Object.freeze({ status: 'ready' }),
      }),
      ok: true,
      statusCode: 200,
      url: 'http://127.0.0.1:4312/readiness',
    }),
    service: 'read_only_api',
    sourceFingerprints: Object.freeze({
      packageVersion: '0.1.0-bws-full-platform',
      sourceManifestGeneratedAt: TEST_TIMESTAMP,
      sourceManifestOverlay: 'runtime-handoff-test',
      sourceManifestSha256: 'b'.repeat(64),
      upstreamCommitSha: '0123456789abcdef0123456789abcdef01234567',
      upstreamGitTreeSha: '89abcdef0123456789abcdef0123456789abcdef',
      upstreamTrackedTreeListingSha256: 'a'.repeat(64),
    }),
    stateFile: 'runtime/bws-operator-lifecycle/read-only-api/state.json',
  });
}

function createCaptureStream(): {
  readonly read: () => string;
  readonly stream: NodeJS.WriteStream;
} {
  let buffer = '';
  return Object.freeze({
    read() {
      return buffer;
    },
    stream: Object.freeze({
      write(chunk: string | Uint8Array) {
        buffer += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
        return true;
      },
    }) as unknown as NodeJS.WriteStream,
  });
}
