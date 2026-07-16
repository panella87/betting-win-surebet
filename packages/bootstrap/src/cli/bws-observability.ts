import {
  collectBwsDiagnosticsBundle,
} from '../operations/observability.js';

export async function runBwsObservabilityCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  const [command] = argv;
  if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
    printBwsObservabilityHelp(stdout);
    return 0;
  }
  if (command !== 'diagnostics') {
    throw new Error(`Unknown BWS observability command: ${command}`);
  }
  const result = await collectBwsDiagnosticsBundle({ repositoryRoot });
  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

export function printBwsObservabilityHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-observability.js <diagnostics>',
      '',
      'Builds a repo-local read-only diagnostics bundle that captures source and upstream fingerprints, lifecycle ownership, loopback health/readiness and metrics, migration and queue summaries, recent structured logs, recent evidence-index entries, and configuration presence without values.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_API_PORT, BWS_WORKER_ID, BWS_WORKER_QUEUE_NAME, BWS_WORKER_LEASE_DURATION_MS, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsObservabilityCli(process.argv.slice(2)).then(
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
