import { enforceBwsApiOnlyProcessEnvironment } from './api-only-upstream.js';
import {
  runBwsUpstreamApiConvergencePass,
} from '../operations/upstream-api-convergence.js';

export async function runBwsUpstreamApiConvergenceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  enforceBwsApiOnlyProcessEnvironment();
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsUpstreamApiConvergenceHelp(stdout);
    return 0;
  }

  const result = await runBwsUpstreamApiConvergencePass({
    repositoryRoot,
  });
  if (!result.ok) {
    throw new Error(result.blockers.map((entry) => entry.message).join(' '));
  }

  stdout.write(`${JSON.stringify(result.value)}\n`);
  return 0;
}

export function printBwsUpstreamApiConvergenceHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-upstream-api-convergence.js',
      '',
      'Runs one bounded API-only BWS upstream convergence pass using the validated betting-win read-only query client, committed-HEAD upstream lock verification, surebet-only persistence, and closed execution policy.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_UPSTREAM_API_CHECKPOINT_ID, BWS_UPSTREAM_API_BASE_URL, BWS_UPSTREAM_API_CONTRACT_VERSION, BWS_UPSTREAM_API_PAGE_SIZE, BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE, BWS_UPSTREAM_API_RETRY_LIMIT, BWS_UPSTREAM_API_RETRY_BACKOFF_MS, BWS_UPSTREAM_API_TIMEOUT_MS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsUpstreamApiConvergenceCli(process.argv.slice(2)).then(
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
