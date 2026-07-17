import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const tempRoot = mkdtempSync('/tmp/bws-upstream-lock-');
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

function resolveGitBinary(): string {
  return execFileSync('bash', ['-lc', 'command -v git'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();
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
  const schema = JSON.parse(readFileSync(join(ROOT, 'schemas', 'betting-win-upstream-lock.v1.schema.json'), 'utf-8')) as Record<string, unknown>;
  const properties = schema.properties as Record<string, Record<string, unknown>>;
  assert.equal(schema.additionalProperties, false);
  assert.equal(properties.commitSha!.pattern, '^[0-9a-f]{40}$');
  assert.equal(properties.gitTreeSha!.pattern, '^[0-9a-f]{40}$');
  assert.equal(properties.sourceView!.const, 'committed_git_head');
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

test('upstream lock generation captures exact committed Git evidence, package versions, and write-read verification', () => {
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
    assert.equal(lock.sourceView, 'committed_git_head');
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
        schemaPath: SCHEMA_PATH,
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
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_REPO_PATH_OUTSIDE_ALLOWED_BOUNDARY',
      /allowed development boundary/,
    );
  } finally {
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock reads committed HEAD from a dirty worktree and rejects unreadable or invalid checkouts', () => {
  const dirtyFixture = createBettingWinFixture();
  try {
    const expectedCommit = runGit(dirtyFixture.upstreamRoot, ['rev-parse', 'HEAD']).trim();
    writeJson(join(dirtyFixture.upstreamRoot, 'package.json'), {
      name: 'not-the-committed-package',
      version: '99.0.0',
      workspaces: [],
    });
    writeFileSync(
      join(dirtyFixture.upstreamRoot, 'packages', 'provider-collection', 'src', 'index.ts'),
      'uncommitted incompatible worktree content\n',
      'utf-8',
    );
    writeFileSync(join(dirtyFixture.upstreamRoot, 'UNTRACKED.txt'), 'untracked runtime state\n', 'utf-8');

    const lock = generateBettingWinUpstreamLock({
      bettingWinRepoPath: dirtyFixture.upstreamRoot,
      repositoryRoot: dirtyFixture.bwsRoot,
      allowedBoundaryRoot: dirtyFixture.tempRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: FIXED_VERIFIED_AT,
    });
    assert.equal(lock.commitSha, expectedCommit);
    assert.equal(lock.packageVersion, '0.48.0');
    assert.equal(lock.sourceView, 'committed_git_head');
    assert.deepEqual(
      verifyBettingWinUpstreamLock(lock, {
        bettingWinRepoPath: dirtyFixture.upstreamRoot,
        repositoryRoot: dirtyFixture.bwsRoot,
        allowedBoundaryRoot: dirtyFixture.tempRoot,
        schemaPath: SCHEMA_PATH,
      }),
      lock,
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
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_REPO_PATH_UNREADABLE',
      /readable and searchable/,
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
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_NOT_A_BETTING_WIN_CHECKOUT',
      /committed package\.json name must be betting-win/,
    );
  } finally {
    rmSync(invalidFixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock generation rejects missing committed package evidence and missing Git evidence', () => {
  const missingPackageFixture = createBettingWinFixture();
  try {
    runGit(missingPackageFixture.upstreamRoot, ['rm', '-q', 'package.json']);
    runGit(missingPackageFixture.upstreamRoot, ['commit', '-q', '-m', 'remove package evidence']);
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: missingPackageFixture.upstreamRoot,
        repositoryRoot: missingPackageFixture.bwsRoot,
        allowedBoundaryRoot: missingPackageFixture.tempRoot,
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_PACKAGE_JSON_INVALID',
      /git show HEAD:package\.json failed/,
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
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_GIT_TOPLEVEL_UNAVAILABLE',
      /rev-parse --show-toplevel failed/,
    );
  } finally {
    rmSync(missingGitFixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock verification fails closed on committed mismatch and committed capability tamper', () => {
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

    writeFileSync(join(fixture.upstreamRoot, 'packages', 'provider-collection', 'src', 'index.ts'), 'committed incompatible content\n', 'utf-8');
    runGit(fixture.upstreamRoot, ['add', 'packages/provider-collection/src/index.ts']);
    runGit(fixture.upstreamRoot, ['commit', '-q', '-m', 'remove downstream capability markers']);
    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: fixture.upstreamRoot,
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: fixture.tempRoot,
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_REQUIRED_CAPABILITY_MISSING',
      /committed provider collection surface/,
    );
  } finally {
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});

test('upstream lock verification accepts semantically identical locks with reordered keys', () => {
  const fixture = createBettingWinFixture();
  try {
    const lock = generateBettingWinUpstreamLock({
      bettingWinRepoPath: fixture.upstreamRoot,
      repositoryRoot: fixture.bwsRoot,
      allowedBoundaryRoot: fixture.tempRoot,
      schemaPath: SCHEMA_PATH,
      verifiedAt: FIXED_VERIFIED_AT,
    });

    const reorderedLock = {
      capabilities: [...lock.capabilities],
      packageVersions: Object.fromEntries(
        Object.entries(lock.packageVersions).reverse(),
      ),
      verifiedAt: lock.verifiedAt,
      surebetProfile: lock.surebetProfile,
      contractAlias: lock.contractAlias,
      contractSchema: lock.contractSchema,
      sourceFingerprintAlgorithm: lock.sourceFingerprintAlgorithm,
      trackedTreeListingSha256: lock.trackedTreeListingSha256,
      packageVersion: lock.packageVersion,
      sourceView: lock.sourceView,
      gitTreeSha: lock.gitTreeSha,
      commitSha: lock.commitSha,
      repositoryPath: lock.repositoryPath,
      repository: lock.repository,
      schema: lock.schema,
    };

    assert.deepEqual(
      verifyBettingWinUpstreamLock(reorderedLock, {
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

test('upstream lock generation proves committed HEAD remains unchanged during verification', () => {
  const fixture = createBettingWinFixture();
  const originalPath = process.env.PATH;
  try {
    const gitBinary = resolveGitBinary();
    const binDirectory = join(fixture.tempRoot, 'bin');
    const stateFile = join(fixture.tempRoot, 'git-wrapper-state.txt');
    const targetFile = join(fixture.upstreamRoot, 'packages', 'provider-collection', 'src', 'index.ts');
    mkdirSync(binDirectory, { recursive: true });
    writeFileSync(
      join(binDirectory, 'git'),
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        `REAL_GIT=${JSON.stringify(gitBinary)}`,
        `STATE_FILE=${JSON.stringify(stateFile)}`,
        `REPO_PATH=${JSON.stringify(fixture.upstreamRoot)}`,
        `TARGET_FILE=${JSON.stringify(targetFile)}`,
        '"$REAL_GIT" "$@"',
        'if [ "$#" -ge 6 ] && [ "$1" = "-C" ] && [ "$3" = "ls-tree" ] && [ "$4" = "-r" ] && [ "$5" = "--full-tree" ] && [ "$6" = "HEAD" ]; then',
        '  count=0',
        '  if [ -f "$STATE_FILE" ]; then',
        '    count="$(cat "$STATE_FILE")"',
        '  fi',
        '  if [ "$count" = "0" ]; then',
        '    printf \'1\' > "$STATE_FILE"',
        '    printf \'\\n// committed during verification\\n\' >> "$TARGET_FILE"',
        '    "$REAL_GIT" -C "$REPO_PATH" add packages/provider-collection/src/index.ts',
        '    "$REAL_GIT" -C "$REPO_PATH" -c user.name="BWS Test" -c user.email="bws-test@example.com" commit -q -m "mutate HEAD during verification"',
        '  fi',
        'fi',
      ].join('\n'),
      'utf-8',
    );
    chmodSync(join(binDirectory, 'git'), 0o755);
    process.env.PATH = `${binDirectory}:${originalPath ?? ''}`;

    expectVerificationError(
      () => generateBettingWinUpstreamLock({
        bettingWinRepoPath: fixture.upstreamRoot,
        repositoryRoot: fixture.bwsRoot,
        allowedBoundaryRoot: fixture.tempRoot,
        schemaPath: SCHEMA_PATH,
        verifiedAt: FIXED_VERIFIED_AT,
      }),
      'BETTING_WIN_CHECKOUT_CHANGED_DURING_VERIFICATION',
      /committed HEAD changed while the upstream lock was being verified/,
    );
  } finally {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }
    rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});
