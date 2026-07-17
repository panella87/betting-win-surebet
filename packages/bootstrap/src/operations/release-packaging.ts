import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  accessSync,
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  statfsSync,
  writeFileSync,
  constants as fsConstants,
  type Stats,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  loadSurebetMigrationFiles,
  sha256Hex,
  stableJsonStringify,
  type SurebetMigrationFile,
} from '../../../persistence/src/index.js';
import {
  readBettingWinUpstreamLock,
  type BettingWinUpstreamLock,
} from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import {
  registerBwsEvidenceArtifact,
  type BwsEvidenceIndexEntry,
} from './observability.js';

const RELEASE_MANIFEST_SCHEMA = 'bws.release_manifest.v1';
const RELEASE_PACKAGE_RESULT_SCHEMA = 'bws.release_package_result.v1';
const RELEASE_PREFLIGHT_SCHEMA = 'bws.release_preflight.v1';
const RELEASE_VERIFICATION_SCHEMA = 'bws.release_install_verification.v1';
const SOURCE_MANIFEST_SCHEMA = 'betting-win-surebet-source-manifest-v1';
const COCKPIT_BUILD_METADATA_SCHEMA = 'bws.operator_cockpit_build.v1';
const RELEASE_MANIFEST_FILE = 'release-manifest.json';
const RELEASE_CHECKSUMS_FILE = 'SHA256SUMS';
const RELEASE_PACKAGE_RESULT_FILE = 'release-package-result.json';
const RELEASE_VERIFICATION_RESULT_FILE = 'install-verification.json';
const UPSTREAM_LOCK_RELEASE_PATH = 'config/betting-win.upstream.lock.json';
const SOURCE_MANIFEST_PATH = 'SOURCE_MANIFEST.json';
const PACKAGE_JSON_PATH = 'package.json';
const PACKAGE_LOCK_PATH = 'package-lock.json';
const RELEASE_ENV_TEMPLATE_PATH = 'config/bws.private.env.template';
const SYSTEMD_TEMPLATE_PATH = 'deployment/systemd-user/bws-operator.service.template';
const DIST_PACKAGES_ROOT = 'dist/packages';
const DIST_COCKPIT_ROOT = 'dist/apps/web';
const COCKPIT_BUILD_METADATA_FILE = 'dist/apps/web/bws-cockpit-build.json';
const NODE_MAJOR_REQUIREMENT = 20;
const POSTGRESQL_MINIMUM_CLIENT_MAJOR = 14;
const POSTGRESQL_MINIMUM_SERVER_VERSION_NUM = 140000;
const LOOPBACK_HOST = '127.0.0.1';
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;
const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const FORBIDDEN_TEMPLATE_COMMANDS = Object.freeze([
  'sudo',
  'systemctl enable',
  'systemctl disable',
  'pkill',
  'killall',
  'nohup',
  'daemonize',
]);
const FORBIDDEN_SOURCE_ROOTS = new Set([
  '.git',
  '.locks',
  'artifacts',
  'backups',
  'coverage',
  'dist',
  'logs',
  'node_modules',
  'output',
  'runtime',
  'tmp',
  '.tmp',
]);
const FORBIDDEN_EXTRACTED_RELEASE_ROOTS = new Set([
  '.git',
  '.locks',
  'artifacts',
  'backups',
  'coverage',
  'logs',
  'node_modules',
  'output',
  'runtime',
  'tmp',
  '.tmp',
]);
const FORBIDDEN_EXACT_PATHS = new Set([
  '.env',
  'artifacts.zip',
  'credentials.json',
  'secrets.json',
  'id_rsa',
  'id_ed25519',
]);
const FORBIDDEN_SUFFIXES = Object.freeze([
  '.db',
  '.dump',
  '.log',
  '.pid',
  '.sqlite',
  '.sqlite3',
  '.stderr',
  '.stderr.log',
  '.stderr.txt',
  '.stdout',
  '.stdout.log',
  '.stdout.txt',
  '.tar',
  '.tar.gz',
  '.tgz',
  '.tmp',
  '.zip',
]);
const COMMON_ENVIRONMENT_KEYS = Object.freeze([
  'BETTING_WIN_REPO_PATH',
  'BWS_UPSTREAM_LOCK_PATH',
  'BWS_UPSTREAM_MODE',
  'BWS_API_PORT',
  'BWS_WORKER_ID',
  'BWS_WORKER_QUEUE_NAME',
  'BWS_WORKER_LEASE_DURATION_MS',
  'BWS_UPSTREAM_CONVERGENCE_INTERVAL_MS',
  'BWS_UPSTREAM_CONVERGENCE_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_CONVERGENCE_MAX_BACKOFF_MS',
  'BWS_UPSTREAM_CONVERGENCE_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_INTERVAL_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_RETRY_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_MAX_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_SCHEDULER_MAX_QUEUE_DEPTH',
  'BWS_PRIVATE_PAPER_WORKER_INTERVAL_MS',
  'BWS_PRIVATE_PAPER_WORKER_RETRY_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_WORKER_MAX_BACKOFF_MS',
  'BWS_PRIVATE_PAPER_WORKER_PASS_TIMEOUT_MS',
  'BWS_PRIVATE_PAPER_WORKER_MAX_JOBS_PER_PASS',
  'SUREBET_RUNTIME_MODE',
  'SUREBET_PROVIDER_CONNECTIONS',
  'SUREBET_EXECUTION_ENABLED',
  'SUREBET_PG_DATABASE',
  'SUREBET_PG_USER',
  'SUREBET_PG_PORT',
]);
const EXPORT_MODE_KEYS = Object.freeze([
  'BWS_UPSTREAM_EXPORT_SELECTION_PATH',
]);
const API_MODE_KEYS = Object.freeze([
  'BWS_UPSTREAM_API_CHECKPOINT_ID',
  'BWS_UPSTREAM_API_BASE_URL',
  'BWS_UPSTREAM_API_CONTRACT_VERSION',
  'BWS_UPSTREAM_API_PAGE_SIZE',
  'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE',
  'BWS_UPSTREAM_API_RETRY_LIMIT',
  'BWS_UPSTREAM_API_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_API_TIMEOUT_MS',
]);
const SENSITIVE_KEY_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;

type CommandRunner = (
  command: string,
  args: readonly string[],
  options?: Readonly<{
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
  }>,
) => string;

interface SourceManifestEntry {
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
}

interface SourceManifestDocument {
  readonly files: readonly SourceManifestEntry[];
  readonly generated: string;
  readonly overlay: string;
  readonly schema: typeof SOURCE_MANIFEST_SCHEMA;
}

interface ReleaseFileEntry {
  readonly mode: string;
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
}

interface ReleasePackageJson {
  readonly engines?: Readonly<{
    readonly node?: unknown;
  }>;
  readonly version?: unknown;
}

interface CockpitBuildMetadata {
  readonly apiBaseUrl: string;
  readonly dataMode: 'api';
  readonly schema: typeof COCKPIT_BUILD_METADATA_SCHEMA;
}

interface ReleaseContentDescriptor {
  readonly archive: Readonly<{
    readonly fileName: string;
    readonly payloadFileCount: number;
    readonly payloadFiles: readonly ReleaseFileEntry[];
    readonly payloadFingerprintSha256: string;
    readonly rootDirectory: string;
  }>;
  readonly builtRuntime: Readonly<{
    readonly files: readonly ReleaseFileEntry[];
    readonly rootDirectory: typeof DIST_PACKAGES_ROOT;
  }>;
  readonly cockpit: Readonly<{
    readonly apiBaseUrl: string;
    readonly assetFingerprint: string;
    readonly buildDirectory: typeof DIST_COCKPIT_ROOT;
    readonly dataMode: 'api';
    readonly files: readonly ReleaseFileEntry[];
    readonly metadataFile: typeof COCKPIT_BUILD_METADATA_FILE;
  }>;
  readonly executables: readonly ReleaseFileEntry[];
  readonly migrationInventory: readonly Readonly<{
    readonly migrationName: string;
    readonly path: string;
    readonly sha256: string;
  }>[];
  readonly packageLock: Readonly<{
    readonly path: typeof PACKAGE_LOCK_PATH;
    readonly sha256: string;
  }>;
  readonly packageVersion: string;
  readonly policy: Readonly<{
    readonly automaticFallback: 'forbidden';
    readonly executionEnabled: false;
    readonly listenerExposure: 'loopback_only';
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
  }>;
  readonly postgresqlRequirement: Readonly<{
    readonly minimumClientMajor: number;
    readonly minimumServerVersionNum: number;
  }>;
  readonly source: Readonly<{
    readonly files: readonly ReleaseFileEntry[];
    readonly sourceManifestGeneratedAt: string;
    readonly sourceManifestPath: typeof SOURCE_MANIFEST_PATH;
    readonly sourceManifestSha256: string;
    readonly sourceTreeFingerprint: string;
  }>;
  readonly templates: Readonly<{
    readonly environmentTemplatePath: typeof RELEASE_ENV_TEMPLATE_PATH;
    readonly systemdUserTemplates: readonly ReleaseFileEntry[];
  }>;
  readonly upstreamLock: Readonly<{
    readonly commitSha: string;
    readonly fingerprintSha256: string;
    readonly gitTreeSha: string;
    readonly path: typeof UPSTREAM_LOCK_RELEASE_PATH;
    readonly repositoryPath: string;
    readonly trackedTreeListingSha256: string;
  }>;
}

export interface BwsReleaseManifest extends ReleaseContentDescriptor {
  readonly createdAt: string;
  readonly releaseId: string;
  readonly schema: typeof RELEASE_MANIFEST_SCHEMA;
  readonly semanticFingerprint: string;
}

export interface CreateBwsReleasePackageRequest {
  readonly allowOverwrite?: boolean;
  readonly now?: () => string;
  readonly outputDirectory: string;
  readonly repositoryRoot?: string;
  readonly runCommand?: CommandRunner;
}

export interface BwsReleasePackageResult {
  readonly archiveFile: string;
  readonly archiveFileSha256: string;
  readonly archiveSha256File: string;
  readonly createdAt: string;
  readonly evidenceEntries: readonly BwsEvidenceIndexEntry[];
  readonly manifest: BwsReleaseManifest;
  readonly manifestFile: string;
  readonly manifestSha256: string;
  readonly releaseDirectory: string;
  readonly resultFile: string;
  readonly schema: typeof RELEASE_PACKAGE_RESULT_SCHEMA;
  readonly semanticFingerprint: string;
}

export interface BwsReleasePreflightResult {
  readonly configurationPresence: Readonly<Record<string, boolean>>;
  readonly createdAt: string;
  readonly node: Readonly<{
    readonly actualVersion: string;
    readonly compatible: boolean;
    readonly requiredMajor: number;
  }>;
  readonly npm: Readonly<{
    readonly actualVersion: string;
    readonly available: true;
  }>;
  readonly paths: Readonly<{
    readonly envFile: string;
    readonly releaseDirectory: string;
    readonly releaseDirectoryWritable: boolean;
    readonly scratchDirectory: string;
    readonly scratchDirectoryWritable: boolean;
  }>;
  readonly policy: Readonly<{
    readonly apiPortMatchesCockpitBuild: boolean;
    readonly cockpitApiBaseUrl: string;
    readonly cockpitDataMode: 'api';
    readonly executionEnabled: false;
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
    readonly selectedMode: 'api' | 'export';
  }>;
  readonly postgresql: Readonly<{
    readonly actualClientVersion: string;
    readonly clientCompatible: boolean;
    readonly minimumClientMajor: number;
    readonly minimumServerVersionNum: number;
    readonly serverCompatibilityCheck: 'not_performed_in_check_only_mode';
  }>;
  readonly schema: typeof RELEASE_PREFLIGHT_SCHEMA;
  readonly storage: Readonly<{
    readonly availableBytes: number;
    readonly requiredBytes: number;
    readonly sufficient: boolean;
  }>;
}

export interface VerifyBwsReleaseInstallationRequest {
  readonly archivePath?: string;
  readonly envFile: string;
  readonly now?: () => string;
  readonly releaseDirectory: string;
  readonly runCommand?: CommandRunner;
  readonly scratchDirectory: string;
}

export interface BwsReleaseInstallVerificationResult {
  readonly archiveCheck: Readonly<{
    readonly actualArchiveSha256?: string;
    readonly archiveEntryCount?: number;
    readonly expectedArchiveSha256FilePresent: boolean;
    readonly verified: boolean;
  }>;
  readonly createdAt: string;
  readonly manifestFile: string;
  readonly preflight: BwsReleasePreflightResult;
  readonly renderedSystemdTemplateFile: string;
  readonly resultFile: string;
  readonly schema: typeof RELEASE_VERIFICATION_SCHEMA;
  readonly semanticFingerprint: string;
  readonly verifiedChecks: readonly string[];
}

export async function createBwsReleasePackage(
  request: CreateBwsReleasePackageRequest,
): Promise<BwsReleasePackageResult> {
  const repositoryRoot = request.repositoryRoot === undefined ? process.cwd() : resolve(request.repositoryRoot);
  const outputDirectory = resolve(request.outputDirectory);
  const now = request.now === undefined ? defaultNow : request.now;
  const runCommand = request.runCommand === undefined ? runCommandSync : request.runCommand;
  const createdAt = requireIsoTimestamp(now(), 'createdAt');
  const allowOverwrite = request.allowOverwrite === true;

  mkdirSync(outputDirectory, { recursive: true });
  const sourceManifest = readSourceManifest(repositoryRoot);
  const sourceManifestContents = readRequiredFile(repositoryRoot, SOURCE_MANIFEST_PATH);
  const sourceManifestSha256 = sha256Hex(sourceManifestContents);
  const packageJson = readPackageJson(repositoryRoot);
  const packageVersion = requireNonEmptyString(packageJson.version, 'package.json version');
  const nodeEngineRange = requireNonEmptyString(
    packageJson.engines === undefined ? undefined : packageJson.engines.node,
    'package.json engines.node',
  );
  assertNodeEngineRange(nodeEngineRange);
  const upstreamLock = readBettingWinUpstreamLock(join(repositoryRoot, UPSTREAM_LOCK_RELEASE_PATH), repositoryRoot);
  const requiredExecutablePaths = await loadRequiredExecutablePaths(repositoryRoot);
  const sourceFiles = collectReleaseSourceFiles(repositoryRoot, sourceManifest);
  const builtRuntimeFiles = collectDirectoryInventory(repositoryRoot, DIST_PACKAGES_ROOT);
  const cockpitFiles = collectDirectoryInventory(repositoryRoot, DIST_COCKPIT_ROOT);
  const cockpitMetadata = readCockpitBuildMetadata(repositoryRoot);
  const migrationInventory = collectMigrationInventory(repositoryRoot);
  const executableFiles = collectRequiredExecutables(repositoryRoot, requiredExecutablePaths);
  const templateFiles = collectNamedFiles(repositoryRoot, [SYSTEMD_TEMPLATE_PATH]);
  const payloadFiles = mergeFileInventories(
    sourceFiles,
    builtRuntimeFiles,
    cockpitFiles,
    collectNamedFiles(repositoryRoot, [UPSTREAM_LOCK_RELEASE_PATH]),
  );
  const sourceTreeFingerprint = stableObjectFingerprint(
    stableJsonStringify(
      sourceFiles.map((entry) => ({
        path: entry.path,
        sha256: entry.sha256,
        size: entry.size,
      })),
    ),
  );
  const archivePayloadFingerprint = stableObjectFingerprint(
    stableJsonStringify(
      payloadFiles.map((entry) => ({
        mode: entry.mode,
        path: entry.path,
        sha256: entry.sha256,
        size: entry.size,
      })),
    ),
  );
  const contentDescriptor: ReleaseContentDescriptor = Object.freeze({
    archive: Object.freeze({
      fileName: '',
      payloadFileCount: payloadFiles.length,
      payloadFiles,
      payloadFingerprintSha256: archivePayloadFingerprint,
      rootDirectory: '',
    }),
    builtRuntime: Object.freeze({
      files: builtRuntimeFiles,
      rootDirectory: DIST_PACKAGES_ROOT,
    }),
    cockpit: Object.freeze({
      apiBaseUrl: cockpitMetadata.apiBaseUrl,
      assetFingerprint: stableObjectFingerprint(
        stableJsonStringify(
          cockpitFiles.map((entry) => ({
            path: entry.path,
            sha256: entry.sha256,
            size: entry.size,
          })),
        ),
      ),
      buildDirectory: DIST_COCKPIT_ROOT,
      dataMode: cockpitMetadata.dataMode,
      files: cockpitFiles,
      metadataFile: COCKPIT_BUILD_METADATA_FILE,
    }),
    executables: executableFiles,
    migrationInventory,
    packageLock: Object.freeze({
      path: PACKAGE_LOCK_PATH,
      sha256: sha256Hex(readRequiredFile(repositoryRoot, PACKAGE_LOCK_PATH)),
    }),
    packageVersion,
    policy: Object.freeze({
      automaticFallback: 'forbidden',
      executionEnabled: false,
      listenerExposure: 'loopback_only',
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    }),
    postgresqlRequirement: Object.freeze({
      minimumClientMajor: POSTGRESQL_MINIMUM_CLIENT_MAJOR,
      minimumServerVersionNum: POSTGRESQL_MINIMUM_SERVER_VERSION_NUM,
    }),
    source: Object.freeze({
      files: sourceFiles,
      sourceManifestGeneratedAt: sourceManifest.generated,
      sourceManifestPath: SOURCE_MANIFEST_PATH,
      sourceManifestSha256,
      sourceTreeFingerprint,
    }),
    templates: Object.freeze({
      environmentTemplatePath: RELEASE_ENV_TEMPLATE_PATH,
      systemdUserTemplates: templateFiles,
    }),
    upstreamLock: Object.freeze({
      commitSha: upstreamLock.commitSha,
      fingerprintSha256: hashUpstreamLockFingerprint(upstreamLock),
      gitTreeSha: upstreamLock.gitTreeSha,
      path: UPSTREAM_LOCK_RELEASE_PATH,
      repositoryPath: upstreamLock.repositoryPath,
      trackedTreeListingSha256: upstreamLock.trackedTreeListingSha256,
    }),
  });
  const semanticFingerprint = stableObjectFingerprint(toSemanticFingerprintDescriptor(contentDescriptor));
  const releaseId = `bws-release-${sanitizeReleaseToken(packageVersion)}-${semanticFingerprint.slice(0, 12)}`;
  const finalReleaseDirectory = join(outputDirectory, releaseId);
  const finalArchiveFile = join(outputDirectory, `${releaseId}.tar.gz`);
  const finalArchiveSha256File = join(outputDirectory, `${releaseId}.tar.gz.sha256`);
  const finalResultFile = join(outputDirectory, `${releaseId}.${RELEASE_PACKAGE_RESULT_FILE}`);

  assertOutputTargetsAvailable(
    [finalReleaseDirectory, finalArchiveFile, finalArchiveSha256File, finalResultFile],
    allowOverwrite,
  );

  const manifest: BwsReleaseManifest = Object.freeze({
    ...contentDescriptor,
    archive: Object.freeze({
      ...contentDescriptor.archive,
      fileName: basename(finalArchiveFile),
      rootDirectory: releaseId,
    }),
    createdAt,
    releaseId,
    schema: RELEASE_MANIFEST_SCHEMA,
    semanticFingerprint,
  });
  validateReleaseManifest(manifest);

  const stagingParent = mkdtempSync(join(outputDirectory, '.bws-release-staging-'));
  const stagingReleaseDirectory = join(stagingParent, releaseId);
  const stagingArchiveFile = join(outputDirectory, `.bws-release-archive-${randomUUID()}.tar.gz`);
  const stagingArchiveSha256File = join(outputDirectory, `.bws-release-archive-${randomUUID()}.sha256`);
  const stagingResultFile = join(outputDirectory, `.bws-release-result-${randomUUID()}.json`);

  try {
    mkdirSync(stagingReleaseDirectory, { recursive: true });
    copyPayloadFiles(repositoryRoot, stagingReleaseDirectory, payloadFiles);
    const manifestFile = join(stagingReleaseDirectory, RELEASE_MANIFEST_FILE);
    writeJsonFile(manifestFile, manifest);
    writeChecksumsFile(stagingReleaseDirectory);
    createDeterministicArchive(stagingParent, releaseId, stagingArchiveFile, runCommand);
    const archiveFileSha256 = fileSha256(stagingArchiveFile);
    writeFileSync(stagingArchiveSha256File, `${archiveFileSha256}  ${basename(finalArchiveFile)}\n`, 'utf-8');
    const manifestSha256 = fileSha256(manifestFile);
    const result = Object.freeze({
      archiveFile: finalArchiveFile,
      archiveFileSha256,
      archiveSha256File: finalArchiveSha256File,
      createdAt,
      evidenceEntries: Object.freeze([] as BwsEvidenceIndexEntry[]),
      manifest,
      manifestFile: join(finalReleaseDirectory, RELEASE_MANIFEST_FILE),
      manifestSha256,
      releaseDirectory: finalReleaseDirectory,
      resultFile: finalResultFile,
      schema: RELEASE_PACKAGE_RESULT_SCHEMA,
      semanticFingerprint,
    });
    writeJsonFile(stagingResultFile, result);
    commitOutputTarget(stagingReleaseDirectory, finalReleaseDirectory, allowOverwrite);
    commitOutputTarget(stagingArchiveFile, finalArchiveFile, allowOverwrite);
    commitOutputTarget(stagingArchiveSha256File, finalArchiveSha256File, allowOverwrite);
    commitOutputTarget(stagingResultFile, finalResultFile, allowOverwrite);
    const publishedEvidenceEntries = registerReleaseEvidence(repositoryRoot, releaseId, semanticFingerprint, [
      join(finalReleaseDirectory, RELEASE_MANIFEST_FILE),
      finalArchiveSha256File,
    ]);
    const finalizedResult: BwsReleasePackageResult = Object.freeze({
      ...result,
      evidenceEntries: publishedEvidenceEntries,
    });
    writeJsonFile(finalResultFile, finalizedResult);
    const finalResultEvidenceEntries = registerReleaseEvidence(repositoryRoot, releaseId, semanticFingerprint, [
      finalResultFile,
    ]);
    const finalizedResultWithSelfEvidence: BwsReleasePackageResult = Object.freeze({
      ...finalizedResult,
      evidenceEntries: Object.freeze([
        ...publishedEvidenceEntries,
        ...finalResultEvidenceEntries,
      ]),
    });
    writeJsonFile(finalResultFile, finalizedResultWithSelfEvidence);
    return finalizedResultWithSelfEvidence;
  } finally {
    if (existsSync(stagingParent)) {
      rmSync(stagingParent, { force: true, recursive: true });
    }
    if (existsSync(stagingArchiveFile)) {
      rmSync(stagingArchiveFile, { force: true });
    }
    if (existsSync(stagingArchiveSha256File)) {
      rmSync(stagingArchiveSha256File, { force: true });
    }
    if (existsSync(stagingResultFile)) {
      rmSync(stagingResultFile, { force: true });
    }
  }
}

export async function verifyBwsReleaseInstallation(
  request: VerifyBwsReleaseInstallationRequest,
): Promise<BwsReleaseInstallVerificationResult> {
  const releaseDirectory = resolve(request.releaseDirectory);
  const runCommand = request.runCommand === undefined ? runCommandSync : request.runCommand;
  const now = request.now === undefined ? defaultNow : request.now;
  const createdAt = requireIsoTimestamp(now(), 'createdAt');
  const envFile = resolve(request.envFile);
  const scratchDirectory = resolve(request.scratchDirectory);
  mkdirSync(scratchDirectory, { recursive: true });
  ensureDirectoryWritable(scratchDirectory, 'scratchDirectory');

  const manifest = readReleaseManifest(releaseDirectory);
  const manifestFile = join(releaseDirectory, RELEASE_MANIFEST_FILE);
  const manifestSha256 = fileSha256(manifestFile);
  if (
    manifest.semanticFingerprint !== stableObjectFingerprint(
      toSemanticFingerprintDescriptor(toReleaseContentDescriptor(manifest)),
    )
  ) {
    throw new Error('Release manifest semanticFingerprint does not match the deterministic release content descriptor.');
  }
  verifyChecksumsFile(releaseDirectory);
  verifyManifestAgainstReleaseDirectory(releaseDirectory, manifest);
  const renderedSystemdTemplateFile = renderSystemdTemplate({
    envFile,
    releaseDirectory,
    scratchDirectory,
  });
  const preflight = runBwsReleasePreflight({
    envFile,
    releaseDirectory,
    requiredBytes: calculateRequiredScratchBytes(manifest),
    runCommand,
    scratchDirectory,
  });
  const archiveCheck = verifyArchiveIfPresent(manifest, releaseDirectory, request.archivePath, runCommand);
  const verifiedChecks = Object.freeze([
    'release_manifest_schema_valid',
    'semantic_fingerprint_matches_content',
    'payload_checksums_match_sha256sums',
    'source_manifest_matches_release_manifest',
    'package_lock_matches_release_manifest',
    'upstream_lock_matches_release_manifest',
    'built_runtime_inventory_matches_release_manifest',
    'cockpit_inventory_matches_release_manifest',
    'migration_inventory_matches_release_manifest',
    'required_executable_modes_match_release_manifest',
    'forbidden_paths_absent_from_release_directory',
    'private_policy_markers_remain_closed',
    'systemd_template_renders_without_forbidden_commands',
    'non_mutating_preflight_passed',
    ...(archiveCheck.verified ? ['archive_checksum_and_inventory_verified'] : []),
  ]);
  const resultFile = join(scratchDirectory, RELEASE_VERIFICATION_RESULT_FILE);
  const result: BwsReleaseInstallVerificationResult = Object.freeze({
    archiveCheck,
    createdAt,
    manifestFile,
    preflight,
    renderedSystemdTemplateFile,
    resultFile,
    schema: RELEASE_VERIFICATION_SCHEMA,
    semanticFingerprint: manifest.semanticFingerprint,
    verifiedChecks,
  });
  writeJsonFile(resultFile, result);
  registerReleaseEvidence(releaseDirectory, manifest.releaseId, manifest.semanticFingerprint, [resultFile]);
  void manifestSha256;
  return result;
}

export function runBwsReleasePreflight(request: Readonly<{
  readonly envFile: string;
  readonly releaseDirectory: string;
  readonly requiredBytes: number;
  readonly runCommand?: CommandRunner;
  readonly scratchDirectory: string;
}>): BwsReleasePreflightResult {
  const releaseDirectory = resolve(request.releaseDirectory);
  const envFile = resolve(request.envFile);
  const scratchDirectory = resolve(request.scratchDirectory);
  const runCommand = request.runCommand === undefined ? runCommandSync : request.runCommand;
  const manifest = readReleaseManifest(releaseDirectory);
  const environment = readStrictEnvironmentFile(envFile);
  const nodeVersion = runCommand('node', ['--version']).trim();
  const npmVersion = runCommand('npm', ['--version']).trim();
  const psqlVersion = runCommand('psql', ['--version']).trim();
  const nodeMajor = parseNodeMajor(nodeVersion);
  const psqlMajor = parsePostgreSqlMajor(psqlVersion);
  const selectedMode = requireSelectedMode(environment);
  const configurationPresence = buildConfigurationPresence(environment, selectedMode);
  validateEnvironmentPresence(configurationPresence);
  validateClosedPolicy(environment);
  validateUpstreamLockPath(environment, releaseDirectory);
  validateCockpitBinding(environment, manifest);
  ensureDirectoryWritable(scratchDirectory, 'scratchDirectory');
  ensureDirectoryWritable(releaseDirectory, 'releaseDirectory');
  const storage = inspectStorage(releaseDirectory, request.requiredBytes);
  if (!storage.sufficient) {
    throw new Error(
      `Release preflight requires at least ${request.requiredBytes} free bytes. Found ${storage.availableBytes}.`,
    );
  }
  return Object.freeze({
    configurationPresence,
    createdAt: defaultNow(),
    node: Object.freeze({
      actualVersion: nodeVersion,
      compatible: nodeMajor === NODE_MAJOR_REQUIREMENT,
      requiredMajor: NODE_MAJOR_REQUIREMENT,
    }),
    npm: Object.freeze({
      actualVersion: npmVersion,
      available: true,
    }),
    paths: Object.freeze({
      envFile,
      releaseDirectory,
      releaseDirectoryWritable: true,
      scratchDirectory,
      scratchDirectoryWritable: true,
    }),
    policy: Object.freeze({
      apiPortMatchesCockpitBuild: true,
      cockpitApiBaseUrl: manifest.cockpit.apiBaseUrl,
      cockpitDataMode: manifest.cockpit.dataMode,
      executionEnabled: false,
      providerConnections: 'disabled',
      runtimeMode: 'paper',
      selectedMode,
    }),
    postgresql: Object.freeze({
      actualClientVersion: psqlVersion,
      clientCompatible: psqlMajor >= manifest.postgresqlRequirement.minimumClientMajor,
      minimumClientMajor: manifest.postgresqlRequirement.minimumClientMajor,
      minimumServerVersionNum: manifest.postgresqlRequirement.minimumServerVersionNum,
      serverCompatibilityCheck: 'not_performed_in_check_only_mode',
    }),
    schema: RELEASE_PREFLIGHT_SCHEMA,
    storage,
  });
}

function registerReleaseEvidence(
  repositoryRoot: string,
  runtimeId: string,
  sourceFingerprint: string,
  artifactPaths: readonly string[],
): readonly BwsEvidenceIndexEntry[] {
  if (!isWithinResolved(repositoryRoot, repositoryRoot)) {
    return Object.freeze([] as BwsEvidenceIndexEntry[]);
  }
  const entries: BwsEvidenceIndexEntry[] = [];
  for (const artifactPath of artifactPaths) {
    if (!isWithinResolved(repositoryRoot, artifactPath)) {
      continue;
    }
    entries.push(
      registerBwsEvidenceArtifact({
        artifactPath,
        artifactSchema: artifactPath.endsWith('.sha256')
          ? 'bws.release_archive_checksum.v1'
          : artifactPath.endsWith(RELEASE_MANIFEST_FILE)
            ? RELEASE_MANIFEST_SCHEMA
            : artifactPath.endsWith(RELEASE_PACKAGE_RESULT_FILE)
              ? RELEASE_PACKAGE_RESULT_SCHEMA
              : RELEASE_VERIFICATION_SCHEMA,
        createdAt: defaultNow(),
        repositoryRoot,
        retentionClass: 'release',
        runtimeId,
        sourceFingerprint,
      }),
    );
  }
  return Object.freeze(entries);
}

function verifyArchiveIfPresent(
  manifest: BwsReleaseManifest,
  releaseDirectory: string,
  archivePath: string | undefined,
  runCommand: CommandRunner,
): BwsReleaseInstallVerificationResult['archiveCheck'] {
  if (archivePath === undefined) {
    return Object.freeze({
      expectedArchiveSha256FilePresent: false,
      verified: false,
    });
  }
  const resolvedArchivePath = resolve(archivePath);
  const archiveSha256File = `${resolvedArchivePath}.sha256`;
  if (!existsSync(resolvedArchivePath) || !statSync(resolvedArchivePath).isFile()) {
    throw new Error(`Release archive does not exist: ${resolvedArchivePath}`);
  }
  if (!existsSync(archiveSha256File) || !statSync(archiveSha256File).isFile()) {
    throw new Error(`Release archive checksum file does not exist: ${archiveSha256File}`);
  }
  const actualArchiveSha256 = fileSha256(resolvedArchivePath);
  const expectedArchiveSha256 = readArchiveChecksumFile(archiveSha256File, basename(resolvedArchivePath));
  if (actualArchiveSha256 !== expectedArchiveSha256) {
    throw new Error('Release archive checksum does not match the published .sha256 file.');
  }
  const archiveEntries = [...listArchiveEntries(resolvedArchivePath, runCommand)].sort(compareStringsLexicographically);
  const releaseFiles = listRelativeFiles(releaseDirectory)
    .map((entry) => `${manifest.releaseId}/${entry}`)
    .sort(compareStringsLexicographically);
  if (archiveEntries.length !== releaseFiles.length) {
    throw new Error('Release archive entry count does not match the extracted release directory.');
  }
  for (let index = 0; index < archiveEntries.length; index += 1) {
    if (archiveEntries[index] !== releaseFiles[index]) {
      throw new Error('Release archive inventory does not match the extracted release directory.');
    }
  }
  return Object.freeze({
    actualArchiveSha256,
    archiveEntryCount: archiveEntries.length,
    expectedArchiveSha256FilePresent: true,
    verified: true,
  });
}

function renderSystemdTemplate(request: Readonly<{
  readonly envFile: string;
  readonly releaseDirectory: string;
  readonly scratchDirectory: string;
}>): string {
  const rawTemplate = readRequiredFile(request.releaseDirectory, SYSTEMD_TEMPLATE_PATH);
  for (const forbidden of FORBIDDEN_TEMPLATE_COMMANDS) {
    if (rawTemplate.includes(forbidden)) {
      throw new Error(`Systemd user template contains a forbidden command: ${forbidden}`);
    }
  }
  const rendered = rawTemplate
    .replaceAll('__BWS_RELEASE_DIR__', request.releaseDirectory)
    .replaceAll('__BWS_ENV_FILE__', request.envFile);
  if (rendered.includes('__BWS_RELEASE_DIR__') || rendered.includes('__BWS_ENV_FILE__')) {
    throw new Error('Systemd user template placeholders were not rendered completely.');
  }
  const renderedDirectory = join(request.scratchDirectory, 'rendered-systemd-user');
  mkdirSync(renderedDirectory, { recursive: true });
  const renderedFile = join(renderedDirectory, 'bws-operator.service');
  writeFileSync(renderedFile, rendered, 'utf-8');
  if (!rendered.includes('/dist/packages/bootstrap/src/cli/bws-operator-lifecycle.js start')) {
    throw new Error('Rendered systemd user template must call the exact product-owned lifecycle start surface.');
  }
  if (!rendered.includes('/dist/packages/bootstrap/src/cli/bws-operator-lifecycle.js stop')) {
    throw new Error('Rendered systemd user template must call the exact product-owned lifecycle stop surface.');
  }
  if (!rendered.includes('EnvironmentFile=')) {
    throw new Error('Rendered systemd user template must reference an operator-owned EnvironmentFile path.');
  }
  return renderedFile;
}

function verifyManifestAgainstReleaseDirectory(releaseDirectory: string, manifest: BwsReleaseManifest): void {
  verifyInventoryMatchesRelease(releaseDirectory, manifest.source.files);
  verifyInventoryMatchesRelease(releaseDirectory, manifest.builtRuntime.files);
  verifyInventoryMatchesRelease(releaseDirectory, manifest.cockpit.files);
  verifyInventoryMatchesRelease(releaseDirectory, manifest.executables);
  verifyInventoryMatchesRelease(releaseDirectory, manifest.templates.systemdUserTemplates);

  const sourceManifestContents = readRequiredFile(releaseDirectory, SOURCE_MANIFEST_PATH);
  if (sha256Hex(sourceManifestContents) !== manifest.source.sourceManifestSha256) {
    throw new Error('Release source manifest checksum does not match the release manifest.');
  }
  const packageLockContents = readRequiredFile(releaseDirectory, PACKAGE_LOCK_PATH);
  if (sha256Hex(packageLockContents) !== manifest.packageLock.sha256) {
    throw new Error('Release package-lock checksum does not match the release manifest.');
  }
  const upstreamLockContents = readRequiredFile(releaseDirectory, UPSTREAM_LOCK_RELEASE_PATH);
  if (sha256Hex(upstreamLockContents) !== findReleaseFileEntry(manifest.archive.payloadFiles, UPSTREAM_LOCK_RELEASE_PATH).sha256) {
    throw new Error('Release upstream lock checksum does not match the release inventory.');
  }
  const runtimePolicyTemplate = readRequiredFile(releaseDirectory, RELEASE_ENV_TEMPLATE_PATH);
  if (!runtimePolicyTemplate.includes('SUREBET_RUNTIME_MODE=paper')) {
    throw new Error('Release environment template must keep SUREBET_RUNTIME_MODE=paper.');
  }
  if (!runtimePolicyTemplate.includes('SUREBET_PROVIDER_CONNECTIONS=disabled')) {
    throw new Error('Release environment template must keep provider connections disabled.');
  }
  if (!runtimePolicyTemplate.includes('SUREBET_EXECUTION_ENABLED=false')) {
    throw new Error('Release environment template must keep execution disabled.');
  }
  if (containsForbiddenReleasePath(releaseDirectory)) {
    throw new Error('Release directory contains a forbidden runtime, database, secret, or artifact path.');
  }
  const releaseMigrations = loadSurebetMigrationFiles(releaseDirectory);
  if (releaseMigrations.length !== manifest.migrationInventory.length) {
    throw new Error('Release migration inventory length does not match the extracted release.');
  }
  for (let index = 0; index < releaseMigrations.length; index += 1) {
    const expected = manifest.migrationInventory[index];
    const actual = releaseMigrations[index];
    if (
      actual === undefined
      || expected === undefined
      || expected.migrationName !== actual.migrationName
      || expected.path !== relative(releaseDirectory, actual.path)
      || expected.sha256 !== actual.sha256
    ) {
      throw new Error('Release migration inventory does not match the extracted release.');
    }
  }
}

function containsForbiddenReleasePath(releaseDirectory: string): boolean {
  for (const relativePath of listRelativeFiles(releaseDirectory)) {
    if (isForbiddenExtractedReleasePath(relativePath)) {
      return true;
    }
  }
  return false;
}

function verifyChecksumsFile(releaseDirectory: string): void {
  const checksumsPath = join(releaseDirectory, RELEASE_CHECKSUMS_FILE);
  const lines = readRequiredFile(releaseDirectory, RELEASE_CHECKSUMS_FILE).split(/\r?\n/);
  const seen = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const match = /^([0-9a-f]{64})  (.+)$/.exec(trimmed);
    if (match === null) {
      throw new Error(`Release checksum line is malformed in ${checksumsPath}.`);
    }
    const relativePathValue = match[2];
    if (relativePathValue === undefined) {
      throw new Error(`Release checksum line is malformed in ${checksumsPath}.`);
    }
    const relativePath = normalizeRelativePath(relativePathValue);
    if (relativePath === RELEASE_CHECKSUMS_FILE) {
      throw new Error('Release checksum file must not list itself.');
    }
    if (seen.has(relativePath)) {
      throw new Error(`Release checksum file contains a duplicate entry: ${relativePath}`);
    }
    seen.add(relativePath);
    const actualSha256 = fileSha256(join(releaseDirectory, relativePath));
    if (actualSha256 !== match[1]) {
      throw new Error(`Release checksum mismatch for ${relativePath}.`);
    }
  }
}

function writeChecksumsFile(releaseDirectory: string): void {
  const lines: string[] = [];
  for (const relativePath of listRelativeFiles(releaseDirectory)) {
    if (relativePath === RELEASE_CHECKSUMS_FILE) {
      continue;
    }
    lines.push(`${fileSha256(join(releaseDirectory, relativePath))}  ${relativePath}`);
  }
  writeFileSync(join(releaseDirectory, RELEASE_CHECKSUMS_FILE), `${lines.join('\n')}\n`, 'utf-8');
}

function copyPayloadFiles(
  repositoryRoot: string,
  releaseDirectory: string,
  payloadFiles: readonly ReleaseFileEntry[],
): void {
  for (const entry of payloadFiles) {
    const sourcePath = join(repositoryRoot, entry.path);
    const targetPath = join(releaseDirectory, entry.path);
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
    chmodSync(targetPath, parseInt(entry.mode, 8));
  }
}

function collectReleaseSourceFiles(
  repositoryRoot: string,
  sourceManifest: SourceManifestDocument,
): readonly ReleaseFileEntry[] {
  const entries: ReleaseFileEntry[] = [];
  for (const entry of sourceManifest.files) {
    const relativePath = normalizeRelativePath(entry.path);
    if (!isAllowedReleasePath(relativePath)) {
      continue;
    }
    entries.push(
      createReleaseFileEntry(repositoryRoot, relativePath),
    );
  }
  for (const requiredPath of [RELEASE_ENV_TEMPLATE_PATH, SYSTEMD_TEMPLATE_PATH, PACKAGE_JSON_PATH, PACKAGE_LOCK_PATH, SOURCE_MANIFEST_PATH]) {
    if (!entries.some((entry) => entry.path === requiredPath)) {
      entries.push(createReleaseFileEntry(repositoryRoot, requiredPath));
    }
  }
  return freezeSortedFileEntries(entries);
}

function collectNamedFiles(repositoryRoot: string, relativePaths: readonly string[]): readonly ReleaseFileEntry[] {
  return freezeSortedFileEntries(relativePaths.map((relativePath) => createReleaseFileEntry(repositoryRoot, relativePath)));
}

function collectDirectoryInventory(repositoryRoot: string, relativeDirectory: string): readonly ReleaseFileEntry[] {
  const resolvedDirectory = join(repositoryRoot, relativeDirectory);
  if (!existsSync(resolvedDirectory) || !statSync(resolvedDirectory).isDirectory()) {
    throw new Error(`Required release directory does not exist: ${relativeDirectory}`);
  }
  const entries: ReleaseFileEntry[] = [];
  for (const relativePath of walkDirectoryFiles(resolvedDirectory)) {
    entries.push(
      createReleaseFileEntry(repositoryRoot, normalizeRelativePath(relative(join(repositoryRoot), join(resolvedDirectory, relativePath)))),
    );
  }
  return freezeSortedFileEntries(entries);
}

function collectMigrationInventory(
  repositoryRoot: string,
): readonly Readonly<{ readonly migrationName: string; readonly path: string; readonly sha256: string }>[] {
  const migrations = loadSurebetMigrationFiles(repositoryRoot);
  return Object.freeze(
    migrations.map((migration) =>
      Object.freeze({
        migrationName: migration.migrationName,
        path: normalizeRelativePath(relative(repositoryRoot, migration.path)),
        sha256: migration.sha256,
      })),
  );
}

function collectRequiredExecutables(
  repositoryRoot: string,
  requiredExecutablePaths: readonly string[],
): readonly ReleaseFileEntry[] {
  const entries: ReleaseFileEntry[] = [];
  for (const relativePath of requiredExecutablePaths) {
    entries.push(createReleaseFileEntry(repositoryRoot, relativePath));
  }
  return freezeSortedFileEntries(entries);
}

function mergeFileInventories(...inventories: readonly (readonly ReleaseFileEntry[])[]): readonly ReleaseFileEntry[] {
  const entries = new Map<string, ReleaseFileEntry>();
  for (const inventory of inventories) {
    for (const entry of inventory) {
      const existing = entries.get(entry.path);
      if (existing === undefined) {
        entries.set(entry.path, entry);
        continue;
      }
      if (
        existing.sha256 !== entry.sha256
        || existing.size !== entry.size
        || existing.mode !== entry.mode
      ) {
        throw new Error(`Release inventory contains incompatible duplicate entries for ${entry.path}.`);
      }
    }
  }
  return freezeSortedFileEntries(Array.from(entries.values()));
}

function createReleaseFileEntry(repositoryRoot: string, relativePath: string): ReleaseFileEntry {
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  const absolutePath = join(repositoryRoot, normalizedRelativePath);
  const stats = ensureFile(absolutePath, normalizedRelativePath);
  return Object.freeze({
    mode: normalizedReleaseMode(stats),
    path: normalizedRelativePath,
    sha256: fileSha256(absolutePath),
    size: stats.size,
  });
}

function readSourceManifest(repositoryRoot: string): SourceManifestDocument {
  const contents = readRequiredFile(repositoryRoot, SOURCE_MANIFEST_PATH);
  const parsed = requireObject(JSON.parse(contents), SOURCE_MANIFEST_PATH) as Record<string, unknown>;
  if (parsed.schema !== SOURCE_MANIFEST_SCHEMA) {
    throw new Error(`SOURCE_MANIFEST.json schema must be ${SOURCE_MANIFEST_SCHEMA}.`);
  }
  const generated = requireIsoTimestamp(parsed.generated, 'SOURCE_MANIFEST.json generated');
  requireNonEmptyString(parsed.overlay, 'SOURCE_MANIFEST.json overlay');
  const filesValue = parsed.files;
  if (!Array.isArray(filesValue) || filesValue.length === 0) {
    throw new Error('SOURCE_MANIFEST.json files must contain at least one file entry.');
  }
  const files = filesValue.map((value) => {
    const entry = requireObject(value, 'SOURCE_MANIFEST.json file entry') as Record<string, unknown>;
    const path = normalizeRelativePath(requireNonEmptyString(entry.path, 'SOURCE_MANIFEST.json file path'));
    const sha256 = requireSha256(entry.sha256, `SOURCE_MANIFEST.json sha256 for ${path}`);
    const size = requireNonNegativeInteger(entry.size, `SOURCE_MANIFEST.json size for ${path}`);
    return Object.freeze({
      path,
      sha256,
      size,
    });
  });
  return Object.freeze({
    files: Object.freeze(files),
    generated,
    overlay: requireNonEmptyString(parsed.overlay, 'SOURCE_MANIFEST.json overlay'),
    schema: SOURCE_MANIFEST_SCHEMA,
  });
}

function readPackageJson(repositoryRoot: string): ReleasePackageJson {
  const contents = readRequiredFile(repositoryRoot, PACKAGE_JSON_PATH);
  const parsed = requireObject(JSON.parse(contents), PACKAGE_JSON_PATH);
  return parsed as ReleasePackageJson;
}

function readCockpitBuildMetadata(repositoryRoot: string): CockpitBuildMetadata {
  const contents = readRequiredFile(repositoryRoot, COCKPIT_BUILD_METADATA_FILE);
  const parsed = requireObject(JSON.parse(contents), COCKPIT_BUILD_METADATA_FILE) as Record<string, unknown>;
  if (parsed.schema !== COCKPIT_BUILD_METADATA_SCHEMA) {
    throw new Error(`Cockpit build metadata schema must be ${COCKPIT_BUILD_METADATA_SCHEMA}.`);
  }
  if (parsed.dataMode !== 'api') {
    throw new Error('Cockpit build metadata must keep dataMode=api.');
  }
  const apiBaseUrl = requireNonEmptyString(parsed.apiBaseUrl, 'cockpit apiBaseUrl');
  const url = new URL(apiBaseUrl);
  if (url.protocol !== 'http:' || url.hostname !== LOOPBACK_HOST) {
    throw new Error('Cockpit build metadata must target a loopback HTTP API base URL.');
  }
  return Object.freeze({
    apiBaseUrl,
    dataMode: 'api',
    schema: COCKPIT_BUILD_METADATA_SCHEMA,
  });
}

function validateReleaseManifest(manifest: BwsReleaseManifest): void {
  if (manifest.schema !== RELEASE_MANIFEST_SCHEMA) {
    throw new Error(`Release manifest schema must be ${RELEASE_MANIFEST_SCHEMA}.`);
  }
  requireIsoTimestamp(manifest.createdAt, 'release manifest createdAt');
  requireSha256(manifest.semanticFingerprint, 'release manifest semanticFingerprint');
  requireNonEmptyString(manifest.releaseId, 'release manifest releaseId');
  if (manifest.packageVersion.trim().length === 0) {
    throw new Error('Release manifest packageVersion must be non-empty.');
  }
  if (manifest.source.files.length === 0 || manifest.archive.payloadFiles.length === 0) {
    throw new Error('Release manifest source and archive inventories must be non-empty.');
  }
  if (manifest.cockpit.dataMode !== 'api') {
    throw new Error('Release manifest cockpit dataMode must be api.');
  }
  if (manifest.policy.runtimeMode !== 'paper') {
    throw new Error('Release manifest runtime policy must keep runtimeMode=paper.');
  }
  if (manifest.policy.providerConnections !== 'disabled') {
    throw new Error('Release manifest runtime policy must keep providerConnections=disabled.');
  }
  if (manifest.policy.executionEnabled !== false) {
    throw new Error('Release manifest runtime policy must keep executionEnabled=false.');
  }
}

function readReleaseManifest(releaseDirectory: string): BwsReleaseManifest {
  const contents = readRequiredFile(releaseDirectory, RELEASE_MANIFEST_FILE);
  const parsed = requireObject(JSON.parse(contents), RELEASE_MANIFEST_FILE) as unknown as BwsReleaseManifest;
  validateReleaseManifest(parsed);
  return parsed;
}

function toReleaseContentDescriptor(manifest: BwsReleaseManifest): ReleaseContentDescriptor {
  return Object.freeze({
    archive: manifest.archive,
    builtRuntime: manifest.builtRuntime,
    cockpit: manifest.cockpit,
    executables: manifest.executables,
    migrationInventory: manifest.migrationInventory,
    packageLock: manifest.packageLock,
    packageVersion: manifest.packageVersion,
    policy: manifest.policy,
    postgresqlRequirement: manifest.postgresqlRequirement,
    source: manifest.source,
    templates: manifest.templates,
    upstreamLock: manifest.upstreamLock,
  });
}

function toSemanticFingerprintDescriptor(content: ReleaseContentDescriptor): ReleaseContentDescriptor {
  return Object.freeze({
    ...content,
    archive: Object.freeze({
      ...content.archive,
      fileName: '',
      rootDirectory: '',
    }),
  });
}

function verifyInventoryMatchesRelease(releaseDirectory: string, inventory: readonly ReleaseFileEntry[]): void {
  for (const entry of inventory) {
    const absolutePath = join(releaseDirectory, entry.path);
    const stats = ensureFile(absolutePath, entry.path);
    const actualSha256 = fileSha256(absolutePath);
    if (actualSha256 !== entry.sha256) {
      throw new Error(`Release file checksum mismatch for ${entry.path}.`);
    }
    if (stats.size !== entry.size) {
      throw new Error(`Release file size mismatch for ${entry.path}.`);
    }
    if (hasExecutableMode(entry.mode) !== isExecutableMode(stats)) {
      throw new Error(`Release file executability mismatch for ${entry.path}.`);
    }
  }
}

function assertOutputTargetsAvailable(targets: readonly string[], allowOverwrite: boolean): void {
  for (const target of targets) {
    if (existsSync(target) && !allowOverwrite) {
      throw new Error(`Refusing to overwrite existing release output without --allow-overwrite: ${target}`);
    }
  }
}

function commitOutputTarget(sourcePath: string, targetPath: string, allowOverwrite: boolean): void {
  if (existsSync(targetPath) && allowOverwrite) {
    rmSync(targetPath, { force: true, recursive: true });
  }
  renameSync(sourcePath, targetPath);
}

function createDeterministicArchive(
  sourceParentDirectory: string,
  releaseDirectoryName: string,
  archivePath: string,
  runCommand: CommandRunner,
): void {
  runCommand(
    'python3',
    [
      '-c',
      [
        'import gzip',
        'import os',
        'import sys',
        'import tarfile',
        '',
        'source_parent = sys.argv[1]',
        'release_dir = sys.argv[2]',
        'archive_path = sys.argv[3]',
        'release_root = os.path.join(source_parent, release_dir)',
        'entries = []',
        'for root, dirs, files in os.walk(release_root):',
        '    dirs.sort()',
        '    files.sort()',
        '    for name in files:',
        '        absolute = os.path.join(root, name)',
        '        relative = os.path.relpath(absolute, source_parent)',
        '        entries.append((absolute, relative))',
        'with open(archive_path, "wb") as raw_handle:',
        '    with gzip.GzipFile(filename="", mode="wb", fileobj=raw_handle, mtime=0) as gzip_handle:',
        '        with tarfile.open(fileobj=gzip_handle, mode="w") as archive:',
        '            for absolute, relative in entries:',
        '                info = archive.gettarinfo(absolute, arcname=relative)',
        '                info.uid = 0',
        '                info.gid = 0',
        '                info.uname = ""',
        '                info.gname = ""',
        '                info.mtime = 0',
        '                with open(absolute, "rb") as handle:',
        '                    archive.addfile(info, handle)',
      ].join('\n'),
      sourceParentDirectory,
      releaseDirectoryName,
      archivePath,
    ],
    Object.freeze({
      cwd: sourceParentDirectory,
    }),
  );
}

function listArchiveEntries(archivePath: string, runCommand: CommandRunner): readonly string[] {
  const output = runCommand(
    'python3',
    [
      '-c',
      [
        'import json',
        'import sys',
        'import tarfile',
        'with tarfile.open(sys.argv[1], "r:gz") as archive:',
        '    names = sorted(name for name in archive.getnames() if name and name != ".")',
        '    print(json.dumps(names))',
      ].join('\n'),
      archivePath,
    ],
  );
  const parsed = JSON.parse(output) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Archive entry listing must be a JSON array.');
  }
  return Object.freeze(
    parsed.map((value) => requireNonEmptyString(value, 'archive entry')),
  );
}

function loadRequiredExecutablePaths(repositoryRoot: string): Promise<readonly string[]> {
  const moduleUrl = pathToFileURL(join(repositoryRoot, 'tools/required_executable_paths.js')).href;
  return import(moduleUrl).then((moduleValue: { REQUIRED_EXECUTABLE_PATHS?: unknown }) => {
    const requiredPathsValue = moduleValue.REQUIRED_EXECUTABLE_PATHS;
    if (!Array.isArray(requiredPathsValue) || requiredPathsValue.length === 0) {
      throw new Error('tools/required_executable_paths.js must export a non-empty REQUIRED_EXECUTABLE_PATHS array.');
    }
    return Object.freeze(
      requiredPathsValue.map((value) => normalizeRelativePath(requireNonEmptyString(value, 'required executable path'))),
    );
  });
}

function buildConfigurationPresence(
  environment: ReadonlyMap<string, string>,
  selectedMode: 'api' | 'export',
): Readonly<Record<string, boolean>> {
  const entries: Record<string, boolean> = {};
  for (const name of COMMON_ENVIRONMENT_KEYS) {
    entries[name] = environment.has(name);
  }
  const modeKeys = selectedMode === 'export' ? EXPORT_MODE_KEYS : API_MODE_KEYS;
  for (const name of modeKeys) {
    entries[name] = environment.has(name);
  }
  const hasHost = environment.has('SUREBET_PG_HOST');
  const hasSocketDirectory = environment.has('SUREBET_PG_SOCKET_DIRECTORY');
  if (hasHost === hasSocketDirectory) {
    throw new Error('Release preflight requires exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.');
  }
  entries.SUREBET_PG_HOST = hasHost;
  entries.SUREBET_PG_SOCKET_DIRECTORY = hasSocketDirectory;
  return Object.freeze(entries);
}

function validateEnvironmentPresence(configurationPresence: Readonly<Record<string, boolean>>): void {
  for (const [name, present] of Object.entries(configurationPresence)) {
    if ((name === 'SUREBET_PG_HOST' || name === 'SUREBET_PG_SOCKET_DIRECTORY') && !present) {
      continue;
    }
    if (!present) {
      throw new Error(`Release preflight requires ${name} to be present in the private environment file.`);
    }
  }
}

function validateClosedPolicy(environment: ReadonlyMap<string, string>): void {
  if (environment.get('SUREBET_RUNTIME_MODE') !== 'paper') {
    throw new Error('Release preflight requires SUREBET_RUNTIME_MODE=paper.');
  }
  if (environment.get('SUREBET_PROVIDER_CONNECTIONS') !== 'disabled') {
    throw new Error('Release preflight requires SUREBET_PROVIDER_CONNECTIONS=disabled.');
  }
  if (environment.get('SUREBET_EXECUTION_ENABLED') !== 'false') {
    throw new Error('Release preflight requires SUREBET_EXECUTION_ENABLED=false.');
  }
}

function validateUpstreamLockPath(environment: ReadonlyMap<string, string>, releaseDirectory: string): void {
  const lockPath = environment.get('BWS_UPSTREAM_LOCK_PATH');
  if (lockPath === undefined) {
    throw new Error('Release preflight requires BWS_UPSTREAM_LOCK_PATH.');
  }
  const resolvedLockPath = resolve(releaseDirectory, lockPath);
  const expectedLockPath = join(releaseDirectory, UPSTREAM_LOCK_RELEASE_PATH);
  if (resolvedLockPath !== expectedLockPath) {
    throw new Error('Release preflight requires BWS_UPSTREAM_LOCK_PATH to target the release-bundled upstream lock file.');
  }
}

function validateCockpitBinding(environment: ReadonlyMap<string, string>, manifest: BwsReleaseManifest): void {
  const apiPortValue = environment.get('BWS_API_PORT');
  if (apiPortValue === undefined || !POSITIVE_INTEGER_PATTERN.test(apiPortValue)) {
    throw new Error('Release preflight requires BWS_API_PORT to be a base-10 positive integer.');
  }
  const cockpitApiBaseUrl = new URL(manifest.cockpit.apiBaseUrl);
  if (cockpitApiBaseUrl.protocol !== 'http:' || cockpitApiBaseUrl.hostname !== LOOPBACK_HOST) {
    throw new Error('Release manifest cockpit API base URL must remain loopback-only.');
  }
  if (cockpitApiBaseUrl.port !== apiPortValue) {
    throw new Error('Release preflight requires BWS_API_PORT to match the bundled cockpit API base URL.');
  }
}

function inspectStorage(path: string, requiredBytes: number): BwsReleasePreflightResult['storage'] {
  const stats = statfsSync(path);
  const availableBytes = Number(stats.bavail) * Number(stats.bsize);
  return Object.freeze({
    availableBytes,
    requiredBytes,
    sufficient: availableBytes >= requiredBytes,
  });
}

function calculateRequiredScratchBytes(manifest: BwsReleaseManifest): number {
  let totalSize = 0;
  for (const entry of manifest.archive.payloadFiles) {
    totalSize += entry.size;
  }
  return totalSize * 2;
}

function readStrictEnvironmentFile(path: string): ReadonlyMap<string, string> {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Private environment file does not exist: ${path}`);
  }
  const values = new Map<string, string>();
  const lines = readFileSync(path, 'utf-8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (match === null) {
      throw new Error(`Private environment file line ${index + 1} is invalid.`);
    }
    const name = match[1];
    const rawValue = match[2];
    if (name === undefined || rawValue === undefined) {
      throw new Error(`Private environment file line ${index + 1} is invalid.`);
    }
    if (SENSITIVE_KEY_PATTERN.test(name) && name !== 'SUREBET_PG_PASSWORD') {
      throw new Error(`Private environment file must not include unexpected sensitive key ${name}.`);
    }
    if (values.has(name)) {
      throw new Error(`Duplicate ${name} entries in the private environment file are not allowed.`);
    }
    values.set(name, parseEnvironmentFileValue(rawValue, name, index + 1));
  }
  return values;
}

function parseEnvironmentFileValue(rawValue: string, name: string, lineNumber: number): string {
  const value = rawValue.trim();
  if (value.length === 0) {
    throw new Error(`${name} in the private environment file line ${lineNumber} must not be empty.`);
  }
  const first = value[0];
  const last = value[value.length - 1];
  if (first === '"' || first === '\'') {
    if (last !== first || value.length < 2) {
      throw new Error(`${name} in the private environment file line ${lineNumber} has mismatched quotes.`);
    }
    return value.slice(1, -1);
  }
  if (value.includes(' ')) {
    throw new Error(`${name} in the private environment file line ${lineNumber} must be quoted when it contains spaces.`);
  }
  return value;
}

function requireSelectedMode(environment: ReadonlyMap<string, string>): 'api' | 'export' {
  const mode = environment.get('BWS_UPSTREAM_MODE');
  if (mode !== 'api' && mode !== 'export') {
    throw new Error('Release preflight requires BWS_UPSTREAM_MODE to be exactly api or export.');
  }
  return mode;
}

function readArchiveChecksumFile(path: string, archiveFileName: string): string {
  const lines = readFileSync(path, 'utf-8').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length !== 1) {
    throw new Error(`Release archive checksum file must contain exactly one checksum entry: ${path}`);
  }
  const firstLine = lines[0];
  if (firstLine === undefined) {
    throw new Error(`Release archive checksum file must contain exactly one checksum entry: ${path}`);
  }
  const match = /^([0-9a-f]{64})  (.+)$/.exec(firstLine);
  const archiveName = match === null ? undefined : match[2];
  const sha256 = match === null ? undefined : match[1];
  if (match === null || archiveName !== archiveFileName || sha256 === undefined) {
    throw new Error(`Release archive checksum file must reference ${archiveFileName}.`);
  }
  return sha256;
}

function parseNodeMajor(version: string): number {
  const match = /^v(\d+)\./.exec(version);
  if (match === null) {
    throw new Error(`Unable to parse Node.js version output: ${version}`);
  }
  const major = match[1];
  if (major === undefined) {
    throw new Error(`Unable to parse Node.js version output: ${version}`);
  }
  return Number.parseInt(major, 10);
}

function parsePostgreSqlMajor(version: string): number {
  const match = /(?:PostgreSQL|psql)\)\s+(\d+)/i.exec(version);
  if (match === null) {
    throw new Error(`Unable to parse PostgreSQL client version output: ${version}`);
  }
  const major = match[1];
  if (major === undefined) {
    throw new Error(`Unable to parse PostgreSQL client version output: ${version}`);
  }
  return Number.parseInt(major, 10);
}

function writeJsonFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function walkDirectoryFiles(directory: string): readonly string[] {
  const entries: string[] = [];
  walkDirectoryFilesRecursive(directory, directory, entries);
  return Object.freeze(entries.sort((left, right) => left.localeCompare(right)));
}

function walkDirectoryFilesRecursive(root: string, current: string, entries: string[]): void {
  const children = readdirSync(current, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const child of children) {
    const absolutePath = join(current, child.name);
    if (child.isDirectory()) {
      walkDirectoryFilesRecursive(root, absolutePath, entries);
      continue;
    }
    if (!child.isFile()) {
      continue;
    }
    entries.push(normalizeRelativePath(relative(root, absolutePath)));
  }
}

function listRelativeFiles(root: string): readonly string[] {
  return walkDirectoryFiles(root);
}

function isAllowedReleasePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  if (FORBIDDEN_EXACT_PATHS.has(normalized)) {
    return false;
  }
  const parts = normalized.split('/');
  for (const part of parts.slice(0, -1)) {
    if (FORBIDDEN_SOURCE_ROOTS.has(part)) {
      return false;
    }
  }
  const firstPart = parts[0];
  if (firstPart !== undefined && FORBIDDEN_SOURCE_ROOTS.has(firstPart)) {
    return false;
  }
  const lowered = normalized.toLowerCase();
  for (const suffix of FORBIDDEN_SUFFIXES) {
    if (lowered.endsWith(suffix) && normalized !== PACKAGE_LOCK_PATH) {
      return false;
    }
  }
  return true;
}

function isForbiddenExtractedReleasePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  if (FORBIDDEN_EXACT_PATHS.has(normalized)) {
    return true;
  }
  const parts = normalized.split('/');
  const firstPart = parts[0];
  if (firstPart !== undefined && FORBIDDEN_EXTRACTED_RELEASE_ROOTS.has(firstPart)) {
    return true;
  }
  const lowered = normalized.toLowerCase();
  for (const suffix of FORBIDDEN_SUFFIXES) {
    if (lowered.endsWith(suffix) && normalized !== PACKAGE_LOCK_PATH) {
      return true;
    }
  }
  return false;
}

function hashUpstreamLockFingerprint(lock: BettingWinUpstreamLock): string {
  return stableObjectFingerprint(
    stableJsonStringify(
      Object.freeze({
        commitSha: lock.commitSha,
        contractAlias: lock.contractAlias,
        contractSchema: lock.contractSchema,
        gitTreeSha: lock.gitTreeSha,
        repository: lock.repository,
        repositoryPath: lock.repositoryPath,
        sourceView: lock.sourceView,
        surebetProfile: lock.surebetProfile,
        trackedTreeListingSha256: lock.trackedTreeListingSha256,
        verifiedAt: lock.verifiedAt,
      }),
    ),
  );
}

function freezeSortedFileEntries(entries: readonly ReleaseFileEntry[]): readonly ReleaseFileEntry[] {
  return Object.freeze(
    [...entries].sort((left, right) => left.path.localeCompare(right.path)),
  );
}

function ensureDirectoryWritable(path: string, label: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`${label} must be an existing directory: ${path}`);
  }
  accessSync(path, fsConstants.W_OK | fsConstants.X_OK);
}

function ensureFile(path: string, label: string): Stats {
  if (!existsSync(path)) {
    throw new Error(`Required release file does not exist: ${label}`);
  }
  const stats = statSync(path);
  if (!stats.isFile()) {
    throw new Error(`Required release path must be a file: ${label}`);
  }
  return stats;
}

function findReleaseFileEntry(inventory: readonly ReleaseFileEntry[], relativePath: string): ReleaseFileEntry {
  const normalizedPath = normalizeRelativePath(relativePath);
  const entry = inventory.find((candidate) => candidate.path === normalizedPath);
  if (entry === undefined) {
    throw new Error(`Release inventory is missing required path: ${normalizedPath}`);
  }
  return entry;
}

function readRequiredFile(repositoryRoot: string, relativePath: string): string {
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  const absolutePath = join(repositoryRoot, normalizedRelativePath);
  ensureFile(absolutePath, normalizedRelativePath);
  return readFileSync(absolutePath, 'utf-8');
}

function isWithinResolved(root: string, candidate: string): boolean {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}/`);
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const timestamp = requireNonEmptyString(value, label);
  if (!ISO_8601_UTC.test(timestamp) || Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return timestamp;
}

function requireSha256(value: unknown, label: string): string {
  const sha256 = requireNonEmptyString(value, label);
  if (!SHA256_PATTERN.test(sha256)) {
    throw new Error(`${label} must be a lowercase SHA-256 hex digest.`);
  }
  return sha256;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function normalizeRelativePath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function sanitizeReleaseToken(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '-');
}

function fileSha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function compareStringsLexicographically(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function stableObjectFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function formatMode(stats: Stats): string {
  return (stats.mode & 0o777).toString(8).padStart(3, '0');
}

function normalizedReleaseMode(stats: Stats): string {
  return (isExecutableMode(stats) ? 0o755 : 0o644).toString(8);
}

function isExecutableMode(stats: Stats): boolean {
  return (stats.mode & 0o111) !== 0;
}

function hasExecutableMode(mode: string): boolean {
  return (parseInt(mode, 8) & 0o111) !== 0;
}

function assertNodeEngineRange(value: string): void {
  if (!value.includes('20')) {
    throw new Error('package.json engines.node must retain the Node 20 release requirement.');
  }
}

function runCommandSync(
  command: string,
  args: readonly string[],
  options?: Readonly<{
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
  }>,
): string {
  return execFileSync(command, [...args], {
    cwd: options === undefined ? undefined : options.cwd,
    encoding: 'utf-8',
    env: options === undefined ? process.env : options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function defaultNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}
