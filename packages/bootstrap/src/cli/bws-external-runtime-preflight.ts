import { enforceBwsApiOnlyProcessEnvironment } from './api-only-upstream.js';
import {
  createBwsExternalRuntimeCampaignManifest,
} from '../operations/external-runtime-preflight.js';

export async function runBwsExternalRuntimePreflightCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  enforceBwsApiOnlyProcessEnvironment();
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printBwsExternalRuntimePreflightHelp(stdout);
    return 0;
  }
  if (command !== 'prepare') {
    throw new Error(`Unknown BWS external runtime preflight command: ${command}`);
  }

  const options = parseFlags(rest);
  if (options.has('--mode')) {
    throw new Error('--mode has been removed; BWS external runtime preflight is API-only.');
  }
  const result = await createBwsExternalRuntimeCampaignManifest({
    backupManifestFile: requireFlagValue(options, '--backup-manifest-file'),
    campaignCycleTimeoutMinutes: parseIntegerFlagValue(options, '--campaign-cycle-timeout-minutes'),
    campaignDurationHours: parseIntegerFlagValue(options, '--campaign-duration-hours'),
    campaignMaxCycles: parseIntegerFlagValue(options, '--campaign-max-cycles'),
    envFile: requireFlagValue(options, '--env-file'),
    evidenceDirectory: requireFlagValue(options, '--evidence-dir'),
    installVerificationFile: requireFlagValue(options, '--install-verification-file'),
    migrationStatusFile: requireFlagValue(options, '--migration-status-file'),
    minimumAvailableBytes: parseIntegerFlagValue(options, '--minimum-available-bytes'),
    outputFile: requireFlagValue(options, '--output-file'),
    releaseDirectory: requireFlagValue(options, '--release-dir'),
    repositoryRoot,
    restoreVerificationFile: requireFlagValue(options, '--restore-verification-file'),
    runtimeDirectory: requireFlagValue(options, '--runtime-dir'),
    selectedInput: Object.freeze({
      apiBaseUrl: requireFlagValue(options, '--api-base-url'),
      ...(options.has('--api-contract-path')
        ? { apiContractPath: requireFlagValue(options, '--api-contract-path') }
        : {}),
      checkpointId: requireFlagValue(options, '--checkpoint-id'),
      contractVersion: requireFlagValue(options, '--contract-version'),
      expectedUpstreamLockFingerprint: requireFlagValue(options, '--expected-upstream-lock-fingerprint'),
      inspectContract: options.has('--inspect-contract'),
      maxPagesPerResource: parseIntegerFlagValue(options, '--max-pages-per-resource'),
      mode: 'api' as const,
      pageSize: parseIntegerFlagValue(options, '--page-size'),
      retryBackoffMs: parseIntegerFlagValue(options, '--retry-backoff-ms'),
      retryLimit: parseIntegerFlagValue(options, '--retry-limit'),
      timeoutMs: parseIntegerFlagValue(options, '--timeout-ms'),
    }),
    soakManifestFile: requireFlagValue(options, '--soak-manifest-file'),
    soakStateFile: requireFlagValue(options, '--soak-state-file'),
  });
  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

export function printBwsExternalRuntimePreflightHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-external-runtime-preflight.js prepare [options]',
      '',
      'Fail-closed external runtime preflight and campaign-manifest generation for BWS-593.',
      'common options: --release-dir <dir> --env-file <path> --install-verification-file <path> --migration-status-file <path> --backup-manifest-file <path> --restore-verification-file <path> --soak-manifest-file <path> --soak-state-file <path> --runtime-dir <dir> --evidence-dir <dir> --output-file <path> --campaign-duration-hours <positive-integer> --campaign-max-cycles <positive-integer> --campaign-cycle-timeout-minutes <positive-integer> --minimum-available-bytes <positive-integer> --expected-upstream-lock-fingerprint <sha256>',
      'API options: --checkpoint-id <token> --api-base-url <url> --contract-version <value> --page-size <positive-integer> --max-pages-per-resource <positive-integer> --timeout-ms <positive-integer> --retry-limit <positive-integer> --retry-backoff-ms <positive-integer> [--inspect-contract] [--api-contract-path </contract>]',
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

function parseIntegerFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): number {
  const rawValue = requireFlagValue(flags, flag);
  const parsed = Number.parseInt(rawValue, 10);
  if (!/^[0-9]+$/.test(rawValue) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function parseTokenListFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): readonly string[] {
  const value = requireFlagValue(flags, flag);
  const items = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (items.length === 0) {
    throw new Error(`${flag} must be a non-empty comma-separated list.`);
  }
  return Object.freeze(items);
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
  runBwsExternalRuntimePreflightCli(process.argv.slice(2)).then(
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
