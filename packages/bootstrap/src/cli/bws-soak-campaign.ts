import { readFileSync } from 'node:fs';
import {
  createBwsSoakCampaign,
  executeBwsSoakCampaign,
  parseBwsSoakFailureSchedule,
  recordBwsSoakCampaignCheckpoint,
  validateBwsSoakCampaignExecution,
} from '../operations/soak-campaign.js';

export async function runBwsSoakCampaignCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printBwsSoakCampaignHelp(stdout);
    return 0;
  }

  const options = parseFlags(rest);

  if (command === 'prepare') {
    const failureSchedule = parseFailureScheduleFile(requireFlagValue(options, '--failure-schedule-file'));
    const result = await createBwsSoakCampaign({
      checkpointDirectory: requireFlagValue(options, '--checkpoint-dir'),
      databaseIdentity: requireFlagValue(options, '--database-identity'),
      durationMs: parseIntegerFlagValue(options, '--duration-ms'),
      evidenceDirectory: requireFlagValue(options, '--evidence-dir'),
      failureSchedule,
      manifestOutputFile: requireFlagValue(options, '--manifest-output'),
      maxCycles: parseIntegerFlagValue(options, '--max-cycles'),
      releaseSemanticFingerprint: requireFlagValue(options, '--release-fingerprint'),
      repositoryRoot,
      resume: options.has('--resume'),
      runtimeDirectory: requireFlagValue(options, '--runtime-dir'),
      seed: requireFlagValue(options, '--seed'),
      selectedUpstreamMode: requireModeFlagValue(options, '--upstream-mode'),
      stateFile: requireFlagValue(options, '--state-file'),
      ...(options.has('--upstream-lock-path')
        ? { upstreamLockPath: requireFlagValue(options, '--upstream-lock-path') }
        : {}),
      intervalMs: parseIntegerFlagValue(options, '--interval-ms'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'checkpoint') {
    const details = readOptionalJsonFile(options, '--details-file');
    const result = await recordBwsSoakCampaignCheckpoint({
      classification: requireFlagValue(options, '--classification') as never,
      ...(options.has('--cycle-number') ? { cycleNumber: parseIntegerFlagValue(options, '--cycle-number') } : {}),
      ...(details === undefined ? {} : { details }),
      manifestFile: requireFlagValue(options, '--manifest-file'),
      repositoryRoot,
      stateFile: requireFlagValue(options, '--state-file'),
      status: requireFlagValue(options, '--status') as never,
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'execute') {
    const result = await executeBwsSoakCampaign({
      executeUntilCycleNumber: parseIntegerFlagValue(options, '--execute-until-cycle-number'),
      manifestFile: requireFlagValue(options, '--manifest-file'),
      repositoryRoot,
      resultFile: requireFlagValue(options, '--result-file'),
      stateFile: requireFlagValue(options, '--state-file'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'validate') {
    const result = validateBwsSoakCampaignExecution({
      repositoryRoot,
      resultFile: requireFlagValue(options, '--result-file'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  throw new Error(`Unknown BWS soak campaign command: ${command}`);
}

export function printBwsSoakCampaignHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-soak-campaign.js <prepare|checkpoint|execute|validate> [options]',
      '',
      'Deterministic soak campaign manifest, execution, and validation tooling for the BWS-592 foundation tranche.',
      'prepare options: --manifest-output <path> --state-file <path> --checkpoint-dir <dir> --duration-ms <positive-integer> --interval-ms <positive-integer> --max-cycles <positive-integer> --seed <token> --upstream-mode <api|export> --release-fingerprint <sha256> --database-identity <token> --runtime-dir <dir> --evidence-dir <dir> --failure-schedule-file <path> [--upstream-lock-path <path>] [--resume]',
      'checkpoint options: --manifest-file <path> --state-file <path> --classification <name> --status <name> [--cycle-number <positive-integer>] [--details-file <path>]',
      'execute options: --manifest-file <path> --state-file <path> --result-file <path> --execute-until-cycle-number <positive-integer>',
      'validate options: --result-file <path>',
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

function parseFailureScheduleFile(path: string) {
  return parseBwsSoakFailureSchedule(readFileSync(path, 'utf-8'));
}

function readOptionalJsonFile(
  flags: ReadonlyMap<string, string | true>,
  flag: string,
): Readonly<Record<string, unknown>> | undefined {
  const path = readOptionalFlagValue(flags, flag);
  if (path === undefined) {
    return undefined;
  }
  const parsed = JSON.parse(readFileSync(path, 'utf-8'));
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${flag} must point to a JSON object file.`);
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function parseIntegerFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): number {
  const rawValue = requireFlagValue(flags, flag);
  const parsed = Number.parseInt(rawValue, 10);
  if (!/^[0-9]+$/.test(rawValue) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function requireModeFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): 'api' | 'export' {
  const value = requireFlagValue(flags, flag);
  if (value !== 'api' && value !== 'export') {
    throw new Error(`${flag} must be exactly api or export.`);
  }
  return value;
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

if (import.meta.url === new URL(process.argv[1] === undefined ? '' : process.argv[1], 'file:').href) {
  runBwsSoakCampaignCli(process.argv.slice(2)).then(
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
