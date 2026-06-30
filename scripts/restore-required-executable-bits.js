#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED_EXECUTABLE_PATHS } from '../tools/required_executable_paths.js';

function main() {
  const repoRoot = process.cwd();
  const results = [];
  for (const relativePath of REQUIRED_EXECUTABLE_PATHS) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`missing required executable path: ${relativePath}`);
    }
    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`required executable path is not a file: ${relativePath}`);
    }
    const mode = stats.mode & 0o777;
    if ((mode & 0o111) === 0) {
      fs.chmodSync(absolutePath, mode | 0o111);
      results.push(`restored ${relativePath}`);
    } else {
      results.push(`checked ${relativePath}`);
    }
  }
  process.stdout.write(`${results.join('\n')}\n`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error && error.message ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
