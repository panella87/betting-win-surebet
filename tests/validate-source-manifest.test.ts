import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const REPO_ROOT = process.cwd();
const VALIDATOR = join(REPO_ROOT, 'scripts', 'validate_source_manifest.py');
const REGENERATOR = join(REPO_ROOT, 'scripts', 'regenerate_source_manifest.py');

type ManifestEntry = {
  path: string;
  sha256: string;
  size: number;
};

function sha256(contents: string): string {
  return createHash('sha256').update(contents).digest('hex');
}

function subprocessErrorText(error: Error): string {
  const output = error as Error & {
    readonly stderr?: Buffer | string;
    readonly stdout?: Buffer | string;
  };
  return [
    error.message,
    output.stderr?.toString(),
    output.stdout?.toString(),
  ].filter((part): part is string => part !== undefined && part.length > 0).join('\n');
}

function runPython(cwd: string, args: readonly string[]): string {
  const result = spawnSync('python3', args, { cwd, encoding: 'utf-8', stdio: 'pipe' });
  if (result.status !== 0) {
    const error = new Error([
      `python3 ${args.join(' ')} failed with status ${result.status}`,
      result.stderr,
      result.stdout,
    ].filter((part) => part.length > 0).join('\n'));
    throw error;
  }
  return result.stdout;
}

function makeFixture(overrideManifest?: Partial<{ generated: string; overlay: string; files: ManifestEntry[] }>): string {
  const dir = mkdtempSync(join(tmpdir(), 'surebet-source-manifest-'));
  const validatorCopy = join(dir, 'scripts', 'validate_source_manifest.py');
  const regeneratorCopy = join(dir, 'scripts', 'regenerate_source_manifest.py');
  mkdirSync(dirname(validatorCopy), { recursive: true });
  copyFileSync(VALIDATOR, validatorCopy);
  copyFileSync(REGENERATOR, regeneratorCopy);

  const readmePath = join(dir, 'README.md');
  const readmeContents = '# source manifest fixture\n';
  writeFileSync(readmePath, readmeContents, { encoding: 'utf-8' });

  const validatorContents = readFileSync(validatorCopy, 'utf-8');
  const regeneratorContents = readFileSync(regeneratorCopy, 'utf-8');

  const files: ManifestEntry[] = [
    {
      path: 'README.md',
      sha256: sha256(readmeContents),
      size: Buffer.byteLength(readmeContents, 'utf-8'),
    },
    {
      path: 'scripts/regenerate_source_manifest.py',
      sha256: sha256(regeneratorContents),
      size: Buffer.byteLength(regeneratorContents, 'utf-8'),
    },
    {
      path: 'scripts/validate_source_manifest.py',
      sha256: sha256(validatorContents),
      size: Buffer.byteLength(validatorContents, 'utf-8'),
    },
  ];

  writeFileSync(
    join(dir, 'SOURCE_MANIFEST.json'),
    JSON.stringify(
      {
        schema: 'betting-win-surebet-source-manifest-v1',
        generated: '2026-07-02T00:00:00Z',
        overlay: 'SURE-001 source manifest validator contract test fixture',
        files,
        ...overrideManifest,
      },
      null,
      2,
    ) + '\n',
    { encoding: 'utf-8' },
  );

  return dir;
}

test('source manifest validator accepts a matching tree with audit metadata', () => {
  const dir = makeFixture();
  try {
    const output = runPython(dir, ['scripts/validate_source_manifest.py']);
    assert.match(output, /validate_source_manifest: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest validator rejects missing overlay metadata before tree comparison', () => {
  const dir = makeFixture({ overlay: '' });
  try {
    assert.throws(
      () => runPython(dir, ['scripts/validate_source_manifest.py']),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(subprocessErrorText(error), /SOURCE_MANIFEST\.json overlay must be a non-empty string/);
        return true;
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest validator ignores runtime automation locks and handoff files', () => {
  const dir = makeFixture();
  try {
    mkdirSync(join(dir, '.automation', 'locks', 'corrupt'), { recursive: true });
    mkdirSync(join(dir, '.automation', 'corrupt'), { recursive: true });
    writeFileSync(join(dir, '.automation', 'locks', 'run-paper-evaluation.lock'), 'pid=1234\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'locks', 'corrupt', 'stale.lock'), 'stale\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'corrupt', 'run.lock'), 'corrupt\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'paper-mode-handover.env'), 'HANDOVER_KIND=paper-mode\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'paper-mode-to-autonomous-implementation.env'), 'HANDOVER_KIND=paper-mode-to-autonomous-implementation\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'autonomous-implementation-handover.env'), 'HANDOVER_KIND=autonomous-implementation\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'autonomous-implementation-handover.md'), '# handoff\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'bugfix-to-autonomous-implementation.env'), 'HANDOVER_KIND=bugfix-to-autonomous-implementation\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'bugfix-to-autonomous-implementation.md'), '# bugfix handoff\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'bugfix-mode-handover.env'), 'HANDOVER_KIND=bugfix-mode\n', { encoding: 'utf-8' });
    mkdirSync(join(dir, '.automation', 'consumed-handoffs'), { recursive: true });
    writeFileSync(join(dir, '.automation', 'consumed-handoffs', 'abc.env'), 'HANDOVER_FINGERPRINT=abc\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'OVERLAY_MANIFEST.json'), '{"generated":true}\n', { encoding: 'utf-8' });
    mkdirSync(join(dir, 'config'), { recursive: true });
    writeFileSync(join(dir, 'config', 'betting-win.upstream.lock.json'), '{"schema":"runtime-lock"}\n', { encoding: 'utf-8' });

    const output = runPython(dir, ['scripts/validate_source_manifest.py']);
    assert.match(output, /validate_source_manifest: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest validator rejects a runtime upstream lock manifest entry before the lock exists', () => {
  const seedDir = makeFixture();
  const seedManifest = JSON.parse(readFileSync(join(seedDir, 'SOURCE_MANIFEST.json'), 'utf-8')) as { files: ManifestEntry[] };
  const dir = makeFixture({
    files: [
      ...seedManifest.files,
      {
        path: 'config/betting-win.upstream.lock.json',
        sha256: '0'.repeat(64),
        size: 26,
      },
    ],
  });
  try {
    assert.throws(
      () => runPython(dir, ['scripts/validate_source_manifest.py']),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(
          subprocessErrorText(error),
          /Source manifest must not include config\/betting-win\.upstream\.lock\.json until the runtime lock file exists\./,
        );
        return true;
      },
    );
  } finally {
    rmSync(seedDir, { recursive: true, force: true });
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest regeneration helper reuses validator inclusion rules and excludes generated junk', () => {
  const dir = makeFixture();
  try {
    mkdirSync(join(dir, 'node_modules', 'left-pad'), { recursive: true });
    mkdirSync(join(dir, 'dist'), { recursive: true });
    mkdirSync(join(dir, 'apps', 'web', 'node_modules', 'vite'), { recursive: true });
    mkdirSync(join(dir, 'apps', 'web', 'dist'), { recursive: true });
    mkdirSync(join(dir, 'packages', 'bootstrap', 'src', 'runtime'), { recursive: true });
    mkdirSync(join(dir, 'artifacts', 'cycle_1'), { recursive: true });
    mkdirSync(join(dir, '.locks'), { recursive: true });
    mkdirSync(join(dir, '.automation', 'locks'), { recursive: true });
    mkdirSync(join(dir, '.automation', 'corrupt'), { recursive: true });
    mkdirSync(join(dir, 'runtime', 'evidence'), { recursive: true });
    mkdirSync(join(dir, 'tmp'), { recursive: true });
    mkdirSync(join(dir, '.tmp'), { recursive: true });
    mkdirSync(join(dir, 'graphify-out', 'cache'), { recursive: true });
    writeFileSync(join(dir, '.env'), 'SECRET=1\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'repo.zip'), 'zip bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'OVERLAY_MANIFEST.json'), '{"generated":true}\n', { encoding: 'utf-8' });
    mkdirSync(join(dir, 'config'), { recursive: true });
    writeFileSync(join(dir, 'config', 'betting-win.upstream.lock.json'), '{"schema":"runtime-lock"}\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'run.log'), 'log bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'scratch.tmp'), 'tmp bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'module.pyc'), 'pyc bytes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'node_modules', 'left-pad', 'index.js'), 'module.exports = "nope";\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'dist', 'bundle.js'), 'console.log("dist");\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'apps', 'web', 'node_modules', 'vite', 'index.js'), 'export const generatedDependency = true;\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'apps', 'web', 'dist', 'bundle.js'), 'console.log("nested dist");\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'packages', 'bootstrap', 'src', 'runtime', 'keep.ts'), 'export const runtimeSource = true;\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'artifacts', 'cycle_1', 'notes.md'), 'artifact\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.locks', 'repo.lock'), 'lock\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'locks', 'run-paper-evaluation.lock'), 'lock\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'corrupt', 'stale.lock'), 'corrupt\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'paper-mode-to-autonomous-implementation.env'), 'HANDOVER=1\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'autonomous-implementation-handover.md'), '# runtime handoff\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'runtime', 'evidence', 'index.jsonl'), '{"generated":true}\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'tmp', 'scratch.txt'), 'tmp dir\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.tmp', 'scratch.txt'), 'hidden tmp dir\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'graphify-out', 'graph.json'), '{"generated":true}\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'graphify-out', 'cache', 'ast.json'), '{"generated":true}\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, 'notes.txt'), 'keep me\n', { encoding: 'utf-8' });

    runPython(dir, ['scripts/regenerate_source_manifest.py']);

    const manifest = JSON.parse(readFileSync(join(dir, 'SOURCE_MANIFEST.json'), 'utf-8')) as {
      overlay: string;
      files: ManifestEntry[];
    };
    const paths = manifest.files.map((entry) => entry.path);

    assert.equal(manifest.overlay, 'SURE-001 source manifest validator contract test fixture');
    assert.deepEqual(paths, [
      'README.md',
      'notes.txt',
      'packages/bootstrap/src/runtime/keep.ts',
      'scripts/regenerate_source_manifest.py',
      'scripts/validate_source_manifest.py',
    ]);
    assert.ok(!paths.includes('OVERLAY_MANIFEST.json'));
    assert.ok(!paths.includes('config/betting-win.upstream.lock.json'));
    assert.ok(!paths.includes('apps/web/node_modules/vite/index.js'));
    assert.ok(!paths.includes('apps/web/dist/bundle.js'));
    assert.ok(!paths.includes('graphify-out/graph.json'));
    assert.ok(!paths.includes('graphify-out/cache/ast.json'));
    assert.ok(paths.includes('packages/bootstrap/src/runtime/keep.ts'));

    const output = runPython(dir, ['scripts/validate_source_manifest.py']);
    assert.match(output, /validate_source_manifest: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest regeneration rejects included symlinks and validator rejects unsafe manifest paths', () => {
  const dir = makeFixture();
  try {
    mkdirSync(join(dir, 'artifacts'), { recursive: true });
    writeFileSync(join(dir, 'artifacts', 'outside.txt'), 'outside-content\n', { encoding: 'utf-8' });
    symlinkSync(join(dir, 'artifacts', 'outside.txt'), join(dir, 'outside-link.txt'));
    assert.throws(
      () => runPython(dir, ['scripts/regenerate_source_manifest.py']),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(subprocessErrorText(error), /must not contain symlinks/);
        return true;
      },
    );

    rmSync(join(dir, 'outside-link.txt'), { force: true });
    const current = JSON.parse(readFileSync(join(dir, 'SOURCE_MANIFEST.json'), 'utf-8')) as { files: ManifestEntry[] };
    for (const unsafePath of [
      '../outside.txt',
      '/outside.txt',
      './README.md',
      'C:/outside.txt',
      'nested//bad.txt',
      'nested/.git/config',
      'nested/bad\u0001name.txt',
      '\\\\server\\share\\file.txt',
    ]) {
      writeFileSync(
        join(dir, 'SOURCE_MANIFEST.json'),
        JSON.stringify(
          {
            schema: 'betting-win-surebet-source-manifest-v1',
            generated: '2026-07-02T00:00:00Z',
            overlay: 'SURE-001 source manifest validator contract test fixture',
            files: [
              ...current.files,
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
        { encoding: 'utf-8' },
      );
      assert.throws(
        () => runPython(dir, ['scripts/validate_source_manifest.py']),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.match(subprocessErrorText(error), /unsafe/u);
          return true;
        },
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest validator and regenerator reject a symlinked manifest file', () => {
  const dir = makeFixture();
  try {
    const outsideManifest = join(dir, 'outside-manifest.json');
    const outsideContents = readFileSync(join(dir, 'SOURCE_MANIFEST.json'), 'utf-8');
    writeFileSync(outsideManifest, outsideContents, { encoding: 'utf-8' });
    rmSync(join(dir, 'SOURCE_MANIFEST.json'), { force: true });
    symlinkSync(outsideManifest, join(dir, 'SOURCE_MANIFEST.json'));

    assert.throws(
      () => runPython(dir, ['scripts/validate_source_manifest.py']),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(subprocessErrorText(error), /non-symlink regular file/u);
        return true;
      },
    );

    assert.throws(
      () => runPython(dir, ['scripts/regenerate_source_manifest.py', '--overlay', 'safe overlay']),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(subprocessErrorText(error), /non-symlink regular file/u);
        return true;
      },
    );
    assert.equal(readFileSync(outsideManifest, 'utf-8'), outsideContents);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest ignores runtime automation locks and handoff files but tracks source-owned automation helpers', () => {
  const dir = makeFixture();
  try {
    mkdirSync(join(dir, '.automation', 'lib'), { recursive: true });
    mkdirSync(join(dir, '.automation', 'locks', 'corrupt'), { recursive: true });
    mkdirSync(join(dir, '.automation', 'corrupt'), { recursive: true });
    writeFileSync(join(dir, '.automation', 'lib', 'run_common.sh'), '# source-owned helper\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'locks', 'run-paper-evaluation.lock'), '12345\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'locks', 'corrupt', 'old.lock'), 'stale\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'corrupt', 'controller.lock'), 'stale\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'paper-mode-to-autonomous-implementation.env'), 'RUN_AUTONOMOUS_IMPLEMENTATION_NEXT=yes\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'paper-mode-handover.env'), 'HANDOVER_KIND=paper-mode\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'autonomous-implementation-handover.env'), 'HANDOVER_KIND=bugfix\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'autonomous-implementation-handover.md'), '# runtime handoff\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'bugfix-to-autonomous-implementation.env'), 'HANDOVER_KIND=bugfix\n', { encoding: 'utf-8' });
    writeFileSync(join(dir, '.automation', 'bugfix-mode-handover.env'), 'HANDOVER_KIND=bugfix-mode\n', { encoding: 'utf-8' });
    mkdirSync(join(dir, '.automation', 'consumed-handoffs'), { recursive: true });
    writeFileSync(join(dir, '.automation', 'consumed-handoffs', 'abc.env'), 'HANDOVER_FINGERPRINT=abc\n', { encoding: 'utf-8' });

    runPython(dir, ['scripts/regenerate_source_manifest.py']);

    const manifest = JSON.parse(readFileSync(join(dir, 'SOURCE_MANIFEST.json'), 'utf-8')) as { files: ManifestEntry[] };
    const paths = manifest.files.map((entry) => entry.path);
    assert.ok(paths.includes('.automation/lib/run_common.sh'));
    assert.ok(!paths.includes('.automation/locks/run-paper-evaluation.lock'));
    assert.ok(!paths.includes('.automation/locks/corrupt/old.lock'));
    assert.ok(!paths.includes('.automation/corrupt/controller.lock'));
    assert.ok(!paths.includes('.automation/paper-mode-to-autonomous-implementation.env'));
    assert.ok(!paths.includes('.automation/paper-mode-handover.env'));
    assert.ok(!paths.includes('.automation/autonomous-implementation-handover.env'));
    assert.ok(!paths.includes('.automation/autonomous-implementation-handover.md'));
    assert.ok(!paths.includes('.automation/bugfix-to-autonomous-implementation.env'));
    assert.ok(!paths.includes('.automation/bugfix-mode-handover.env'));
    assert.ok(!paths.includes('.automation/consumed-handoffs/abc.env'));

    const output = runPython(dir, ['scripts/validate_source_manifest.py']);
    assert.match(output, /validate_source_manifest: ok/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('source manifest validator still rejects real source drift', () => {
  const dir = makeFixture();
  try {
    writeFileSync(join(dir, 'README.md'), '# changed source manifest fixture\n', { encoding: 'utf-8' });
    assert.throws(
      () => runPython(dir, ['scripts/validate_source_manifest.py']),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(subprocessErrorText(error), /SOURCE_MANIFEST\.json is stale/);
        return true;
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
