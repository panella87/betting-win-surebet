import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readLocalBettingWinExportBundle } from '../adapters/betting-win-local-bundle-reader.js';
import {
  type BettingWinResourceRecord,
  type BettingWinSettlementRecord,
  parseBettingWinResourceRecords,
} from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type Blocker, type BoundaryResult } from '../contracts/local-types.js';
import { toCapacityConstraint } from '../quotes/quote-capacity.js';
import { createBlockedOpportunityReport, createPrivateOpportunityReport } from '../reporting/opportunity-report.js';
import { createPrivateRunReport, type PrivateRunReport } from '../reporting/private-run-report.js';
import { assembleStandardBinaryCompleteSet, type StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
import { buildStandardBinaryScenarioCashflowMatrix, type ScenarioCashflowLegTerms } from '../scenarios/scenario-cashflow.js';
import { consumeStandardBinarySettlementReplay, type ConsumedSettlementReplay } from '../simulation/settlement-replay.js';
import { solveStandardBinaryStakeVector } from '../solver/stake-vector.js';

const URL_SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i;
const PRICE_SCALE_MINOR = 1_000_000n;

export interface WriteLocalPaperReportOptions {
  readonly bundlePath: string;
  readonly outputPath?: string;
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
  const bundle = readLocalBettingWinExportBundle(options.bundlePath, repoRoot);
  if (!bundle.ok) {
    return bundle;
  }

  const resolvedOutputPath = resolveArtifactOutputPath(options.outputPath, options.bundlePath, repoRoot);
  if (!resolvedOutputPath.ok) {
    return resolvedOutputPath;
  }

  const report = buildPrivateRunReport(bundle.value.records, bundle.value.reference.manifestHash);
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
          repoRoot,
        }
      : {
          bundlePath: parsedArgs.value.bundlePath,
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
      'Usage: node dist/src/cli/local-paper-report.js --bundle <repo-local-export.json> [--output <artifacts/report.json>]',
      '',
      'Reads a repo-local betting-win export bundle, runs the local paper-only fixture pipeline, and writes a private JSON report under artifacts/.',
    ].join('\n'),
  );
}

function buildPrivateRunReport(recordsValue: readonly unknown[], manifestHash: string): PrivateRunReport {
  const parsedRecords = parseBettingWinResourceRecords(recordsValue);
  if (!parsedRecords.ok) {
    return createPrivateRunReport(createRunId(manifestHash), [
      createBlockedOpportunityReport(createBundleCandidateId(manifestHash), parsedRecords.blockers),
    ]);
  }

  const recordsByMarket = groupRecordsByMarket(parsedRecords.value);
  if (recordsByMarket.length === 0) {
    return createPrivateRunReport(createRunId(manifestHash), [
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

  let settlement: ConsumedSettlementReplay | undefined;
  const candidateReports = recordsByMarket.map(([canonicalMarketId, marketRecords]) => {
    const completeSet = assembleStandardBinaryCompleteSet(marketRecords);
    if (!completeSet.ok) {
      return createBlockedOpportunityReport(canonicalMarketId, completeSet.blockers);
    }

    if (settlement === undefined) {
      const settlementRecord = marketRecords.find(isSettlementRecord);
      if (settlementRecord !== undefined) {
        const consumedSettlement = consumeStandardBinarySettlementReplay(completeSet.value, settlementRecord);
        if (consumedSettlement.ok) {
          settlement = consumedSettlement.value;
        }
      }
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

  return createPrivateRunReport(createRunId(manifestHash), candidateReports, settlement);
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
): BoundaryResult<{ readonly bundlePath: string; readonly outputPath?: string }> {
  let bundlePath: string | undefined;
  let outputPath: string | undefined;

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

  return accepted(Object.freeze(outputPath === undefined ? { bundlePath } : { bundlePath, outputPath }));
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

  return accepted(resolvedOutputPath);
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
