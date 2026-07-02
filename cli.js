#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const command = process.argv[2] || 'help';
const LOCAL_REPORT_DIST_ENTRY = 'dist/src/cli/local-paper-report.js';

function printHelp() {
  process.stdout.write(
    `betting-win-surebet CLI\n\nCommands:\n  help           Show this help\n  status         Print current repository status\n  validate       Run npm run validate\n  local-report   Validate a repo-local export bundle and write a private report under artifacts/\n`,
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
  const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (buildResult.status !== 0) {
    process.exit(buildResult.status === null ? 1 : buildResult.status);
  }

  const result = spawnSync('node', [LOCAL_REPORT_DIST_ENTRY, ...process.argv.slice(3)], { stdio: 'inherit' });
  process.exit(result.status === null ? 1 : result.status);
}

process.stderr.write(`Unknown command: ${command}\n`);
printHelp();
process.exit(1);
