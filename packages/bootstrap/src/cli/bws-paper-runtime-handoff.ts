import {
  createBwsPaperRuntimeHandoff,
} from '../operations/paper-runtime-handoff.js';

export async function runBwsPaperRuntimeHandoffCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsPaperRuntimeHandoffHelp(stdout);
    return 0;
  }

  const result = await createBwsPaperRuntimeHandoff({
    repositoryRoot,
  });
  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

export function printBwsPaperRuntimeHandoffHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-paper-runtime-handoff.js',
      '',
      'Builds a strict machine-readable BWS private-paper runtime handoff from a healthy repo-owned loopback API lifecycle state and writes an immutable source handoff archive.',
      'Required environment matches runtime-status: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_API_PORT, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsPaperRuntimeHandoffCli(process.argv.slice(2)).then(
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
