import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { runLocalPaperReportCli, writeLocalPaperReport } from '../src/cli/local-paper-report.js';

const REPO_ROOT = process.cwd();
const PRIVATE_PAPER_MODE_SMOKE_FIXTURE_DIR = 'tests/fixtures/private-paper-mode-smoke';
const ACCEPTED_LOCAL_BUNDLE = `${PRIVATE_PAPER_MODE_SMOKE_FIXTURE_DIR}/accepted-local-bundle.json`;
const BLOCKED_MISSING_SETTLEMENT_BUNDLE = `${PRIVATE_PAPER_MODE_SMOKE_FIXTURE_DIR}/blocked-missing-settlement-bundle.json`;
const BLOCKED_STALE_QUOTES_BUNDLE = `${PRIVATE_PAPER_MODE_SMOKE_FIXTURE_DIR}/blocked-stale-quotes-bundle.json`;
const BLOCKED_MIXED_CURRENCY_BUNDLE = `${PRIVATE_PAPER_MODE_SMOKE_FIXTURE_DIR}/blocked-mixed-currency-bundle.json`;
const MULTI_CANDIDATE_BUNDLE = `${PRIVATE_PAPER_MODE_SMOKE_FIXTURE_DIR}/multi-candidate-bundle.json`;

test('local paper report writes an opportunity report for the accepted-local smoke fixture bundle', () => {
  const outputPath = createArtifactOutputPath('solver-ready-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: ACCEPTED_LOCAL_BUNDLE,
      outputPath: relative(REPO_ROOT, outputPath),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.outputPath, outputPath);

    const report = JSON.parse(readFileSync(outputPath, 'utf-8')) as {
      laneId: string;
      runId: string;
      sourceManifestHash: string;
      accepted: boolean;
      status: string;
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
      settlementSummaries?: Array<{ candidateId: string; scenarioId: string; finalOutcome: string }>;
    };
    assert.equal(report.laneId, 'polymarket_standard_binary_complete_set_v0');
    assert.equal(report.runId, 'local-report-dddddddddddd');
    assert.equal(report.sourceManifestHash, 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd');
    assert.equal(report.accepted, false);
    assert.equal(report.status, 'fixture_results_only');
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
    assert.deepEqual(report.settlementSummaries, [
      { candidateId: 'market-002', canonicalMarketId: 'market-002', ruleProfileId: 'rules-002', resultSourceId: 'result-source-002', finalityPolicyId: 'finality-002', finalityAuthorityId: 'authority-002', replayManifestHash: '9999999999999999999999999999999999999999999999999999999999999999', replayAcceptedAt: '2026-07-01T00:05:00.000Z', scenarioId: 'yes_wins', finalOutcome: 'yes' },
    ]);
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
      sourceManifestHash: string;
      blockerCount: number;
      candidateReports: Array<{ reportKind: string; blockers: Array<{ code: string }> }>;
    };
    assert.equal(report.sourceManifestHash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.equal(report.blockerCount, 1);
    assert.equal(report.candidateReports[0]?.reportKind, 'private_paper_blocked');
    assert.equal(report.candidateReports[0]?.blockers[0]?.code, 'COMPLETE_SET_INCOMPLETE');
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report rejects outputs outside repo-local artifacts', () => {
  const result = writeLocalPaperReport({
    bundlePath: ACCEPTED_LOCAL_BUNDLE,
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


test('local paper report rejects artifact output symlink escapes', () => {
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  const outsideDir = mkdtempSync(join(tmpdir(), 'surebet-output-escape-'));
  const linkPath = join(REPO_ROOT, 'artifacts', `symlink-output-${Date.now()}`);
  symlinkSync(outsideDir, linkPath, 'dir');

  try {
    const result = writeLocalPaperReport({
      bundlePath: ACCEPTED_LOCAL_BUNDLE,
      outputPath: relative(REPO_ROOT, join(linkPath, 'report.json')),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, false);
    assert.equal(result.blockers[0]?.code, 'LOCAL_REPORT_OUTPUT_SYMLINK_FORBIDDEN');
  } finally {
    rmSync(linkPath, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  }
});

test('private paper-mode smoke fixtures stay marked as local fake bundles', () => {
  for (const [fixturePath, expectedScenario] of [
    [ACCEPTED_LOCAL_BUNDLE, 'accepted-local'],
    [BLOCKED_MISSING_SETTLEMENT_BUNDLE, 'blocked-missing-settlement'],
    [BLOCKED_STALE_QUOTES_BUNDLE, 'blocked-stale-quotes'],
    [BLOCKED_MIXED_CURRENCY_BUNDLE, 'blocked-mixed-currency'],
    [MULTI_CANDIDATE_BUNDLE, 'multi-candidate'],
  ] as const) {
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8')) as {
      fixtureKind: string;
      fixtureScenario: string;
      mode: string;
      providerConnection: string;
      notes: string;
    };

    assert.equal(fixture.fixtureKind, 'private_paper_mode_smoke');
    assert.equal(fixture.fixtureScenario, expectedScenario);
    assert.equal(fixture.mode, 'paper_only');
    assert.equal(fixture.providerConnection, 'prohibited');
    assert.equal(fixture.notes, 'Local fake fixture for private paper-mode smoke only. Not upstream evidence.');
  }
});

test('local paper report blocks complete-set candidates without settlement replay evidence', () => {
  const outputPath = createArtifactOutputPath('missing-settlement-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: BLOCKED_MISSING_SETTLEMENT_BUNDLE,
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
    assert.equal(report.candidateReports[0]?.blockers[0]?.code, 'LOCAL_REPORT_SETTLEMENT_REPLAY_MISSING');
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report blocks stale quote evidence before writing an opportunity', () => {
  const outputPath = createArtifactOutputPath('stale-quotes-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: BLOCKED_STALE_QUOTES_BUNDLE,
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
    assert.equal(report.candidateReports[0]?.blockers[0]?.code, 'QUOTE_EVIDENCE_STALE');
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report blocks mixed quote currencies before local paper math', () => {
  const outputPath = createArtifactOutputPath('mixed-currency-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: BLOCKED_MIXED_CURRENCY_BUNDLE,
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
    assert.equal(report.candidateReports[0]?.blockers[0]?.code, 'COMPLETE_SET_QUOTE_CURRENCY_MISMATCH');
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report fails closed on pinned-intake bundles without settlement record coverage', () => {
  const outputPath = createArtifactOutputPath('pinned-intake-missing-settlement-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: BLOCKED_MISSING_SETTLEMENT_BUNDLE,
      outputPath: relative(REPO_ROOT, outputPath),
      requirePinnedBundleIntake: true,
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'PINNED_BUNDLE_SETTLEMENT_RECORDS_MISSING',
        message: 'Pinned bundle intake requires at least one settlement record.',
        evidenceRequired: 'Pinned betting-win export bundle with settlement record coverage.',
      },
    ]);
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report writes per-candidate settlement summaries for multi-market bundles', () => {
  const outputPath = createArtifactOutputPath('two-market-report');

  try {
    const result = writeLocalPaperReport({
      bundlePath: MULTI_CANDIDATE_BUNDLE,
      outputPath: relative(REPO_ROOT, outputPath),
      repoRoot: REPO_ROOT,
    });

    assert.equal(result.ok, true);
    const report = JSON.parse(readFileSync(outputPath, 'utf-8')) as {
      blockerCount: number;
      settlement?: unknown;
      settlementSummaries?: Array<{ candidateId: string; canonicalMarketId: string; scenarioId: string; finalOutcome: string }>;
      candidateReports: Array<{ candidateId: string; reportKind: string }>;
    };
    assert.equal(report.blockerCount, 0);
    assert.equal(report.settlement, undefined);
    assert.deepEqual(report.candidateReports.map((candidate) => candidate.candidateId), ['market-002', 'market-003']);
    assert.deepEqual(report.settlementSummaries?.map((settlement) => ({
      candidateId: settlement.candidateId,
      canonicalMarketId: settlement.canonicalMarketId,
      scenarioId: settlement.scenarioId,
      finalOutcome: settlement.finalOutcome,
    })), [
      { candidateId: 'market-002', canonicalMarketId: 'market-002', scenarioId: 'yes_wins', finalOutcome: 'yes' },
      { candidateId: 'market-003', canonicalMarketId: 'market-003', scenarioId: 'no_wins', finalOutcome: 'no' },
    ]);
  } finally {
    rmSync(dirnameForCleanup(outputPath), { recursive: true, force: true });
  }
});

test('local paper report cli accepts --pinned-intake for pinned bundle smoke', () => {
  const outputPath = createArtifactOutputPath('cli-pinned-intake-report');
  let capturedStdout = '';
  let capturedStderr = '';

  try {
    const exitCode = runLocalPaperReportCli(
      [
        '--bundle',
        ACCEPTED_LOCAL_BUNDLE,
        '--output',
        relative(REPO_ROOT, outputPath),
        '--pinned-intake',
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

test('local paper report cli prints the artifact path on success', () => {
  const outputPath = createArtifactOutputPath('cli-report');
  let capturedStdout = '';
  let capturedStderr = '';

  try {
    const exitCode = runLocalPaperReportCli(
      [
        '--bundle',
        ACCEPTED_LOCAL_BUNDLE,
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

test('top-level local-report command keeps build logs out of success stdout', () => {
  const cliSource = readFileSync(join(REPO_ROOT, 'cli.js'), 'utf-8');
  assert.match(cliSource, /stdio: \['ignore', 'pipe', 'pipe'\]/);
  assert.match(cliSource, /process\.stderr\.write\(buildResult\.stdout\)/);
});
