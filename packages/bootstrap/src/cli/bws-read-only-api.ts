import {
  BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV,
  BWS_OPERATOR_COCKPIT_DATA_MODE_ENV,
  describeBwsOperatorCockpitProcessDefinition,
  resolveBwsOperatorCockpitBrowserConfig,
} from '../../../../apps/web/src/index.js';
import {
  resolveBwsServiceRuntimeConfig,
  type BwsServiceRuntimeEnvironment,
} from '../operations/service-runtime.js';
import {
  startBwsReadOnlyApiApplication,
} from '../operations/runtime-applications.js';

export async function runBwsReadOnlyApiCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    printBwsReadOnlyApiHelp(stdout);
    return 0;
  }

  const config = resolveBwsServiceRuntimeConfig(process.env as BwsServiceRuntimeEnvironment, repositoryRoot);
  const apiBaseUrl = `http://${config.api.bindHost}:${config.api.port}`;
  const cockpitConfig = resolveBwsOperatorCockpitBrowserConfig({
    [BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]: apiBaseUrl,
    [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]: 'api',
  });
  const application = await startBwsReadOnlyApiApplication({
    config,
    cockpitProcessDefinition: describeBwsOperatorCockpitProcessDefinition(cockpitConfig),
    repositoryRoot,
  });
  await application.closed;
  return 0;
}

export function printBwsReadOnlyApiHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      'Usage: node dist/packages/bootstrap/src/cli/bws-read-only-api.js',
      '',
      'Starts the loopback-only BWS read-only API on 127.0.0.1 using explicit runtime configuration, surebet-only migrations, and closed execution policy.',
      'Required environment: BETTING_WIN_REPO_PATH, BWS_UPSTREAM_LOCK_PATH, BWS_API_PORT, SUREBET_RUNTIME_MODE=paper, SUREBET_PROVIDER_CONNECTIONS=disabled, SUREBET_EXECUTION_ENABLED=false, SUREBET_PG_DATABASE, SUREBET_PG_USER, SUREBET_PG_PORT, and exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    ].join('\n'),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsReadOnlyApiCli(process.argv.slice(2)).then(
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
