import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getManagedBwsReadOnlyApiStatus,
  runBwsOperatorLifecycleCli,
  startManagedBwsReadOnlyApi,
  stopManagedBwsReadOnlyApi,
  type BwsLifecycleRequest,
  type BwsOperatorLifecycleCommandResult,
  type BwsOperatorLifecycleManagedProcess,
  type BwsOperatorLifecycleServiceDescriptor,
  type BwsServiceRuntimeEnvironment,
} from '../packages/bootstrap/src/index.js';

const TEST_TIMESTAMP = '2026-07-15T22:10:00.000Z';

test('operator lifecycle start, status, idempotent start, and stop manage only the recorded repo-owned loopback process', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const start = await startManagedBwsReadOnlyApi(fixture.request);
    assert.equal(start.outcome, 'started');
    assert.equal('pid' in start.process, true);
    assert.equal(existsSync(join(fixture.runtimeStateDirectory, 'read-only-api', 'state.json')), true);
    assert.equal('ok' in start.health, true);
    assert.equal('ok' in start.readiness, true);

    const status = await getManagedBwsReadOnlyApiStatus(fixture.request);
    assert.equal(status.outcome, 'running');
    assert.equal('pid' in status.process, true);
    assert.equal('ok' in status.health && status.health.ok, true);
    assert.equal('ok' in status.readiness && status.readiness.ok, true);

    const secondStart = await startManagedBwsReadOnlyApi(fixture.request);
    assert.equal(secondStart.outcome, 'already_running');

    const stop = await stopManagedBwsReadOnlyApi(fixture.request);
    assert.equal(stop.outcome, 'stopped');
    assert.equal(existsSync(join(fixture.runtimeStateDirectory, 'read-only-api', 'state.json')), false);

    const secondStop = await stopManagedBwsReadOnlyApi(fixture.request);
    assert.equal(secondStop.outcome, 'already_stopped');

    const evidenceFiles = listEvidenceFiles(fixture.runtimeStateDirectory);
    assert.deepEqual(
      evidenceFiles.map((entry) => entry.outcome).sort(),
      ['started', 'running', 'already_running', 'stopped', 'already_stopped'].sort(),
    );
    assert.equal(evidenceFiles.every((entry) => entry.schema === 'bws.operator_lifecycle_evidence.v1'), true);
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle fails closed when the recorded lifecycle token no longer matches the running process', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const start = await startManagedBwsReadOnlyApi(fixture.request);
    assert.equal('pid' in start.process, true);
    const stateFile = join(fixture.runtimeStateDirectory, 'read-only-api', 'state.json');
    const state = JSON.parse(readFileSync(stateFile, 'utf-8')) as {
      process: {
        lifecycleToken: string;
      };
    };
    state.process.lifecycleToken = 'tampered-token';
    writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');

    await assert.rejects(
      () => getManagedBwsReadOnlyApiStatus(fixture.request),
      /does not contain the recorded lifecycle token/,
    );
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle cleans stale state after an external stop and supports restart-safe ownership refresh', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const firstStart = await startManagedBwsReadOnlyApi(fixture.request);
    assert.equal(firstStart.outcome, 'started');
    const firstProcess = requireManagedProcess(firstStart.process);
    process.kill(firstProcess.pid, 'SIGTERM');
    await waitForExit(firstProcess.pid);

    const status = await getManagedBwsReadOnlyApiStatus(fixture.request);
    assert.equal(status.outcome, 'stale_state_cleaned');
    assert.equal('ownership' in status.process, true);
    assert.equal(existsSync(join(fixture.runtimeStateDirectory, 'read-only-api', 'state.json')), false);

    const secondStart = await startManagedBwsReadOnlyApi(fixture.request);
    assert.equal(secondStart.outcome, 'started');
    const secondProcess = requireManagedProcess(secondStart.process);
    assert.notEqual(secondProcess.pid, firstProcess.pid);

    const stop = await stopManagedBwsReadOnlyApi(fixture.request);
    assert.equal(stop.outcome, 'stopped');
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle CLI prints help without side effects', async () => {
  const capture = createCaptureStream();
  const exitCode = await runBwsOperatorLifecycleCli(['--help'], process.cwd(), capture.stream);
  assert.equal(exitCode, 0);
  assert.match(capture.read(), /<start\|status\|stop>/);
});

async function createLifecycleFixture(): Promise<{
  readonly dispose: () => Promise<void>;
  readonly request: BwsLifecycleRequest;
  readonly runtimeStateDirectory: string;
}> {
  const root = mkdtempSync(join(tmpdir(), 'bws-operator-lifecycle-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const upstreamRoot = join(root, 'betting-win');
  const runtimeStateDirectory = join(repositoryRoot, 'runtime-state');
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
  const port = await reserveLoopbackPort();
  writeFileSync(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify({ name: 'bws-lifecycle-fixture', version: '0.0.0-test' }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'SOURCE_MANIFEST.json'),
    `${JSON.stringify({
      schema: 'betting-win-surebet-source-manifest-v1',
      generated: TEST_TIMESTAMP,
      overlay: 'bws-operator-lifecycle-test',
      files: [],
    }, null, 2)}\n`,
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
    `${JSON.stringify(sampleUpstreamLock(upstreamRoot), null, 2)}\n`,
    'utf-8',
  );

  const stubPath = join(repositoryRoot, 'stub-read-only-api.mjs');
  writeFileSync(stubPath, createStubServiceSource(), 'utf-8');

  const environment: BwsServiceRuntimeEnvironment = Object.freeze({
    BETTING_WIN_REPO_PATH: upstreamRoot,
    BWS_API_PORT: String(port),
    BWS_UPSTREAM_LOCK_PATH: 'config/betting-win.upstream.lock.json',
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
  const descriptor: BwsOperatorLifecycleServiceDescriptor = Object.freeze({
    entryPointPath: stubPath,
    processName: 'bws-read-only-api',
    service: 'read_only_api',
  });

  const request: BwsLifecycleRequest = Object.freeze({
    descriptor,
    environment,
    repositoryRoot,
    runtimeStateDirectory,
  });

  return Object.freeze({
    async dispose() {
      try {
        await stopManagedBwsReadOnlyApi(request);
      } catch {
        const stateFile = join(runtimeStateDirectory, 'read-only-api', 'state.json');
        if (existsSync(stateFile)) {
          try {
            const state = JSON.parse(readFileSync(stateFile, 'utf-8')) as {
              process?: {
                pid?: unknown;
              };
            };
            if (typeof state.process?.pid === 'number') {
              try {
                process.kill(state.process.pid, 'SIGTERM');
                await waitForExit(state.process.pid);
              } catch {
                // ignore raw cleanup failures
              }
            }
          } catch {
            // ignore malformed state during cleanup
          }
        }
      }
      rmSync(root, { recursive: true, force: true });
    },
    request,
    runtimeStateDirectory,
  });
}

function createStubServiceSource(): string {
  return [
    "import { createServer } from 'node:http';",
    "const port = Number.parseInt(process.env.BWS_API_PORT ?? '', 10);",
    "if (!Number.isInteger(port) || port <= 0) {",
    "  throw new Error('BWS_API_PORT is required for the lifecycle stub service.');",
    "}",
    "const responseBody = JSON.stringify({ ok: true, health: { status: 'healthy' }, readiness: { status: 'ready' }, observability: { configuration: { persistence: { password: '[redacted]' } } } });",
    "const server = createServer((request, response) => {",
    "  if (request.url === '/health' || request.url === '/readiness') {",
    "    response.statusCode = 200;",
    "    response.setHeader('content-type', 'application/json');",
    "    response.end(responseBody);",
    "    return;",
    "  }",
    "  response.statusCode = 404;",
    "  response.end('not found');",
    "});",
    "server.listen(port, '127.0.0.1');",
    "for (const signal of ['SIGINT', 'SIGTERM']) {",
    "  process.on(signal, () => {",
    "    server.close(() => process.exit(0));",
    "  });",
    "}",
  ].join('\n');
}

function sampleUpstreamLock(upstreamRoot: string): Record<string, unknown> {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: upstreamRoot,
    sourceView: 'committed_git_head',
    commitSha: '0123456789abcdef0123456789abcdef01234567',
    gitTreeSha: '89abcdef0123456789abcdef0123456789abcdef',
    trackedTreeListingSha256: 'a'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    packageVersion: '0.48.0',
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    capabilities: Object.freeze(['getHistoricalQuotes']),
    verifiedAt: TEST_TIMESTAMP,
  });
}

async function reserveLoopbackPort(): Promise<number> {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.notEqual(address, null);
  const port = (address as AddressInfo).port;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForExit(pid: number): Promise<void> {
  const started = Date.now();
  while (Date.now() - started <= 10_000) {
    if (!isAlive(pid)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for pid ${pid} to exit.`);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ESRCH') {
      return false;
    }
    throw error;
  }
}

function listEvidenceFiles(runtimeStateDirectory: string): ReadonlyArray<{
  readonly outcome: BwsOperatorLifecycleCommandResult['outcome'];
  readonly schema: string;
}> {
  const evidenceDirectory = join(runtimeStateDirectory, 'read-only-api', 'evidence');
  return Object.freeze(
    existsSync(evidenceDirectory)
      ? readdirSync(evidenceDirectory)
        .sort()
        .map((entry: string) => {
          const parsed = JSON.parse(readFileSync(join(evidenceDirectory, entry), 'utf-8')) as {
            readonly outcome: BwsOperatorLifecycleCommandResult['outcome'];
            readonly schema: string;
          };
          return Object.freeze({
            outcome: parsed.outcome,
            schema: parsed.schema,
          });
        })
      : [],
  );
}

function requireManagedProcess(
  processRecord: BwsOperatorLifecycleCommandResult['process'],
): BwsOperatorLifecycleManagedProcess {
  if ('ownership' in processRecord) {
    throw new Error('Expected a managed process record.');
  }
  return processRecord;
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
