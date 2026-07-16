import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { registerBwsEvidenceArtifact } from './observability.js';
import { readBettingWinUpstreamLock } from '../../../upstream/src/index.js';

const SOAK_CAMPAIGN_SCHEMA = 'bws.soak_campaign.v1' as const;
const SOAK_CAMPAIGN_STATE_SCHEMA = 'bws.soak_campaign_state.v1' as const;
const SOAK_CAMPAIGN_CHECKPOINT_SCHEMA = 'bws.soak_campaign_checkpoint.v1' as const;
const SOAK_CAMPAIGN_RESULT_SCHEMA = 'bws.soak_campaign_result.v1' as const;
const SOAK_CAMPAIGN_VALIDATION_SCHEMA = 'bws.soak_campaign_validation.v1' as const;
const SOURCE_MANIFEST_SCHEMA = 'betting-win-surebet-source-manifest-v1' as const;
const SOURCE_MANIFEST_PATH = 'SOURCE_MANIFEST.json' as const;
const DEFAULT_UPSTREAM_LOCK_PATH = 'config/betting-win.upstream.lock.json' as const;

const SOAK_FAILURE_TARGETS = Object.freeze([
  'upstream_timeout',
  'api_malformed_response',
  'export_sha_replacement',
  'upstream_contract_profile_mismatch',
  'database_connection_interruption',
  'scheduler_crash_before_enqueue',
  'scheduler_crash_after_enqueue',
  'worker_crash_before_checkpoint',
  'worker_crash_after_checkpoint',
  'lease_expiry_stale_claim_recovery',
  'api_crash_and_restart',
  'cockpit_asset_mismatch',
  'partial_stack_startup',
  'interrupted_shutdown',
  'supervisor_crash',
  'evidence_publication_failure',
  'backup_interruption',
  'upgrade_interruption',
] as const);

const SOAK_FAILURE_STAGES = Object.freeze([
  'before_cycle',
  'during_cycle',
  'after_cycle',
  'during_recovery',
] as const);

const SOAK_CHECKPOINT_CLASSIFICATIONS = Object.freeze([
  'campaign_initialized',
  'campaign_resumed',
  'cycle_observed',
  'failure_injected',
  'recovery_verified',
  'campaign_completed',
  'cleanup_verified',
] as const);

const SOAK_CHECKPOINT_STATUSES = Object.freeze([
  'planned',
  'running',
  'recovered',
  'completed',
  'failed',
] as const);

type SoakFailureTarget = (typeof SOAK_FAILURE_TARGETS)[number];
type SoakFailureStage = (typeof SOAK_FAILURE_STAGES)[number];
type SoakCheckpointClassification = (typeof SOAK_CHECKPOINT_CLASSIFICATIONS)[number];
type SoakCheckpointStatus = (typeof SOAK_CHECKPOINT_STATUSES)[number];

interface SourceManifestDocument {
  readonly generated: string;
  readonly overlay: string;
  readonly schema: typeof SOURCE_MANIFEST_SCHEMA;
}

export interface BwsSoakCampaignFailureInjection {
  readonly expectedRecovery: 'continue' | 'restart_component' | 'resume_campaign' | 'stop_campaign';
  readonly injectionId: string;
  readonly notes?: string;
  readonly stage: SoakFailureStage;
  readonly target: SoakFailureTarget;
  readonly triggerCycleNumber: number;
}

export interface BwsSoakCampaignManifest {
  readonly campaignId: string;
  readonly checkpoints: Readonly<{
    readonly checkpointDirectory: string;
    readonly stateFile: string;
  }>;
  readonly closedBoundary: Readonly<{
    readonly automaticFallback: 'forbidden';
    readonly executionEnabled: false;
    readonly listenerExposure: 'loopback_only';
    readonly providerConnections: 'disabled';
  }>;
  readonly createdAt: string;
  readonly database: Readonly<{
    readonly identity: string;
  }>;
  readonly evidenceDirectory: string;
  readonly failureSchedule: readonly BwsSoakCampaignFailureInjection[];
  readonly observation: Readonly<{
    readonly durationMs: number;
    readonly intervalMs: number;
    readonly maxCycles: number;
  }>;
  readonly release: Readonly<{
    readonly semanticFingerprint: string;
  }>;
  readonly repositoryRoot: string;
  readonly resumeGuard: Readonly<{
    readonly databaseIdentity: string;
    readonly failureScheduleFingerprint: string;
    readonly releaseSemanticFingerprint: string;
    readonly seed: string;
    readonly selectedUpstreamMode: 'api' | 'export';
    readonly sourceManifestSha256: string;
    readonly upstreamLockFingerprint: string;
  }>;
  readonly runtimeDirectory: string;
  readonly schema: typeof SOAK_CAMPAIGN_SCHEMA;
  readonly seed: string;
  readonly semanticFingerprint: string;
  readonly source: Readonly<{
    readonly sourceManifestGeneratedAt: string;
    readonly sourceManifestOverlay: string;
    readonly sourceManifestSha256: string;
  }>;
  readonly upstream: Readonly<{
    readonly commitSha: string;
    readonly contractAlias: string;
    readonly contractSchema: string;
    readonly fingerprint: string;
    readonly gitTreeSha: string;
    readonly lockPath: string;
    readonly repositoryPath: string;
    readonly selectedMode: 'api' | 'export';
    readonly surebetProfile: string;
    readonly trackedTreeListingSha256: string;
  }>;
}

export interface BwsSoakCampaignState {
  readonly campaignSemanticFingerprint: string;
  readonly completedCycleCount: number;
  readonly createdAt: string;
  readonly currentCheckpointSequence: number;
  readonly lastCheckpointFile?: string;
  readonly lastCheckpointFingerprint?: string;
  readonly schema: typeof SOAK_CAMPAIGN_STATE_SCHEMA;
  readonly updatedAt: string;
}

export interface BwsSoakCampaignCheckpoint {
  readonly campaignSemanticFingerprint: string;
  readonly checkpointFingerprint: string;
  readonly classification: SoakCheckpointClassification;
  readonly createdAt: string;
  readonly cycleNumber?: number;
  readonly details: Readonly<Record<string, unknown>>;
  readonly schema: typeof SOAK_CAMPAIGN_CHECKPOINT_SCHEMA;
  readonly sequence: number;
  readonly status: SoakCheckpointStatus;
}

export interface BwsSoakCampaignExecutionArtifact {
  readonly path: string;
  readonly sha256: string;
}

export interface BwsSoakCampaignExecutedFailure {
  readonly details: Readonly<Record<string, unknown>>;
  readonly expectedRecovery: BwsSoakCampaignFailureInjection['expectedRecovery'];
  readonly injectionId: string;
  readonly recovered: boolean;
  readonly stage: SoakFailureStage;
  readonly status: SoakCheckpointStatus;
  readonly target: SoakFailureTarget;
  readonly triggerCycleNumber: number;
}

export interface BwsSoakCampaignExecutionResult {
  readonly artifactArchiveSha256: string;
  readonly artifactInventory: readonly BwsSoakCampaignExecutionArtifact[];
  readonly campaignSemanticFingerprint: string;
  readonly checkpointFiles: readonly string[];
  readonly cleanup: Readonly<{
    readonly details: Readonly<Record<string, unknown>>;
    readonly verified: boolean;
  }>;
  readonly createdAt: string;
  readonly executedCycles: readonly number[];
  readonly failures: readonly BwsSoakCampaignExecutedFailure[];
  readonly finalCompletedCycleCount: number;
  readonly manifestFile: string;
  readonly resultFile: string;
  readonly schema: typeof SOAK_CAMPAIGN_RESULT_SCHEMA;
  readonly stateFile: string;
}

export interface BwsSoakCampaignValidationResult {
  readonly artifactArchiveSha256: string;
  readonly checkpointCount: number;
  readonly executedCycleCount: number;
  readonly failuresVerified: number;
  readonly lastCheckpointFile: string;
  readonly ok: true;
  readonly schema: typeof SOAK_CAMPAIGN_VALIDATION_SCHEMA;
}

export interface CreateBwsSoakCampaignRequest {
  readonly checkpointDirectory: string;
  readonly databaseIdentity: string;
  readonly durationMs: number;
  readonly evidenceDirectory: string;
  readonly failureSchedule: readonly BwsSoakCampaignFailureInjection[];
  readonly manifestOutputFile: string;
  readonly maxCycles: number;
  readonly now?: () => string;
  readonly releaseSemanticFingerprint: string;
  readonly repositoryRoot?: string;
  readonly resume: boolean;
  readonly runtimeDirectory: string;
  readonly seed: string;
  readonly selectedUpstreamMode: 'api' | 'export';
  readonly stateFile: string;
  readonly upstreamLockPath?: string;
  readonly intervalMs: number;
}

export interface RecordBwsSoakCampaignCheckpointRequest {
  readonly classification: SoakCheckpointClassification;
  readonly cycleNumber?: number;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly manifestFile: string;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly stateFile: string;
  readonly status: SoakCheckpointStatus;
}

export interface CreateBwsSoakCampaignResult {
  readonly action: 'initialized' | 'resumed';
  readonly manifest: BwsSoakCampaignManifest;
  readonly manifestFile: string;
  readonly state: BwsSoakCampaignState;
  readonly stateFile: string;
}

export interface RecordBwsSoakCampaignCheckpointResult {
  readonly checkpoint: BwsSoakCampaignCheckpoint;
  readonly checkpointFile: string;
  readonly state: BwsSoakCampaignState;
  readonly stateFile: string;
}

export interface ExecuteBwsSoakCampaignRequest {
  readonly executeUntilCycleNumber: number;
  readonly manifestFile: string;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly resultFile: string;
  readonly stateFile: string;
  readonly dependencies?: Readonly<{
    readonly executeFailure?: (input: Readonly<{
      readonly cycleNumber: number;
      readonly failure: BwsSoakCampaignFailureInjection;
      readonly manifest: BwsSoakCampaignManifest;
      readonly state: BwsSoakCampaignState;
      readonly stage: SoakFailureStage;
    }>) => Promise<Readonly<{
      readonly details?: Readonly<Record<string, unknown>>;
      readonly recovered: boolean;
    }>>;
    readonly observeCycle?: (input: Readonly<{
      readonly cycleNumber: number;
      readonly manifest: BwsSoakCampaignManifest;
      readonly state: BwsSoakCampaignState;
    }>) => Promise<Readonly<Record<string, unknown>>>;
    readonly verifyCleanup?: (input: Readonly<{
      readonly executedCycles: readonly number[];
      readonly failures: readonly BwsSoakCampaignExecutedFailure[];
      readonly manifest: BwsSoakCampaignManifest;
      readonly state: BwsSoakCampaignState;
    }>) => Promise<Readonly<Record<string, unknown>>>;
  }>;
}

export interface ValidateBwsSoakCampaignExecutionRequest {
  readonly repositoryRoot?: string;
  readonly resultFile: string;
}

type SoakFailureExecutor = NonNullable<ExecuteBwsSoakCampaignRequest['dependencies']>['executeFailure'];

export async function createBwsSoakCampaign(
  request: CreateBwsSoakCampaignRequest,
): Promise<CreateBwsSoakCampaignResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const now = request.now ?? defaultNow;
  const createdAt = now();
  const durationMs = requirePositiveInteger(request.durationMs, 'durationMs');
  const intervalMs = requirePositiveInteger(request.intervalMs, 'intervalMs');
  const maxCycles = requirePositiveInteger(request.maxCycles, 'maxCycles');
  validateObservationWindow(durationMs, intervalMs, maxCycles);
  const sourceManifest = readSourceManifest(repositoryRoot);
  const sourceManifestBytes = readRequiredFile(repositoryRoot, SOURCE_MANIFEST_PATH);
  const sourceManifestSha256 = createHash('sha256').update(sourceManifestBytes).digest('hex');
  const upstreamLockPath = normalizeRelativePath(request.upstreamLockPath ?? DEFAULT_UPSTREAM_LOCK_PATH);
  const upstreamLock = readBettingWinUpstreamLock(join(repositoryRoot, upstreamLockPath), repositoryRoot);
  const failureSchedule = freezeSortedFailureSchedule(request.failureSchedule, maxCycles);
  const failureScheduleFingerprint = sha256CanonicalJson(failureSchedule);
  const manifestWithoutIdentity = Object.freeze({
    checkpoints: Object.freeze({
      checkpointDirectory: normalizeRelativePath(request.checkpointDirectory),
      stateFile: normalizeRelativePath(request.stateFile),
    }),
    closedBoundary: Object.freeze({
      automaticFallback: 'forbidden' as const,
      executionEnabled: false as const,
      listenerExposure: 'loopback_only' as const,
      providerConnections: 'disabled' as const,
    }),
    database: Object.freeze({
      identity: requireToken(request.databaseIdentity, 'databaseIdentity'),
    }),
    evidenceDirectory: normalizeRelativePath(request.evidenceDirectory),
    failureSchedule,
    observation: Object.freeze({
      durationMs,
      intervalMs,
      maxCycles,
    }),
    release: Object.freeze({
      semanticFingerprint: requireSha256(request.releaseSemanticFingerprint, 'releaseSemanticFingerprint'),
    }),
    repositoryRoot,
    resumeGuard: Object.freeze({
      databaseIdentity: requireToken(request.databaseIdentity, 'databaseIdentity'),
      failureScheduleFingerprint,
      releaseSemanticFingerprint: requireSha256(request.releaseSemanticFingerprint, 'releaseSemanticFingerprint'),
      seed: requireToken(request.seed, 'seed'),
      selectedUpstreamMode: requireUpstreamMode(request.selectedUpstreamMode),
      sourceManifestSha256,
      upstreamLockFingerprint: sha256CanonicalJson(upstreamLock),
    }),
    runtimeDirectory: normalizeRelativePath(request.runtimeDirectory),
    schema: SOAK_CAMPAIGN_SCHEMA,
    seed: requireToken(request.seed, 'seed'),
    source: Object.freeze({
      sourceManifestGeneratedAt: sourceManifest.generated,
      sourceManifestOverlay: sourceManifest.overlay,
      sourceManifestSha256,
    }),
    upstream: Object.freeze({
      commitSha: upstreamLock.commitSha,
      contractAlias: upstreamLock.contractAlias,
      contractSchema: upstreamLock.contractSchema,
      fingerprint: sha256CanonicalJson(upstreamLock),
      gitTreeSha: upstreamLock.gitTreeSha,
      lockPath: upstreamLockPath,
      repositoryPath: upstreamLock.repositoryPath,
      selectedMode: requireUpstreamMode(request.selectedUpstreamMode),
      surebetProfile: upstreamLock.surebetProfile,
      trackedTreeListingSha256: upstreamLock.trackedTreeListingSha256,
    }),
  });
  const semanticFingerprint = sha256CanonicalJson(manifestWithoutIdentity);
  const campaignId = `bws-soak-${semanticFingerprint.slice(0, 16)}`;
  const manifest: BwsSoakCampaignManifest = Object.freeze({
    campaignId,
    createdAt,
    semanticFingerprint,
    ...manifestWithoutIdentity,
  });

  const manifestOutputFile = resolveRepositoryPath(repositoryRoot, request.manifestOutputFile);
  const stateFile = resolveRepositoryPath(repositoryRoot, request.stateFile);
  mkdirSync(dirname(manifestOutputFile), { recursive: true });
  mkdirSync(dirname(stateFile), { recursive: true });
  mkdirSync(resolveRepositoryPath(repositoryRoot, request.checkpointDirectory), { recursive: true });

  if (request.resume) {
    const existingManifest = readBwsSoakCampaignManifest(manifestOutputFile);
    const existingState = readBwsSoakCampaignState(stateFile);
    assertResumeGuard(manifest, existingManifest, existingState);
    const resumedCheckpoint = await recordBwsSoakCampaignCheckpoint({
      classification: 'campaign_resumed',
      details: Object.freeze({
        action: 'resume',
        completedCycleCount: existingState.completedCycleCount,
        lastCheckpointFile: existingState.lastCheckpointFile ?? null,
      }),
      manifestFile: relative(repositoryRoot, manifestOutputFile),
      now,
      repositoryRoot,
      stateFile: relative(repositoryRoot, stateFile),
      status: 'completed',
    });
    registerEvidenceArtifacts(repositoryRoot, existingManifest, manifestOutputFile);
    return Object.freeze({
      action: 'resumed',
      manifest: existingManifest,
      manifestFile: relative(repositoryRoot, manifestOutputFile),
      state: resumedCheckpoint.state,
      stateFile: relative(repositoryRoot, stateFile),
    });
  }

  if (existsSync(manifestOutputFile)) {
    throw new Error(`Soak campaign manifest already exists: ${manifestOutputFile}`);
  }
  if (existsSync(stateFile)) {
    throw new Error(`Soak campaign state already exists: ${stateFile}`);
  }

  const state: BwsSoakCampaignState = Object.freeze({
    campaignSemanticFingerprint: manifest.semanticFingerprint,
    completedCycleCount: 0,
    createdAt,
    currentCheckpointSequence: 0,
    schema: SOAK_CAMPAIGN_STATE_SCHEMA,
    updatedAt: createdAt,
  });

  writeJsonFileAtomic(manifestOutputFile, manifest);
  writeJsonFileAtomic(stateFile, state);
  const initializedCheckpoint = await recordBwsSoakCampaignCheckpoint({
    classification: 'campaign_initialized',
    details: Object.freeze({
      action: 'initialize',
      campaignId,
      seed: manifest.seed,
      selectedUpstreamMode: manifest.upstream.selectedMode,
    }),
    manifestFile: relative(repositoryRoot, manifestOutputFile),
    now,
    repositoryRoot,
    stateFile: relative(repositoryRoot, stateFile),
    status: 'completed',
  });
  registerEvidenceArtifacts(repositoryRoot, manifest, manifestOutputFile);

  return Object.freeze({
    action: 'initialized',
    manifest,
    manifestFile: relative(repositoryRoot, manifestOutputFile),
    state: initializedCheckpoint.state,
    stateFile: relative(repositoryRoot, stateFile),
  });
}

export async function recordBwsSoakCampaignCheckpoint(
  request: RecordBwsSoakCampaignCheckpointRequest,
): Promise<RecordBwsSoakCampaignCheckpointResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const now = request.now ?? defaultNow;
  const manifestFile = resolveRepositoryPath(repositoryRoot, request.manifestFile);
  const stateFile = resolveRepositoryPath(repositoryRoot, request.stateFile);
  const manifest = readBwsSoakCampaignManifest(manifestFile);
  const state = readBwsSoakCampaignState(stateFile);
  if (state.campaignSemanticFingerprint !== manifest.semanticFingerprint) {
    throw new Error('Soak campaign state does not match the manifest semantic fingerprint.');
  }

  const createdAt = now();
  const sequence = state.currentCheckpointSequence + 1;
  const classification = requireCheckpointClassification(request.classification);
  const cycleNumber = request.cycleNumber === undefined ? undefined : requirePositiveInteger(request.cycleNumber, 'cycleNumber');
  validateCheckpointProgression(manifest, state, classification, cycleNumber);
  const checkpointBase = Object.freeze({
    campaignSemanticFingerprint: manifest.semanticFingerprint,
    classification,
    createdAt,
    ...(cycleNumber === undefined ? {} : { cycleNumber }),
    details: freezeJsonObject(request.details ?? {}),
    schema: SOAK_CAMPAIGN_CHECKPOINT_SCHEMA,
    sequence,
    status: requireCheckpointStatus(request.status),
  });
  const checkpointFingerprint = sha256CanonicalJson(checkpointBase);
  const checkpoint: BwsSoakCampaignCheckpoint = Object.freeze({
    checkpointFingerprint,
    ...checkpointBase,
  });

  const checkpointDirectory = resolveRepositoryPath(repositoryRoot, manifest.checkpoints.checkpointDirectory);
  mkdirSync(checkpointDirectory, { recursive: true });
  const checkpointFileName = `checkpoint-${String(sequence).padStart(4, '0')}-${classification}.json`;
  const checkpointFile = join(checkpointDirectory, checkpointFileName);
  writeJsonFileAtomic(checkpointFile, checkpoint);

  const nextCompletedCycleCount = classification === 'cycle_observed'
    ? Math.max(state.completedCycleCount, cycleNumber ?? state.completedCycleCount)
    : state.completedCycleCount;
  const nextState: BwsSoakCampaignState = Object.freeze({
    ...state,
    completedCycleCount: nextCompletedCycleCount,
    currentCheckpointSequence: sequence,
    lastCheckpointFile: relative(repositoryRoot, checkpointFile),
    lastCheckpointFingerprint: checkpointFingerprint,
    updatedAt: createdAt,
  });
  writeJsonFileAtomic(stateFile, nextState);

  registerEvidenceArtifacts(repositoryRoot, manifest, checkpointFile, stateFile);

  return Object.freeze({
    checkpoint,
    checkpointFile: relative(repositoryRoot, checkpointFile),
    state: nextState,
    stateFile: relative(repositoryRoot, stateFile),
  });
}

export async function executeBwsSoakCampaign(
  request: ExecuteBwsSoakCampaignRequest,
): Promise<BwsSoakCampaignExecutionResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const now = request.now ?? defaultNow;
  const manifestFile = resolveRepositoryPath(repositoryRoot, request.manifestFile);
  const stateFile = resolveRepositoryPath(repositoryRoot, request.stateFile);
  const resultFile = resolveRepositoryPath(repositoryRoot, request.resultFile);
  const manifest = readBwsSoakCampaignManifest(manifestFile);
  let state = readBwsSoakCampaignState(stateFile);
  validateStateConsistency(manifest, state);
  const executeUntilCycleNumber = requireFailureTriggerCycleNumber(
    request.executeUntilCycleNumber,
    manifest.observation.maxCycles,
    'executeUntilCycleNumber',
  );
  if (executeUntilCycleNumber <= state.completedCycleCount) {
    throw new Error(
      'executeUntilCycleNumber must advance beyond the persisted completedCycleCount for the soak campaign.',
    );
  }

  const observeCycle = request.dependencies?.observeCycle ?? defaultObserveCycle;
  const executeFailure = request.dependencies?.executeFailure ?? defaultExecuteFailure;
  const verifyCleanup = request.dependencies?.verifyCleanup ?? defaultVerifyCleanup;

  const executedCycles: number[] = [];
  const failures: BwsSoakCampaignExecutedFailure[] = [];

  for (let cycleNumber = state.completedCycleCount + 1; cycleNumber <= executeUntilCycleNumber; cycleNumber += 1) {
    const beforeCycleFailures = await executeFailureStage({
      cycleNumber,
      executeFailure,
      failures,
      manifest,
      manifestFile: relative(repositoryRoot, manifestFile),
      now,
      repositoryRoot,
      stage: 'before_cycle',
      state,
      stateFile,
    });
    state = beforeCycleFailures.state;
    if (beforeCycleFailures.executedCount > 0) {
      state = (await executeFailureStage({
        cycleNumber,
        executeFailure,
        failures,
        manifest,
        manifestFile: relative(repositoryRoot, manifestFile),
        now,
        repositoryRoot,
        stage: 'during_recovery',
        state,
        stateFile,
      })).state;
    }

    const observation = freezeJsonObject(
      await observeCycle(
        Object.freeze({
          cycleNumber,
          manifest,
          state,
        }),
      ),
    );

    const duringCycleFailures = await executeFailureStage({
      cycleNumber,
      executeFailure,
      failures,
      manifest,
      manifestFile: relative(repositoryRoot, manifestFile),
      now,
      repositoryRoot,
      stage: 'during_cycle',
      state,
      stateFile,
    });
    state = duringCycleFailures.state;
    if (duringCycleFailures.executedCount > 0) {
      state = (await executeFailureStage({
        cycleNumber,
        executeFailure,
        failures,
        manifest,
        manifestFile: relative(repositoryRoot, manifestFile),
        now,
        repositoryRoot,
        stage: 'during_recovery',
        state,
        stateFile,
      })).state;
    }

    const cycleCheckpoint = await recordBwsSoakCampaignCheckpoint({
      classification: 'cycle_observed',
      cycleNumber,
      details: Object.freeze({
        failureInjectionIds: manifest.failureSchedule
          .filter((entry) => entry.triggerCycleNumber === cycleNumber)
          .map((entry) => entry.injectionId),
        ...observation,
      }),
      manifestFile: relative(repositoryRoot, manifestFile),
      now,
      repositoryRoot,
      stateFile: relative(repositoryRoot, stateFile),
      status: 'completed',
    });
    state = cycleCheckpoint.state;
    executedCycles.push(cycleNumber);

    const afterCycleFailures = await executeFailureStage({
      cycleNumber,
      executeFailure,
      failures,
      manifest,
      manifestFile: relative(repositoryRoot, manifestFile),
      now,
      repositoryRoot,
      stage: 'after_cycle',
      state,
      stateFile,
    });
    state = afterCycleFailures.state;
    if (afterCycleFailures.executedCount > 0) {
      state = (await executeFailureStage({
        cycleNumber,
        executeFailure,
        failures,
        manifest,
        manifestFile: relative(repositoryRoot, manifestFile),
        now,
        repositoryRoot,
        stage: 'during_recovery',
        state,
        stateFile,
      })).state;
    }
  }

  const campaignCompleted = await recordBwsSoakCampaignCheckpoint({
    classification: 'campaign_completed',
    details: Object.freeze({
      executedCycleCount: executedCycles.length,
      failedInjectionCount: failures.filter((entry) => entry.recovered !== true).length,
      recoveredInjectionCount: failures.filter((entry) => entry.recovered === true).length,
    }),
    manifestFile: relative(repositoryRoot, manifestFile),
    now,
    repositoryRoot,
    stateFile: relative(repositoryRoot, stateFile),
    status: 'completed',
  });
  state = campaignCompleted.state;

  const cleanupDetails = freezeJsonObject(
    await verifyCleanup(
      Object.freeze({
        executedCycles: Object.freeze([...executedCycles]),
        failures: Object.freeze([...failures]),
        manifest,
        state,
      }),
    ),
  );
  validateCleanupDetails(cleanupDetails);
  const cleanupCheckpoint = await recordBwsSoakCampaignCheckpoint({
    classification: 'cleanup_verified',
    details: Object.freeze({
      ...cleanupDetails,
      verified: true,
    }),
    manifestFile: relative(repositoryRoot, manifestFile),
    now,
    repositoryRoot,
    stateFile: relative(repositoryRoot, stateFile),
    status: 'completed',
  });
  state = cleanupCheckpoint.state;

  const checkpointFiles = listCheckpointFiles(repositoryRoot, manifest);
  const artifactInventory = buildArtifactInventory(repositoryRoot, [
    manifestFile,
    stateFile,
    ...checkpointFiles.map((path) => resolveRepositoryPath(repositoryRoot, path)),
  ]);
  const result: BwsSoakCampaignExecutionResult = Object.freeze({
    artifactArchiveSha256: sha256CanonicalJson(artifactInventory),
    artifactInventory,
    campaignSemanticFingerprint: manifest.semanticFingerprint,
    checkpointFiles: Object.freeze(checkpointFiles),
    cleanup: Object.freeze({
      details: cleanupDetails,
      verified: true,
    }),
    createdAt: requireIsoTimestamp(now(), 'createdAt'),
    executedCycles: Object.freeze([...executedCycles]),
    failures: Object.freeze([...failures]),
    finalCompletedCycleCount: state.completedCycleCount,
    manifestFile: relative(repositoryRoot, manifestFile),
    resultFile: relative(repositoryRoot, resultFile),
    schema: SOAK_CAMPAIGN_RESULT_SCHEMA,
    stateFile: relative(repositoryRoot, stateFile),
  });

  writeJsonFileAtomic(resultFile, result);
  registerBwsEvidenceArtifact({
    artifactPath: resultFile,
    artifactSchema: SOAK_CAMPAIGN_RESULT_SCHEMA,
    createdAt: result.createdAt,
    repositoryRoot,
    retentionClass: 'runtime',
    runtimeId: manifest.campaignId,
    sourceFingerprint: manifest.source.sourceManifestSha256,
  });
  return result;
}

export function validateBwsSoakCampaignExecution(
  request: ValidateBwsSoakCampaignExecutionRequest,
): BwsSoakCampaignValidationResult {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const resultFile = resolveRepositoryPath(repositoryRoot, request.resultFile);
  const result = readBwsSoakCampaignExecutionResult(resultFile);
  const manifest = readBwsSoakCampaignManifest(resolveRepositoryPath(repositoryRoot, result.manifestFile));
  const state = readBwsSoakCampaignState(resolveRepositoryPath(repositoryRoot, result.stateFile));
  if (result.campaignSemanticFingerprint !== manifest.semanticFingerprint) {
    throw new Error('Soak campaign result must match the manifest semantic fingerprint exactly.');
  }
  if (state.campaignSemanticFingerprint !== manifest.semanticFingerprint) {
    throw new Error('Soak campaign state must remain bound to the same manifest semantic fingerprint.');
  }
  if (state.completedCycleCount !== result.finalCompletedCycleCount) {
    throw new Error('Soak campaign result finalCompletedCycleCount must match the persisted state completedCycleCount.');
  }
  if (result.cleanup.verified !== true) {
    throw new Error('Soak campaign result requires verified cleanup evidence.');
  }
  validateCleanupDetails(result.cleanup.details);
  if (!observationBudgetSatisfied(manifest.observation, result.finalCompletedCycleCount)) {
    throw new Error('Soak campaign result must satisfy the manifest duration budget before validation can pass.');
  }

  const checkpoints = result.checkpointFiles.map((path) =>
    readBwsSoakCampaignCheckpoint(resolveRepositoryPath(repositoryRoot, path)),
  );
  if (checkpoints.length === 0) {
    throw new Error('Soak campaign result requires at least one retained checkpoint.');
  }
  validateCheckpointSequence(checkpoints);
  const initialCheckpoint = checkpoints[0];
  if (initialCheckpoint?.classification !== 'campaign_initialized') {
    throw new Error('Soak campaign execution must retain campaign_initialized as the first checkpoint.');
  }
  if (initialCheckpoint.status !== 'completed') {
    throw new Error('Soak campaign execution requires the campaign_initialized checkpoint to be completed.');
  }
  const lastCheckpoint = checkpoints[checkpoints.length - 1];
  if (state.lastCheckpointFile !== result.checkpointFiles[result.checkpointFiles.length - 1]) {
    throw new Error('Soak campaign state lastCheckpointFile must match the final retained checkpoint file.');
  }
  if (lastCheckpoint?.classification !== 'cleanup_verified') {
    throw new Error('Soak campaign execution must retain cleanup_verified as the terminal checkpoint.');
  }
  const campaignCompleted = checkpoints.find((entry) => entry.classification === 'campaign_completed');
  if (campaignCompleted === undefined || campaignCompleted.status !== 'completed') {
    throw new Error('Soak campaign execution must retain a completed campaign_completed checkpoint.');
  }

  const cycleCheckpoints = checkpoints.filter((entry) => entry.classification === 'cycle_observed');
  if (cycleCheckpoints.length !== result.executedCycles.length) {
    throw new Error('Soak campaign result executedCycles must match the retained cycle_observed checkpoint count.');
  }
  const observedCycles = cycleCheckpoints.map((entry) => entry.cycleNumber);
  if (!sameNumberArray(result.executedCycles, observedCycles)) {
    throw new Error('Soak campaign result executedCycles must match the retained cycle_observed checkpoints exactly.');
  }

  const expectedFailures = manifest.failureSchedule.filter(
    (entry) => entry.triggerCycleNumber <= result.finalCompletedCycleCount,
  );
  for (const failure of expectedFailures) {
    const injected = checkpoints.find(
      (entry) =>
        entry.classification === 'failure_injected'
        && entry.details['injectionId'] === failure.injectionId,
    );
    if (injected === undefined) {
      throw new Error(`Soak campaign result is missing failure_injected evidence for ${failure.injectionId}.`);
    }
    const recovered = checkpoints.find(
      (entry) =>
        entry.classification === 'recovery_verified'
        && entry.details['injectionId'] === failure.injectionId,
    );
    if (recovered === undefined) {
      throw new Error(`Soak campaign result is missing recovery_verified evidence for ${failure.injectionId}.`);
    }
    if (recovered.status === 'failed') {
      throw new Error(`Soak campaign result retains failed recovery evidence for ${failure.injectionId}.`);
    }
  }

  const artifactInventory = buildArtifactInventory(repositoryRoot, result.artifactInventory.map((entry) =>
    resolveRepositoryPath(repositoryRoot, entry.path),
  ));
  if (sha256CanonicalJson(artifactInventory) !== result.artifactArchiveSha256) {
    throw new Error('Soak campaign artifactArchiveSha256 must match the current retained artifact inventory exactly.');
  }

  return Object.freeze({
    artifactArchiveSha256: result.artifactArchiveSha256,
    checkpointCount: checkpoints.length,
    executedCycleCount: result.executedCycles.length,
    failuresVerified: expectedFailures.length,
    lastCheckpointFile: result.checkpointFiles[result.checkpointFiles.length - 1] ?? '',
    ok: true,
    schema: SOAK_CAMPAIGN_VALIDATION_SCHEMA,
  });
}

export function parseBwsSoakFailureSchedule(
  rawJson: string,
): readonly BwsSoakCampaignFailureInjection[] {
  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed)) {
    throw new Error('Soak failure schedule must be a JSON array.');
  }
  return freezeSortedFailureSchedule(
    parsed.map((value, index) => {
      const entry = requireRecord(value, `failureSchedule[${index}]`);
      return Object.freeze({
        expectedRecovery: requireExpectedRecovery(entry.expectedRecovery, `failureSchedule[${index}].expectedRecovery`),
        injectionId: requireToken(entry.injectionId, `failureSchedule[${index}].injectionId`),
        ...(entry.notes === undefined ? {} : { notes: requireNonEmptyString(entry.notes, `failureSchedule[${index}].notes`) }),
        stage: requireFailureStage(entry.stage, `failureSchedule[${index}].stage`),
        target: requireFailureTarget(entry.target, `failureSchedule[${index}].target`),
        triggerCycleNumber: requirePositiveInteger(entry.triggerCycleNumber, `failureSchedule[${index}].triggerCycleNumber`),
      });
    }),
  );
}

export function readBwsSoakCampaignManifest(path: string): BwsSoakCampaignManifest {
  const parsed = requireRecord(JSON.parse(readFileSync(path, 'utf-8')), path);
  if (parsed.schema !== SOAK_CAMPAIGN_SCHEMA) {
    throw new Error(`Unexpected soak campaign manifest schema in ${path}.`);
  }
  return parsed as unknown as BwsSoakCampaignManifest;
}

export function readBwsSoakCampaignState(path: string): BwsSoakCampaignState {
  const parsed = requireRecord(JSON.parse(readFileSync(path, 'utf-8')), path);
  if (parsed.schema !== SOAK_CAMPAIGN_STATE_SCHEMA) {
    throw new Error(`Unexpected soak campaign state schema in ${path}.`);
  }
  return parsed as unknown as BwsSoakCampaignState;
}

export function readBwsSoakCampaignExecutionResult(path: string): BwsSoakCampaignExecutionResult {
  const parsed = requireRecord(JSON.parse(readFileSync(path, 'utf-8')), path);
  if (parsed.schema !== SOAK_CAMPAIGN_RESULT_SCHEMA) {
    throw new Error(`Unexpected soak campaign result schema in ${path}.`);
  }
  return parsed as unknown as BwsSoakCampaignExecutionResult;
}

function assertResumeGuard(
  expected: BwsSoakCampaignManifest,
  existingManifest: BwsSoakCampaignManifest,
  existingState: BwsSoakCampaignState,
): void {
  if (existingManifest.semanticFingerprint !== expected.semanticFingerprint) {
    throw new Error('Soak campaign resume rejected because the manifest semantic fingerprint changed.');
  }
  if (existingState.campaignSemanticFingerprint !== expected.semanticFingerprint) {
    throw new Error('Soak campaign resume rejected because the persisted state points to a different campaign manifest.');
  }
  validateStateConsistency(existingManifest, existingState);
}

function registerEvidenceArtifacts(
  repositoryRoot: string,
  manifest: BwsSoakCampaignManifest,
  ...paths: readonly string[]
): void {
  for (const path of paths) {
    if (!existsSync(path)) {
      continue;
    }
    registerBwsEvidenceArtifact({
      artifactPath: path,
      artifactSchema: path === resolveRepositoryPath(repositoryRoot, manifest.checkpoints.stateFile)
        ? SOAK_CAMPAIGN_STATE_SCHEMA
        : path.endsWith('.json') && path.includes('/checkpoints/')
          ? SOAK_CAMPAIGN_CHECKPOINT_SCHEMA
          : SOAK_CAMPAIGN_SCHEMA,
      createdAt: manifest.createdAt,
      repositoryRoot,
      retentionClass: 'runtime',
      runtimeId: manifest.campaignId,
      sourceFingerprint: manifest.source.sourceManifestSha256,
    });
  }
}

function readSourceManifest(repositoryRoot: string): SourceManifestDocument {
  const parsed = requireRecord(
    JSON.parse(readRequiredFile(repositoryRoot, SOURCE_MANIFEST_PATH)),
    SOURCE_MANIFEST_PATH,
  );
  if (parsed.schema !== SOURCE_MANIFEST_SCHEMA) {
    throw new Error(`SOURCE_MANIFEST.json schema must be ${SOURCE_MANIFEST_SCHEMA}.`);
  }
  return Object.freeze({
    generated: requireIsoTimestamp(parsed.generated, 'SOURCE_MANIFEST.json generated'),
    overlay: requireNonEmptyString(parsed.overlay, 'SOURCE_MANIFEST.json overlay'),
    schema: SOURCE_MANIFEST_SCHEMA,
  });
}

function readRequiredFile(repositoryRoot: string, path: string): string {
  const resolved = resolveRepositoryPath(repositoryRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`Required file does not exist: ${resolved}`);
  }
  return readFileSync(resolved, 'utf-8');
}

function resolveRepositoryPath(repositoryRoot: string, inputPath: string): string {
  const resolved = resolve(repositoryRoot, inputPath);
  const relativePath = relative(repositoryRoot, resolved);
  if (relativePath.startsWith('..') || relativePath === '') {
    if (relativePath === '') {
      throw new Error('Repository-root file paths must not resolve to the repository root.');
    }
    throw new Error(`Resolved repository path escapes the repository root: ${inputPath}`);
  }
  return resolved;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requireToken(value: unknown, label: string): string {
  const token = requireNonEmptyString(value, label);
  if (!/^[A-Za-z0-9._:/-]+$/.test(token)) {
    throw new Error(`${label} must use only ASCII letters, digits, dot, underscore, colon, slash, or hyphen.`);
  }
  return token;
}

function requireSha256(value: unknown, label: string): string {
  const text = requireNonEmptyString(value, label);
  if (!/^[a-f0-9]{64}$/.test(text)) {
    throw new Error(`${label} must be a 64-character lower-case sha256 value.`);
  }
  return text;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const text = requireNonEmptyString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(text)) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return text;
}

function requireUpstreamMode(value: unknown): 'api' | 'export' {
  if (value !== 'api' && value !== 'export') {
    throw new Error('selectedUpstreamMode must be exactly api or export.');
  }
  return value;
}

function requireFailureTarget(value: unknown, label: string): SoakFailureTarget {
  if (typeof value !== 'string' || !SOAK_FAILURE_TARGETS.includes(value as SoakFailureTarget)) {
    throw new Error(`${label} must be one of: ${SOAK_FAILURE_TARGETS.join(', ')}.`);
  }
  return value as SoakFailureTarget;
}

function requireFailureStage(value: unknown, label: string): SoakFailureStage {
  if (typeof value !== 'string' || !SOAK_FAILURE_STAGES.includes(value as SoakFailureStage)) {
    throw new Error(`${label} must be one of: ${SOAK_FAILURE_STAGES.join(', ')}.`);
  }
  return value as SoakFailureStage;
}

function requireExpectedRecovery(
  value: unknown,
  label: string,
): BwsSoakCampaignFailureInjection['expectedRecovery'] {
  if (
    value !== 'continue'
    && value !== 'restart_component'
    && value !== 'resume_campaign'
    && value !== 'stop_campaign'
  ) {
    throw new Error(`${label} must be continue, restart_component, resume_campaign, or stop_campaign.`);
  }
  return value;
}

function requireCheckpointClassification(value: unknown): SoakCheckpointClassification {
  if (typeof value !== 'string' || !SOAK_CHECKPOINT_CLASSIFICATIONS.includes(value as SoakCheckpointClassification)) {
    throw new Error(
      `classification must be one of: ${SOAK_CHECKPOINT_CLASSIFICATIONS.join(', ')}.`,
    );
  }
  return value as SoakCheckpointClassification;
}

function requireCheckpointStatus(value: unknown): SoakCheckpointStatus {
  if (typeof value !== 'string' || !SOAK_CHECKPOINT_STATUSES.includes(value as SoakCheckpointStatus)) {
    throw new Error(`status must be one of: ${SOAK_CHECKPOINT_STATUSES.join(', ')}.`);
  }
  return value as SoakCheckpointStatus;
}

function freezeSortedFailureSchedule(
  schedule: readonly BwsSoakCampaignFailureInjection[],
  maxCycles?: number,
): readonly BwsSoakCampaignFailureInjection[] {
  const seenIds = new Set<string>();
  const normalized = schedule.map((entry, index) => {
    if (seenIds.has(entry.injectionId)) {
      throw new Error(`failureSchedule contains a duplicate injectionId: ${entry.injectionId}`);
    }
    seenIds.add(entry.injectionId);
    return Object.freeze({
      expectedRecovery: requireExpectedRecovery(entry.expectedRecovery, `failureSchedule[${index}].expectedRecovery`),
      injectionId: requireToken(entry.injectionId, `failureSchedule[${index}].injectionId`),
      ...(entry.notes === undefined ? {} : { notes: requireNonEmptyString(entry.notes, `failureSchedule[${index}].notes`) }),
      stage: requireFailureStage(entry.stage, `failureSchedule[${index}].stage`),
      target: requireFailureTarget(entry.target, `failureSchedule[${index}].target`),
      triggerCycleNumber: maxCycles === undefined
        ? requirePositiveInteger(entry.triggerCycleNumber, `failureSchedule[${index}].triggerCycleNumber`)
        : requireFailureTriggerCycleNumber(
          entry.triggerCycleNumber,
          maxCycles,
          `failureSchedule[${index}].triggerCycleNumber`,
        ),
    });
  });
  normalized.sort((left, right) => {
    if (left.triggerCycleNumber !== right.triggerCycleNumber) {
      return left.triggerCycleNumber - right.triggerCycleNumber;
    }
    return left.injectionId.localeCompare(right.injectionId);
  });
  const failuresByCycle = new Map<number, readonly BwsSoakCampaignFailureInjection[]>();
  for (const entry of normalized) {
    const cycleFailures = failuresByCycle.get(entry.triggerCycleNumber) ?? Object.freeze([]);
    failuresByCycle.set(entry.triggerCycleNumber, Object.freeze([...cycleFailures, entry]));
  }
  for (const [cycleNumber, cycleFailures] of failuresByCycle.entries()) {
    const hasPrimaryFailure = cycleFailures.some((entry) => entry.stage !== 'during_recovery');
    if (!hasPrimaryFailure && cycleFailures.some((entry) => entry.stage === 'during_recovery')) {
      throw new Error(
        `failureSchedule triggerCycleNumber=${String(cycleNumber)} must include a non-during_recovery injection when during_recovery is scheduled.`,
      );
    }
  }
  return Object.freeze(normalized);
}

function sha256CanonicalJson(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function requireFailureTriggerCycleNumber(value: unknown, maxCycles: number, label: string): number {
  const triggerCycleNumber = requirePositiveInteger(value, label);
  if (triggerCycleNumber > maxCycles) {
    throw new Error(`${label} must not exceed maxCycles=${String(maxCycles)}.`);
  }
  return triggerCycleNumber;
}

function validateObservationWindow(durationMs: number, intervalMs: number, maxCycles: number): void {
  if (BigInt(intervalMs) * BigInt(maxCycles) < BigInt(durationMs)) {
    throw new Error('The soak campaign observation budget must satisfy intervalMs * maxCycles >= durationMs.');
  }
}

function observationBudgetSatisfied(
  observation: Readonly<{
    readonly durationMs: number;
    readonly intervalMs: number;
  }>,
  completedCycleCount: number,
): boolean {
  return BigInt(observation.intervalMs) * BigInt(completedCycleCount) >= BigInt(observation.durationMs);
}

function validateStateConsistency(
  manifest: BwsSoakCampaignManifest,
  state: BwsSoakCampaignState,
): void {
  if (state.completedCycleCount > manifest.observation.maxCycles) {
    throw new Error('Soak campaign state completedCycleCount must not exceed the manifest maxCycles.');
  }
  if (state.currentCheckpointSequence === 0) {
    if (state.lastCheckpointFile !== undefined || state.lastCheckpointFingerprint !== undefined) {
      throw new Error('Soak campaign state with zero checkpoints must not retain last checkpoint metadata.');
    }
    return;
  }
  if (state.lastCheckpointFile === undefined || state.lastCheckpointFingerprint === undefined) {
    throw new Error('Soak campaign state with checkpoints must retain both lastCheckpointFile and lastCheckpointFingerprint.');
  }
}

function validateCheckpointProgression(
  manifest: BwsSoakCampaignManifest,
  state: BwsSoakCampaignState,
  classification: SoakCheckpointClassification,
  cycleNumber: number | undefined,
): void {
  validateStateConsistency(manifest, state);
  if (cycleNumber !== undefined && cycleNumber > manifest.observation.maxCycles) {
    throw new Error(`Soak campaign checkpoints must not exceed maxCycles=${String(manifest.observation.maxCycles)}.`);
  }
  if (classification === 'cycle_observed') {
    if (cycleNumber === undefined) {
      throw new Error('cycle_observed checkpoints require cycleNumber.');
    }
    if (cycleNumber <= state.completedCycleCount) {
      throw new Error('cycle_observed checkpoints must advance beyond the persisted completedCycleCount.');
    }
  }
}

async function executeFailureStage(input: Readonly<{
  readonly cycleNumber: number;
  readonly executeFailure: SoakFailureExecutor;
  readonly failures: BwsSoakCampaignExecutedFailure[];
  readonly manifest: BwsSoakCampaignManifest;
  readonly manifestFile: string;
  readonly now: () => string;
  readonly repositoryRoot: string;
  readonly stage: SoakFailureStage;
  readonly state: BwsSoakCampaignState;
  readonly stateFile: string;
}>): Promise<Readonly<{
  readonly executedCount: number;
  readonly state: BwsSoakCampaignState;
}>> {
  let state = input.state;
  let executedCount = 0;
  const executedInjectionIds = new Set(input.failures.map((entry) => entry.injectionId));
  const stageFailures = input.manifest.failureSchedule.filter(
    (entry) =>
      entry.triggerCycleNumber === input.cycleNumber
      && entry.stage === input.stage
      && !executedInjectionIds.has(entry.injectionId),
  );
  for (const failure of stageFailures) {
    executedCount += 1;
    const failureCheckpoint = await recordBwsSoakCampaignCheckpoint({
      classification: 'failure_injected',
      cycleNumber: input.cycleNumber,
      details: Object.freeze({
        expectedRecovery: failure.expectedRecovery,
        injectionId: failure.injectionId,
        stage: failure.stage,
        target: failure.target,
        triggerCycleNumber: failure.triggerCycleNumber,
      }),
      manifestFile: input.manifestFile,
      now: input.now,
      repositoryRoot: input.repositoryRoot,
      stateFile: relative(input.repositoryRoot, input.stateFile),
      status: 'running',
    });
    state = failureCheckpoint.state;
    const outcome = await (input.executeFailure ?? defaultExecuteFailure)(
      Object.freeze({
        cycleNumber: input.cycleNumber,
        failure,
        manifest: input.manifest,
        stage: input.stage,
        state,
      }),
    );
    const details = freezeJsonObject({
      ...(outcome.details ?? {}),
      injectionId: failure.injectionId,
    });
    const recoveryCheckpoint = await recordBwsSoakCampaignCheckpoint({
      classification: 'recovery_verified',
      cycleNumber: input.cycleNumber,
      details,
      manifestFile: input.manifestFile,
      now: input.now,
      repositoryRoot: input.repositoryRoot,
      stateFile: relative(input.repositoryRoot, input.stateFile),
      status: outcome.recovered ? 'recovered' : 'failed',
    });
    state = recoveryCheckpoint.state;
    input.failures.push(
      Object.freeze({
        details,
        expectedRecovery: failure.expectedRecovery,
        injectionId: failure.injectionId,
        recovered: outcome.recovered,
        stage: failure.stage,
        status: recoveryCheckpoint.checkpoint.status,
        target: failure.target,
        triggerCycleNumber: failure.triggerCycleNumber,
      }),
    );
    if (outcome.recovered !== true) {
      throw new Error(`Soak campaign failure injection ${failure.injectionId} did not recover cleanly.`);
    }
  }
  return Object.freeze({
    executedCount,
    state,
  });
}

async function defaultObserveCycle(input: Readonly<{
  readonly cycleNumber: number;
}>): Promise<Readonly<Record<string, unknown>>> {
  return Object.freeze({
    boundedProgress: true,
    cycleNumber: input.cycleNumber,
  });
}

async function defaultExecuteFailure(): Promise<Readonly<{
  readonly details: Readonly<Record<string, unknown>>;
  readonly recovered: boolean;
}>> {
  return Object.freeze({
    details: Object.freeze({
      recoveryMode: 'deterministic_default',
    }),
    recovered: true,
  });
}

async function defaultVerifyCleanup(): Promise<Readonly<Record<string, unknown>>> {
  return Object.freeze({
    leakedDatabases: 0,
    leakedProcesses: 0,
  });
}

function listCheckpointFiles(repositoryRoot: string, manifest: BwsSoakCampaignManifest): readonly string[] {
  const checkpointDirectory = resolveRepositoryPath(repositoryRoot, manifest.checkpoints.checkpointDirectory);
  if (!existsSync(checkpointDirectory)) {
    return Object.freeze([]);
  }
  return Object.freeze(
    readdirSync(checkpointDirectory)
      .filter((entry) => entry.endsWith('.json'))
      .sort()
      .map((entry) => relative(repositoryRoot, join(checkpointDirectory, entry))),
  );
}

function buildArtifactInventory(
  repositoryRoot: string,
  absolutePaths: readonly string[],
): readonly BwsSoakCampaignExecutionArtifact[] {
  return Object.freeze(
    absolutePaths
      .map((path) => resolve(path))
      .sort()
      .map((path) =>
        Object.freeze({
          path: relative(repositoryRoot, path),
          sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
        }),
      ),
  );
}

function readBwsSoakCampaignCheckpoint(path: string): BwsSoakCampaignCheckpoint {
  const parsed = requireRecord(JSON.parse(readFileSync(path, 'utf-8')), path);
  if (parsed.schema !== SOAK_CAMPAIGN_CHECKPOINT_SCHEMA) {
    throw new Error(`Unexpected soak campaign checkpoint schema in ${path}.`);
  }
  return parsed as unknown as BwsSoakCampaignCheckpoint;
}

function validateCheckpointSequence(checkpoints: readonly BwsSoakCampaignCheckpoint[]): void {
  for (let index = 0; index < checkpoints.length; index += 1) {
    const checkpoint = checkpoints[index];
    if (checkpoint === undefined) {
      continue;
    }
    if (checkpoint.sequence !== index + 1) {
      throw new Error('Soak campaign checkpoints must retain a gap-free increasing sequence.');
    }
  }
}

function validateCleanupDetails(details: Readonly<Record<string, unknown>>): void {
  validateZeroLeakCounter(details, 'leakedDatabases');
  validateZeroLeakCounter(details, 'leakedProcesses');
}

function validateZeroLeakCounter(
  details: Readonly<Record<string, unknown>>,
  fieldName: 'leakedDatabases' | 'leakedProcesses',
): void {
  const value = details[fieldName];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Soak campaign cleanup details must retain a non-negative integer ${fieldName} value.`);
  }
  if (value !== 0) {
    throw new Error(`Soak campaign cleanup verification requires ${fieldName}=0.`);
  }
}

function sameNumberArray(left: readonly number[], right: readonly (number | undefined)[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function freezeJsonObject(value: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return Object.freeze(Object.fromEntries(entries));
}

function normalizeRelativePath(value: string): string {
  const trimmed = requireNonEmptyString(value, 'path');
  const normalized = trimmed.replace(/\\/g, '/').replace(/^\.\//, '');
  if (normalized.startsWith('/')) {
    throw new Error(`Expected a repository-relative path but received ${JSON.stringify(value)}.`);
  }
  if (normalized.split('/').some((segment) => segment === '..')) {
    throw new Error(`Path must not contain parent-directory segments: ${JSON.stringify(value)}.`);
  }
  return normalized;
}

function writeJsonFileAtomic(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  renameSync(tempPath, path);
}

function defaultNow(): string {
  return new Date().toISOString();
}
