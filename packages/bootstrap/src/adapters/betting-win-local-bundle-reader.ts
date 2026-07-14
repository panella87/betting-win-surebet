import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { blocked, type BoundaryResult } from '../contracts/local-types.js';
import { parseBettingWinExportBundle, type BettingWinExportBundle } from './betting-win-export-reader.js';

const URL_SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i;

export function readLocalBettingWinExportBundle(
  bundlePath: string,
  repoRoot: string = process.cwd(),
): BoundaryResult<BettingWinExportBundle> {
  if (bundlePath.trim().length === 0) {
    return blocked(
      'LOCAL_EXPORT_PATH_MISSING',
      'A repo-local export bundle path is required.',
      'Repo-local JSON export bundle path.',
    );
  }
  if (URL_SCHEME_PREFIX.test(bundlePath)) {
    return blocked(
      'LOCAL_EXPORT_REMOTE_URL_FORBIDDEN',
      'Export bundle path must be a repo-local filesystem path, not a URL.',
      'Repo-local JSON export bundle path.',
    );
  }

  const resolvedRepoRoot = resolve(repoRoot);
  const resolvedBundlePath = isAbsolute(bundlePath) ? resolve(bundlePath) : resolve(resolvedRepoRoot, bundlePath);

  if (!isPathInsideRoot(resolvedRepoRoot, resolvedBundlePath)) {
    return blocked(
      'LOCAL_EXPORT_PATH_OUTSIDE_REPO',
      'Export bundle path must stay inside the current repository.',
      'Repo-local JSON export bundle path.',
    );
  }

  try {
    const repoRealPath = realpathSync(resolvedRepoRoot);
    const linkStats = lstatSync(resolvedBundlePath);
    if (linkStats.isSymbolicLink()) {
      return blocked(
        'LOCAL_EXPORT_SYMLINK_FORBIDDEN',
        'Export bundle path must be a real repo-local file, not a symbolic link.',
        'Non-symlink repo-local JSON export bundle file.',
      );
    }

    const stats = statSync(resolvedBundlePath);
    if (!stats.isFile()) {
      return blocked(
        'LOCAL_EXPORT_PATH_NOT_FILE',
        'Export bundle path must resolve to a JSON file.',
        'Repo-local JSON export bundle file.',
      );
    }

    const bundleRealPath = realpathSync(resolvedBundlePath);
    if (!isPathInsideRoot(repoRealPath, bundleRealPath)) {
      return blocked(
        'LOCAL_EXPORT_REALPATH_OUTSIDE_REPO',
        'Export bundle realpath must stay inside the current repository.',
        'Repo-local JSON export bundle file with an in-repo realpath.',
      );
    }
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return blocked(
        'LOCAL_EXPORT_FILE_MISSING',
        'Export bundle file does not exist.',
        'Repo-local JSON export bundle file.',
      );
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolvedBundlePath, 'utf-8')) as unknown;
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return blocked(
        'LOCAL_EXPORT_JSON_INVALID',
        'Export bundle file must contain valid JSON.',
        'Valid repo-local export bundle JSON.',
      );
    }
    throw error;
  }

  return parseBettingWinExportBundle(parsed);
}

function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return relativePath.length === 0 || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
