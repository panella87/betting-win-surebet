import { enforceBwsApiOnlyProcessEnvironment } from './api-only-upstream.js';
import {
  getBwsUpstreamConvergenceServiceStatus,
  runBwsUpstreamConvergenceService,
} from '../operations/upstream-convergence-service.js';

export async function runBwsUpstreamConvergenceServiceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  enforceBwsApiOnlyProcessEnvironment();
  const [command] = argv;
  if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
    printBwsUpstreamConvergenceServiceHelp(stdout);
    return 0;
  }

  const output = await (
    command === 'run'
      ? runBwsUpstreamConvergenceService({ repositoryRoot })
      : command === 'status'
        ? Promise.resolve(getBwsUpstreamConvergenceServiceStatus({ repositoryRoot }))
        : Promise.reject(new Error(`Unknown BWS upstream convergence service command: ${command}`))
  );
  stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

export function printBwsUpstreamConvergenceServiceHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-upstream-convergence-service.js <run|status>',
      '',
      'Runs or inspects the long-running API-only BWS upstream convergence service without lifecycle-wrapper integration.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS, BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS, BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS, BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
      'Required API environment: BWS_UPSTREAM_API_CHECKPOINT_ID, BWS_UPSTREAM_API_BASE_URL, BWS_UPSTREAM_API_CONTRACT_VERSION, BWS_UPSTREAM_API_PAGE_SIZE, BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE, BWS_UPSTREAM_API_RETRY_LIMIT, BWS_UPSTREAM_API_RETRY_BACKOFF_MS, and BWS_UPSTREAM_API_TIMEOUT_MS.',
      'Stop the service with SIGINT or SIGTERM only; no automatic fallback or fixture mode is allowed.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsUpstreamConvergenceServiceCli(process.argv.slice(2)).then(
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
