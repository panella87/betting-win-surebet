import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createPrivatePaperBatchSummary,
  runLocalPaperBatchReportCli,
  validatePrivatePaperBatchSummary,
  writeLocalPaperBatchReport,
} from '../src/cli/local-paper-batch-report.js';

const REPO_ROOT = process.cwd();

test('local paper batch report writes one private report per bundle plus a deterministic batch summary', () => {
  const bundleDir = createBundleDirectory('batch-success', [
    {
      fileName: 'b-solver-ready.json',
      sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
    },
    {
      fileName: 'a-blocked.json',
      sourcePath: 'tests/fixtures/local-only-export-bundles/valid-resource-records-export.json',
    },
  ]);
  const summaryOutputPath = createArtifactOutputPath('batch-summary');

  try {
    const result = writeLocalPaperBatchReport({
      bundleDirectoryPath: relative(REPO_ROOT, bundleDir),
      outputPath: relative(REPO_ROOT, summaryOutputPath),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.outputPath, summaryOutputPath);
    assert.deepEqual(result.value.reportPaths.map((reportPath) => relative(REPO_ROOT, reportPath)), [
      relative(REPO_ROOT, join(dirname(summaryOutputPath), 'a-blocked.report.json')),
      relative(REPO_ROOT, join(dirname(summaryOutputPath), 'b-solver-ready.report.json')),
    ]);

    const summary = JSON.parse(readFileSync(summaryOutputPath, 'utf-8')) as {
      reportKind: string;
      laneId: string;
      batchId: string;
      accepted: boolean;
      status: string;
      bundleCount: number;
      reportCount: number;
      totalCandidateCount: number;
      totalBlockerCount: number;
      blockerFrequencies: Array<{ code: string; count: number }>;
      bundles: Array<{ bundlePath: string; reportPath: string; candidateCount: number; blockerCount: number }>;
    };

    assert.equal(summary.reportKind, 'private_paper_batch_summary');
    assert.equal(summary.laneId, 'polymarket_standard_binary_complete_set_v0');
    assert.match(summary.batchId, /^local-batch-[0-9a-f]{12}$/);
    assert.equal(summary.accepted, false);
    assert.equal(summary.status, 'fixture_results_only');
    assert.equal(summary.bundleCount, 2);
    assert.equal(summary.reportCount, 2);
    assert.equal(summary.totalCandidateCount, 2);
    assert.equal(summary.totalBlockerCount, 1);
    assert.deepEqual(summary.blockerFrequencies, [
      { code: 'COMPLETE_SET_INCOMPLETE', count: 1 },
    ]);
    assert.deepEqual(summary.bundles, [
      {
        bundlePath: relative(REPO_ROOT, join(bundleDir, 'a-blocked.json')),
        reportPath: relative(REPO_ROOT, join(dirname(summaryOutputPath), 'a-blocked.report.json')),
        candidateCount: 1,
        blockerCount: 1,
      },
      {
        bundlePath: relative(REPO_ROOT, join(bundleDir, 'b-solver-ready.json')),
        reportPath: relative(REPO_ROOT, join(dirname(summaryOutputPath), 'b-solver-ready.report.json')),
        candidateCount: 1,
        blockerCount: 0,
      },
    ]);
  } finally {
    rmSync(bundleDir, { recursive: true, force: true });
    rmSync(dirname(summaryOutputPath), { recursive: true, force: true });
  }
});

test('local paper batch report rejects repo-escaping bundle directories', () => {
  const result = writeLocalPaperBatchReport({
    bundleDirectoryPath: '/tmp/pinned-bundles',
    repoRoot: REPO_ROOT,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'LOCAL_REPORT_BATCH_DIRECTORY_OUTSIDE_REPO',
      message: 'Pinned bundle batch directory must stay inside the current repository.',
      evidenceRequired: 'Repo-local directory containing pinned betting-win export bundles.',
    },
  ]);
});

test('local paper batch report rejects remote batch paths', () => {
  const result = writeLocalPaperBatchReport({
    bundleDirectoryPath: 'https://example.com/pinned-bundles',
    repoRoot: REPO_ROOT,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'LOCAL_REPORT_BATCH_REMOTE_URL_FORBIDDEN',
      message: 'Pinned bundle batch path must be a repo-local filesystem path, not a URL.',
      evidenceRequired: 'Repo-local directory containing pinned betting-win export bundles.',
    },
  ]);
});

test('local paper batch report rejects summary outputs outside repo-local artifacts', () => {
  const bundleDir = createBundleDirectory('batch-output-outside-artifacts', [
    {
      fileName: 'solver-ready.json',
      sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
    },
  ]);

  try {
    const result = writeLocalPaperBatchReport({
      bundleDirectoryPath: relative(REPO_ROOT, bundleDir),
      outputPath: 'reports/private-paper-mode-summary.json',
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'LOCAL_REPORT_BATCH_OUTPUT_PATH_OUTSIDE_ARTIFACTS',
        message: 'Pinned bundle batch summary output must stay inside the repo-local artifacts directory.',
        evidenceRequired: 'Artifacts-local JSON batch summary path.',
      },
    ]);
  } finally {
    rmSync(bundleDir, { recursive: true, force: true });
  }
});

test('local paper batch report rejects artifact output symlink escapes', () => {
  const bundleDir = createBundleDirectory('batch-output-symlink', [
    {
      fileName: 'solver-ready.json',
      sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
    },
  ]);
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  const outsideDir = mkdtempSync(join(tmpdir(), 'surebet-batch-output-escape-'));
  const linkPath = join(REPO_ROOT, 'artifacts', `batch-symlink-output-${Date.now()}`);
  symlinkSync(outsideDir, linkPath, 'dir');

  try {
    const result = writeLocalPaperBatchReport({
      bundleDirectoryPath: relative(REPO_ROOT, bundleDir),
      outputPath: relative(REPO_ROOT, join(linkPath, 'batch-summary.json')),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'LOCAL_REPORT_BATCH_OUTPUT_SYMLINK_FORBIDDEN');
  } finally {
    rmSync(bundleDir, { recursive: true, force: true });
    rmSync(linkPath, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  }
});


test('local paper batch report rejects nested artifact output symlink escapes before creating outside directories', () => {
  const bundleDir = createBundleDirectory('batch-output-nested-symlink', [{ fileName: 'solver-ready.json', sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json' }]);
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  const outsideDir = mkdtempSync(join(tmpdir(), 'surebet-batch-output-nested-escape-'));
  const linkPath = join(REPO_ROOT, 'artifacts', `batch-nested-symlink-output-${Date.now()}`);
  symlinkSync(outsideDir, linkPath, 'dir');
  try {
    const result = writeLocalPaperBatchReport({ bundleDirectoryPath: relative(REPO_ROOT, bundleDir), outputPath: relative(REPO_ROOT, join(linkPath, 'nested', 'batch-summary.json')), repoRoot: REPO_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'LOCAL_REPORT_BATCH_OUTPUT_SYMLINK_FORBIDDEN');
    assert.equal(existsSync(join(outsideDir, 'nested')), false);
  } finally { rmSync(bundleDir, { recursive: true, force: true }); rmSync(linkPath, { recursive: true, force: true }); rmSync(outsideDir, { recursive: true, force: true }); }
});


test('local paper batch report rejects dangling summary output symlinks before writing outside artifacts', () => {
  const bundleDir = createBundleDirectory('batch-output-dangling-symlink', [{ fileName: 'solver-ready.json', sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json' }]);
  const summaryOutputPath = createArtifactOutputPath('dangling-batch-summary');
  const outsideFile = join(tmpdir(), `surebet-dangling-batch-${Date.now()}.json`);
  mkdirSync(dirname(summaryOutputPath), { recursive: true });
  symlinkSync(outsideFile, summaryOutputPath, 'file');
  try {
    const result = writeLocalPaperBatchReport({ bundleDirectoryPath: relative(REPO_ROOT, bundleDir), outputPath: relative(REPO_ROOT, summaryOutputPath), repoRoot: REPO_ROOT });
    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'LOCAL_REPORT_BATCH_OUTPUT_SYMLINK_FORBIDDEN');
    assert.equal(existsSync(outsideFile), false);
  } finally { rmSync(bundleDir, { recursive: true, force: true }); rmSync(summaryOutputPath, { force: true }); rmSync(outsideFile, { force: true }); rmSync(dirname(summaryOutputPath), { recursive: true, force: true }); }
});

test('local paper batch report fails closed before writing outputs when a pinned bundle intake is invalid', () => {
  const bundleDir = createBundleDirectory('batch-invalid-intake', [
    {
      fileName: 'invalid-missing-settlement.json',
      sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
      mutate: (source) => ({
        ...source,
        records: source.records.filter((record: { recordType?: string }) => record.recordType !== 'settlement'),
      }),
    },
  ]);
  const summaryOutputPath = createArtifactOutputPath('batch-invalid-intake-summary');

  try {
    const result = writeLocalPaperBatchReport({
      bundleDirectoryPath: relative(REPO_ROOT, bundleDir),
      outputPath: relative(REPO_ROOT, summaryOutputPath),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'BATCH_BUNDLE_invalid-missing-settlement.json_PINNED_BUNDLE_SETTLEMENT_RECORDS_MISSING');
    assert.equal(readArtifactPresence(summaryOutputPath), false);
    assert.equal(readArtifactPresence(join(dirname(summaryOutputPath), 'invalid-missing-settlement.report.json')), false);
  } finally {
    rmSync(bundleDir, { recursive: true, force: true });
    rmSync(dirname(summaryOutputPath), { recursive: true, force: true });
  }
});

test('local paper batch report cli prints the batch summary path on success', () => {
  const bundleDir = createBundleDirectory('batch-cli-success', [
    {
      fileName: 'solver-ready.json',
      sourcePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
    },
  ]);
  const summaryOutputPath = createArtifactOutputPath('batch-cli-summary');
  let capturedStdout = '';
  let capturedStderr = '';

  try {
    const exitCode = runLocalPaperBatchReportCli(
      [
        '--bundle-dir',
        relative(REPO_ROOT, bundleDir),
        '--output',
        relative(REPO_ROOT, summaryOutputPath),
      ],
      REPO_ROOT,
      createWriteStream((chunk) => {
        capturedStdout += chunk;
      }),
      createWriteStream((chunk) => {
        capturedStderr += chunk;
      }),
    );

    assert.equal(exitCode, 0);
    assert.equal(capturedStderr, '');
    assert.equal(capturedStdout.trim(), summaryOutputPath);
  } finally {
    rmSync(bundleDir, { recursive: true, force: true });
    rmSync(dirname(summaryOutputPath), { recursive: true, force: true });
  }
});

test('private paper batch summary validator rejects mismatched blocker frequencies', () => {
  const summary = createPrivatePaperBatchSummary('local-batch-test', [
    {
      bundlePath: 'artifacts/private-paper-mode/input-a.json',
      reportPath: 'artifacts/private-paper-mode/input-a.report.json',
      candidateCount: 1,
      blockerCount: 1,
      blockerCodes: ['COMPLETE_SET_INCOMPLETE'],
    },
  ]);

  const result = validatePrivatePaperBatchSummary({
    ...summary,
    blockerFrequencies: [{ code: 'NONE', count: 0 }],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'PRIVATE_BATCH_SUMMARY_FREQUENCIES_INVALID',
      message: 'Private paper-mode batch summaries must keep blockerFrequencies aligned with totalBlockerCount.',
      evidenceRequired: 'Serialized private paper-mode batch summary with deterministic blocker frequencies.',
    },
  ]);
});

function createBundleDirectory(
  prefix: string,
  bundles: Array<{
    fileName: string;
    sourcePath: string;
    mutate?: (source: { [key: string]: unknown; records: Array<{ [key: string]: unknown }> }) => { [key: string]: unknown };
  }>,
): string {
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  const dir = mkdtempSync(join(REPO_ROOT, 'artifacts', `${prefix}-`));
  for (const bundle of bundles) {
    const source = JSON.parse(readFileSync(bundle.sourcePath, 'utf-8')) as {
      [key: string]: unknown;
      records: Array<{ [key: string]: unknown }>;
    };
    const content = bundle.mutate === undefined ? source : bundle.mutate(source);
    writeFileSync(join(dir, bundle.fileName), `${JSON.stringify(content, null, 2)}\n`, { encoding: 'utf-8' });
  }
  return dir;
}

function createArtifactOutputPath(prefix: string): string {
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  const dir = mkdtempSync(join(REPO_ROOT, 'artifacts', `${prefix}-`));
  return join(dir, 'batch-summary.json');
}

function readArtifactPresence(path: string): boolean {
  try {
    readFileSync(path, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function createWriteStream(write: (chunk: string) => void): NodeJS.WriteStream {
  return {
    write: (chunk: string | Uint8Array) => {
      write(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
      return true;
    },
  } as NodeJS.WriteStream;
}
