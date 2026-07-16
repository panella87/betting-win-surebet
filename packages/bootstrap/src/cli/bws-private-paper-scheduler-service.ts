import {
  getBwsPrivatePaperSchedulerServiceStatus,
  runBwsPrivatePaperSchedulerService,
} from '../operations/private-paper-scheduler-service.js';

export async function runBwsPrivatePaperSchedulerServiceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsPrivatePaperSchedulerServiceHelp(stdout);
    return 0;
  }
  const command = argv[0];
  if (command !== 'run' && command !== 'status') {
    throw new Error('Usage: bws-private-paper-scheduler-service <run|status>');
  }
  const result = command === 'run'
    ? await runBwsPrivatePaperSchedulerService({ repositoryRoot })
    : getBwsPrivatePaperSchedulerServiceStatus({ repositoryRoot });
  stdout.write(`${JSON.stringify(result)}\n`);
  return result.outcome === 'stale_state' ? 1 : 0;
}

export function printBwsPrivatePaperSchedulerServiceHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-private-paper-scheduler-service.js <run|status>',
      '',
      'Runs or inspects the long-running BWS private-paper scheduler service. The service repeats bounded scheduler passes, enforces queue backpressure, persists restart-safe status, and stops on SIGINT or SIGTERM without mode fallback.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_UPSTREAM_MODE, BWS_PRIVATE_PAPER_SCHEDULE_PATH, BWS_WORKER_QUEUE_NAME, BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS, BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS, BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS, BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS, BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
      'When BWS_UPSTREAM_MODE=api, also set BWS_UPSTREAM_API_CHECKPOINT_ID, BWS_UPSTREAM_API_BASE_URL, BWS_UPSTREAM_API_CONTRACT_VERSION, BWS_UPSTREAM_API_PAGE_SIZE, BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE, BWS_UPSTREAM_API_RETRY_LIMIT, BWS_UPSTREAM_API_RETRY_BACKOFF_MS, and BWS_UPSTREAM_API_TIMEOUT_MS.',
      'When BWS_UPSTREAM_MODE=export, also set BWS_UPSTREAM_EXPORT_SELECTION_PATH.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsPrivatePaperSchedulerServiceCli(process.argv.slice(2)).then(
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
