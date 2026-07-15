import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runLocalPaperReportCli } from '../../packages/bootstrap/src/cli/local-paper-report.js';

export * from '../../packages/bootstrap/src/cli/local-paper-report.js';

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const exitCode = runLocalPaperReportCli(process.argv.slice(2));
  process.exit(exitCode);
}
