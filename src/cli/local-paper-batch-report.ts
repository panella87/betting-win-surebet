import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runLocalPaperBatchReportCli } from '../../packages/bootstrap/src/cli/local-paper-batch-report.js';

export * from '../../packages/bootstrap/src/cli/local-paper-batch-report.js';

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const exitCode = runLocalPaperBatchReportCli(process.argv.slice(2));
  process.exit(exitCode);
}
