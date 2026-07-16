import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  statfsSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sha256Hex } from '../../../persistence/src/index.js';
import { readBettingWinUpstreamLock, type BettingWinUpstreamLock } from '../../../upstream/src/index.js';
import { validatePinnedBettingWinStrategyExportIntake } from '../adapters/betting-win-strategy-export-intake.js';
import { registerBwsEvidenceArtifact } from './observability.js';
import type {
  BwsDatabaseBackupManifest,
  BwsMigrationStatusResult,
  BwsVerifyDatabaseRestoreResult,
} from './database-lifecycle.js';
import type {
  BwsReleaseInstallVerificationResult,
  BwsReleaseManifest,
} from './release-packaging.js';
import type {
  BwsSoakCampaignManifest,
  BwsSoakCampaignState,
} from './soak-campaign.js';

const EXTERNAL_RUNTIME_CAMPAIGN_SCHEMA = 'bws.external_runtime_campaign.v1' as const;
const RELEASE_MANIFEST_SCHEMA = 'bws.release_manifest.v1' as const;
const RELEASE_INSTALL_VERIFICATION_SCHEMA = 'bws.release_install_verification.v1' as const;
const DATABASE_BACKUP_MANIFEST_SCHEMA = 'bws.database_backup_manifest.v1' as const;
const DATABASE_MIGRATION_STATUS_SCHEMA = 'bws.database_migration_status.v1' as const;
const DATABASE_RESTORE_VERIFICATION_SCHEMA = 'bws.database_restore_verification.v1' as const;
const SOAK_CAMPAIGN_SCHEMA = 'bws.soak_campaign.v1' as const;
const SOAK_CAMPAIGN_CHECKPOINT_SCHEMA = 'bws.soak_campaign_checkpoint.v1' as const;
const SOAK_CAMPAIGN_STATE_SCHEMA = 'bws.soak_campaign_state.v1' as const;
const UPSTREAM_LOCK_RELEASE_PATH = 'config/betting-win.upstream.lock.json' as const;
const LOOPBACK_HOST = '127.0.0.1' as const;
const RELEASE_REQUIRED_CHECK = 'non_mutating_preflight_passed' as const;
const CANONICAL_SOAK_DURATION_MS = 7_200_000;
const SENSITIVE_KEY_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;
const TOKEN_PATTERN = /^[A-Za-z0-9._:/-]+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const EXPORT_MODE_ENV_KEYS = Object.freeze([
  'BWS_UPSTREAM_EXPORT_SELECTION_PATH',
] as const);
const API_MODE_ENV_KEYS = Object.freeze([
  'BWS_UPSTREAM_API_CHECKPOINT_ID',
  'BWS_UPSTREAM_API_BASE_URL',
  'BWS_UPSTREAM_API_CONTRACT_VERSION',
  'BWS_UPSTREAM_API_PAGE_SIZE',
  'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE',
  'BWS_UPSTREAM_API_RETRY_LIMIT',
  'BWS_UPSTREAM_API_RETRY_BACKOFF_MS',
  'BWS_UPSTREAM_API_TIMEOUT_MS',
] as const);
const COMMON_ENV_KEYS = Object.freeze([
  'BETTING_WIN_REPO_PATH',
  'BWS_UPSTREAM_LOCK_PATH',
  'BWS_UPSTREAM_MODE',
  'BWS_API_PORT',
  'SUREBET_RUNTIME_MODE',
  'SUREBET_PROVIDER_CONNECTIONS',
  'SUREBET_EXECUTION_ENABLED',
  'SUREBET_PG_DATABASE',
  'SUREBET_PG_USER',
  'SUREBET_PG_PORT',
] as const);

type ExternalRuntimeMode = 'api' | 'export';

interface ReleaseManifestShape extends Pick<BwsReleaseManifest, 'cockpit' | 'policy' | 'releaseId' | 'schema' | 'semanticFingerprint' | 'source' | 'upstreamLock'> {}

interface InstallVerificationShape extends Pick<BwsReleaseInstallVerificationResult, 'preflight' | 'schema' | 'semanticFingerprint' | 'verifiedChecks'> {}

interface DatabaseMigrationStatusShape extends Pick<BwsMigrationStatusResult, 'compatibility' | 'database' | 'migrationLedger' | 'schema'> {}

interface DatabaseBackupManifestShape extends Pick<BwsDatabaseBackupManifest, 'createdAt' | 'database' | 'schema'> {}

interface DatabaseRestoreVerificationShape extends Pick<BwsVerifyDatabaseRestoreResult, 'backupManifest' | 'createdAt' | 'schema' | 'serverRestartsVerified'> {}

interface SoakManifestShape extends Pick<BwsSoakCampaignManifest, 'campaignId' | 'closedBoundary' | 'observation' | 'release' | 'resumeGuard' | 'schema' | 'semanticFingerprint' | 'upstream'> {}

interface SoakStateShape extends Pick<BwsSoakCampaignState, 'campaignSemanticFingerprint' | 'completedCycleCount' | 'currentCheckpointSequence' | 'lastCheckpointFile' | 'schema'> {}

interface SoakCheckpointShape {
  readonly classification: 'campaign_completed' | 'cleanup_verified' | 'cycle_observed' | 'failure_injected' | 'recovery_verified' | 'campaign_initialized' | 'campaign_resumed';
  readonly schema: typeof SOAK_CAMPAIGN_CHECKPOINT_SCHEMA;
  readonly status: 'completed' | 'failed' | 'planned' | 'recovered' | 'running';
}

export interface BwsExternalRuntimeCampaignManifest {
  readonly createdAt: string;
  readonly database: Readonly<{
    readonly connectionTarget: string;
    readonly currentDatabase: string;
    readonly currentUser: string;
    readonly requestedDatabase: string;
    readonly requestedUser: string;
  }>;
  readonly evidence: Readonly<{
    readonly backupManifest: Readonly<{ file: string; sha256: string; createdAt: string }>;
    readonly installVerification: Readonly<{ file: string; sha256: string }>;
    readonly migrationStatus: Readonly<{ file: string; sha256: string }>;
    readonly restoreVerification: Readonly<{ file: string; sha256: string; createdAt: string }>;
    readonly soakManifest: Readonly<{ file: string; sha256: string }>;
    readonly soakState: Readonly<{ file: string; sha256: string }>;
  }>;
  readonly loopback: Readonly<{
    readonly apiBaseUrl: string;
    readonly cockpitApiBaseUrl: string;
    readonly listenerExposure: 'loopback_only';
  }>;
  readonly paperAutopilotCampaign: Readonly<{
    readonly cycleTimeoutMinutes: number;
    readonly durationHours: number;
    readonly maxCycles: number;
  }>;
  readonly paths: Readonly<{
    readonly envFile: string;
    readonly evidenceDirectory: string;
    readonly releaseDirectory: string;
    readonly runtimeDirectory: string;
  }>;
  readonly policy: Readonly<{
    readonly automaticFallback: 'forbidden';
    readonly executionEnabled: false;
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
    readonly selectedMode: ExternalRuntimeMode;
  }>;
  readonly release: Readonly<{
    readonly releaseId: string;
    readonly semanticFingerprint: string;
    readonly sourceManifestSha256: string;
  }>;
  readonly schema: typeof EXTERNAL_RUNTIME_CAMPAIGN_SCHEMA;
  readonly semanticFingerprint: string;
  readonly selectedInput: BwsExternalRuntimeCampaignSelectedInput;
  readonly storage: Readonly<{
    readonly evidenceDirectory: Readonly<{ availableBytes: number; minimumRequiredBytes: number; sufficient: boolean }>;
    readonly runtimeDirectory: Readonly<{ availableBytes: number; minimumRequiredBytes: number; sufficient: boolean }>;
  }>;
  readonly upstreamLock: Readonly<{
    readonly commitSha: string;
    readonly contractAlias: string;
    readonly contractSchema: string;
    readonly fingerprintSha256: string;
    readonly gitTreeSha: string;
    readonly path: string;
    readonly repositoryPath: string;
    readonly surebetProfile: string;
    readonly trackedTreeListingSha256: string;
  }>;
}

export type BwsExternalRuntimeCampaignSelectedInput =
  | Readonly<{
    readonly contractAlias: string;
    readonly contractSchema: string;
    readonly expectedSha256: string;
    readonly exportPath: string;
    readonly mode: 'export';
    readonly providerGenerationIds: readonly string[];
    readonly sourceLineageRecordIds: readonly string[];
    readonly surebetProfile: string;
  }>
  | Readonly<{
    readonly apiBaseUrl: string;
    readonly checkpointId: string;
    readonly contractInspection?: Readonly<{
      readonly endpoint: string;
      readonly verifiedContractVersion: string;
    }>;
    readonly contractVersion: string;
    readonly maxPagesPerResource: number;
    readonly mode: 'api';
    readonly pageSize: number;
    readonly retryBackoffMs: number;
    readonly retryLimit: number;
    readonly timeoutMs: number;
  }>;

export interface CreateBwsExternalRuntimeCampaignManifestRequest {
  readonly campaignCycleTimeoutMinutes: number;
  readonly campaignDurationHours: number;
  readonly campaignMaxCycles: number;
  readonly envFile: string;
  readonly evidenceDirectory: string;
  readonly installVerificationFile: string;
  readonly minimumAvailableBytes: number;
  readonly migrationStatusFile: string;
  readonly now?: () => string;
  readonly outputFile: string;
  readonly releaseDirectory: string;
  readonly repositoryRoot?: string;
  readonly restoreVerificationFile: string;
  readonly runtimeDirectory: string;
  readonly selectedInput:
    | Readonly<{
      readonly contractAlias: string;
      readonly contractSchema: string;
      readonly expectedSha256: string;
      readonly expectedUpstreamLockFingerprint: string;
      readonly exportPath: string;
      readonly mode: 'export';
      readonly providerGenerationIds: readonly string[];
      readonly sourceLineageRecordIds: readonly string[];
      readonly surebetProfile: string;
    }>
    | Readonly<{
      readonly apiBaseUrl: string;
      readonly apiContractPath?: string;
      readonly checkpointId: string;
      readonly contractVersion: string;
      readonly expectedUpstreamLockFingerprint: string;
      readonly inspectContract: boolean;
      readonly maxPagesPerResource: number;
      readonly mode: 'api';
      readonly pageSize: number;
      readonly retryBackoffMs: number;
      readonly retryLimit: number;
      readonly timeoutMs: number;
    }>;
  readonly soakManifestFile: string;
  readonly soakStateFile: string;
  readonly backupManifestFile: string;
}

export interface CreateBwsExternalRuntimeCampaignManifestResult {
  readonly manifest: BwsExternalRuntimeCampaignManifest;
  readonly outputFile: string;
  readonly outputSha256: string;
}

export async function createBwsExternalRuntimeCampaignManifest(
  request: CreateBwsExternalRuntimeCampaignManifestRequest,
): Promise<CreateBwsExternalRuntimeCampaignManifestResult> {
  const repositoryRoot = resolve(request.repositoryRoot === undefined ? process.cwd() : request.repositoryRoot);
  const now = request.now === undefined ? defaultNow : request.now;
  const createdAt = requireIsoTimestamp(now(), 'createdAt');
  const releaseDirectory = resolve(request.releaseDirectory);
  const envFile = resolve(request.envFile);
  const evidenceDirectory = resolve(request.evidenceDirectory);
  const runtimeDirectory = resolve(request.runtimeDirectory);
  const outputFile = resolve(request.outputFile);
  const minimumAvailableBytes = requirePositiveInteger(request.minimumAvailableBytes, 'minimumAvailableBytes');
  const releaseManifest = readReleaseManifest(releaseDirectory);
  const installVerification = readInstallVerificationFile(request.installVerificationFile);
  const migrationStatus = readMigrationStatusFile(request.migrationStatusFile);
  const backupManifest = readBackupManifestFile(request.backupManifestFile);
  const restoreVerification = readRestoreVerificationFile(request.restoreVerificationFile);
  const soakManifest = readSoakManifestFile(request.soakManifestFile);
  const soakState = readSoakStateFile(request.soakStateFile);
  const environment = readStrictEnvironmentFile(envFile);

  ensureDirectoryWritable(evidenceDirectory, 'evidenceDirectory');
  ensureDirectoryWritable(runtimeDirectory, 'runtimeDirectory');

  if (installVerification.semanticFingerprint !== releaseManifest.semanticFingerprint) {
    throw new Error('Install verification semantic fingerprint must match the release manifest semantic fingerprint exactly.');
  }
  if (!installVerification.verifiedChecks.includes(RELEASE_REQUIRED_CHECK)) {
    throw new Error(`Install verification must include ${RELEASE_REQUIRED_CHECK}.`);
  }

  validateClosedPolicy(environment);
  validateReleaseBinding(environment, releaseDirectory, releaseManifest);

  const selectedMode = requireSelectedMode(environment);
  validateInstallVerificationBinding(installVerification, selectedMode);
  const selectedInput = request.selectedInput.mode === 'export'
    ? validateExportInput(request.selectedInput, selectedMode, repositoryRoot)
    : await validateApiInput(request.selectedInput, selectedMode, environment);
  const expectedUpstreamLockFingerprint = requireSha256(
    request.selectedInput.expectedUpstreamLockFingerprint,
    'expectedUpstreamLockFingerprint',
  );

  const upstreamLockPath = resolve(releaseDirectory, requireNonEmptyString(environment.get('BWS_UPSTREAM_LOCK_PATH'), 'BWS_UPSTREAM_LOCK_PATH'));
  const upstreamLock = readBettingWinUpstreamLock(upstreamLockPath, releaseDirectory);
  const upstreamLockFingerprint = stableObjectFingerprint(upstreamLock);
  if (expectedUpstreamLockFingerprint !== upstreamLockFingerprint) {
    throw new Error('The operator-selected upstream lock fingerprint does not match the release-bundled upstream lock.');
  }
  if (releaseManifest.upstreamLock.fingerprintSha256 !== upstreamLockFingerprint) {
    throw new Error('Release manifest upstream lock fingerprint does not match the release-bundled upstream lock file.');
  }

  validateMigrationStatus(migrationStatus);
  validateBackupEvidence(backupManifest, restoreVerification, migrationStatus);
  validateSoakEvidence(
    soakManifest,
    soakState,
    releaseManifest,
    repositoryRoot,
    upstreamLockFingerprint,
    selectedMode,
  );

  const evidenceStorage = inspectStorage(evidenceDirectory, minimumAvailableBytes);
  const runtimeStorage = inspectStorage(runtimeDirectory, minimumAvailableBytes);
  if (!evidenceStorage.sufficient) {
    throw new Error(
      `External runtime preflight requires at least ${minimumAvailableBytes} free bytes in the evidence directory. Found ${evidenceStorage.availableBytes}.`,
    );
  }
  if (!runtimeStorage.sufficient) {
    throw new Error(
      `External runtime preflight requires at least ${minimumAvailableBytes} free bytes in the runtime directory. Found ${runtimeStorage.availableBytes}.`,
    );
  }

  const manifestDescriptor = Object.freeze({
    database: Object.freeze({
      connectionTarget: migrationStatus.database.connectionTarget,
      currentDatabase: migrationStatus.database.currentDatabase,
      currentUser: migrationStatus.database.currentUser,
      requestedDatabase: migrationStatus.database.requestedDatabase,
      requestedUser: migrationStatus.database.requestedUser,
    }),
    evidence: Object.freeze({
      backupManifest: createTimestampedArtifactReference(request.backupManifestFile, backupManifest.createdAt),
      installVerification: createArtifactReference(request.installVerificationFile),
      migrationStatus: createArtifactReference(request.migrationStatusFile),
      restoreVerification: createTimestampedArtifactReference(request.restoreVerificationFile, restoreVerification.createdAt),
      soakManifest: createArtifactReference(request.soakManifestFile),
      soakState: createArtifactReference(request.soakStateFile),
    }),
    loopback: Object.freeze({
      apiBaseUrl: buildLoopbackApiBaseUrl(environment),
      cockpitApiBaseUrl: releaseManifest.cockpit.apiBaseUrl,
      listenerExposure: 'loopback_only' as const,
    }),
    paperAutopilotCampaign: Object.freeze({
      cycleTimeoutMinutes: requirePositiveInteger(request.campaignCycleTimeoutMinutes, 'campaignCycleTimeoutMinutes'),
      durationHours: requirePositiveInteger(request.campaignDurationHours, 'campaignDurationHours'),
      maxCycles: requirePositiveInteger(request.campaignMaxCycles, 'campaignMaxCycles'),
    }),
    paths: Object.freeze({
      envFile,
      evidenceDirectory,
      releaseDirectory,
      runtimeDirectory,
    }),
    policy: Object.freeze({
      automaticFallback: 'forbidden' as const,
      executionEnabled: false as const,
      providerConnections: 'disabled' as const,
      runtimeMode: 'paper' as const,
      selectedMode,
    }),
    release: Object.freeze({
      releaseId: releaseManifest.releaseId,
      semanticFingerprint: releaseManifest.semanticFingerprint,
      sourceManifestSha256: releaseManifest.source.sourceManifestSha256,
    }),
    schema: EXTERNAL_RUNTIME_CAMPAIGN_SCHEMA,
    selectedInput,
    storage: Object.freeze({
      evidenceDirectory: evidenceStorage,
      runtimeDirectory: runtimeStorage,
    }),
    upstreamLock: Object.freeze({
      commitSha: upstreamLock.commitSha,
      contractAlias: upstreamLock.contractAlias,
      contractSchema: upstreamLock.contractSchema,
      fingerprintSha256: upstreamLockFingerprint,
      gitTreeSha: upstreamLock.gitTreeSha,
      path: UPSTREAM_LOCK_RELEASE_PATH,
      repositoryPath: upstreamLock.repositoryPath,
      surebetProfile: upstreamLock.surebetProfile,
      trackedTreeListingSha256: upstreamLock.trackedTreeListingSha256,
    }),
  });

  const semanticFingerprint = stableObjectFingerprint(
    Object.freeze({
      ...manifestDescriptor,
      storage: Object.freeze({
        evidenceDirectory: Object.freeze({
          minimumRequiredBytes: evidenceStorage.minimumRequiredBytes,
        }),
        runtimeDirectory: Object.freeze({
          minimumRequiredBytes: runtimeStorage.minimumRequiredBytes,
        }),
      }),
    }),
  );
  const manifest: BwsExternalRuntimeCampaignManifest = Object.freeze({
    createdAt,
    semanticFingerprint,
    ...manifestDescriptor,
  });

  mkdirSync(dirname(outputFile), { recursive: true });
  writeJsonFileAtomic(outputFile, manifest);
  if (isWithinResolved(repositoryRoot, outputFile)) {
    registerBwsEvidenceArtifact({
      artifactPath: outputFile,
      artifactSchema: EXTERNAL_RUNTIME_CAMPAIGN_SCHEMA,
      createdAt,
      repositoryRoot,
      retentionClass: 'runtime',
      runtimeId: `bws600-preflight-${semanticFingerprint.slice(0, 12)}`,
      sourceFingerprint: releaseManifest.source.sourceManifestSha256,
    });
  }

  return Object.freeze({
    manifest,
    outputFile,
    outputSha256: fileSha256(outputFile),
  });
}

async function validateApiInput(
  input: CreateBwsExternalRuntimeCampaignManifestRequest['selectedInput'] & Readonly<{ mode: 'api' }>,
  selectedMode: ExternalRuntimeMode,
  environment: ReadonlyMap<string, string>,
): Promise<Extract<BwsExternalRuntimeCampaignSelectedInput, { readonly mode: 'api' }>> {
  if (selectedMode !== 'api') {
    throw new Error('External runtime preflight forbids API input when the private environment selects export mode.');
  }
  const apiBaseUrl = requireHttpUrl(input.apiBaseUrl, 'selectedInput.apiBaseUrl');
  const checkpointId = requireToken(input.checkpointId, 'selectedInput.checkpointId');
  const contractVersion = requireNonEmptyString(input.contractVersion, 'selectedInput.contractVersion');
  const pageSize = requirePositiveInteger(input.pageSize, 'selectedInput.pageSize');
  const maxPagesPerResource = requirePositiveInteger(input.maxPagesPerResource, 'selectedInput.maxPagesPerResource');
  const timeoutMs = requirePositiveInteger(input.timeoutMs, 'selectedInput.timeoutMs');
  const retryLimit = requirePositiveInteger(input.retryLimit, 'selectedInput.retryLimit');
  const retryBackoffMs = requirePositiveInteger(input.retryBackoffMs, 'selectedInput.retryBackoffMs');

  requireModeSpecificEnvironmentPresence(environment, 'api');
  validateApiEnvironmentAlignment(environment, {
    apiBaseUrl,
    checkpointId,
    contractVersion,
    maxPagesPerResource,
    pageSize,
    retryBackoffMs,
    retryLimit,
    timeoutMs,
  });

  const manifestBase: Extract<BwsExternalRuntimeCampaignSelectedInput, { readonly mode: 'api' }> = Object.freeze({
    apiBaseUrl,
    checkpointId,
    contractVersion,
    maxPagesPerResource,
    mode: 'api',
    pageSize,
    retryBackoffMs,
    retryLimit,
    timeoutMs,
  });

  if (input.inspectContract !== true) {
    return manifestBase;
  }

  const apiContractPath = input.apiContractPath === undefined
    ? '/contract'
    : normalizeContractPath(input.apiContractPath);
  const contractInspection = await inspectApiContract({
    apiBaseUrl,
    apiContractPath,
    contractVersion,
    retryBackoffMs,
    retryLimit,
    timeoutMs,
  });
  return Object.freeze({
    ...manifestBase,
    contractInspection,
  });
}

function validateExportInput(
  input: CreateBwsExternalRuntimeCampaignManifestRequest['selectedInput'] & Readonly<{ mode: 'export' }>,
  selectedMode: ExternalRuntimeMode,
  repositoryRoot: string,
): Extract<BwsExternalRuntimeCampaignSelectedInput, { readonly mode: 'export' }> {
  if (selectedMode !== 'export') {
    throw new Error('External runtime preflight forbids export input when the private environment selects api mode.');
  }
  const upstreamLock = readBettingWinUpstreamLock(join(repositoryRoot, 'config', 'betting-win.upstream.lock.json'), repositoryRoot);
  const intake = validatePinnedBettingWinStrategyExportIntake({
    expectedSha256: requireSha256(input.expectedSha256, 'selectedInput.expectedSha256'),
    exportPath: requireNonEmptyString(input.exportPath, 'selectedInput.exportPath'),
    repositoryRoot,
    upstreamLock,
  });
  if (!intake.ok) {
    throw new Error(intake.blockers.map((entry) => entry.message).join(' '));
  }

  const providerGenerationIds = freezeNormalizedTokenArray(
    input.providerGenerationIds,
    'selectedInput.providerGenerationIds',
  );
  const sourceLineageRecordIds = freezeNormalizedTokenArray(
    input.sourceLineageRecordIds,
    'selectedInput.sourceLineageRecordIds',
  );
  if (!sameStringArray(providerGenerationIds, intake.value.providerGenerationIds)) {
    throw new Error('External runtime preflight export input provider generation ids must match the immutable export exactly.');
  }
  if (!sameStringArray(sourceLineageRecordIds, intake.value.sourceLineageRecordIds)) {
    throw new Error('External runtime preflight export input source lineage ids must match the immutable export exactly.');
  }
  if (requireNonEmptyString(input.contractSchema, 'selectedInput.contractSchema') !== intake.value.contractSchema) {
    throw new Error('External runtime preflight export input contractSchema must match the immutable export exactly.');
  }
  if (requireNonEmptyString(input.contractAlias, 'selectedInput.contractAlias') !== intake.value.contractAlias) {
    throw new Error('External runtime preflight export input contractAlias must match the immutable export exactly.');
  }
  if (requireNonEmptyString(input.surebetProfile, 'selectedInput.surebetProfile') !== intake.value.surebetProfile) {
    throw new Error('External runtime preflight export input surebetProfile must match the immutable export exactly.');
  }

  return Object.freeze({
    contractAlias: intake.value.contractAlias,
    contractSchema: intake.value.contractSchema,
    expectedSha256: intake.value.sourceSha256,
    exportPath: intake.value.exportPath,
    mode: 'export',
    providerGenerationIds,
    sourceLineageRecordIds,
    surebetProfile: intake.value.surebetProfile,
  });
}

function validateMigrationStatus(migrationStatus: DatabaseMigrationStatusShape): void {
  if (migrationStatus.compatibility.status !== 'compatible') {
    throw new Error('External runtime preflight requires a compatible BWS migration status result.');
  }
  if (migrationStatus.migrationLedger.pending.length > 0) {
    throw new Error('External runtime preflight requires zero pending BWS migrations.');
  }
}

function validateBackupEvidence(
  backupManifest: DatabaseBackupManifestShape,
  restoreVerification: DatabaseRestoreVerificationShape,
  migrationStatus: DatabaseMigrationStatusShape,
): void {
  if (restoreVerification.serverRestartsVerified !== true) {
    throw new Error('External runtime preflight requires restore verification with serverRestartsVerified=true.');
  }
  if (backupManifest.database.requestedDatabase !== migrationStatus.database.requestedDatabase) {
    throw new Error('External runtime preflight requires backup evidence for the same requested BWS database as migration status.');
  }
  if (restoreVerification.backupManifest.database.requestedDatabase !== backupManifest.database.requestedDatabase) {
    throw new Error('External runtime preflight restore verification must reference the same backup database identity.');
  }
}

function validateSoakEvidence(
  soakManifest: SoakManifestShape,
  soakState: SoakStateShape,
  releaseManifest: ReleaseManifestShape,
  repositoryRoot: string,
  upstreamLockFingerprint: string,
  selectedMode: ExternalRuntimeMode,
): void {
  if (soakManifest.release.semanticFingerprint !== releaseManifest.semanticFingerprint) {
    throw new Error('External runtime preflight requires soak evidence bound to the same release semantic fingerprint.');
  }
  if (soakManifest.resumeGuard.upstreamLockFingerprint !== upstreamLockFingerprint) {
    throw new Error('External runtime preflight requires soak evidence bound to the same upstream lock fingerprint.');
  }
  if (soakManifest.resumeGuard.selectedUpstreamMode !== selectedMode) {
    throw new Error('External runtime preflight requires soak evidence for the selected upstream mode.');
  }
  if (soakManifest.observation.durationMs < CANONICAL_SOAK_DURATION_MS) {
    throw new Error('External runtime preflight requires at least two hours of retained soak evidence.');
  }
  if (soakManifest.closedBoundary.executionEnabled !== false || soakManifest.closedBoundary.providerConnections !== 'disabled') {
    throw new Error('External runtime preflight requires closed-boundary soak evidence.');
  }
  if (soakState.campaignSemanticFingerprint !== soakManifest.semanticFingerprint) {
    throw new Error('External runtime preflight requires a soak state file that matches the soak manifest semantic fingerprint.');
  }
  if (soakState.completedCycleCount < 1 || soakState.currentCheckpointSequence < 1) {
    throw new Error('External runtime preflight requires soak evidence with at least one completed cycle and retained checkpoint.');
  }
  if (soakState.lastCheckpointFile === undefined) {
    throw new Error('External runtime preflight requires soak evidence with a retained lastCheckpointFile.');
  }
  if (!soakObservationBudgetSatisfied(soakManifest, soakState)) {
    throw new Error('External runtime preflight requires soak evidence that satisfies the retained duration budget.');
  }
  const lastCheckpoint = readSoakCheckpointFile(repositoryRoot, soakState.lastCheckpointFile);
  if (lastCheckpoint.classification !== 'cleanup_verified' || lastCheckpoint.status !== 'completed') {
    throw new Error('External runtime preflight requires soak evidence with cleanup_verified as the completed terminal checkpoint.');
  }
}

function validateReleaseBinding(
  environment: ReadonlyMap<string, string>,
  releaseDirectory: string,
  releaseManifest: ReleaseManifestShape,
): void {
  requireCommonEnvironmentPresence(environment);
  validateModeExclusivity(environment);
  if (releaseManifest.policy.runtimeMode !== 'paper') {
    throw new Error('External runtime preflight requires a release manifest with runtimeMode=paper.');
  }
  if (releaseManifest.policy.providerConnections !== 'disabled') {
    throw new Error('External runtime preflight requires a release manifest with providerConnections=disabled.');
  }
  if (releaseManifest.policy.executionEnabled !== false) {
    throw new Error('External runtime preflight requires a release manifest with executionEnabled=false.');
  }
  const cockpitApiBaseUrl = new URL(releaseManifest.cockpit.apiBaseUrl);
  if (cockpitApiBaseUrl.protocol !== 'http:' || cockpitApiBaseUrl.hostname !== LOOPBACK_HOST) {
    throw new Error('External runtime preflight requires the release cockpit API base URL to remain loopback-only.');
  }
  const apiPort = requirePositiveIntegerString(environment.get('BWS_API_PORT'), 'BWS_API_PORT');
  if (cockpitApiBaseUrl.port !== String(apiPort)) {
    throw new Error('External runtime preflight requires BWS_API_PORT to match the release cockpit API base URL port.');
  }
  const configuredLockPath = requireNonEmptyString(environment.get('BWS_UPSTREAM_LOCK_PATH'), 'BWS_UPSTREAM_LOCK_PATH');
  const resolvedLockPath = resolve(releaseDirectory, configuredLockPath);
  const expectedLockPath = join(releaseDirectory, UPSTREAM_LOCK_RELEASE_PATH);
  if (resolvedLockPath !== expectedLockPath) {
    throw new Error('External runtime preflight requires BWS_UPSTREAM_LOCK_PATH to target the bundled upstream lock file.');
  }
}

function validateInstallVerificationBinding(
  installVerification: InstallVerificationShape,
  selectedMode: ExternalRuntimeMode,
): void {
  if (installVerification.preflight.policy.selectedMode !== selectedMode) {
    throw new Error('External runtime preflight requires install verification evidence for the same selected upstream mode.');
  }
}

function requireCommonEnvironmentPresence(environment: ReadonlyMap<string, string>): void {
  for (const name of COMMON_ENV_KEYS) {
    if (!environment.has(name)) {
      throw new Error(`External runtime preflight requires ${name} in the private environment file.`);
    }
  }
  const hasHost = environment.has('SUREBET_PG_HOST');
  const hasSocketDirectory = environment.has('SUREBET_PG_SOCKET_DIRECTORY');
  if (hasHost === hasSocketDirectory) {
    throw new Error('External runtime preflight requires exactly one of SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.');
  }
}

function requireModeSpecificEnvironmentPresence(
  environment: ReadonlyMap<string, string>,
  mode: ExternalRuntimeMode,
): void {
  const required = mode === 'api' ? API_MODE_ENV_KEYS : EXPORT_MODE_ENV_KEYS;
  for (const name of required) {
    if (!environment.has(name)) {
      throw new Error(`External runtime preflight requires ${name} when BWS_UPSTREAM_MODE=${mode}.`);
    }
  }
}

function validateModeExclusivity(environment: ReadonlyMap<string, string>): void {
  const selectedMode = requireSelectedMode(environment);
  const forbidden = selectedMode === 'export' ? API_MODE_ENV_KEYS : EXPORT_MODE_ENV_KEYS;
  for (const name of forbidden) {
    if (environment.has(name)) {
      throw new Error(`External runtime preflight forbids ${name} when BWS_UPSTREAM_MODE=${selectedMode}; no automatic fallback is allowed.`);
    }
  }
}

function validateClosedPolicy(environment: ReadonlyMap<string, string>): void {
  if (environment.get('SUREBET_RUNTIME_MODE') !== 'paper') {
    throw new Error('External runtime preflight requires SUREBET_RUNTIME_MODE=paper.');
  }
  if (environment.get('SUREBET_PROVIDER_CONNECTIONS') !== 'disabled') {
    throw new Error('External runtime preflight requires SUREBET_PROVIDER_CONNECTIONS=disabled.');
  }
  if (environment.get('SUREBET_EXECUTION_ENABLED') !== 'false') {
    throw new Error('External runtime preflight requires SUREBET_EXECUTION_ENABLED=false.');
  }
}

function validateApiEnvironmentAlignment(
  environment: ReadonlyMap<string, string>,
  expected: Readonly<{
    readonly apiBaseUrl: string;
    readonly checkpointId: string;
    readonly contractVersion: string;
    readonly maxPagesPerResource: number;
    readonly pageSize: number;
    readonly retryBackoffMs: number;
    readonly retryLimit: number;
    readonly timeoutMs: number;
  }>,
): void {
  const checks = Object.freeze([
    ['BWS_UPSTREAM_API_CHECKPOINT_ID', expected.checkpointId],
    ['BWS_UPSTREAM_API_BASE_URL', expected.apiBaseUrl],
    ['BWS_UPSTREAM_API_CONTRACT_VERSION', expected.contractVersion],
    ['BWS_UPSTREAM_API_PAGE_SIZE', String(expected.pageSize)],
    ['BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE', String(expected.maxPagesPerResource)],
    ['BWS_UPSTREAM_API_RETRY_LIMIT', String(expected.retryLimit)],
    ['BWS_UPSTREAM_API_RETRY_BACKOFF_MS', String(expected.retryBackoffMs)],
    ['BWS_UPSTREAM_API_TIMEOUT_MS', String(expected.timeoutMs)],
  ] as const);
  for (const [name, expectedValue] of checks) {
    if (environment.get(name) !== expectedValue) {
      throw new Error(`External runtime preflight requires ${name} to match the operator-selected API input exactly.`);
    }
  }
}

function buildLoopbackApiBaseUrl(environment: ReadonlyMap<string, string>): string {
  const apiPort = requirePositiveIntegerString(environment.get('BWS_API_PORT'), 'BWS_API_PORT');
  return `http://${LOOPBACK_HOST}:${String(apiPort)}`;
}

async function inspectApiContract(
  request: Readonly<{
    readonly apiBaseUrl: string;
    readonly apiContractPath: string;
    readonly contractVersion: string;
    readonly retryBackoffMs: number;
    readonly retryLimit: number;
    readonly timeoutMs: number;
  }>,
): Promise<Readonly<{ endpoint: string; verifiedContractVersion: string }>> {
  const endpoint = new URL(request.apiContractPath, request.apiBaseUrl).toString();
  let attempt = 0;
  while (attempt <= request.retryLimit) {
    try {
      const response = await fetch(endpoint, {
        headers: Object.freeze({
          accept: 'application/json',
        }),
        method: 'GET',
        signal: AbortSignal.timeout(request.timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`API contract endpoint returned HTTP ${response.status}.`);
      }
      const parsed = requireRecord(await response.json(), 'api contract response');
      const returnedVersion = parseApiContractVersion(parsed);
      if (returnedVersion !== request.contractVersion) {
        throw new Error('API contract version did not match the operator-selected contract version.');
      }
      return Object.freeze({
        endpoint,
        verifiedContractVersion: returnedVersion,
      });
    } catch (error) {
      if (attempt >= request.retryLimit) {
        throw error;
      }
      attempt += 1;
      await delay(request.retryBackoffMs);
    }
  }
  throw new Error('API contract inspection exhausted its retry budget unexpectedly.');
}

function parseApiContractVersion(parsed: Record<string, unknown>): string {
  const contractVersion = parsed.contractVersion;
  if (typeof contractVersion === 'string' && contractVersion.trim().length > 0) {
    return contractVersion.trim();
  }
  const version = parsed.version;
  if (typeof version === 'string' && version.trim().length > 0) {
    return version.trim();
  }
  throw new Error('API contract inspection response must contain contractVersion or version.');
}

function readReleaseManifest(releaseDirectory: string): ReleaseManifestShape {
  const manifestFile = join(releaseDirectory, 'release-manifest.json');
  const parsed = readJsonObjectFile(manifestFile, 'release manifest');
  if (parsed.schema !== RELEASE_MANIFEST_SCHEMA) {
    throw new Error(`Unexpected release manifest schema in ${manifestFile}.`);
  }
  return parsed as ReleaseManifestShape;
}

function readInstallVerificationFile(path: string): InstallVerificationShape {
  const parsed = readJsonObjectFile(resolve(path), 'install verification');
  if (parsed.schema !== RELEASE_INSTALL_VERIFICATION_SCHEMA) {
    throw new Error(`Unexpected install verification schema in ${path}.`);
  }
  return parsed as InstallVerificationShape;
}

function readMigrationStatusFile(path: string): DatabaseMigrationStatusShape {
  const parsed = readJsonObjectFile(resolve(path), 'migration status');
  if (parsed.schema !== DATABASE_MIGRATION_STATUS_SCHEMA) {
    throw new Error(`Unexpected migration status schema in ${path}.`);
  }
  return parsed as DatabaseMigrationStatusShape;
}

function readBackupManifestFile(path: string): DatabaseBackupManifestShape {
  const parsed = readJsonObjectFile(resolve(path), 'backup manifest');
  if (parsed.schema !== DATABASE_BACKUP_MANIFEST_SCHEMA) {
    throw new Error(`Unexpected backup manifest schema in ${path}.`);
  }
  return parsed as DatabaseBackupManifestShape;
}

function readRestoreVerificationFile(path: string): DatabaseRestoreVerificationShape {
  const parsed = readJsonObjectFile(resolve(path), 'restore verification');
  if (parsed.schema !== DATABASE_RESTORE_VERIFICATION_SCHEMA) {
    throw new Error(`Unexpected restore verification schema in ${path}.`);
  }
  return parsed as DatabaseRestoreVerificationShape;
}

function readSoakManifestFile(path: string): SoakManifestShape {
  const parsed = readJsonObjectFile(resolve(path), 'soak manifest');
  if (parsed.schema !== SOAK_CAMPAIGN_SCHEMA) {
    throw new Error(`Unexpected soak manifest schema in ${path}.`);
  }
  return parsed as SoakManifestShape;
}

function readSoakStateFile(path: string): SoakStateShape {
  const parsed = readJsonObjectFile(resolve(path), 'soak state');
  if (parsed.schema !== SOAK_CAMPAIGN_STATE_SCHEMA) {
    throw new Error(`Unexpected soak state schema in ${path}.`);
  }
  return parsed as SoakStateShape;
}

function readSoakCheckpointFile(repositoryRoot: string, path: string): SoakCheckpointShape {
  const parsed = readJsonObjectFile(resolve(repositoryRoot, path), 'soak checkpoint');
  if (parsed.schema !== SOAK_CAMPAIGN_CHECKPOINT_SCHEMA) {
    throw new Error(`Unexpected soak checkpoint schema in ${path}.`);
  }
  return parsed as unknown as SoakCheckpointShape;
}

function readJsonObjectFile(path: string, label: string): Record<string, unknown> {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Required ${label} file does not exist: ${path}`);
  }
  return requireRecord(JSON.parse(readFileSync(path, 'utf-8')), label);
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

function normalizeContractPath(path: string): string {
  const trimmed = requireNonEmptyString(path, 'selectedInput.apiContractPath');
  if (!trimmed.startsWith('/')) {
    throw new Error('selectedInput.apiContractPath must begin with /.');
  }
  return trimmed;
}

function soakObservationBudgetSatisfied(
  soakManifest: SoakManifestShape,
  soakState: SoakStateShape,
): boolean {
  return BigInt(soakManifest.observation.intervalMs) * BigInt(soakState.completedCycleCount)
    >= BigInt(soakManifest.observation.durationMs);
}

function requireHttpUrl(value: string, label: string): string {
  const normalized = requireNonEmptyString(value, label);
  const parsed = new URL(normalized);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} must use http or https.`);
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    throw new Error(`${label} must not include embedded credentials.`);
  }
  if (parsed.search.length > 0 || parsed.hash.length > 0) {
    throw new Error(`${label} must not include query or fragment components.`);
  }
  return parsed.toString().replace(/\/$/, '');
}

function inspectStorage(path: string, minimumRequiredBytes: number): Readonly<{
  readonly availableBytes: number;
  readonly minimumRequiredBytes: number;
  readonly sufficient: boolean;
}> {
  const stats = statfsSync(path);
  const availableBytes = Number(stats.bavail) * Number(stats.bsize);
  return Object.freeze({
    availableBytes,
    minimumRequiredBytes,
    sufficient: availableBytes >= minimumRequiredBytes,
  });
}

function ensureDirectoryWritable(path: string, label: string): void {
  mkdirSync(path, { recursive: true });
  if (!statSync(path).isDirectory()) {
    throw new Error(`${label} must be a writable directory: ${path}`);
  }
}

function createArtifactReference(path: string): Readonly<{ file: string; sha256: string }> {
  const resolvedPath = resolve(path);
  return Object.freeze({
    file: resolvedPath,
    sha256: fileSha256(resolvedPath),
  });
}

function createTimestampedArtifactReference(
  path: string,
  createdAt: string,
): Readonly<{ file: string; sha256: string; createdAt: string }> {
  const resolvedPath = resolve(path);
  return Object.freeze({
    createdAt: requireIsoTimestamp(createdAt, `${resolvedPath} createdAt`),
    file: resolvedPath,
    sha256: fileSha256(resolvedPath),
  });
}

function writeJsonFileAtomic(path: string, value: unknown): void {
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  renameSync(tempPath, path);
}

function fileSha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function stableObjectFingerprint(value: unknown): string {
  return sha256Hex(stableStringify(value));
}

function defaultNow(): string {
  return new Date().toISOString();
}

function requireSelectedMode(environment: ReadonlyMap<string, string>): ExternalRuntimeMode {
  const mode = environment.get('BWS_UPSTREAM_MODE');
  if (mode !== 'api' && mode !== 'export') {
    throw new Error('External runtime preflight requires BWS_UPSTREAM_MODE to be exactly api or export.');
  }
  return mode;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const text = requireNonEmptyString(value, label);
  if (!ISO_8601_UTC_MILLISECONDS.test(text)) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return text;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function requirePositiveIntegerString(value: unknown, label: string): number {
  const text = requireNonEmptyString(value, label);
  if (!POSITIVE_INTEGER_PATTERN.test(text)) {
    throw new Error(`${label} must be a base-10 positive integer.`);
  }
  return Number.parseInt(text, 10);
}

function requireSha256(value: unknown, label: string): string {
  const text = requireNonEmptyString(value, label);
  if (!SHA256_PATTERN.test(text)) {
    throw new Error(`${label} must be a 64-character lower-case sha256 value.`);
  }
  return text;
}

function requireToken(value: unknown, label: string): string {
  const text = requireNonEmptyString(value, label);
  if (!TOKEN_PATTERN.test(text)) {
    throw new Error(`${label} must use only ASCII letters, digits, dot, underscore, colon, slash, or hyphen.`);
  }
  return text;
}

function freezeNormalizedTokenArray(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${label} must be a non-empty array.`);
  }
  const normalized = values.map((value, index) => requireToken(value, `${label}[${index}]`));
  const duplicates = new Set<string>();
  for (const token of normalized) {
    if (duplicates.has(token)) {
      throw new Error(`${label} must not contain duplicates.`);
    }
    duplicates.add(token);
  }
  return Object.freeze(normalized);
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function isWithinResolved(parent: string, candidate: string): boolean {
  const relativePath = relative(resolve(parent), resolve(candidate));
  return relativePath.length > 0 && !relativePath.startsWith('..');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}
