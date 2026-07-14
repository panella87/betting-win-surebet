import { accessSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { constants as fsConstants } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';

const BETTING_WIN_REPOSITORY_NAME = 'betting-win';
const BETTING_WIN_UPSTREAM_LOCK_SCHEMA = 'betting-win-surebet-upstream-lock-v1';
const BETTING_WIN_UPSTREAM_LOCK_PATH = 'config/betting-win.upstream.lock.json';
const BETTING_WIN_UPSTREAM_LOCK_SCHEMA_PATH = 'schemas/betting-win-upstream-lock.v1.schema.json';
const SOURCE_FINGERPRINT_ALGORITHM = 'sha256_git_ls_tree_r_full_tree_head_v1';
const REQUIRED_WORKSPACE_PATTERNS = ['packages/*', 'apps/*'] as const;
const REQUIRED_WORKSPACE_ROOTS = ['packages', 'apps'] as const;
const REQUIRED_COMPATIBILITY_PACKAGES = [
  '@betting-win/contracts',
  '@betting-win/foundation',
  '@betting-win/identity',
  '@betting-win/paper-ledger',
  '@betting-win/provider-collection',
  '@betting-win/provider-generation',
  '@betting-win/query-service',
  '@betting-win/quotes',
  '@betting-win/rules',
  '@betting-win/source-lineage',
] as const;
const REQUIRED_CAPABILITIES = [
  'exportHistoricalBundle',
  'getHistoricalQuotes',
  'getProviderGenerations',
  'inspectSourceLineage',
] as const;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const JSON_SCHEMA_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export interface BettingWinUpstreamLock {
  readonly schema: typeof BETTING_WIN_UPSTREAM_LOCK_SCHEMA;
  readonly repository: typeof BETTING_WIN_REPOSITORY_NAME;
  readonly repositoryPath: string;
  readonly commitSha: string;
  readonly gitTreeSha: string;
  readonly worktreeClean: true;
  readonly packageVersion: string;
  readonly trackedTreeListingSha256: string;
  readonly sourceFingerprintAlgorithm: typeof SOURCE_FINGERPRINT_ALGORITHM;
  readonly contractSchema: 'betting-win.strategy-export.v1';
  readonly contractAlias: 'betting-win-strategy-export.v1';
  readonly surebetProfile: 'surebet_standard_binary_v0';
  readonly verifiedAt: string;
  readonly packageVersions: Readonly<Record<string, string>>;
  readonly capabilities: readonly string[];
}

interface JsonSchemaProperty {
  readonly const?: unknown;
  readonly type?: string;
  readonly pattern?: string;
  readonly minLength?: number;
  readonly minItems?: number;
  readonly minProperties?: number;
  readonly uniqueItems?: boolean;
  readonly format?: string;
  readonly additionalProperties?: JsonSchemaProperty;
  readonly items?: JsonSchemaProperty;
}

interface JsonSchemaObject {
  readonly additionalProperties?: boolean;
  readonly properties?: Readonly<Record<string, JsonSchemaProperty>>;
  readonly required?: readonly string[];
}

interface CheckoutSnapshot {
  readonly repositoryPath: string;
  readonly commitSha: string;
  readonly gitTreeSha: string;
  readonly trackedTreeListingSha256: string;
  readonly worktreeStatus: string;
  readonly rootPackage: Readonly<Record<string, unknown>>;
  readonly packageVersions: Readonly<Record<string, string>>;
  readonly capabilities: readonly string[];
}

export interface GenerateBettingWinUpstreamLockOptions {
  readonly bettingWinRepoPath?: string;
  readonly repositoryRoot?: string;
  readonly allowedBoundaryRoot?: string;
  readonly schemaPath?: string;
  readonly outputPath?: string;
  readonly verifiedAt?: string;
}

export class UpstreamVerificationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function generateBettingWinUpstreamLock(
  options: GenerateBettingWinUpstreamLockOptions = {},
): BettingWinUpstreamLock {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const schemaPath = resolve(repositoryRoot, options.schemaPath ?? BETTING_WIN_UPSTREAM_LOCK_SCHEMA_PATH);
  const verifiedAt = normalizeVerifiedAt(options.verifiedAt);
  const checkoutOptions: {
    readonly repositoryRoot: string;
    readonly allowedBoundaryRoot?: string;
    readonly bettingWinRepoPath?: string;
  } = { repositoryRoot };
  if (options.allowedBoundaryRoot !== undefined) {
    Object.assign(checkoutOptions, { allowedBoundaryRoot: options.allowedBoundaryRoot });
  }
  if (options.bettingWinRepoPath !== undefined) {
    Object.assign(checkoutOptions, { bettingWinRepoPath: options.bettingWinRepoPath });
  }
  const checkout = inspectBettingWinCheckout(checkoutOptions);
  const lock: BettingWinUpstreamLock = Object.freeze({
    schema: BETTING_WIN_UPSTREAM_LOCK_SCHEMA,
    repository: BETTING_WIN_REPOSITORY_NAME,
    repositoryPath: checkout.repositoryPath,
    commitSha: checkout.commitSha,
    gitTreeSha: checkout.gitTreeSha,
    worktreeClean: true,
    packageVersion: requireString(checkout.rootPackage.version, 'BETTING_WIN_PACKAGE_VERSION_INVALID'),
    trackedTreeListingSha256: checkout.trackedTreeListingSha256,
    sourceFingerprintAlgorithm: SOURCE_FINGERPRINT_ALGORITHM,
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt,
    packageVersions: checkout.packageVersions,
    capabilities: Object.freeze([...checkout.capabilities]),
  });
  validateLockAgainstSchema(lock, schemaPath);
  verifyCheckoutUnchanged(checkout.repositoryPath, checkout);
  return lock;
}

export function writeBettingWinUpstreamLock(
  options: GenerateBettingWinUpstreamLockOptions = {},
): BettingWinUpstreamLock {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const outputPath = resolve(repositoryRoot, options.outputPath ?? BETTING_WIN_UPSTREAM_LOCK_PATH);
  const generationOptions: GenerateBettingWinUpstreamLockOptions = { repositoryRoot };
  if (options.bettingWinRepoPath !== undefined) {
    Object.assign(generationOptions, { bettingWinRepoPath: options.bettingWinRepoPath });
  }
  if (options.allowedBoundaryRoot !== undefined) {
    Object.assign(generationOptions, { allowedBoundaryRoot: options.allowedBoundaryRoot });
  }
  if (options.schemaPath !== undefined) {
    Object.assign(generationOptions, { schemaPath: options.schemaPath });
  }
  if (options.verifiedAt !== undefined) {
    Object.assign(generationOptions, { verifiedAt: options.verifiedAt });
  }
  const lock = generateBettingWinUpstreamLock(generationOptions);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf-8');
  return lock;
}

export function verifyBettingWinUpstreamLock(
  lock: unknown,
  options: Omit<GenerateBettingWinUpstreamLockOptions, 'outputPath' | 'verifiedAt'> = {},
): BettingWinUpstreamLock {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const schemaPath = resolve(repositoryRoot, options.schemaPath ?? BETTING_WIN_UPSTREAM_LOCK_SCHEMA_PATH);
  validateLockAgainstSchema(lock, schemaPath);
  const parsedLock = requireLockRecord(lock);
  const generationOptions: GenerateBettingWinUpstreamLockOptions = {
    repositoryRoot,
    schemaPath,
    verifiedAt: requireString(parsedLock.verifiedAt, 'BETTING_WIN_UPSTREAM_LOCK_INVALID'),
  };
  if (options.bettingWinRepoPath !== undefined) {
    Object.assign(generationOptions, { bettingWinRepoPath: options.bettingWinRepoPath });
  }
  if (options.allowedBoundaryRoot !== undefined) {
    Object.assign(generationOptions, { allowedBoundaryRoot: options.allowedBoundaryRoot });
  }
  const actual = generateBettingWinUpstreamLock(generationOptions);
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(lock);
  if (actualJson !== expectedJson) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_UPSTREAM_LOCK_MISMATCH',
      'betting-win upstream lock does not match the current verified checkout.',
    );
  }
  return actual;
}

export function readBettingWinUpstreamLock(lockPath: string, repositoryRoot: string = process.cwd()): BettingWinUpstreamLock {
  const resolvedLockPath = resolve(repositoryRoot, lockPath);
  if (!existsSync(resolvedLockPath)) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_UPSTREAM_LOCK_FILE_MISSING',
      `betting-win upstream lock file does not exist: ${resolvedLockPath}`,
    );
  }
  return requireLockObject(parseJsonFile(resolvedLockPath, 'BETTING_WIN_UPSTREAM_LOCK_JSON_INVALID'));
}

function inspectBettingWinCheckout(options: {
  readonly repositoryRoot: string;
  readonly allowedBoundaryRoot?: string;
  readonly bettingWinRepoPath?: string;
}): CheckoutSnapshot {
  const configuredRepoPath = options.bettingWinRepoPath ?? process.env.BETTING_WIN_REPO_PATH;
  if (typeof configuredRepoPath !== 'string' || configuredRepoPath.trim().length === 0) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_REPO_PATH_MISSING',
      'BETTING_WIN_REPO_PATH must be set to the read-only betting-win development checkout.',
    );
  }
  const resolvedRepoPath = resolve(configuredRepoPath);
  if (!existsSync(resolvedRepoPath)) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_REPO_PATH_MISSING',
      `BETTING_WIN_REPO_PATH does not exist: ${resolvedRepoPath}`,
    );
  }
  const stats = safeStatSync(resolvedRepoPath, 'BETTING_WIN_REPO_PATH_UNREADABLE');
  if (!stats.isDirectory()) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_REPO_PATH_INVALID',
      `BETTING_WIN_REPO_PATH must point to a directory: ${resolvedRepoPath}`,
    );
  }
  safeAccessSync(resolvedRepoPath, fsConstants.R_OK, 'BETTING_WIN_REPO_PATH_UNREADABLE');
  const repositoryPath = safeRealpathSync(resolvedRepoPath, 'BETTING_WIN_REPO_PATH_UNREADABLE');
  const allowedBoundaryCandidate = options.allowedBoundaryRoot !== undefined
    ? options.allowedBoundaryRoot
    : dirname(options.repositoryRoot);
  const allowedBoundaryRoot = safeRealpathSync(resolve(allowedBoundaryCandidate), 'BETTING_WIN_ALLOWED_BOUNDARY_INVALID');
  if (!isWithinBoundary(repositoryPath, allowedBoundaryRoot)) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_REPO_PATH_OUTSIDE_ALLOWED_BOUNDARY',
      `BETTING_WIN_REPO_PATH must stay inside the allowed development boundary: ${allowedBoundaryRoot}`,
    );
  }
  if (repositoryPath === options.repositoryRoot) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_REPO_PATH_INVALID',
      'BETTING_WIN_REPO_PATH must point to the separate betting-win checkout, not this BWS repository.',
    );
  }

  const rootPackagePath = join(repositoryPath, 'package.json');
  const rootPackage = parseJsonFile(rootPackagePath, 'BETTING_WIN_PACKAGE_JSON_INVALID');
  if (requireString(rootPackage.name, 'BETTING_WIN_PACKAGE_NAME_INVALID') !== BETTING_WIN_REPOSITORY_NAME) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_NOT_A_BETTING_WIN_CHECKOUT',
      `BETTING_WIN_REPO_PATH package.json name must be ${BETTING_WIN_REPOSITORY_NAME}.`,
    );
  }
  const workspaces = rootPackage.workspaces;
  if (!Array.isArray(workspaces) || JSON.stringify(workspaces) !== JSON.stringify([...REQUIRED_WORKSPACE_PATTERNS])) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_WORKSPACES_INVALID',
      'betting-win package.json must expose the expected workspaces patterns.',
    );
  }

  const gitTopLevel = runGitText(repositoryPath, ['rev-parse', '--show-toplevel'], 'BETTING_WIN_GIT_TOPLEVEL_UNAVAILABLE').trim();
  if (realpathSync(gitTopLevel) !== repositoryPath) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_GIT_TOPLEVEL_MISMATCH',
      'BETTING_WIN_REPO_PATH must resolve to the betting-win Git toplevel directory.',
    );
  }
  const worktreeStatus = runGitText(
    repositoryPath,
    ['status', '--porcelain', '--untracked-files=all'],
    'BETTING_WIN_GIT_STATUS_UNAVAILABLE',
  );
  if (worktreeStatus.trim().length > 0) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_WORKTREE_DIRTY',
      `betting-win checkout must be clean before generating the upstream lock. Found:\n${worktreeStatus.trimEnd()}`,
    );
  }

  const packageVersions = collectWorkspacePackageVersions(repositoryPath);
  const providerCollectionIndexPath = join(repositoryPath, 'packages', 'provider-collection', 'src', 'index.ts');
  const providerCollectionIndex = readRequiredText(providerCollectionIndexPath, 'BETTING_WIN_PROVIDER_COLLECTION_INDEX_MISSING');
  for (const marker of [
    'betting-win.strategy-export.v1',
    'betting-win-strategy-export.v1',
    'surebet_standard_binary_v0',
    ...REQUIRED_CAPABILITIES,
  ]) {
    if (!providerCollectionIndex.includes(marker)) {
      throw new UpstreamVerificationError(
        'BETTING_WIN_REQUIRED_CAPABILITY_MISSING',
        `betting-win provider collection surface is missing required marker: ${marker}`,
      );
    }
  }

  const commitSha = runGitText(repositoryPath, ['rev-parse', 'HEAD'], 'BETTING_WIN_COMMIT_SHA_UNAVAILABLE').trim();
  const gitTreeSha = runGitText(repositoryPath, ['rev-parse', 'HEAD^{tree}'], 'BETTING_WIN_TREE_SHA_UNAVAILABLE').trim();
  const trackedTreeListing = runGitBuffer(
    repositoryPath,
    ['ls-tree', '-r', '--full-tree', 'HEAD'],
    'BETTING_WIN_TRACKED_TREE_LISTING_UNAVAILABLE',
  );
  return Object.freeze({
    repositoryPath,
    commitSha,
    gitTreeSha,
    trackedTreeListingSha256: sha256Hex(trackedTreeListing),
    worktreeStatus,
    rootPackage: rootPackage,
    packageVersions,
    capabilities: Object.freeze([...REQUIRED_CAPABILITIES]),
  });
}

function collectWorkspacePackageVersions(repositoryPath: string): Readonly<Record<string, string>> {
  const packageVersions: Record<string, string> = {};
  for (const workspaceRoot of REQUIRED_WORKSPACE_ROOTS) {
    const workspaceDirectory = join(repositoryPath, workspaceRoot);
    if (!existsSync(workspaceDirectory)) {
      throw new UpstreamVerificationError(
        'BETTING_WIN_WORKSPACE_DIRECTORY_MISSING',
        `betting-win workspace directory is missing: ${workspaceDirectory}`,
      );
    }
    for (const entry of readdirSync(workspaceDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const packageJsonPath = join(workspaceDirectory, entry.name, 'package.json');
      const packageJson = parseJsonFile(packageJsonPath, 'BETTING_WIN_WORKSPACE_PACKAGE_JSON_INVALID');
      const packageName = requireString(packageJson.name, 'BETTING_WIN_WORKSPACE_PACKAGE_NAME_INVALID');
      const packageVersion = requireString(packageJson.version, 'BETTING_WIN_WORKSPACE_PACKAGE_VERSION_INVALID');
      packageVersions[packageName] = packageVersion;
    }
  }

  for (const packageName of REQUIRED_COMPATIBILITY_PACKAGES) {
    if (!(packageName in packageVersions)) {
      throw new UpstreamVerificationError(
        'BETTING_WIN_REQUIRED_PACKAGE_MISSING',
        `betting-win checkout is missing required compatibility package: ${packageName}`,
      );
    }
  }

  return Object.freeze(sortObject(packageVersions));
}

function safeAccessSync(path: string, mode: number, errorCode: string): void {
  try {
    accessSync(path, mode);
  } catch (error) {
    throw new UpstreamVerificationError(errorCode, `Required path is unreadable: ${path}. ${fsErrorMessage(error)}`);
  }
}

function safeRealpathSync(path: string, errorCode: string): string {
  try {
    return realpathSync(path);
  } catch (error) {
    throw new UpstreamVerificationError(errorCode, `Unable to resolve real path for ${path}. ${fsErrorMessage(error)}`);
  }
}

function safeStatSync(path: string, errorCode: string) {
  try {
    return statSync(path);
  } catch (error) {
    throw new UpstreamVerificationError(errorCode, `Unable to inspect path metadata for ${path}. ${fsErrorMessage(error)}`);
  }
}

function validateLockAgainstSchema(lock: unknown, schemaPath: string): void {
  const schema = parseJsonFile(schemaPath, 'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_INVALID') as JsonSchemaObject;
  const object = requireLockRecord(lock);
  if (schema.additionalProperties !== false) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_UNSUPPORTED',
      'betting-win upstream lock schema must reject additional properties.',
    );
  }
  const properties = schema.properties;
  if (properties === undefined) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_UNSUPPORTED',
      'betting-win upstream lock schema must declare properties.',
    );
  }
  const required = schema.required ?? [];
  for (const field of required) {
    if (!(field in object)) {
      throw new UpstreamVerificationError(
        'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
        `betting-win upstream lock is missing required field: ${field}`,
      );
    }
  }
  for (const key of Object.keys(object)) {
    if (!(key in properties)) {
      throw new UpstreamVerificationError(
        'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
        `betting-win upstream lock contains unsupported field: ${key}`,
      );
    }
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    validateSchemaProperty(object[key], propertySchema, key);
  }
}

function validateSchemaProperty(value: unknown, schema: JsonSchemaProperty, field: string): void {
  if (value === undefined) {
    return;
  }
  if (schema.const !== undefined && value !== schema.const) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
      `betting-win upstream lock field ${field} must equal ${JSON.stringify(schema.const)}.`,
    );
  }
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        throw schemaTypeError(field, 'string');
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        throw new UpstreamVerificationError(
          'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
          `betting-win upstream lock field ${field} must have length >= ${schema.minLength}.`,
        );
      }
      if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
        throw new UpstreamVerificationError(
          'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
          `betting-win upstream lock field ${field} does not match ${schema.pattern}.`,
        );
      }
      if (schema.format === 'date-time' && !JSON_SCHEMA_DATE_TIME.test(value)) {
        throw new UpstreamVerificationError(
          'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
          `betting-win upstream lock field ${field} must be an ISO-8601 UTC date-time.`,
        );
      }
      return;
    case 'object':
      if (!isRecord(value)) {
        throw schemaTypeError(field, 'object');
      }
      const keys = Object.keys(value);
      if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
        throw new UpstreamVerificationError(
          'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
          `betting-win upstream lock field ${field} must have at least ${schema.minProperties} properties.`,
        );
      }
      if (schema.additionalProperties !== undefined) {
        for (const [childKey, childValue] of Object.entries(value)) {
          validateSchemaProperty(childValue, schema.additionalProperties, `${field}.${childKey}`);
        }
      }
      return;
    case 'array':
      if (!Array.isArray(value)) {
        throw schemaTypeError(field, 'array');
      }
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        throw new UpstreamVerificationError(
          'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
          `betting-win upstream lock field ${field} must contain at least ${schema.minItems} items.`,
        );
      }
      if (schema.uniqueItems === true && new Set(value.map((entry) => JSON.stringify(entry))).size !== value.length) {
        throw new UpstreamVerificationError(
          'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
          `betting-win upstream lock field ${field} must contain unique items.`,
        );
      }
      if (schema.items !== undefined) {
        for (const [index, entry] of value.entries()) {
          validateSchemaProperty(entry, schema.items, `${field}[${index}]`);
        }
      }
      return;
    default:
      return;
  }
}

function verifyCheckoutUnchanged(repositoryPath: string, initialSnapshot: CheckoutSnapshot): void {
  const finalCommitSha = runGitText(repositoryPath, ['rev-parse', 'HEAD'], 'BETTING_WIN_COMMIT_SHA_UNAVAILABLE').trim();
  const finalGitTreeSha = runGitText(repositoryPath, ['rev-parse', 'HEAD^{tree}'], 'BETTING_WIN_TREE_SHA_UNAVAILABLE').trim();
  const finalWorktreeStatus = runGitText(
    repositoryPath,
    ['status', '--porcelain', '--untracked-files=all'],
    'BETTING_WIN_GIT_STATUS_UNAVAILABLE',
  );
  const finalTrackedTreeListingSha256 = sha256Hex(
    runGitBuffer(repositoryPath, ['ls-tree', '-r', '--full-tree', 'HEAD'], 'BETTING_WIN_TRACKED_TREE_LISTING_UNAVAILABLE'),
  );
  if (
    finalCommitSha !== initialSnapshot.commitSha
    || finalGitTreeSha !== initialSnapshot.gitTreeSha
    || finalWorktreeStatus !== initialSnapshot.worktreeStatus
    || finalTrackedTreeListingSha256 !== initialSnapshot.trackedTreeListingSha256
  ) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_CHECKOUT_CHANGED_DURING_VERIFICATION',
      'betting-win checkout changed while the upstream lock was being verified.',
    );
  }
}

function parseJsonFile(path: string, errorCode: string): Record<string, unknown> {
  const text = readRequiredText(path, errorCode);
  try {
    const value = JSON.parse(text);
    if (!isRecord(value)) {
      throw new UpstreamVerificationError(errorCode, `JSON file must contain an object: ${path}`);
    }
    return value;
  } catch (error) {
    if (error instanceof UpstreamVerificationError) {
      throw error;
    }
    throw new UpstreamVerificationError(errorCode, `Invalid JSON in ${path}: ${(error as Error).message}`);
  }
}

function readRequiredText(path: string, errorCode: string): string {
  if (!existsSync(path)) {
    throw new UpstreamVerificationError(errorCode, `Required file is missing: ${path}`);
  }
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    throw new UpstreamVerificationError(errorCode, `Required file is unreadable: ${path}. ${fsErrorMessage(error)}`);
  }
}

function normalizeVerifiedAt(value: string | undefined): string {
  const verifiedAt = value ?? new Date().toISOString();
  if (!ISO_8601_UTC_MILLISECONDS.test(verifiedAt)) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_VERIFIED_AT_INVALID',
      'verifiedAt must be an ISO-8601 UTC timestamp.',
    );
  }
  return verifiedAt;
}

function runGitText(repositoryPath: string, args: readonly string[], errorCode: string): string {
  return runGit(repositoryPath, args, errorCode, 'utf-8') as string;
}

function runGitBuffer(repositoryPath: string, args: readonly string[], errorCode: string): Buffer {
  return runGit(repositoryPath, args, errorCode, 'buffer') as Buffer;
}

function runGit(
  repositoryPath: string,
  args: readonly string[],
  errorCode: string,
  encoding: BufferEncoding | 'buffer',
): string | Buffer {
  try {
    return execFileSync('git', ['-C', repositoryPath, ...args], {
      encoding,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new UpstreamVerificationError(errorCode, `git ${args.join(' ')} failed for ${repositoryPath}: ${message}`);
  }
}

function requireLockRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new UpstreamVerificationError(
      'BETTING_WIN_UPSTREAM_LOCK_INVALID',
      'betting-win upstream lock must be a JSON object.',
    );
  }
  return value;
}

function requireLockObject(value: unknown): BettingWinUpstreamLock {
  return requireLockRecord(value) as unknown as BettingWinUpstreamLock;
}

function requireString(value: unknown, errorCode: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new UpstreamVerificationError(errorCode, 'Expected a non-empty string.');
  }
  return value;
}

function sha256Hex(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isWithinBoundary(path: string, boundaryRoot: string): boolean {
  const relativePath = relative(boundaryRoot, path);
  return relativePath.length > 0 && relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !relativePath.includes(`..${sep}`);
}

function sortObject(value: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function schemaTypeError(field: string, type: string): UpstreamVerificationError {
  return new UpstreamVerificationError(
    'BETTING_WIN_UPSTREAM_LOCK_SCHEMA_MISMATCH',
    `betting-win upstream lock field ${field} must be a ${type}.`,
  );
}

function fsErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
