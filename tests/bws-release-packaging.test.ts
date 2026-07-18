import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  createBwsReleasePackage,
  type BwsReleaseManifest,
  type BwsReleasePackageResult,
} from '../src/operations/release-packaging.js';

const REPO_ROOT = process.cwd();
const DIST_RELEASE_CLI = join(REPO_ROOT, 'dist', 'packages', 'bootstrap', 'src', 'cli', 'bws-release-packaging.js');
const COCKPIT_METADATA_FILE = join(REPO_ROOT, 'dist', 'apps', 'web', 'bws-cockpit-build.json');
const TEST_PASSWORD = 'super-secret-release-password';

interface ReleaseFixture {
  readonly outputDirectory: string;
  readonly result: BwsReleasePackageResult;
}

let cachedReleaseFixture: Promise<ReleaseFixture> | undefined;

test('BWS release packaging is deterministic for identical source and build state', async () => {
  const first = await getReleaseFixture();
  const secondOutputDirectory = mkdtempSync(join(tmpdir(), 'bws-release-package-second-'));
  try {
    const second = await createBwsReleasePackage({
      outputDirectory: secondOutputDirectory,
      repositoryRoot: REPO_ROOT,
    });
    assert.equal(first.result.semanticFingerprint, second.semanticFingerprint);
    assert.equal(first.result.manifest.archive.payloadFingerprintSha256, second.manifest.archive.payloadFingerprintSha256);
    assert.deepEqual(first.result.manifest.archive.payloadFiles, second.manifest.archive.payloadFiles);
  } finally {
    rmSync(secondOutputDirectory, { force: true, recursive: true });
  }
});

test('extracted release verifies itself through the bundled release-packaging CLI without leaking secrets', async () => {
  const fixture = await getReleaseFixture();
  const extraction = extractReleaseArchive(fixture.result.archiveFile);
  const privateEnvFile = join(extraction.tempDirectory, 'private.env');
  writePrivateEnvironmentFile(privateEnvFile, extraction.manifest, TEST_PASSWORD);
  const fakeBin = createFakePostgreSqlClient('16.3');
  const scratchDirectory = join(extraction.tempDirectory, 'scratch');
  const env = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH === undefined ? '' : process.env.PATH}`,
  };
  const result = spawnSync(
    'node',
    [
      join(extraction.rootDirectory, 'dist', 'packages', 'bootstrap', 'src', 'cli', 'bws-release-packaging.js'),
      'verify-install',
      '--release-dir',
      extraction.rootDirectory,
      '--env-file',
      privateEnvFile,
      '--scratch-dir',
      scratchDirectory,
      '--archive',
      fixture.result.archiveFile,
    ],
    {
      cwd: extraction.rootDirectory,
      encoding: 'utf-8',
      env,
      stdio: 'pipe',
    },
  );
  try {
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!result.stdout.includes(TEST_PASSWORD), 'verification output must not include the private password');
    const verification = JSON.parse(result.stdout) as {
      archiveCheck: { verified: boolean };
      schema: string;
      semanticFingerprint: string;
      verifiedChecks: readonly string[];
    };
    assert.equal(verification.schema, 'bws.release_install_verification.v1');
    assert.equal(verification.semanticFingerprint, extraction.manifest.semanticFingerprint);
    assert.equal(verification.archiveCheck.verified, true);
    assert.ok(verification.verifiedChecks.includes('archive_checksum_and_inventory_verified'));
  } finally {
    cleanupExtraction(extraction.tempDirectory);
    rmSync(dirname(fakeBin), { force: true, recursive: true });
  }
});

test('release archive excludes secrets, runtime state, logs, and artifacts', async () => {
  const fixture = await getReleaseFixture();
  const entries = listArchiveEntries(fixture.result.archiveFile);
  const releaseRootPrefix = `${fixture.result.manifest.releaseId}/`;
  assert.ok(!entries.some((entry) => entry.endsWith('/.env')));
  assert.ok(!entries.some((entry) => entry.startsWith(`${releaseRootPrefix}artifacts/`)));
  assert.ok(!entries.some((entry) => entry.startsWith(`${releaseRootPrefix}runtime/`)));
  assert.ok(!entries.some((entry) => entry.startsWith(`${releaseRootPrefix}logs/`)));
  assert.ok(entries.some((entry) => entry.endsWith('/config/bws.private.env.template')));
  assert.ok(entries.some((entry) => entry.endsWith('/deployment/systemd-user/bws-operator.service.template')));
});

test('install verification rejects tampered releases and partial private configuration without leaking secrets', async () => {
  const fixture = await getReleaseFixture();
  const extraction = extractReleaseArchive(fixture.result.archiveFile);
  const privateEnvFile = join(extraction.tempDirectory, 'private.env');
  writePrivateEnvironmentFile(privateEnvFile, extraction.manifest, TEST_PASSWORD);
  const tamperedPackageLock = join(extraction.rootDirectory, 'package-lock.json');
  writeFileSync(tamperedPackageLock, `${readFileSync(tamperedPackageLock, 'utf-8')}\n`, 'utf-8');
  const fakeBin = createFakePostgreSqlClient('16.3');
  const scratchDirectory = join(extraction.tempDirectory, 'scratch');
  const env = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH === undefined ? '' : process.env.PATH}`,
  };
  const tamperResult = spawnSync(
    'node',
    [
      DIST_RELEASE_CLI,
      'verify-install',
      '--release-dir',
      extraction.rootDirectory,
      '--env-file',
      privateEnvFile,
      '--scratch-dir',
      scratchDirectory,
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env,
      stdio: 'pipe',
    },
  );
  assert.notEqual(tamperResult.status, 0);
  assert.match(tamperResult.stderr, /checksum mismatch|package-lock/i);
  assert.ok(!tamperResult.stderr.includes(TEST_PASSWORD), 'tamper failure must not leak secrets');

  const cleanExtraction = extractReleaseArchive(fixture.result.archiveFile);
  const partialEnvFile = join(cleanExtraction.tempDirectory, 'partial.env');
  writePrivateEnvironmentFile(partialEnvFile, cleanExtraction.manifest, TEST_PASSWORD, ['POSTGRES_USER']);
  const partialResult = spawnSync(
    'node',
    [
      DIST_RELEASE_CLI,
      'verify-install',
      '--release-dir',
      cleanExtraction.rootDirectory,
      '--env-file',
      partialEnvFile,
      '--scratch-dir',
      join(cleanExtraction.tempDirectory, 'scratch'),
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      env,
      stdio: 'pipe',
    },
  );
  try {
    assert.notEqual(partialResult.status, 0);
    assert.match(partialResult.stderr, /POSTGRES_USER/);
    assert.ok(!partialResult.stderr.includes(TEST_PASSWORD), 'partial-config failure must not leak secrets');
  } finally {
    cleanupExtraction(extraction.tempDirectory);
    cleanupExtraction(cleanExtraction.tempDirectory);
    rmSync(dirname(fakeBin), { force: true, recursive: true });
  }
});

async function getReleaseFixture(): Promise<ReleaseFixture> {
  if (cachedReleaseFixture !== undefined) {
    return cachedReleaseFixture;
  }
  cachedReleaseFixture = (async () => {
    await ensureRuntimeCockpitBuild();
    const outputDirectory = mkdtempSync(join(tmpdir(), 'bws-release-package-'));
    const result = await createBwsReleasePackage({
      outputDirectory,
      repositoryRoot: REPO_ROOT,
    });
    return Object.freeze({
      outputDirectory,
      result,
    });
  })();
  return cachedReleaseFixture;
}

async function ensureRuntimeCockpitBuild(): Promise<void> {
  const compiledWebEntry = join(REPO_ROOT, 'dist', 'apps', 'web', 'src', 'index.js');
  if (!existsSync(COCKPIT_METADATA_FILE)) {
    execFileSync(
      'npm',
      ['run', 'build:runtime-cockpit'],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: {
          ...process.env,
          BWS_API_PORT: '4312',
        },
        stdio: 'pipe',
      },
    );
  }
  assert.ok(
    existsSync(compiledWebEntry),
    'managed cockpit build must preserve the compiled Node web module entrypoint',
  );
}

function extractReleaseArchive(archivePath: string): {
  readonly manifest: BwsReleaseManifest;
  readonly rootDirectory: string;
  readonly tempDirectory: string;
} {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-release-extract-'));
  execFileSync(
    'python3',
    [
      '-c',
      [
        'import sys',
        'import tarfile',
        'with tarfile.open(sys.argv[1], "r:gz") as archive:',
        '    archive.extractall(sys.argv[2])',
      ].join('\n'),
      archivePath,
      tempDirectory,
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    },
  );
  const [rootDirectoryName] = listArchiveTopLevelEntries(tempDirectory);
  if (rootDirectoryName === undefined) {
    throw new Error('Release archive extraction did not produce a top-level release directory.');
  }
  const rootDirectory = join(tempDirectory, rootDirectoryName);
  const manifest = JSON.parse(readFileSync(join(rootDirectory, 'release-manifest.json'), 'utf-8')) as BwsReleaseManifest;
  return Object.freeze({
    manifest,
    rootDirectory,
    tempDirectory,
  });
}

function cleanupExtraction(tempDirectory: string): void {
  rmSync(tempDirectory, { force: true, recursive: true });
}

function createFakePostgreSqlClient(version: string): string {
  const fakeBinDirectory = mkdtempSync(join(tmpdir(), 'bws-release-fake-bin-'));
  const fakePsqlPath = join(fakeBinDirectory, 'psql');
  writeFileSync(fakePsqlPath, `#!/usr/bin/env bash\nprintf 'psql (PostgreSQL) ${version}\\n'\n`, 'utf-8');
  chmodSync(fakePsqlPath, 0o755);
  return fakePsqlPath;
}

function listArchiveEntries(archivePath: string): readonly string[] {
  return JSON.parse(
    execFileSync(
      'python3',
      [
        '-c',
        [
          'import json',
          'import sys',
          'import tarfile',
          'with tarfile.open(sys.argv[1], "r:gz") as archive:',
          '    print(json.dumps(sorted(name for name in archive.getnames() if name and name != ".")))',
        ].join('\n'),
        archivePath,
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
    ),
  ) as readonly string[];
}

function listArchiveTopLevelEntries(extractionDirectory: string): readonly string[] {
  return Object.freeze(
    JSON.parse(
      execFileSync(
      'python3',
      [
        '-c',
        [
          'import json',
          'import os',
          'import sys',
          'entries = sorted(name for name in os.listdir(sys.argv[1]) if os.path.isdir(os.path.join(sys.argv[1], name)))',
          'print(json.dumps(entries))',
        ].join('\n'),
        extractionDirectory,
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
      ),
    ) as readonly string[],
  ) as unknown as readonly string[];
}

function writePrivateEnvironmentFile(
  envFile: string,
  manifest: BwsReleaseManifest,
  password: string,
  omittedKeys: readonly string[] = [],
): void {
  const port = new URL(manifest.cockpit.apiBaseUrl).port;
  const lines = [
    'BETTING_WIN_REPO_PATH=/operator/read-only/betting-win',
    'BWS_UPSTREAM_LOCK_PATH=./config/betting-win.upstream.lock.json',
    'BWS_UPSTREAM_MODE=export',
    'BWS_UPSTREAM_EXPORT_SELECTION_PATH=/operator/input/export-selection.json',
    `BWS_API_PORT=${port}`,
    'BWS_WORKER_ID=worker-bws-release-001',
    'BWS_WORKER_QUEUE_NAME=private-paper',
    'BWS_WORKER_LEASE_DURATION_MS=30000',
    'BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS=60000',
    'BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS=1000',
    'BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS=30000',
    'BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS=30000',
    'BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS=60000',
    'BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS=1000',
    'BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS=30000',
    'BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS=30000',
    'BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH=128',
    'BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS=5000',
    'BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS=1000',
    'BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS=30000',
    'BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS=30000',
    'BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS=128',
    'SUREBET_RUNTIME_MODE=paper',
    'SUREBET_PROVIDER_CONNECTIONS=disabled',
    'SUREBET_EXECUTION_ENABLED=false',
    'POSTGRES_ADDRESS=127.0.0.1:5432',
    'POSTGRES_USER=betting_win',
    `POSTGRES_PASSWORD=${password}`,
    'POSTGRES_DB=betting_win_surebet',
  ];
  const filtered = lines.filter((line) => {
    const separatorIndex = line.indexOf('=');
    const name = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    return !omittedKeys.includes(name);
  });
  writeFileSync(envFile, `${filtered.join('\n')}\n`, 'utf-8');
}
