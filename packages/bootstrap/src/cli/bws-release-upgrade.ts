import {
  applyBwsReleaseUpgrade,
  createBwsReleaseUpgradePlan,
  evaluateBwsReleaseRollbackDecision,
  recoverBwsReleaseUpgrade,
} from '../operations/release-upgrade.js';

export async function runBwsReleaseUpgradeCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printBwsReleaseUpgradeHelp(stdout);
    return 0;
  }

  const options = parseFlags(rest);

  if (command === 'plan') {
    const result = await createBwsReleaseUpgradePlan({
      backupPath: requireFlagValue(options, '--backup-dir'),
      currentReleaseDirectory: requireFlagValue(options, '--current-release-dir'),
      envFile: requireFlagValue(options, '--env-file'),
      evidenceDirectory: requireFlagValue(options, '--evidence-dir'),
      outputFile: requireFlagValue(options, '--output'),
      repositoryRoot,
      restoreVerificationFile: requireFlagValue(options, '--restore-verification-file'),
      runtimeStateDirectory: requireFlagValue(options, '--runtime-state-dir'),
      targetInstallVerificationFile: requireFlagValue(options, '--target-install-verification-file'),
      targetReleaseDirectory: requireFlagValue(options, '--target-release-dir'),
    });
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'apply') {
    const request = {
      explicitIntent: 'apply' as const,
      planFile: requireFlagValue(options, '--plan-file'),
      planFingerprint: requireFlagValue(options, '--plan-fingerprint'),
      ...(options.has('--rollback-on-failure') ? { rollbackOnFailure: true } : {}),
    };
    const result = await applyBwsReleaseUpgrade(request);
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'rollback-decision') {
    const outputFile = readOptionalFlagValue(options, '--output');
    const request = {
      planFile: requireFlagValue(options, '--plan-file'),
      planFingerprint: requireFlagValue(options, '--plan-fingerprint'),
      ...(outputFile === undefined ? {} : { outputFile }),
    };
    const result = await evaluateBwsReleaseRollbackDecision(request);
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  if (command === 'recover') {
    const request = {
      explicitIntent: 'recover' as const,
      planFile: requireFlagValue(options, '--plan-file'),
      planFingerprint: requireFlagValue(options, '--plan-fingerprint'),
      ...(options.has('--rollback-on-failure') ? { rollbackOnFailure: true } : {}),
    };
    const result = await recoverBwsReleaseUpgrade(request);
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  throw new Error(`Unknown BWS release upgrade command: ${command}`);
}

export function printBwsReleaseUpgradeHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-release-upgrade.js <plan|apply|rollback-decision|recover> [options]',
      '',
      'Exact-version upgrade, rollback-decision, and interrupted-recovery tooling for BWS-591.',
      'plan options: --current-release-dir <dir> --target-release-dir <dir> --env-file <path> --backup-dir <dir> --restore-verification-file <path> --target-install-verification-file <path> --runtime-state-dir <dir> --evidence-dir <dir> --output <path>',
      'apply options: --plan-file <path> --plan-fingerprint <sha256> [--rollback-on-failure]',
      'rollback-decision options: --plan-file <path> --plan-fingerprint <sha256> [--output <path>]',
      'recover options: --plan-file <path> --plan-fingerprint <sha256> [--rollback-on-failure]',
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

if (import.meta.url === new URL(process.argv[1] === undefined ? '' : process.argv[1], 'file:').href) {
  runBwsReleaseUpgradeCli(process.argv.slice(2)).then(
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
