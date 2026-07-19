import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { readBettingWinUpstreamLock } from '../../../upstream/src/index.js';
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
const BETTING_WIN_API_UNAVAILABLE_BLOCKER = 'PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE' as const;
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);
const LOOPBACK_AUTHORITY_HOST = 'loopback';
const PAPER_RUNTIME_API_PORT_ENV = 'BWS_API_PORT';
const PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV = 'BWS_UPSTREAM_API_BASE_URL';
const PAPER_RUNTIME_UPSTREAM_API_CONTRACT_VERSION_ENV = 'BWS_UPSTREAM_API_CONTRACT_VERSION';
const PAPER_RUNTIME_UPSTREAM_API_TIMEOUT_MS_ENV = 'BWS_UPSTREAM_API_TIMEOUT_MS';
const PAPER_RUNTIME_UPSTREAM_LOCK_PATH_ENV = 'BWS_UPSTREAM_LOCK_PATH';
const PAPER_RUNTIME_UPSTREAM_PROBE_PATH = '/contract' as const;
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

export interface BwsPaperRuntimeEvidenceUpstreamApiPreflight {
  readonly blockerCode?: typeof BETTING_WIN_API_UNAVAILABLE_BLOCKER;
  readonly configuredBaseUrl: string;
  readonly errorMessage?: string;
  readonly errorName?: string;
  readonly failureClass?:
    | 'bws_local_api_conflict'
    | 'contract_version_mismatch'
    | 'http_status'
    | 'invalid_response'
    | 'invalid_url'
    | 'network_error';
  readonly httpStatus?: number;
  readonly localRuntimeApiBaseUrl: string;
  readonly noExportFallbackUsed: true;
  readonly outcome: 'blocked' | 'passed';
  readonly probePath: typeof PAPER_RUNTIME_UPSTREAM_PROBE_PATH;
  readonly reportedContractVersion?: string;
  readonly timeoutMs: number;
  readonly upstreamLock?: Readonly<{
    readonly commitSha: string;
    readonly packageVersion: string;
  }>;
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
    | 'betting_win_api_unavailable'
    | 'runtime_evidence_collection_failed'
    | 'runtime_observation_window_not_ready'
    | 'runtime_stack_stop_failed'
    | 'runtime_status_identity_or_configuration_mismatch'
    | 'runtime_window_ready_local_only';
  readonly upstreamApiPreflight?: BwsPaperRuntimeEvidenceUpstreamApiPreflight;
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
  | 'runtime_stop'
  | 'upstream_api_preflight';

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
  let upstreamApiPreflight: BwsPaperRuntimeEvidenceUpstreamApiPreflight | undefined;

  try {
    activeStage = 'upstream_api_preflight';
    upstreamApiPreflight = await runBettingWinUpstreamApiPreflight(repositoryRoot);
    if (upstreamApiPreflight.outcome === 'blocked') {
      collectionFailure = Object.freeze({
        errorName: upstreamApiPreflight.errorName ?? 'Error',
        message: upstreamApiPreflight.errorMessage
          ?? 'The betting-win upstream API preflight failed before runtime evidence could start.',
        stage: 'upstream_api_preflight',
      });
      stopReason = 'betting_win_api_unavailable';
      return createResult({
        collectionFailure,
        finalStatus,
        generatedAt: now(),
        intervalMs,
        maxDurationMs,
        samples,
        selectedUpstreamMode,
        stackOwnership,
        stackStopDisposition,
        startedAt,
        stopReason,
        upstreamApiPreflight,
      });
    }

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
    ...(upstreamApiPreflight === undefined ? {} : { upstreamApiPreflight }),
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
  readonly upstreamApiPreflight?: BwsPaperRuntimeEvidenceUpstreamApiPreflight;
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
    ...(request.upstreamApiPreflight === undefined ? {} : { upstreamApiPreflight: request.upstreamApiPreflight }),
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
      || message.includes('Lifecycle state configuration fingerprint mismatch.')
      || message.includes('Lifecycle command configuration fingerprint does not match the recorded managed process configuration.')) {
      return undefined;
    }
    throw error;
  }
}

async function runBettingWinUpstreamApiPreflight(
  repositoryRoot: string,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<BwsPaperRuntimeEvidenceUpstreamApiPreflight> {
  const timeoutMs = requirePositiveIntegerFromEnvironment(
    environment[PAPER_RUNTIME_UPSTREAM_API_TIMEOUT_MS_ENV],
    PAPER_RUNTIME_UPSTREAM_API_TIMEOUT_MS_ENV,
  );
  const configuredBaseUrl = sanitizeConfiguredUrl(
    requireNonEmptyString(
      environment[PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV],
      PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV,
    ),
  );
  const localRuntimeApiBaseUrl = buildLocalRuntimeApiBaseUrl(environment);
  const upstreamLock = readOptionalUpstreamLock(repositoryRoot, environment);
  const contractVersion = requireNonEmptyString(
    environment[PAPER_RUNTIME_UPSTREAM_API_CONTRACT_VERSION_ENV],
    PAPER_RUNTIME_UPSTREAM_API_CONTRACT_VERSION_ENV,
  );

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(configuredBaseUrl);
  } catch (error) {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl,
      error: new Error(
        `${PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV} must be an absolute URL: ${error instanceof Error ? error.message : String(error)}`,
      ),
      failureClass: 'invalid_url',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
  }

  if (parsedBaseUrl.protocol !== 'http:' && parsedBaseUrl.protocol !== 'https:') {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl,
      error: new Error(`${PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV} must use http or https.`),
      failureClass: 'invalid_url',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
  }
  if (parsedBaseUrl.username.length > 0 || parsedBaseUrl.password.length > 0) {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl,
      error: new Error(`${PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV} must not include embedded credentials.`),
      failureClass: 'invalid_url',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
  }
  if (parsedBaseUrl.search.length > 0 || parsedBaseUrl.hash.length > 0) {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl,
      error: new Error(`${PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV} must not include query or fragment components.`),
      failureClass: 'invalid_url',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
  }
  if (!LOOPBACK_HOSTS.has(parsedBaseUrl.hostname)) {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl,
      error: new Error(`${PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV} must stay on an explicit loopback host.`),
      failureClass: 'invalid_url',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
  }
  if (sameAuthorityAsLocalRuntimeApi(parsedBaseUrl, localRuntimeApiBaseUrl)) {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl,
      error: new Error(
        `${PAPER_RUNTIME_UPSTREAM_API_BASE_URL_ENV} must not target the local BWS API on ${localRuntimeApiBaseUrl}.`,
      ),
      failureClass: 'bws_local_api_conflict',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
  }

  const probeUrl = buildProbeUrl(parsedBaseUrl.toString(), PAPER_RUNTIME_UPSTREAM_PROBE_PATH);
  try {
    const response = await fetch(probeUrl, {
      headers: Object.freeze({
        accept: 'application/json',
      }),
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      return Object.freeze({
        blockerCode: BETTING_WIN_API_UNAVAILABLE_BLOCKER,
        configuredBaseUrl: stripTrailingSlash(parsedBaseUrl.toString()),
        errorMessage: redactBoundedMessage(
          `betting-win upstream API preflight probe ${PAPER_RUNTIME_UPSTREAM_PROBE_PATH} returned HTTP ${response.status}.`,
        ),
        errorName: 'Error',
        failureClass: 'http_status',
        httpStatus: response.status,
        localRuntimeApiBaseUrl,
        noExportFallbackUsed: true,
        outcome: 'blocked',
        probePath: PAPER_RUNTIME_UPSTREAM_PROBE_PATH,
        timeoutMs,
        ...(upstreamLock === undefined ? {} : { upstreamLock }),
      });
    }
    const parsed = requireRecord(await response.json(), 'betting-win upstream API preflight response');
    const reportedContractVersion = parseApiContractVersion(parsed);
    if (reportedContractVersion !== contractVersion) {
      return Object.freeze({
        blockerCode: BETTING_WIN_API_UNAVAILABLE_BLOCKER,
        configuredBaseUrl: stripTrailingSlash(parsedBaseUrl.toString()),
        errorMessage: redactBoundedMessage(
          `betting-win upstream API preflight expected contract version ${contractVersion} but received ${reportedContractVersion}.`,
        ),
        errorName: 'Error',
        failureClass: 'contract_version_mismatch',
        localRuntimeApiBaseUrl,
        noExportFallbackUsed: true,
        outcome: 'blocked',
        probePath: PAPER_RUNTIME_UPSTREAM_PROBE_PATH,
        reportedContractVersion,
        timeoutMs,
        ...(upstreamLock === undefined ? {} : { upstreamLock }),
      });
    }
    return Object.freeze({
      configuredBaseUrl: stripTrailingSlash(parsedBaseUrl.toString()),
      localRuntimeApiBaseUrl,
      noExportFallbackUsed: true,
      outcome: 'passed',
      probePath: PAPER_RUNTIME_UPSTREAM_PROBE_PATH,
      reportedContractVersion,
      timeoutMs,
      ...(upstreamLock === undefined ? {} : { upstreamLock }),
    });
  } catch (error) {
    return createUpstreamApiPreflightFailure({
      configuredBaseUrl: stripTrailingSlash(parsedBaseUrl.toString()),
      error,
      failureClass: error instanceof SyntaxError ? 'invalid_response' : 'network_error',
      localRuntimeApiBaseUrl,
      timeoutMs,
      upstreamLock,
    });
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
  const message = redactBoundedMessage(rawMessage);
  return Object.freeze({
    errorName: rawName.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 80) || 'Error',
    message: message || 'Runtime evidence collection failed without an error message.',
    stage,
  });
}

function createUpstreamApiPreflightFailure(request: Readonly<{
  readonly configuredBaseUrl: string;
  readonly error: unknown;
  readonly failureClass: NonNullable<BwsPaperRuntimeEvidenceUpstreamApiPreflight['failureClass']>;
  readonly localRuntimeApiBaseUrl: string;
  readonly timeoutMs: number;
  readonly upstreamLock: Readonly<{
    readonly commitSha: string;
    readonly packageVersion: string;
  }> | undefined;
}>): BwsPaperRuntimeEvidenceUpstreamApiPreflight {
  const errorName = request.error instanceof Error ? request.error.name : 'Error';
  const errorMessage = redactBoundedMessage(
    request.error instanceof Error ? request.error.message : String(request.error),
  );
  return Object.freeze({
    blockerCode: BETTING_WIN_API_UNAVAILABLE_BLOCKER,
    configuredBaseUrl: request.configuredBaseUrl,
    errorMessage: errorMessage || 'betting-win upstream API preflight failed without an error message.',
    errorName: errorName.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 80) || 'Error',
    failureClass: request.failureClass,
    localRuntimeApiBaseUrl: request.localRuntimeApiBaseUrl,
    noExportFallbackUsed: true,
    outcome: 'blocked',
    probePath: PAPER_RUNTIME_UPSTREAM_PROBE_PATH,
    timeoutMs: request.timeoutMs,
    ...(request.upstreamLock === undefined ? {} : { upstreamLock: request.upstreamLock }),
  });
}

function buildLocalRuntimeApiBaseUrl(environment: NodeJS.ProcessEnv): string {
  const apiPort = requirePositiveIntegerFromEnvironment(
    environment[PAPER_RUNTIME_API_PORT_ENV],
    PAPER_RUNTIME_API_PORT_ENV,
  );
  return `http://127.0.0.1:${String(apiPort)}`;
}

function buildProbeUrl(baseUrl: string, probePath: typeof PAPER_RUNTIME_UPSTREAM_PROBE_PATH): string {
  return new URL(probePath.slice(1), `${stripTrailingSlash(baseUrl)}/`).toString();
}

function sameAuthorityAsLocalRuntimeApi(parsedBaseUrl: URL, localRuntimeApiBaseUrl: string): boolean {
  const localRuntimeUrl = new URL(localRuntimeApiBaseUrl);
  return normalizeAuthorityHostname(parsedBaseUrl.hostname) === normalizeAuthorityHostname(localRuntimeUrl.hostname)
    && resolvedPort(parsedBaseUrl) === resolvedPort(localRuntimeUrl);
}

function normalizeAuthorityHostname(hostname: string): string {
  return LOOPBACK_HOSTS.has(hostname) ? LOOPBACK_AUTHORITY_HOST : hostname;
}

function resolvedPort(url: URL): string {
  if (url.port.length > 0) {
    return url.port;
  }
  return url.protocol === 'https:' ? '443' : '80';
}

function sanitizeConfiguredUrl(value: string): string {
  return value
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[redacted]@')
    .trim();
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function requireNonEmptyString(value: string | undefined, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requirePositiveIntegerFromEnvironment(value: string | undefined, label: string): number {
  const normalized = requireNonEmptyString(value, label);
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return requirePositiveInteger(Number.parseInt(normalized, 10), label);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
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
  throw new Error('betting-win upstream API preflight response must contain contractVersion or version.');
}

function readOptionalUpstreamLock(
  repositoryRoot: string,
  environment: NodeJS.ProcessEnv,
): Readonly<{ readonly commitSha: string; readonly packageVersion: string }> | undefined {
  const configuredPath = environment[PAPER_RUNTIME_UPSTREAM_LOCK_PATH_ENV];
  if (typeof configuredPath !== 'string' || configuredPath.trim().length === 0) {
    return undefined;
  }
  try {
    const upstreamLock = readBettingWinUpstreamLock(join(repositoryRoot, configuredPath.trim()), repositoryRoot);
    return Object.freeze({
      commitSha: upstreamLock.commitSha,
      packageVersion: upstreamLock.packageVersion,
    });
  } catch {
    return undefined;
  }
}

function redactBoundedMessage(rawMessage: string): string {
  return rawMessage
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
