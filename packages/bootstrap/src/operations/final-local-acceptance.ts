import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
  type Dirent,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  applySurebetMigrations,
  type SurebetPersistenceConfig,
} from '../../../persistence/src/index.js';
import {
  getBwsDatabaseMigrationStatus,
  type BwsDatabaseBackupManifest,
  type BwsDatabaseRetentionPlan,
  type BwsMigrationStatusResult,
  type BwsVerifyDatabaseRestoreResult,
} from './database-lifecycle.js';
import type { BwsExternalRuntimeCampaignManifest } from './external-runtime-preflight.js';
import type { BwsPaperRuntimeEvidenceResult } from './paper-runtime-evidence.js';
import {
  verifyBwsReleaseInstallation,
  type BwsReleaseInstallVerificationResult,
  type BwsReleaseManifest,
  type VerifyBwsReleaseInstallationRequest,
} from './release-packaging.js';
import type {
  BwsReleaseRecoveryResult,
  BwsReleaseRollbackDecision,
  BwsReleaseUpgradePlan,
  BwsReleaseUpgradeResult,
} from './release-upgrade.js';
import type {
  BwsSoakCampaignExecutionResult,
  BwsSoakCampaignManifest,
  BwsSoakCampaignValidationResult,
} from './soak-campaign.js';

const FINAL_LOCAL_ACCEPTANCE_STAGE1_SCHEMA = 'bws.final_local_acceptance_stage1.v1' as const;
const FINAL_LOCAL_ACCEPTANCE_RUNTIME_SCHEMA = 'bws.final_local_acceptance_runtime.v1' as const;
const FINAL_LOCAL_ACCEPTANCE_RECOVERY_SCHEMA = 'bws.final_local_acceptance_recovery.v1' as const;
const FINAL_LOCAL_ACCEPTANCE_CLEANUP_SCHEMA = 'bws.final_local_acceptance_cleanup.v1' as const;
const FINAL_LOCAL_ACCEPTANCE_MANIFEST_SCHEMA = 'bws.final_local_acceptance.v1' as const;
const PAPER_RUNTIME_EVIDENCE_SCHEMA = 'bws.paper_runtime_evidence.v1' as const;
const RELEASE_UPGRADE_PLAN_SCHEMA = 'bws.upgrade_plan.v1' as const;
const RELEASE_UPGRADE_RESULT_SCHEMA = 'bws.upgrade_result.v1' as const;
const RELEASE_ROLLBACK_DECISION_SCHEMA = 'bws.rollback_decision.v1' as const;
const RELEASE_RECOVERY_RESULT_SCHEMA = 'bws.recovery_result.v1' as const;
const DATABASE_BACKUP_MANIFEST_SCHEMA = 'bws.database_backup_manifest.v1' as const;
const DATABASE_RESTORE_VERIFICATION_SCHEMA = 'bws.database_restore_verification.v1' as const;
const DATABASE_RETENTION_PLAN_SCHEMA = 'bws.database_retention_plan.v1' as const;
const SOAK_CAMPAIGN_SCHEMA = 'bws.soak_campaign.v1' as const;
const SOAK_CAMPAIGN_RESULT_SCHEMA = 'bws.soak_campaign_result.v1' as const;
const SOAK_CAMPAIGN_VALIDATION_SCHEMA = 'bws.soak_campaign_validation.v1' as const;
const EXTERNAL_RUNTIME_CAMPAIGN_SCHEMA = 'bws.external_runtime_campaign.v1' as const;
const RELEASE_MANIFEST_FILE = 'release-manifest.json' as const;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;

type FinalAcceptanceMode = 'api' | 'export';

interface FinalLocalAcceptanceStageOneDependencies {
  readonly applyMigrations: (persistenceConfig: SurebetPersistenceConfig) => void;
  readonly extractReleaseArchive: (input: Readonly<{
    readonly archivePath: string;
    readonly extractionDirectory: string;
  }>) => string;
  readonly getMigrationStatus: (input: Readonly<{
    readonly persistenceConfig: SurebetPersistenceConfig;
    readonly repositoryRoot: string;
  }>) => BwsMigrationStatusResult;
  readonly verifyInstall: (
    request: VerifyBwsReleaseInstallationRequest,
  ) => Promise<BwsReleaseInstallVerificationResult>;
}

export interface RunBwsFinalLocalAcceptanceStageOneRequest {
  readonly archivePath: string;
  readonly envFile: string;
  readonly extractionDirectory: string;
  readonly migrationStatusFile: string;
  readonly now?: () => string;
  readonly outputFile: string;
  readonly persistenceConfig: SurebetPersistenceConfig;
  readonly repositoryRoot?: string;
  readonly scratchDirectory: string;
  readonly stageDependencies?: Partial<FinalLocalAcceptanceStageOneDependencies>;
}

export interface BwsFinalLocalAcceptanceStageOneResult {
  readonly createdAt: string;
  readonly extraction: Readonly<{
    readonly archiveFile: string;
    readonly archiveSha256: string;
    readonly cleanRoomRoot: string;
    readonly extractedReleaseDirectory: string;
    readonly sourceCheckoutIndependentInstallVerified: true;
  }>;
  readonly installVerification: Readonly<{
    readonly resultFile: string;
    readonly semanticFingerprint: string;
    readonly verifiedChecks: readonly string[];
  }>;
  readonly migration: Readonly<{
    readonly compatibilityStatus: BwsMigrationStatusResult['compatibility']['status'];
    readonly currentDatabase: string;
    readonly migrationStatusFile: string;
    readonly pendingMigrationCount: number;
    readonly requestedDatabase: string;
  }>;
  readonly release: Readonly<{
    readonly releaseId: string;
    readonly semanticFingerprint: string;
    readonly sourceManifestSha256: string;
    readonly upstreamLockFingerprintSha256: string;
  }>;
  readonly schema: typeof FINAL_LOCAL_ACCEPTANCE_STAGE1_SCHEMA;
  readonly semanticFingerprint: string;
  readonly sourceBoundary: Readonly<{
    readonly extractedTreeContainsGitMetadata: false;
    readonly extractedTreeMatchesSourceCheckoutRoot: false;
    readonly repositoryRoot: string;
  }>;
}

export interface CreateBwsFinalLocalAcceptanceRuntimeResultRequest {
  readonly now?: () => string;
  readonly outputFile: string;
  readonly paperAutopilotSummaryFile: string;
  readonly repositoryRoot?: string;
  readonly runtimeEvidenceFiles: readonly string[];
  readonly telegramDryRunCaptureFile: string;
}

export interface BwsFinalLocalAcceptanceRuntimeResult {
  readonly closedBoundary: Readonly<{
    readonly automaticFallback: 'forbidden';
    readonly executionEnabled: false;
    readonly listenerExposure: 'loopback_only';
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
  }>;
  readonly createdAt: string;
  readonly modesVerified: readonly FinalAcceptanceMode[];
  readonly paperAutopilot: Readonly<{
    readonly finalStatus: 'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY';
    readonly stopReason: string;
    readonly summaryFile: string;
    readonly telegramDryRunCaptureFile: string;
  }>;
  readonly runtimeEvidence: readonly Readonly<{
    readonly apiStatus: 'ready';
    readonly cockpitStatus: 'ready';
    readonly diagnosticsManifestFile: string;
    readonly finalStatus: 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY';
    readonly handoffFile: string;
    readonly healthStatus: 'healthy';
    readonly lifecycleEvidenceFile: string;
    readonly mode: FinalAcceptanceMode;
    readonly readinessStatus: 'ready';
    readonly resultFile: string;
    readonly semanticFingerprint: string;
  }>[];
  readonly schema: typeof FINAL_LOCAL_ACCEPTANCE_RUNTIME_SCHEMA;
  readonly semanticFingerprint: string;
}

export interface CreateBwsFinalLocalAcceptanceRecoveryResultRequest {
  readonly backupManifestFile: string;
  readonly failedReadinessUpgradeResultFile: string;
  readonly interruptedRecoveryResultFile: string;
  readonly now?: () => string;
  readonly outputFile: string;
  readonly repositoryRoot?: string;
  readonly restoreVerificationFile: string;
  readonly retentionPlanFile: string;
  readonly rollbackAllowedDecisionFile: string;
  readonly rollbackBlockedDecisionFile: string;
  readonly successfulUpgradePlanFile: string;
  readonly successfulUpgradeResultFile: string;
}

export interface BwsFinalLocalAcceptanceRecoveryResult {
  readonly backupRestore: Readonly<{
    readonly backupManifestFile: string;
    readonly restoreVerificationFile: string;
    readonly retentionPlanFile: string;
  }>;
  readonly createdAt: string;
  readonly interruptedRecovery: Readonly<{
    readonly outcome: BwsReleaseRecoveryResult['outcome'];
    readonly resultFile: string;
  }>;
  readonly rollbackDecisions: Readonly<{
    readonly allowedDecisionFile: string;
    readonly blockedDecisionFile: string;
  }>;
  readonly schema: typeof FINAL_LOCAL_ACCEPTANCE_RECOVERY_SCHEMA;
  readonly semanticFingerprint: string;
  readonly successfulUpgrade: Readonly<{
    readonly planFile: string;
    readonly planFingerprint: string;
    readonly resultFile: string;
    readonly targetReleaseSemanticFingerprint: string;
  }>;
  readonly recoveryExercises: Readonly<{
    readonly failedReadinessResultFile: string;
    readonly failedReadinessTerminalCheckpoint: BwsReleaseUpgradeResult['terminalCheckpoint'];
  }>;
}

export interface CreateBwsFinalLocalAcceptanceCleanupResultRequest {
  readonly leakedLeaseCount: number;
  readonly leakedProcessIds: readonly number[];
  readonly now?: () => string;
  readonly outputFile: string;
  readonly remainingTemporaryFiles: readonly string[];
  readonly repositoryRoot?: string;
  readonly temporaryDirectories: readonly string[];
}

export interface BwsFinalLocalAcceptanceCleanupResult {
  readonly createdAt: string;
  readonly leakedLeaseCount: number;
  readonly leakedProcessIds: readonly number[];
  readonly remainingTemporaryFiles: readonly string[];
  readonly schema: typeof FINAL_LOCAL_ACCEPTANCE_CLEANUP_SCHEMA;
  readonly semanticFingerprint: string;
  readonly temporaryDirectories: readonly string[];
  readonly verified: boolean;
}

export interface CreateBwsFinalLocalAcceptanceManifestRequest {
  readonly acceptanceArtifactArchiveSha256: string;
  readonly cleanupResultFile: string;
  readonly externalRuntimeCampaignFile: string;
  readonly now?: () => string;
  readonly outputFile: string;
  readonly recoveryResultFile: string;
  readonly repositoryRoot?: string;
  readonly runtimeResultFile: string;
  readonly soakManifestFile: string;
  readonly soakResultFile: string;
  readonly soakValidationFile: string;
  readonly stageOneFile: string;
}

export interface BwsFinalLocalAcceptanceManifest {
  readonly acceptanceArtifactArchiveSha256: string;
  readonly cleanup: Readonly<{
    readonly resultFile: string;
    readonly verified: true;
  }>;
  readonly createdAt: string;
  readonly externalRuntimeCampaign: Readonly<{
    readonly manifestFile: string;
    readonly semanticFingerprint: string;
    readonly selectedMode: FinalAcceptanceMode;
  }>;
  readonly providerExecutionClosed: Readonly<{
    readonly executionEnabled: false;
    readonly providerConnections: 'disabled';
    readonly runtimeMode: 'paper';
  }>;
  readonly recovery: Readonly<{
    readonly resultFile: string;
    readonly targetReleaseSemanticFingerprint: string;
  }>;
  readonly release: Readonly<{
    readonly releaseId: string;
    readonly semanticFingerprint: string;
    readonly sourceManifestSha256: string;
  }>;
  readonly runtime: Readonly<{
    readonly modesVerified: readonly FinalAcceptanceMode[];
    readonly resultFile: string;
  }>;
  readonly schema: typeof FINAL_LOCAL_ACCEPTANCE_MANIFEST_SCHEMA;
  readonly semanticFingerprint: string;
  readonly soak: Readonly<{
    readonly campaignSemanticFingerprint: string;
    readonly manifestFile: string;
    readonly resultFile: string;
    readonly validationFile: string;
  }>;
  readonly stageOne: Readonly<{
    readonly resultFile: string;
  }>;
  readonly upstreamLock: Readonly<{
    readonly fingerprintSha256: string;
  }>;
}

export async function runBwsFinalLocalAcceptanceStageOne(
  request: RunBwsFinalLocalAcceptanceStageOneRequest,
): Promise<BwsFinalLocalAcceptanceStageOneResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const createdAt = requireIsoTimestamp((request.now ?? defaultNow)(), 'createdAt');
  const archivePath = resolve(request.archivePath);
  const envFile = resolve(request.envFile);
  const extractionDirectory = resolve(request.extractionDirectory);
  const scratchDirectory = resolve(request.scratchDirectory);
  const outputFile = resolve(request.outputFile);
  const migrationStatusFile = resolve(request.migrationStatusFile);
  const dependencies = resolveStageOneDependencies(request.stageDependencies);

  assertRegularFile(archivePath, 'archivePath');
  assertRegularFile(envFile, 'envFile');
  ensureEmptyDirectory(extractionDirectory, 'extractionDirectory');
  mkdirSync(scratchDirectory, { recursive: true });
  mkdirSync(dirname(outputFile), { recursive: true });
  mkdirSync(dirname(migrationStatusFile), { recursive: true });

  const extractedReleaseDirectory = resolve(
    dependencies.extractReleaseArchive({
      archivePath,
      extractionDirectory,
    }),
  );
  assertDirectory(extractedReleaseDirectory, 'extracted release directory');

  if (extractedReleaseDirectory === repositoryRoot) {
    throw new Error('Final local acceptance stage 1 requires a clean-room extracted release directory, not the source checkout root.');
  }
  if (existsSync(join(extractedReleaseDirectory, '.git'))) {
    throw new Error('Final local acceptance stage 1 extracted release must not contain .git metadata.');
  }

  const installVerification = await dependencies.verifyInstall({
    archivePath,
    envFile,
    releaseDirectory: extractedReleaseDirectory,
    scratchDirectory,
  });

  dependencies.applyMigrations(request.persistenceConfig);
  const migrationStatus = dependencies.getMigrationStatus({
    persistenceConfig: request.persistenceConfig,
    repositoryRoot: extractedReleaseDirectory,
  });
  assertMigrationStatusReadyForAcceptance(migrationStatus);
  writeJsonAtomically(migrationStatusFile, migrationStatus);

  const manifest = readReleaseManifest(extractedReleaseDirectory);
  const semanticFingerprint = stableFingerprint(
    Object.freeze({
      archiveSha256: sha256File(archivePath),
      installVerification: Object.freeze({
        semanticFingerprint: installVerification.semanticFingerprint,
        verifiedChecks: installVerification.verifiedChecks,
      }),
      migration: Object.freeze({
        compatibility: migrationStatus.compatibility,
        database: migrationStatus.database,
        pending: migrationStatus.migrationLedger.pending,
      }),
      release: Object.freeze({
        releaseId: manifest.releaseId,
        semanticFingerprint: manifest.semanticFingerprint,
        sourceManifestSha256: manifest.source.sourceManifestSha256,
        upstreamLockFingerprintSha256: manifest.upstreamLock.fingerprintSha256,
      }),
    }),
  );

  const result: BwsFinalLocalAcceptanceStageOneResult = Object.freeze({
    createdAt,
    extraction: Object.freeze({
      archiveFile: archivePath,
      archiveSha256: sha256File(archivePath),
      cleanRoomRoot: extractionDirectory,
      extractedReleaseDirectory,
      sourceCheckoutIndependentInstallVerified: true,
    }),
    installVerification: Object.freeze({
      resultFile: installVerification.resultFile,
      semanticFingerprint: installVerification.semanticFingerprint,
      verifiedChecks: installVerification.verifiedChecks,
    }),
    migration: Object.freeze({
      compatibilityStatus: migrationStatus.compatibility.status,
      currentDatabase: migrationStatus.database.currentDatabase,
      migrationStatusFile,
      pendingMigrationCount: migrationStatus.migrationLedger.pending.length,
      requestedDatabase: migrationStatus.database.requestedDatabase,
    }),
    release: Object.freeze({
      releaseId: manifest.releaseId,
      semanticFingerprint: manifest.semanticFingerprint,
      sourceManifestSha256: manifest.source.sourceManifestSha256,
      upstreamLockFingerprintSha256: manifest.upstreamLock.fingerprintSha256,
    }),
    schema: FINAL_LOCAL_ACCEPTANCE_STAGE1_SCHEMA,
    semanticFingerprint,
    sourceBoundary: Object.freeze({
      extractedTreeContainsGitMetadata: false,
      extractedTreeMatchesSourceCheckoutRoot: false,
      repositoryRoot,
    }),
  });
  writeJsonAtomically(outputFile, result);
  return result;
}

export function createBwsFinalLocalAcceptanceRuntimeResult(
  request: CreateBwsFinalLocalAcceptanceRuntimeResultRequest,
): BwsFinalLocalAcceptanceRuntimeResult {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const createdAt = requireIsoTimestamp((request.now ?? defaultNow)(), 'createdAt');
  const outputFile = resolve(request.outputFile);
  const paperAutopilotSummaryFile = resolve(request.paperAutopilotSummaryFile);
  const telegramDryRunCaptureFile = resolve(request.telegramDryRunCaptureFile);
  if (request.runtimeEvidenceFiles.length === 0) {
    throw new Error('Final local acceptance runtime evidence requires at least one runtimeEvidenceFile.');
  }
  assertRegularFile(paperAutopilotSummaryFile, 'paperAutopilotSummaryFile');
  assertRegularFile(telegramDryRunCaptureFile, 'telegramDryRunCaptureFile');
  mkdirSync(dirname(outputFile), { recursive: true });

  const runtimeEvidenceByMode = new Map<FinalAcceptanceMode, BwsFinalLocalAcceptanceRuntimeResult['runtimeEvidence'][number]>();
  for (const runtimeEvidenceFile of request.runtimeEvidenceFiles) {
    const parsed = readRuntimeEvidenceFile(runtimeEvidenceFile);
    if (runtimeEvidenceByMode.has(parsed.selectedUpstreamMode)) {
      throw new Error(`Final local acceptance runtime evidence duplicates mode=${parsed.selectedUpstreamMode}.`);
    }
    const latestSample = parsed.observation.samples.at(-1);
    if (latestSample === undefined) {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain at least one observation sample.`);
    }
    if (latestSample.healthStatus !== 'healthy') {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain healthStatus=healthy.`);
    }
    if (latestSample.readinessStatus !== 'ready') {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain readinessStatus=ready.`);
    }
    if (latestSample.apiStatus !== 'ready') {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain apiStatus=ready.`);
    }
    if (latestSample.cockpitStatus !== 'ready') {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain cockpitStatus=ready.`);
    }
    if (latestSample.databaseStatus !== 'compatible') {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain databaseStatus=compatible.`);
    }
    if (parsed.runtimeHandoff === undefined || parsed.runtimeHandoff.handoffFile.length === 0) {
      throw new Error(`Final local acceptance runtime evidence ${runtimeEvidenceFile} must retain a runtime handoff.`);
    }
    runtimeEvidenceByMode.set(
      parsed.selectedUpstreamMode,
      Object.freeze({
        apiStatus: 'ready',
        cockpitStatus: 'ready',
        diagnosticsManifestFile: resolveEvidencePath(repositoryRoot, latestSample.diagnosticsManifestFile),
        finalStatus: parsed.finalStatus,
        handoffFile: resolveEvidencePath(repositoryRoot, parsed.runtimeHandoff.handoffFile),
        healthStatus: 'healthy',
        lifecycleEvidenceFile: resolveEvidencePath(repositoryRoot, latestSample.lifecycleEvidenceFile),
        mode: parsed.selectedUpstreamMode,
        readinessStatus: 'ready',
        resultFile: resolve(runtimeEvidenceFile),
        semanticFingerprint: stableFingerprint(parsed),
      }),
    );
  }

  if (!runtimeEvidenceByMode.has('api') || !runtimeEvidenceByMode.has('export')) {
    throw new Error('Final local acceptance runtime evidence requires both api and export mode evidence files.');
  }

  const paperAutopilotSummary = parseKeyValueFile(paperAutopilotSummaryFile, 'paperAutopilotSummaryFile');
  const finalStatus = requireExactToken(
    paperAutopilotSummary.get('final_status'),
    'paperAutopilotSummaryFile final_status',
  );
  if (finalStatus !== 'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY') {
    throw new Error('Final local acceptance runtime evidence requires paper autopilot final_status=PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY.');
  }
  const stopReason = requireExactToken(
    paperAutopilotSummary.get('stop_reason'),
    'paperAutopilotSummaryFile stop_reason',
  );
  const telegramCapture = readFileSync(telegramDryRunCaptureFile, 'utf-8').trim();
  if (!telegramCapture.includes('PAPER_AUTOPILOT_')) {
    throw new Error('Final local acceptance runtime evidence requires a parent-only paper autopilot telegram dry-run capture.');
  }

  const runtimeEvidence = [...runtimeEvidenceByMode.values()].sort((left, right) => left.mode.localeCompare(right.mode));
  const semanticFingerprint = stableFingerprint(
    Object.freeze({
      paperAutopilot: Object.freeze({
        finalStatus,
        stopReason,
      }),
      runtimeEvidence: runtimeEvidence.map((entry) =>
        Object.freeze({
          diagnosticsManifestFile: entry.diagnosticsManifestFile,
          handoffFile: entry.handoffFile,
          mode: entry.mode,
          resultFile: entry.resultFile,
          semanticFingerprint: entry.semanticFingerprint,
        })),
    }),
  );
  const result: BwsFinalLocalAcceptanceRuntimeResult = Object.freeze({
    closedBoundary: Object.freeze({
      automaticFallback: 'forbidden',
      executionEnabled: false,
      listenerExposure: 'loopback_only',
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    }),
    createdAt,
    modesVerified: Object.freeze(runtimeEvidence.map((entry) => entry.mode)),
    paperAutopilot: Object.freeze({
      finalStatus: 'PAPER_AUTOPILOT_READY_RUNTIME_EVIDENCE_LOCAL_ONLY',
      stopReason,
      summaryFile: paperAutopilotSummaryFile,
      telegramDryRunCaptureFile,
    }),
    runtimeEvidence: Object.freeze(runtimeEvidence),
    schema: FINAL_LOCAL_ACCEPTANCE_RUNTIME_SCHEMA,
    semanticFingerprint,
  });
  writeJsonAtomically(outputFile, result);
  return result;
}

export function createBwsFinalLocalAcceptanceRecoveryResult(
  request: CreateBwsFinalLocalAcceptanceRecoveryResultRequest,
): BwsFinalLocalAcceptanceRecoveryResult {
  const createdAt = requireIsoTimestamp((request.now ?? defaultNow)(), 'createdAt');
  const outputFile = resolve(request.outputFile);
  mkdirSync(dirname(outputFile), { recursive: true });

  const backupManifest = readSchemaFile<BwsDatabaseBackupManifest>(
    request.backupManifestFile,
    DATABASE_BACKUP_MANIFEST_SCHEMA,
    'backupManifestFile',
  );
  const restoreVerification = readSchemaFile<BwsVerifyDatabaseRestoreResult>(
    request.restoreVerificationFile,
    DATABASE_RESTORE_VERIFICATION_SCHEMA,
    'restoreVerificationFile',
  );
  const retentionPlan = readSchemaFile<BwsDatabaseRetentionPlan>(
    request.retentionPlanFile,
    DATABASE_RETENTION_PLAN_SCHEMA,
    'retentionPlanFile',
  );
  const successfulUpgradePlan = readSchemaFile<BwsReleaseUpgradePlan>(
    request.successfulUpgradePlanFile,
    RELEASE_UPGRADE_PLAN_SCHEMA,
    'successfulUpgradePlanFile',
  );
  const successfulUpgradeResult = readSchemaFile<BwsReleaseUpgradeResult>(
    request.successfulUpgradeResultFile,
    RELEASE_UPGRADE_RESULT_SCHEMA,
    'successfulUpgradeResultFile',
  );
  const failedReadinessUpgradeResult = readSchemaFile<BwsReleaseUpgradeResult>(
    request.failedReadinessUpgradeResultFile,
    RELEASE_UPGRADE_RESULT_SCHEMA,
    'failedReadinessUpgradeResultFile',
  );
  const rollbackAllowedDecision = readSchemaFile<BwsReleaseRollbackDecision>(
    request.rollbackAllowedDecisionFile,
    RELEASE_ROLLBACK_DECISION_SCHEMA,
    'rollbackAllowedDecisionFile',
  );
  const rollbackBlockedDecision = readSchemaFile<BwsReleaseRollbackDecision>(
    request.rollbackBlockedDecisionFile,
    RELEASE_ROLLBACK_DECISION_SCHEMA,
    'rollbackBlockedDecisionFile',
  );
  const interruptedRecoveryResult = readSchemaFile<BwsReleaseRecoveryResult>(
    request.interruptedRecoveryResultFile,
    RELEASE_RECOVERY_RESULT_SCHEMA,
    'interruptedRecoveryResultFile',
  );

  if (successfulUpgradePlan.status !== 'ready') {
    throw new Error('Final local acceptance recovery evidence requires a successful upgrade plan with status=ready.');
  }
  if (successfulUpgradeResult.outcome !== 'upgrade_applied') {
    throw new Error('Final local acceptance recovery evidence requires successfulUpgradeResult.outcome=upgrade_applied.');
  }
  if (successfulUpgradeResult.planFingerprint !== successfulUpgradePlan.planFingerprint) {
    throw new Error('Final local acceptance recovery evidence requires successful upgrade plan/result fingerprint parity.');
  }
  if (failedReadinessUpgradeResult.terminalCheckpoint !== 'readiness_failed') {
    throw new Error('Final local acceptance recovery evidence requires failedReadinessUpgradeResult.terminalCheckpoint=readiness_failed.');
  }
  if (rollbackAllowedDecision.rollbackStatus !== 'allowed') {
    throw new Error('Final local acceptance recovery evidence requires rollbackAllowedDecision.rollbackStatus=allowed.');
  }
  if (rollbackBlockedDecision.rollbackStatus !== 'blocked') {
    throw new Error('Final local acceptance recovery evidence requires rollbackBlockedDecision.rollbackStatus=blocked.');
  }
  if (interruptedRecoveryResult.outcome !== 'recovery_complete' && interruptedRecoveryResult.outcome !== 'rollback_blocked') {
    throw new Error('Final local acceptance recovery evidence requires an interrupted recovery outcome of recovery_complete or rollback_blocked.');
  }
  if (!restoreVerification.serverRestartsVerified) {
    throw new Error('Final local acceptance recovery evidence requires restoreVerification.serverRestartsVerified=true.');
  }
  if (retentionPlan.planFingerprint.length === 0) {
    throw new Error('Final local acceptance recovery evidence requires a non-empty retention plan fingerprint.');
  }

  const semanticFingerprint = stableFingerprint(
    Object.freeze({
      backupManifestFile: resolve(request.backupManifestFile),
      failedReadinessUpgradeResultFile: resolve(request.failedReadinessUpgradeResultFile),
      interruptedRecoveryResultFile: resolve(request.interruptedRecoveryResultFile),
      restoreVerificationFile: resolve(request.restoreVerificationFile),
      retentionPlanFile: resolve(request.retentionPlanFile),
      rollbackAllowedDecisionFile: resolve(request.rollbackAllowedDecisionFile),
      rollbackBlockedDecisionFile: resolve(request.rollbackBlockedDecisionFile),
      successfulUpgradePlanFingerprint: successfulUpgradePlan.planFingerprint,
      successfulUpgradeResultFile: resolve(request.successfulUpgradeResultFile),
    }),
  );
  const result: BwsFinalLocalAcceptanceRecoveryResult = Object.freeze({
    backupRestore: Object.freeze({
      backupManifestFile: resolve(request.backupManifestFile),
      restoreVerificationFile: resolve(request.restoreVerificationFile),
      retentionPlanFile: resolve(request.retentionPlanFile),
    }),
    createdAt,
    interruptedRecovery: Object.freeze({
      outcome: interruptedRecoveryResult.outcome,
      resultFile: resolve(request.interruptedRecoveryResultFile),
    }),
    rollbackDecisions: Object.freeze({
      allowedDecisionFile: resolve(request.rollbackAllowedDecisionFile),
      blockedDecisionFile: resolve(request.rollbackBlockedDecisionFile),
    }),
    recoveryExercises: Object.freeze({
      failedReadinessResultFile: resolve(request.failedReadinessUpgradeResultFile),
      failedReadinessTerminalCheckpoint: failedReadinessUpgradeResult.terminalCheckpoint,
    }),
    schema: FINAL_LOCAL_ACCEPTANCE_RECOVERY_SCHEMA,
    semanticFingerprint,
    successfulUpgrade: Object.freeze({
      planFile: resolve(request.successfulUpgradePlanFile),
      planFingerprint: successfulUpgradePlan.planFingerprint,
      resultFile: resolve(request.successfulUpgradeResultFile),
      targetReleaseSemanticFingerprint: successfulUpgradeResult.targetRelease.semanticFingerprint,
    }),
  });
  writeJsonAtomically(outputFile, result);
  return result;
}

export function createBwsFinalLocalAcceptanceCleanupResult(
  request: CreateBwsFinalLocalAcceptanceCleanupResultRequest,
): BwsFinalLocalAcceptanceCleanupResult {
  const createdAt = requireIsoTimestamp((request.now ?? defaultNow)(), 'createdAt');
  const outputFile = resolve(request.outputFile);
  mkdirSync(dirname(outputFile), { recursive: true });
  const leakedLeaseCount = requireNonNegativeInteger(request.leakedLeaseCount, 'leakedLeaseCount');
  const leakedProcessIds = Object.freeze([...request.leakedProcessIds].map((value) => requirePositiveInteger(value, 'leakedProcessIds[]')));
  const remainingTemporaryFiles = Object.freeze([...request.remainingTemporaryFiles].map((value) => requireNonEmptyString(value, 'remainingTemporaryFiles[]')));
  const temporaryDirectories = Object.freeze([...request.temporaryDirectories].map((value) => requireNonEmptyString(value, 'temporaryDirectories[]')));
  const verified = leakedLeaseCount === 0 && leakedProcessIds.length === 0 && remainingTemporaryFiles.length === 0;
  const semanticFingerprint = stableFingerprint(
    Object.freeze({
      leakedLeaseCount,
      leakedProcessIds,
      remainingTemporaryFiles,
      temporaryDirectories,
      verified,
    }),
  );
  const result: BwsFinalLocalAcceptanceCleanupResult = Object.freeze({
    createdAt,
    leakedLeaseCount,
    leakedProcessIds,
    remainingTemporaryFiles,
    schema: FINAL_LOCAL_ACCEPTANCE_CLEANUP_SCHEMA,
    semanticFingerprint,
    temporaryDirectories,
    verified,
  });
  writeJsonAtomically(outputFile, result);
  return result;
}

export function createBwsFinalLocalAcceptanceManifest(
  request: CreateBwsFinalLocalAcceptanceManifestRequest,
): BwsFinalLocalAcceptanceManifest {
  const acceptanceArtifactArchiveSha256 = requireSha256(
    request.acceptanceArtifactArchiveSha256,
    'acceptanceArtifactArchiveSha256',
  );
  const createdAt = requireIsoTimestamp((request.now ?? defaultNow)(), 'createdAt');
  const outputFile = resolve(request.outputFile);
  mkdirSync(dirname(outputFile), { recursive: true });

  const stageOne = readSchemaFile<BwsFinalLocalAcceptanceStageOneResult>(
    request.stageOneFile,
    FINAL_LOCAL_ACCEPTANCE_STAGE1_SCHEMA,
    'stageOneFile',
  );
  const runtime = readSchemaFile<BwsFinalLocalAcceptanceRuntimeResult>(
    request.runtimeResultFile,
    FINAL_LOCAL_ACCEPTANCE_RUNTIME_SCHEMA,
    'runtimeResultFile',
  );
  const recovery = readSchemaFile<BwsFinalLocalAcceptanceRecoveryResult>(
    request.recoveryResultFile,
    FINAL_LOCAL_ACCEPTANCE_RECOVERY_SCHEMA,
    'recoveryResultFile',
  );
  const cleanup = readSchemaFile<BwsFinalLocalAcceptanceCleanupResult>(
    request.cleanupResultFile,
    FINAL_LOCAL_ACCEPTANCE_CLEANUP_SCHEMA,
    'cleanupResultFile',
  );
  const soakManifest = readSchemaFile<BwsSoakCampaignManifest>(
    request.soakManifestFile,
    SOAK_CAMPAIGN_SCHEMA,
    'soakManifestFile',
  );
  const soakResult = readSchemaFile<BwsSoakCampaignExecutionResult>(
    request.soakResultFile,
    SOAK_CAMPAIGN_RESULT_SCHEMA,
    'soakResultFile',
  );
  const soakValidation = readSchemaFile<BwsSoakCampaignValidationResult>(
    request.soakValidationFile,
    SOAK_CAMPAIGN_VALIDATION_SCHEMA,
    'soakValidationFile',
  );
  const externalRuntimeCampaign = readSchemaFile<BwsExternalRuntimeCampaignManifest>(
    request.externalRuntimeCampaignFile,
    EXTERNAL_RUNTIME_CAMPAIGN_SCHEMA,
    'externalRuntimeCampaignFile',
  );

  if (!cleanup.verified) {
    throw new Error('Final local acceptance manifest requires cleanupResult.verified=true.');
  }
  if (!runtime.modesVerified.includes('api') || !runtime.modesVerified.includes('export')) {
    throw new Error('Final local acceptance manifest requires runtime evidence for both api and export modes.');
  }
  if (stageOne.release.semanticFingerprint !== externalRuntimeCampaign.release.semanticFingerprint) {
    throw new Error('Final local acceptance manifest requires stage 1 and external runtime campaign release fingerprints to match.');
  }
  if (stageOne.release.semanticFingerprint !== recovery.successfulUpgrade.targetReleaseSemanticFingerprint) {
    throw new Error('Final local acceptance manifest requires stage 1 release semantic fingerprint to match the successful upgrade target release.');
  }
  if (stageOne.release.upstreamLockFingerprintSha256 !== externalRuntimeCampaign.upstreamLock.fingerprintSha256) {
    throw new Error('Final local acceptance manifest requires stage 1 and external runtime campaign upstream lock fingerprints to match.');
  }
  if (soakManifest.release.semanticFingerprint !== stageOne.release.semanticFingerprint) {
    throw new Error('Final local acceptance manifest requires soak manifest and stage 1 release semantic fingerprints to match.');
  }
  if (soakResult.campaignSemanticFingerprint !== soakManifest.semanticFingerprint) {
    throw new Error('Final local acceptance manifest requires soak result and soak manifest semantic fingerprints to match.');
  }
  if (soakValidation.artifactArchiveSha256 !== soakResult.artifactArchiveSha256) {
    throw new Error('Final local acceptance manifest requires soak validation/result artifact archive parity.');
  }
  if (externalRuntimeCampaign.policy.executionEnabled !== false) {
    throw new Error('Final local acceptance manifest requires executionEnabled=false.');
  }
  if (externalRuntimeCampaign.policy.providerConnections !== 'disabled') {
    throw new Error('Final local acceptance manifest requires providerConnections=disabled.');
  }
  if (externalRuntimeCampaign.policy.runtimeMode !== 'paper') {
    throw new Error('Final local acceptance manifest requires runtimeMode=paper.');
  }

  const semanticFingerprint = stableFingerprint(
    Object.freeze({
      acceptanceArtifactArchiveSha256,
      cleanupResultFile: resolve(request.cleanupResultFile),
      externalRuntimeCampaignSemanticFingerprint: externalRuntimeCampaign.semanticFingerprint,
      recoveryResultFile: resolve(request.recoveryResultFile),
      releaseSemanticFingerprint: stageOne.release.semanticFingerprint,
      runtimeModesVerified: runtime.modesVerified,
      runtimeResultFile: resolve(request.runtimeResultFile),
      soakCampaignSemanticFingerprint: soakManifest.semanticFingerprint,
      soakResultFile: resolve(request.soakResultFile),
      soakValidationFile: resolve(request.soakValidationFile),
      stageOneResultFile: resolve(request.stageOneFile),
      upstreamLockFingerprintSha256: stageOne.release.upstreamLockFingerprintSha256,
    }),
  );
  const result: BwsFinalLocalAcceptanceManifest = Object.freeze({
    acceptanceArtifactArchiveSha256,
    cleanup: Object.freeze({
      resultFile: resolve(request.cleanupResultFile),
      verified: true,
    }),
    createdAt,
    externalRuntimeCampaign: Object.freeze({
      manifestFile: resolve(request.externalRuntimeCampaignFile),
      semanticFingerprint: externalRuntimeCampaign.semanticFingerprint,
      selectedMode: externalRuntimeCampaign.policy.selectedMode,
    }),
    providerExecutionClosed: Object.freeze({
      executionEnabled: false,
      providerConnections: 'disabled',
      runtimeMode: 'paper',
    }),
    recovery: Object.freeze({
      resultFile: resolve(request.recoveryResultFile),
      targetReleaseSemanticFingerprint: recovery.successfulUpgrade.targetReleaseSemanticFingerprint,
    }),
    release: Object.freeze({
      releaseId: stageOne.release.releaseId,
      semanticFingerprint: stageOne.release.semanticFingerprint,
      sourceManifestSha256: stageOne.release.sourceManifestSha256,
    }),
    runtime: Object.freeze({
      modesVerified: runtime.modesVerified,
      resultFile: resolve(request.runtimeResultFile),
    }),
    schema: FINAL_LOCAL_ACCEPTANCE_MANIFEST_SCHEMA,
    semanticFingerprint,
    soak: Object.freeze({
      campaignSemanticFingerprint: soakManifest.semanticFingerprint,
      manifestFile: resolve(request.soakManifestFile),
      resultFile: resolve(request.soakResultFile),
      validationFile: resolve(request.soakValidationFile),
    }),
    stageOne: Object.freeze({
      resultFile: resolve(request.stageOneFile),
    }),
    upstreamLock: Object.freeze({
      fingerprintSha256: stageOne.release.upstreamLockFingerprintSha256,
    }),
  });
  writeJsonAtomically(outputFile, result);
  return result;
}

function resolveStageOneDependencies(
  overrides: Partial<FinalLocalAcceptanceStageOneDependencies> | undefined,
): FinalLocalAcceptanceStageOneDependencies {
  return Object.freeze({
    applyMigrations: overrides?.applyMigrations ?? applySurebetMigrations,
    extractReleaseArchive: overrides?.extractReleaseArchive ?? extractReleaseArchive,
    getMigrationStatus: overrides?.getMigrationStatus ?? getBwsDatabaseMigrationStatus,
    verifyInstall: overrides?.verifyInstall ?? verifyBwsReleaseInstallation,
  });
}

function extractReleaseArchive(input: Readonly<{
  readonly archivePath: string;
  readonly extractionDirectory: string;
}>): string {
  execFileSync('tar', ['-xzf', input.archivePath, '-C', input.extractionDirectory], {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  const topLevelEntries = readdirSync(input.extractionDirectory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'));
  if (topLevelEntries.length !== 1 || !topLevelEntries[0]?.isDirectory()) {
    throw new Error('Final local acceptance stage 1 requires exactly one extracted top-level release directory.');
  }
  return join(input.extractionDirectory, topLevelEntries[0].name);
}

function readReleaseManifest(releaseDirectory: string): BwsReleaseManifest {
  const manifestFile = join(releaseDirectory, RELEASE_MANIFEST_FILE);
  assertRegularFile(manifestFile, 'release manifest');
  const parsed = JSON.parse(readFileSync(manifestFile, 'utf-8')) as BwsReleaseManifest;
  if (parsed.schema !== 'bws.release_manifest.v1') {
    throw new Error(`Unexpected release manifest schema in ${manifestFile}.`);
  }
  return parsed;
}

function assertMigrationStatusReadyForAcceptance(status: BwsMigrationStatusResult): void {
  if (status.schema !== 'bws.database_migration_status.v1') {
    throw new Error('Final local acceptance stage 1 requires bws.database_migration_status.v1 evidence.');
  }
  if (status.compatibility.status !== 'compatible') {
    throw new Error('Final local acceptance stage 1 requires migration compatibility.status=compatible.');
  }
  if (status.migrationLedger.pending.length !== 0) {
    throw new Error('Final local acceptance stage 1 requires zero pending migrations after the clean-room migration apply.');
  }
  if (status.migrationLedger.checksumMismatches.length !== 0) {
    throw new Error('Final local acceptance stage 1 requires zero migration checksum mismatches.');
  }
  if (status.drain.activeLifecycleDetected || status.drain.requiredForMigrationApply) {
    throw new Error('Final local acceptance stage 1 requires migrations to run without an active lifecycle drain requirement.');
  }
  if (status.ownership.migrationScope !== 'surebet_only_verified' || status.ownership.schema !== 'surebet') {
    throw new Error('Final local acceptance stage 1 requires verified surebet-only migration ownership.');
  }
  if (!status.ownership.schemaExists) {
    throw new Error('Final local acceptance stage 1 requires the surebet schema to exist after migration apply.');
  }
}

function ensureEmptyDirectory(directory: string, label: string): void {
  mkdirSync(directory, { recursive: true });
  const contents = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !isIgnorableDirectoryEntry(entry));
  if (contents.length !== 0) {
    throw new Error(`Final local acceptance stage 1 requires an empty ${label}.`);
  }
}

function isIgnorableDirectoryEntry(entry: Dirent): boolean {
  return entry.name === '.DS_Store';
}

function assertRegularFile(path: string, label: string): void {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Expected ${label} to be a regular file: ${path}`);
  }
}

function assertDirectory(path: string, label: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`Expected ${label} to be a directory: ${path}`);
  }
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function stableFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function readRuntimeEvidenceFile(path: string): BwsPaperRuntimeEvidenceResult & {
  readonly finalStatus: 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY';
} {
  const parsed = readSchemaFile<BwsPaperRuntimeEvidenceResult>(
    path,
    PAPER_RUNTIME_EVIDENCE_SCHEMA,
    'runtimeEvidenceFile',
  );
  if (parsed.finalStatus !== 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY') {
    throw new Error(`Final local acceptance runtime evidence requires finalStatus=PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY in ${path}.`);
  }
  return parsed as BwsPaperRuntimeEvidenceResult & {
    readonly finalStatus: 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY';
  };
}

function readSchemaFile<T extends { readonly schema: string }>(
  path: string,
  expectedSchema: string,
  label: string,
): T {
  const resolvedPath = resolve(path);
  assertRegularFile(resolvedPath, label);
  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf-8')) as T;
  if (parsed.schema !== expectedSchema) {
    throw new Error(`Unexpected ${label} schema in ${resolvedPath}.`);
  }
  return parsed;
}

function resolveEvidencePath(repositoryRoot: string, value: string): string {
  const resolvedValue = value.startsWith('/') ? resolve(value) : resolve(repositoryRoot, value);
  assertRegularFile(resolvedValue, 'evidence file');
  return resolvedValue;
}

function parseKeyValueFile(path: string, label: string): ReadonlyMap<string, string> {
  const values = new Map<string, string>();
  for (const rawLine of readFileSync(path, 'utf-8').split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf('=');
    if (separator <= 0) {
      throw new Error(`${label} must contain key=value lines only.`);
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key.length === 0 || value.length === 0) {
      throw new Error(`${label} must not contain empty keys or values.`);
    }
    if (values.has(key)) {
      throw new Error(`${label} must not contain duplicate ${key} entries.`);
    }
    values.set(key, value);
  }
  return values;
}

function requireExactToken(value: string | undefined, label: string): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required ${label}.`);
  }
  return value;
}

function requireSha256(value: string, label: string): string {
  if (!SHA256_HEX_PATTERN.test(value)) {
    throw new Error(`${label} must be a 64-character lowercase sha256 hex digest.`);
  }
  return value;
}

function requireNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function requireNonEmptyString(value: string, label: string): string {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function writeJsonAtomically(path: string, value: unknown): void {
  const temporaryPath = `${path}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, path);
}

function requireIsoTimestamp(value: string, label: string): string {
  if (!ISO_8601_UTC_MILLISECONDS.test(value)) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp with optional milliseconds.`);
  }
  return value;
}

function defaultNow(): string {
  return new Date().toISOString();
}
