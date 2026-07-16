import {
  getBwsPrivatePaperWorkerServiceStatus,
  runBwsPrivatePaperWorkerService,
} from '../operations/private-paper-worker-service.js';

export async function runBwsPrivatePaperWorkerServiceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsPrivatePaperWorkerServiceHelp(stdout);
    return 0;
  }
  const command = argv[0];
  if (command !== 'run' && command !== 'status') {
    throw new Error('Usage: bws-private-paper-worker-service <run|status>');
  }
  const result = command === 'run'
    ? await runBwsPrivatePaperWorkerService({ repositoryRoot })
    : getBwsPrivatePaperWorkerServiceStatus({ repositoryRoot });
  stdout.write(`${JSON.stringify(result)}\n`);
  return result.outcome === 'stale_state' ? 1 : 0;
}

export function printBwsPrivatePaperWorkerServiceHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-private-paper-worker-service.js <run|status>',
      '',
      'Runs or inspects the long-running BWS private-paper worker service. The service repeats bounded worker passes, renews active leases while handlers run, drains cleanly on SIGINT or SIGTERM, and keeps execution and provider connections disabled.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_WORKER_ID, BWS_WORKER_QUEUE_NAME, BWS_WORKER_LEASE_DURATION_MS, BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS, BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS, BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS, BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS, BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsPrivatePaperWorkerServiceCli(process.argv.slice(2)).then(
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
