import { enforceBwsApiOnlyProcessEnvironment } from './api-only-upstream.js';
import {
  runBwsPrivatePaperSchedulerPass,
} from '../operations/private-paper-runtime-scheduler.js';

export async function runBwsPrivatePaperSchedulerCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  enforceBwsApiOnlyProcessEnvironment();
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsPrivatePaperSchedulerHelp(stdout);
    return 0;
  }

  const result = await runBwsPrivatePaperSchedulerPass({
    repositoryRoot,
  });
  if (!result.ok) {
    throw new Error(result.blockers.map((entry) => entry.message).join(' '));
  }

  stdout.write(`${JSON.stringify(result.value)}\n`);
  return 0;
}

export function printBwsPrivatePaperSchedulerHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-private-paper-scheduler.js',
      '',
      'Runs one bounded BWS private-paper scheduler pass against the fixed betting-win read-only API. It advances explicit upstream convergence, persists restart-safe scheduler checkpoints, and enqueues deterministic private-paper worker jobs without fallback.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_PRIVATE_PAPER_SCHEDULE_PATH, BWS_WORKER_QUEUE_NAME, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
      'Also set BWS_UPSTREAM_API_CHECKPOINT_ID, BWS_UPSTREAM_API_BASE_URL, BWS_UPSTREAM_API_CONTRACT_VERSION, BWS_UPSTREAM_API_PAGE_SIZE, BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE, BWS_UPSTREAM_API_RETRY_LIMIT, BWS_UPSTREAM_API_RETRY_BACKOFF_MS, and BWS_UPSTREAM_API_TIMEOUT_MS.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsPrivatePaperSchedulerCli(process.argv.slice(2)).then(
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
