import { createHash } from 'node:crypto';
import {
  accessSync,
  constants as fsConstants,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import {
  applySurebetMigrations,
  resolveSurebetPersistenceConfig,
  sha256Hex,
  stableJsonStringify,
  type ApplySurebetMigrationsResult,
  type SurebetPersistenceConfig,
  type SurebetPersistenceEnvironment,
} from '../../../persistence/src/index.js';
import {
  type BwsDatabaseBackupManifest,
  getBwsDatabaseMigrationStatus,
  type BwsMigrationStatusResult,
  type BwsVerifyDatabaseRestoreResult,
} from './database-lifecycle.js';
import {
  getManagedBwsOperatorStackStatus,
  startManagedBwsOperatorStack,
  stopManagedBwsOperatorStack,
  type BwsLifecycleRequest,
  type BwsOperatorLifecycleCommandResult,
} from './operator-lifecycle.js';
import {
  registerBwsEvidenceArtifact,
  type BwsEvidenceIndexEntry,
} from './observability.js';
import {
  type BwsReleaseInstallVerificationResult,
  type BwsReleaseManifest,
} from './release-packaging.js';

const UPGRADE_PLAN_SCHEMA = 'bws.upgrade_plan.v1';
const UPGRADE_CHECKPOINT_SCHEMA = 'bws.upgrade_checkpoint.v1';
const UPGRADE_RESULT_SCHEMA = 'bws.upgrade_result.v1';
const ROLLBACK_DECISION_SCHEMA = 'bws.rollback_decision.v1';
const RECOVERY_RESULT_SCHEMA = 'bws.recovery_result.v1';
const INTERNAL_UPGRADE_STATE_SCHEMA = 'bws.upgrade_state.internal.v1';
const RELEASE_MANIFEST_SCHEMA = 'bws.release_manifest.v1';
const RELEASE_INSTALL_VERIFICATION_SCHEMA = 'bws.release_install_verification.v1';
const DATABASE_BACKUP_MANIFEST_SCHEMA = 'bws.database_backup_manifest.v1';
const DATABASE_RESTORE_VERIFICATION_SCHEMA = 'bws.database_restore_verification.v1';
const RELEASE_MANIFEST_FILE = 'release-manifest.json';
const RELEASE_CHECKSUMS_FILE = 'SHA256SUMS';
const BACKUP_MANIFEST_FILE = 'manifest.json';
const BACKUP_DUMP_FILE = 'surebet.dump';
const BACKUP_CHECKSUMS_FILE = 'SHA256SUMS';
const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;
const SENSITIVE_KEY_PATTERN = /credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token/i;

type UpgradeCheckpointClassification =
  | 'planned_not_started'
  | 'drained_before_backup'
  | 'backup_verified'
  | 'target_staged'
  | 'migrations_started'
  | 'migrations_completed'
  | 'target_started'
  | 'readiness_failed'
  | 'rollback_allowed'
  | 'rollback_blocked'
  | 'recovery_complete';

type UpgradePlanStatus = 'blocked' | 'ready';
type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

interface ReleaseInventoryFile {
  readonly mode: string;
  readonly path: string;
  readonly sha256: string;
  readonly size: number;
}

interface ReleaseMigrationDescriptor {
  readonly migrationName: string;
  readonly path: string;
  readonly sha256: string;
}

export interface BwsReleaseUpgradeEvidenceReference {
  readonly path: string;
  readonly schema: string;
  readonly sha256: string;
}

export interface BwsReleaseIdentity {
  readonly migrationFingerprint: string;
  readonly migrationInventory: readonly ReleaseMigrationDescriptor[];
  readonly packageLockSha256: string;
  readonly packageVersion: string;
  readonly releaseDirectory: string;
  readonly releaseId: string;
  readonly semanticFingerprint: string;
  readonly sourceManifestSha256: string;
  readonly upstreamLockFingerprintSha256: string;
}

export interface BwsReleaseUpgradePlan {
  readonly backupGate: Readonly<{
    readonly backupManifest: BwsReleaseUpgradeEvidenceReference;
    readonly reasons: readonly string[];
    readonly restoreVerification: BwsReleaseUpgradeEvidenceReference;
    readonly status: UpgradePlanStatus;
  }>;
  readonly checkpointing: Readonly<{
    readonly checkpointDirectory: string;
    readonly stateFile: string;
  }>;
  readonly createdAt: string;
  readonly currentRelease: BwsReleaseIdentity;
  readonly database: Readonly<{
    readonly compatibilityReasons: readonly string[];
    readonly currentReleaseMatchesDatabase: boolean;
    readonly identity: BwsMigrationStatusResult['database'];
    readonly pendingMigrationCount: number;
    readonly status: BwsMigrationStatusResult['compatibility']['status'];
  }>;
  readonly environment: Readonly<{
    readonly envFile: string;
    readonly environmentFingerprintSha256: string;
    readonly selectedMode: 'api' | 'export';
  }>;
  readonly evidenceEntries: readonly BwsEvidenceIndexEntry[];
  readonly lifecycle: Readonly<{
    readonly exactOwnerVerified: boolean;
    readonly outcome: UpgradeLifecycleSnapshot['outcome'];
    readonly reasons: readonly string[];
    readonly runtimeId?: string;
    readonly stateFile?: string;
  }>;
  readonly planFingerprint: string;
  readonly policy: Readonly<{
    readonly executionEnabled: false;
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
  }>;
  readonly reasons: readonly string[];
  readonly runtimeStateDirectory: string;
  readonly schema: typeof UPGRADE_PLAN_SCHEMA;
  readonly status: UpgradePlanStatus;
  readonly targetInstallVerification: Readonly<{
    readonly file: BwsReleaseUpgradeEvidenceReference;
    readonly verifiedChecks: readonly string[];
  }>;
  readonly targetRelease: BwsReleaseIdentity;
  readonly upgradeCompatibility: Readonly<{
    readonly pendingTargetMigrations: readonly ReleaseMigrationDescriptor[];
    readonly reasons: readonly string[];
    readonly rollbackReasons: readonly string[];
    readonly rollbackStatus: 'allowed' | 'blocked';
    readonly status: UpgradePlanStatus;
  }>;
}

export interface CreateBwsReleaseUpgradePlanRequest {
  readonly backupPath: string;
  readonly currentReleaseDirectory: string;
  readonly envFile: string;
  readonly evidenceDirectory: string;
  readonly now?: () => string;
  readonly outputFile: string;
  readonly persistenceConfig?: SurebetPersistenceConfig;
  readonly persistenceEnvironment?: SurebetPersistenceEnvironment;
  readonly repositoryRoot?: string;
  readonly restoreVerificationFile: string;
  readonly runtimeStateDirectory: string;
  readonly targetInstallVerificationFile: string;
  readonly targetReleaseDirectory: string;
  readonly upgradeDependencies?: Partial<ReleaseUpgradeDependencies>;
}

export interface BwsReleaseUpgradeCheckpoint {
  readonly classification: UpgradeCheckpointClassification;
  readonly createdAt: string;
  readonly details: Readonly<Record<string, JsonPrimitive>>;
  readonly evidence: readonly BwsReleaseUpgradeEvidenceReference[];
  readonly planFingerprint: string;
  readonly schema: typeof UPGRADE_CHECKPOINT_SCHEMA;
  readonly sequence: number;
  readonly targetReleaseSemanticFingerprint: string;
  readonly currentReleaseSemanticFingerprint: string;
}

export interface ApplyBwsReleaseUpgradeRequest {
  readonly explicitIntent: 'apply';
  readonly now?: () => string;
  readonly planFile: string;
  readonly planFingerprint: string;
  readonly rollbackOnFailure?: boolean;
  readonly upgradeDependencies?: Partial<ReleaseUpgradeDependencies>;
}

export interface BwsReleaseUpgradeResult {
  readonly appliedMigrationCount: number;
  readonly checkpointFiles: readonly BwsReleaseUpgradeEvidenceReference[];
  readonly createdAt: string;
  readonly currentRelease: BwsReleaseIdentity;
  readonly evidenceEntries: readonly BwsEvidenceIndexEntry[];
  readonly outcome:
    | 'recovery_required'
    | 'rollback_applied'
    | 'rollback_blocked'
    | 'upgrade_applied';
  readonly planFingerprint: string;
  readonly resultFile: string;
  readonly rollbackDecisionFile?: string;
  readonly runtimeStateDirectory: string;
  readonly schema: typeof UPGRADE_RESULT_SCHEMA;
  readonly stateFile: string;
  readonly targetRelease: BwsReleaseIdentity;
  readonly terminalCheckpoint: UpgradeCheckpointClassification;
}

export interface EvaluateBwsReleaseRollbackDecisionRequest {
  readonly now?: () => string;
  readonly outputFile?: string;
  readonly planFile: string;
  readonly planFingerprint: string;
  readonly upgradeDependencies?: Partial<ReleaseUpgradeDependencies>;
}

export interface BwsReleaseRollbackDecision {
  readonly backupEvidenceValid: boolean;
  readonly createdAt: string;
  readonly currentRelease: BwsReleaseIdentity;
  readonly databaseMatchesCurrentRelease: boolean;
  readonly evidenceEntries: readonly BwsEvidenceIndexEntry[];
  readonly lifecycleExactOwnerVerified: boolean;
  readonly planFingerprint: string;
  readonly reasons: readonly string[];
  readonly resultFile?: string;
  readonly rollbackStatus: 'allowed' | 'blocked';
  readonly schema: typeof ROLLBACK_DECISION_SCHEMA;
  readonly targetRelease: BwsReleaseIdentity;
}

export interface RecoverBwsReleaseUpgradeRequest {
  readonly explicitIntent: 'recover';
  readonly now?: () => string;
  readonly planFile: string;
  readonly planFingerprint: string;
  readonly rollbackOnFailure?: boolean;
  readonly upgradeDependencies?: Partial<ReleaseUpgradeDependencies>;
}

export interface BwsReleaseRecoveryResult {
  readonly checkpointFiles: readonly BwsReleaseUpgradeEvidenceReference[];
  readonly createdAt: string;
  readonly evidenceEntries: readonly BwsEvidenceIndexEntry[];
  readonly outcome: 'recovery_complete' | 'recovery_required' | 'rollback_blocked';
  readonly planFingerprint: string;
  readonly resultFile: string;
  readonly schema: typeof RECOVERY_RESULT_SCHEMA;
  readonly stateFile: string;
  readonly terminalCheckpoint: UpgradeCheckpointClassification;
}

interface PersistedUpgradeState {
  readonly checkpoints: readonly PersistedCheckpointRecord[];
  readonly currentReleaseSemanticFingerprint: string;
  readonly latestResultFile?: string;
  readonly planFingerprint: string;
  readonly resolved: boolean;
  readonly schema: typeof INTERNAL_UPGRADE_STATE_SCHEMA;
  readonly targetReleaseSemanticFingerprint: string;
  readonly terminalCheckpoint?: UpgradeCheckpointClassification;
}

interface PersistedCheckpointRecord {
  readonly classification: UpgradeCheckpointClassification;
  readonly createdAt: string;
  readonly file: string;
  readonly sequence: number;
  readonly sha256: string;
}

interface VerifiedBackupEvidence {
  readonly backupManifest: BwsDatabaseBackupManifest;
  readonly backupManifestFile: string;
  readonly restoreVerification: BwsVerifyDatabaseRestoreResult;
  readonly restoreVerificationFile: string;
}

interface VerifiedTargetInstallEvidence {
  readonly result: BwsReleaseInstallVerificationResult;
  readonly resultFile: string;
}

interface UpgradeLifecycleSnapshot {
  readonly blockers: readonly string[];
  readonly healthStatus: 'blocked' | 'degraded' | 'healthy';
  readonly outcome:
    | 'already_running'
    | 'already_stopped'
    | 'degraded'
    | 'not_running'
    | 'running'
    | 'started'
    | 'stale_state_cleaned'
    | 'stopped';
  readonly readinessStatus: 'blocked' | 'degraded' | 'ready';
  readonly runtimeId?: string;
  readonly stateFile?: string;
}

interface UpgradeMigrationApplySummary {
  readonly appliedCount: number;
  readonly skippedCount: number;
}

interface ReleaseUpgradeDependencies {
  readonly applyMigrations: (
    persistenceConfig: SurebetPersistenceConfig,
    repositoryRoot: string,
  ) => UpgradeMigrationApplySummary;
  readonly getLifecycleStatus: (
    request: BwsLifecycleRequest,
  ) => Promise<UpgradeLifecycleSnapshot>;
  readonly getMigrationStatus: (
    input: Readonly<{
      readonly now: () => string;
      readonly persistenceConfig: SurebetPersistenceConfig;
      readonly repositoryRoot: string;
    }>,
  ) => BwsMigrationStatusResult;
  readonly startLifecycle: (
    request: BwsLifecycleRequest,
  ) => Promise<UpgradeLifecycleSnapshot>;
  readonly stopLifecycle: (
    request: BwsLifecycleRequest,
  ) => Promise<UpgradeLifecycleSnapshot>;
  readonly testHooks: Readonly<{
    readonly failAfterCheckpoint?: UpgradeCheckpointClassification;
  }>;
}

export async function createBwsReleaseUpgradePlan(
  request: CreateBwsReleaseUpgradePlanRequest,
): Promise<BwsReleaseUpgradePlan> {
  const now = request.now === undefined ? defaultNow : request.now;
  const createdAt = requireIsoTimestamp(now(), 'createdAt');
  const dependencies = resolveUpgradeDependencies(request.upgradeDependencies);
  const currentReleaseDirectory = resolve(request.currentReleaseDirectory);
  const targetReleaseDirectory = resolve(request.targetReleaseDirectory);
  const evidenceDirectory = resolve(request.evidenceDirectory);
  const outputFile = resolve(request.outputFile);
  const runtimeStateDirectory = resolve(request.runtimeStateDirectory);
  const repositoryRoot = request.repositoryRoot === undefined
    ? currentReleaseDirectory
    : resolve(request.repositoryRoot);
  ensureDirectoryWritable(evidenceDirectory, 'evidenceDirectory');
  ensureDirectoryWritable(runtimeStateDirectory, 'runtimeStateDirectory');
  ensureParentDirectory(outputFile);

  const currentRelease = verifyAndReadReleaseIdentity(currentReleaseDirectory);
  const targetRelease = verifyAndReadReleaseIdentity(targetReleaseDirectory);
  const environment = readStrictEnvironmentFile(request.envFile);
  const selectedMode = requireSelectedMode(environment);
  validateClosedPolicy(environment);
  const persistenceConfig = request.persistenceConfig === undefined
    ? resolveSurebetPersistenceConfig(
      request.persistenceEnvironment === undefined
        ? Object.fromEntries(environment) as SurebetPersistenceEnvironment
        : request.persistenceEnvironment,
    )
    : request.persistenceConfig;
  const migrationStatus = dependencies.getMigrationStatus({
    now,
    persistenceConfig,
    repositoryRoot: currentReleaseDirectory,
  });
  const backupEvidence = verifyBackupEvidence(request.backupPath, request.restoreVerificationFile);
  const targetInstallVerification = verifyTargetInstallEvidence(
    targetRelease,
    request.targetInstallVerificationFile,
  );
  const lifecycleSnapshot = await dependencies.getLifecycleStatus(
    buildLifecycleRequest(currentReleaseDirectory, environment, runtimeStateDirectory),
  );

  const databaseCompatibilityReasons = buildCurrentReleaseDatabaseCompatibilityReasons(
    currentRelease,
    migrationStatus,
    backupEvidence,
  );
  const lifecycleReasons = buildLifecyclePlanReasons(lifecycleSnapshot);
  const upgradeCompatibility = buildUpgradeCompatibility(currentRelease, targetRelease, migrationStatus);
  const backupReasons = buildBackupGateReasons(backupEvidence, migrationStatus);
  const planReasons = [
    ...databaseCompatibilityReasons,
    ...lifecycleReasons,
    ...backupReasons,
    ...upgradeCompatibility.reasons,
  ];
  const planStatus: UpgradePlanStatus = planReasons.length === 0 ? 'ready' : 'blocked';
  const planFingerprint = stableFingerprint({
    backupManifestSha256: fileSha256(backupEvidence.backupManifestFile),
    currentReleaseDirectory,
    currentReleaseSemanticFingerprint: currentRelease.semanticFingerprint,
    databaseIdentity: migrationStatus.database,
    databaseStatus: migrationStatus.compatibility.status,
    environmentFingerprintSha256: sha256Hex(readFileSync(resolve(request.envFile), 'utf-8')),
    lifecycleOutcome: lifecycleSnapshot.outcome,
    lifecycleReadiness: lifecycleSnapshot.readinessStatus,
    restoreVerificationSha256: fileSha256(backupEvidence.restoreVerificationFile),
    runtimeStateDirectory,
    selectedMode,
    targetInstallVerificationSha256: fileSha256(targetInstallVerification.resultFile),
    targetReleaseDirectory,
    targetReleaseSemanticFingerprint: targetRelease.semanticFingerprint,
    upgradeCompatibilityStatus: upgradeCompatibility.status,
  });
  const checkpointing = Object.freeze({
    checkpointDirectory: join(evidenceDirectory, 'checkpoints'),
    stateFile: join(evidenceDirectory, 'upgrade-state.json'),
  });
  mkdirSync(checkpointing.checkpointDirectory, { recursive: true });

  const plan: BwsReleaseUpgradePlan = Object.freeze({
    backupGate: Object.freeze({
      backupManifest: createEvidenceReference(repositoryRoot, backupEvidence.backupManifestFile, DATABASE_BACKUP_MANIFEST_SCHEMA),
      reasons: Object.freeze(backupReasons),
      restoreVerification: createEvidenceReference(
        repositoryRoot,
        backupEvidence.restoreVerificationFile,
        DATABASE_RESTORE_VERIFICATION_SCHEMA,
      ),
      status: backupReasons.length === 0 ? 'ready' : 'blocked',
    }),
    checkpointing,
    createdAt,
    currentRelease,
    database: Object.freeze({
      compatibilityReasons: Object.freeze(databaseCompatibilityReasons),
      currentReleaseMatchesDatabase: databaseCompatibilityReasons.length === 0,
      identity: migrationStatus.database,
      pendingMigrationCount: migrationStatus.migrationLedger.pending.length,
      status: migrationStatus.compatibility.status,
    }),
    environment: Object.freeze({
      envFile: resolve(request.envFile),
      environmentFingerprintSha256: sha256Hex(readFileSync(resolve(request.envFile), 'utf-8')),
      selectedMode,
    }),
    evidenceEntries: Object.freeze([]),
    lifecycle: Object.freeze({
      exactOwnerVerified: lifecycleReasons.length === 0,
      outcome: lifecycleSnapshot.outcome,
      reasons: Object.freeze(lifecycleReasons),
      ...(lifecycleSnapshot.runtimeId === undefined ? {} : { runtimeId: lifecycleSnapshot.runtimeId }),
      ...(lifecycleSnapshot.stateFile === undefined ? {} : { stateFile: lifecycleSnapshot.stateFile }),
    }),
    planFingerprint,
    policy: Object.freeze({
      executionEnabled: false,
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    }),
    reasons: Object.freeze(planReasons),
    runtimeStateDirectory,
    schema: UPGRADE_PLAN_SCHEMA,
    status: planStatus,
    targetInstallVerification: Object.freeze({
      file: createEvidenceReference(repositoryRoot, targetInstallVerification.resultFile, RELEASE_INSTALL_VERIFICATION_SCHEMA),
      verifiedChecks: targetInstallVerification.result.verifiedChecks,
    }),
    targetRelease,
    upgradeCompatibility: Object.freeze(upgradeCompatibility),
  });
  writeJsonFileAtomic(outputFile, plan);
  const evidenceEntries = registerRecoveryEvidence(
    repositoryRoot,
    planFingerprint,
    currentRelease.sourceManifestSha256,
    [Object.freeze({
      artifactPath: outputFile,
      artifactSchema: UPGRADE_PLAN_SCHEMA,
    })],
  );
  const finalizedPlan: BwsReleaseUpgradePlan = Object.freeze({
    ...plan,
    evidenceEntries,
  });
  writeJsonFileAtomic(outputFile, finalizedPlan);
  return finalizedPlan;
}

export async function applyBwsReleaseUpgrade(
  request: ApplyBwsReleaseUpgradeRequest,
): Promise<BwsReleaseUpgradeResult> {
  if (request.explicitIntent !== 'apply') {
    throw new Error('BWS release upgrade apply requires explicitIntent=apply.');
  }
  const plan = readUpgradePlan(request.planFile);
  assertPlanFingerprint(plan, request.planFingerprint);
  if (plan.status !== 'ready') {
    throw new Error(`Upgrade plan ${plan.planFingerprint} is blocked and cannot be applied.`);
  }
  const now = request.now === undefined ? defaultNow : request.now;
  const dependencies = resolveUpgradeDependencies(request.upgradeDependencies);
  const environment = readStrictEnvironmentFile(plan.environment.envFile);
  const persistenceConfig = resolveSurebetPersistenceConfig(Object.fromEntries(environment) as SurebetPersistenceEnvironment);
  ensureDirectoryWritable(dirname(plan.checkpointing.stateFile), 'upgrade state parent directory');
  mkdirSync(plan.checkpointing.checkpointDirectory, { recursive: true });

  const state = readOrCreateUpgradeState(plan, now);
  if (!state.resolved && state.planFingerprint !== plan.planFingerprint) {
    throw new Error(`Unresolved upgrade state belongs to a different plan fingerprint: ${state.planFingerprint}`);
  }

  let mutableState = state;
  const checkpointFiles = state.checkpoints.map((entry) =>
    createEvidenceReference(plan.currentRelease.releaseDirectory, join(plan.currentRelease.releaseDirectory, entry.file), UPGRADE_CHECKPOINT_SCHEMA),
  );
  const lifecycleRequest = buildLifecycleRequest(
    plan.currentRelease.releaseDirectory,
    environment,
    plan.runtimeStateDirectory,
  );

  mutableState = appendCheckpointIfMissing(
    mutableState,
    plan,
    'planned_not_started',
    now,
    Object.freeze({ planStatus: plan.status }),
    Object.freeze([]),
    dependencies,
  );

  if (!hasCheckpoint(mutableState, 'drained_before_backup')) {
    const lifecycle = await dependencies.getLifecycleStatus(lifecycleRequest);
    const exactOwnerReasons = buildLifecyclePlanReasons(lifecycle);
    if (exactOwnerReasons.length > 0) {
      throw new Error(`Upgrade apply requires exact lifecycle ownership or a confirmed stopped state: ${exactOwnerReasons.join(' ')}`);
    }
    if (lifecycle.outcome === 'running' || lifecycle.outcome === 'already_running') {
      await dependencies.stopLifecycle(lifecycleRequest);
    }
    mutableState = appendCheckpointIfMissing(
      mutableState,
      plan,
      'drained_before_backup',
      now,
      Object.freeze({ lifecycleStopped: true }),
      Object.freeze([]),
      dependencies,
    );
  }

  const backupManifestReference = toAbsoluteEvidencePath(plan.currentRelease.releaseDirectory, plan.backupGate.backupManifest.path);
  const restoreVerificationReference = toAbsoluteEvidencePath(plan.currentRelease.releaseDirectory, plan.backupGate.restoreVerification.path);
  if (!hasCheckpoint(mutableState, 'backup_verified')) {
    verifyBackupEvidence(backupManifestReference === undefined ? fail('Missing backup manifest path.') : dirname(backupManifestReference), restoreVerificationReference === undefined ? fail('Missing restore verification path.') : restoreVerificationReference);
    mutableState = appendCheckpointIfMissing(
      mutableState,
      plan,
      'backup_verified',
      now,
      Object.freeze({ backupVerified: true }),
      Object.freeze([
        createEvidenceReference(
          plan.currentRelease.releaseDirectory,
          backupManifestReference === undefined ? fail('Missing backup manifest path.') : backupManifestReference,
          DATABASE_BACKUP_MANIFEST_SCHEMA,
        ),
        createEvidenceReference(
          plan.currentRelease.releaseDirectory,
          restoreVerificationReference === undefined ? fail('Missing restore verification path.') : restoreVerificationReference,
          DATABASE_RESTORE_VERIFICATION_SCHEMA,
        ),
      ]),
      dependencies,
    );
  }

  if (!hasCheckpoint(mutableState, 'target_staged')) {
    verifyTargetInstallEvidence(
      plan.targetRelease,
      toAbsoluteEvidencePath(
        plan.currentRelease.releaseDirectory,
        plan.targetInstallVerification.file.path,
      ) === undefined
        ? fail('Missing target install verification path.')
        : toAbsoluteEvidencePath(plan.currentRelease.releaseDirectory, plan.targetInstallVerification.file.path)!,
    );
    mutableState = appendCheckpointIfMissing(
      mutableState,
      plan,
      'target_staged',
      now,
      Object.freeze({ targetReleaseVerified: true }),
      Object.freeze([plan.targetInstallVerification.file]),
      dependencies,
    );
  }

  let appliedMigrationCount = 0;
  if (!hasCheckpoint(mutableState, 'migrations_started')) {
    mutableState = appendCheckpointIfMissing(
      mutableState,
      plan,
      'migrations_started',
      now,
      Object.freeze({ targetMigrationCount: plan.upgradeCompatibility.pendingTargetMigrations.length }),
      Object.freeze([]),
      dependencies,
    );
  }
  if (!hasCheckpoint(mutableState, 'migrations_completed')) {
    const summary = dependencies.applyMigrations(persistenceConfig, plan.targetRelease.releaseDirectory);
    appliedMigrationCount = summary.appliedCount;
    mutableState = appendCheckpointIfMissing(
      mutableState,
      plan,
      'migrations_completed',
      now,
      Object.freeze({ appliedMigrationCount: summary.appliedCount, skippedMigrationCount: summary.skippedCount }),
      Object.freeze([]),
      dependencies,
    );
  }

  if (!hasCheckpoint(mutableState, 'target_started')) {
    try {
      await dependencies.startLifecycle(
        buildLifecycleRequest(
          plan.targetRelease.releaseDirectory,
          environment,
          plan.runtimeStateDirectory,
        ),
      );
      mutableState = appendCheckpointIfMissing(
        mutableState,
        plan,
        'target_started',
        now,
        Object.freeze({ targetStarted: true }),
        Object.freeze([]),
        dependencies,
      );
    } catch (error) {
      mutableState = appendCheckpointIfMissing(
        mutableState,
        plan,
        'readiness_failed',
        now,
        Object.freeze({ readinessFailed: true }),
        Object.freeze([]),
        dependencies,
      );
      const rollbackDecisionRequest: EvaluateBwsReleaseRollbackDecisionRequest = {
        now,
        planFile: request.planFile,
        planFingerprint: request.planFingerprint,
      };
      if (request.upgradeDependencies !== undefined) {
        Object.assign(rollbackDecisionRequest, { upgradeDependencies: request.upgradeDependencies });
      }
      const rollbackDecision = await evaluateBwsReleaseRollbackDecision(rollbackDecisionRequest);
      if (request.rollbackOnFailure === true && rollbackDecision.rollbackStatus === 'allowed') {
        mutableState = appendCheckpointIfMissing(
          mutableState,
          plan,
          'rollback_allowed',
          now,
          Object.freeze({ rollbackRequested: true }),
          Object.freeze([]),
          dependencies,
        );
        await dependencies.startLifecycle(lifecycleRequest);
        mutableState = appendCheckpointIfMissing(
          mutableState,
          plan,
          'recovery_complete',
          now,
          Object.freeze({ recoveryComplete: true, rolledBack: true }),
          Object.freeze([]),
          dependencies,
          true,
        );
        const result = writeUpgradeResult(
          plan,
          mutableState,
          now,
          'rollback_applied',
          rollbackDecision.resultFile,
          appliedMigrationCount,
        );
        return result;
      }
      if (rollbackDecision.rollbackStatus === 'blocked') {
        mutableState = appendCheckpointIfMissing(
          mutableState,
          plan,
          'rollback_blocked',
          now,
          Object.freeze({ rollbackRequested: request.rollbackOnFailure === true }),
          Object.freeze([]),
          dependencies,
          true,
        );
        const result = writeUpgradeResult(
          plan,
          mutableState,
          now,
          'rollback_blocked',
          rollbackDecision.resultFile,
          appliedMigrationCount,
        );
        void error;
        return result;
      }
      const result = writeUpgradeResult(
        plan,
        mutableState,
        now,
        'recovery_required',
        rollbackDecision.resultFile,
        appliedMigrationCount,
      );
      void error;
      return result;
    }
  }

  mutableState = appendCheckpointIfMissing(
    mutableState,
    plan,
    'recovery_complete',
    now,
    Object.freeze({ recoveryComplete: true, rolledBack: false }),
    Object.freeze([]),
    dependencies,
    true,
  );
  return writeUpgradeResult(plan, mutableState, now, 'upgrade_applied', undefined, appliedMigrationCount);
}

export async function evaluateBwsReleaseRollbackDecision(
  request: EvaluateBwsReleaseRollbackDecisionRequest,
): Promise<BwsReleaseRollbackDecision> {
  const plan = readUpgradePlan(request.planFile);
  assertPlanFingerprint(plan, request.planFingerprint);
  const now = request.now === undefined ? defaultNow : request.now;
  const dependencies = resolveUpgradeDependencies(request.upgradeDependencies);
  const environment = readStrictEnvironmentFile(plan.environment.envFile);
  const persistenceConfig = resolveSurebetPersistenceConfig(Object.fromEntries(environment) as SurebetPersistenceEnvironment);
  const migrationStatus = dependencies.getMigrationStatus({
    now,
    persistenceConfig,
    repositoryRoot: plan.currentRelease.releaseDirectory,
  });
  const lifecycle = await dependencies.getLifecycleStatus(
    buildLifecycleRequest(plan.currentRelease.releaseDirectory, environment, plan.runtimeStateDirectory),
  );
  const reasons = [
    ...buildCurrentReleaseMigrationMismatchReasons(plan.currentRelease, migrationStatus),
    ...buildLifecyclePlanReasons(lifecycle),
    ...plan.upgradeCompatibility.rollbackReasons,
  ];
  const resultFile = request.outputFile === undefined ? undefined : resolve(request.outputFile);
  if (resultFile !== undefined) {
    ensureParentDirectory(resultFile);
  }
  const decision: BwsReleaseRollbackDecision = Object.freeze({
    backupEvidenceValid: plan.backupGate.status === 'ready',
    createdAt: requireIsoTimestamp(now(), 'createdAt'),
    currentRelease: plan.currentRelease,
    databaseMatchesCurrentRelease: buildCurrentReleaseMigrationMismatchReasons(plan.currentRelease, migrationStatus).length === 0,
    evidenceEntries: Object.freeze([]),
    lifecycleExactOwnerVerified: buildLifecyclePlanReasons(lifecycle).length === 0,
    planFingerprint: plan.planFingerprint,
    reasons: Object.freeze(reasons),
    ...(resultFile === undefined ? {} : { resultFile }),
    rollbackStatus: reasons.length === 0 ? 'allowed' : 'blocked',
    schema: ROLLBACK_DECISION_SCHEMA,
    targetRelease: plan.targetRelease,
  });
  if (resultFile === undefined) {
    return decision;
  }
  writeJsonFileAtomic(resultFile, decision);
  const evidenceEntries = registerRecoveryEvidence(
    plan.currentRelease.releaseDirectory,
    plan.planFingerprint,
    plan.currentRelease.sourceManifestSha256,
    [Object.freeze({
      artifactPath: resultFile,
      artifactSchema: ROLLBACK_DECISION_SCHEMA,
    })],
  );
  const finalized: BwsReleaseRollbackDecision = Object.freeze({
    ...decision,
    evidenceEntries,
  });
  writeJsonFileAtomic(resultFile, finalized);
  return finalized;
}

export async function recoverBwsReleaseUpgrade(
  request: RecoverBwsReleaseUpgradeRequest,
): Promise<BwsReleaseRecoveryResult> {
  if (request.explicitIntent !== 'recover') {
    throw new Error('BWS release upgrade recovery requires explicitIntent=recover.');
  }
  const upgradeApplyRequest: ApplyBwsReleaseUpgradeRequest = {
    explicitIntent: 'apply',
    planFile: request.planFile,
    planFingerprint: request.planFingerprint,
  };
  if (request.now !== undefined) {
    Object.assign(upgradeApplyRequest, { now: request.now });
  }
  if (request.rollbackOnFailure !== undefined) {
    Object.assign(upgradeApplyRequest, { rollbackOnFailure: request.rollbackOnFailure });
  }
  if (request.upgradeDependencies !== undefined) {
    Object.assign(upgradeApplyRequest, { upgradeDependencies: request.upgradeDependencies });
  }
  const upgradeResult = await applyBwsReleaseUpgrade(upgradeApplyRequest);
  const createdAt = request.now === undefined ? defaultNow() : request.now();
  const plan = readUpgradePlan(request.planFile);
  const resultFile = join(dirname(plan.checkpointing.stateFile), `recovery-result-${sanitizeToken(createdAt)}.json`);
  const recoveryResult: BwsReleaseRecoveryResult = Object.freeze({
    checkpointFiles: upgradeResult.checkpointFiles,
    createdAt: requireIsoTimestamp(createdAt, 'createdAt'),
    evidenceEntries: Object.freeze([]),
    outcome: upgradeResult.outcome === 'upgrade_applied' || upgradeResult.outcome === 'rollback_applied'
      ? 'recovery_complete'
      : upgradeResult.outcome === 'rollback_blocked'
        ? 'rollback_blocked'
        : 'recovery_required',
    planFingerprint: upgradeResult.planFingerprint,
    resultFile,
    schema: RECOVERY_RESULT_SCHEMA,
    stateFile: upgradeResult.stateFile,
    terminalCheckpoint: upgradeResult.terminalCheckpoint,
  });
  writeJsonFileAtomic(resultFile, recoveryResult);
  const evidenceEntries = registerRecoveryEvidence(
    plan.currentRelease.releaseDirectory,
    plan.planFingerprint,
    plan.currentRelease.sourceManifestSha256,
    [Object.freeze({
      artifactPath: resultFile,
      artifactSchema: RECOVERY_RESULT_SCHEMA,
    })],
  );
  const finalized: BwsReleaseRecoveryResult = Object.freeze({
    ...recoveryResult,
    evidenceEntries,
  });
  writeJsonFileAtomic(resultFile, finalized);
  return finalized;
}

function writeUpgradeResult(
  plan: BwsReleaseUpgradePlan,
  state: PersistedUpgradeState,
  now: () => string,
  outcome: BwsReleaseUpgradeResult['outcome'],
  rollbackDecisionFile: string | undefined,
  appliedMigrationCount: number,
): BwsReleaseUpgradeResult {
  const createdAt = requireIsoTimestamp(now(), 'createdAt');
  const resultFile = join(
    dirname(plan.checkpointing.stateFile),
    `upgrade-result-${sanitizeToken(createdAt)}.json`,
  );
  const checkpointFiles = state.checkpoints.map((entry) =>
    createEvidenceReference(
      plan.currentRelease.releaseDirectory,
      join(plan.currentRelease.releaseDirectory, entry.file),
      UPGRADE_CHECKPOINT_SCHEMA,
    ));
  const result: BwsReleaseUpgradeResult = Object.freeze({
    appliedMigrationCount,
    checkpointFiles: Object.freeze(checkpointFiles),
    createdAt,
    currentRelease: plan.currentRelease,
    evidenceEntries: Object.freeze([]),
    outcome,
    planFingerprint: plan.planFingerprint,
    resultFile,
    ...(rollbackDecisionFile === undefined ? {} : { rollbackDecisionFile }),
    runtimeStateDirectory: plan.runtimeStateDirectory,
    schema: UPGRADE_RESULT_SCHEMA,
    stateFile: plan.checkpointing.stateFile,
    targetRelease: plan.targetRelease,
    terminalCheckpoint: state.terminalCheckpoint === undefined ? lastCheckpointClassification(state) : state.terminalCheckpoint,
  });
  writeJsonFileAtomic(resultFile, result);
  const evidenceEntries = registerRecoveryEvidence(
    plan.currentRelease.releaseDirectory,
    plan.planFingerprint,
    plan.currentRelease.sourceManifestSha256,
    [Object.freeze({
      artifactPath: resultFile,
      artifactSchema: UPGRADE_RESULT_SCHEMA,
    })],
  );
  const finalized: BwsReleaseUpgradeResult = Object.freeze({
    ...result,
    evidenceEntries,
  });
  writeJsonFileAtomic(resultFile, finalized);
  const nextState: PersistedUpgradeState = Object.freeze({
    ...state,
    latestResultFile: relative(plan.currentRelease.releaseDirectory, resultFile),
  });
  writeUpgradeState(plan, nextState);
  return finalized;
}

function resolveUpgradeDependencies(
  override: Partial<ReleaseUpgradeDependencies> | undefined,
): ReleaseUpgradeDependencies {
  const base: ReleaseUpgradeDependencies = Object.freeze({
    applyMigrations(persistenceConfig: SurebetPersistenceConfig, repositoryRoot: string): UpgradeMigrationApplySummary {
      const result: ApplySurebetMigrationsResult = applySurebetMigrations(
        persistenceConfig,
        Object.freeze({ repositoryRoot }),
      );
      return Object.freeze({
        appliedCount: result.applied.length,
        skippedCount: result.skipped.length,
      });
    },
    async getLifecycleStatus(request: BwsLifecycleRequest): Promise<UpgradeLifecycleSnapshot> {
      return toUpgradeLifecycleSnapshot(await getManagedBwsOperatorStackStatus(request));
    },
    getMigrationStatus(input: Readonly<{
      readonly now: () => string;
      readonly persistenceConfig: SurebetPersistenceConfig;
      readonly repositoryRoot: string;
    }>): BwsMigrationStatusResult {
      return getBwsDatabaseMigrationStatus({
        now: input.now,
        persistenceConfig: input.persistenceConfig,
        repositoryRoot: input.repositoryRoot,
      });
    },
    async startLifecycle(request: BwsLifecycleRequest): Promise<UpgradeLifecycleSnapshot> {
      return toUpgradeLifecycleSnapshot(await startManagedBwsOperatorStack(request));
    },
    async stopLifecycle(request: BwsLifecycleRequest): Promise<UpgradeLifecycleSnapshot> {
      return toUpgradeLifecycleSnapshot(await stopManagedBwsOperatorStack(request));
    },
    testHooks: Object.freeze({}),
  });
  if (override === undefined) {
    return base;
  }
  return Object.freeze({
    applyMigrations: override.applyMigrations === undefined ? base.applyMigrations : override.applyMigrations,
    getLifecycleStatus: override.getLifecycleStatus === undefined ? base.getLifecycleStatus : override.getLifecycleStatus,
    getMigrationStatus: override.getMigrationStatus === undefined ? base.getMigrationStatus : override.getMigrationStatus,
    startLifecycle: override.startLifecycle === undefined ? base.startLifecycle : override.startLifecycle,
    stopLifecycle: override.stopLifecycle === undefined ? base.stopLifecycle : override.stopLifecycle,
    testHooks: override.testHooks === undefined ? base.testHooks : override.testHooks,
  });
}

function toUpgradeLifecycleSnapshot(result: BwsOperatorLifecycleCommandResult): UpgradeLifecycleSnapshot {
  return Object.freeze({
    blockers: result.stack.blockers,
    healthStatus: result.stack.healthStatus,
    outcome: result.outcome,
    readinessStatus: result.stack.readinessStatus,
    ...(result.runtimeId === undefined ? {} : { runtimeId: result.runtimeId }),
    ...(result.stateFile === undefined ? {} : { stateFile: result.stateFile }),
  });
}

function buildLifecycleRequest(
  repositoryRoot: string,
  environment: ReadonlyMap<string, string>,
  runtimeStateDirectory: string,
): BwsLifecycleRequest {
  const request: BwsLifecycleRequest = {
    repositoryRoot,
    runtimeStateDirectory,
  };
  Object.assign(
    request,
    { environment: Object.freeze(Object.fromEntries(environment) as SurebetPersistenceEnvironment) },
  );
  return Object.freeze(request);
}

function buildCurrentReleaseDatabaseCompatibilityReasons(
  currentRelease: BwsReleaseIdentity,
  migrationStatus: BwsMigrationStatusResult,
  backupEvidence: VerifiedBackupEvidence,
): readonly string[] {
  const reasons = buildCurrentReleaseMigrationMismatchReasons(currentRelease, migrationStatus);
  if (migrationStatus.compatibility.status !== 'compatible') {
    reasons.push(...migrationStatus.compatibility.reasons);
  }
  const liveFingerprint = stableFingerprint(migrationStatus.migrationLedger.applied);
  const backupFingerprint = stableFingerprint(backupEvidence.backupManifest.migrationLedger.applied);
  if (liveFingerprint !== backupFingerprint) {
    reasons.push('Backup manifest migrations do not match the current database migration ledger.');
  }
  return Object.freeze(reasons);
}

function buildCurrentReleaseMigrationMismatchReasons(
  currentRelease: BwsReleaseIdentity,
  migrationStatus: BwsMigrationStatusResult,
): string[] {
  const reasons: string[] = [];
  const applied = migrationStatus.migrationLedger.applied;
  const currentMigrations = currentRelease.migrationInventory;
  if (applied.length !== currentMigrations.length) {
    reasons.push('Current database migration count does not match the current release migration inventory.');
    return reasons;
  }
  for (let index = 0; index < currentMigrations.length; index += 1) {
    const expected = currentMigrations[index];
    const actual = applied[index];
    if (
      expected === undefined
      || actual === undefined
      || expected.migrationName !== actual.migrationName
      || expected.sha256 !== actual.sha256
    ) {
      reasons.push('Current database migration ledger does not exactly match the current release migration inventory.');
      break;
    }
  }
  return reasons;
}

function buildLifecyclePlanReasons(snapshot: UpgradeLifecycleSnapshot): string[] {
  if (snapshot.outcome === 'not_running' || snapshot.outcome === 'already_stopped') {
    return [];
  }
  if (snapshot.outcome === 'running' || snapshot.outcome === 'already_running') {
    if (snapshot.healthStatus === 'healthy' || snapshot.readinessStatus === 'ready') {
      return [];
    }
    return [
      'Lifecycle ownership is present but the stack is not healthy and ready enough for an exact upgrade drain.',
      ...snapshot.blockers,
    ];
  }
  return [
    `Lifecycle ownership is ambiguous or degraded with outcome ${snapshot.outcome}.`,
    ...snapshot.blockers,
  ];
}

function buildUpgradeCompatibility(
  currentRelease: BwsReleaseIdentity,
  targetRelease: BwsReleaseIdentity,
  migrationStatus: BwsMigrationStatusResult,
): BwsReleaseUpgradePlan['upgradeCompatibility'] {
  const reasons: string[] = [];
  const rollbackReasons: string[] = [];
  if (currentRelease.upstreamLockFingerprintSha256 !== targetRelease.upstreamLockFingerprintSha256) {
    reasons.push('Target release upstream lock fingerprint does not match the current release fingerprint.');
  }
  const applied = migrationStatus.migrationLedger.applied;
  const targetMigrations = targetRelease.migrationInventory;
  if (applied.length > targetMigrations.length) {
    reasons.push('Target release migration inventory is older than the currently applied surebet schema.');
  }
  for (let index = 0; index < applied.length && index < targetMigrations.length; index += 1) {
    const live = applied[index];
    const target = targetMigrations[index];
    if (
      live === undefined
      || target === undefined
      || live.migrationName !== target.migrationName
      || live.sha256 !== target.sha256
    ) {
      reasons.push('Target release migration inventory is not forward-compatible with the current database migration ledger.');
      break;
    }
  }
  if (currentRelease.migrationFingerprint !== targetRelease.migrationFingerprint) {
    rollbackReasons.push('Rollback is blocked because the target release changes the surebet migration inventory.');
  }
  const pendingTargetMigrations = targetMigrations.slice(applied.length);
  return Object.freeze({
    pendingTargetMigrations: Object.freeze(pendingTargetMigrations),
    reasons: Object.freeze(reasons),
    rollbackReasons: Object.freeze(rollbackReasons),
    rollbackStatus: rollbackReasons.length === 0 ? 'allowed' : 'blocked',
    status: reasons.length === 0 ? 'ready' : 'blocked',
  });
}

function buildBackupGateReasons(
  backupEvidence: VerifiedBackupEvidence,
  migrationStatus: BwsMigrationStatusResult,
): string[] {
  const reasons: string[] = [];
  const restoreFingerprint = stableFingerprint(backupEvidence.restoreVerification.backupManifest.migrationLedger.applied);
  const backupFingerprint = stableFingerprint(backupEvidence.backupManifest.migrationLedger.applied);
  const liveFingerprint = stableFingerprint(migrationStatus.migrationLedger.applied);
  if (restoreFingerprint !== backupFingerprint) {
    reasons.push('Restore verification does not reference the same backup manifest migration ledger.');
  }
  if (liveFingerprint !== backupFingerprint) {
    reasons.push('Backup manifest does not match the current database migration ledger.');
  }
  return reasons;
}

function verifyAndReadReleaseIdentity(releaseDirectory: string): BwsReleaseIdentity {
  const manifest = readReleaseManifest(releaseDirectory);
  verifyReleaseChecksums(releaseDirectory);
  verifyReleaseInventory(releaseDirectory, manifest.source.files);
  verifyReleaseInventory(releaseDirectory, manifest.builtRuntime.files);
  verifyReleaseInventory(releaseDirectory, manifest.cockpit.files);
  verifyReleaseInventory(releaseDirectory, manifest.executables);
  verifyReleaseInventory(releaseDirectory, manifest.templates.systemdUserTemplates);
  return Object.freeze({
    migrationFingerprint: stableFingerprint(manifest.migrationInventory),
    migrationInventory: Object.freeze(manifest.migrationInventory.map((entry) => Object.freeze({
      migrationName: entry.migrationName,
      path: entry.path,
      sha256: entry.sha256,
    }))),
    packageLockSha256: manifest.packageLock.sha256,
    packageVersion: requireNonEmptyString(manifest.packageVersion, 'release manifest packageVersion'),
    releaseDirectory,
    releaseId: requireNonEmptyString(manifest.releaseId, 'release manifest releaseId'),
    semanticFingerprint: requireSha256(manifest.semanticFingerprint, 'release manifest semanticFingerprint'),
    sourceManifestSha256: requireSha256(manifest.source.sourceManifestSha256, 'release manifest sourceManifestSha256'),
    upstreamLockFingerprintSha256: requireSha256(
      manifest.upstreamLock.fingerprintSha256,
      'release manifest upstreamLock fingerprintSha256',
    ),
  });
}

function readReleaseManifest(releaseDirectory: string): BwsReleaseManifest {
  const manifestPath = join(resolve(releaseDirectory), RELEASE_MANIFEST_FILE);
  const parsed = requireObject(readJsonFile(manifestPath), manifestPath) as unknown as BwsReleaseManifest;
  if (parsed.schema !== RELEASE_MANIFEST_SCHEMA) {
    throw new Error(`Unexpected release manifest schema in ${manifestPath}.`);
  }
  requireIsoTimestamp(parsed.createdAt, `${manifestPath} createdAt`);
  requireSha256(parsed.semanticFingerprint, `${manifestPath} semanticFingerprint`);
  return parsed;
}

function verifyReleaseChecksums(releaseDirectory: string): void {
  const checksumsPath = join(releaseDirectory, RELEASE_CHECKSUMS_FILE);
  const lines = readFileSync(checksumsPath, 'utf-8').split(/\r?\n/).filter((line) => line.trim().length > 0);
  const seen = new Set<string>();
  for (const line of lines) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line.trim());
    const relativePath = match === null ? undefined : match[2];
    const expectedSha256 = match === null ? undefined : match[1];
    if (relativePath === undefined || expectedSha256 === undefined) {
      throw new Error(`Malformed release checksum line in ${checksumsPath}.`);
    }
    if (relativePath === RELEASE_CHECKSUMS_FILE) {
      throw new Error('Release checksum file must not list itself.');
    }
    if (seen.has(relativePath)) {
      throw new Error(`Duplicate release checksum entry found for ${relativePath}.`);
    }
    seen.add(relativePath);
    const actualSha256 = fileSha256(join(releaseDirectory, relativePath));
    if (actualSha256 !== expectedSha256) {
      throw new Error(`Release checksum mismatch for ${relativePath}.`);
    }
  }
}

function verifyReleaseInventory(
  releaseDirectory: string,
  inventory: readonly ReleaseInventoryFile[],
): void {
  for (const entry of inventory) {
    const filePath = join(releaseDirectory, entry.path);
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Release inventory entry is not a file: ${entry.path}`);
    }
    const actualSha256 = fileSha256(filePath);
    if (actualSha256 !== entry.sha256) {
      throw new Error(`Release inventory checksum mismatch for ${entry.path}.`);
    }
    if (stats.size !== entry.size) {
      throw new Error(`Release inventory size mismatch for ${entry.path}.`);
    }
  }
}

function verifyBackupEvidence(
  backupPath: string,
  restoreVerificationFile: string,
): VerifiedBackupEvidence {
  const resolvedBackupPath = resolve(backupPath);
  const manifestFile = join(resolvedBackupPath, BACKUP_MANIFEST_FILE);
  const dumpFile = join(resolvedBackupPath, BACKUP_DUMP_FILE);
  const checksumsFile = join(resolvedBackupPath, BACKUP_CHECKSUMS_FILE);
  const manifest = requireObject(readJsonFile(manifestFile), manifestFile) as unknown as BwsDatabaseBackupManifest;
  if (manifest.schema !== DATABASE_BACKUP_MANIFEST_SCHEMA) {
    throw new Error(`Unexpected backup manifest schema in ${manifestFile}.`);
  }
  const checksumLines = readFileSync(checksumsFile, 'utf-8').split(/\r?\n/).filter((line) => line.trim().length > 0);
  const expected = new Map<string, string>();
  for (const line of checksumLines) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line.trim());
    const sha256 = match === null ? undefined : match[1];
    const relativePath = match === null ? undefined : match[2];
    if (sha256 === undefined || relativePath === undefined) {
      throw new Error(`Malformed backup checksum line in ${checksumsFile}.`);
    }
    expected.set(relativePath, sha256);
  }
  if (expected.get(BACKUP_DUMP_FILE) !== fileSha256(dumpFile)) {
    throw new Error(`Backup checksum mismatch for ${BACKUP_DUMP_FILE}.`);
  }
  if (expected.get(BACKUP_MANIFEST_FILE) !== fileSha256(manifestFile)) {
    throw new Error(`Backup checksum mismatch for ${BACKUP_MANIFEST_FILE}.`);
  }
  const restoreVerificationPath = resolve(restoreVerificationFile);
  const restoreVerification = requireObject(
    readJsonFile(restoreVerificationPath),
    restoreVerificationPath,
  ) as unknown as BwsVerifyDatabaseRestoreResult;
  if (restoreVerification.schema !== DATABASE_RESTORE_VERIFICATION_SCHEMA) {
    throw new Error(`Unexpected restore verification schema in ${restoreVerificationPath}.`);
  }
  if (stableFingerprint(restoreVerification.backupManifest) !== stableFingerprint(manifest)) {
    throw new Error('Restore verification does not reference the exact supplied backup manifest.');
  }
  return Object.freeze({
    backupManifest: manifest,
    backupManifestFile: manifestFile,
    restoreVerification,
    restoreVerificationFile: restoreVerificationPath,
  });
}

function verifyTargetInstallEvidence(
  targetRelease: BwsReleaseIdentity,
  resultFile: string,
): VerifiedTargetInstallEvidence {
  const resolvedResultFile = resolve(resultFile);
  const parsed = requireObject(
    readJsonFile(resolvedResultFile),
    resolvedResultFile,
  ) as unknown as BwsReleaseInstallVerificationResult;
  if (parsed.schema !== RELEASE_INSTALL_VERIFICATION_SCHEMA) {
    throw new Error(`Unexpected target install verification schema in ${resolvedResultFile}.`);
  }
  if (parsed.semanticFingerprint !== targetRelease.semanticFingerprint) {
    throw new Error('Target install verification semantic fingerprint does not match the target release manifest.');
  }
  if (parsed.preflight.policy.runtimeMode !== 'paper') {
    throw new Error('Target install verification must retain runtimeMode=paper.');
  }
  if (parsed.preflight.policy.providerConnections !== 'disabled') {
    throw new Error('Target install verification must retain providerConnections=disabled.');
  }
  if (parsed.preflight.policy.executionEnabled !== false) {
    throw new Error('Target install verification must retain executionEnabled=false.');
  }
  return Object.freeze({
    result: parsed,
    resultFile: resolvedResultFile,
  });
}

function readUpgradePlan(planFile: string): BwsReleaseUpgradePlan {
  const resolvedPlanFile = resolve(planFile);
  const parsed = requireObject(readJsonFile(resolvedPlanFile), resolvedPlanFile) as unknown as BwsReleaseUpgradePlan;
  if (parsed.schema !== UPGRADE_PLAN_SCHEMA) {
    throw new Error(`Unexpected upgrade plan schema in ${resolvedPlanFile}.`);
  }
  requireIsoTimestamp(parsed.createdAt, `${resolvedPlanFile} createdAt`);
  requireSha256(parsed.planFingerprint, `${resolvedPlanFile} planFingerprint`);
  return parsed;
}

function assertPlanFingerprint(plan: BwsReleaseUpgradePlan, planFingerprint: string): void {
  if (plan.planFingerprint !== requireSha256(planFingerprint, 'planFingerprint')) {
    throw new Error(`Upgrade plan fingerprint mismatch. Expected ${plan.planFingerprint}.`);
  }
}

function readOrCreateUpgradeState(
  plan: BwsReleaseUpgradePlan,
  now: () => string,
): PersistedUpgradeState {
  if (!existsSync(plan.checkpointing.stateFile)) {
    const state: PersistedUpgradeState = Object.freeze({
      checkpoints: Object.freeze([]),
      currentReleaseSemanticFingerprint: plan.currentRelease.semanticFingerprint,
      planFingerprint: plan.planFingerprint,
      resolved: false,
      schema: INTERNAL_UPGRADE_STATE_SCHEMA,
      targetReleaseSemanticFingerprint: plan.targetRelease.semanticFingerprint,
    });
    writeUpgradeState(plan, state);
    return state;
  }
  const parsed = requireObject(
    readJsonFile(plan.checkpointing.stateFile),
    plan.checkpointing.stateFile,
  ) as unknown as PersistedUpgradeState;
  if (parsed.schema !== INTERNAL_UPGRADE_STATE_SCHEMA) {
    throw new Error(`Unexpected upgrade state schema in ${plan.checkpointing.stateFile}.`);
  }
  if (
    parsed.currentReleaseSemanticFingerprint !== plan.currentRelease.semanticFingerprint
    || parsed.targetReleaseSemanticFingerprint !== plan.targetRelease.semanticFingerprint
  ) {
    throw new Error('Upgrade state fingerprints do not match the requested plan identities.');
  }
  if (parsed.planFingerprint !== plan.planFingerprint && !parsed.resolved) {
    throw new Error(`Unresolved upgrade state belongs to a different plan fingerprint: ${parsed.planFingerprint}`);
  }
  void now;
  return parsed;
}

function writeUpgradeState(plan: BwsReleaseUpgradePlan, state: PersistedUpgradeState): void {
  writeJsonFileAtomic(plan.checkpointing.stateFile, state);
}

function appendCheckpointIfMissing(
  state: PersistedUpgradeState,
  plan: BwsReleaseUpgradePlan,
  classification: UpgradeCheckpointClassification,
  now: () => string,
  details: Readonly<Record<string, JsonPrimitive>>,
  evidence: readonly BwsReleaseUpgradeEvidenceReference[],
  dependencies: ReleaseUpgradeDependencies,
  resolved: boolean = false,
): PersistedUpgradeState {
  if (hasCheckpoint(state, classification)) {
    return state;
  }
  const createdAt = requireIsoTimestamp(now(), 'createdAt');
  const sequence = state.checkpoints.length + 1;
  const fileName = `${String(sequence).padStart(3, '0')}-${classification}.json`;
  const filePath = join(plan.checkpointing.checkpointDirectory, fileName);
  const checkpoint: BwsReleaseUpgradeCheckpoint = Object.freeze({
    classification,
    createdAt,
    currentReleaseSemanticFingerprint: plan.currentRelease.semanticFingerprint,
    details,
    evidence: Object.freeze(evidence),
    planFingerprint: plan.planFingerprint,
    schema: UPGRADE_CHECKPOINT_SCHEMA,
    sequence,
    targetReleaseSemanticFingerprint: plan.targetRelease.semanticFingerprint,
  });
  writeJsonFileAtomic(filePath, checkpoint);
  registerRecoveryEvidence(
    plan.currentRelease.releaseDirectory,
    plan.planFingerprint,
    plan.currentRelease.sourceManifestSha256,
    [Object.freeze({
      artifactPath: filePath,
      artifactSchema: UPGRADE_CHECKPOINT_SCHEMA,
    })],
  );
  const nextState: PersistedUpgradeState = Object.freeze({
    ...state,
    checkpoints: Object.freeze([
      ...state.checkpoints,
      Object.freeze({
        classification,
        createdAt,
        file: relative(plan.currentRelease.releaseDirectory, filePath),
        sequence,
        sha256: fileSha256(filePath),
      }),
    ]),
    resolved,
    ...(resolved ? { terminalCheckpoint: classification } : {}),
  });
  writeUpgradeState(plan, nextState);
  if (dependencies.testHooks.failAfterCheckpoint === classification) {
    throw new Error(`Injected failure after checkpoint ${classification}.`);
  }
  return nextState;
}

function hasCheckpoint(
  state: PersistedUpgradeState,
  classification: UpgradeCheckpointClassification,
): boolean {
  return state.checkpoints.some((entry) => entry.classification === classification);
}

function lastCheckpointClassification(state: PersistedUpgradeState): UpgradeCheckpointClassification {
  const last = state.checkpoints[state.checkpoints.length - 1];
  if (last === undefined) {
    return 'planned_not_started';
  }
  return last.classification;
}

function registerRecoveryEvidence(
  repositoryRoot: string,
  runtimeId: string,
  sourceFingerprint: string,
  artifacts: readonly Readonly<{
    readonly artifactPath: string;
    readonly artifactSchema: string;
  }>[],
): readonly BwsEvidenceIndexEntry[] {
  const entries: BwsEvidenceIndexEntry[] = [];
  for (const artifact of artifacts) {
    if (!isWithinResolved(repositoryRoot, artifact.artifactPath)) {
      continue;
    }
    entries.push(
      registerBwsEvidenceArtifact({
        artifactPath: artifact.artifactPath,
        artifactSchema: artifact.artifactSchema,
        createdAt: defaultNow(),
        repositoryRoot,
        retentionClass: 'recovery',
        runtimeId,
        sourceFingerprint,
      }),
    );
  }
  return Object.freeze(entries);
}

function createEvidenceReference(
  repositoryRoot: string,
  absolutePath: string,
  schema: string,
): BwsReleaseUpgradeEvidenceReference {
  const resolvedPath = resolve(absolutePath);
  const path = isWithinResolved(repositoryRoot, resolvedPath)
    ? relative(repositoryRoot, resolvedPath)
    : resolvedPath;
  return Object.freeze({
    path,
    schema,
    sha256: fileSha256(resolvedPath),
  });
}

function toAbsoluteEvidencePath(
  repositoryRoot: string,
  path: string,
): string | undefined {
  if (path.trim().length === 0) {
    return undefined;
  }
  return resolve(repositoryRoot, path);
}

function ensureDirectoryWritable(directory: string, label: string): void {
  mkdirSync(directory, { recursive: true });
  const resolvedDirectory = resolve(directory);
  accessSync(resolvedDirectory, fsConstants.R_OK | fsConstants.W_OK);
  const probePath = join(resolvedDirectory, `.write-probe-${process.pid}-${Date.now()}`);
  writeFileSync(probePath, 'ok\n', 'utf-8');
  rmSync(probePath, { force: true });
  void label;
}

function ensureParentDirectory(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  ensureDirectoryWritable(dirname(path), 'parent directory');
}

function writeJsonFileAtomic(path: string, value: unknown): void {
  const resolvedPath = resolve(path);
  const temporaryPath = `${resolvedPath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, resolvedPath);
}

function readStrictEnvironmentFile(path: string): ReadonlyMap<string, string> {
  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
    throw new Error(`Private environment file does not exist: ${resolvedPath}`);
  }
  const values = new Map<string, string>();
  const lines = readFileSync(resolvedPath, 'utf-8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    const name = match === null ? undefined : match[1];
    const rawValue = match === null ? undefined : match[2];
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

function parseEnvironmentFileValue(
  rawValue: string,
  name: string,
  lineNumber: number,
): string {
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
    throw new Error('Upgrade planning requires BWS_UPSTREAM_MODE to be exactly api or export.');
  }
  return mode;
}

function validateClosedPolicy(environment: ReadonlyMap<string, string>): void {
  if (environment.get('SUREBET_RUNTIME_MODE') !== 'paper') {
    throw new Error('Upgrade planning requires SUREBET_RUNTIME_MODE=paper.');
  }
  if (environment.get('SUREBET_PROVIDER_CONNECTIONS') !== 'disabled') {
    throw new Error('Upgrade planning requires SUREBET_PROVIDER_CONNECTIONS=disabled.');
  }
  if (environment.get('SUREBET_EXECUTION_ENABLED') !== 'false') {
    throw new Error('Upgrade planning requires SUREBET_EXECUTION_ENABLED=false.');
  }
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const normalized = requireNonEmptyString(value, label);
  if (!ISO_8601_UTC.test(normalized)) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return normalized;
}

function requireSha256(value: unknown, label: string): string {
  const normalized = requireNonEmptyString(value, label);
  if (!SHA256_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a 64-character lower-case SHA-256 string.`);
  }
  return normalized;
}

function fileSha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function stableFingerprint(value: unknown): string {
  return sha256Hex(stableJsonStringify(value as JsonValue));
}

function isWithinResolved(rootPath: string, candidatePath: string): boolean {
  const root = resolve(rootPath);
  const candidate = resolve(candidatePath);
  return candidate === root || candidate.startsWith(`${root}/`);
}

function sanitizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function defaultNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '.000Z');
}

function fail(message: string): never {
  throw new Error(message);
}
