import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getManagedBwsOperatorStackStatus,
  runBwsOperatorLifecycleCli,
  startManagedBwsOperatorStack,
  stopManagedBwsOperatorStack,
  type BwsLifecycleRequest,
  type BwsOperatorLifecycleCommandResult,
  type BwsOperatorLifecycleManagedProcess,
  type BwsOperatorLifecycleManagedProcessDescriptor,
  type BwsServiceRuntimeEnvironment,
} from '../packages/bootstrap/src/index.js';

const TEST_TIMESTAMP = '2026-07-15T22:10:00.000Z';

test('operator lifecycle start, status, idempotent start, and stop manage the full recorded repo-owned stack', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const start = await startManagedBwsOperatorStack(fixture.request);
    assert.equal(start.outcome, 'started');
    assert.equal(start.processes.length, 4);
    assert.equal(existsSync(join(fixture.runtimeStateDirectory, 'state.json')), true);
    assert.equal(start.stack.readinessStatus, 'ready');
    assert.equal(start.stack.healthStatus, 'healthy');

    const status = await getManagedBwsOperatorStackStatus(fixture.request);
    assert.equal(status.outcome, 'running');
    assert.equal(status.stack.components.upstream_convergence, 'ready');
    assert.equal(status.stack.components.private_paper_scheduler, 'ready');
    assert.equal(status.stack.components.private_paper_worker, 'ready');
    assert.equal(status.stack.components.cockpit, 'ready');
    assert.equal(status.stack.components.api, 'ready');

    const secondStart = await startManagedBwsOperatorStack(fixture.request);
    assert.equal(secondStart.outcome, 'already_running');

    const stop = await stopManagedBwsOperatorStack(fixture.request);
    assert.equal(stop.outcome, 'stopped');
    assert.equal(existsSync(join(fixture.runtimeStateDirectory, 'state.json')), false);

    const secondStop = await stopManagedBwsOperatorStack(fixture.request);
    assert.equal(secondStop.outcome, 'already_stopped');

    const evidenceFiles = listEvidenceFiles(fixture.runtimeStateDirectory);
    assert.deepEqual(
      evidenceFiles.map((entry) => entry.outcome).sort(),
      ['started', 'running', 'already_running', 'stopped', 'already_stopped'].sort(),
    );
    assert.equal(evidenceFiles.every((entry) => entry.schema === 'bws.operator_lifecycle_evidence.v2'), true);
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle fails closed on lifecycle-token tampering, config mismatch, and proc-start-tick reuse', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const start = await startManagedBwsOperatorStack(fixture.request);
    assert.equal('pid' in start.process, true);

    const stateFile = join(fixture.runtimeStateDirectory, 'state.json');
    const tamperedState = JSON.parse(readFileSync(stateFile, 'utf-8')) as {
      processes: Array<{
        lifecycleToken: string;
        procStartTicks: string;
      }>;
    };

    tamperedState.processes[0]!.lifecycleToken = 'tampered-token';
    writeFileSync(stateFile, `${JSON.stringify(tamperedState, null, 2)}\n`, 'utf-8');
    await assert.rejects(
      () => getManagedBwsOperatorStackStatus(fixture.request),
      /does not contain the recorded lifecycle token/,
    );

    tamperedState.processes[0]!.lifecycleToken = requireManagedProcess(start.process).lifecycleToken;
    tamperedState.processes[0]!.procStartTicks = 'tampered-proc-start-ticks';
    writeFileSync(stateFile, `${JSON.stringify(tamperedState, null, 2)}\n`, 'utf-8');
    await assert.rejects(
      () => getManagedBwsOperatorStackStatus(fixture.request),
      /no longer matches the recorded Linux \/proc start ticks/,
    );

    const persistedState = JSON.parse(readFileSync(stateFile, 'utf-8')) as {
      configFingerprint: string;
      processes: Array<{
        lifecycleToken: string;
        procStartTicks: string;
      }>;
    };
    persistedState.processes[0]!.procStartTicks = requireManagedProcess(start.process).procStartTicks;
    writeFileSync(stateFile, `${JSON.stringify(persistedState, null, 2)}\n`, 'utf-8');

    const mismatchedRequest = Object.freeze({
      ...fixture.request,
      environment: Object.freeze({
        ...(fixture.request.environment as BwsServiceRuntimeEnvironment),
        BWS_API_PORT: String(fixture.port + 1),
      }),
    } satisfies BwsLifecycleRequest);
    await assert.rejects(
      () => getManagedBwsOperatorStackStatus(mismatchedRequest),
      /configuration fingerprint does not match/,
    );
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle reports degraded status after a child crash, then restarts cleanly', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const firstStart = await startManagedBwsOperatorStack(fixture.request);
    assert.equal(firstStart.outcome, 'started');
    const workerProcess = firstStart.processes.find((entry) => entry.kind === 'private_paper_worker');
    assert.notEqual(workerProcess, undefined);
    process.kill(workerProcess!.pid, 'SIGTERM');
    await waitForExit(workerProcess!.pid);

    const status = await getManagedBwsOperatorStackStatus(fixture.request);
    assert.equal(status.outcome, 'degraded');
    assert.equal(status.stack.healthStatus, 'degraded');
    assert.equal(status.stack.components.private_paper_worker, 'missing');

    const secondStart = await startManagedBwsOperatorStack(fixture.request);
    assert.equal(secondStart.outcome, 'stale_state_cleaned');
    const restartedWorker = secondStart.processes.find((entry) => entry.kind === 'private_paper_worker');
    assert.notEqual(restartedWorker, undefined);
    assert.notEqual(restartedWorker!.pid, workerProcess!.pid);
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle rolls back partial startup failures and stops children in the required order', async () => {
  const fixture = await createLifecycleFixture();
  try {
    const failingRequest = Object.freeze({
      ...fixture.request,
      managedProcessDescriptors: Object.freeze([
        ...fixture.request.managedProcessDescriptors!.slice(0, 3),
        Object.freeze({
          entryPointPath: fixture.request.managedProcessDescriptors![2]!.entryPointPath,
          kind: 'api_runtime' as const,
          processName: 'bws-read-only-api',
          roles: Object.freeze(['cockpit', 'api'] as const),
        }),
      ]),
      startTimeoutMs: 500,
    } satisfies BwsLifecycleRequest);

    await assert.rejects(
      () => startManagedBwsOperatorStack(failingRequest),
      /Timed out waiting for managed BWS API readiness/,
    );
    const startedRoles = readSignalLog(fixture.startedLogPath);
    assert.equal(startedRoles.some((entry) => entry.includes('boot:upstream_convergence')), true);
    assert.equal(startedRoles.some((entry) => entry.includes('boot:private_paper_scheduler')), true);
    const schedulerPid = readRecordedPid(fixture.roleBootFiles.private_paper_scheduler);
    assert.equal(isAlive(schedulerPid), false);
    assert.equal(existsSync(join(fixture.runtimeStateDirectory, 'state.json')), false);

    const started = await startManagedBwsOperatorStack(fixture.request);
    assert.equal(started.outcome, 'started');
    const stopped = await stopManagedBwsOperatorStack(fixture.request);
    assert.equal(stopped.outcome, 'stopped');
    assert.deepEqual(
      readSignalLog(fixture.signalLogPath).slice(-4),
      [
        'signal:upstream_convergence:SIGTERM',
        'signal:private_paper_scheduler:SIGTERM',
        'signal:private_paper_worker:SIGTERM',
        'signal:api_runtime:SIGTERM',
      ],
    );
  } finally {
    await fixture.dispose();
  }
});

test('operator lifecycle CLI prints help without side effects', async () => {
  const capture = createCaptureStream();
  const exitCode = await runBwsOperatorLifecycleCli(['--help'], process.cwd(), capture.stream);
  assert.equal(exitCode, 0);
  assert.match(capture.read(), /<start\|status\|stop>/);
  assert.match(capture.read(), /full BWS stack lifecycle/);
});

async function createLifecycleFixture(): Promise<{
  readonly dispose: () => Promise<void>;
  readonly port: number;
  readonly repositoryRoot: string;
  readonly request: BwsLifecycleRequest;
  readonly roleBootFiles: Readonly<Record<'api_runtime' | 'private_paper_scheduler' | 'private_paper_worker' | 'upstream_convergence', string>>;
  readonly runtimeStateDirectory: string;
  readonly signalLogPath: string;
  readonly startedLogPath: string;
}> {
  const root = mkdtempSync(join(tmpdir(), 'bws-operator-lifecycle-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const upstreamRoot = join(root, 'betting-win');
  const runtimeStateDirectory = join(repositoryRoot, 'runtime-state');
  const signalLogPath = join(repositoryRoot, 'signal-log.txt');
  const startedLogPath = join(repositoryRoot, 'started-log.txt');
  await createRepositoryFixture(repositoryRoot, upstreamRoot);
  const port = await reserveLoopbackPort();

  const roleBootFiles = Object.freeze({
    api_runtime: join(repositoryRoot, 'api-runtime.boot.txt'),
    private_paper_scheduler: join(repositoryRoot, 'private-paper-scheduler.boot.txt'),
    private_paper_worker: join(repositoryRoot, 'private-paper-worker.boot.txt'),
    upstream_convergence: join(repositoryRoot, 'upstream-convergence.boot.txt'),
  });
  const apiStubPath = join(repositoryRoot, 'stub-read-only-api.mjs');
  const convergenceStubPath = join(repositoryRoot, 'stub-upstream-convergence-service.mjs');
  const schedulerStubPath = join(repositoryRoot, 'stub-private-paper-scheduler-service.mjs');
  const workerStubPath = join(repositoryRoot, 'stub-private-paper-worker-service.mjs');

  writeFileSync(
    apiStubPath,
    createApiStubServiceSource({
      port,
      role: 'api_runtime',
      signalLogPath,
      startedLogPath,
      startedMarkerPath: roleBootFiles.api_runtime,
    }),
    'utf-8',
  );
  writeFileSync(
    convergenceStubPath,
    createIdleStubServiceSource({
      role: 'upstream_convergence',
      signalLogPath,
      startedLogPath,
      startedMarkerPath: roleBootFiles.upstream_convergence,
    }),
    'utf-8',
  );
  writeFileSync(
    schedulerStubPath,
    createIdleStubServiceSource({
      role: 'private_paper_scheduler',
      signalLogPath,
      startedLogPath,
      startedMarkerPath: roleBootFiles.private_paper_scheduler,
    }),
    'utf-8',
  );
  writeFileSync(
    workerStubPath,
    createIdleStubServiceSource({
      exitDelayMs: 50,
      role: 'private_paper_worker',
      signalLogPath,
      startedLogPath,
      startedMarkerPath: roleBootFiles.private_paper_worker,
    }),
    'utf-8',
  );

  const environment: BwsServiceRuntimeEnvironment = Object.freeze({
    BETTING_WIN_REPO_PATH: upstreamRoot,
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
    BWS_UPSTREAM_EXPORT_SELECTION_PATH: 'config/export-selection.json',
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
    repositoryRoot,
    runtimeStateDirectory,
  });

  return Object.freeze({
    async dispose() {
      try {
        await stopManagedBwsOperatorStack(request);
      } catch {
        const stateFile = join(runtimeStateDirectory, 'state.json');
        if (existsSync(stateFile)) {
          try {
            const state = JSON.parse(readFileSync(stateFile, 'utf-8')) as {
              processes?: Array<{
                pid?: unknown;
              }>;
            };
            for (const processRecord of state.processes ?? []) {
              if (typeof processRecord.pid === 'number') {
                try {
                  process.kill(processRecord.pid, 'SIGTERM');
                  await waitForExit(processRecord.pid);
                } catch {
                  // ignore raw cleanup failures
                }
              }
            }
          } catch {
            // ignore malformed state during cleanup
          }
        }
      }
      rmSync(root, { recursive: true, force: true });
    },
    port,
    repositoryRoot,
    request,
    roleBootFiles,
    runtimeStateDirectory,
    signalLogPath,
    startedLogPath,
  });
}

async function createRepositoryFixture(repositoryRoot: string, upstreamRoot: string): Promise<void> {
  rmSync(repositoryRoot, { recursive: true, force: true });
  rmSync(upstreamRoot, { recursive: true, force: true });
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
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
  writeFileSync(
    join(repositoryRoot, 'config', 'export-selection.json'),
    `${JSON.stringify({
      expectedBundleSha256: 'f'.repeat(64),
      exportFile: 'exports/selection.json',
      generatedAt: TEST_TIMESTAMP,
      schema: 'betting-win-surebet-export-selection.v1',
    }, null, 2)}\n`,
    'utf-8',
  );
}

function createApiStubServiceSource(input: Readonly<{
  readonly port: number;
  readonly role: string;
  readonly signalLogPath: string;
  readonly startedLogPath: string;
  readonly startedMarkerPath: string;
}>): string {
  return [
    "import { appendFileSync, writeFileSync } from 'node:fs';",
    "import { createServer } from 'node:http';",
    `const port = ${String(input.port)};`,
    `const role = ${JSON.stringify(input.role)};`,
    `const signalLogPath = ${JSON.stringify(input.signalLogPath)};`,
    `const startedLogPath = ${JSON.stringify(input.startedLogPath)};`,
    `const startedMarkerPath = ${JSON.stringify(input.startedMarkerPath)};`,
    "writeFileSync(startedMarkerPath, `${process.pid}\\n`, 'utf-8');",
    "appendFileSync(startedLogPath, `boot:${role}:${process.pid}\\n`, 'utf-8');",
    "const responseBody = JSON.stringify({ ok: true, health: { status: 'healthy' }, readiness: { status: 'ready', components: { cockpit: 'ready' } }, observability: { configuration: { persistence: { password: '[redacted]' } } } });",
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
    "let closing = false;",
    "for (const signal of ['SIGINT', 'SIGTERM']) {",
    "  process.on(signal, () => {",
    "    if (closing) {",
    "      return;",
    "    }",
    "    closing = true;",
    "    appendFileSync(signalLogPath, `signal:${role}:${signal}\\n`, 'utf-8');",
    "    server.close(() => process.exit(0));",
    "  });",
    "}",
  ].join('\n');
}

function createIdleStubServiceSource(input: Readonly<{
  readonly exitDelayMs?: number;
  readonly role: string;
  readonly signalLogPath: string;
  readonly startedLogPath: string;
  readonly startedMarkerPath: string;
}>): string {
  return [
    "import { appendFileSync, writeFileSync } from 'node:fs';",
    `const role = ${JSON.stringify(input.role)};`,
    `const signalLogPath = ${JSON.stringify(input.signalLogPath)};`,
    `const startedLogPath = ${JSON.stringify(input.startedLogPath)};`,
    `const startedMarkerPath = ${JSON.stringify(input.startedMarkerPath)};`,
    `const exitDelayMs = ${String(input.exitDelayMs ?? 0)};`,
    "writeFileSync(startedMarkerPath, `${process.pid}\\n`, 'utf-8');",
    "appendFileSync(startedLogPath, `boot:${role}:${process.pid}\\n`, 'utf-8');",
    "const interval = setInterval(() => undefined, 250);",
    "let closing = false;",
    "for (const signal of ['SIGINT', 'SIGTERM']) {",
    "  process.on(signal, () => {",
    "    if (closing) {",
    "      return;",
    "    }",
    "    closing = true;",
    "    clearInterval(interval);",
    "    appendFileSync(signalLogPath, `signal:${role}:${signal}\\n`, 'utf-8');",
    "    setTimeout(() => process.exit(0), exitDelayMs);",
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

function readRecordedPid(filePath: string): number {
  return Number.parseInt(readFileSync(filePath, 'utf-8').trim(), 10);
}

function listEvidenceFiles(runtimeStateDirectory: string): ReadonlyArray<{
  readonly outcome: BwsOperatorLifecycleCommandResult['outcome'];
  readonly schema: string;
}> {
  const evidenceDirectory = join(runtimeStateDirectory, 'evidence');
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

function readSignalLog(filePath: string): readonly string[] {
  if (!existsSync(filePath)) {
    return Object.freeze([] as readonly string[]);
  }
  return Object.freeze(
    readFileSync(filePath, 'utf-8')
      .split('\n')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
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
