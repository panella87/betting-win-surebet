import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile, execFileSync } from 'node:child_process';

const REPO_ROOT = process.cwd();
const RUNTIME_ENVIRONMENT_PREFIXES = Object.freeze([
  'BETTING_WIN_',
  'BWS_',
  'POSTGRES_',
  'SUREBET_',
  'VITE_BWS_',
]);

test('check_progress.sh reports automation artifacts and product runtime state', async () => {
  const fixture = await createRuntimeFixture();
  try {
    const output = await execFileText('bash', ['check_progress.sh', '--tail', '5'], {
      cwd: fixture.repositoryRoot,
    });

    assert.match(output, /run_dir=artifacts\/autonomous_implementation_/);
    assert.match(output, /runtime_source=product_runtime_state/);
    assert.match(output, /runtime_condition=ready/);
    assert.match(output, /runtime_configuration_status=matched/);
    assert.match(output, /runtime_component_api=ready/);
    assert.match(output, /runtime_upstream_mode=api/);
  } finally {
    await fixture.dispose();
  }
});

test('check_progress.sh blocks runtime status when explicit configuration mismatches active state', async () => {
  const fixture = await createRuntimeFixture({
    envOverrides: Object.freeze({
      BWS_API_PORT: '4999',
    }),
  });
  try {
    const output = await execFileText('bash', ['check_progress.sh', '--tail', '5'], {
      cwd: fixture.repositoryRoot,
    });

    assert.match(output, /runtime_condition=blocked/);
    assert.match(output, /runtime_configuration_status=mismatched/);
    assert.match(output, /BWS_API_PORT=expected:4999,actual:/);
  } finally {
    await fixture.dispose();
  }
});

test('open_log.sh can tail product runtime structured logs', async () => {
  const fixture = await createRuntimeFixture();
  try {
    const output = await execFileText('bash', ['open_log.sh', '--runtime', '--role', 'lifecycle', '--tail', '5'], {
      cwd: fixture.repositoryRoot,
    });

    assert.match(output, /log_file=.*runtime\/bws-observability\/logs\/lifecycle\.jsonl/);
    assert.match(output, /lifecycle_event/);
  } finally {
    await fixture.dispose();
  }
});

test('start.sh and stop.sh delegate to the product-owned lifecycle helper', () => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'bws-root-start-stop-'));
  try {
    mkdirSync(join(repositoryRoot, 'scripts'), { recursive: true });
    mkdirSync(join(repositoryRoot, 'dist', 'packages', 'bootstrap', 'src', 'cli'), { recursive: true });

    copyFileSync(join(REPO_ROOT, 'start.sh'), join(repositoryRoot, 'start.sh'));
    copyFileSync(join(REPO_ROOT, 'stop.sh'), join(repositoryRoot, 'stop.sh'));
    copyFileSync(
      join(REPO_ROOT, 'scripts', 'bws-root-wrapper-runtime.mjs'),
      join(repositoryRoot, 'scripts', 'bws-root-wrapper-runtime.mjs'),
    );

    writeFileSync(join(repositoryRoot, '.nvmrc'), '20\n', 'utf-8');
    writeFileSync(
      join(repositoryRoot, 'scripts', 'restore-required-executable-bits.js'),
      'process.exit(0);\n',
      'utf-8',
    );
    writeFileSync(
      join(repositoryRoot, 'package.json'),
      JSON.stringify({
        name: 'bws-root-wrapper-runtime-fixture',
        private: true,
        scripts: {
          build: 'node -e "require(\'node:fs\').mkdirSync(\'markers\',{recursive:true});require(\'node:fs\').writeFileSync(\'markers/build.txt\',\'ok\\\\n\')"',
          'build:runtime-cockpit': 'node -e "require(\'node:fs\').writeFileSync(\'markers/cockpit.txt\',\'ok\\\\n\')"',
        },
      }, null, 2) + '\n',
      'utf-8',
    );
    writeFileSync(
      join(repositoryRoot, 'dist', 'packages', 'bootstrap', 'src', 'cli', 'bws-operator-lifecycle.js'),
      [
        'const command = process.argv[2];',
        'process.stdout.write(JSON.stringify({ command, evidenceFile: "runtime/bws-operator-lifecycle/evidence/latest.json" }, null, 2) + "\\n");',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(
      join(repositoryRoot, '.env'),
      [
        'POSTGRES_ADDRESS=127.0.0.1:5432',
        'POSTGRES_USER=betting_win',
        'POSTGRES_PASSWORD=password-from-env',
        'POSTGRES_DB=betting_win_surebet',
        '',
      ].join('\n'),
      'utf-8',
    );

    const startOutput = execFileSync('bash', ['start.sh'], {
      cwd: repositoryRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.match(startOutput, /NODE_OK=v/);
    assert.match(startOutput, /"command": "start"/);
    assert.equal(readFileSync(join(repositoryRoot, 'markers', 'build.txt'), 'utf-8'), 'ok\n');
    assert.equal(readFileSync(join(repositoryRoot, 'markers', 'cockpit.txt'), 'utf-8'), 'ok\n');

    const stopOutput = execFileSync('bash', ['stop.sh'], {
      cwd: repositoryRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    assert.match(stopOutput, /NODE_OK=v/);
    assert.match(stopOutput, /"command": "stop"/);
  } finally {
    rmSync(repositoryRoot, { force: true, recursive: true });
  }
});

test('paper runtime-evidence wrapper fills selected .env values and enforces the fixed paper-safe API policy', () => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'bws-root-paper-runtime-evidence-'));
  try {
    mkdirSync(join(repositoryRoot, 'scripts'), { recursive: true });
    mkdirSync(join(repositoryRoot, 'dist', 'packages', 'bootstrap', 'src', 'cli'), { recursive: true });
    copyFileSync(
      join(REPO_ROOT, 'scripts', 'bws-root-wrapper-runtime.mjs'),
      join(repositoryRoot, 'scripts', 'bws-root-wrapper-runtime.mjs'),
    );
    writeFileSync(
      join(repositoryRoot, '.env'),
      [
        'POSTGRES_ADDRESS=127.0.0.1:5433',
        'POSTGRES_USER=user-from-env',
        'POSTGRES_PASSWORD=password-from-env',
        'POSTGRES_DB=database-from-env',
        'BWS_API_PORT=4321',
        'BWS_PRIVATE_PAPER_SCHEDULE_PATH=runtime/operator-inputs/bws.private-paper-schedule.json',
        'SUREBET_RUNTIME_MODE=live',
        'SUREBET_PROVIDER_CONNECTIONS=enabled',
        'SUREBET_EXECUTION_ENABLED=true',
        'UNRELATED_PRIVATE_VALUE=must-not-load',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(
      join(repositoryRoot, 'dist', 'packages', 'bootstrap', 'src', 'cli', 'bws-paper-runtime-evidence.js'),
      [
        "process.stdout.write(JSON.stringify({",
        "  apiPort: process.env.BWS_API_PORT,",
        "  argv: process.argv.slice(2),",
        "  database: process.env.SUREBET_PG_DATABASE,",
        "  dbHost: process.env.SUREBET_PG_HOST,",
        "  dbPassword: process.env.SUREBET_PG_PASSWORD,",
        "  dbPort: process.env.SUREBET_PG_PORT,",
        "  dbUser: process.env.SUREBET_PG_USER,",
        "  executionEnabled: process.env.SUREBET_EXECUTION_ENABLED,",
        "  exportFile: process.env.BWS_UPSTREAM_EXPORT_FILE,",
        "  exportPath: process.env.BWS_UPSTREAM_EXPORT_PATH,",
        "  exportSelection: process.env.BWS_UPSTREAM_EXPORT_SELECTION_PATH,",
        "  mode: process.env.BWS_UPSTREAM_MODE,",
        "  pinnedBundle: process.env.SUREBET_PINNED_BUNDLE,",
        "  pinnedExport: process.env.BWS_PINNED_EXPORT_PATH,",
        "  providerConnections: process.env.SUREBET_PROVIDER_CONNECTIONS,",
        "  runtimeMode: process.env.SUREBET_RUNTIME_MODE,",
        "  schedulePath: process.env.BWS_PRIVATE_PAPER_SCHEDULE_PATH,",
        "  unrelated: process.env.UNRELATED_PRIVATE_VALUE,",
        "}));",
        '',
      ].join('\n'),
      'utf-8',
    );

    const output = execFileSync(
      'node',
      ['scripts/bws-root-wrapper-runtime.mjs', 'paper-runtime-evidence', '--output', 'artifacts/result.json'],
      {
        cwd: repositoryRoot,
        encoding: 'utf-8',
        env: {
          ...createSanitizedRuntimeEnvironment(),
          BWS_API_PORT: '4999',
          BWS_PINNED_EXPORT_PATH: 'config/stale-pinned-export.json',
          BWS_UPSTREAM_EXPORT_FILE: 'runtime/stale-export.json',
          BWS_UPSTREAM_EXPORT_PATH: 'runtime/stale-export-directory',
          BWS_UPSTREAM_EXPORT_SELECTION_PATH: 'config/stale-export.json',
          BWS_UPSTREAM_MODE: 'export',
          SUREBET_EXECUTION_ENABLED: 'true',
          SUREBET_PINNED_BUNDLE: 'tests/fixtures/stale-bundle.json',
          SUREBET_PROVIDER_CONNECTIONS: 'enabled',
          SUREBET_RUNTIME_MODE: 'live',
        },
      },
    );
    const parsed = JSON.parse(output) as Readonly<Record<string, unknown>>;
    assert.equal(parsed.apiPort, '4999');
    assert.deepEqual(parsed.argv, ['--output', 'artifacts/result.json']);
    assert.equal(parsed.database, 'database-from-env');
    assert.equal(parsed.dbHost, '127.0.0.1');
    assert.equal(parsed.dbPassword, 'password-from-env');
    assert.equal(parsed.dbPort, '5433');
    assert.equal(parsed.dbUser, 'user-from-env');
    assert.equal(parsed.executionEnabled, 'false');
    assert.equal(parsed.exportFile, undefined);
    assert.equal(parsed.exportPath, undefined);
    assert.equal(parsed.exportSelection, undefined);
    assert.equal(parsed.mode, 'api');
    assert.equal(parsed.pinnedBundle, undefined);
    assert.equal(parsed.pinnedExport, undefined);
    assert.equal(parsed.providerConnections, 'disabled');
    assert.equal(parsed.runtimeMode, 'paper');
    assert.equal(parsed.schedulePath, 'runtime/operator-inputs/bws.private-paper-schedule.json');
    assert.equal(parsed.unrelated, undefined);
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});


test('paper runtime-evidence wrapper rejects retired DB_URL settings', () => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'bws-root-retired-db-url-'));
  try {
    mkdirSync(join(repositoryRoot, 'scripts'), { recursive: true });
    mkdirSync(join(repositoryRoot, 'dist', 'packages', 'bootstrap', 'src', 'cli'), { recursive: true });
    copyFileSync(
      join(REPO_ROOT, 'scripts', 'bws-root-wrapper-runtime.mjs'),
      join(repositoryRoot, 'scripts', 'bws-root-wrapper-runtime.mjs'),
    );
    writeFileSync(
      join(repositoryRoot, '.env'),
      [
        ['DB_URL=postgresql', '://betting_win:do-not-print@127.0.0.1:5432/betting_win_surebet'].join(''),
        'POSTGRES_ADDRESS=127.0.0.1:5432',
        'POSTGRES_USER=betting_win',
        'POSTGRES_PASSWORD=password-from-env',
        'POSTGRES_DB=betting_win_surebet',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(
      join(repositoryRoot, 'dist', 'packages', 'bootstrap', 'src', 'cli', 'bws-paper-runtime-evidence.js'),
      'process.stdout.write("unexpected");\n',
      'utf-8',
    );

    assert.throws(
      () => execFileSync(
        'node',
        ['scripts/bws-root-wrapper-runtime.mjs', 'paper-runtime-evidence', '--output', 'artifacts/result.json'],
        {
          cwd: repositoryRoot,
          encoding: 'utf-8',
          env: createSanitizedRuntimeEnvironment(),
          stdio: 'pipe',
        },
      ),
      /DB_URL is retired for BWS runtime configuration/,
    );
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

async function createRuntimeFixture(options: Readonly<{
  readonly envOverrides?: Readonly<Record<string, string>>;
}> = {}): Promise<{
  readonly dispose: () => Promise<void>;
  readonly repositoryRoot: string;
}> {
  const root = mkdtempSync(join(tmpdir(), 'bws-root-runtime-'));
  const repositoryRoot = join(root, 'repo');
  const upstreamRoot = join(root, 'betting-win');
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  mkdirSync(join(repositoryRoot, 'scripts'), { recursive: true });

  copyFileSync(join(REPO_ROOT, 'check_progress.sh'), join(repositoryRoot, 'check_progress.sh'));
  copyFileSync(join(REPO_ROOT, 'open_log.sh'), join(repositoryRoot, 'open_log.sh'));
  copyFileSync(join(REPO_ROOT, 'watch_progress.sh'), join(repositoryRoot, 'watch_progress.sh'));
  copyFileSync(
    join(REPO_ROOT, 'scripts', 'bws-root-wrapper-runtime.mjs'),
    join(repositoryRoot, 'scripts', 'bws-root-wrapper-runtime.mjs'),
  );

  const server = createServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.url === '/health') {
      response.end(JSON.stringify({ status: 'healthy' }));
      return;
    }
    if (request.url === '/readiness') {
      response.end(JSON.stringify({ status: 'ready' }));
      return;
    }
    if (request.url === '/metrics') {
      response.end(JSON.stringify({
        runtime: { lifecycleState: 'running' },
        scheduler: { lifecycleState: 'running' },
        schema: 'bws.metrics_snapshot.v1',
        upstream: { lifecycleState: 'running', mode: 'api' },
        worker: { lifecycleState: 'running' },
      }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });
  server.listen(0, '127.0.0.1');
  await new Promise<void>((resolveReady) => server.once('listening', () => resolveReady()));
  const port = (server.address() as AddressInfo).port;

  mkdirSync(join(repositoryRoot, 'artifacts', 'autonomous_implementation_20260716T000000Z', 'cycles', 'cycle_1'), {
    recursive: true,
  });
  writeFileSync(
    join(repositoryRoot, 'artifacts', 'autonomous_implementation_20260716T000000Z', 'final-summary.md'),
    '# final summary\n',
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'artifacts', 'autonomous_implementation_20260716T000000Z', 'controller.log'),
    'controller line\n',
    'utf-8',
  );

  mkdirSync(join(repositoryRoot, 'runtime', 'bws-operator-lifecycle', 'evidence'), { recursive: true });
  mkdirSync(join(repositoryRoot, 'runtime', 'bws-observability', 'evidence'), { recursive: true });
  mkdirSync(join(repositoryRoot, 'runtime', 'bws-observability', 'logs'), { recursive: true });

  writeFileSync(
    join(repositoryRoot, 'runtime', 'bws-operator-lifecycle', 'state.json'),
    JSON.stringify({
      configuration: {
        api: { bindHost: '127.0.0.1', port },
        persistence: {
          database: 'surebet_local',
          host: '127.0.0.1',
          port: 5432,
          user: 'surebet',
        },
        policy: {
          executionEnabled: false,
          providerConnections: 'disabled',
          runtimeMode: 'paper',
        },
        upstream: {
          lockPath: 'config/betting-win.upstream.lock.json',
          repositoryPath: upstreamRoot,
        },
        worker: {
          leaseDurationMs: 30000,
          queueName: 'private-paper',
          workerId: 'worker-local-001',
        },
      },
      repositoryRoot,
      runtimeBaseUrl: `http://127.0.0.1:${port}`,
      runtimeId: 'runtime-local-001',
      stateRecordedAt: '2026-07-16T08:40:00.000Z',
    }, null, 2) + '\n',
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'runtime', 'bws-operator-lifecycle', 'evidence', 'latest.json'),
    JSON.stringify({
      outcome: 'running',
      stack: {
        components: {
          api: 'ready',
          cockpit: 'ready',
          private_paper_scheduler: 'ready',
          private_paper_worker: 'ready',
          upstream_convergence: 'ready',
        },
        healthStatus: 'healthy',
        readinessStatus: 'ready',
      },
    }, null, 2) + '\n',
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'runtime', 'bws-observability', 'evidence', 'latest.json'),
    JSON.stringify({ entryCount: 2 }, null, 2) + '\n',
    'utf-8',
  );
  writeFileSync(
    join(repositoryRoot, 'runtime', 'bws-observability', 'logs', 'lifecycle.jsonl'),
    '{"eventCode":"lifecycle_event"}\n',
    'utf-8',
  );

  const envValues = Object.freeze({
    BETTING_WIN_REPO_PATH: upstreamRoot,
    BWS_API_PORT: options.envOverrides?.BWS_API_PORT ?? String(port),
    BWS_UPSTREAM_LOCK_PATH: 'config/betting-win.upstream.lock.json',
    BWS_UPSTREAM_MODE: 'export', // stale private selector must be ignored by API-only runtime
    BWS_WORKER_ID: 'worker-local-001',
    BWS_WORKER_LEASE_DURATION_MS: '30000',
    BWS_WORKER_QUEUE_NAME: 'private-paper',
    POSTGRES_ADDRESS: '127.0.0.1:5432',
    POSTGRES_DB: 'surebet_local',
    POSTGRES_PASSWORD: 'secret-local-password',
    POSTGRES_USER: 'surebet',
    SUREBET_EXECUTION_ENABLED: 'false',
    SUREBET_PROVIDER_CONNECTIONS: 'disabled',
    SUREBET_RUNTIME_MODE: 'paper',
    ...(options.envOverrides ?? {}),
  });
  writeFileSync(
    join(repositoryRoot, '.env'),
    Object.entries(envValues).map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
    'utf-8',
  );

  return Object.freeze({
    async dispose() {
      await new Promise<void>((resolveDone, rejectDone) => {
        server.close((error) => {
          if (error) {
            rejectDone(error);
            return;
          }
          resolveDone();
        });
      });
      rmSync(root, { force: true, recursive: true });
    },
    repositoryRoot,
  });
}

function execFileText(
  command: string,
  argumentsList: readonly string[],
  options: Readonly<{
    readonly cwd: string;
  }>,
): Promise<string> {
  return awaitable((resolvePromise, rejectPromise) => {
    execFile(
      command,
      [...argumentsList],
      {
        cwd: options.cwd,
        encoding: 'utf-8',
        env: createSanitizedRuntimeEnvironment(),
      },
      (
        error: Error | null,
        stdout: string | Buffer,
        stderr: string | Buffer,
      ) => {
        if (error) {
          rejectPromise(new Error(`${stdout ?? ''}${stderr ?? ''}`));
          return;
        }
        resolvePromise(String(stdout));
      },
    );
  });
}

function awaitable<T>(
  executor: (
    resolvePromise: (value: T) => void,
    rejectPromise: (error: Error) => void,
  ) => void,
): Promise<T> {
  return new Promise<T>((resolvePromise, rejectPromise) => {
    executor(resolvePromise, rejectPromise);
  });
}

function createSanitizedRuntimeEnvironment(): NodeJS.ProcessEnv {
  const sanitized = { ...process.env };
  for (const key of Object.keys(sanitized)) {
    if (RUNTIME_ENVIRONMENT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      delete sanitized[key];
    }
  }
  return sanitized;
}
