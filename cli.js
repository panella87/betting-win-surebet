#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const command = process.argv[2] || 'help';
const LOCAL_REPORT_DIST_ENTRY = 'dist/src/cli/local-paper-report.js';
const LOCAL_REPORT_BATCH_DIST_ENTRY = 'dist/src/cli/local-paper-batch-report.js';
const UPSTREAM_API_CONVERGENCE_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-upstream-api-convergence.js';
const PRIVATE_PAPER_SCHEDULER_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-private-paper-scheduler.js';
const READ_ONLY_API_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-read-only-api.js';
const PRIVATE_PAPER_WORKER_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-private-paper-worker.js';
const OPERATOR_LIFECYCLE_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-operator-lifecycle.js';
const PAPER_RUNTIME_HANDOFF_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-paper-runtime-handoff.js';
const SOAK_CAMPAIGN_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-soak-campaign.js';
const EXTERNAL_RUNTIME_PREFLIGHT_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-external-runtime-preflight.js';
const FINAL_LOCAL_ACCEPTANCE_DIST_ENTRY = 'dist/packages/bootstrap/src/cli/bws-final-local-acceptance.js';

function printHelp() {
  process.stdout.write(
    `betting-win-surebet CLI\n\nCommands:\n  help                     Show this help\n  status                   Print current repository status\n  validate                 Run npm run validate\n  local-report             Validate a repo-local export bundle and write a private report under artifacts/\n  local-report-batch       Validate a repo-local directory of pinned bundles and write private reports plus a private batch summary under artifacts/\n  runtime-upstream-api     Build and run one bounded BWS read-only upstream API convergence pass\n  runtime-scheduler        Build and run one bounded BWS private-paper scheduler pass\n  runtime-api              Build and start the loopback-only BWS read-only API\n  runtime-worker           Build and run one bounded BWS private-paper worker pass\n  runtime-start            Build and start the repo-owned full BWS stack lifecycle\n  runtime-status           Build and print machine-readable full-stack BWS lifecycle status and evidence\n  runtime-stop             Build and stop the repo-owned full BWS stack lifecycle\n  runtime-handoff          Build and print a machine-readable BWS private-paper runtime handoff plus immutable source archive\n  soak-campaign            Build and run the BWS-592 soak campaign CLI\n  external-runtime-preflight  Build and run the BWS-593 external runtime preflight CLI\n  final-local-acceptance   Build and run the staged BWS-599 final local acceptance CLI\n`,
  );
}

if (command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'status') {
  process.stdout.write(readFileSync('PROJECT_STATUS.md', 'utf8'));
  process.exit(0);
}

if (command === 'validate') {
  const result = spawnSync('npm', ['run', 'validate'], { stdio: 'inherit' });
  process.exit(result.status === null ? 1 : result.status);
}

if (command === 'local-report') {
  runBuiltEntry(LOCAL_REPORT_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'local-report-batch') {
  runBuiltEntry(LOCAL_REPORT_BATCH_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'runtime-api') {
  runBuiltEntry(READ_ONLY_API_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'runtime-upstream-api') {
  runBuiltEntry(UPSTREAM_API_CONVERGENCE_DIST_ENTRY, process.argv.slice(3));
}


if (command === 'runtime-scheduler') {
  runBuiltEntry(PRIVATE_PAPER_SCHEDULER_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'runtime-worker') {
  runBuiltEntry(PRIVATE_PAPER_WORKER_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'runtime-start') {
  runBuiltEntry(OPERATOR_LIFECYCLE_DIST_ENTRY, ['start', ...process.argv.slice(3)]);
}

if (command === 'runtime-status') {
  runBuiltEntry(OPERATOR_LIFECYCLE_DIST_ENTRY, ['status', ...process.argv.slice(3)]);
}

if (command === 'runtime-stop') {
  runBuiltEntry(OPERATOR_LIFECYCLE_DIST_ENTRY, ['stop', ...process.argv.slice(3)]);
}

if (command === 'runtime-handoff') {
  runBuiltEntry(PAPER_RUNTIME_HANDOFF_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'soak-campaign') {
  runBuiltEntry(SOAK_CAMPAIGN_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'external-runtime-preflight') {
  runBuiltEntry(EXTERNAL_RUNTIME_PREFLIGHT_DIST_ENTRY, process.argv.slice(3));
}

if (command === 'final-local-acceptance') {
  runBuiltEntry(FINAL_LOCAL_ACCEPTANCE_DIST_ENTRY, process.argv.slice(3));
}

function runBuiltEntry(entryPoint, argv) {
  const buildResult = spawnSync('npm', ['run', 'build'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (buildResult.status !== 0) {
    if (buildResult.stdout) {
      process.stderr.write(buildResult.stdout);
    }
    if (buildResult.stderr) {
      process.stderr.write(buildResult.stderr);
    }
    process.exit(buildResult.status === null ? 1 : buildResult.status);
  }

  const result = spawnSync('node', [entryPoint, ...argv], { stdio: 'inherit' });
  process.exit(result.status === null ? 1 : result.status);
}

process.stderr.write(`Unknown command: ${command}\n`);
printHelp();
process.exit(1);
