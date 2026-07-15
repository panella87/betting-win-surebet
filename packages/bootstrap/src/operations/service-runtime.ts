import { existsSync, realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  readBettingWinUpstreamLock,
  type BettingWinUpstreamLock,
} from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import {
  resolveSurebetPersistenceConfig,
  type SurebetPersistenceConfig,
  type SurebetPersistenceEnvironment,
} from '../../../persistence/src/index.js';
import {
  describeBwsReadOnlyQueryServiceBoundary,
} from '../api/bws-read-only-query-service.js';
import {
  describeReadOnlyQueryApiClientBoundary,
} from '../adapters/betting-win-query-client.js';
import {
  accepted,
  blocked,
  type Blocker,
  type BoundaryResult,
  type IsoTimestamp,
} from '../contracts/local-types.js';

const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;
const LOOPBACK_HOST = '127.0.0.1';
const REDACTED_VALUE = '[redacted]';

export const BWS_UPSTREAM_LOCK_PATH_ENV = 'BWS_UPSTREAM_LOCK_PATH';
export const BWS_API_PORT_ENV = 'BWS_API_PORT';
export const BWS_WORKER_ID_ENV = 'BWS_WORKER_ID';
export const BWS_WORKER_QUEUE_NAME_ENV = 'BWS_WORKER_QUEUE_NAME';
export const BWS_WORKER_LEASE_DURATION_MS_ENV = 'BWS_WORKER_LEASE_DURATION_MS';
export const SUREBET_RUNTIME_MODE_ENV = 'SUREBET_RUNTIME_MODE';
export const SUREBET_PROVIDER_CONNECTIONS_ENV = 'SUREBET_PROVIDER_CONNECTIONS';
export const SUREBET_EXECUTION_ENABLED_ENV = 'SUREBET_EXECUTION_ENABLED';

const SENSITIVE_KEY_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;
const SENSITIVE_TEXT_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;

export interface BwsServiceRuntimeEnvironment extends SurebetPersistenceEnvironment {
  readonly BETTING_WIN_REPO_PATH?: string;
  readonly BWS_UPSTREAM_LOCK_PATH?: string;
  readonly BWS_API_PORT?: string;
  readonly BWS_WORKER_ID?: string;
  readonly BWS_WORKER_QUEUE_NAME?: string;
  readonly BWS_WORKER_LEASE_DURATION_MS?: string;
  readonly SUREBET_RUNTIME_MODE?: string;
  readonly SUREBET_PROVIDER_CONNECTIONS?: string;
  readonly SUREBET_EXECUTION_ENABLED?: string;
}

export interface BwsProcessNetworkBinding {
  readonly exposure: 'loopback_only';
  readonly host: typeof LOOPBACK_HOST;
  readonly port: number;
  readonly protocol: 'http';
  readonly purpose: 'health' | 'read_only_query_api';
}

export interface BwsProcessDefinition {
  readonly automaticFallback: 'forbidden';
  readonly boundary: string;
  readonly execution: 'disabled';
  readonly exposure: 'browser_only' | 'loopback_only' | 'no_listener';
  readonly networkBindings: readonly BwsProcessNetworkBinding[];
  readonly processName: string;
  readonly providerConnections: 'disabled';
  readonly requiredEnvironmentKeys: readonly string[];
  readonly role: 'api' | 'cockpit' | 'worker';
  readonly notes: readonly string[];
}

export interface BwsServiceRuntimeConfig {
  readonly api: Readonly<{
    readonly bindHost: typeof LOOPBACK_HOST;
    readonly port: number;
  }>;
  readonly persistence: SurebetPersistenceConfig;
  readonly policy: Readonly<{
    readonly executionEnabled: false;
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
  }>;
  readonly processDefinitions: readonly BwsProcessDefinition[];
  readonly upstream: Readonly<{
    readonly lock: BettingWinUpstreamLock;
    readonly lockPath: string;
    readonly repoPath: string;
  }>;
  readonly worker: Readonly<{
    readonly leaseDurationMs: number;
    readonly queueName: string;
    readonly workerId: string;
  }>;
}

export interface RedactedBwsServiceRuntimeConfig {
  readonly api: BwsServiceRuntimeConfig['api'];
  readonly persistence: Readonly<{
    readonly database: string;
    readonly host?: string;
    readonly password?: typeof REDACTED_VALUE;
    readonly port: number;
    readonly socketDirectory?: string;
    readonly user: string;
  }>;
  readonly policy: BwsServiceRuntimeConfig['policy'];
  readonly processDefinitions: readonly BwsProcessDefinition[];
  readonly upstream: Readonly<{
    readonly commitSha: string;
    readonly contractAlias: string;
    readonly contractSchema: string;
    readonly gitTreeSha: string;
    readonly lockPath: string;
    readonly repository: string;
    readonly repositoryPath: string;
    readonly sourceView: string;
    readonly surebetProfile: string;
    readonly trackedTreeListingSha256: string;
    readonly verifiedAt: string;
  }>;
  readonly worker: BwsServiceRuntimeConfig['worker'];
}

export interface BwsStrategyEvidencePolicy {
  readonly liveState: string;
  readonly privacy: string;
  readonly profitabilityState: string;
  readonly publicDistributionState: string;
}

export interface BwsOperationalStatusCheck {
  readonly blocker?: Blocker;
  readonly component:
    | 'api'
    | 'cockpit'
    | 'persistence'
    | 'strategy_evidence'
    | 'upstream_boundary'
    | 'worker';
  readonly status: 'pass' | 'fail';
  readonly summary: string;
}

export interface BwsOperationalStatusSnapshot {
  readonly generatedAt: IsoTimestamp;
  readonly health: Readonly<{
    readonly checks: readonly BwsOperationalStatusCheck[];
    readonly status: 'blocked' | 'healthy';
  }>;
  readonly observability: Readonly<{
    readonly configuration: RedactedBwsServiceRuntimeConfig;
    readonly processDefinitions: readonly BwsProcessDefinition[];
  }>;
  readonly readiness: Readonly<{
    readonly blockers: readonly Blocker[];
    readonly status: 'blocked' | 'ready';
  }>;
}

export interface CreateBwsOperationalStatusSnapshotRequest {
  readonly cockpitProcessDefinition: BwsProcessDefinition;
  readonly config: BwsServiceRuntimeConfig;
  readonly generatedAt: IsoTimestamp;
  readonly queryServiceBoundary: string;
  readonly strategyEvidencePolicy: BwsStrategyEvidencePolicy;
  readonly workerHandlerKinds: readonly string[];
}

export function resolveBwsServiceRuntimeConfig(
  environment: BwsServiceRuntimeEnvironment = process.env as BwsServiceRuntimeEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsServiceRuntimeConfig {
  const runtimeMode = requireLiteral(environment[SUREBET_RUNTIME_MODE_ENV], SUREBET_RUNTIME_MODE_ENV, 'paper');
  const providerConnections = requireLiteral(
    environment[SUREBET_PROVIDER_CONNECTIONS_ENV],
    SUREBET_PROVIDER_CONNECTIONS_ENV,
    'disabled',
  );
  const executionEnabled = requireLiteral(
    environment[SUREBET_EXECUTION_ENABLED_ENV],
    SUREBET_EXECUTION_ENABLED_ENV,
    'false',
  );
  const upstreamRepoPath = requireReadableDirectory(environment.BETTING_WIN_REPO_PATH, 'BETTING_WIN_REPO_PATH');

  const lockPath = requireRepositoryFile(
    repositoryRoot,
    requireNonEmptyString(environment[BWS_UPSTREAM_LOCK_PATH_ENV], BWS_UPSTREAM_LOCK_PATH_ENV),
    BWS_UPSTREAM_LOCK_PATH_ENV,
  );
  const upstreamLock = validateUpstreamLockBoundary(
    readBettingWinUpstreamLock(lockPath, repositoryRoot),
    upstreamRepoPath,
  );
  const persistence = resolveSurebetPersistenceConfig(environment);
  const apiPort = requirePositiveInteger(environment[BWS_API_PORT_ENV], BWS_API_PORT_ENV);
  const workerId = requireNonEmptyString(environment[BWS_WORKER_ID_ENV], BWS_WORKER_ID_ENV);
  const workerQueueName = requireNonEmptyString(environment[BWS_WORKER_QUEUE_NAME_ENV], BWS_WORKER_QUEUE_NAME_ENV);
  const workerLeaseDurationMs = requirePositiveInteger(
    environment[BWS_WORKER_LEASE_DURATION_MS_ENV],
    BWS_WORKER_LEASE_DURATION_MS_ENV,
  );

  const config: BwsServiceRuntimeConfig = Object.freeze({
    api: Object.freeze({
      bindHost: LOOPBACK_HOST,
      port: apiPort,
    }),
    persistence,
    policy: Object.freeze({
      executionEnabled: executionEnabled === 'false' ? false : failLiteral(SUREBET_EXECUTION_ENABLED_ENV, executionEnabled),
      providerConnections,
      runtimeMode,
    }),
    processDefinitions: Object.freeze([
      createApiProcessDefinition(apiPort),
      createWorkerProcessDefinition(),
    ]),
    upstream: Object.freeze({
      lock: upstreamLock,
      lockPath,
      repoPath: upstreamRepoPath,
    }),
    worker: Object.freeze({
      leaseDurationMs: workerLeaseDurationMs,
      queueName: workerQueueName,
      workerId,
    }),
  });

  return config;
}

export function redactBwsServiceRuntimeConfig(
  config: BwsServiceRuntimeConfig,
): RedactedBwsServiceRuntimeConfig {
  const summary: RedactedBwsServiceRuntimeConfig = Object.freeze({
    api: config.api,
    persistence: Object.freeze({
      database: config.persistence.database,
      ...(config.persistence.host === undefined ? {} : { host: config.persistence.host }),
      ...(config.persistence.password === undefined ? {} : { password: REDACTED_VALUE }),
      port: config.persistence.port,
      ...(config.persistence.socketDirectory === undefined ? {} : { socketDirectory: config.persistence.socketDirectory }),
      user: config.persistence.user,
    }),
    policy: config.policy,
    processDefinitions: config.processDefinitions,
    upstream: Object.freeze({
      commitSha: config.upstream.lock.commitSha,
      contractAlias: config.upstream.lock.contractAlias,
      contractSchema: config.upstream.lock.contractSchema,
      gitTreeSha: config.upstream.lock.gitTreeSha,
      lockPath: config.upstream.lockPath,
      repository: config.upstream.lock.repository,
      repositoryPath: config.upstream.lock.repositoryPath,
      sourceView: config.upstream.lock.sourceView,
      surebetProfile: config.upstream.lock.surebetProfile,
      trackedTreeListingSha256: config.upstream.lock.trackedTreeListingSha256,
      verifiedAt: config.upstream.lock.verifiedAt,
    }),
    worker: config.worker,
  });
  assertNoSecretLeakage(summary, config.persistence.password);
  return summary;
}

export function createBwsOperationalStatusSnapshot(
  request: CreateBwsOperationalStatusSnapshotRequest,
): BoundaryResult<BwsOperationalStatusSnapshot> {
  if (!ISO_8601_UTC_MILLISECONDS.test(request.generatedAt) || Number.isNaN(Date.parse(request.generatedAt))) {
    return blocked(
      'BWS_STATUS_TIMESTAMP_INVALID',
      'BWS operational status snapshots require an ISO-8601 UTC generatedAt timestamp.',
      'A deterministic ISO-8601 UTC timestamp for operational status generation.',
    );
  }
  if (request.queryServiceBoundary !== describeBwsReadOnlyQueryServiceBoundary()) {
    return blocked(
      'BWS_STATUS_API_BOUNDARY_INVALID',
      'BWS operational status requires the validated BWS read-only query service boundary.',
      'The exact validated BWS-400 read-only query service boundary.',
    );
  }
  if (!isOperatorCockpitProcessDefinition(request.cockpitProcessDefinition)) {
    return blocked(
      'BWS_STATUS_COCKPIT_PROCESS_INVALID',
      'BWS operational status requires an explicit operator cockpit process definition.',
      'A cockpit process definition with browser-only or loopback-only exposure and automatic fallback disabled.',
    );
  }
  const workerHandlerKinds = normalizeUniqueStrings(request.workerHandlerKinds, 'worker handler kinds');
  if (!workerHandlerKinds.ok) {
    return workerHandlerKinds;
  }
  const strategyEvidencePolicy = validateStrategyEvidencePolicy(request.strategyEvidencePolicy);
  if (!strategyEvidencePolicy.ok) {
    return strategyEvidencePolicy;
  }

  const checks = Object.freeze([
    Object.freeze({
      component: 'upstream_boundary',
      status: 'pass',
      summary: `Committed HEAD lock ${request.config.upstream.lock.commitSha} / ${request.config.upstream.lock.gitTreeSha} loaded from ${request.config.upstream.lockPath}.`,
    }),
    Object.freeze({
      component: 'persistence',
      status: 'pass',
      summary: `surebet persistence targets ${request.config.persistence.database} on ${request.config.persistence.host ?? request.config.persistence.socketDirectory}:${request.config.persistence.port}.`,
    }),
    Object.freeze({
      component: 'api',
      status: 'pass',
      summary: `Read-only API serves on ${request.config.api.bindHost}:${request.config.api.port} with boundary ${request.queryServiceBoundary}.`,
    }),
    Object.freeze({
      component: 'worker',
      status: 'pass',
      summary: `Bounded worker ${request.config.worker.workerId} handles ${workerHandlerKinds.value.value.join(', ')} on queue ${request.config.worker.queueName}.`,
    }),
    Object.freeze({
      component: 'strategy_evidence',
      status: 'pass',
      summary: 'Strategy evidence remains private_only, not_reported, withheld, and not_claimed.',
    }),
    Object.freeze({
      component: 'cockpit',
      status: 'pass',
      summary: `Cockpit process ${request.cockpitProcessDefinition.processName} uses ${request.cockpitProcessDefinition.exposure} exposure with fallback forbidden.`,
    }),
  ] satisfies readonly BwsOperationalStatusCheck[]);

  const snapshot: BwsOperationalStatusSnapshot = Object.freeze({
    generatedAt: request.generatedAt,
    health: Object.freeze({
      checks,
      status: 'healthy',
    }),
    observability: Object.freeze({
      configuration: redactBwsServiceRuntimeConfig(request.config),
      processDefinitions: Object.freeze([
        ...request.config.processDefinitions,
        request.cockpitProcessDefinition,
      ]),
    }),
    readiness: Object.freeze({
      blockers: Object.freeze([]),
      status: 'ready',
    }),
  });
  return accepted(snapshot);
}

function createApiProcessDefinition(port: number): BwsProcessDefinition {
  return Object.freeze({
    automaticFallback: 'forbidden',
    boundary: describeBwsReadOnlyQueryServiceBoundary(),
    execution: 'disabled',
    exposure: 'loopback_only',
    networkBindings: Object.freeze([
      Object.freeze({
        exposure: 'loopback_only',
        host: LOOPBACK_HOST,
        port,
        protocol: 'http',
        purpose: 'read_only_query_api',
      }),
      Object.freeze({
        exposure: 'loopback_only',
        host: LOOPBACK_HOST,
        port,
        protocol: 'http',
        purpose: 'health',
      }),
    ]),
    notes: Object.freeze([
      'Loopback-only read-only API with health and readiness endpoints.',
      `Upstream query boundary ${describeReadOnlyQueryApiClientBoundary()} remains read-only and no-fallback.`,
    ]),
    processName: 'bws-read-only-api',
    providerConnections: 'disabled',
    requiredEnvironmentKeys: Object.freeze([
      'BETTING_WIN_REPO_PATH',
      BWS_UPSTREAM_LOCK_PATH_ENV,
      SUREBET_RUNTIME_MODE_ENV,
      SUREBET_PROVIDER_CONNECTIONS_ENV,
      SUREBET_EXECUTION_ENABLED_ENV,
      'SUREBET_PG_DATABASE',
      'SUREBET_PG_USER',
      'SUREBET_PG_PORT',
      BWS_API_PORT_ENV,
    ]),
    role: 'api',
  });
}

function createWorkerProcessDefinition(): BwsProcessDefinition {
  return Object.freeze({
    automaticFallback: 'forbidden',
    boundary: '@betting-win-surebet/bootstrap:BWS-410',
    execution: 'disabled',
    exposure: 'no_listener',
    networkBindings: Object.freeze([]),
    notes: Object.freeze([
      'Bounded worker leases jobs from surebet.* persistence only.',
      'Private-paper runtime work remains loopback/read-only and closed execution.',
    ]),
    processName: 'bws-private-paper-worker',
    providerConnections: 'disabled',
    requiredEnvironmentKeys: Object.freeze([
      'BETTING_WIN_REPO_PATH',
      BWS_UPSTREAM_LOCK_PATH_ENV,
      SUREBET_RUNTIME_MODE_ENV,
      SUREBET_PROVIDER_CONNECTIONS_ENV,
      SUREBET_EXECUTION_ENABLED_ENV,
      'SUREBET_PG_DATABASE',
      'SUREBET_PG_USER',
      'SUREBET_PG_PORT',
      BWS_WORKER_ID_ENV,
      BWS_WORKER_QUEUE_NAME_ENV,
      BWS_WORKER_LEASE_DURATION_MS_ENV,
    ]),
    role: 'worker',
  });
}

function validateUpstreamLockBoundary(
  lock: BettingWinUpstreamLock,
  expectedRepositoryPath: string,
): BettingWinUpstreamLock {
  if (lock.repository !== 'betting-win') {
    throw new Error('BWS runtime requires repository=betting-win in the upstream lock.');
  }
  if (lock.sourceView !== 'committed_git_head') {
    throw new Error('BWS runtime requires sourceView=committed_git_head in the upstream lock.');
  }
  if (lock.contractSchema !== 'betting-win.strategy-export.v1') {
    throw new Error('BWS runtime requires contractSchema=betting-win.strategy-export.v1 in the upstream lock.');
  }
  if (lock.contractAlias !== 'betting-win-strategy-export.v1') {
    throw new Error('BWS runtime requires contractAlias=betting-win-strategy-export.v1 in the upstream lock.');
  }
  if (lock.surebetProfile !== 'surebet_standard_binary_v0') {
    throw new Error('BWS runtime requires surebetProfile=surebet_standard_binary_v0 in the upstream lock.');
  }
  const lockRepositoryPath = requireReadableDirectory(lock.repositoryPath, 'upstream lock repositoryPath');
  if (lockRepositoryPath !== expectedRepositoryPath) {
    throw new Error(
      'BWS runtime requires BETTING_WIN_REPO_PATH to match the upstream lock repositoryPath exactly.',
    );
  }
  return lock;
}

function validateStrategyEvidencePolicy(
  policy: BwsStrategyEvidencePolicy,
): BoundaryResult<undefined> {
  if (policy.privacy !== 'private_only'
    || policy.profitabilityState !== 'not_reported'
    || policy.publicDistributionState !== 'withheld'
    || policy.liveState !== 'not_claimed') {
    return blocked(
      'BWS_STATUS_STRATEGY_POLICY_INVALID',
      'BWS operational status requires immutable private-only strategy evidence policy states.',
      'Strategy evidence policy states fixed to private_only/not_reported/withheld/not_claimed.',
    );
  }
  return accepted(undefined);
}

function normalizeUniqueStrings(
  values: readonly string[],
  label: string,
): BoundaryResult<Readonly<{ readonly value: readonly string[] }>> {
  const normalized = values
    .map((value) => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
      }
      return value.trim();
    })
    .filter((value): value is string => value !== undefined);
  if (normalized.length === 0) {
    return blocked(
      'BWS_STATUS_WORKER_HANDLERS_EMPTY',
      `BWS operational status requires at least one explicit ${label}.`,
      'A non-empty bounded worker handler list.',
    );
  }
  if (new Set(normalized).size !== normalized.length) {
    return blocked(
      'BWS_STATUS_WORKER_HANDLERS_DUPLICATE',
      `BWS operational status does not allow duplicate ${label}.`,
      'A unique bounded worker handler list.',
    );
  }
  return accepted(Object.freeze({ value: Object.freeze(normalized) }));
}

function isOperatorCockpitProcessDefinition(processDefinition: BwsProcessDefinition): boolean {
  return processDefinition.role === 'cockpit'
    && processDefinition.automaticFallback === 'forbidden'
    && processDefinition.execution === 'disabled'
    && processDefinition.providerConnections === 'disabled';
}

function assertNoSecretLeakage(value: unknown, secretValue: string | undefined): void {
  const stack: Array<{ readonly key: string; readonly value: unknown }> = [{ key: 'root', value }];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (typeof current.key === 'string'
      && SENSITIVE_KEY_PATTERN.test(current.key)
      && current.value !== undefined
      && current.value !== REDACTED_VALUE) {
      throw new Error(`BWS observability summary leaked sensitive field ${current.key}.`);
    }
    if (typeof current.value === 'string') {
      if (secretValue !== undefined && current.value === secretValue) {
        throw new Error('BWS observability summary leaked the configured persistence password.');
      }
      if (SENSITIVE_TEXT_PATTERN.test(current.value) && current.value !== REDACTED_VALUE) {
        throw new Error(`BWS observability summary leaked sensitive text at ${current.key}.`);
      }
      continue;
    }
    if (Array.isArray(current.value)) {
      current.value.forEach((entry, index) => {
        stack.push({ key: `${current.key}[${index}]`, value: entry });
      });
      continue;
    }
    if (current.value !== null && typeof current.value === 'object') {
      for (const [key, entry] of Object.entries(current.value)) {
        stack.push({ key, value: entry });
      }
    }
  }
}

function requireLiteral<T extends string>(value: string | undefined, name: string, expected: T): T {
  const normalized = requireNonEmptyString(value, name);
  if (normalized !== expected) {
    throw new Error(`${name} must be exactly ${expected}.`);
  }
  return expected;
}

function failLiteral(name: string, value: string): never {
  throw new Error(`${name} must be exactly false. Received ${value}.`);
}

function requireNonEmptyString(value: string | undefined, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
}

function requirePositiveInteger(value: string | undefined, name: string): number {
  const normalized = requireNonEmptyString(value, name);
  if (!POSITIVE_INTEGER_PATTERN.test(normalized)) {
    throw new Error(`${name} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function requireReadableDirectory(value: string | undefined, name: string): string {
  const resolved = resolve(requireNonEmptyString(value, name));
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error(`${name} must point to an existing directory.`);
  }
  return realpathSync(resolved);
}

function requireRepositoryFile(repositoryRoot: string, value: string, name: string): string {
  const resolvedPath = resolve(repositoryRoot, value);
  const resolvedRoot = resolve(repositoryRoot);
  if (!(resolvedPath === resolvedRoot || resolvedPath.startsWith(`${resolvedRoot}/`))) {
    throw new Error(`${name} must stay within the BWS repository root.`);
  }
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
    throw new Error(`${name} must point to an existing file inside the BWS repository root.`);
  }
  return resolvedPath;
}
