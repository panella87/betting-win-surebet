import {
  runBwsUpstreamExportConvergencePass,
} from '../operations/upstream-export-convergence.js';

export async function runBwsUpstreamExportConvergenceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsUpstreamExportConvergenceHelp(stdout);
    return 0;
  }

  const result = runBwsUpstreamExportConvergencePass({
    repositoryRoot,
  });
  if (!result.ok) {
    throw new Error(result.blockers.map((entry) => entry.message).join(' '));
  }

  stdout.write(`${JSON.stringify(result.value)}\n`);
  return 0;
}

export function printBwsUpstreamExportConvergenceHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-upstream-export-convergence.js',
      '',
      'Runs one bounded BWS upstream export convergence pass using an explicit repo-local immutable export selection manifest, committed-HEAD upstream lock verification, surebet-only persistence, and closed execution policy.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_UPSTREAM_MODE=export, BWS_UPSTREAM_EXPORT_SELECTION_PATH, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsUpstreamExportConvergenceCli(process.argv.slice(2)).then(
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
