import {
  getManagedBwsOperatorStackStatus,
  startManagedBwsOperatorStack,
  stopManagedBwsOperatorStack,
} from '../operations/operator-lifecycle.js';

export async function runBwsOperatorLifecycleCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command] = argv;
  if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
    printBwsOperatorLifecycleHelp(stdout);
    return 0;
  }

  const output = await (
    command === 'start'
      ? startManagedBwsOperatorStack({ repositoryRoot })
      : command === 'status'
        ? getManagedBwsOperatorStackStatus({ repositoryRoot })
        : command === 'stop'
          ? stopManagedBwsOperatorStack({ repositoryRoot })
          : Promise.reject(new Error(`Unknown BWS operator lifecycle command: ${command}`))
  );
  stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

export function printBwsOperatorLifecycleHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-operator-lifecycle.js <start|status|stop>',
      '',
      'Manages the repo-owned full BWS stack lifecycle for upstream convergence, private-paper scheduler, private-paper worker, managed cockpit serving, and the loopback read-only API without touching protected root wrappers.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_UPSTREAM_MODE, BWS_API_PORT, BWS_WORKER_ID, BWS_WORKER_QUEUE_NAME, BWS_WORKER_LEASE_DURATION_MS, BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS, BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS, BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS, BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS, BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS, BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS, BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS, BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS, BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH, BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS, BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS, BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS, BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS, BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsOperatorLifecycleCli(process.argv.slice(2)).then(
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
