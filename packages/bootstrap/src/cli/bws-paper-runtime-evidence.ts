import {
  writeBwsPaperRuntimeEvidence,
} from '../operations/paper-runtime-evidence.js';

export async function runBwsPaperRuntimeEvidenceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsPaperRuntimeEvidenceHelp(stdout);
    return 0;
  }

  const outputPath = readRequiredOption(argv, '--output');
  const maxDurationMs = Number.parseInt(readRequiredOption(argv, '--max-duration-ms'), 10);
  const intervalMs = Number.parseInt(readRequiredOption(argv, '--interval-ms'), 10);
  const keepMonitoringWhenReady = argv.includes('--keep-monitoring-when-ready');
  const result = await writeBwsPaperRuntimeEvidence({
    intervalMs,
    keepMonitoringWhenReady,
    maxDurationMs,
    outputPath,
    repositoryRoot,
  });
  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

export function printBwsPaperRuntimeEvidenceHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-paper-runtime-evidence.js --output <repo-relative-path> --max-duration-ms <positive-int> --interval-ms <positive-int> [--keep-monitoring-when-ready]',
      '',
      'Builds strict local-only runtime evidence for BWS paper evaluation by attaching to or starting the validated repo-owned full stack, collecting bounded lifecycle and diagnostics observations, and stopping only the stack instance this command started.',
      'Required environment includes BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_UPSTREAM_MODE, BWS_API_PORT, BWS_WORKER_ID, BWS_WORKER_QUEUE_NAME, BWS_WORKER_LEASE_DURATION_MS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

function readRequiredOption(argv: readonly string[], name: string): string {
  const directIndex = argv.indexOf(name);
  if (directIndex >= 0) {
    const value = argv[directIndex + 1];
    if (value === undefined) {
      throw new Error(`${name} requires a value.`);
    }
    return value;
  }
  const prefix = `${name}=`;
  const combined = argv.find((entry) => entry.startsWith(prefix));
  if (combined === undefined) {
    throw new Error(`Missing required option: ${name}.`);
  }
  return combined.slice(prefix.length);
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsPaperRuntimeEvidenceCli(process.argv.slice(2)).then(
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
