import {
  createBwsDatabaseBackup,
  getBwsDatabaseMigrationStatus,
  listSupportedRetentionScopes,
  planBwsDatabaseRetention,
  applyBwsDatabaseRetention,
  verifyBwsDatabaseRestore,
} from '../operations/database-lifecycle.js';

export async function runBwsDatabaseLifecycleCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printBwsDatabaseLifecycleHelp(stdout);
    return 0;
  }

  if (command === 'migration-status') {
    stdout.write(`${JSON.stringify(getBwsDatabaseMigrationStatus({ repositoryRoot }), null, 2)}\n`);
    return 0;
  }
  if (command === 'backup') {
    const options = parseFlags(rest);
    const outputPath = requireFlagValue(options, '--output');
    const allowOverwrite = options.has('--allow-overwrite');
    stdout.write(
      `${JSON.stringify(createBwsDatabaseBackup({ allowOverwrite, outputPath, repositoryRoot }), null, 2)}\n`,
    );
    return 0;
  }
  if (command === 'restore-verify') {
    const options = parseFlags(rest);
    const backupPath = requireFlagValue(options, '--input');
    stdout.write(
      `${JSON.stringify(await verifyBwsDatabaseRestore({ backupPath, repositoryRoot }), null, 2)}\n`,
    );
    return 0;
  }
  if (command === 'retention-plan') {
    const options = parseFlags(rest);
    stdout.write(
      `${JSON.stringify(
        planBwsDatabaseRetention({
          cutoff: requireFlagValue(options, '--cutoff'),
          maxRows: requirePositiveIntegerFlag(options, '--max-rows'),
          repositoryRoot,
          scope: requireRetentionScope(options),
        }),
        null,
        2,
      )}\n`,
    );
    return 0;
  }
  if (command === 'retention-apply') {
    const options = parseFlags(rest);
    stdout.write(
      `${JSON.stringify(
        applyBwsDatabaseRetention({
          cutoff: requireFlagValue(options, '--cutoff'),
          maxRows: requirePositiveIntegerFlag(options, '--max-rows'),
          planFingerprint: requireFlagValue(options, '--plan-fingerprint'),
          repositoryRoot,
          scope: requireRetentionScope(options),
        }),
        null,
        2,
      )}\n`,
    );
    return 0;
  }

  throw new Error(`Unknown BWS database lifecycle command: ${command}`);
}

export function printBwsDatabaseLifecycleHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-database-lifecycle.js <migration-status|backup|restore-verify|retention-plan|retention-apply> [options]',
      '',
      'Machine-readable surebet-only database lifecycle tooling for BWS-585.',
      'Required environment: SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
      'backup options: --output <directory> [--allow-overwrite]',
      'restore-verify options: --input <backup-directory>',
      `retention scopes: ${listSupportedRetentionScopes().join(', ')}`,
      'retention-plan options: --scope <scope> --cutoff <iso8601-utc> --max-rows <positive-integer>',
      'retention-apply options: --scope <scope> --cutoff <iso8601-utc> --max-rows <positive-integer> --plan-fingerprint <sha256>',
    ].join('\n'),
  );
}

function parseFlags(argv: readonly string[]): ReadonlyMap<string, string | true> {
  const parsed = new Map<string, string | true>();
  let index = 0;
  while (index < argv.length) {
    const key = argv[index];
    if (key === undefined || !key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key ?? '<missing>'}`);
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

function requireFlagValue(flags: ReadonlyMap<string, string | true>, flag: string): string {
  const value = flags.get(flag);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required ${flag} value.`);
  }
  return value.trim();
}

function requirePositiveIntegerFlag(flags: ReadonlyMap<string, string | true>, flag: string): number {
  const rawValue = requireFlagValue(flags, flag);
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${flag} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function requireRetentionScope(flags: ReadonlyMap<string, string | true>): ReturnType<typeof listSupportedRetentionScopes>[number] {
  const scope = requireFlagValue(flags, '--scope');
  if (!listSupportedRetentionScopes().includes(scope as ReturnType<typeof listSupportedRetentionScopes>[number])) {
    throw new Error(`Unsupported retention scope: ${scope}`);
  }
  return scope as ReturnType<typeof listSupportedRetentionScopes>[number];
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsDatabaseLifecycleCli(process.argv.slice(2)).then(
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
