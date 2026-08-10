import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

type RepositoryPathKind = 'directory_for_creation' | 'existing_file';

export function resolveRepositoryRelativePathForCreation(
  repositoryRoot: string,
  inputPath: string,
  label: string,
): string {
  return resolveRepositoryRelativePath(repositoryRoot, inputPath, label, 'directory_for_creation');
}

export function resolveExistingRepositoryRelativeFilePath(
  repositoryRoot: string,
  inputPath: string,
  label: string,
): string {
  return resolveRepositoryRelativePath(repositoryRoot, inputPath, label, 'existing_file');
}

function resolveRepositoryRelativePath(
  repositoryRoot: string,
  inputPath: string,
  label: string,
  kind: RepositoryPathKind,
): string {
  const trimmedPath = requireRepositoryRelativePath(inputPath, label);
  const repositoryRootReal = requireCanonicalRepositoryRoot(repositoryRoot);
  const resolvedPath = resolve(repositoryRootReal, trimmedPath);
  const relativePath = relative(repositoryRootReal, resolvedPath);
  if (relativePath.length === 0 || relativePath === '.' || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
    throw new Error(`${label} must resolve inside the repository root.`);
  }
  assertSafeRelativeSegments(relativePath, label);
  assertRepositoryRealpathContainment(repositoryRootReal, resolvedPath, relativePath, label, kind);
  return resolvedPath;
}

function requireRepositoryRelativePath(inputPath: string, label: string): string {
  if (typeof inputPath !== 'string' || inputPath.trim().length === 0) {
    throw new Error(`${label} must be a non-empty repository-relative path.`);
  }
  const trimmedPath = inputPath.trim();
  if (isAbsolute(trimmedPath)) {
    throw new Error(`${label} must be repository-relative, not absolute.`);
  }
  return trimmedPath;
}

function requireCanonicalRepositoryRoot(repositoryRoot: string): string {
  const stats = lstatSync(repositoryRoot);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error(`Repository root must be a non-symlink directory: ${repositoryRoot}`);
  }
  return realpathSync(repositoryRoot);
}

function assertSafeRelativeSegments(relativePath: string, label: string): void {
  const segments = relativePath.split(sep);
  for (const segment of segments) {
    if (segment.length === 0 || segment === '.' || segment === '..') {
      throw new Error(`${label} must not contain unsafe path segments.`);
    }
  }
}

function assertRepositoryRealpathContainment(
  repositoryRootReal: string,
  resolvedPath: string,
  relativePath: string,
  label: string,
  kind: RepositoryPathKind,
): void {
  const parts = relativePath.split(sep);
  let current = repositoryRootReal;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part === undefined) {
      throw new Error(`${label} must not contain unsafe path segments.`);
    }
    current = join(current, part);
    if (!existsSync(current)) {
      const parentReal = realpathSync(join(current, '..'));
      assertRealpathWithinRepository(repositoryRootReal, parentReal, `${label} parent`);
      if (kind === 'existing_file') {
        throw new Error(`${label} must resolve to an existing repository file.`);
      }
      return;
    }
    const stats = lstatSync(current);
    if (stats.isSymbolicLink()) {
      throw new Error(`${label} must not contain symlink path components.`);
    }
    const currentReal = realpathSync(current);
    assertRealpathWithinRepository(repositoryRootReal, currentReal, label);
    const isFinalSegment = index === parts.length - 1;
    if (isFinalSegment) {
      if (kind === 'existing_file' && !stats.isFile()) {
        throw new Error(`${label} must resolve to a repository file.`);
      }
      if (kind === 'directory_for_creation' && !stats.isDirectory()) {
        throw new Error(`${label} must resolve to a repository directory.`);
      }
      assertRealpathWithinRepository(repositoryRootReal, realpathSync(resolvedPath), label);
      return;
    }
    if (!stats.isDirectory()) {
      throw new Error(`${label} parent path must contain only directories.`);
    }
  }
}

function assertRealpathWithinRepository(repositoryRootReal: string, realPath: string, label: string): void {
  const relativeRealPath = relative(repositoryRootReal, realPath);
  if (relativeRealPath === '..' || relativeRealPath.startsWith(`..${sep}`)) {
    throw new Error(`${label} realpath must stay inside the repository root.`);
  }
}
