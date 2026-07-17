import {
  createBwsFinalLocalAcceptanceCleanupResult,
  createBwsFinalLocalAcceptanceManifest,
  createBwsFinalLocalAcceptanceRecoveryResult,
  createBwsFinalLocalAcceptanceRuntimeResult,
  runBwsFinalLocalAcceptanceStageOne,
} from '../operations/final-local-acceptance.js';
import { resolveSurebetPersistenceConfig } from '../../../persistence/src/index.js';

export async function runBwsFinalLocalAcceptanceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printBwsFinalLocalAcceptanceHelp(stdout);
    return 0;
  }

  const options = parseFlags(rest);

  if (command === 'stage1') {
    const result = await runBwsFinalLocalAcceptanceStageOne({
      archivePath: requireFlagValue(options, '--archive-path'),
      envFile: requireFlagValue(options, '--env-file'),
      extractionDirectory: requireFlagValue(options, '--extraction-dir'),
      migrationStatusFile: requireFlagValue(options, '--migration-status-file'),
      outputFile: requireFlagValue(options, '--output-file'),
      persistenceConfig: resolveSurebetPersistenceConfig({
        SUREBET_PG_DATABASE: requireFlagValue(options, '--pg-database'),
        SUREBET_PG_HOST: requireFlagValue(options, '--pg-host'),
        SUREBET_PG_PASSWORD: requireFlagValue(options, '--pg-password'),
        SUREBET_PG_PORT: requireFlagValue(options, '--pg-port'),
        SUREBET_PG_USER: requireFlagValue(options, '--pg-user'),
      }),
      repositoryRoot,
      scratchDirectory: requireFlagValue(options, '--scratch-dir'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'runtime') {
    const runtimeEvidenceFiles = requireListFlagValue(options, '--runtime-evidence-files');
    const result = createBwsFinalLocalAcceptanceRuntimeResult({
      outputFile: requireFlagValue(options, '--output-file'),
      paperAutopilotSummaryFile: requireFlagValue(options, '--paper-autopilot-summary-file'),
      repositoryRoot,
      runtimeEvidenceFiles,
      telegramDryRunCaptureFile: requireFlagValue(options, '--telegram-dry-run-capture-file'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'recovery') {
    const result = createBwsFinalLocalAcceptanceRecoveryResult({
      backupManifestFile: requireFlagValue(options, '--backup-manifest-file'),
      failedReadinessUpgradeResultFile: requireFlagValue(options, '--failed-readiness-upgrade-result-file'),
      interruptedRecoveryResultFile: requireFlagValue(options, '--interrupted-recovery-result-file'),
      outputFile: requireFlagValue(options, '--output-file'),
      repositoryRoot,
      restoreVerificationFile: requireFlagValue(options, '--restore-verification-file'),
      retentionPlanFile: requireFlagValue(options, '--retention-plan-file'),
      rollbackAllowedDecisionFile: requireFlagValue(options, '--rollback-allowed-decision-file'),
      rollbackBlockedDecisionFile: requireFlagValue(options, '--rollback-blocked-decision-file'),
      successfulUpgradePlanFile: requireFlagValue(options, '--successful-upgrade-plan-file'),
      successfulUpgradeResultFile: requireFlagValue(options, '--successful-upgrade-result-file'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'cleanup') {
    const result = createBwsFinalLocalAcceptanceCleanupResult({
      leakedLeaseCount: parseIntegerFlagValue(options, '--leaked-lease-count', false),
      leakedProcessIds: parseIntegerListFlagValue(options, '--leaked-process-ids'),
      outputFile: requireFlagValue(options, '--output-file'),
      remainingTemporaryFiles: readOptionalListFlagValue(options, '--remaining-temporary-files'),
      repositoryRoot,
      temporaryDirectories: requireListFlagValue(options, '--temporary-directories'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'finalize') {
    const result = createBwsFinalLocalAcceptanceManifest({
      acceptanceArtifactArchiveSha256: requireFlagValue(options, '--acceptance-artifact-archive-sha256'),
      cleanupResultFile: requireFlagValue(options, '--cleanup-result-file'),
      externalRuntimeCampaignFile: requireFlagValue(options, '--external-runtime-campaign-file'),
      outputFile: requireFlagValue(options, '--output-file'),
      recoveryResultFile: requireFlagValue(options, '--recovery-result-file'),
      repositoryRoot,
      runtimeResultFile: requireFlagValue(options, '--runtime-result-file'),
      soakManifestFile: requireFlagValue(options, '--soak-manifest-file'),
      soakResultFile: requireFlagValue(options, '--soak-result-file'),
      soakValidationFile: requireFlagValue(options, '--soak-validation-file'),
      stageOneFile: requireFlagValue(options, '--stage1-file'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  throw new Error(`Unknown BWS final local acceptance command: ${command}`);
}

export function printBwsFinalLocalAcceptanceHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-final-local-acceptance.js <stage1|runtime|recovery|cleanup|finalize> [options]',
      '',
      'Staged clean-room final local acceptance tooling for BWS-599.',
      'stage1 options: --archive-path <path> --env-file <path> --extraction-dir <dir> --scratch-dir <dir> --migration-status-file <path> --output-file <path> --pg-database <name> --pg-host <host> --pg-port <port> --pg-user <user> --pg-password <password>',
      'runtime options: --runtime-evidence-files <comma-separated paths> --paper-autopilot-summary-file <path> --telegram-dry-run-capture-file <path> --output-file <path>',
      'recovery options: --backup-manifest-file <path> --restore-verification-file <path> --retention-plan-file <path> --successful-upgrade-plan-file <path> --successful-upgrade-result-file <path> --failed-readiness-upgrade-result-file <path> --rollback-allowed-decision-file <path> --rollback-blocked-decision-file <path> --interrupted-recovery-result-file <path> --output-file <path>',
      'cleanup options: --temporary-directories <comma-separated paths> --leaked-lease-count <non-negative integer> [--leaked-process-ids <comma-separated integers>] [--remaining-temporary-files <comma-separated paths>] --output-file <path>',
      'finalize options: --stage1-file <path> --runtime-result-file <path> --recovery-result-file <path> --cleanup-result-file <path> --soak-manifest-file <path> --soak-result-file <path> --soak-validation-file <path> --external-runtime-campaign-file <path> --acceptance-artifact-archive-sha256 <sha256> --output-file <path>',
    ].join('\n'),
  );
}

function parseFlags(argv: readonly string[]): ReadonlyMap<string, string | true> {
  const parsed = new Map<string, string | true>();
  let index = 0;
  while (index < argv.length) {
    const key = argv[index];
    if (key === undefined || !key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key === undefined ? '<missing>' : key}`);
    }
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      parsed.set(key, true);
      index += 1;
      continue;
    }
    parsed.set(key, next);
    index += 2;
  }
  return parsed;
}

function readOptionalFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): string | undefined {
  const value = flags.get(flag);
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required ${flag} value.`);
  }
  return value.trim();
}

function requireFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): string {
  const value = readOptionalFlagValue(flags, flag);
  if (value === undefined) {
    throw new Error(`Missing required ${flag} value.`);
  }
  return value;
}

function parseIntegerFlagValue(
  flags: ReadonlyMap<string, string | true>,
  flag: string,
  mustBePositive: boolean = true,
): number {
  const rawValue = requireFlagValue(flags, flag);
  const parsed = Number.parseInt(rawValue, 10);
  if (!/^[0-9]+$/.test(rawValue) || !Number.isInteger(parsed) || (mustBePositive ? parsed <= 0 : parsed < 0)) {
    throw new Error(`${flag} must be a ${mustBePositive ? 'positive' : 'non-negative'} integer.`);
  }
  return parsed;
}

function requireListFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): readonly string[] {
  const value = requireFlagValue(flags, flag);
  return parseCommaSeparatedList(value, flag);
}

function readOptionalListFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): readonly string[] {
  const value = readOptionalFlagValue(flags, flag);
  return value === undefined ? Object.freeze([]) : parseCommaSeparatedList(value, flag);
}

function parseIntegerListFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): readonly number[] {
  const value = readOptionalFlagValue(flags, flag);
  if (value === undefined) {
    return Object.freeze([]);
  }
  return Object.freeze(
    parseCommaSeparatedList(value, flag).map((entry) => {
      const parsed = Number.parseInt(entry, 10);
      if (!/^[0-9]+$/.test(entry) || !Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${flag} must contain only positive integers.`);
      }
      return parsed;
    }),
  );
}

function parseCommaSeparatedList(value: string, flag: string): readonly string[] {
  const items = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (items.length === 0) {
    throw new Error(`${flag} must be a non-empty comma-separated list.`);
  }
  return Object.freeze(items);
}

if (import.meta.url === new URL(process.argv[1] === undefined ? '' : process.argv[1], 'file:').href) {
  runBwsFinalLocalAcceptanceCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    },
  );
}
