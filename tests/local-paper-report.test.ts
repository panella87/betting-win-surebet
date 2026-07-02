import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { runLocalPaperReportCli, writeLocalPaperReport } from '../src/cli/local-paper-report.js';

const REPO_ROOT = process.cwd();

test('local paper report writes an opportunity report for a solver-ready local fixture bundle', () => {
  const outputPath = createArtifactOutputPath('solver-ready-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
      outputPath: relative(REPO_ROOT, outputPath),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.outputPath, outputPath);

    const report = JSON.parse(readFileSync(outputPath, 'utf-8')) as {
      blockerCount: number;
      candidateReports: Array<{
        candidateId: string;
        reportKind: string;
        stakeVector?: {
          stakes: Array<{ legId: string; stakeMinor: string; stakeQuantumMinor: string; unitCount: string }>;
          scenarioNets: Array<{ scenarioId: string; netMinor: string }>;
          worstCaseNetMinor: string;
        };
      }>;
      settlement?: { scenarioId: string; finalOutcome: string };
    };
    assert.equal(report.blockerCount, 0);
    assert.equal(report.candidateReports.length, 1);
    assert.equal(report.candidateReports[0]?.candidateId, 'market-002');
    assert.equal(report.candidateReports[0]?.reportKind, 'private_paper_opportunity');
    assert.deepEqual(report.candidateReports[0]?.stakeVector?.stakes, [
      { legId: 'market-002:no', stakeMinor: '100', stakeQuantumMinor: '100', unitCount: '1' },
      { legId: 'market-002:yes', stakeMinor: '100', stakeQuantumMinor: '100', unitCount: '1' },
    ]);
    assert.deepEqual(report.candidateReports[0]?.stakeVector?.scenarioNets, [
      { scenarioId: 'no_wins', netMinor: '15' },
      { scenarioId: 'yes_wins', netMinor: '5' },
    ]);
    assert.equal(report.candidateReports[0]?.stakeVector?.worstCaseNetMinor, '5');
    assert.equal(report.settlement?.scenarioId, 'yes_wins');
    assert.equal(report.settlement?.finalOutcome, 'yes');
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report writes a blocked report for an incomplete local fixture bundle', () => {
  const outputPath = createArtifactOutputPath('blocked-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: 'tests/fixtures/local-only-export-bundles/valid-resource-records-export.json',
      outputPath: relative(REPO_ROOT, outputPath),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, true);

    const report = JSON.parse(readFileSync(outputPath, 'utf-8')) as {
      blockerCount: number;
      candidateReports: Array<{ reportKind: string; blockers: Array<{ code: string }> }>;
    };
    assert.equal(report.blockerCount, 1);
    assert.equal(report.candidateReports[0]?.reportKind, 'private_paper_blocked');
    assert.equal(report.candidateReports[0]?.blockers[0]?.code, 'COMPLETE_SET_INCOMPLETE');
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report rejects outputs outside repo-local artifacts', () => {
  const result = writeLocalPaperReport({
    bundlePath: 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
    outputPath: 'reports/local-paper-report.json',
    repoRoot: REPO_ROOT,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'LOCAL_REPORT_OUTPUT_PATH_OUTSIDE_ARTIFACTS',
      message: 'Local paper reporting output must stay inside the repo-local artifacts directory.',
      evidenceRequired: 'Artifacts-local JSON report path.',
    },
  ]);
});

test('local paper report cli prints the artifact path on success', () => {
  const outputPath = createArtifactOutputPath('cli-report');
  let capturedStdout = '';
  let capturedStderr = '';

  try {
    const exitCode = runLocalPaperReportCli(
      [
        '--bundle',
        'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json',
        '--output',
        relative(REPO_ROOT, outputPath),
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
    assert.equal(capturedStdout.trim(), outputPath);
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

function createArtifactOutputPath(prefix: string): string {
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  const dir = mkdtempSync(join(REPO_ROOT, 'artifacts', `${prefix}-`));
  return join(dir, 'report.json');
}

function dirnameForCleanup(path: string): string {
  return dirname(path);
}

function createWriteStream(write: (chunk: string) => void): NodeJS.WriteStream {
  return {
    write: (chunk: string | Uint8Array) => {
      write(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
      return true;
    },
  } as NodeJS.WriteStream;
}
