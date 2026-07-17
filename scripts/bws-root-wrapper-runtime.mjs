import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { request as requestHttp } from 'node:http';
import { request as requestHttps } from 'node:https';
import { resolve, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const REPOSITORY_ROOT = process.cwd();
const ENV_FILE_PATH = resolve(REPOSITORY_ROOT, '.env');
const LIFECYCLE_STATE_FILE = resolve(REPOSITORY_ROOT, 'runtime/bws-operator-lifecycle/state.json');
const LIFECYCLE_EVIDENCE_FILE = resolve(REPOSITORY_ROOT, 'runtime/bws-operator-lifecycle/evidence/latest.json');
const EVIDENCE_INDEX_SUMMARY_FILE = resolve(REPOSITORY_ROOT, 'runtime/bws-observability/evidence/latest.json');
const STRUCTURED_LOG_DIRECTORY = resolve(REPOSITORY_ROOT, 'runtime/bws-observability/logs');
const RUNTIME_ENVIRONMENT_KEYS = Object.freeze([
  'BETTING_WIN_REPO_PATH',
  'BWS_API_PORT',
  'BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH',
  'BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS',
  'BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS',
  'BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_API_BASE_URL',
  'BWS_UPSTREAM_API_CHECKPOINT_ID',
  'BWS_UPSTREAM_API_CONTRACT_VERSION',
  'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE',
  'BWS_UPSTREAM_API_PAGE_SIZE',
  'BWS_UPSTREAM_API_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_API_RETRY_LIMIT',
  'BWS_UPSTREAM_API_TIMEOUT_MS',
  'BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS',
  'BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS',
  'BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS',
  'BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_LOCK_PATH',
  'BWS_WORKER_ID',
  'BWS_WORKER_LEASE_DURATION_MS',
  'BWS_WORKER_QUEUE_NAME',
  'SUREBET_EXECUTION_ENABLED',
  'SUREBET_PG_DATABASE',
  'SUREBET_PG_HOST',
  'SUREBET_PG_PASSWORD',
  'SUREBET_PG_PORT',
  'SUREBET_PG_SOCKET_DIRECTORY',
  'SUREBET_PG_USER',
  'SUREBET_PROVIDER_CONNECTIONS',
  'SUREBET_RUNTIME_MODE',
  'VITE_BWS_COCKPIT_API_BASE_URL',
  'VITE_BWS_COCKPIT_DATA_MODE',
]);
const RUNTIME_LOG_ROLES = Object.freeze([
  'api',
  'cockpit',
  'lifecycle',
  'private_paper_scheduler',
  'private_paper_worker',
  'upstream_convergence',
]);

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'start':
      runLifecycleStart();
      return;
    case 'stop':
      runLifecycleStop();
      return;
    case 'paper-runtime-evidence':
      runPaperRuntimeEvidence(rest);
      return;
    case 'runtime-summary':
      await printRuntimeSummary();
      return;
    case 'runtime-log-path':
      printRuntimeLogPath(rest);
      return;
    default:
      fail(
        'Usage: node scripts/bws-root-wrapper-runtime.mjs <start|stop|paper-runtime-evidence|runtime-summary|runtime-log-path>',
      );
  }
}

function runLifecycleStart() {
  const environment = resolveRuntimeEnvironment();
  runCommand('npm', ['run', '--silent', 'build'], environment, 'BWS root build failed.');
  runCommand(
    'npm',
    ['run', '--silent', 'build:runtime-cockpit'],
    environment,
    'BWS runtime cockpit build failed.',
  );
  const cliPath = resolve(
    REPOSITORY_ROOT,
    'dist/packages/bootstrap/src/cli/bws-operator-lifecycle.js',
  );
  if (!existsSync(cliPath)) {
    fail(`Missing lifecycle CLI after build: ${relative(REPOSITORY_ROOT, cliPath)}`);
  }
  const output = runCommand(
    'node',
    [cliPath, 'start'],
    environment,
    'BWS lifecycle start failed.',
    true,
  );
  process.stdout.write(output);
}

function runPaperRuntimeEvidence(argumentsList) {
  const environment = resolveRuntimeEnvironment();
  const cliPath = resolve(
    REPOSITORY_ROOT,
    'dist/packages/bootstrap/src/cli/bws-paper-runtime-evidence.js',
  );
  if (!existsSync(cliPath)) {
    fail(
      `Missing paper runtime-evidence CLI: ${relative(REPOSITORY_ROOT, cliPath)}. Run npm run build first.`,
    );
  }
  const output = runCommand(
    'node',
    [cliPath, ...argumentsList],
    environment,
    'BWS paper runtime evidence failed.',
    true,
  );
  process.stdout.write(output);
}

function runLifecycleStop() {
  const environment = resolveRuntimeEnvironment();
  const cliPath = resolve(
    REPOSITORY_ROOT,
    'dist/packages/bootstrap/src/cli/bws-operator-lifecycle.js',
  );
  if (!existsSync(cliPath)) {
    fail(
      `Missing lifecycle CLI: ${relative(REPOSITORY_ROOT, cliPath)}. Run ./start.sh or npm run build first.`,
    );
  }
  const output = runCommand(
    'node',
    [cliPath, 'stop'],
    environment,
    'BWS lifecycle stop failed.',
    true,
  );
  process.stdout.write(output);
}

async function printRuntimeSummary() {
  const summary = await createRuntimeSummary();
  process.stdout.write(renderRuntimeSummary(summary));
}

function printRuntimeLogPath(argumentsList) {
  const role = argumentsList[0] === undefined ? 'lifecycle' : argumentsList[0];
  if (!RUNTIME_LOG_ROLES.includes(role)) {
    fail(`Unsupported runtime log role: ${role}`);
  }
  const logFilePath = resolve(STRUCTURED_LOG_DIRECTORY, `${role}.jsonl`);
  if (!existsSync(logFilePath)) {
    fail(`Runtime log not found: ${relative(REPOSITORY_ROOT, logFilePath)}`);
  }
  process.stdout.write(`${logFilePath}\n`);
}

function resolveRuntimeEnvironment() {
  const fileEnvironment = readSelectedEnvFile(ENV_FILE_PATH, RUNTIME_ENVIRONMENT_KEYS);
  const merged = { ...process.env };
  for (const key of RUNTIME_ENVIRONMENT_KEYS) {
    if (fileEnvironment.has(key)) {
      merged[key] = fileEnvironment.get(key);
    }
  }
  merged.BWS_UPSTREAM_MODE = 'api';
  delete merged.BWS_UPSTREAM_EXPORT_SELECTION_PATH;
  return merged;
}

async function createRuntimeSummary() {
  if (!existsSync(LIFECYCLE_STATE_FILE)) {
    return Object.freeze({
      condition: 'not_running',
      evidenceIndexSummaryFile: relative(REPOSITORY_ROOT, EVIDENCE_INDEX_SUMMARY_FILE),
      lifecycleEvidenceFile: relative(REPOSITORY_ROOT, LIFECYCLE_EVIDENCE_FILE),
      logFiles: readStructuredLogFiles(),
      logsDirectory: relative(REPOSITORY_ROOT, STRUCTURED_LOG_DIRECTORY),
      schema: 'bws.root_wrapper_runtime_summary.v1',
      state: 'absent',
      stateFile: relative(REPOSITORY_ROOT, LIFECYCLE_STATE_FILE),
    });
  }

  const environment = resolveRuntimeEnvironment();
  const state = JSON.parse(readFileSync(LIFECYCLE_STATE_FILE, 'utf-8'));
  const lifecycleEvidence = readOptionalJsonFile(LIFECYCLE_EVIDENCE_FILE);
  const evidenceIndexSummary = readOptionalJsonFile(EVIDENCE_INDEX_SUMMARY_FILE);
  const metricsUrl = new URL('/metrics', state.runtimeBaseUrl).toString();
  const healthUrl = new URL('/health', state.runtimeBaseUrl).toString();
  const readinessUrl = new URL('/readiness', state.runtimeBaseUrl).toString();
  const [metricsProbe, healthProbe, readinessProbe] = await Promise.all([
    fetchJson(metricsUrl),
    fetchJson(healthUrl),
    fetchJson(readinessUrl),
  ]);
  const configurationCheck = compareStateWithEnvironment(state, environment, metricsProbe);
  const condition = classifyRuntimeCondition(
    configurationCheck.status,
    lifecycleEvidence,
    metricsProbe,
    healthProbe,
    readinessProbe,
  );

  return Object.freeze({
    condition,
    configurationCheck,
    evidenceIndexSummary,
    evidenceIndexSummaryFile: relative(REPOSITORY_ROOT, EVIDENCE_INDEX_SUMMARY_FILE),
    healthProbe,
    lifecycleEvidence,
    lifecycleEvidenceFile: relative(REPOSITORY_ROOT, LIFECYCLE_EVIDENCE_FILE),
    logFiles: readStructuredLogFiles(),
    logsDirectory: relative(REPOSITORY_ROOT, STRUCTURED_LOG_DIRECTORY),
    metricsProbe,
    readinessProbe,
    repositoryRootMatches: state.repositoryRoot === REPOSITORY_ROOT,
    runtimeBaseUrl: state.runtimeBaseUrl,
    runtimeId: typeof state.runtimeId === 'string' ? state.runtimeId : undefined,
    schema: 'bws.root_wrapper_runtime_summary.v1',
    state: 'present',
    stateFile: relative(REPOSITORY_ROOT, LIFECYCLE_STATE_FILE),
    stateRecordedAt: state.stateRecordedAt,
    summary: summarizeState(state, lifecycleEvidence, metricsProbe),
  });
}

function summarizeState(state, lifecycleEvidence, metricsProbe) {
  const metrics = metricsProbe.ok === true ? metricsProbe.value : undefined;
  const lifecycleStack = lifecycleEvidence !== undefined && typeof lifecycleEvidence === 'object'
    ? lifecycleEvidence.stack
    : undefined;
  return Object.freeze({
    apiComponent: readObjectStringField(lifecycleStack, 'components', 'api'),
    cockpitComponent: readObjectStringField(lifecycleStack, 'components', 'cockpit'),
    healthStatus: readObjectStringField(lifecycleStack, 'healthStatus'),
    readinessStatus: readObjectStringField(lifecycleStack, 'readinessStatus'),
    schedulerComponent: readObjectStringField(lifecycleStack, 'components', 'private_paper_scheduler'),
    schedulerLifecycleState: readObjectStringField(metrics, 'scheduler', 'lifecycleState'),
    upstreamComponent: readObjectStringField(lifecycleStack, 'components', 'upstream_convergence'),
    upstreamLifecycleState: readObjectStringField(metrics, 'upstream', 'lifecycleState'),
    upstreamMode: readObjectStringField(metrics, 'upstream', 'mode'),
    workerComponent: readObjectStringField(lifecycleStack, 'components', 'private_paper_worker'),
    workerLifecycleState: readObjectStringField(metrics, 'worker', 'lifecycleState'),
  });
}

function compareStateWithEnvironment(state, environment, metricsProbe) {
  const mismatches = [];
  compareResolvedPath(
    mismatches,
    'BETTING_WIN_REPO_PATH',
    environment.BETTING_WIN_REPO_PATH,
    readObjectStringField(state, 'configuration', 'upstream', 'repositoryPath'),
  );
  compareResolvedPath(
    mismatches,
    'BWS_UPSTREAM_LOCK_PATH',
    environment.BWS_UPSTREAM_LOCK_PATH,
    readObjectStringField(state, 'configuration', 'upstream', 'lockPath'),
  );
  compareExact(
    mismatches,
    'BWS_API_PORT',
    environment.BWS_API_PORT,
    readObjectStringField(state, 'configuration', 'api', 'port'),
  );
  compareExact(
    mismatches,
    'BWS_WORKER_ID',
    environment.BWS_WORKER_ID,
    readObjectStringField(state, 'configuration', 'worker', 'workerId'),
  );
  compareExact(
    mismatches,
    'BWS_WORKER_QUEUE_NAME',
    environment.BWS_WORKER_QUEUE_NAME,
    readObjectStringField(state, 'configuration', 'worker', 'queueName'),
  );
  compareExact(
    mismatches,
    'BWS_WORKER_LEASE_DURATION_MS',
    environment.BWS_WORKER_LEASE_DURATION_MS,
    readObjectStringField(state, 'configuration', 'worker', 'leaseDurationMs'),
  );
  compareExact(
    mismatches,
    'SUREBET_RUNTIME_MODE',
    environment.SUREBET_RUNTIME_MODE,
    readObjectStringField(state, 'configuration', 'policy', 'runtimeMode'),
  );
  compareExact(
    mismatches,
    'SUREBET_PROVIDER_CONNECTIONS',
    environment.SUREBET_PROVIDER_CONNECTIONS,
    readObjectStringField(state, 'configuration', 'policy', 'providerConnections'),
  );
  compareExact(
    mismatches,
    'SUREBET_EXECUTION_ENABLED',
    environment.SUREBET_EXECUTION_ENABLED,
    readObjectStringField(state, 'configuration', 'policy', 'executionEnabled'),
  );
  compareExact(
    mismatches,
    'SUREBET_PG_DATABASE',
    environment.SUREBET_PG_DATABASE,
    readObjectStringField(state, 'configuration', 'persistence', 'database'),
  );
  compareExact(
    mismatches,
    'SUREBET_PG_USER',
    environment.SUREBET_PG_USER,
    readObjectStringField(state, 'configuration', 'persistence', 'user'),
  );
  compareExact(
    mismatches,
    'SUREBET_PG_PORT',
    environment.SUREBET_PG_PORT,
    readObjectStringField(state, 'configuration', 'persistence', 'port'),
  );
  compareExact(
    mismatches,
    'SUREBET_PG_HOST',
    environment.SUREBET_PG_HOST,
    readObjectStringField(state, 'configuration', 'persistence', 'host'),
  );
  compareExact(
    mismatches,
    'SUREBET_PG_SOCKET_DIRECTORY',
    environment.SUREBET_PG_SOCKET_DIRECTORY,
    readObjectStringField(state, 'configuration', 'persistence', 'socketDirectory'),
  );
  const actualMode = metricsProbe.ok === true
    ? readObjectStringField(metricsProbe.value, 'upstream', 'mode')
    : undefined;
  if (actualMode !== undefined && actualMode !== 'api') {
    mismatches.push(`upstream_mode_expected=api actual=${actualMode}`);
  }
  const comparedKeys = RUNTIME_ENVIRONMENT_KEYS.filter((key) => readProcessValue(key, environment) !== undefined);
  return Object.freeze({
    comparedKeys,
    mismatches: Object.freeze(mismatches),
    status: mismatches.length > 0 ? 'mismatched' : comparedKeys.length > 0 ? 'matched' : 'unverified',
  });
}

function classifyRuntimeCondition(
  configurationStatus,
  lifecycleEvidence,
  metricsProbe,
  healthProbe,
  readinessProbe,
) {
  if (configurationStatus === 'mismatched') {
    return 'blocked';
  }
  if (readObjectStringField(lifecycleEvidence, 'outcome') === 'degraded') {
    return 'degraded';
  }
  if (readObjectStringField(lifecycleEvidence, 'stack', 'healthStatus') === 'degraded') {
    return 'degraded';
  }
  if (readObjectStringField(lifecycleEvidence, 'stack', 'readinessStatus') === 'blocked') {
    return 'degraded';
  }
  if (healthProbe.ok !== true || readinessProbe.ok !== true || metricsProbe.ok !== true) {
    return 'degraded';
  }
  if (readObjectStringField(healthProbe.value, 'status') !== 'healthy') {
    return 'degraded';
  }
  if (readObjectStringField(readinessProbe.value, 'status') !== 'ready') {
    return 'degraded';
  }
  if (readObjectStringField(metricsProbe.value, 'runtime', 'lifecycleState') !== 'running') {
    return 'degraded';
  }
  return configurationStatus === 'matched' ? 'ready' : 'unverified';
}

function renderRuntimeSummary(summary) {
  const lines = [
    '== runtime ==',
    `runtime_source=${summary.state === 'present' ? 'product_runtime_state' : 'product_runtime_state_absent'}`,
    `runtime_summary_schema=${summary.schema}`,
    `runtime_state=${summary.state}`,
    `runtime_condition=${summary.condition}`,
    `runtime_state_file=${summary.stateFile}`,
    `runtime_latest_lifecycle_evidence=${summary.lifecycleEvidenceFile}`,
    `runtime_latest_evidence_index=${summary.evidenceIndexSummaryFile}`,
    `runtime_logs_directory=${summary.logsDirectory}`,
  ];
  if (summary.state !== 'present') {
    for (const logFile of summary.logFiles) {
      lines.push(`runtime_log_file=${logFile}`);
    }
    return `${lines.join('\n')}\n`;
  }

  lines.push(`runtime_runtime_id=${summary.runtimeId ?? 'missing'}`);
  lines.push(`runtime_base_url=${summary.runtimeBaseUrl}`);
  lines.push(`runtime_state_recorded_at=${summary.stateRecordedAt}`);
  lines.push(`runtime_repository_match=${summary.repositoryRootMatches === true ? 'yes' : 'no'}`);
  lines.push(`runtime_configuration_status=${summary.configurationCheck.status}`);
  lines.push(
    `runtime_configuration_mismatches=${
      summary.configurationCheck.mismatches.length > 0
        ? summary.configurationCheck.mismatches.join(';')
        : 'none'
    }`,
  );
  lines.push(`runtime_health_probe=${formatProbeStatus(summary.healthProbe)}`);
  lines.push(`runtime_readiness_probe=${formatProbeStatus(summary.readinessProbe)}`);
  lines.push(`runtime_metrics_probe=${formatProbeStatus(summary.metricsProbe)}`);
  lines.push(`runtime_health=${summary.summary.healthStatus ?? 'unknown'}`);
  lines.push(`runtime_readiness=${summary.summary.readinessStatus ?? 'unknown'}`);
  lines.push(`runtime_component_api=${summary.summary.apiComponent ?? 'unknown'}`);
  lines.push(`runtime_component_cockpit=${summary.summary.cockpitComponent ?? 'unknown'}`);
  lines.push(`runtime_component_private_paper_scheduler=${summary.summary.schedulerComponent ?? 'unknown'}`);
  lines.push(`runtime_component_private_paper_worker=${summary.summary.workerComponent ?? 'unknown'}`);
  lines.push(`runtime_component_upstream_convergence=${summary.summary.upstreamComponent ?? 'unknown'}`);
  lines.push(`runtime_scheduler_lifecycle_state=${summary.summary.schedulerLifecycleState ?? 'unknown'}`);
  lines.push(`runtime_worker_lifecycle_state=${summary.summary.workerLifecycleState ?? 'unknown'}`);
  lines.push(`runtime_upstream_lifecycle_state=${summary.summary.upstreamLifecycleState ?? 'unknown'}`);
  lines.push(`runtime_upstream_mode=${summary.summary.upstreamMode ?? 'unknown'}`);
  lines.push(`runtime_lifecycle_outcome=${readObjectStringField(summary.lifecycleEvidence, 'outcome') ?? 'missing'}`);
  lines.push(`runtime_evidence_index_entry_count=${readObjectNumberField(summary.evidenceIndexSummary, 'entryCount') ?? 'unknown'}`);
  for (const logFile of summary.logFiles) {
    lines.push(`runtime_log_file=${logFile}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatProbeStatus(probe) {
  if (probe.ok === true) {
    return `ok:${probe.statusCode}`;
  }
  return `error:${probe.error}`;
}

function readStructuredLogFiles() {
  if (!existsSync(STRUCTURED_LOG_DIRECTORY)) {
    return Object.freeze([]);
  }
  return Object.freeze(
    readdirSync(STRUCTURED_LOG_DIRECTORY)
      .filter((entry) => entry.endsWith('.jsonl') || entry.includes('.jsonl.'))
      .sort()
      .map((entry) => relative(REPOSITORY_ROOT, join(STRUCTURED_LOG_DIRECTORY, entry))),
  );
}

function readOptionalJsonFile(filePath) {
  if (!existsSync(filePath)) {
    return undefined;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

async function fetchJson(url) {
  return await new Promise((resolvePromise) => {
    const target = new URL(url);
    const requestFactory = target.protocol === 'https:' ? requestHttps : requestHttp;
    const request = requestFactory(
      target,
      {
        headers: Object.freeze({ accept: 'application/json' }),
        timeout: 2000,
      },
      (response) => {
        const chunks = [];
        response.setEncoding('utf-8');
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          try {
            const body = JSON.parse(chunks.join(''));
            resolvePromise(Object.freeze({
              ok: (response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300,
              statusCode: response.statusCode ?? 500,
              value: body,
            }));
          } catch (error) {
            resolvePromise(Object.freeze({
              error: error instanceof Error ? error.message : String(error),
              ok: false,
            }));
          }
        });
      },
    );
    request.on('timeout', () => {
      request.destroy(new Error('timeout'));
    });
    request.on('error', (error) => {
      resolvePromise(Object.freeze({
        error: error instanceof Error ? error.message : String(error),
        ok: false,
      }));
    });
    request.end();
  });
}

function runCommand(command, argumentsList, environment, failureMessage, captureStdout = false) {
  const result = spawnSync(command, argumentsList, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf-8',
    env: environment,
    stdio: captureStdout ? ['inherit', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.status !== 0) {
    fail(failureMessage);
  }
  return captureStdout ? result.stdout : '';
}

function readSelectedEnvFile(path, names) {
  const selectedNames = new Set(names);
  const values = new Map();
  if (!existsSync(path)) {
    return values;
  }
  const lines = readFileSync(path, 'utf-8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (match === null || !selectedNames.has(match[1])) {
      continue;
    }
    const name = match[1];
    if (values.has(name)) {
      fail(`Duplicate ${name} entries in .env are not allowed.`);
    }
    values.set(name, parseEnvFileValue(match[2], name, index + 1));
  }
  return values;
}

function parseEnvFileValue(rawValue, name, lineNumber) {
  const value = rawValue.trim();
  if (value.length === 0) {
    fail(`${name} in .env line ${lineNumber} must not be empty.`);
  }
  const first = value[0];
  const last = value[value.length - 1];
  if (first === '"' || first === "'") {
    if (last !== first || value.length < 2) {
      fail(`${name} in .env line ${lineNumber} has mismatched quotes.`);
    }
    return value.slice(1, -1);
  }
  if (value.includes(' ')) {
    fail(`${name} in .env line ${lineNumber} must be quoted when it contains spaces.`);
  }
  return value;
}

function readProcessValue(name, source = process.env) {
  const value = source[name];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function compareResolvedPath(mismatches, key, expected, actual) {
  if (expected === undefined) {
    return;
  }
  if (actual === undefined) {
    mismatches.push(`${key}=missing`);
    return;
  }
  const normalizedExpected = resolve(REPOSITORY_ROOT, expected);
  const normalizedActual = resolve(REPOSITORY_ROOT, actual);
  if (normalizedExpected !== normalizedActual) {
    mismatches.push(`${key}=expected:${expected},actual:${actual}`);
  }
}

function compareExact(mismatches, key, expected, actual) {
  if (expected === undefined) {
    return;
  }
  if (actual === undefined) {
    mismatches.push(`${key}=missing`);
    return;
  }
  if (String(expected) !== String(actual)) {
    mismatches.push(`${key}=expected:${expected},actual:${actual}`);
  }
}

function readObjectStringField(root, ...path) {
  let current = root;
  for (const segment of path) {
    if (current === null || typeof current !== 'object' || Array.isArray(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  if (typeof current === 'number' || typeof current === 'boolean') {
    return String(current);
  }
  return typeof current === 'string' ? current : undefined;
}

function readObjectNumberField(root, ...path) {
  let current = root;
  for (const segment of path) {
    if (current === null || typeof current !== 'object' || Array.isArray(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return typeof current === 'number' ? current : undefined;
}

function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(1);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
