import {
  runBwsWorkerApplication,
} from '../operations/runtime-applications.js';

export async function runBwsPrivatePaperWorkerCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsPrivatePaperWorkerHelp(stdout);
    return 0;
  }

  await runBwsWorkerApplication({
    repositoryRoot,
  });
  return 0;
}

export function printBwsPrivatePaperWorkerHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-private-paper-worker.js',
      '',
      'Runs one bounded surebet private-paper worker pass using explicit runtime configuration, surebet-only migrations, and closed execution policy.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_WORKER_ID, BWS_WORKER_QUEUE_NAME, BWS_WORKER_LEASE_DURATION_MS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsPrivatePaperWorkerCli(process.argv.slice(2)).then(
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
