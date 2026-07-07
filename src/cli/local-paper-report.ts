import { existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { BettingWinExportBundle } from '../adapters/betting-win-export-reader.js';
import { readLocalBettingWinExportBundle } from '../adapters/betting-win-local-bundle-reader.js';
import { validatePinnedBettingWinBundleIntake } from '../adapters/betting-win-pinned-bundle-intake.js';
import {
  type BettingWinResourceRecord,
  type BettingWinSettlementRecord,
  parseBettingWinResourceRecords,
} from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type Blocker, type BoundaryResult } from '../contracts/local-types.js';
import { toCapacityConstraint } from '../quotes/quote-capacity.js';
import { checkQuoteFreshness } from '../quotes/quote-freshness.js';
import { createBlockedOpportunityReport, createPrivateOpportunityReport } from '../reporting/opportunity-report.js';
import {
  createPrivateRunReport,
  type PrivateRunReport,
  validatePrivateRunReportArtifact,
} from '../reporting/private-run-report.js';
import { assembleStandardBinaryCompleteSet, type StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
import { buildStandardBinaryScenarioCashflowMatrix, type ScenarioCashflowLegTerms } from '../scenarios/scenario-cashflow.js';
import { consumeStandardBinarySettlementReplay, type ConsumedSettlementReplay } from '../simulation/settlement-replay.js';
import { solveStandardBinaryStakeVector } from '../solver/stake-vector.js';

const URL_SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i;
const PRICE_SCALE_MINOR = 1_000_000n;
const DEFAULT_MAX_QUOTE_AGE_MS = 60_000;

export interface WriteLocalPaperReportOptions {
  readonly bundlePath: string;
  readonly outputPath?: string;
  readonly requirePinnedBundleIntake?: boolean;
  readonly repoRoot?: string;
}

export interface LocalPaperReportWriteResult {
  readonly outputPath: string;
  readonly report: PrivateRunReport;
}

export function writeLocalPaperReport(
  options: WriteLocalPaperReportOptions,
): BoundaryResult<LocalPaperReportWriteResult> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  let bundleValue: BettingWinExportBundle;
  let parsedRecords: readonly BettingWinResourceRecord[] | undefined;
  if (options.requirePinnedBundleIntake) {
    const bundle = validatePinnedBettingWinBundleIntake(options.bundlePath, repoRoot);
    if (!bundle.ok) {
      return bundle;
    }
    bundleValue = bundle.value.bundle;
    parsedRecords = bundle.value.records;
  } else {
    const bundle = readLocalBettingWinExportBundle(options.bundlePath, repoRoot);
    if (!bundle.ok) {
      return bundle;
    }
    bundleValue = bundle.value;
  }

  const resolvedOutputPath = resolveArtifactOutputPath(options.outputPath, options.bundlePath, repoRoot);
  if (!resolvedOutputPath.ok) {
    return resolvedOutputPath;
  }

  const report = parsedRecords === undefined
    ? buildPrivateRunReport(bundleValue.records, bundleValue.reference.manifestHash, bundleValue.exportedAt)
    : buildPrivateRunReportFromParsedRecords(parsedRecords, bundleValue.reference.manifestHash, bundleValue.exportedAt);
  const reportArtifact = validatePrivateRunReportArtifact(report);
  if (!reportArtifact.ok) {
    return reportArtifact;
  }
  mkdirSync(dirname(resolvedOutputPath.value), { recursive: true });
  writeFileSync(resolvedOutputPath.value, `${serializeJson(report)}\n`, { encoding: 'utf-8' });

  return accepted(
    Object.freeze({
      outputPath: resolvedOutputPath.value,
      report,
    }),
  );
}

export function runLocalPaperReportCli(
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

  const result = writeLocalPaperReport(
    parsedArgs.value.outputPath === undefined
      ? {
          bundlePath: parsedArgs.value.bundlePath,
          requirePinnedBundleIntake: parsedArgs.value.requirePinnedBundleIntake,
          repoRoot,
        }
      : {
          bundlePath: parsedArgs.value.bundlePath,
          outputPath: parsedArgs.value.outputPath,
          requirePinnedBundleIntake: parsedArgs.value.requirePinnedBundleIntake,
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
      'Usage: node dist/src/cli/local-paper-report.js --bundle <repo-local-export.json> [--output <artifacts/report.json>] [--pinned-intake]',
      '',
      'Reads a repo-local betting-win export bundle, runs the local paper-only fixture pipeline, and writes a private JSON report under artifacts/.',
      'Use --pinned-intake for Federico-provided pinned bundles so repo-local intake validation fails closed on forbidden text and missing record coverage.',
      `Quote freshness is evaluated against the bundle exportedAt timestamp with a ${DEFAULT_MAX_QUOTE_AGE_MS}ms local freshness window.`,
    ].join('\n'),
  );
}

function buildPrivateRunReport(recordsValue: readonly unknown[], manifestHash: string, exportedAt: string): PrivateRunReport {
  const parsedRecords = parseBettingWinResourceRecords(recordsValue);
  if (!parsedRecords.ok) {
    return createPrivateRunReport(createRunId(manifestHash), manifestHash, [
      createBlockedOpportunityReport(createBundleCandidateId(manifestHash), parsedRecords.blockers),
    ]);
  }

  return buildPrivateRunReportFromParsedRecords(parsedRecords.value, manifestHash, exportedAt);
}

function buildPrivateRunReportFromParsedRecords(
  parsedRecords: readonly BettingWinResourceRecord[],
  manifestHash: string,
  exportedAt: string,
): PrivateRunReport {
  if (parsedRecords.length === 0) {
    return createPrivateRunReport(createRunId(manifestHash), manifestHash, [
      createBlockedOpportunityReport(
        createBundleCandidateId(manifestHash),
        toSingleBlocker(
          'LOCAL_REPORT_RECORDS_EMPTY',
          'Local paper reporting requires at least one canonical market record in the export bundle.',
          'Repo-local resource export records with canonical market identity.',
        ),
      ),
    ]);
  }

  const recordsByMarket = groupRecordsByMarket(parsedRecords);
  if (recordsByMarket.length === 0) {
    return createPrivateRunReport(createRunId(manifestHash), manifestHash, [
      createBlockedOpportunityReport(
        createBundleCandidateId(manifestHash),
        toSingleBlocker(
          'LOCAL_REPORT_RECORDS_EMPTY',
          'Local paper reporting requires at least one canonical market record in the export bundle.',
          'Repo-local resource export records with canonical market identity.',
        ),
      ),
    ]);
  }

  const exportedAtMs = Date.parse(exportedAt);
  if (!Number.isFinite(exportedAtMs)) {
    return createPrivateRunReport(createRunId(manifestHash), manifestHash, [
      createBlockedOpportunityReport(
        createBundleCandidateId(manifestHash),
        toSingleBlocker(
          'LOCAL_REPORT_EXPORTED_AT_INVALID',
          'Local paper reporting requires a valid bundle exportedAt timestamp for quote freshness evaluation.',
          'Valid pinned export bundle exportedAt timestamp.',
        ),
      ),
    ]);
  }

  const settlements: ConsumedSettlementReplay[] = [];
  const candidateReports = recordsByMarket.map(([canonicalMarketId, marketRecords]) => {
    const completeSet = assembleStandardBinaryCompleteSet(marketRecords);
    if (!completeSet.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, completeSet.blockers);
    }

    const consumedSettlement = consumeRequiredSettlementReplay(marketRecords, completeSet.value);
    if (!consumedSettlement.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, consumedSettlement.blockers);
    }
    settlements.push(consumedSettlement.value);

    const freshness = validateCompleteSetQuoteFreshness(completeSet.value, exportedAtMs);
    if (!freshness.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, freshness.blockers);
    }

    const legTerms = deriveScenarioCashflowLegTerms(completeSet.value);
    if (!legTerms.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, legTerms.blockers);
    }

    const matrix = buildStandardBinaryScenarioCashflowMatrix(completeSet.value, legTerms.value);
    if (!matrix.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, matrix.blockers);
    }

    const capacityConstraints = deriveCapacityConstraints(completeSet.value);
    if (!capacityConstraints.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, capacityConstraints.blockers);
    }

    const roundingConstraints = deriveRoundingConstraints(completeSet.value);
    if (!roundingConstraints.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, roundingConstraints.blockers);
    }

    const solvedStakeVector = solveStandardBinaryStakeVector({
      matrix: matrix.value,
      capacityConstraints: capacityConstraints.value,
      roundingConstraints: roundingConstraints.value,
    });
    if (!solvedStakeVector.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, solvedStakeVector.blockers);
    }

    return createPrivateOpportunityReport(canonicalMarketId, solvedStakeVector.value);
  });

  return createPrivateRunReport(createRunId(manifestHash), manifestHash, candidateReports, settlements);
}

function consumeRequiredSettlementReplay(
  records: readonly BettingWinResourceRecord[],
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<ConsumedSettlementReplay> {
  const settlementRecords = records.filter(isSettlementRecord);
  if (settlementRecords.length === 0) {
    return blocked(
      'LOCAL_REPORT_SETTLEMENT_REPLAY_MISSING',
      'Local paper reporting requires accepted settlement replay evidence before writing a private opportunity report.',
      'Exactly one accepted local settlement replay record for the complete-set candidate.',
    );
  }
  if (settlementRecords.length !== 1) {
    return blocked(
      'LOCAL_REPORT_SETTLEMENT_REPLAY_AMBIGUOUS',
      'Local paper reporting requires exactly one settlement replay record per complete-set candidate.',
      'Exactly one accepted local settlement replay record for the complete-set candidate.',
    );
  }

  return consumeStandardBinarySettlementReplay(completeSet, settlementRecords[0] as BettingWinSettlementRecord);
}

function validateCompleteSetQuoteFreshness(
  completeSet: StandardBinaryCompleteSet,
  exportedAtMs: number,
): BoundaryResult<undefined> {
  const quotes = Object.freeze([completeSet.quotesByOutcome.yes, completeSet.quotesByOutcome.no]);
  for (const quoteRecord of quotes) {
    const freshness = checkQuoteFreshness(quoteRecord.evidence, exportedAtMs, DEFAULT_MAX_QUOTE_AGE_MS);
    if (!freshness.ok) {
      return freshness;
    }
  }

  return accepted(undefined);
}

function groupRecordsByMarket(
  records: readonly BettingWinResourceRecord[],
): readonly (readonly [string, readonly BettingWinResourceRecord[]])[] {
  const recordsByMarket = new Map<string, BettingWinResourceRecord[]>();
  for (const record of records) {
    const currentRecords = recordsByMarket.get(record.canonicalMarketId) ?? [];
    currentRecords.push(record);
    recordsByMarket.set(record.canonicalMarketId, currentRecords);
  }

  return Object.freeze(
    [...recordsByMarket.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([canonicalMarketId, marketRecords]) => Object.freeze([canonicalMarketId, Object.freeze([...marketRecords])] as const)),
  );
}

function deriveScenarioCashflowLegTerms(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<readonly ScenarioCashflowLegTerms[]> {
  const terms: ScenarioCashflowLegTerms[] = [];
  for (const leg of completeSet.legs) {
    const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
    if (quoteRecord.minStakeMinor <= 0n) {
      return blocked(
        'LOCAL_REPORT_MIN_STAKE_INVALID',
        'Local paper reporting requires positive minStakeMinor values for every complete-set leg.',
        'Positive local quote minStakeMinor values.',
      );
    }

    terms.push(
      Object.freeze({
        legId: leg.legId,
        stakeMinor: quoteRecord.minStakeMinor,
        payoutMinor: quoteRecord.minStakeMinor + (quoteRecord.minStakeMinor * quoteRecord.evidence.priceMinor) / PRICE_SCALE_MINOR,
      }),
    );
  }

  return accepted(Object.freeze(terms));
}

function deriveCapacityConstraints(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<
  readonly {
    readonly legId: string;
    readonly minStakeMinor: bigint;
    readonly maxStakeMinor: bigint;
  }[]
> {
  const constraints: {
    readonly legId: string;
    readonly minStakeMinor: bigint;
    readonly maxStakeMinor: bigint;
  }[] = [];
  for (const leg of completeSet.legs) {
    const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
    if (quoteRecord.minStakeMinor <= 0n) {
      return blocked(
        'LOCAL_REPORT_MIN_STAKE_INVALID',
        'Local paper reporting requires positive minStakeMinor values for every complete-set leg.',
        'Positive local quote minStakeMinor values.',
      );
    }

    const capacityConstraint = toCapacityConstraint(leg.legId, quoteRecord.evidence);
    if (!capacityConstraint.ok) {
      return capacityConstraint;
    }

    constraints.push(
      Object.freeze({
        legId: leg.legId,
        minStakeMinor: quoteRecord.minStakeMinor,
        maxStakeMinor: capacityConstraint.value.maxStakeMinor,
      }),
    );
  }

  return accepted(Object.freeze(constraints));
}

function deriveRoundingConstraints(
  completeSet: StandardBinaryCompleteSet,
): BoundaryResult<
  readonly {
    readonly legId: string;
    readonly stepMinor: bigint;
  }[]
> {
  const constraints: {
    readonly legId: string;
    readonly stepMinor: bigint;
  }[] = [];
  for (const leg of completeSet.legs) {
    const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
    if (quoteRecord.minStakeMinor <= 0n) {
      return blocked(
        'LOCAL_REPORT_ROUNDING_STEP_INVALID',
        'Local paper reporting requires a positive rounding step for every complete-set leg.',
        'Positive local quote minStakeMinor values for each complete-set leg.',
      );
    }

    constraints.push(
      Object.freeze({
        legId: leg.legId,
        stepMinor: quoteRecord.minStakeMinor,
      }),
    );
  }

  return accepted(Object.freeze(constraints));
}

function parseCliArgs(
  argv: readonly string[],
): BoundaryResult<{ readonly bundlePath: string; readonly outputPath?: string; readonly requirePinnedBundleIntake: boolean }> {
  let bundlePath: string | undefined;
  let outputPath: string | undefined;
  let requirePinnedBundleIntake = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--bundle') {
      const nextArg = argv[index + 1];
      if (nextArg === undefined) {
        return blocked(
          'LOCAL_REPORT_BUNDLE_ARG_MISSING',
          'The --bundle flag requires a repo-local JSON export path.',
          'Repo-local export bundle CLI path.',
        );
      }
      bundlePath = nextArg;
      index += 1;
      continue;
    }
    if (arg === '--output') {
      const nextArg = argv[index + 1];
      if (nextArg === undefined) {
        return blocked(
          'LOCAL_REPORT_OUTPUT_ARG_MISSING',
          'The --output flag requires an artifacts-relative JSON report path.',
          'Artifacts-local JSON report path.',
        );
      }
      outputPath = nextArg;
      index += 1;
      continue;
    }
    if (arg === '--pinned-intake') {
      requirePinnedBundleIntake = true;
      continue;
    }
    return blocked(
      'LOCAL_REPORT_ARG_UNKNOWN',
      `Unsupported local paper report argument: ${arg}`,
      'Supported local paper report CLI flags.',
    );
  }

  if (bundlePath === undefined) {
    return blocked(
      'LOCAL_REPORT_BUNDLE_ARG_MISSING',
      'The --bundle flag is required.',
      'Repo-local export bundle CLI path.',
    );
  }

  return accepted(
    Object.freeze(
      outputPath === undefined
        ? { bundlePath, requirePinnedBundleIntake }
        : { bundlePath, outputPath, requirePinnedBundleIntake },
    ),
  );
}

function resolveArtifactOutputPath(
  outputPath: string | undefined,
  bundlePath: string,
  repoRoot: string,
): BoundaryResult<string> {
  const defaultOutputPath = resolve(
    repoRoot,
    'artifacts',
    'local-paper-reports',
    `${stripExtension(basename(bundlePath))}.report.json`,
  );
  const candidatePath = outputPath === undefined ? defaultOutputPath : outputPath;
  if (candidatePath.trim().length === 0) {
    return blocked(
      'LOCAL_REPORT_OUTPUT_PATH_MISSING',
      'Local paper reporting requires an artifacts-local output path.',
      'Artifacts-local JSON report path.',
    );
  }
  if (URL_SCHEME_PREFIX.test(candidatePath)) {
    return blocked(
      'LOCAL_REPORT_OUTPUT_REMOTE_URL_FORBIDDEN',
      'Local paper reporting output must be a repo-local filesystem path, not a URL.',
      'Artifacts-local JSON report path.',
    );
  }

  const resolvedRepoRoot = resolve(repoRoot);
  const resolvedArtifactsRoot = resolve(resolvedRepoRoot, 'artifacts');
  const resolvedOutputPath = isAbsolute(candidatePath) ? resolve(candidatePath) : resolve(resolvedRepoRoot, candidatePath);
  if (!isPathInsideRoot(resolvedArtifactsRoot, resolvedOutputPath)) {
    return blocked(
      'LOCAL_REPORT_OUTPUT_PATH_OUTSIDE_ARTIFACTS',
      'Local paper reporting output must stay inside the repo-local artifacts directory.',
      'Artifacts-local JSON report path.',
    );
  }
  if (!resolvedOutputPath.endsWith('.json')) {
    return blocked(
      'LOCAL_REPORT_OUTPUT_EXTENSION_INVALID',
      'Local paper reporting output must be a .json artifact path.',
      'Artifacts-local JSON report path.',
    );
  }

  const contained = ensureArtifactOutputPathRealpathContained(resolvedRepoRoot, resolvedArtifactsRoot, resolvedOutputPath);
  if (!contained.ok) {
    return contained;
  }

  return accepted(resolvedOutputPath);
}

function ensureArtifactOutputPathRealpathContained(
  resolvedRepoRoot: string,
  resolvedArtifactsRoot: string,
  resolvedOutputPath: string,
): BoundaryResult<undefined> {
  const realRepoRoot = realpathSync(resolvedRepoRoot);
  const artifactsRootEntry = readOptionalPathEntry(resolvedArtifactsRoot);
  if (artifactsRootEntry.exists && artifactsRootEntry.isSymbolicLink) {
    return outputSymlinkBlocker('artifacts root');
  }

  mkdirSync(resolvedArtifactsRoot, { recursive: true });
  const realArtifactsRoot = realpathSync(resolvedArtifactsRoot);
  if (!isPathInsideRoot(realRepoRoot, realArtifactsRoot)) {
    return outputEscapeBlocker();
  }

  const outputParent = dirname(resolvedOutputPath);
  const outputParentComponents = ensureArtifactOutputParentComponentsSafe(resolvedArtifactsRoot, outputParent);
  if (!outputParentComponents.ok) {
    return outputParentComponents;
  }

  mkdirSync(outputParent, { recursive: true });
  if (lstatSync(outputParent).isSymbolicLink()) {
    return outputSymlinkBlocker('output parent');
  }
  const realOutputParent = realpathSync(outputParent);
  if (!isPathInsideRoot(realArtifactsRoot, realOutputParent)) {
    return outputEscapeBlocker();
  }

  const outputEntry = readOptionalPathEntry(resolvedOutputPath);
  if (outputEntry.exists) {
    if (outputEntry.isSymbolicLink) {
      return outputSymlinkBlocker('output file');
    }
    if (!outputEntry.isFile) {
      return blocked(
        'LOCAL_REPORT_OUTPUT_PATH_NOT_FILE',
        'Local paper reporting output must be a normal JSON file path under artifacts/.',
        'Artifacts-local JSON report file path.',
      );
    }
  }

  return accepted(undefined);
}

function ensureArtifactOutputParentComponentsSafe(
  resolvedArtifactsRoot: string,
  outputParent: string,
): BoundaryResult<undefined> {
  const relativeParentPath = relative(resolvedArtifactsRoot, outputParent);
  if (relativeParentPath.length === 0) {
    return accepted(undefined);
  }
  if (relativeParentPath.startsWith('..') || isAbsolute(relativeParentPath)) {
    return outputEscapeBlocker();
  }

  let currentPath = resolvedArtifactsRoot;
  for (const pathPart of relativeParentPath.split(/[\/]+/u).filter((entry) => entry.length > 0)) {
    currentPath = resolve(currentPath, pathPart);
    const entry = readOptionalPathEntry(currentPath);
    if (!entry.exists) {
      return accepted(undefined);
    }
    if (entry.isSymbolicLink) {
      return outputSymlinkBlocker('output path component');
    }
    if (!entry.isDirectory) {
      return blocked(
        'LOCAL_REPORT_OUTPUT_PARENT_COMPONENT_NOT_DIRECTORY',
        'Local paper reporting output parent components must be directories under artifacts/.',
        'Artifacts-local JSON report path with directory-only parent components.',
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

function outputSymlinkBlocker(pathKind: string): BoundaryResult<undefined> {
  return blocked(
    'LOCAL_REPORT_OUTPUT_SYMLINK_FORBIDDEN',
    `Local paper reporting refuses ${pathKind} symlinks to keep outputs inside repo-local artifacts/.`,
    'Non-symlink artifacts-local JSON report path.',
  );
}

function outputEscapeBlocker(): BoundaryResult<undefined> {
  return blocked(
    'LOCAL_REPORT_OUTPUT_PATH_REALPATH_OUTSIDE_ARTIFACTS',
    'Local paper reporting output realpath must stay inside the repo-local artifacts directory.',
    'Artifacts-local JSON report path whose realpath remains under artifacts/.',
  );
}

function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return relativePath.length === 0 || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function stripExtension(fileName: string): string {
  const extension = extname(fileName);
  return extension.length === 0 ? fileName : fileName.slice(0, -extension.length);
}

function createRunId(manifestHash: string): string {
  return `local-report-${manifestHash.slice(0, 12)}`;
}

function createBundleCandidateId(manifestHash: string): string {
  return `bundle-${manifestHash.slice(0, 12)}`;
}

function toSingleBlocker(code: string, message: string, evidenceRequired: string): readonly Blocker[] {
  return Object.freeze([Object.freeze({ code, message, evidenceRequired })]);
}

function serializeJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, entry) => (typeof entry === 'bigint' ? entry.toString() : entry),
    2,
  );
}

function writeBlockers(stream: NodeJS.WriteStream, blockers: readonly Blocker[]): void {
  for (const blocker of blockers) {
    stream.write(`${blocker.code}: ${blocker.message} Evidence required: ${blocker.evidenceRequired}\n`);
  }
}

function isSettlementRecord(record: BettingWinResourceRecord): record is BettingWinSettlementRecord {
  return record.recordType === 'settlement';
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const exitCode = runLocalPaperReportCli(process.argv.slice(2));
  process.exit(exitCode);
}
