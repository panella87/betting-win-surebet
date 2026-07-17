export async function runBwsUpstreamExportConvergenceCli(
  argv: readonly string[],
  repositoryRoot: string = process.cwd(),
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<number> {
  void argv;
  void repositoryRoot;
  void stdout;
  throw new Error('The BWS upstream export runtime has been removed; use the betting-win read-only API.');
}

export function printBwsUpstreamExportConvergenceHelp(
  stream: NodeJS.WriteStream = process.stdout,
): void {
  stream.write('The BWS upstream export runtime has been removed; use the betting-win read-only API.\n');
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  runBwsUpstreamExportConvergenceCli(process.argv.slice(2)).then(
    (exitCode) => { process.exitCode = exitCode; },
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    },
  );
}
