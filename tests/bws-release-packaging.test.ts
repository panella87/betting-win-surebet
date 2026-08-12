import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import {
  createBwsReleasePackage,
  type BwsReleaseManifest,
  type BwsReleasePackageResult,
  verifyBwsReleaseInstallation,
} from '../src/operations/release-packaging.js';

const REPO_ROOT = process.cwd();
const DIST_RELEASE_CLI = join(REPO_ROOT, 'dist', 'packages', 'bootstrap', 'src', 'cli', 'bws-release-packaging.js');
const COCKPIT_METADATA_FILE = join(REPO_ROOT, 'dist', 'apps', 'web', 'bws-cockpit-build.json');
const TEST_PASSWORD = 'super-secret-release-password';

function execFileSync(
  command: string,
  args: readonly string[],
  options: Readonly<{
    cwd?: string;
    encoding?: BufferEncoding;
    env?: NodeJS.ProcessEnv;
    stdio?: 'pipe' | 'ignore' | 'inherit';
  }>,
): string {
  const result = spawnSync(command, args, {
    ...options,
    encoding: options.encoding ?? 'utf-8',
    stdio: options.stdio ?? 'pipe',
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}`,
      result.stderr,
      result.stdout,
    ].filter((part) => part.length > 0).join('\n'));
  }
  return result.stdout;
}

async function withFakePsqlPath<T>(fakePsqlPath: string, action: () => Promise<T>): Promise<T> {
  const originalPath = process.env.PATH;
  process.env.PATH = `${dirname(fakePsqlPath)}:${originalPath === undefined ? '' : originalPath}`;
  try {
    return await action();
  } finally {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }
  }
}

async function assertRejectsWithoutSecret(action: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      assert.match(message, pattern);
      assert.ok(!message.includes(TEST_PASSWORD), 'failure must not leak secrets');
      return true;
    },
  );
}

interface ReleaseFixture {
  readonly outputDirectory: string;
  readonly result: BwsReleasePackageResult;
}

let cachedReleaseFixture: Promise<ReleaseFixture> | undefined;

test('BWS release packaging is deterministic for identical source and build state', async () => {
  const first = await getReleaseFixture();
  const secondOutputDirectory = createReleaseOutputDirectory('bws-release-package-second-');
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

test('release packaging rejects output directories outside repo artifacts', async () => {
  const outsideRoot = join(REPO_ROOT, '.automation', 'tmp');
  mkdirSync(outsideRoot, { recursive: true });
  const outputDirectory = mkdtempSync(join(outsideRoot, 'bws-release-outside-'));
  try {
    await assert.rejects(
      () => createBwsReleasePackage({
        outputDirectory,
        repositoryRoot: REPO_ROOT,
      }),
      /must stay under repository artifacts/u,
    );
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});

test('release packaging rejects symlinked artifact output parents before creating directories', async () => {
  const outsideDirectory = mkdtempSync(join(tmpdir(), 'bws-release-symlink-outside-'));
  const linkPath = join(REPO_ROOT, 'artifacts', 'bws-release-output-link');
  try {
    rmSync(linkPath, { force: true, recursive: true });
    mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
    symlinkSync(outsideDirectory, linkPath);
    await assert.rejects(
      () => createBwsReleasePackage({
        outputDirectory: join(linkPath, 'nested'),
        repositoryRoot: REPO_ROOT,
      }),
      /must not contain symlinks/u,
    );
    assert.equal(existsSync(join(outsideDirectory, 'nested')), false);
  } finally {
    rmSync(linkPath, { force: true, recursive: true });
    rmSync(outsideDirectory, { force: true, recursive: true });
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
    const verificationOutput = result.stdout.trim().length > 0
      ? result.stdout
      : readFileSync(join(scratchDirectory, 'install-verification.json'), 'utf-8');
    const verification = JSON.parse(verificationOutput) as {
      archiveCheck: { verified: boolean };
      schema: string;
      semanticFingerprint: string;
      verifiedChecks: readonly string[];
    };
    assert.equal(verification.schema, 'bws.release_install_verification.v1');
    assert.equal(verification.semanticFingerprint, extraction.manifest.semanticFingerprint);
    assert.equal(verification.archiveCheck.verified, true);
    assert.ok(verification.verifiedChecks.includes('archive_checksum_and_inventory_verified'));

    const symlinkArchive = join(fixture.outputDirectory, 'tampered-symlink-release.tar.gz');
    createArchiveWithSymlinkMember(extraction.rootDirectory, extraction.manifest.releaseId, symlinkArchive);
    await assert.rejects(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        archivePath: symlinkArchive,
        envFile: privateEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-symlink'),
      })),
      /regular file/u,
    );

    const contentTamperedArchive = join(fixture.outputDirectory, 'tampered-content-release.tar.gz');
    createArchiveWithTamperedMemberContent(
      extraction.rootDirectory,
      extraction.manifest.releaseId,
      'package-lock.json',
      contentTamperedArchive,
    );
    await assert.rejects(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        archivePath: contentTamperedArchive,
        envFile: privateEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-content-tamper'),
      })),
      /archive file checksum mismatch/i,
    );

    const [firstExecutable] = extraction.manifest.executables;
    assert.ok(firstExecutable !== undefined);
    const modeTamperedArchive = join(fixture.outputDirectory, 'tampered-mode-release.tar.gz');
    createArchiveWithTamperedMemberMode(
      extraction.rootDirectory,
      extraction.manifest.releaseId,
      firstExecutable.path,
      modeTamperedArchive,
    );
    await assert.rejects(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        archivePath: modeTamperedArchive,
        envFile: privateEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-mode-tamper'),
      })),
      /archive file executability mismatch/i,
    );
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
  assert.ok(!entries.some((entry) => {
    const base = basename(entry);
    return base.startsWith('.env') && !['.env.example', '.env.sample', '.env.template'].includes(base);
  }));
  assert.ok(!entries.some((entry) => entry.startsWith(`${releaseRootPrefix}artifacts/`)));
  assert.ok(!entries.some((entry) => entry.startsWith(`${releaseRootPrefix}runtime/`)));
  assert.ok(!entries.some((entry) => entry.startsWith(`${releaseRootPrefix}logs/`)));
  assert.ok(entries.some((entry) => entry.endsWith('/config/bws.private.env.template')));
  assert.ok(entries.some((entry) => entry.endsWith('/deployment/systemd-user/bws-operator.service.template')));
});

test('install verification rejects retired export-mode operator inputs', async () => {
  const fixture = await getReleaseFixture();
  const extraction = extractReleaseArchive(fixture.result.archiveFile);
  const privateEnvFile = join(extraction.tempDirectory, 'private.env');
  const fakeBin = createFakePostgreSqlClient('16.3');
  try {
    writePrivateEnvironmentFile(privateEnvFile, extraction.manifest, TEST_PASSWORD);
    writeFileSync(
      privateEnvFile,
      `${readFileSync(privateEnvFile, 'utf-8')}BWS_UPSTREAM_EXPORT_SELECTION_PATH=/operator/input/export-selection.json\n`,
      'utf-8',
    );

    await assertRejectsWithoutSecret(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        envFile: privateEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-retired-export'),
      })),
      /forbids BWS_UPSTREAM_EXPORT_SELECTION_PATH|API-only/u,
    );

    const exportModeEnvFile = join(extraction.tempDirectory, 'export-mode.env');
    writePrivateEnvironmentFile(exportModeEnvFile, extraction.manifest, TEST_PASSWORD, ['BWS_UPSTREAM_MODE']);
    writeFileSync(
      exportModeEnvFile,
      `${readFileSync(exportModeEnvFile, 'utf-8')}BWS_UPSTREAM_MODE=export\n`,
      'utf-8',
    );
    await assertRejectsWithoutSecret(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        envFile: exportModeEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-export-mode'),
      })),
      /BWS_UPSTREAM_MODE=api|export mode is retired/u,
    );
  } finally {
    cleanupExtraction(extraction.tempDirectory);
    rmSync(dirname(fakeBin), { force: true, recursive: true });
  }
});

test('install verification rejects extracted release .env variants before runtime preflight', async () => {
  const fixture = await getReleaseFixture();
  const extraction = extractReleaseArchive(fixture.result.archiveFile);
  const privateEnvFile = join(extraction.tempDirectory, 'private.env');
  const fakeBin = createFakePostgreSqlClient('16.3');
  try {
    writePrivateEnvironmentFile(privateEnvFile, extraction.manifest, TEST_PASSWORD);
    writeFileSync(join(extraction.rootDirectory, '.env.production'), 'PRIVATE_VALUE=redacted\n', 'utf-8');

    await assertRejectsWithoutSecret(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        envFile: privateEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-env-variant'),
      })),
      /forbidden runtime, database, secret, or artifact path/u,
    );
  } finally {
    cleanupExtraction(extraction.tempDirectory);
    rmSync(dirname(fakeBin), { force: true, recursive: true });
  }
});

test('install verification rejects extracted release symlinks before checksum payload hashing', async () => {
  const fixture = await getReleaseFixture();
  const extraction = extractReleaseArchive(fixture.result.archiveFile);
  const privateEnvFile = join(extraction.tempDirectory, 'private.env');
  const fakeBin = createFakePostgreSqlClient('16.3');
  try {
    writePrivateEnvironmentFile(privateEnvFile, extraction.manifest, TEST_PASSWORD);
    rmSync(join(extraction.rootDirectory, 'package-lock.json'), { force: true });
    symlinkSync(join(extraction.tempDirectory, 'outside-package-lock.json'), join(extraction.rootDirectory, 'package-lock.json'));

    await assertRejectsWithoutSecret(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        envFile: privateEnvFile,
        releaseDirectory: extraction.rootDirectory,
        scratchDirectory: join(extraction.tempDirectory, 'scratch-symlink-checksum'),
      })),
      /must not contain symlinks|must not be a symlink/u,
    );
  } finally {
    cleanupExtraction(extraction.tempDirectory);
    rmSync(dirname(fakeBin), { force: true, recursive: true });
  }
});

test('release packaging rejects traversal paths from SOURCE_MANIFEST before payload staging', async () => {
  for (const unsafePath of [
    '../outside.txt',
    '/outside.txt',
    './README.md',
    'nested//bad.txt',
    'safe/../outside.txt',
    'safe/./file.txt',
    'nested/.git/config',
    'C:/outside.txt',
    '\\\\server\\share\\file.txt',
  ]) {
    const dir = mkdtempSync(join(tmpdir(), 'bws-release-manifest-traversal-'));
    const outputDirectory = join(dir, 'artifacts', 'out');
    try {
      writeFileSync(
        join(dir, 'SOURCE_MANIFEST.json'),
        JSON.stringify(
          {
            schema: 'betting-win-surebet-source-manifest-v1',
            generated: '2026-07-02T00:00:00Z',
            overlay: 'release traversal fixture',
            files: [
              {
                path: unsafePath,
                sha256: '0'.repeat(64),
                size: 1,
              },
            ],
          },
          null,
          2,
        ) + '\n',
        'utf-8',
      );
      await assert.rejects(
        () => createBwsReleasePackage({
          outputDirectory,
          repositoryRoot: dir,
        }),
        /strict relative path|unsafe component/u,
      );
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  }
});

test('release packaging rejects repo-local source manifest symlink entries before payload staging', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bws-release-manifest-symlink-'));
  const outputDirectory = join(dir, 'artifacts', 'out');
  try {
    mkdirSync(join(dir, 'config'), { recursive: true });
    mkdirSync(join(dir, 'tools'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({
      engines: { node: '>=20' },
      type: 'module',
      version: '0.0.0-test',
    }, null, 2), 'utf-8');
    writeFileSync(join(dir, 'package-lock.json'), '{"lockfileVersion":3}\n', 'utf-8');
    writeFileSync(
      join(dir, 'config', 'betting-win.upstream.lock.json'),
      readFileSync(join(REPO_ROOT, 'config', 'betting-win.upstream.lock.json'), 'utf-8'),
      'utf-8',
    );
    writeFileSync(
      join(dir, 'tools', 'required_executable_paths.js'),
      'export const REQUIRED_EXECUTABLE_PATHS = Object.freeze([\'cli.js\']);\n',
      'utf-8',
    );
    writeFileSync(join(dir, 'cli.js'), '#!/usr/bin/env node\n', 'utf-8');
    chmodSync(join(dir, 'cli.js'), 0o755);
    writeFileSync(join(dir, 'outside.txt'), 'outside-content\n', 'utf-8');
    symlinkSync(join(dir, 'outside.txt'), join(dir, 'outside-link.txt'));
    writeFileSync(
      join(dir, 'SOURCE_MANIFEST.json'),
      JSON.stringify(
        {
          schema: 'betting-win-surebet-source-manifest-v1',
          generated: '2026-07-02T00:00:00Z',
          overlay: 'release symlink fixture',
          files: [
            {
              path: 'outside-link.txt',
              sha256: '0'.repeat(64),
              size: 1,
            },
          ],
        },
        null,
        2,
      ) + '\n',
      'utf-8',
    );

    await assert.rejects(
      () => createBwsReleasePackage({
        outputDirectory,
        repositoryRoot: dir,
      }),
      /non-symlink regular file|must not contain symlinks/u,
    );
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

test('release packaging rejects stale SOURCE_MANIFEST digest and size entries before payload staging', async () => {
  for (const mismatch of ['sha256', 'size'] as const) {
    const fixture = createMinimalReleaseRepositoryFixture(`release stale manifest ${mismatch} fixture`);
    try {
      const sourceContents = 'release source bytes\n';
      writeFileSync(join(fixture.repositoryRoot, 'README.md'), sourceContents, 'utf-8');
      const actualSha256 = createHash('sha256').update(sourceContents).digest('hex');
      const actualSize = Buffer.byteLength(sourceContents, 'utf-8');
      writeFileSync(
        join(fixture.repositoryRoot, 'SOURCE_MANIFEST.json'),
        JSON.stringify(
          {
            schema: 'betting-win-surebet-source-manifest-v1',
            generated: '2026-07-02T00:00:00Z',
            overlay: fixture.overlay,
            files: [
              {
                path: 'README.md',
                sha256: mismatch === 'sha256' ? '0'.repeat(64) : actualSha256,
                size: mismatch === 'size' ? actualSize + 1 : actualSize,
              },
            ],
          },
          null,
          2,
        ) + '\n',
        'utf-8',
      );

      await assert.rejects(
        () => createBwsReleasePackage({
          outputDirectory: join(fixture.repositoryRoot, 'artifacts', 'out'),
          repositoryRoot: fixture.repositoryRoot,
        }),
        new RegExp(`SOURCE_MANIFEST\\.json ${mismatch} mismatch for README\\.md`, 'u'),
      );
    } finally {
      rmSync(fixture.tempDirectory, { force: true, recursive: true });
    }
  }
});

test('install verification rejects tampered releases and partial private configuration without leaking secrets', async () => {
  const fixture = await getReleaseFixture();
  const extraction = extractReleaseArchive(fixture.result.archiveFile);
  const privateEnvFile = join(extraction.tempDirectory, 'private.env');
  writePrivateEnvironmentFile(privateEnvFile, extraction.manifest, TEST_PASSWORD);
  const tamperedPackageLock = join(extraction.rootDirectory, 'package-lock.json');
  const fakeBin = createFakePostgreSqlClient('16.3');
  const scratchDirectory = join(extraction.tempDirectory, 'scratch');
  const traversalExtraction = extractReleaseArchive(fixture.result.archiveFile);
  const traversalEnvFile = join(traversalExtraction.tempDirectory, 'private.env');
  writePrivateEnvironmentFile(traversalEnvFile, traversalExtraction.manifest, TEST_PASSWORD);
  const outsideReleaseFile = join(traversalExtraction.tempDirectory, 'outside.txt');
  const outsideReleaseContents = 'outside release payload\n';
  writeFileSync(outsideReleaseFile, outsideReleaseContents, 'utf-8');
  const traversalManifestPath = join(traversalExtraction.rootDirectory, 'release-manifest.json');
  const traversalManifest = JSON.parse(readFileSync(traversalManifestPath, 'utf-8')) as BwsReleaseManifest;
  const [firstSourceFile] = traversalManifest.source.files;
  assert.ok(firstSourceFile !== undefined);
  const unsafeTraversalManifest = {
    ...traversalManifest,
    source: {
      ...traversalManifest.source,
      files: [
        {
          ...firstSourceFile,
          path: '../outside.txt',
          sha256: createHash('sha256').update(outsideReleaseContents).digest('hex'),
          size: Buffer.byteLength(outsideReleaseContents, 'utf-8'),
        },
        ...traversalManifest.source.files.slice(1),
      ],
    },
  };
  const unsafeTraversalManifestWithFingerprint = {
    ...unsafeTraversalManifest,
    semanticFingerprint: semanticFingerprintForManifest(unsafeTraversalManifest),
  };
  const unsafeTraversalManifestJson = `${JSON.stringify(unsafeTraversalManifestWithFingerprint, null, 2)}\n`;
  writeFileSync(
    traversalManifestPath,
    unsafeTraversalManifestJson,
    'utf-8',
  );
  rewriteReleaseChecksum(traversalExtraction.rootDirectory, 'release-manifest.json', unsafeTraversalManifestJson);
  await assertRejectsWithoutSecret(
    () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
      envFile: traversalEnvFile,
      releaseDirectory: traversalExtraction.rootDirectory,
      scratchDirectory: join(traversalExtraction.tempDirectory, 'scratch'),
    })),
    /strict relative path|unsafe component|escapes repository/u,
  );

  writeFileSync(tamperedPackageLock, `${readFileSync(tamperedPackageLock, 'utf-8')}\n`, 'utf-8');
  await assertRejectsWithoutSecret(
    () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
      envFile: privateEnvFile,
      releaseDirectory: extraction.rootDirectory,
      scratchDirectory,
    })),
    /checksum mismatch|package-lock/i,
  );

  const cleanExtraction = extractReleaseArchive(fixture.result.archiveFile);
  const partialEnvFile = join(cleanExtraction.tempDirectory, 'partial.env');
  writePrivateEnvironmentFile(partialEnvFile, cleanExtraction.manifest, TEST_PASSWORD, ['POSTGRES_USER']);
  try {
    await assertRejectsWithoutSecret(
      () => withFakePsqlPath(fakeBin, () => verifyBwsReleaseInstallation({
        envFile: partialEnvFile,
        releaseDirectory: cleanExtraction.rootDirectory,
        scratchDirectory: join(cleanExtraction.tempDirectory, 'scratch'),
      })),
      /POSTGRES_USER/,
    );
  } finally {
    cleanupExtraction(extraction.tempDirectory);
    cleanupExtraction(traversalExtraction.tempDirectory);
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
    const outputDirectory = createReleaseOutputDirectory('bws-release-package-');
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

function createReleaseOutputDirectory(prefix: string): string {
  const artifactRoot = join(REPO_ROOT, 'artifacts');
  mkdirSync(artifactRoot, { recursive: true });
  return mkdtempSync(join(artifactRoot, prefix));
}

function createMinimalReleaseRepositoryFixture(overlay: string): {
  readonly overlay: string;
  readonly repositoryRoot: string;
  readonly tempDirectory: string;
} {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'bws-release-minimal-repo-'));
  const repositoryRoot = join(tempDirectory, 'repo');
  mkdirSync(join(repositoryRoot, 'config'), { recursive: true });
  mkdirSync(join(repositoryRoot, 'schemas'), { recursive: true });
  mkdirSync(join(repositoryRoot, 'tools'), { recursive: true });
  copyFileSync(
    join(REPO_ROOT, 'config', 'betting-win.upstream.lock.json'),
    join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'),
  );
  copyFileSync(
    join(REPO_ROOT, 'schemas', 'betting-win-upstream-lock.v1.schema.json'),
    join(repositoryRoot, 'schemas', 'betting-win-upstream-lock.v1.schema.json'),
  );
  writeFileSync(join(repositoryRoot, 'package.json'), JSON.stringify({
    engines: { node: '>=20' },
    type: 'module',
    version: '0.0.0-test',
  }, null, 2), 'utf-8');
  writeFileSync(join(repositoryRoot, 'package-lock.json'), '{"lockfileVersion":3}\n', 'utf-8');
  writeFileSync(
    join(repositoryRoot, 'tools', 'required_executable_paths.js'),
    'export const REQUIRED_EXECUTABLE_PATHS = Object.freeze([\'cli.js\']);\n',
    'utf-8',
  );
  writeFileSync(join(repositoryRoot, 'cli.js'), '#!/usr/bin/env node\n', 'utf-8');
  chmodSync(join(repositoryRoot, 'cli.js'), 0o755);
  return Object.freeze({
    overlay,
    repositoryRoot,
    tempDirectory,
  });
}

function createArchiveWithSymlinkMember(releaseDirectory: string, releaseId: string, archivePath: string): void {
  execFileSync(
    'python3',
    [
      '-c',
      [
        'import gzip',
        'import os',
        'import sys',
        'import tarfile',
        'release_directory = sys.argv[1]',
        'release_id = sys.argv[2]',
        'archive_path = sys.argv[3]',
        'entries = []',
        'for root, dirs, files in os.walk(release_directory):',
        '    dirs.sort()',
        '    files.sort()',
        '    for name in files:',
        '        absolute = os.path.join(root, name)',
        '        relative = os.path.join(release_id, os.path.relpath(absolute, release_directory))',
        '        entries.append((absolute, relative))',
        'with open(archive_path, "wb") as raw_handle:',
        '    with gzip.GzipFile(filename="", mode="wb", fileobj=raw_handle, mtime=0) as gzip_handle:',
        '        with tarfile.open(fileobj=gzip_handle, mode="w") as archive:',
        '            for index, (absolute, relative) in enumerate(entries):',
        '                if index == 0:',
        '                    info = tarfile.TarInfo(relative)',
        '                    info.type = tarfile.SYMTYPE',
        '                    info.linkname = "/tmp/outside-release-member"',
        '                    archive.addfile(info)',
        '                    continue',
        '                info = archive.gettarinfo(absolute, arcname=relative)',
        '                info.uid = 0',
        '                info.gid = 0',
        '                info.uname = ""',
        '                info.gname = ""',
        '                info.mtime = 0',
        '                with open(absolute, "rb") as handle:',
        '                    archive.addfile(info, handle)',
      ].join('\n'),
      releaseDirectory,
      releaseId,
      archivePath,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  const digest = createHash('sha256').update(readFileSync(archivePath)).digest('hex');
  writeFileSync(`${archivePath}.sha256`, `${digest}  ${basename(archivePath)}\n`, 'utf-8');
}

function createArchiveWithTamperedMemberContent(
  releaseDirectory: string,
  releaseId: string,
  tamperedRelativePath: string,
  archivePath: string,
): void {
  createTamperedArchive({
    archivePath,
    releaseDirectory,
    releaseId,
    tamperKind: 'content',
    tamperedRelativePath,
  });
}

function createArchiveWithTamperedMemberMode(
  releaseDirectory: string,
  releaseId: string,
  tamperedRelativePath: string,
  archivePath: string,
): void {
  createTamperedArchive({
    archivePath,
    releaseDirectory,
    releaseId,
    tamperKind: 'mode',
    tamperedRelativePath,
  });
}

function createTamperedArchive(request: Readonly<{
  readonly archivePath: string;
  readonly releaseDirectory: string;
  readonly releaseId: string;
  readonly tamperKind: 'content' | 'mode';
  readonly tamperedRelativePath: string;
}>): void {
  execFileSync(
    'python3',
    [
      '-c',
      [
        'import gzip',
        'import io',
        'import os',
        'import sys',
        'import tarfile',
        'release_directory = sys.argv[1]',
        'release_id = sys.argv[2]',
        'tampered_relative_path = sys.argv[3]',
        'tamper_kind = sys.argv[4]',
        'archive_path = sys.argv[5]',
        'found = False',
        'entries = []',
        'for root, dirs, files in os.walk(release_directory):',
        '    dirs.sort()',
        '    files.sort()',
        '    for name in files:',
        '        absolute = os.path.join(root, name)',
        '        release_relative = os.path.relpath(absolute, release_directory)',
        '        archive_relative = os.path.join(release_id, release_relative)',
        '        entries.append((absolute, release_relative, archive_relative))',
        'with open(archive_path, "wb") as raw_handle:',
        '    with gzip.GzipFile(filename="", mode="wb", fileobj=raw_handle, mtime=0) as gzip_handle:',
        '        with tarfile.open(fileobj=gzip_handle, mode="w") as archive:',
        '            for absolute, release_relative, archive_relative in entries:',
        '                info = archive.gettarinfo(absolute, arcname=archive_relative)',
        '                info.uid = 0',
        '                info.gid = 0',
        '                info.uname = ""',
        '                info.gname = ""',
        '                info.mtime = 0',
        '                if release_relative == tampered_relative_path:',
        '                    found = True',
        '                    if tamper_kind == "content":',
        '                        contents = b"tampered archive-only contents\\n"',
        '                        info.size = len(contents)',
        '                        archive.addfile(info, io.BytesIO(contents))',
        '                        continue',
        '                    if tamper_kind == "mode":',
        '                        info.mode = info.mode & ~0o111',
        '                with open(absolute, "rb") as handle:',
        '                    archive.addfile(info, handle)',
        'if not found:',
        '    raise SystemExit(f"tamper target not found: {tampered_relative_path}")',
      ].join('\n'),
      request.releaseDirectory,
      request.releaseId,
      request.tamperedRelativePath,
      request.tamperKind,
      request.archivePath,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  const digest = createHash('sha256').update(readFileSync(request.archivePath)).digest('hex');
  writeFileSync(`${request.archivePath}.sha256`, `${digest}  ${basename(request.archivePath)}\n`, 'utf-8');
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

function rewriteReleaseChecksum(releaseDirectory: string, relativePath: string, contents: string): void {
  const checksumsPath = join(releaseDirectory, 'SHA256SUMS');
  const digest = createHash('sha256').update(contents).digest('hex');
  const lines = readFileSync(checksumsPath, 'utf-8').split(/\r?\n/).map((line) => {
    if (line.endsWith(`  ${relativePath}`)) {
      return `${digest}  ${relativePath}`;
    }
    return line;
  });
  writeFileSync(checksumsPath, lines.join('\n'), 'utf-8');
}

function semanticFingerprintForManifest(manifest: BwsReleaseManifest): string {
  return createHash('sha256').update(JSON.stringify({
    archive: {
      ...manifest.archive,
      fileName: '',
      rootDirectory: '',
    },
    builtRuntime: manifest.builtRuntime,
    cockpit: manifest.cockpit,
    executables: manifest.executables,
    migrationInventory: manifest.migrationInventory,
    packageLock: manifest.packageLock,
    packageVersion: manifest.packageVersion,
    policy: manifest.policy,
    postgresqlRequirement: manifest.postgresqlRequirement,
    source: manifest.source,
    templates: manifest.templates,
    upstreamLock: manifest.upstreamLock,
  })).digest('hex');
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
    'BWS_UPSTREAM_MODE=api',
    'BWS_UPSTREAM_API_CHECKPOINT_ID=api-checkpoint-001',
    'BWS_UPSTREAM_API_BASE_URL=http://betting-win-query.test',
    'BWS_UPSTREAM_API_CONTRACT_VERSION=1.0.0',
    'BWS_UPSTREAM_API_PAGE_SIZE=25',
    'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE=4',
    'BWS_UPSTREAM_API_RETRY_LIMIT=1',
    'BWS_UPSTREAM_API_RETRY_BACKOFF_MS=10',
    'BWS_UPSTREAM_API_TIMEOUT_MS=1000',
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
