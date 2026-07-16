import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BWS_UPSTREAM_API_BASE_URL_ENV,
  BWS_UPSTREAM_API_CHECKPOINT_ID_ENV,
  BWS_UPSTREAM_API_CONTRACT_VERSION_ENV,
  BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV,
  BWS_UPSTREAM_API_PAGE_SIZE_ENV,
  BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV,
  BWS_UPSTREAM_API_RETRY_LIMIT_ENV,
  BWS_UPSTREAM_API_TIMEOUT_MS_ENV,
  BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV,
  BWS_UPSTREAM_LOCK_PATH_ENV,
  BWS_UPSTREAM_MODE_ENV,
  resolveBwsUpstreamApiConvergenceConfig,
  runBwsUpstreamApiConvergenceCli,
  runBwsUpstreamApiConvergencePass,
  type BwsUpstreamApiConvergenceConfig,
  type BwsUpstreamApiConvergencePassResult,
  type RunBwsUpstreamApiConvergencePassRequest,
} from '../packages/bootstrap/src/index.js';
import {
  writeBettingWinUpstreamLock,
  type BettingWinUpstreamLock,
} from '../packages/upstream/src/index.js';

const ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-15T13:00:00.000Z';
const SCHEMA_PATH = join(ROOT, 'schemas', 'betting-win-upstream-lock.v1.schema.json');
const WORKSPACE_PACKAGES = [
  '@betting-win/contracts',
  '@betting-win/foundation',
  '@betting-win/identity',
  '@betting-win/paper-ledger',
  '@betting-win/provider-collection',
  '@betting-win/provider-generation',
  '@betting-win/query-service',
  '@betting-win/quotes',
  '@betting-win/rules',
  '@betting-win/source-lineage',
  '@betting-win/evidence-import',
  '@betting-win/jobs',
  '@betting-win/api',
  '@betting-win/web',
  '@betting-win/workers',
] as const;

test('upstream API convergence advances one deterministic page per pass and recovers checkpoint advancement from persisted import metadata', async () => {
  const fixture = createApiFixture({
    identity: [createEnvelope('identity', { page: { items: [createIdentityItem()], pageSize: 1, returnedCount: 1 } })],
    rules: [createEnvelope('rules', { page: { items: [createRulesItem()], pageSize: 1, returnedCount: 1 } })],
    quotes: [
      createEnvelope('quotes', {
        page: {
          items: [createNormalizedItem('quote-lineage-001')],
          nextCursor: 'cursor.quotes.1',
          pageSize: 1,
          returnedCount: 1,
        },
      }),
      createEnvelope('quotes', {
        page: {
          items: [createNormalizedItem('quote-lineage-002')],
          pageSize: 1,
          returnedCount: 1,
        },
      }),
    ],
    settlement: [createEnvelope('settlement', {
      page: {
        items: [createNormalizedItem('settlement-lineage-001')],
        pageSize: 1,
        returnedCount: 1,
      },
    })],
  });
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories, fixture.fetch);
    const pass1 = await runPass(fixture.config, dependencies);
    assert.equal(pass1.ok, true);
    assert.equal(pass1.value.resource, 'identity');
    assert.equal(pass1.value.nextResource, 'rules');
    assert.equal(pass1.value.pageNumber, 1);
    assert.equal(pass1.value.processedCount, 1);

    const pass2 = await runPass(fixture.config, dependencies);
    assert.equal(pass2.ok, true);
    assert.equal(pass2.value.resource, 'rules');
    assert.equal(pass2.value.nextResource, 'quotes');

    const pass3 = await runPass(fixture.config, dependencies);
    assert.equal(pass3.ok, true);
    assert.equal(pass3.value.resource, 'quotes');
    assert.equal(pass3.value.nextResource, 'quotes');
    assert.equal(pass3.value.nextCursor, 'cursor.quotes.1');

    const requestCountBeforeRecovery = fixture.requestLog.length;
    repositories.checkpoints.forceSet({
      ...repositories.checkpoints.initial('checkpoint-api-001'),
      apiBaseUrl: fixture.config.query.baseUrl,
      contractVersion: fixture.config.query.contractVersion,
      maxPagesPerResource: fixture.config.query.maxPagesPerResource,
      currentResource: 'quotes',
      currentResourcePageCount: 0,
      pageSize: fixture.config.query.pageSize,
      retryBackoffMs: fixture.config.query.retryBackoffMs,
      retryLimit: fixture.config.query.retryLimit,
      timeoutMs: fixture.config.query.timeoutMs,
      upstreamLockRecordId: lockRecordIdForFixture(fixture.config),
      lastImportRunId: pass2.value.importRunId,
      lastResponseProvenance: {
        commitSha: fixture.config.upstream.lock.commitSha,
        repository: fixture.config.upstream.lock.repository,
        resource: 'rules',
        responseReceivedAt: '2026-07-15T13:00:01.000Z',
        sourceView: fixture.config.upstream.lock.sourceView,
        verifiedAt: fixture.config.upstream.lock.verifiedAt,
      },
    });

    const recoveredPass = await runPass(fixture.config, dependencies);
    assert.equal(recoveredPass.ok, true);
    assert.equal(recoveredPass.value.resource, 'quotes');
    assert.equal(recoveredPass.value.nextResource, 'quotes');
    assert.equal(recoveredPass.value.nextCursor, 'cursor.quotes.1');
    assert.equal(fixture.requestLog.length, requestCountBeforeRecovery);

    const pass4 = await runPass(fixture.config, dependencies);
    assert.equal(pass4.ok, true);
    assert.equal(pass4.value.resource, 'quotes');
    assert.equal(pass4.value.nextResource, 'settlement');

    const pass5 = await runPass(fixture.config, dependencies);
    assert.equal(pass5.ok, true);
    assert.equal(pass5.value.resource, 'settlement');
    assert.equal(pass5.value.nextResource, 'identity');
    assert.equal(pass5.value.cycleCompleted, true);
    assert.equal(pass5.value.completedCycleCount, 1);
    assert.equal(repositories.checkpoints.get('checkpoint-api-001')?.currentCycleNumber, 2);
  } finally {
    fixture.dispose();
  }
});

test('upstream API convergence resumes a running persisted page import without refetching and finalizes it deterministically', async () => {
  const fixture = createApiFixture({
    identity: [createEnvelope('identity', { page: { items: [createIdentityItem()], pageSize: 1, returnedCount: 1 } })],
    rules: [createEnvelope('rules', { page: { items: [createRulesItem()], pageSize: 1, returnedCount: 1 } })],
    quotes: [createEnvelope('quotes', { page: { items: [createNormalizedItem('quote-lineage-001')], pageSize: 1, returnedCount: 1 } })],
    settlement: [createEnvelope('settlement', {
      page: { items: [createNormalizedItem('settlement-lineage-001')], pageSize: 1, returnedCount: 1 },
    })],
  });
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories, fixture.fetch);
    const checkpoint = repositories.checkpoints.initial('checkpoint-api-001');
    repositories.checkpoints.forceSet({
      ...checkpoint,
      apiBaseUrl: fixture.config.query.baseUrl,
      contractVersion: fixture.config.query.contractVersion,
      maxPagesPerResource: fixture.config.query.maxPagesPerResource,
      pageSize: fixture.config.query.pageSize,
      retryBackoffMs: fixture.config.query.retryBackoffMs,
      retryLimit: fixture.config.query.retryLimit,
      timeoutMs: fixture.config.query.timeoutMs,
      upstreamLockRecordId: lockRecordIdForFixture(fixture.config),
    });
    const importRunId = 'import:checkpoint-api-001:cycle:1:identity:page:1';
    repositories.importRuns.forceSetRunning({
      importRunId,
      metadata: {
        apiBaseUrl: fixture.config.query.baseUrl,
        checkpointId: 'checkpoint-api-001',
        contractVersion: fixture.config.query.contractVersion,
        cycleNumber: 1,
        maxPagesPerResource: fixture.config.query.maxPagesPerResource,
        mode: 'api',
        page: {
          pageNumber: 1,
          processedCount: 1,
          provenance: {
            commitSha: fixture.config.upstream.lock.commitSha,
            repository: fixture.config.upstream.lock.repository,
            resource: 'identity',
            responseReceivedAt: '2026-07-15T13:00:05.000Z',
            sourceView: fixture.config.upstream.lock.sourceView,
            verifiedAt: fixture.config.upstream.lock.verifiedAt,
          },
          resource: 'identity',
        },
        pageSize: fixture.config.query.pageSize,
        resource: 'identity',
        retryBackoffMs: fixture.config.query.retryBackoffMs,
        retryLimit: fixture.config.query.retryLimit,
        timeoutMs: fixture.config.query.timeoutMs,
        upstreamLockRecordId: lockRecordIdForFixture(fixture.config),
      },
      requestedAt: '2026-07-15T13:00:04.000Z',
      sourceKind: 'continuous_read_only_query_page',
      sourceLocator: `${fixture.config.query.baseUrl}#checkpoint-api-001:cycle:1:resource:identity:page:1`,
      startedAt: '2026-07-15T13:00:04.000Z',
      upstreamLockRecordId: lockRecordIdForFixture(fixture.config),
    });

    const result = await runPass(fixture.config, dependencies);
    assert.equal(result.ok, true);
    assert.equal(result.value.resource, 'identity');
    assert.equal(result.value.nextResource, 'rules');
    assert.equal(fixture.requestLog.length, 0);
    assert.equal(repositories.importRuns.get(importRunId)?.outcome, 'succeeded');
  } finally {
    fixture.dispose();
  }
});

test('upstream API convergence blocks pagination paths that exceed the explicit page bound and replays the same blocker without fallback', async () => {
  const fixture = createApiFixture({
    identity: [createEnvelope('identity', { page: { items: [createIdentityItem()], pageSize: 1, returnedCount: 1 } })],
    rules: [createEnvelope('rules', { page: { items: [createRulesItem()], pageSize: 1, returnedCount: 1 } })],
    quotes: [createEnvelope('quotes', {
      page: {
        items: [createNormalizedItem('quote-lineage-001')],
        nextCursor: 'cursor.quotes.1',
        pageSize: 1,
        returnedCount: 1,
      },
    })],
    settlement: [createEnvelope('settlement', {
      page: { items: [createNormalizedItem('settlement-lineage-001')], pageSize: 1, returnedCount: 1 },
    })],
  }, { maxPagesPerResource: 1 });
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories, fixture.fetch);
    assert.equal((await runPass(fixture.config, dependencies)).ok, true);
    assert.equal((await runPass(fixture.config, dependencies)).ok, true);

    const firstFailure = await runPass(fixture.config, dependencies);
    assert.equal(firstFailure.ok, false);
    assert.equal(firstFailure.blockers[0]?.code, 'BWS_UPSTREAM_API_PAGE_BOUND_EXCEEDED');
    const requestCountAfterFailure = fixture.requestLog.length;

    const secondFailure = await runPass(fixture.config, dependencies);
    assert.equal(secondFailure.ok, false);
    assert.equal(secondFailure.blockers[0]?.code, 'BWS_UPSTREAM_API_PAGE_BOUND_EXCEEDED');
    assert.equal(fixture.requestLog.length, requestCountAfterFailure);
    assert.equal(
      repositories.importRuns.get('import:checkpoint-api-001:cycle:1:quotes:page:1')?.outcome,
      'failed',
    );
  } finally {
    fixture.dispose();
  }
});

test('upstream API convergence rejects mutated checkpoint configuration after initialization', async () => {
  const fixture = createApiFixture({
    identity: [createEnvelope('identity', { page: { items: [createIdentityItem()], pageSize: 1, returnedCount: 1 } })],
    rules: [createEnvelope('rules', { page: { items: [createRulesItem()], pageSize: 1, returnedCount: 1 } })],
    quotes: [createEnvelope('quotes', { page: { items: [createNormalizedItem('quote-lineage-001')], pageSize: 1, returnedCount: 1 } })],
    settlement: [createEnvelope('settlement', {
      page: { items: [createNormalizedItem('settlement-lineage-001')], pageSize: 1, returnedCount: 1 },
    })],
  });
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories, fixture.fetch);
    assert.equal((await runPass(fixture.config, dependencies)).ok, true);

    const mutatedConfig: BwsUpstreamApiConvergenceConfig = Object.freeze({
      ...fixture.config,
      query: Object.freeze({
        ...fixture.config.query,
        contractVersion: '2.0.0',
      }),
    });
    const result = await runPass(mutatedConfig, dependencies);
    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'BWS_UPSTREAM_API_CONFIGURATION_MUTATED');
  } finally {
    fixture.dispose();
  }
});

test('upstream API convergence config and CLI help stay explicit about api mode and forbid fallback inputs or secret-style settings', async () => {
  const fixture = createBettingWinFixture();
  try {
    writeBettingWinUpstreamLock({
      allowedBoundaryRoot: fixture.tempRoot,
      bettingWinRepoPath: fixture.upstreamRoot,
      repositoryRoot: fixture.bwsRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: TEST_TIMESTAMP,
    });

    const baseEnvironment = {
      BETTING_WIN_REPO_PATH: fixture.upstreamRoot,
      [BWS_UPSTREAM_API_BASE_URL_ENV]: 'http://127.0.0.1:4312',
      [BWS_UPSTREAM_API_CHECKPOINT_ID_ENV]: 'checkpoint-api-001',
      [BWS_UPSTREAM_API_CONTRACT_VERSION_ENV]: '1.0.0',
      [BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE_ENV]: '2',
      [BWS_UPSTREAM_API_PAGE_SIZE_ENV]: '1',
      [BWS_UPSTREAM_API_RETRY_BACKOFF_MS_ENV]: '5',
      [BWS_UPSTREAM_API_RETRY_LIMIT_ENV]: '1',
      [BWS_UPSTREAM_API_TIMEOUT_MS_ENV]: '1000',
      [BWS_UPSTREAM_LOCK_PATH_ENV]: 'config/betting-win.upstream.lock.json',
      [BWS_UPSTREAM_MODE_ENV]: 'api',
      SUREBET_EXECUTION_ENABLED: 'false',
      SUREBET_PG_DATABASE: 'surebet',
      SUREBET_PG_HOST: '127.0.0.1',
      SUREBET_PG_PORT: '5432',
      SUREBET_PG_USER: 'surebet',
      SUREBET_PROVIDER_CONNECTIONS: 'disabled',
      SUREBET_RUNTIME_MODE: 'paper',
    } as const;

    const config = resolveBwsUpstreamApiConvergenceConfig(baseEnvironment, fixture.bwsRoot);
    assert.equal(config.mode, 'api');
    assert.equal(config.query.contractVersion, '1.0.0');

    assert.throws(
      () => resolveBwsUpstreamApiConvergenceConfig({
        ...baseEnvironment,
        [BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV]: 'config/upstream-export-selection.json',
      }, fixture.bwsRoot),
      /must not fall back to export mode/,
    );

    assert.throws(
      () => resolveBwsUpstreamApiConvergenceConfig({
        ...baseEnvironment,
        SUREBET_PINNED_BUNDLE: 'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json',
      }, fixture.bwsRoot),
      /must not fall back to local fixture or mock intake/,
    );

    assert.throws(
      () => resolveBwsUpstreamApiConvergenceConfig({
        ...baseEnvironment,
        BWS_UPSTREAM_API_TOKEN: 'secret-value',
      } as Record<string, string>, fixture.bwsRoot),
      /must not accept provider credentials or secret material/,
    );

    const help = captureStream();
    assert.equal(await runBwsUpstreamApiConvergenceCli(['--help'], ROOT, help.stream), 0);
    assert.match(help.read(), /BWS_UPSTREAM_MODE=api/);
    assert.match(help.read(), /BWS_UPSTREAM_API_CONTRACT_VERSION/);
  } finally {
    rmSync(fixture.tempRoot, { force: true, recursive: true });
  }
});

async function runPass(
  config: BwsUpstreamApiConvergenceConfig,
  dependencies: Required<Pick<
    RunBwsUpstreamApiConvergencePassRequest,
    'fetchImplementation' | 'importRuns' | 'upstreamApiCheckpoints' | 'upstreamLocks'
  >>,
): Promise<Awaited<ReturnType<typeof runBwsUpstreamApiConvergencePass>>> {
  return runBwsUpstreamApiConvergencePass({
    config,
    fetchImplementation: dependencies.fetchImplementation,
    importRuns: dependencies.importRuns,
    now: deterministicNow(),
    upstreamApiCheckpoints: dependencies.upstreamApiCheckpoints,
    upstreamLocks: dependencies.upstreamLocks,
  });
}

function createApiFixture(
  pages: Readonly<Record<'identity' | 'quotes' | 'rules' | 'settlement', readonly ReturnType<typeof createEnvelope>[]>>,
  overrides: Partial<BwsUpstreamApiConvergenceConfig['query']> = {},
) {
  const requestLog: string[] = [];
  const responses = new Map<string, readonly ReturnType<typeof createEnvelope>[]>([
    ['identity', pages.identity],
    ['rules', pages.rules],
    ['quotes', pages.quotes],
    ['settlement', pages.settlement],
  ]);
  const counters = new Map<string, number>();
  const config: BwsUpstreamApiConvergenceConfig = Object.freeze({
    checkpointId: 'checkpoint-api-001',
    mode: 'api',
    persistence: Object.freeze({
      database: 'surebet',
      host: '127.0.0.1',
      port: 5432,
      user: 'surebet',
    }),
    query: Object.freeze({
      baseUrl: 'http://betting-win-query.test',
      contractVersion: '1.0.0',
      maxPagesPerResource: 2,
      pageSize: 1,
      retryBackoffMs: 1,
      retryLimit: 1,
      timeoutMs: 25,
      ...overrides,
    }),
    repositoryRoot: ROOT,
    upstream: Object.freeze({
      lock: sampleUpstreamLock('/tmp/betting-win'),
      lockPath: 'config/betting-win.upstream.lock.json',
      repoPath: '/tmp/betting-win',
    }),
  });

  const fetchImplementation: NonNullable<RunBwsUpstreamApiConvergencePassRequest['fetchImplementation']> = async (input) => {
    const url = new URL(input);
    const resource = inferResource(url.pathname, url.searchParams.get('recordFamily'));
    if (resource === 'settlement') {
      assert.equal(url.searchParams.get('finalityStatus'), 'terminal');
    }
    requestLog.push(url.toString());
    const index = counters.get(resource) ?? 0;
    counters.set(resource, index + 1);
    const resourceResponses = responses.get(resource) ?? [];
    const response = resourceResponses[index];
    assert.ok(response !== undefined, `unexpected ${resource} request #${index + 1}`);
    return Object.freeze({
      headers: {
        get(name: string) {
          return name.toLowerCase() === 'content-type' ? 'application/json' : null;
        },
      },
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(response);
      },
    });
  };

  return Object.freeze({
    config,
    dispose() {},
    fetch: fetchImplementation,
    requestLog,
  });
}

function createEnvelope(
  resource: 'identity' | 'quotes' | 'rules' | 'settlement',
  overrides: Readonly<{
    readonly contractVersion?: string;
    readonly page: {
      readonly items: readonly unknown[];
      readonly nextCursor?: string;
      readonly pageSize: number;
      readonly returnedCount: number;
    };
    readonly responseReceivedAt?: string;
  }>,
) {
  return Object.freeze({
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractVersion: overrides.contractVersion ?? '1.0.0',
    page: Object.freeze({
      items: overrides.page.items,
      ...(overrides.page.nextCursor === undefined ? {} : { nextCursor: overrides.page.nextCursor }),
      pageSize: overrides.page.pageSize,
      returnedCount: overrides.page.returnedCount,
    }),
    provenance: Object.freeze({
      commitSha: sampleUpstreamLock('/tmp/betting-win').commitSha,
      repository: sampleUpstreamLock('/tmp/betting-win').repository,
      responseReceivedAt: overrides.responseReceivedAt ?? '2026-07-15T13:00:00.000Z',
      sourceView: sampleUpstreamLock('/tmp/betting-win').sourceView,
      verifiedAt: sampleUpstreamLock('/tmp/betting-win').verifiedAt,
    }),
    resource,
    surebetProfile: 'surebet_standard_binary_v0',
  });
}

function createIdentityItem() {
  return Object.freeze({
    canonicalId: 'sport.soccer',
    entityType: 'sport',
    providerReferences: Object.freeze([
      Object.freeze({
        provider: 'polymarket',
        providerGenerationId: 'generation-id-001',
        sourceLineageRecordId: 'identity-lineage-001',
      }),
    ]),
  });
}

function createRulesItem() {
  return Object.freeze({
    resultSource: Object.freeze({ resultSourceId: 'result-source-001' }),
    ruleProfile: Object.freeze({ ruleProfileId: 'rule-profile-001' }),
  });
}

function createNormalizedItem(sourceLineageRecordId: string) {
  return Object.freeze({
    normalizedEvidence: Object.freeze({
      provider: 'polymarket',
      providerGenerationId: 'generation-id-001',
      sourceLineageRecordId,
    }),
    recordType: 'evidence',
  });
}

function inferResource(pathname: string, recordFamily: string | null): 'identity' | 'quotes' | 'rules' | 'settlement' {
  if (pathname === '/query/identity-entities') {
    return 'identity';
  }
  if (pathname === '/query/rule-profiles') {
    return 'rules';
  }
  if (pathname === '/query/normalized-records' && recordFamily === 'quotes') {
    return 'quotes';
  }
  if (pathname === '/query/normalized-records' && recordFamily === 'settlement') {
    return 'settlement';
  }
  throw new Error(`unexpected query path ${pathname}`);
}

function createInMemoryRepositories() {
  return Object.freeze({
    checkpoints: new InMemoryApiCheckpoints(),
    importRuns: new InMemoryImportRuns(),
    upstreamLocks: new InMemoryUpstreamLocks(),
  });
}

function asPassDependencies(
  repositories: ReturnType<typeof createInMemoryRepositories>,
  fetchImplementation: NonNullable<RunBwsUpstreamApiConvergencePassRequest['fetchImplementation']>,
): Required<Pick<
  RunBwsUpstreamApiConvergencePassRequest,
  'fetchImplementation' | 'importRuns' | 'upstreamApiCheckpoints' | 'upstreamLocks'
>> {
  return Object.freeze({
    fetchImplementation,
    importRuns: repositories.importRuns as unknown as NonNullable<RunBwsUpstreamApiConvergencePassRequest['importRuns']>,
    upstreamApiCheckpoints:
      repositories.checkpoints as unknown as NonNullable<RunBwsUpstreamApiConvergencePassRequest['upstreamApiCheckpoints']>,
    upstreamLocks: repositories.upstreamLocks as unknown as NonNullable<RunBwsUpstreamApiConvergencePassRequest['upstreamLocks']>,
  });
}

class InMemoryUpstreamLocks {
  #records = new Map<string, { readonly insertedAt: string; readonly lock: BettingWinUpstreamLock; readonly lockRecordId: string }>();

  put(record: { readonly lock: BettingWinUpstreamLock; readonly lockRecordId: string }) {
    const existing = this.#records.get(record.lockRecordId);
    if (existing !== undefined) {
      assert.deepEqual(existing.lock, record.lock);
      return existing;
    }
    const persisted = Object.freeze({
      insertedAt: TEST_TIMESTAMP,
      lock: record.lock,
      lockRecordId: record.lockRecordId,
    });
    this.#records.set(record.lockRecordId, persisted);
    return persisted;
  }
}

class InMemoryApiCheckpoints {
  #records = new Map<string, Record<string, unknown>>();

  initial(checkpointId: string) {
    return Object.freeze({
      checkpointId,
      completedCycleCount: 0,
      currentCycleNumber: 1,
      currentResource: 'identity',
      currentResourcePageCount: 0,
      mode: 'api',
    });
  }

  get(checkpointId: string) {
    return this.#records.get(checkpointId) as Record<string, unknown> | undefined;
  }

  create(record: Record<string, unknown>) {
    const existing = this.get(record.checkpointId as string);
    if (existing !== undefined) {
      assert.deepEqual(existing, record);
      return existing;
    }
    const persisted = Object.freeze({
      ...record,
      insertedAt: TEST_TIMESTAMP,
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.checkpointId as string, persisted);
    return persisted;
  }

  advance(record: Record<string, unknown>) {
    const existing = this.get(record.checkpointId as string);
    assert.ok(existing !== undefined);
    assert.equal(existing.currentCycleNumber, record.expectedCurrentCycleNumber);
    assert.equal(existing.currentResource, record.expectedCurrentResource);
    assert.equal(existing.currentResourcePageCount, record.expectedCurrentResourcePageCount);
    assert.equal(existing.nextCursor, record.expectedNextCursor);
    const persisted = Object.freeze({
      ...existing,
      completedCycleCount: record.completedCycleCount,
      currentCycleNumber: record.currentCycleNumber,
      currentResource: record.currentResource,
      currentResourcePageCount: record.currentResourcePageCount,
      lastCompletedCycleAt: record.lastCompletedCycleAt,
      lastImportRunId: record.lastImportRunId,
      lastResponseProvenance: record.lastResponseProvenance,
      nextCursor: record.nextCursor,
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.checkpointId as string, persisted);
    return persisted;
  }

  forceSet(record: Record<string, unknown>) {
    this.#records.set(
      record.checkpointId as string,
      Object.freeze({
        ...record,
        insertedAt: TEST_TIMESTAMP,
        updatedAt: TEST_TIMESTAMP,
      }),
    );
  }
}

class InMemoryImportRuns {
  #records = new Map<string, Record<string, unknown>>();

  get(importRunId: string) {
    return this.#records.get(importRunId) as Record<string, unknown> | undefined;
  }

  create(record: Record<string, unknown>) {
    const existing = this.get(record.importRunId as string);
    if (existing !== undefined) {
      assert.equal(existing.importRunId, record.importRunId);
      return existing;
    }
    const persisted = Object.freeze({
      ...record,
      insertedAt: TEST_TIMESTAMP,
      outcome: 'running',
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.importRunId as string, persisted);
    return persisted;
  }

  finalize(record: Record<string, unknown>) {
    const existing = this.get(record.importRunId as string);
    assert.ok(existing !== undefined);
    if (existing.outcome !== 'running') {
      return existing;
    }
    const persisted = Object.freeze({
      ...existing,
      ...record,
      updatedAt: TEST_TIMESTAMP,
    });
    this.#records.set(record.importRunId as string, persisted);
    return persisted;
  }

  forceSetRunning(record: Record<string, unknown>) {
    this.#records.set(
      record.importRunId as string,
      Object.freeze({
        ...record,
        insertedAt: TEST_TIMESTAMP,
        outcome: 'running',
        updatedAt: TEST_TIMESTAMP,
      }),
    );
  }
}

function lockRecordIdForFixture(config: BwsUpstreamApiConvergenceConfig): string {
  return `upstream-lock:${config.upstream.lock.commitSha}:${config.upstream.lock.gitTreeSha}`;
}

function sampleUpstreamLock(repositoryPath: string): BettingWinUpstreamLock {
  return Object.freeze({
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
    commitSha: '1'.repeat(40),
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    gitTreeSha: '2'.repeat(40),
    packageVersion: '0.48.0',
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    repository: 'betting-win',
    repositoryPath,
    schema: 'betting-win-surebet-upstream-lock-v1',
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    sourceView: 'committed_git_head',
    surebetProfile: 'surebet_standard_binary_v0',
    trackedTreeListingSha256: '3'.repeat(64),
    verifiedAt: TEST_TIMESTAMP,
  });
}

function deterministicNow(): () => string {
  let index = 0;
  return () => {
    const timestamp = new Date(Date.parse(TEST_TIMESTAMP) + index).toISOString();
    index += 1;
    return timestamp;
  };
}

function createBettingWinFixture() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bws-api-resolver-'));
  const bwsRoot = join(tempRoot, 'betting-win-surebet');
  const upstreamRoot = join(tempRoot, 'betting-win');
  mkdirSync(bwsRoot, { recursive: true });
  mkdirSync(join(bwsRoot, 'config'), { recursive: true });
  mkdirSync(join(bwsRoot, 'schemas'), { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });
  writeFileSync(
    join(bwsRoot, 'schemas', 'betting-win-upstream-lock.v1.schema.json'),
    readFileSync(SCHEMA_PATH, 'utf-8'),
    'utf-8',
  );

  writeJson(join(upstreamRoot, 'package.json'), {
    name: 'betting-win',
    private: true,
    version: '0.48.0',
    workspaces: ['packages/*', 'apps/*'],
  });

  for (const packageName of WORKSPACE_PACKAGES) {
    const [scope, slug] = packageName.split('/');
    assert.ok(scope !== undefined && slug !== undefined);
    const workspaceRoot = slug === 'api' || slug === 'web' || slug === 'workers' ? 'apps' : 'packages';
    const workspacePath = join(upstreamRoot, workspaceRoot, slug);
    mkdirSync(workspacePath, { recursive: true });
    writeJson(join(workspacePath, 'package.json'), {
      name: `${scope}/${slug}`,
      private: true,
      type: 'module',
      version: '0.48.0',
    });
  }

  const providerCollectionSourcePath = join(upstreamRoot, 'packages', 'provider-collection', 'src');
  mkdirSync(providerCollectionSourcePath, { recursive: true });
  writeFileSync(
    join(providerCollectionSourcePath, 'index.ts'),
    [
      'export const downstreamContractFamily = {',
      "  schema: 'betting-win.strategy-export.v1',",
      "  canonicalContractAlias: 'betting-win-strategy-export.v1',",
      "  supportedProfiles: ['predictive_fixture_dataset_v0', 'surebet_standard_binary_v0'],",
      "  readOnlyFunctions: ['exportHistoricalBundle', 'getHistoricalQuotes', 'getProviderGenerations', 'inspectSourceLineage'],",
      '};',
    ].join('\n'),
    'utf-8',
  );

  runGit(upstreamRoot, ['init', '-q']);
  runGit(upstreamRoot, ['config', 'user.name', 'BWS Test']);
  runGit(upstreamRoot, ['config', 'user.email', 'bws-test@example.com']);
  runGit(upstreamRoot, ['add', '.']);
  runGit(upstreamRoot, ['commit', '-q', '-m', 'fixture']);
  return { bwsRoot, tempRoot, upstreamRoot };
}

function captureStream(): {
  readonly stream: NodeJS.WriteStream;
  read(): string;
} {
  let text = '';
  return Object.freeze({
    read() {
      return text;
    },
    stream: {
      write(chunk: string | Uint8Array) {
        text += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
        return true;
      },
    } as NodeJS.WriteStream,
  });
}

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf-8', stdio: 'pipe' });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
