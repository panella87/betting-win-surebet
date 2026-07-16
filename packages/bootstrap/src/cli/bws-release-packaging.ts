import {
  createBwsReleasePackage,
  runBwsReleasePreflight,
  verifyBwsReleaseInstallation,
} from '../operations/release-packaging.js';

export async function runBwsReleasePackagingCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
    printBwsReleasePackagingHelp(stdout);
    return 0;
  }

  if (command === 'create') {
    const options = parseFlags(rest);
    const result = await createBwsReleasePackage({
      allowOverwrite: options.has('--allow-overwrite'),
      outputDirectory: requireFlagValue(options, '--output'),
      repositoryRoot,
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'verify-install') {
    const options = parseFlags(rest);
    const archivePath = readOptionalFlagValue(options, '--archive');
    const request = {
      envFile: requireFlagValue(options, '--env-file'),
      releaseDirectory: requireFlagValue(options, '--release-dir'),
      scratchDirectory: requireFlagValue(options, '--scratch-dir'),
    };
    const result = archivePath === undefined
      ? await verifyBwsReleaseInstallation(request)
      : await verifyBwsReleaseInstallation({
        ...request,
        archivePath,
      });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'preflight') {
    const options = parseFlags(rest);
    const result = runBwsReleasePreflight({
      envFile: requireFlagValue(options, '--env-file'),
      releaseDirectory: requireFlagValue(options, '--release-dir'),
      requiredBytes: requirePositiveIntegerFlag(options, '--required-bytes'),
      scratchDirectory: requireFlagValue(options, '--scratch-dir'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  throw new Error(`Unknown BWS release packaging command: ${command}`);
}

export function printBwsReleasePackagingHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-release-packaging.js <create|verify-install|preflight> [options]',
      '',
      'Deterministic private BWS release packaging, static preflight, and non-mutating install verification for BWS-590.',
      'create options: --output <directory> [--allow-overwrite]',
      'verify-install options: --release-dir <directory> --env-file <path> --scratch-dir <directory> [--archive <path-to-tar-gz>]',
      'preflight options: --release-dir <directory> --env-file <path> --scratch-dir <directory> --required-bytes <positive-integer>',
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

function requirePositiveIntegerFlag(flags: ReadonlyMap<string, string | true>, flag: string): number {
  const value = requireFlagValue(flags, flag);
  if (!/^\d+$/.test(value)) {
    throw new Error(`${flag} must be a base-10 positive integer.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

if (import.meta.url === new URL(process.argv[1] === undefined ? '' : process.argv[1], 'file:').href) {
  runBwsReleasePackagingCli(process.argv.slice(2)).then(
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
