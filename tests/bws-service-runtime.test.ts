import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createBwsOperationalStatusSnapshot,
  redactBwsServiceRuntimeConfig,
  resolveBwsServiceRuntimeConfig,
  BWS_API_PORT_ENV,
  BWS_UPSTREAM_LOCK_PATH_ENV,
  BWS_WORKER_ID_ENV,
  BWS_WORKER_LEASE_DURATION_MS_ENV,
  BWS_WORKER_QUEUE_NAME_ENV,
  SUREBET_EXECUTION_ENABLED_ENV,
  SUREBET_PROVIDER_CONNECTIONS_ENV,
  SUREBET_RUNTIME_MODE_ENV,
  type BwsReadOnlyQueryService,
  type BwsServiceRuntimeEnvironment,
} from '../packages/bootstrap/src/index.js';
import { createBwsReadOnlyQueryHttpHandler } from '../src/api/bws-read-only-query-http.js';
import { describeBwsReadOnlyQueryServiceBoundary } from '../src/api/bws-read-only-query-service.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';
import {
  BWS_OPERATOR_COCKPIT_DATA_MODE_ENV,
  describeBwsOperatorCockpitProcessDefinition,
  resolveBwsOperatorCockpitBrowserConfig,
} from '../apps/web/src/index.js';

const TEST_TIMESTAMP = '2026-07-15T09:15:00.000Z';

test('BWS service runtime config resolves the closed local stack and redacts secrets in observability summaries', () => {
  const fixture = createRuntimeFixture();
  try {
    const config = resolveBwsServiceRuntimeConfig(fixture.environment, fixture.repositoryRoot);
    assert.equal(config.api.bindHost, '127.0.0.1');
    assert.equal(config.api.port, 4312);
    assert.equal(config.policy.runtimeMode, 'paper');
    assert.equal(config.policy.providerConnections, 'disabled');
    assert.equal(config.policy.executionEnabled, false);
    assert.equal(config.processDefinitions.length, 2);
    assert.equal(config.processDefinitions[0]?.role, 'api');
    assert.equal(config.processDefinitions[1]?.role, 'worker');
    assert.equal(config.upstream.lock.commitSha, sampleUpstreamLock().commitSha);
    assert.equal(config.upstream.repoPath, config.upstream.lock.repositoryPath);

    const summary = redactBwsServiceRuntimeConfig(config);
    assert.equal(summary.persistence.password, '[redacted]');
    assert.equal(summary.upstream.repository, 'betting-win');
    assert.equal(summary.processDefinitions[0]?.automaticFallback, 'forbidden');
  } finally {
    fixture.dispose();
  }
});

test('BWS service runtime config fails fast on execution enablement and upstream lock paths outside the repository root', () => {
  const fixture = createRuntimeFixture();
  try {
    assert.throws(
      () =>
        resolveBwsServiceRuntimeConfig({
          ...fixture.environment,
          [SUREBET_EXECUTION_ENABLED_ENV]: 'true',
        }, fixture.repositoryRoot),
      /SUREBET_EXECUTION_ENABLED must be exactly false/,
    );

    assert.throws(
      () =>
        resolveBwsServiceRuntimeConfig({
          ...fixture.environment,
          [BWS_UPSTREAM_LOCK_PATH_ENV]: '../outside.lock.json',
        }, fixture.repositoryRoot),
      /must stay within the BWS repository root/,
    );

    const mismatchedUpstreamRoot = join(fixture.repositoryRoot, '..', 'betting-win-mismatch');
    mkdirSync(mismatchedUpstreamRoot, { recursive: true });
    assert.throws(
      () =>
        resolveBwsServiceRuntimeConfig({
          ...fixture.environment,
          BETTING_WIN_REPO_PATH: mismatchedUpstreamRoot,
        }, fixture.repositoryRoot),
      /BETTING_WIN_REPO_PATH to match the upstream lock repositoryPath exactly/,
    );
  } finally {
    fixture.dispose();
  }
});

test('BWS operational status snapshots require immutable strategy evidence policy and explicit cockpit process metadata', () => {
  const fixture = createRuntimeFixture();
  try {
    const config = resolveBwsServiceRuntimeConfig(fixture.environment, fixture.repositoryRoot);
    const cockpitConfig = resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'mock',
    });
    const snapshot = createBwsOperationalStatusSnapshot({
      cockpitState: createReadyCockpitState(),
      cockpitProcessDefinition: describeBwsOperatorCockpitProcessDefinition(cockpitConfig),
      config,
      generatedAt: TEST_TIMESTAMP,
      queryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
      strategyEvidencePolicy: {
        liveState: 'not_claimed',
        privacy: 'private_only',
        profitabilityState: 'not_reported',
        publicDistributionState: 'withheld',
      },
      workerHandlerKinds: ['private_paper_runtime_cycle_v1'],
    });
    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.value.health.status, 'healthy');
    assert.equal(snapshot.value.readiness.status, 'ready');
    assert.equal(snapshot.value.readiness.components.cockpit, 'ready');
    assert.equal(snapshot.value.observability.cockpit.buildDirectory, 'dist/apps/web');
    assert.equal(snapshot.value.observability.processDefinitions.length, 3);

    const invalid = createBwsOperationalStatusSnapshot({
      cockpitState: createReadyCockpitState(),
      cockpitProcessDefinition: describeBwsOperatorCockpitProcessDefinition(cockpitConfig),
      config,
      generatedAt: TEST_TIMESTAMP,
      queryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
      strategyEvidencePolicy: {
        liveState: 'ready',
        privacy: 'private_only',
        profitabilityState: 'not_reported',
        publicDistributionState: 'withheld',
      },
      workerHandlerKinds: ['private_paper_runtime_cycle_v1'],
    });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.blockers[0]?.code, 'BWS_STATUS_STRATEGY_POLICY_INVALID');
  } finally {
    fixture.dispose();
  }
});

test('BWS read-only HTTP handler surfaces health and readiness snapshots with security headers', async () => {
  const fixture = createRuntimeFixture();
  try {
    const config = resolveBwsServiceRuntimeConfig(fixture.environment, fixture.repositoryRoot);
    const cockpitConfig = resolveBwsOperatorCockpitBrowserConfig({
      [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'mock',
    });
    const snapshot = createBwsOperationalStatusSnapshot({
      cockpitState: createReadyCockpitState(),
      cockpitProcessDefinition: describeBwsOperatorCockpitProcessDefinition(cockpitConfig),
      config,
      generatedAt: TEST_TIMESTAMP,
      queryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
      strategyEvidencePolicy: {
        liveState: 'not_claimed',
        privacy: 'private_only',
        profitabilityState: 'not_reported',
        publicDistributionState: 'withheld',
      },
      workerHandlerKinds: ['private_paper_runtime_cycle_v1'],
    });
    assert.equal(snapshot.ok, true);

    const service: BwsReadOnlyQueryService = {
      boundary: Object.freeze({
        automaticFallback: 'forbidden',
        bwsReadOnlyQueryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
        upstreamReadOnlyQueryClientBoundary: '@betting-win-surebet/bootstrap:BWS-140',
      }),
      queryPrivatePaperRuntimeCycles() {
        throw new Error('not used by this test');
      },
      queryPinnedStrategyExports() {
        throw new Error('not used by this test');
      },
      queryStrategyLedger() {
        throw new Error('not used by this test');
      },
    };

    const server = createServer(createBwsReadOnlyQueryHttpHandler(service, {
      getOperationalStatusSnapshot: () => snapshot.value,
    }));
    await listen(server);
    try {
      const baseUrl = `http://127.0.0.1:${getServerPort(server)}`;
      const healthResponse = await fetch(`${baseUrl}/health`);
      assert.equal(healthResponse.status, 200);
      assert.equal(healthResponse.headers.get('cache-control'), 'no-store');
      assert.equal(healthResponse.headers.get('content-security-policy'), "default-src 'none'; frame-ancestors 'none'");
      const healthBody = await healthResponse.json() as {
        readonly health: {
          readonly status: string;
        };
        readonly ok: boolean;
      };
      assert.equal(healthBody.ok, true);
      assert.equal(healthBody.health.status, 'healthy');

      const readinessResponse = await fetch(`${baseUrl}/readiness`);
      assert.equal(readinessResponse.status, 200);
      const readinessBody = await readinessResponse.json() as {
        readonly observability: {
          readonly cockpit: {
            readonly assetFingerprint?: string;
          };
          readonly configuration: {
            readonly persistence: {
              readonly password?: string;
            };
          };
        };
        readonly readiness: {
          readonly components: {
            readonly cockpit: string;
          };
          readonly status: string;
        };
      };
      assert.equal(readinessBody.readiness.status, 'ready');
      assert.equal(readinessBody.readiness.components.cockpit, 'ready');
      assert.equal(readinessBody.observability.configuration.persistence.password, '[redacted]');
      assert.equal(readinessBody.observability.cockpit.assetFingerprint, 'f'.repeat(64));
    } finally {
      server.close();
      await once(server, 'close');
    }
  } finally {
    fixture.dispose();
  }
});

test('BWS read-only HTTP handler fails closed when health/readiness status snapshots are unavailable', async () => {
  const service: BwsReadOnlyQueryService = {
    boundary: Object.freeze({
      automaticFallback: 'forbidden',
      bwsReadOnlyQueryServiceBoundary: describeBwsReadOnlyQueryServiceBoundary(),
      upstreamReadOnlyQueryClientBoundary: '@betting-win-surebet/bootstrap:BWS-140',
    }),
    queryPrivatePaperRuntimeCycles() {
      throw new Error('not used by this test');
    },
    queryPinnedStrategyExports() {
      throw new Error('not used by this test');
    },
    queryStrategyLedger() {
      throw new Error('not used by this test');
    },
  };

  const server = createServer(createBwsReadOnlyQueryHttpHandler(service));
  await listen(server);
  try {
    const baseUrl = `http://127.0.0.1:${getServerPort(server)}`;
    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 503);
    const healthBody = await healthResponse.json() as {
      readonly error: {
        readonly code: string;
      };
      readonly ok: boolean;
    };
    assert.equal(healthBody.ok, false);
    assert.equal(healthBody.error.code, 'BWS_OPERATIONAL_STATUS_UNAVAILABLE');

    const readinessResponse = await fetch(`${baseUrl}/readiness`);
    assert.equal(readinessResponse.status, 503);
    const readinessBody = await readinessResponse.json() as {
      readonly error: {
        readonly code: string;
      };
      readonly ok: boolean;
    };
    assert.equal(readinessBody.ok, false);
    assert.equal(readinessBody.error.code, 'BWS_OPERATIONAL_STATUS_UNAVAILABLE');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

function createRuntimeFixture(): {
  readonly dispose: () => void;
  readonly environment: BwsServiceRuntimeEnvironment;
  readonly repositoryRoot: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'bws-service-runtime-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const upstreamRoot = join(root, 'betting-win');
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  writeFileSync(
    join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
    `${JSON.stringify(sampleUpstreamLock(upstreamRoot), null, 2)}\n`,
    'utf-8',
  );
  return {
    dispose: () => rmSync(root, { force: true, recursive: true }),
    environment: {
      BETTING_WIN_REPO_PATH: upstreamRoot,
      [BWS_API_PORT_ENV]: '4312',
      [BWS_UPSTREAM_LOCK_PATH_ENV]: 'config/betting-win.upstream.lock.json',
      [BWS_WORKER_ID_ENV]: 'worker-bws-500',
      [BWS_WORKER_LEASE_DURATION_MS_ENV]: '30000',
      [BWS_WORKER_QUEUE_NAME_ENV]: 'private-paper',
      [SUREBET_EXECUTION_ENABLED_ENV]: 'false',
      [SUREBET_PROVIDER_CONNECTIONS_ENV]: 'disabled',
      [SUREBET_RUNTIME_MODE_ENV]: 'paper',
      SUREBET_PG_DATABASE: 'surebet_local',
      SUREBET_PG_HOST: '127.0.0.1',
      SUREBET_PG_PASSWORD: 'super-secret-password',
      SUREBET_PG_PORT: '5432',
      SUREBET_PG_USER: 'surebet_user',
    },
    repositoryRoot,
  };
}

function sampleUpstreamLock(repositoryPath: string = '/tmp/betting-win'): BettingWinUpstreamLock {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath,
    commitSha: '1'.repeat(40),
    gitTreeSha: '2'.repeat(40),
    sourceView: 'committed_git_head',
    packageVersion: '0.48.0',
    trackedTreeListingSha256: '3'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt: TEST_TIMESTAMP,
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
  });
}

async function listen(server: ReturnType<typeof createServer>): Promise<void> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
}

function getServerPort(server: ReturnType<typeof createServer>): number {
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  return (address as AddressInfo).port;
}

function createReadyCockpitState() {
  return Object.freeze({
    apiBaseUrl: 'http://127.0.0.1:4312',
    assetFingerprint: 'f'.repeat(64),
    buildDirectory: 'dist/apps/web',
    dataMode: 'api' as const,
    entryDocumentPath: 'dist/apps/web/index.html',
    status: 'ready' as const,
  });
}
