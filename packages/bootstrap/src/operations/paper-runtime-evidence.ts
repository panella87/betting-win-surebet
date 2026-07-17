import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { type BwsMigrationStatusResult } from './database-lifecycle.js';
import {
  collectBwsDiagnosticsBundle,
  summarizeBwsEvidenceIndex,
  type BwsDiagnosticsBundleResult,
  type BwsEvidenceIndexSummary,
} from './observability.js';
import {
  createBwsPaperRuntimeHandoff,
  type CreateBwsPaperRuntimeHandoffResult,
} from './paper-runtime-handoff.js';
import {
  getManagedBwsOperatorStackStatus,
  startManagedBwsOperatorStack,
  stopManagedBwsOperatorStack,
  type BwsLifecycleRequest,
  type BwsOperatorLifecycleCommandResult,
} from './operator-lifecycle.js';

const BWS_PAPER_RUNTIME_EVIDENCE_SCHEMA = 'bws.paper_runtime_evidence.v1' as const;
const BWS_UPSTREAM_MODE_ENV = 'BWS_UPSTREAM_MODE';

export type BwsPaperRuntimeEvidenceFinalStatus =
  | 'PAPER_EVALUATION_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED'
  | 'PAPER_EVALUATION_BLOCKED_RUNTIME_OBSERVATION_NOT_READY'
  | 'PAPER_EVALUATION_BLOCKED_RUNTIME_OWNERSHIP_AMBIGUOUS'
  | 'PAPER_EVALUATION_BLOCKED_RUNTIME_STOP_FAILED'
  | 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY';

export interface BwsPaperRuntimeEvidenceObservationSample {
  readonly apiStatus: 'blocked' | 'ready';
  readonly cockpitStatus: 'blocked' | 'ready';
  readonly databaseStatus: BwsMigrationStatusResult['compatibility']['status'];
  readonly diagnosticsBundleDirectory: string;
  readonly diagnosticsManifestFile: string;
  readonly evidenceEntryCount: number;
  readonly generatedAt: string;
  readonly healthStatus: 'blocked' | 'healthy' | 'unknown';
  readonly lifecycleEvidenceFile: string;
  readonly lifecycleOutcome: BwsOperatorLifecycleCommandResult['outcome'];
  readonly readinessStatus: 'blocked' | 'ready' | 'unknown';
  readonly runtimeLifecycleState: string;
  readonly schedulerLifecycleState: string;
  readonly upstreamLifecycleState: string;
  readonly workerLifecycleState: string;
}

export interface BwsPaperRuntimeEvidenceResult {
  readonly collectionFailure?: Readonly<{
    readonly errorName: string;
    readonly message: string;
    readonly stage: BwsPaperRuntimeEvidenceCollectionStage;
  }>;
  readonly finalStatus: BwsPaperRuntimeEvidenceFinalStatus;
  readonly generatedAt: string;
  readonly latestDiagnosticsManifestFile?: string;
  readonly latestRuntimeHandoffFile?: string;
  readonly latestRuntimeHandoffLatestFile?: string;
  readonly observation: Readonly<{
    readonly endedAt: string;
    readonly intervalMs: number;
    readonly maxDurationMs: number;
    readonly sampleCount: number;
    readonly samples: readonly BwsPaperRuntimeEvidenceObservationSample[];
    readonly startedAt: string;
  }>;
  readonly runtimeHandoff?: CreateBwsPaperRuntimeHandoffResult;
  readonly schema: typeof BWS_PAPER_RUNTIME_EVIDENCE_SCHEMA;
  readonly selectedUpstreamMode: 'api' | 'export';
  readonly stackOwnership: 'ambiguous_preserved' | 'attached' | 'started';
  readonly stackStopDisposition:
    | 'attached_stack_preserved'
    | 'not_attempted'
    | 'preserved_due_to_ambiguity'
    | 'stopped_started_stack';
  readonly stopReason:
    | 'runtime_evidence_collection_failed'
    | 'runtime_observation_window_not_ready'
    | 'runtime_stack_stop_failed'
    | 'runtime_status_identity_or_configuration_mismatch'
    | 'runtime_window_ready_local_only';
}

export type BwsPaperRuntimeEvidenceCollectionStage =
  | 'diagnostics_collection'
  | 'diagnostics_manifest_read'
  | 'evidence_index_summary'
  | 'initial_lifecycle_status'
  | 'lifecycle_start'
  | 'observation_lifecycle_status'
  | 'observation_sleep'
  | 'runtime_handoff_creation'
  | 'runtime_stop';

export interface CreateBwsPaperRuntimeEvidenceRequest {
  readonly collectDiagnostics?: (request: Readonly<{ readonly repositoryRoot: string }>) => Promise<BwsDiagnosticsBundleResult>;
  readonly createRuntimeHandoff?: (request: Readonly<{ readonly repositoryRoot: string }>) => Promise<CreateBwsPaperRuntimeHandoffResult>;
  readonly getLifecycleStatus?: (request: BwsLifecycleRequest) => Promise<BwsOperatorLifecycleCommandResult>;
  readonly intervalMs: number;
  readonly keepMonitoringWhenReady?: boolean;
  readonly maxDurationMs: number;
  readonly now?: () => string;
  readonly repositoryRoot?: string;
  readonly sleep?: (durationMs: number) => Promise<void>;
  readonly startLifecycle?: (request: BwsLifecycleRequest) => Promise<BwsOperatorLifecycleCommandResult>;
  readonly stopLifecycle?: (request: BwsLifecycleRequest) => Promise<BwsOperatorLifecycleCommandResult>;
  readonly summarizeEvidenceIndex?: (repositoryRoot: string) => BwsEvidenceIndexSummary;
}

export interface WriteBwsPaperRuntimeEvidenceRequest extends CreateBwsPaperRuntimeEvidenceRequest {
  readonly outputPath: string;
}

interface RuntimeEvidenceManifest {
  readonly health?: Readonly<{
    readonly status?: 'blocked' | 'healthy';
  }>;
  readonly migrationStatus?: Readonly<{
    readonly compatibility?: Readonly<{
      readonly status?: BwsMigrationStatusResult['compatibility']['status'];
    }>;
  }>;
  readonly metrics?: Readonly<{
    readonly api?: Readonly<{
      readonly status?: 'blocked' | 'ready';
    }>;
    readonly cockpit?: Readonly<{
      readonly status?: 'blocked' | 'ready';
    }>;
    readonly database?: Readonly<{
      readonly status?: BwsMigrationStatusResult['compatibility']['status'];
    }>;
    readonly runtime?: Readonly<{
      readonly lifecycleState?: string;
    }>;
    readonly scheduler?: Readonly<{
      readonly lifecycleState?: string;
    }>;
    readonly upstream?: Readonly<{
      readonly lifecycleState?: string;
    }>;
    readonly worker?: Readonly<{
      readonly lifecycleState?: string;
    }>;
  }>;
  readonly readiness?: Readonly<{
    readonly status?: 'blocked' | 'ready';
  }>;
}

export async function createBwsPaperRuntimeEvidence(
  request: CreateBwsPaperRuntimeEvidenceRequest,
): Promise<BwsPaperRuntimeEvidenceResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const intervalMs = requirePositiveInteger(request.intervalMs, 'intervalMs');
  const maxDurationMs = requirePositiveInteger(request.maxDurationMs, 'maxDurationMs');
  const keepMonitoringWhenReady = request.keepMonitoringWhenReady ?? false;
  const now = request.now ?? defaultNow;
  const lifecycleRequest: BwsLifecycleRequest = Object.freeze({
    repositoryRoot,
  });
  const selectedUpstreamMode = requireUpstreamMode(process.env[BWS_UPSTREAM_MODE_ENV]);
  const getLifecycleStatus = request.getLifecycleStatus ?? getManagedBwsOperatorStackStatus;
  const startLifecycle = request.startLifecycle ?? startManagedBwsOperatorStack;
  const stopLifecycle = request.stopLifecycle ?? stopManagedBwsOperatorStack;
  const collectDiagnostics = request.collectDiagnostics
    ?? ((input: Readonly<{ readonly repositoryRoot: string }>) => collectBwsDiagnosticsBundle(input));
  const createRuntimeHandoff = request.createRuntimeHandoff
    ?? ((input: Readonly<{ readonly repositoryRoot: string }>) => createBwsPaperRuntimeHandoff(input));
  const summarizeEvidenceIndex = request.summarizeEvidenceIndex ?? summarizeBwsEvidenceIndex;
  const sleepFor = request.sleep ?? sleep;

  const startedAt = now();
  let stackOwnership: BwsPaperRuntimeEvidenceResult['stackOwnership'] = 'attached';
  let stackStopDisposition: BwsPaperRuntimeEvidenceResult['stackStopDisposition'] = 'not_attempted';
  let runtimeHandoff: CreateBwsPaperRuntimeHandoffResult | undefined;
  const samples: BwsPaperRuntimeEvidenceObservationSample[] = [];
  let startedLifecycle = false;
  let finalStatus: BwsPaperRuntimeEvidenceFinalStatus = 'PAPER_EVALUATION_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED';
  let stopReason: BwsPaperRuntimeEvidenceResult['stopReason'] = 'runtime_evidence_collection_failed';
  let activeStage: BwsPaperRuntimeEvidenceCollectionStage = 'initial_lifecycle_status';
  let collectionFailure: BwsPaperRuntimeEvidenceResult['collectionFailure'];

  try {
    activeStage = 'initial_lifecycle_status';
    const initialStatus = await readLifecycleStatusOrThrow(getLifecycleStatus, lifecycleRequest);
    if (initialStatus === undefined) {
      stackOwnership = 'ambiguous_preserved';
      stackStopDisposition = 'preserved_due_to_ambiguity';
      finalStatus = 'PAPER_EVALUATION_BLOCKED_RUNTIME_OWNERSHIP_AMBIGUOUS';
      stopReason = 'runtime_status_identity_or_configuration_mismatch';
    } else {
      if (initialStatus.outcome === 'not_running' || initialStatus.outcome === 'stale_state_cleaned') {
        activeStage = 'lifecycle_start';
        const startStatus = await startLifecycle(lifecycleRequest);
        if (startStatus.outcome !== 'started' && startStatus.outcome !== 'stale_state_cleaned') {
          throw new Error(`Unexpected lifecycle start outcome: ${startStatus.outcome}`);
        }
        stackOwnership = 'started';
        startedLifecycle = true;
      } else {
        stackOwnership = 'attached';
        stackStopDisposition = 'attached_stack_preserved';
      }

      const observationStart = Date.parse(startedAt);
      let ready = false;
      do {
        const cycleGeneratedAt = now();
        activeStage = 'observation_lifecycle_status';
        const lifecycleStatus = await getLifecycleStatus(lifecycleRequest);
        activeStage = 'diagnostics_collection';
        const diagnostics = await collectDiagnostics({ repositoryRoot });
        activeStage = 'diagnostics_manifest_read';
        const manifest = readDiagnosticsManifest(repositoryRoot, diagnostics.bundleManifestFile);
        activeStage = 'evidence_index_summary';
        const evidenceIndex = summarizeEvidenceIndex(repositoryRoot);
        const sample = buildObservationSample(
          cycleGeneratedAt,
          lifecycleStatus,
          diagnostics,
          manifest,
          evidenceIndex,
        );
        samples.push(sample);
        ready = sampleIsReady(sample);
        if (ready && runtimeHandoff === undefined) {
          activeStage = 'runtime_handoff_creation';
          runtimeHandoff = await createRuntimeHandoff({ repositoryRoot });
        }
        if (ready && !keepMonitoringWhenReady) {
          break;
        }
        if (Date.parse(cycleGeneratedAt) - observationStart >= maxDurationMs) {
          break;
        }
        activeStage = 'observation_sleep';
        await sleepFor(intervalMs);
      } while (true);

      if (ready) {
        finalStatus = 'PAPER_EVALUATION_READY_RUNTIME_EVIDENCE_LOCAL_ONLY';
        stopReason = 'runtime_window_ready_local_only';
      } else {
        finalStatus = 'PAPER_EVALUATION_BLOCKED_RUNTIME_OBSERVATION_NOT_READY';
        stopReason = 'runtime_observation_window_not_ready';
      }
    }
  } catch (error) {
    collectionFailure = createCollectionFailure(activeStage, error);
    finalStatus = 'PAPER_EVALUATION_BLOCKED_RUNTIME_EVIDENCE_COLLECTION_FAILED';
    stopReason = 'runtime_evidence_collection_failed';
  }

  if (startedLifecycle) {
    try {
      activeStage = 'runtime_stop';
      await stopLifecycle(lifecycleRequest);
      stackStopDisposition = 'stopped_started_stack';
    } catch (error) {
      collectionFailure = createCollectionFailure('runtime_stop', error);
      stackStopDisposition = 'preserved_due_to_ambiguity';
      finalStatus = 'PAPER_EVALUATION_BLOCKED_RUNTIME_STOP_FAILED';
      stopReason = 'runtime_stack_stop_failed';
    }
  }

  return createResult({
    ...(collectionFailure === undefined ? {} : { collectionFailure }),
    finalStatus,
    generatedAt: now(),
    intervalMs,
    ...(samples.at(-1)?.diagnosticsManifestFile === undefined
      ? {}
      : { latestDiagnosticsManifestFile: samples.at(-1)!.diagnosticsManifestFile }),
    ...(runtimeHandoff?.handoffFile === undefined ? {} : { latestRuntimeHandoffFile: runtimeHandoff.handoffFile }),
    ...(runtimeHandoff?.latestHandoffFile === undefined
      ? {}
      : { latestRuntimeHandoffLatestFile: runtimeHandoff.latestHandoffFile }),
    maxDurationMs,
    ...(runtimeHandoff === undefined ? {} : { runtimeHandoff }),
    samples,
    selectedUpstreamMode,
    stackOwnership,
    stackStopDisposition,
    startedAt,
    stopReason,
  });
}

export async function writeBwsPaperRuntimeEvidence(
  request: WriteBwsPaperRuntimeEvidenceRequest,
): Promise<BwsPaperRuntimeEvidenceResult> {
  const repositoryRoot = resolve(request.repositoryRoot ?? process.cwd());
  const outputPath = resolve(repositoryRoot, request.outputPath);
  const result = await createBwsPaperRuntimeEvidence(request);
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(result, null, 2)}\n`, 'utf-8');
  renameSync(temporaryPath, outputPath);
  return result;
}

function buildObservationSample(
  generatedAt: string,
  lifecycleStatus: BwsOperatorLifecycleCommandResult,
  diagnostics: BwsDiagnosticsBundleResult,
  manifest: RuntimeEvidenceManifest,
  evidenceIndex: BwsEvidenceIndexSummary,
): BwsPaperRuntimeEvidenceObservationSample {
  return Object.freeze({
    apiStatus: manifest.metrics?.api?.status ?? 'blocked',
    cockpitStatus: manifest.metrics?.cockpit?.status ?? 'blocked',
    databaseStatus: manifest.metrics?.database?.status
      ?? manifest.migrationStatus?.compatibility?.status
      ?? 'incompatible',
    diagnosticsBundleDirectory: diagnostics.bundleDirectory,
    diagnosticsManifestFile: diagnostics.bundleManifestFile,
    evidenceEntryCount: evidenceIndex.entryCount,
    generatedAt,
    healthStatus: manifest.health?.status ?? 'unknown',
    lifecycleEvidenceFile: lifecycleStatus.evidenceFile,
    lifecycleOutcome: lifecycleStatus.outcome,
    readinessStatus: manifest.readiness?.status ?? 'unknown',
    runtimeLifecycleState: manifest.metrics?.runtime?.lifecycleState ?? 'unknown',
    schedulerLifecycleState: manifest.metrics?.scheduler?.lifecycleState ?? 'unknown',
    upstreamLifecycleState: manifest.metrics?.upstream?.lifecycleState ?? 'unknown',
    workerLifecycleState: manifest.metrics?.worker?.lifecycleState ?? 'unknown',
  });
}

function sampleIsReady(sample: BwsPaperRuntimeEvidenceObservationSample): boolean {
  return sample.lifecycleOutcome === 'running'
    && sample.healthStatus === 'healthy'
    && sample.readinessStatus === 'ready'
    && sample.apiStatus === 'ready'
    && sample.cockpitStatus === 'ready'
    && sample.databaseStatus === 'compatible'
    && sample.runtimeLifecycleState === 'running'
    && sample.schedulerLifecycleState === 'running'
    && sample.upstreamLifecycleState === 'running'
    && sample.workerLifecycleState === 'running';
}

function createResult(request: Readonly<{
  readonly collectionFailure?: BwsPaperRuntimeEvidenceResult['collectionFailure'];
  readonly finalStatus: BwsPaperRuntimeEvidenceFinalStatus;
  readonly generatedAt: string;
  readonly intervalMs: number;
  readonly latestDiagnosticsManifestFile?: string;
  readonly latestRuntimeHandoffFile?: string;
  readonly latestRuntimeHandoffLatestFile?: string;
  readonly maxDurationMs: number;
  readonly runtimeHandoff?: CreateBwsPaperRuntimeHandoffResult;
  readonly samples: readonly BwsPaperRuntimeEvidenceObservationSample[];
  readonly selectedUpstreamMode: 'api' | 'export';
  readonly stackOwnership: BwsPaperRuntimeEvidenceResult['stackOwnership'];
  readonly stackStopDisposition: BwsPaperRuntimeEvidenceResult['stackStopDisposition'];
  readonly startedAt: string;
  readonly stopReason: BwsPaperRuntimeEvidenceResult['stopReason'];
}>): BwsPaperRuntimeEvidenceResult {
  return Object.freeze({
    ...(request.collectionFailure === undefined
      ? {}
      : { collectionFailure: request.collectionFailure }),
    finalStatus: request.finalStatus,
    generatedAt: request.generatedAt,
    ...(request.latestDiagnosticsManifestFile === undefined
      ? {}
      : { latestDiagnosticsManifestFile: request.latestDiagnosticsManifestFile }),
    ...(request.latestRuntimeHandoffFile === undefined
      ? {}
      : { latestRuntimeHandoffFile: request.latestRuntimeHandoffFile }),
    ...(request.latestRuntimeHandoffLatestFile === undefined
      ? {}
      : { latestRuntimeHandoffLatestFile: request.latestRuntimeHandoffLatestFile }),
    observation: Object.freeze({
      endedAt: request.generatedAt,
      intervalMs: request.intervalMs,
      maxDurationMs: request.maxDurationMs,
      sampleCount: request.samples.length,
      samples: Object.freeze([...request.samples]),
      startedAt: request.startedAt,
    }),
    ...(request.runtimeHandoff === undefined ? {} : { runtimeHandoff: request.runtimeHandoff }),
    schema: BWS_PAPER_RUNTIME_EVIDENCE_SCHEMA,
    selectedUpstreamMode: request.selectedUpstreamMode,
    stackOwnership: request.stackOwnership,
    stackStopDisposition: request.stackStopDisposition,
    stopReason: request.stopReason,
  });
}

async function readLifecycleStatusOrThrow(
  getLifecycleStatus: (request: BwsLifecycleRequest) => Promise<BwsOperatorLifecycleCommandResult>,
  lifecycleRequest: BwsLifecycleRequest,
): Promise<BwsOperatorLifecycleCommandResult | undefined> {
  try {
    return await getLifecycleStatus(lifecycleRequest);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Lifecycle state belongs to a different repository root.')
      || message.includes('Lifecycle state configuration fingerprint mismatch.')) {
      return undefined;
    }
    throw error;
  }
}

function readDiagnosticsManifest(repositoryRoot: string, manifestFile: string): RuntimeEvidenceManifest {
  const manifestPath = resolve(repositoryRoot, manifestFile);
  return JSON.parse(readFileSync(manifestPath, 'utf-8')) as RuntimeEvidenceManifest;
}

function createCollectionFailure(
  stage: BwsPaperRuntimeEvidenceCollectionStage,
  error: unknown,
): NonNullable<BwsPaperRuntimeEvidenceResult['collectionFailure']> {
  const rawName = error instanceof Error ? error.name : 'Error';
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = rawMessage
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[redacted]@')
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, '$1 [redacted]')
    .replace(
      /(?:api[_ -]?key|credential|mnemonic|passphrase|password|private[_ -]?key|secret|seed|token)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      (match) => {
        const separatorIndex = match.search(/[:=]/);
        return `${match.slice(0, separatorIndex + 1)}[redacted]`;
      },
    )
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 512);
  return Object.freeze({
    errorName: rawName.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 80) || 'Error',
    message: message || 'Runtime evidence collection failed without an error message.',
    stage,
  });
}

function requireUpstreamMode(value: string | undefined): 'api' | 'export' {
  if (value === 'api' || value === 'export') {
    return value;
  }
  throw new Error(`${BWS_UPSTREAM_MODE_ENV} must be exactly api or export.`);
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer. Received ${value}.`);
  }
  return value;
}

function defaultNow(): string {
  return new Date().toISOString();
}
