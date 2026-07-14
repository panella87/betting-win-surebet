import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { FIRST_LANE_SPEC, accepted, blocked, type Blocker, type BoundaryResult, type FirstLaneId } from '../contracts/local-types.js';
import { validatePinnedBettingWinBundleIntake } from '../adapters/betting-win-pinned-bundle-intake.js';
import { writeLocalPaperReport } from './local-paper-report.js';

const URL_SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i;

export interface WriteLocalPaperBatchReportOptions {
  readonly bundleDirectoryPath: string;
  readonly outputPath?: string;
  readonly repoRoot?: string;
}

export interface PrivatePaperBatchBundleSummary {
  readonly bundlePath: string;
  readonly reportPath: string;
  readonly candidateCount: number;
  readonly blockerCount: number;
}

export interface PrivatePaperBatchBlockerFrequency {
  readonly code: string;
  readonly count: number;
}

export interface PrivatePaperBatchSummary {
  readonly reportKind: 'private_paper_batch_summary';
  readonly laneId: FirstLaneId;
  readonly batchId: string;
  readonly accepted: false;
  readonly status: 'fixture_results_only';
  readonly bundleCount: number;
  readonly reportCount: number;
  readonly totalCandidateCount: number;
  readonly totalBlockerCount: number;
  readonly blockerFrequencies: readonly PrivatePaperBatchBlockerFrequency[];
  readonly bundles: readonly PrivatePaperBatchBundleSummary[];
}

export interface LocalPaperBatchReportWriteResult {
  readonly outputPath: string;
  readonly summary: PrivatePaperBatchSummary;
  readonly reportPaths: readonly string[];
}

interface PrivatePaperBatchBundleResult extends PrivatePaperBatchBundleSummary {
  readonly blockerCodes: readonly string[];
}

export function writeLocalPaperBatchReport(
  options: WriteLocalPaperBatchReportOptions,
): BoundaryResult<LocalPaperBatchReportWriteResult> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const bundleDirectory = resolveLocalBundleDirectory(options.bundleDirectoryPath, repoRoot);
  if (!bundleDirectory.ok) {
    return bundleDirectory;
  }

  const bundlePaths = collectBundlePaths(bundleDirectory.value, repoRoot);
  if (!bundlePaths.ok) {
    return bundlePaths;
  }

  const summaryOutputPath = resolveBatchSummaryOutputPath(options.outputPath, bundleDirectory.value, repoRoot);
  if (!summaryOutputPath.ok) {
    return summaryOutputPath;
  }

  const reportOutputDirectory = dirname(summaryOutputPath.value);
  const writePlan = createReportWritePlan(bundlePaths.value, reportOutputDirectory, repoRoot);
  if (!writePlan.ok) {
    return writePlan;
  }

  for (const bundlePath of bundlePaths.value) {
    const intake = validatePinnedBettingWinBundleIntake(bundlePath, repoRoot);
    if (!intake.ok) {
      return prefixBlockers(`BATCH_BUNDLE_${basename(bundlePath)}`, intake.blockers);
    }
  }

  const bundleSummaries: PrivatePaperBatchBundleResult[] = [];
  const reportPaths: string[] = [];
  for (const bundlePlan of writePlan.value) {
    const reportResult = writeLocalPaperReport({
      bundlePath: bundlePlan.bundlePath,
      outputPath: bundlePlan.reportPath,
      requirePinnedBundleIntake: true,
      repoRoot,
    });
    if (!reportResult.ok) {
      return prefixBlockers(`BATCH_BUNDLE_${basename(bundlePlan.bundlePath)}`, reportResult.blockers);
    }

    reportPaths.push(reportResult.value.outputPath);
    bundleSummaries.push(
      Object.freeze({
        bundlePath: relative(repoRoot, resolve(repoRoot, bundlePlan.bundlePath)),
        reportPath: relative(repoRoot, reportResult.value.outputPath),
        candidateCount: reportResult.value.report.candidateReports.length,
        blockerCount: reportResult.value.report.blockerCount,
        blockerCodes: Object.freeze(
          reportResult.value.report.candidateReports.flatMap((candidateReport) =>
            candidateReport.blockers.map((blocker) => blocker.code),
          ),
        ),
      }),
    );
  }

  const summary = createPrivatePaperBatchSummary(createBatchId(bundleDirectory.value, repoRoot), bundleSummaries);
  const summaryValidation = validatePrivatePaperBatchSummary(summary);
  if (!summaryValidation.ok) {
    return summaryValidation;
  }

  mkdirSync(dirname(summaryOutputPath.value), { recursive: true });
  writeFileSync(summaryOutputPath.value, `${serializeJson(summary)}\n`, { encoding: 'utf-8' });

  return accepted(
    Object.freeze({
      outputPath: summaryOutputPath.value,
      summary,
      reportPaths: Object.freeze([...reportPaths]),
    }),
  );
}

export function runLocalPaperBatchReportCli(
  argv: readonly string[],
  repoRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
  stderr: NodeJS.WriteStream = process.stderr,
): number {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp(stdout);
    return 0;
  }

  const parsedArgs = parseCliArgs(argv);
  if (!parsedArgs.ok) {
    writeBlockers(stderr, parsedArgs.blockers);
    printHelp(stderr);
    return 1;
  }

  const result = writeLocalPaperBatchReport(
    parsedArgs.value.outputPath === undefined
      ? { bundleDirectoryPath: parsedArgs.value.bundleDirectoryPath, repoRoot }
      : {
          bundleDirectoryPath: parsedArgs.value.bundleDirectoryPath,
          outputPath: parsedArgs.value.outputPath,
          repoRoot,
        },
  );
  if (!result.ok) {
    writeBlockers(stderr, result.blockers);
    return 1;
  }

  stdout.write(`${result.value.outputPath}\n`);
  return 0;
}

export function printHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/src/cli/local-paper-batch-report.js --bundle-dir <repo-local-bundles-dir> [--output <artifacts/batch-summary.json>]',
      '',
      'Reads a repo-local directory of pinned betting-win export bundles, writes one private JSON report per bundle under artifacts/, and writes a deterministic private batch summary with blocker frequencies and candidate counts only.',
    ].join('\n'),
  );
}

export function createPrivatePaperBatchSummary(
  batchId: string,
  bundleSummaries: readonly (PrivatePaperBatchBundleSummary & { readonly blockerCodes?: readonly string[] })[],
): PrivatePaperBatchSummary {
  if (batchId.trim().length === 0) {
    throw new Error('Private paper batch summary requires a non-empty batch id.');
  }
  if (bundleSummaries.length === 0) {
    throw new Error('Private paper batch summary requires at least one bundle summary.');
  }

  const sortedBundleSummaries = [...bundleSummaries]
    .map((bundleSummary) => Object.freeze({ ...bundleSummary }))
    .sort((left, right) => left.bundlePath.localeCompare(right.bundlePath));

  const blockerFrequencies = countBlockerFrequencies(sortedBundleSummaries);
  return Object.freeze({
    reportKind: 'private_paper_batch_summary',
    laneId: FIRST_LANE_SPEC.laneId,
    batchId,
    accepted: false,
    status: 'fixture_results_only',
    bundleCount: sortedBundleSummaries.length,
    reportCount: sortedBundleSummaries.length,
    totalCandidateCount: sortedBundleSummaries.reduce(
      (currentCandidateCount, bundleSummary) => currentCandidateCount + bundleSummary.candidateCount,
      0,
    ),
    totalBlockerCount: sortedBundleSummaries.reduce(
      (currentBlockerCount, bundleSummary) => currentBlockerCount + bundleSummary.blockerCount,
      0,
    ),
    blockerFrequencies,
    bundles: Object.freeze(
      sortedBundleSummaries.map((bundleSummary) =>
        Object.freeze({
          bundlePath: bundleSummary.bundlePath,
          reportPath: bundleSummary.reportPath,
          candidateCount: bundleSummary.candidateCount,
          blockerCount: bundleSummary.blockerCount,
        }),
      ),
    ),
  });
}

export function validatePrivatePaperBatchSummary(summary: PrivatePaperBatchSummary): BoundaryResult<undefined> {
  if (summary.reportKind !== 'private_paper_batch_summary') {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_KIND_INVALID',
      'Private paper-mode batch summaries must use the private_paper_batch_summary report kind.',
      'Serialized private paper-mode batch summary with reportKind=private_paper_batch_summary.',
    );
  }
  if (summary.laneId !== FIRST_LANE_SPEC.laneId) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_LANE_ID_INVALID',
      'Private paper-mode batch summaries must include the first-lane identifier.',
      'Serialized private paper-mode batch summary with the repo first-lane id.',
    );
  }
  if (summary.batchId.trim().length === 0) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_BATCH_ID_MISSING',
      'Private paper-mode batch summaries must include a non-empty batch id.',
      'Serialized private paper-mode batch summary with a non-empty batch id.',
    );
  }
  if (summary.accepted !== false) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_ACCEPTED_FLAG_INVALID',
      'Private paper-mode batch summaries must remain accepted=false.',
      'Serialized private paper-mode batch summary with accepted=false.',
    );
  }
  if (summary.status !== 'fixture_results_only') {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_STATUS_INVALID',
      'Private paper-mode batch summaries must remain fixture_results_only.',
      'Serialized private paper-mode batch summary with status=fixture_results_only.',
    );
  }
  if (summary.bundles.length === 0) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_BUNDLES_MISSING',
      'Private paper-mode batch summaries must include at least one bundle summary.',
      'Serialized private paper-mode batch summary with bundle summaries.',
    );
  }
  if (summary.bundleCount !== summary.bundles.length || summary.reportCount !== summary.bundles.length) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_COUNTS_INVALID',
      'Private paper-mode batch summaries must keep bundleCount and reportCount aligned with bundle summaries.',
      'Serialized private paper-mode batch summary with aligned bundle/report counts.',
    );
  }
  const computedCandidateCount = summary.bundles.reduce(
    (currentCandidateCount, bundleSummary) => currentCandidateCount + bundleSummary.candidateCount,
    0,
  );
  if (summary.totalCandidateCount !== computedCandidateCount) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_CANDIDATE_COUNT_INVALID',
      'Private paper-mode batch summaries must keep totalCandidateCount aligned with the bundle summaries.',
      'Serialized private paper-mode batch summary with aligned candidate counts.',
    );
  }
  const computedBlockerCount = summary.bundles.reduce(
    (currentBlockerCount, bundleSummary) => currentBlockerCount + bundleSummary.blockerCount,
    0,
  );
  if (summary.totalBlockerCount !== computedBlockerCount) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_BLOCKER_COUNT_INVALID',
      'Private paper-mode batch summaries must keep totalBlockerCount aligned with the bundle summaries.',
      'Serialized private paper-mode batch summary with aligned blocker counts.',
    );
  }
  for (const bundleSummary of summary.bundles) {
    if (bundleSummary.bundlePath.trim().length === 0 || bundleSummary.reportPath.trim().length === 0) {
      return blocked(
        'PRIVATE_BATCH_SUMMARY_PATHS_INVALID',
        'Private paper-mode batch summaries must keep non-empty repo-local bundle and report paths.',
        'Serialized private paper-mode batch summary with non-empty bundle and report paths.',
      );
    }
  }

  const blockerFrequencyTotal = summary.blockerFrequencies.reduce(
    (currentBlockerCount, blockerFrequency) => currentBlockerCount + blockerFrequency.count,
    0,
  );
  if (blockerFrequencyTotal !== summary.totalBlockerCount) {
    return blocked(
      'PRIVATE_BATCH_SUMMARY_FREQUENCIES_INVALID',
      'Private paper-mode batch summaries must keep blockerFrequencies aligned with totalBlockerCount.',
      'Serialized private paper-mode batch summary with deterministic blocker frequencies.',
    );
  }
  for (let index = 0; index < summary.blockerFrequencies.length; index += 1) {
    const blockerFrequency = summary.blockerFrequencies[index];
    if (blockerFrequency === undefined || blockerFrequency.code.trim().length === 0 || blockerFrequency.count <= 0) {
      return blocked(
        'PRIVATE_BATCH_SUMMARY_FREQUENCIES_INVALID',
        'Private paper-mode batch summaries must keep non-empty blocker codes with positive counts.',
        'Serialized private paper-mode batch summary with deterministic blocker frequencies.',
      );
    }
    const previousBlockerFrequency = index === 0 ? undefined : summary.blockerFrequencies[index - 1];
    if (previousBlockerFrequency !== undefined && previousBlockerFrequency.code.localeCompare(blockerFrequency.code) >= 0) {
      return blocked(
        'PRIVATE_BATCH_SUMMARY_FREQUENCIES_INVALID',
        'Private paper-mode batch summaries must keep blockerFrequencies sorted by blocker code.',
        'Serialized private paper-mode batch summary with deterministic blocker frequencies.',
      );
    }
  }

  return accepted(undefined);
}

function resolveLocalBundleDirectory(bundleDirectoryPath: string, repoRoot: string): BoundaryResult<string> {
  if (bundleDirectoryPath.trim().length === 0) {
    return blocked(
      'LOCAL_REPORT_BATCH_DIRECTORY_MISSING',
      'A repo-local pinned bundle directory path is required.',
      'Repo-local directory containing pinned betting-win export bundles.',
    );
  }
  if (URL_SCHEME_PREFIX.test(bundleDirectoryPath)) {
    return blocked(
      'LOCAL_REPORT_BATCH_REMOTE_URL_FORBIDDEN',
      'Pinned bundle batch path must be a repo-local filesystem path, not a URL.',
      'Repo-local directory containing pinned betting-win export bundles.',
    );
  }

  const resolvedRepoRoot = resolve(repoRoot);
  const resolvedDirectoryPath = isAbsolute(bundleDirectoryPath)
    ? resolve(bundleDirectoryPath)
    : resolve(resolvedRepoRoot, bundleDirectoryPath);
  if (!isPathInsideRoot(resolvedRepoRoot, resolvedDirectoryPath)) {
    return blocked(
      'LOCAL_REPORT_BATCH_DIRECTORY_OUTSIDE_REPO',
      'Pinned bundle batch directory must stay inside the current repository.',
      'Repo-local directory containing pinned betting-win export bundles.',
    );
  }

  try {
    const realRepoRoot = realpathSync(resolvedRepoRoot);
    const linkStats = lstatSync(resolvedDirectoryPath);
    if (linkStats.isSymbolicLink()) {
      return blocked(
        'LOCAL_REPORT_BATCH_DIRECTORY_SYMLINK_FORBIDDEN',
        'Pinned bundle batch directory must be a real repo-local directory, not a symbolic link.',
        'Non-symlink repo-local directory containing pinned betting-win export bundles.',
      );
    }

    const stats = statSync(resolvedDirectoryPath);
    if (!stats.isDirectory()) {
      return blocked(
        'LOCAL_REPORT_BATCH_DIRECTORY_NOT_DIRECTORY',
        'Pinned bundle batch path must resolve to a directory.',
        'Repo-local directory containing pinned betting-win export bundles.',
      );
    }

    const realDirectoryPath = realpathSync(resolvedDirectoryPath);
    if (!isPathInsideRoot(realRepoRoot, realDirectoryPath)) {
      return blocked(
        'LOCAL_REPORT_BATCH_DIRECTORY_REALPATH_OUTSIDE_REPO',
        'Pinned bundle batch directory realpath must stay inside the current repository.',
        'Repo-local directory containing pinned betting-win export bundles whose realpath stays inside the repository.',
      );
    }
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return blocked(
        'LOCAL_REPORT_BATCH_DIRECTORY_NOT_FOUND',
        'Pinned bundle batch directory does not exist.',
        'Repo-local directory containing pinned betting-win export bundles.',
      );
    }
    throw error;
  }

  return accepted(resolvedDirectoryPath);
}

function collectBundlePaths(bundleDirectoryPath: string, repoRoot: string): BoundaryResult<readonly string[]> {
  const bundlePaths = readdirSync(bundleDirectoryPath, { withFileTypes: true })
    .filter((entry) => entry.name.endsWith('.json') && !entry.isDirectory())
    .map((entry) => resolve(bundleDirectoryPath, entry.name))
    .sort((left, right) => left.localeCompare(right));

  if (bundlePaths.length === 0) {
    return blocked(
      'LOCAL_REPORT_BATCH_DIRECTORY_EMPTY',
      'Pinned bundle batch directory must contain at least one .json bundle file.',
      'Repo-local pinned betting-win export bundle files.',
    );
  }

  for (const bundlePath of bundlePaths) {
    const relativePath = relative(repoRoot, bundlePath);
    if (relativePath.length === 0 || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return blocked(
        'LOCAL_REPORT_BATCH_BUNDLE_PATH_INVALID',
        'Pinned bundle batch runner found a bundle path outside the current repository.',
        'Repo-local pinned betting-win export bundle files.',
      );
    }
  }

  return accepted(Object.freeze(bundlePaths.map((bundlePath) => relative(repoRoot, bundlePath))));
}

function resolveBatchSummaryOutputPath(
  outputPath: string | undefined,
  bundleDirectoryPath: string,
  repoRoot: string,
): BoundaryResult<string> {
  const defaultOutputPath = resolve(
    repoRoot,
    'artifacts',
    'private-paper-mode',
    `${stripExtension(basename(bundleDirectoryPath))}-${createBatchId(bundleDirectoryPath, repoRoot)}`,
    'batch-summary.json',
  );
  const candidatePath = outputPath === undefined ? defaultOutputPath : outputPath;
  if (candidatePath.trim().length === 0) {
    return blocked(
      'LOCAL_REPORT_BATCH_OUTPUT_PATH_MISSING',
      'Pinned bundle batch reporting requires an artifacts-local batch summary path.',
      'Artifacts-local JSON batch summary path.',
    );
  }
  if (URL_SCHEME_PREFIX.test(candidatePath)) {
    return blocked(
      'LOCAL_REPORT_BATCH_OUTPUT_REMOTE_URL_FORBIDDEN',
      'Pinned bundle batch summary output must be a repo-local filesystem path, not a URL.',
      'Artifacts-local JSON batch summary path.',
    );
  }

  const resolvedRepoRoot = resolve(repoRoot);
  const resolvedArtifactsRoot = resolve(resolvedRepoRoot, 'artifacts');
  const resolvedOutputPath = isAbsolute(candidatePath) ? resolve(candidatePath) : resolve(resolvedRepoRoot, candidatePath);
  if (!isPathInsideRoot(resolvedArtifactsRoot, resolvedOutputPath)) {
    return blocked(
      'LOCAL_REPORT_BATCH_OUTPUT_PATH_OUTSIDE_ARTIFACTS',
      'Pinned bundle batch summary output must stay inside the repo-local artifacts directory.',
      'Artifacts-local JSON batch summary path.',
    );
  }
  if (!resolvedOutputPath.endsWith('.json')) {
    return blocked(
      'LOCAL_REPORT_BATCH_OUTPUT_EXTENSION_INVALID',
      'Pinned bundle batch summary output must be a .json artifact path.',
      'Artifacts-local JSON batch summary path.',
    );
  }

  const contained = ensureBatchOutputPathRealpathContained(resolvedRepoRoot, resolvedArtifactsRoot, resolvedOutputPath);
  if (!contained.ok) {
    return contained;
  }

  return accepted(resolvedOutputPath);
}

function createReportWritePlan(
  bundlePaths: readonly string[],
  reportOutputDirectory: string,
  repoRoot: string,
): BoundaryResult<readonly { readonly bundlePath: string; readonly reportPath: string }[]> {
  const reportPathSet = new Set<string>();
  const plan = bundlePaths.map((bundlePath) => {
    const reportPath = resolve(reportOutputDirectory, `${stripExtension(basename(bundlePath))}.report.json`);
    if (reportPathSet.has(reportPath)) {
      return null;
    }
    reportPathSet.add(reportPath);
    return Object.freeze({
      bundlePath,
      reportPath: relative(repoRoot, reportPath),
    });
  });

  if (plan.includes(null)) {
    return blocked(
      'LOCAL_REPORT_BATCH_OUTPUT_COLLISION',
      'Pinned bundle batch runner found colliding report output paths for bundle files.',
      'Repo-local pinned bundle file names that produce unique report artifact paths.',
    );
  }

  return accepted(Object.freeze(plan.filter((entry): entry is NonNullable<typeof entry> => entry !== null)));
}

function ensureBatchOutputPathRealpathContained(
  resolvedRepoRoot: string,
  resolvedArtifactsRoot: string,
  resolvedOutputPath: string,
): BoundaryResult<undefined> {
  const realRepoRoot = realpathSync(resolvedRepoRoot);
  const artifactsRootEntry = readOptionalPathEntry(resolvedArtifactsRoot);
  if (artifactsRootEntry.exists && artifactsRootEntry.isSymbolicLink) {
    return batchOutputSymlinkBlocker('artifacts root');
  }

  mkdirSync(resolvedArtifactsRoot, { recursive: true });
  const realArtifactsRoot = realpathSync(resolvedArtifactsRoot);
  if (!isPathInsideRoot(realRepoRoot, realArtifactsRoot)) {
    return batchOutputEscapeBlocker();
  }

  const outputParent = dirname(resolvedOutputPath);
  const outputParentComponents = ensureBatchOutputParentComponentsSafe(resolvedArtifactsRoot, outputParent);
  if (!outputParentComponents.ok) {
    return outputParentComponents;
  }

  mkdirSync(outputParent, { recursive: true });
  if (lstatSync(outputParent).isSymbolicLink()) {
    return batchOutputSymlinkBlocker('output parent');
  }

  const realOutputParent = realpathSync(outputParent);
  if (!isPathInsideRoot(realArtifactsRoot, realOutputParent)) {
    return batchOutputEscapeBlocker();
  }

  const outputEntry = readOptionalPathEntry(resolvedOutputPath);
  if (outputEntry.exists) {
    if (outputEntry.isSymbolicLink) {
      return batchOutputSymlinkBlocker('output file');
    }
    if (!outputEntry.isFile) {
      return blocked(
        'LOCAL_REPORT_BATCH_OUTPUT_PATH_NOT_FILE',
        'Pinned bundle batch summary output must be a normal JSON file path under artifacts/.',
        'Artifacts-local JSON batch summary file path.',
      );
    }
  }

  return accepted(undefined);
}

function ensureBatchOutputParentComponentsSafe(
  resolvedArtifactsRoot: string,
  outputParent: string,
): BoundaryResult<undefined> {
  const relativeParentPath = relative(resolvedArtifactsRoot, outputParent);
  if (relativeParentPath.length === 0) {
    return accepted(undefined);
  }
  if (relativeParentPath.startsWith('..') || isAbsolute(relativeParentPath)) {
    return batchOutputEscapeBlocker();
  }

  let currentPath = resolvedArtifactsRoot;
  for (const pathPart of relativeParentPath.split(/[\/]+/u).filter((entry) => entry.length > 0)) {
    currentPath = resolve(currentPath, pathPart);
    const entry = readOptionalPathEntry(currentPath);
    if (!entry.exists) {
      return accepted(undefined);
    }
    if (entry.isSymbolicLink) {
      return batchOutputSymlinkBlocker('output path component');
    }
    if (!entry.isDirectory) {
      return blocked(
        'LOCAL_REPORT_BATCH_OUTPUT_PARENT_COMPONENT_NOT_DIRECTORY',
        'Pinned bundle batch summary output parent components must be directories under artifacts/.',
        'Artifacts-local JSON batch summary path with directory-only parent components.',
      );
    }
  }

  return accepted(undefined);
}

function readOptionalPathEntry(pathValue: string):
  | { readonly exists: false }
  | { readonly exists: true; readonly isSymbolicLink: boolean; readonly isDirectory: boolean; readonly isFile: boolean } {
  try {
    const stat = lstatSync(pathValue);
    return Object.freeze({
      exists: true,
      isSymbolicLink: stat.isSymbolicLink(),
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return Object.freeze({ exists: false });
    }
    throw error;
  }
}

function batchOutputSymlinkBlocker(pathKind: string): BoundaryResult<undefined> {
  return blocked(
    'LOCAL_REPORT_BATCH_OUTPUT_SYMLINK_FORBIDDEN',
    `Pinned bundle batch reporting refuses ${pathKind} symlinks to keep outputs inside repo-local artifacts/.`,
    'Non-symlink artifacts-local JSON batch summary path.',
  );
}

function batchOutputEscapeBlocker(): BoundaryResult<undefined> {
  return blocked(
    'LOCAL_REPORT_BATCH_OUTPUT_REALPATH_OUTSIDE_ARTIFACTS',
    'Pinned bundle batch summary output realpath must stay inside the repo-local artifacts directory.',
    'Artifacts-local JSON batch summary path whose realpath remains under artifacts/.',
  );
}

function createBatchId(bundleDirectoryPath: string, repoRoot: string): string {
  const relativeDirectoryPath = relative(repoRoot, bundleDirectoryPath);
  const digest = createHash('sha256').update(relativeDirectoryPath).digest('hex').slice(0, 12);
  return `local-batch-${digest}`;
}

function countBlockerFrequencies(
  bundleSummaries: readonly (PrivatePaperBatchBundleSummary & { readonly blockerCodes?: readonly string[] })[],
): readonly PrivatePaperBatchBlockerFrequency[] {
  const counts = new Map<string, number>();
  for (const bundleSummary of bundleSummaries) {
    for (const blockerCode of bundleSummary.blockerCodes ?? []) {
      counts.set(blockerCode, (counts.get(blockerCode) ?? 0) + 1);
    }
  }

  return Object.freeze(
    [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, count]) => Object.freeze({ code, count })),
  );
}

function parseCliArgs(
  argv: readonly string[],
): BoundaryResult<{ readonly bundleDirectoryPath: string; readonly outputPath?: string }> {
  let bundleDirectoryPath: string | undefined;
  let outputPath: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--bundle-dir') {
      const nextArg = argv[index + 1];
      if (nextArg === undefined) {
        return blocked(
          'LOCAL_REPORT_BATCH_DIRECTORY_ARG_MISSING',
          'The --bundle-dir flag requires a repo-local pinned bundle directory path.',
          'Repo-local pinned bundle directory CLI path.',
        );
      }
      bundleDirectoryPath = nextArg;
      index += 1;
      continue;
    }
    if (arg === '--output') {
      const nextArg = argv[index + 1];
      if (nextArg === undefined) {
        return blocked(
          'LOCAL_REPORT_BATCH_OUTPUT_ARG_MISSING',
          'The --output flag requires an artifacts-relative JSON batch summary path.',
          'Artifacts-local JSON batch summary path.',
        );
      }
      outputPath = nextArg;
      index += 1;
      continue;
    }
    return blocked(
      'LOCAL_REPORT_BATCH_ARG_UNKNOWN',
      `Unsupported local paper batch report argument: ${arg}`,
      'Supported local paper batch report CLI flags.',
    );
  }

  if (bundleDirectoryPath === undefined) {
    return blocked(
      'LOCAL_REPORT_BATCH_DIRECTORY_ARG_MISSING',
      'The --bundle-dir flag is required.',
      'Repo-local pinned bundle directory CLI path.',
    );
  }

  return accepted(Object.freeze(outputPath === undefined ? { bundleDirectoryPath } : { bundleDirectoryPath, outputPath }));
}

function prefixBlockers(prefix: string, blockers: readonly Blocker[]): BoundaryResult<never> {
  return {
    ok: false,
    blockers: blockers.map((blocker) =>
      Object.freeze({
        code: `${prefix}_${blocker.code}`,
        message: blocker.message,
        evidenceRequired: blocker.evidenceRequired,
      }),
    ),
  };
}

function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return relativePath.length === 0 || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function stripExtension(fileName: string): string {
  const extension = extname(fileName);
  return extension.length === 0 ? fileName : fileName.slice(0, -extension.length);
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function writeBlockers(stream: NodeJS.WriteStream, blockers: readonly Blocker[]): void {
  for (const blocker of blockers) {
    stream.write(`${blocker.code}: ${blocker.message} Evidence required: ${blocker.evidenceRequired}\n`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const exitCode = runLocalPaperBatchReportCli(process.argv.slice(2));
  process.exit(exitCode);
}
