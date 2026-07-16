import {
  getManagedBwsReadOnlyApiStatus,
  startManagedBwsReadOnlyApi,
  stopManagedBwsReadOnlyApi,
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
      ? startManagedBwsReadOnlyApi({ repositoryRoot })
      : command === 'status'
        ? getManagedBwsReadOnlyApiStatus({ repositoryRoot })
        : command === 'stop'
          ? stopManagedBwsReadOnlyApi({ repositoryRoot })
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
      'Manages the repo-owned loopback BWS read-only API lifecycle without touching protected root wrappers.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_API_PORT, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
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
