import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BWS_UPSTREAM_API_BASE_URL_ENV,
  BWS_UPSTREAM_API_TIMEOUT_MS_ENV,
  BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV,
  BWS_UPSTREAM_LOCK_PATH_ENV,
  BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA,
  BWS_UPSTREAM_MODE_ENV,
  parseBwsUpstreamExportSelectionManifest,
  resolveBwsUpstreamExportConvergenceConfig,
  runBwsUpstreamExportConvergenceCli,
  runBwsUpstreamExportConvergencePass,
  type BwsUpstreamExportConvergenceConfig,
  type BwsUpstreamExportSelectionEntry,
  type RunBwsUpstreamExportConvergencePassRequest,
} from '../packages/bootstrap/src/index.js';
import {
  writeBettingWinUpstreamLock,
  type BettingWinUpstreamLock,
} from '../packages/upstream/src/index.js';

const ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-15T12:30:00.000Z';
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

test('upstream export convergence pass persists one explicit immutable export per bounded pass and remains idempotent after completion', () => {
  const fixture = createConvergenceFixture([
    createSelectionEntry('cursor-001', 'generation-id-001', 'record-001'),
    createSelectionEntry('cursor-002', 'generation-id-002', 'record-002'),
  ]);
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories);

    const firstPass = runBwsUpstreamExportConvergencePass({
      config: fixture.config,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:30:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(firstPass.ok, true);
    assert.equal(firstPass.value.processedCount, 1);
    assert.equal(firstPass.value.processedSelectionCursor, 'cursor-001');
    assert.equal(firstPass.value.completed, false);
    assert.equal(repositories.checkpoints.get('checkpoint-001')?.nextSelectionIndex, 1);
    assert.equal(repositories.importRuns.get('import:checkpoint-001:cursor-001')?.outcome, 'succeeded');

    const secondPass = runBwsUpstreamExportConvergencePass({
      config: fixture.config,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:31:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(secondPass.ok, true);
    assert.equal(secondPass.value.processedCount, 1);
    assert.equal(secondPass.value.processedSelectionCursor, 'cursor-002');
    assert.equal(secondPass.value.completed, true);
    assert.equal(repositories.checkpoints.get('checkpoint-001')?.nextSelectionIndex, 2);

    const thirdPass = runBwsUpstreamExportConvergencePass({
      config: fixture.config,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:32:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(thirdPass.ok, true);
    assert.equal(thirdPass.value.processedCount, 0);
    assert.equal(thirdPass.value.completed, true);
    assert.equal(repositories.pinnedStrategyExports.list().length, 2);
  } finally {
    fixture.dispose();
  }
});

test('upstream export convergence resumes from persisted import and pinned-export state when checkpoint advance is lost before restart', () => {
  const fixture = createConvergenceFixture([
    createSelectionEntry('cursor-001', 'generation-id-001', 'record-001'),
  ]);
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories);
    const firstPass = runBwsUpstreamExportConvergencePass({
      config: fixture.config,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:40:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(firstPass.ok, true);
    assert.equal(firstPass.value.completed, true);

    repositories.checkpoints.forceResetToInitial(
      Object.freeze({
        checkpointId: 'checkpoint-001',
        contractAlias: 'betting-win-strategy-export.v1',
        contractSchema: 'betting-win.strategy-export.v1',
        mode: 'export',
        nextSelectionIndex: 0,
        selectionCount: 1,
        selectionManifestLocator: fixture.config.selection.manifestPath,
        selectionManifestSha256: fixture.config.selection.manifestSha256,
        surebetProfile: 'surebet_standard_binary_v0',
        upstreamLockRecordId: `upstream-lock:${fixture.config.upstream.lock.commitSha}:${fixture.config.upstream.lock.gitTreeSha}`,
      }),
    );

    const restartPass = runBwsUpstreamExportConvergencePass({
      config: fixture.config,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:41:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(restartPass.ok, true);
    assert.equal(restartPass.value.processedCount, 1);
    assert.equal(restartPass.value.completed, true);
    assert.equal(repositories.checkpoints.get('checkpoint-001')?.nextSelectionIndex, 1);
    assert.equal(repositories.importRuns.get('import:checkpoint-001:cursor-001')?.completedAt, '2026-07-15T12:40:00.000Z');
  } finally {
    fixture.dispose();
  }
});

test('upstream export convergence blocks provider-generation mismatches and finalizes the deterministic import run as failed', () => {
  const fixture = createConvergenceFixture([
    createSelectionEntry('cursor-001', 'generation-id-001', 'record-001'),
  ]);
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories);
    const mismatchedConfig: BwsUpstreamExportConvergenceConfig = Object.freeze({
      ...fixture.config,
      selection: Object.freeze({
        ...fixture.config.selection,
        entries: Object.freeze([
          Object.freeze({
            ...fixture.config.selection.entries[0]!,
            expectedProviderGenerationIds: Object.freeze(['wrong-generation-id']),
          }),
        ]),
      }),
    });
    const result = runBwsUpstreamExportConvergencePass({
      config: mismatchedConfig,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:45:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'BWS_UPSTREAM_EXPORT_PROVIDER_GENERATIONS_MISMATCH');
    assert.equal(repositories.importRuns.get('import:checkpoint-001:cursor-001')?.outcome, 'failed');
  } finally {
    fixture.dispose();
  }
});

test('upstream export convergence rejects mutable selection replacement once a checkpoint exists', () => {
  const fixture = createConvergenceFixture([
    createSelectionEntry('cursor-001', 'generation-id-001', 'record-001'),
    createSelectionEntry('cursor-002', 'generation-id-002', 'record-002'),
  ]);
  try {
    const repositories = createInMemoryRepositories();
    const dependencies = asPassDependencies(repositories);
    const firstPass = runBwsUpstreamExportConvergencePass({
      config: fixture.config,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:50:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(firstPass.ok, true);

    const mutatedConfig: BwsUpstreamExportConvergenceConfig = Object.freeze({
      ...fixture.config,
      selection: Object.freeze({
        ...fixture.config.selection,
        manifestSha256: 'f'.repeat(64),
      }),
    });
    const secondPass = runBwsUpstreamExportConvergencePass({
      config: mutatedConfig,
      importRuns: dependencies.importRuns,
      now: () => '2026-07-15T12:51:00.000Z',
      pinnedStrategyExports: dependencies.pinnedStrategyExports,
      upstreamExportCheckpoints: dependencies.upstreamExportCheckpoints,
      upstreamLocks: dependencies.upstreamLocks,
    });
    assert.equal(secondPass.ok, false);
    assert.equal(secondPass.blockers[0]?.code, 'BWS_UPSTREAM_EXPORT_SELECTION_MUTATED');
  } finally {
    fixture.dispose();
  }
});

test('upstream export selection parser and CLI help stay explicit about export-only mode and deterministic ids', async () => {
  const manifest = JSON.stringify({
    schema: BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA,
    mode: 'export',
    checkpointId: 'checkpoint-001',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    exports: [
      {
        cursor: 'cursor-001',
        exportPath: '/tmp/export-001.json',
        expectedSha256: '4'.repeat(64),
        expectedProviderGenerationIds: ['generation-id-001', 'generation-id-001'],
        expectedSourceLineageRecordIds: ['record-001'],
      },
    ],
  });
  const parsed = parseBwsUpstreamExportSelectionManifest(manifest, '/tmp/selection.json');
  assert.equal(parsed.ok, false);
  assert.equal(parsed.blockers[0]?.code, 'BWS_UPSTREAM_EXPORT_SELECTION_IDS_DUPLICATE');

  const help = captureStream();
  assert.equal(await runBwsUpstreamExportConvergenceCli(['--help'], ROOT, help.stream), 0);
  assert.match(help.read(), /BWS_UPSTREAM_MODE=export/);
  assert.match(help.read(), /BWS_UPSTREAM_EXPORT_SELECTION_PATH/);
});

test('upstream export convergence config fails closed when export mode is combined with api or fixture inputs', () => {
  const fixture = createBettingWinFixture();
  try {
    writeBettingWinUpstreamLock({
      bettingWinRepoPath: fixture.upstreamRoot,
      repositoryRoot: fixture.bwsRoot,
      allowedBoundaryRoot: fixture.tempRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: TEST_TIMESTAMP,
    });
    const selectionManifest = createSelectionManifest([
      {
        cursor: 'cursor-001',
        exportPath: '/tmp/immutable-export-001.json',
        expectedProviderGenerationIds: ['generation-id-001'],
        expectedSha256: '4'.repeat(64),
        expectedSourceLineageRecordIds: ['record-001'],
      },
    ]);
    writeJson(join(fixture.bwsRoot, 'config', 'selection.json'), selectionManifest);

    const environment = {
      BETTING_WIN_REPO_PATH: fixture.upstreamRoot,
      [BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV]: 'config/selection.json',
      [BWS_UPSTREAM_LOCK_PATH_ENV]: 'config/betting-win.upstream.lock.json',
      [BWS_UPSTREAM_MODE_ENV]: 'export',
      SUREBET_EXECUTION_ENABLED: 'false',
      SUREBET_PG_DATABASE: 'surebet',
      SUREBET_PG_HOST: '127.0.0.1',
      SUREBET_PG_PORT: '5432',
      SUREBET_PG_USER: 'surebet',
      SUREBET_PROVIDER_CONNECTIONS: 'disabled',
      SUREBET_RUNTIME_MODE: 'paper',
    } as const;

    assert.throws(
      () =>
        resolveBwsUpstreamExportConvergenceConfig({
          ...environment,
          [BWS_UPSTREAM_API_BASE_URL_ENV]: 'http://127.0.0.1:3000',
          [BWS_UPSTREAM_API_TIMEOUT_MS_ENV]: '1000',
        }, fixture.bwsRoot),
      /must not fall back to api mode/,
    );

    assert.throws(
      () =>
        resolveBwsUpstreamExportConvergenceConfig({
          ...environment,
          SUREBET_PINNED_BUNDLE: 'tests/fixtures/private-paper-mode-smoke/accepted-local-bundle.json',
        }, fixture.bwsRoot),
      /must not fall back to local fixture or mock intake/,
    );
  } finally {
    rmSync(fixture.tempRoot, { force: true, recursive: true });
  }
});

function createConvergenceFixture(entries: readonly BwsUpstreamExportSelectionEntry[]): {
  readonly config: BwsUpstreamExportConvergenceConfig;
  readonly dispose: () => void;
} {
  const root = mkdtempSync(join(tmpdir(), 'bws-export-convergence-'));
  const repositoryRoot = join(root, 'betting-win-surebet');
  const upstreamRoot = join(root, 'betting-win');
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });

  const materializedEntries = entries.map((entry) => {
    const document = createStrategyExportDocument(
      entry.expectedProviderGenerationIds[0]!,
      entry.expectedSourceLineageRecordIds[0]!,
    );
    const exportPath = join(root, `${entry.cursor}.json`);
    const expectedSha256 = writeJsonAndHash(exportPath, document);
    return Object.freeze({
      ...entry,
      expectedSha256,
      exportPath,
    });
  });
  const manifest = createSelectionManifest(materializedEntries);
  const manifestPath = join(repositoryRoot, 'config', 'selection.json');
  const manifestSha256 = writeJsonAndHash(manifestPath, manifest);
  const lock = sampleUpstreamLock(upstreamRoot);

  return Object.freeze({
    config: Object.freeze({
      mode: 'export',
      persistence: Object.freeze({
        database: 'surebet',
        host: '127.0.0.1',
        port: 5432,
        user: 'surebet',
      }),
      repositoryRoot,
      selection: Object.freeze({
        checkpointId: manifest.checkpointId,
        contractAlias: manifest.contractAlias,
        contractSchema: manifest.contractSchema,
        entries: Object.freeze(materializedEntries),
        manifestPath,
        manifestSha256,
        surebetProfile: manifest.surebetProfile,
      }),
      upstream: Object.freeze({
        lock,
        lockPath: join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
        repoPath: upstreamRoot,
      }),
    }),
    dispose: () => rmSync(root, { force: true, recursive: true }),
  });
}

function createSelectionEntry(
  cursor: string,
  expectedProviderGenerationId: string,
  expectedSourceLineageRecordId: string,
): BwsUpstreamExportSelectionEntry {
  return Object.freeze({
    cursor,
    expectedProviderGenerationIds: Object.freeze([expectedProviderGenerationId]),
    expectedSha256: '0'.repeat(64),
    expectedSourceLineageRecordIds: Object.freeze([expectedSourceLineageRecordId]),
    exportPath: '',
  });
}

function createSelectionManifest(entries: readonly BwsUpstreamExportSelectionEntry[]) {
  return Object.freeze({
    schema: BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA,
    mode: 'export',
    checkpointId: 'checkpoint-001',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    exports: entries,
  });
}

function createInMemoryRepositories() {
  const upstreamLocks = new InMemoryUpstreamLocks();
  const checkpoints = new InMemoryCheckpoints();
  const importRuns = new InMemoryImportRuns();
  const pinnedStrategyExports = new InMemoryPinnedStrategyExports();
  return Object.freeze({
    checkpoints,
    importRuns,
    pinnedStrategyExports,
    upstreamLocks,
  });
}

function asPassDependencies(repositories: ReturnType<typeof createInMemoryRepositories>): Required<
  Pick<
    RunBwsUpstreamExportConvergencePassRequest,
    'importRuns' | 'pinnedStrategyExports' | 'upstreamExportCheckpoints' | 'upstreamLocks'
  >
> {
  return Object.freeze({
    importRuns: repositories.importRuns as unknown as NonNullable<RunBwsUpstreamExportConvergencePassRequest['importRuns']>,
    pinnedStrategyExports:
      repositories.pinnedStrategyExports as unknown as NonNullable<RunBwsUpstreamExportConvergencePassRequest['pinnedStrategyExports']>,
    upstreamExportCheckpoints:
      repositories.checkpoints as unknown as NonNullable<RunBwsUpstreamExportConvergencePassRequest['upstreamExportCheckpoints']>,
    upstreamLocks: repositories.upstreamLocks as unknown as NonNullable<RunBwsUpstreamExportConvergencePassRequest['upstreamLocks']>,
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

class InMemoryCheckpoints {
  #records = new Map<string, Record<string, unknown>>();

  get(checkpointId: string) {
    return this.#records.get(checkpointId) as
      | {
          readonly checkpointId: string;
          readonly contractAlias: string;
          readonly contractSchema: string;
          readonly completedAt?: string;
          readonly insertedAt: string;
          readonly lastImportRunId?: string;
          readonly lastPinnedStrategyExportRecordId?: string;
          readonly lastSelectionCursor?: string;
          readonly lastSourceSha256?: string;
          readonly mode: 'export';
          readonly nextSelectionIndex: number;
          readonly selectionCount: number;
          readonly selectionManifestLocator: string;
          readonly selectionManifestSha256: string;
          readonly surebetProfile: string;
          readonly updatedAt: string;
          readonly upstreamLockRecordId: string;
        }
      | undefined;
  }

  create(record: Record<string, unknown>) {
    const existing = this.get(record.checkpointId as string);
    if (existing !== undefined) {
      assert.deepEqual(comparable(existing), comparable(record));
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

  advance(record: {
    readonly checkpointId: string;
    readonly completedAt?: string;
    readonly expectedNextSelectionIndex: number;
    readonly lastImportRunId: string;
    readonly lastPinnedStrategyExportRecordId: string;
    readonly lastSelectionCursor: string;
    readonly lastSourceSha256: string;
    readonly nextSelectionIndex: number;
  }) {
    const existing = this.get(record.checkpointId);
    assert.notEqual(existing, undefined);
    assert.equal(existing!.nextSelectionIndex, record.expectedNextSelectionIndex);
    const persisted = Object.freeze({
      ...existing,
      completedAt: record.completedAt,
      lastImportRunId: record.lastImportRunId,
      lastPinnedStrategyExportRecordId: record.lastPinnedStrategyExportRecordId,
      lastSelectionCursor: record.lastSelectionCursor,
      lastSourceSha256: record.lastSourceSha256,
      nextSelectionIndex: record.nextSelectionIndex,
      updatedAt: record.completedAt ?? TEST_TIMESTAMP,
    });
    this.#records.set(record.checkpointId, persisted);
    return persisted;
  }

  forceResetToInitial(record: Record<string, unknown>) {
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
    return this.#records.get(importRunId) as
      | {
          readonly completedAt?: string;
          readonly failureCode?: string;
          readonly failureDetails?: unknown;
          readonly importRunId: string;
          readonly importedRecordCount?: number;
          readonly insertedAt: string;
          readonly metadata: unknown;
          readonly outcome: 'running' | 'succeeded' | 'failed';
          readonly requestedAt: string;
          readonly sourceKind: string;
          readonly sourceLocator: string;
          readonly startedAt: string;
          readonly updatedAt: string;
          readonly upstreamLockRecordId: string;
        }
      | undefined;
  }

  create(record: Record<string, unknown>) {
    const existing = this.get(record.importRunId as string);
    if (existing !== undefined) {
      return existing;
    }
    const persisted = Object.freeze({
      ...record,
      completedAt: undefined,
      failureCode: undefined,
      failureDetails: undefined,
      importedRecordCount: undefined,
      insertedAt: record.startedAt,
      outcome: 'running',
      updatedAt: record.startedAt,
    });
    this.#records.set(record.importRunId as string, persisted);
    return persisted;
  }

  finalize(record: {
    readonly completedAt: string;
    readonly failureCode?: string;
    readonly failureDetails?: unknown;
    readonly importRunId: string;
    readonly importedRecordCount: number;
    readonly outcome: 'succeeded' | 'failed';
  }) {
    const existing = this.get(record.importRunId);
    assert.notEqual(existing, undefined);
    if (existing!.outcome === 'running') {
      const persisted = Object.freeze({
        ...existing,
        completedAt: record.completedAt,
        failureCode: record.failureCode,
        failureDetails: record.failureDetails,
        importedRecordCount: record.importedRecordCount,
        outcome: record.outcome,
        updatedAt: record.completedAt,
      });
      this.#records.set(record.importRunId, persisted);
      return persisted;
    }
    assert.deepEqual(existing!.completedAt, record.completedAt);
    assert.equal(existing!.outcome, record.outcome);
    return existing!;
  }
}

class InMemoryPinnedStrategyExports {
  #records = new Map<string, Record<string, unknown>>();
  #byExportId = new Map<string, string>();
  #bySourceSha = new Map<string, string>();

  get(intakeRecordId: string) {
    return this.#records.get(intakeRecordId) as
      | {
          readonly contractAlias: string;
          readonly contractSchema: string;
          readonly endpointId: string;
          readonly exportId: string;
          readonly exportKind: string;
          readonly exportProfile: string;
          readonly exportedAt: string;
          readonly importRunId: string;
          readonly importedAt: string;
          readonly intakeRecordId: string;
          readonly normalizedEvidenceIds: readonly string[];
          readonly payloadSha256: string;
          readonly providerGenerationIds: readonly string[];
          readonly providerId: string;
          readonly sourceLineageRecordIds: readonly string[];
          readonly sourceLocator: string;
          readonly sourceSha256: string;
          readonly surebetProfile: string;
          readonly upstreamLockRecordId: string;
        }
      | undefined;
  }

  getByExportId(exportId: string) {
    const intakeRecordId = this.#byExportId.get(exportId);
    return intakeRecordId === undefined ? undefined : this.get(intakeRecordId);
  }

  getBySourceSha256(sourceSha256: string) {
    const intakeRecordId = this.#bySourceSha.get(sourceSha256);
    return intakeRecordId === undefined ? undefined : this.get(intakeRecordId);
  }

  create(record: Record<string, unknown>) {
    const existing = this.get(record.intakeRecordId as string);
    if (existing !== undefined) {
      assert.deepEqual(existing, record);
      return existing;
    }
    const duplicateExportId = this.getByExportId(record.exportId as string);
    assert.equal(duplicateExportId, undefined);
    const duplicateSourceSha = this.getBySourceSha256(record.sourceSha256 as string);
    assert.equal(duplicateSourceSha, undefined);
    const persisted = Object.freeze(record);
    this.#records.set(record.intakeRecordId as string, persisted);
    this.#byExportId.set(record.exportId as string, record.intakeRecordId as string);
    this.#bySourceSha.set(record.sourceSha256 as string, record.intakeRecordId as string);
    return persisted;
  }

  list() {
    return [...this.#records.values()];
  }
}

function createBettingWinFixture() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bws-export-resolver-'));
  const bwsRoot = join(tempRoot, 'betting-win-surebet');
  const upstreamRoot = join(tempRoot, 'betting-win');
  mkdirSync(bwsRoot, { recursive: true });
  mkdirSync(join(bwsRoot, 'config'), { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });

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

function createStrategyExportDocument(providerGenerationId: string, sourceLineageRecordId: string): Record<string, unknown> {
  const payload = {
    binding: {
      endpointId: 'endpoint-001',
      providerId: 'polymarket',
    },
    collectionReport: {
      normalizedEvidenceIds: ['normalized-001'],
      reportId: 'collection-report-001',
    },
    endpointDeclaration: { endpointId: 'endpoint-001' },
    fixtureDeclaration: { fixtureId: 'fixture-001' },
    quoteStore: {
      generationResolutions: [{ providerGenerationId, recordId: sourceLineageRecordId }],
      normalizedEvidence: [
        {
          normalizedEvidenceId: 'normalized-001',
          provider: 'polymarket',
          providerGenerationId,
          sourceLineageRecordId,
        },
      ],
      normalizedRejections: [],
    },
    rawStore: {
      observations: [{ observationId: 'observation-001' }],
      sourceLineageEvents: [{ eventId: 'event-001' }],
      sourceLineageRecords: [{ provider: 'polymarket', recordId: sourceLineageRecordId }],
    },
  };
  return Object.freeze({
    schemaVersion: '1.0.0',
    phase: 'F2-005F',
    exportId: `provider-history-export.fixture-001.${providerGenerationId}.${sourceLineageRecordId}`,
    exportProfile: 'provider_history_fixture_bundle_v1',
    exportKind: 'pinned_provider_history_bundle',
    exportedAt: TEST_TIMESTAMP,
    fixtureId: 'fixture-001',
    providerId: 'polymarket',
    endpointId: 'endpoint-001',
    transportMode: 'fixture',
    liveTransportAllowed: false,
    providerGenerationIds: [providerGenerationId],
    sourceLineageRecordIds: [sourceLineageRecordId],
    normalizedEvidenceIds: ['normalized-001'],
    payloadSha256: sha256Hex(stableJsonCompact(payload)),
    collectionReportSha256: sha256Hex(stableJsonCompact(payload.collectionReport)),
    payload,
  });
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

function comparable(value: unknown): string {
  return JSON.stringify(value);
}

function comparablePendingImportRun(value: Record<string, unknown>): string {
  return JSON.stringify({
    importRunId: value.importRunId,
    metadata: value.metadata,
    requestedAt: value.requestedAt,
    sourceKind: value.sourceKind,
    sourceLocator: value.sourceLocator,
    startedAt: value.startedAt,
    upstreamLockRecordId: value.upstreamLockRecordId,
  });
}

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf-8', stdio: 'pipe' });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function writeJsonAndHash(path: string, value: unknown): string {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path, text, 'utf-8');
  return sha256Hex(text);
}

function stableJsonCompact(value: unknown): string {
  return JSON.stringify(stableSort(value));
}

function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = stableSort((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
