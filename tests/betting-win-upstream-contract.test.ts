import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  UpstreamVerificationError,
  generateBettingWinUpstreamLock,
  verifyBettingWinUpstreamLock,
  writeBettingWinUpstreamLock,
} from '../src/upstream/betting-win-upstream-lock.js';

const ROOT = process.cwd();
const FIXED_VERIFIED_AT = '2026-07-14T10:00:00.000Z';
const SCHEMA_PATH = join(ROOT, 'schemas', 'betting-win-upstream-lock.v1.schema.json');
const REQUIRED_PACKAGES = [
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
] as const;
const WORKSPACE_PACKAGES = [
  ...REQUIRED_PACKAGES,
  '@betting-win/evidence-import',
  '@betting-win/jobs',
  '@betting-win/api',
  '@betting-win/web',
  '@betting-win/workers',
] as const;

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf-8', stdio: 'pipe' });
}

function runGitBuffer(cwd: string, args: readonly string[]): Buffer {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'buffer', stdio: 'pipe' });
}

function sha256Hex(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function createBettingWinFixture(options: { readonly packageName?: string } = {}) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'bws-upstream-lock-'));
  const bwsRoot = join(tempRoot, 'betting-win-surebet');
  const upstreamRoot = join(tempRoot, 'betting-win');
  mkdirSync(bwsRoot, { recursive: true });
  mkdirSync(join(bwsRoot, 'config'), { recursive: true });
  mkdirSync(upstreamRoot, { recursive: true });

  writeJson(join(upstreamRoot, 'package.json'), {
    name: options.packageName ?? 'betting-win',
    version: '0.48.0',
    private: true,
    workspaces: ['packages/*', 'apps/*'],
  });

  for (const packageName of WORKSPACE_PACKAGES) {
    const parts = packageName.split('/');
    const scope = parts[0];
    const slug = parts[1];
    assert.ok(typeof scope === 'string' && scope.length > 0);
    assert.ok(typeof slug === 'string' && slug.length > 0);
    const workspaceRoot = slug === 'api' || slug === 'web' || slug === 'workers' ? 'apps' : 'packages';
    const workspacePath = join(upstreamRoot, workspaceRoot, slug);
    mkdirSync(workspacePath, { recursive: true });
    writeJson(join(workspacePath, 'package.json'), {
      name: `${scope}/${slug}`,
      version: '0.48.0',
      private: true,
      type: 'module',
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

  return { tempRoot, bwsRoot, upstreamRoot };
}

function expectVerificationError(
  callback: () => unknown,
  code: string,
  messagePattern?: RegExp,
): void {
  assert.throws(
    callback,
    (error: unknown) => {
      assert.ok(error instanceof UpstreamVerificationError);
      assert.equal(error.code, code);
      if (messagePattern !== undefined) {
        assert.match(error.message, messagePattern);
      }
      return true;
    },
  );
}

test('upstream lock schema and static repository validator remain wired', () => {
  const schema = JSON.parse(readFileSync(join(ROOT, 'schemas/betting-win-upstream-lock.v1.schema.json'), 'utf-8')) as Record<string, unknown>;
  const properties = schema.properties as Record<string, Record<string, unknown>>;
  assert.equal(schema.additionalProperties, false);
  assert.equal(properties.commitSha!.pattern, '^[0-9a-f]{40}$');
  assert.equal(properties.gitTreeSha!.pattern, '^[0-9a-f]{40}$');
  assert.equal(properties.trackedTreeListingSha256!.pattern, '^[0-9a-f]{64}$');
  assert.equal(properties.sourceFingerprintAlgorithm!.const, 'sha256_git_ls_tree_r_full_tree_head_v1');
  assert.equal(properties.contractSchema!.const, 'betting-win.strategy-export.v1');
  assert.equal(properties.surebetProfile!.const, 'surebet_standard_binary_v0');

  const output = execFileSync('python3', ['scripts/validate_betting_win_upstream_contract.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_betting_win_upstream_contract: ok/);
});

test('upstream lock generation captures exact Git evidence, package versions, and write-read verification', () => {
  const fixture = createBettingWinFixture();
  try {
    const lock = generateBettingWinUpstreamLock({
      bettingWinRepoPath: fixture.upstreamRoot,
      repositoryRoot: fixture.bwsRoot,
      allowedBoundaryRoot: fixture.tempRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: FIXED_VERIFIED_AT,
    });

    assert.equal(lock.repository, 'betting-win');
    assert.equal(lock.repositoryPath, fixture.upstreamRoot);
    assert.equal(lock.worktreeClean, true);
    assert.equal(lock.packageVersion, '0.48.0');
    assert.equal(lock.verifiedAt, FIXED_VERIFIED_AT);
    assert.deepEqual(lock.capabilities, [
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]);
    assert.equal(lock.packageVersions['@betting-win/provider-collection'], '0.48.0');
    assert.equal(lock.packageVersions['@betting-win/api'], '0.48.0');
    assert.equal(lock.commitSha, runGit(fixture.upstreamRoot, ['rev-parse', 'HEAD']).trim());
    assert.equal(lock.gitTreeSha, runGit(fixture.upstreamRoot, ['rev-parse', 'HEAD^{tree}']).trim());
    assert.equal(
      lock.trackedTreeListingSha256,
      sha256Hex(runGitBuffer(fixture.upstreamRoot, ['ls-tree', '-r', '--full-tree', 'HEAD'])),
    );

    const written = writeBettingWinUpstreamLock({
      bettingWinRepoPath: fixture.upstreamRoot,
      repositoryRoot: fixture.bwsRoot,
      allowedBoundaryRoot: fixture.tempRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: FIXED_VERIFIED_AT,
    });
    const persisted = JSON.parse(readFileSync(join(fixture.bwsRoot, 'config', 'betting-win.upstream.lock.json'), 'utf-8')) as Record<string, unknown>;
    assert.deepEqual(written, lock);
    assert.deepEqual(persisted, lock);
    assert.deepEqual(
      verifyBettingWinUpstreamLock(persisted, {
        bettingWinRepoPath: fixture.upstreamRoot,
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: fixture.tempRoot,
        schemaPath: SCHEMA_PATH,
      }),
      lock,
    );
  } finally {
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock generation fails fast when BETTING_WIN_REPO_PATH is missing or outside the allowed boundary', () => {
  const fixture = createBettingWinFixture();
  try {
    const outsideBoundaryRoot = join(fixture.tempRoot, 'outside-only');
    mkdirSync(outsideBoundaryRoot, { recursive: true });
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: '',
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: fixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_REPO_PATH_MISSING',
      /BETTING_WIN_REPO_PATH must be set/,
    );

    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: fixture.upstreamRoot,
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: outsideBoundaryRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_REPO_PATH_OUTSIDE_ALLOWED_BOUNDARY',
      /allowed development boundary/,
    );
  } finally {
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock generation rejects dirty and invalid betting-win checkouts', () => {
  const dirtyFixture = createBettingWinFixture();
  try {
    writeFileSync(join(dirtyFixture.upstreamRoot, 'UNTRACKED.txt'), 'dirty\n', 'utf-8');
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: dirtyFixture.upstreamRoot,
        repositoryRoot: dirtyFixture.bwsRoot,
        allowedBoundaryRoot: dirtyFixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_WORKTREE_DIRTY',
      /UNTRACKED\.txt/,
    );
  } finally {
    rmSync(dirtyFixture.tempRoot, { recursive: true, force: true });
  }

  const unreadableFixture = createBettingWinFixture();
  try {
    chmodSync(unreadableFixture.upstreamRoot, 0o000);
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: unreadableFixture.upstreamRoot,
        repositoryRoot: unreadableFixture.bwsRoot,
        allowedBoundaryRoot: unreadableFixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_REPO_PATH_UNREADABLE',
      /unreadable/,
    );
  } finally {
    chmodSync(unreadableFixture.upstreamRoot, 0o755);
    rmSync(unreadableFixture.tempRoot, { recursive: true, force: true });
  }

  const invalidFixture = createBettingWinFixture({ packageName: 'not-betting-win' });
  try {
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: invalidFixture.upstreamRoot,
        repositoryRoot: invalidFixture.bwsRoot,
        allowedBoundaryRoot: invalidFixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_NOT_A_BETTING_WIN_CHECKOUT',
      /package\.json name must be betting-win/,
    );
  } finally {
    rmSync(invalidFixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock generation rejects missing package evidence and missing Git evidence', () => {
  const missingPackageFixture = createBettingWinFixture();
  try {
    rmSync(join(missingPackageFixture.upstreamRoot, 'package.json'));
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: missingPackageFixture.upstreamRoot,
        repositoryRoot: missingPackageFixture.bwsRoot,
        allowedBoundaryRoot: missingPackageFixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_PACKAGE_JSON_INVALID',
      /Required file is missing/,
    );
  } finally {
    rmSync(missingPackageFixture.tempRoot, { recursive: true, force: true });
  }

  const missingGitFixture = createBettingWinFixture();
  try {
    rmSync(join(missingGitFixture.upstreamRoot, '.git'), { recursive: true, force: true });
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: missingGitFixture.upstreamRoot,
        repositoryRoot: missingGitFixture.bwsRoot,
        allowedBoundaryRoot: missingGitFixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_GIT_TOPLEVEL_UNAVAILABLE',
      /rev-parse --show-toplevel failed/,
    );
  } finally {
    rmSync(missingGitFixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock verification fails closed on mismatch and tamper after lock generation', () => {
  const fixture = createBettingWinFixture();
  try {
    const lock = generateBettingWinUpstreamLock({
      bettingWinRepoPath: fixture.upstreamRoot,
      repositoryRoot: fixture.bwsRoot,
      allowedBoundaryRoot: fixture.tempRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: FIXED_VERIFIED_AT,
    });

    writeJson(join(fixture.upstreamRoot, 'package.json'), {
      name: 'betting-win',
      version: '0.49.0',
      private: true,
      workspaces: ['packages/*', 'apps/*'],
    });
    runGit(fixture.upstreamRoot, ['add', 'package.json']);
    runGit(fixture.upstreamRoot, ['commit', '-q', '-m', 'bump version']);

    expectVerificationError(
      () => verifyBettingWinUpstreamLock(lock, {
        bettingWinRepoPath: fixture.upstreamRoot,
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: fixture.tempRoot,
        schemaPath: SCHEMA_PATH,
      }),
      'BETTING_WIN_UPSTREAM_LOCK_MISMATCH',
      /does not match the current verified checkout/,
    );

    writeFileSync(join(fixture.upstreamRoot, 'packages', 'provider-collection', 'src', 'index.ts'), 'tampered\n', 'utf-8');
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: fixture.upstreamRoot,
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: fixture.tempRoot,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_WORKTREE_DIRTY',
      /provider-collection\/src\/index\.ts/,
    );
  } finally {
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});
