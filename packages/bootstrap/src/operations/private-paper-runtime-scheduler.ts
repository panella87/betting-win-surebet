import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
  SurebetUpstreamApiConvergenceRepository,
  SurebetWorkerJobRepository,
  sha256Hex,
  stableJsonStringify,
  type JsonValue,
} from '../../../persistence/src/index.js';
import { validatePinnedBettingWinBundleIntake } from '../adapters/betting-win-pinned-bundle-intake.js';
import { validatePinnedBettingWinStrategyExportIntake } from '../adapters/betting-win-strategy-export-intake.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import {
  BWS_WORKER_QUEUE_NAME_ENV,
} from './service-runtime.js';
import {
  resolveBwsUpstreamExportConvergenceConfig,
  runBwsUpstreamExportConvergencePass,
  type BwsUpstreamExportConvergenceConfig,
  type BwsUpstreamExportConvergencePassResult,
} from './upstream-export-convergence.js';
import {
  resolveBwsUpstreamApiConvergenceConfig,
  runBwsUpstreamApiConvergencePass,
  type BwsUpstreamApiConvergenceConfig,
  type BwsUpstreamApiConvergenceEnvironment,
  type BwsUpstreamApiConvergencePassResult,
} from './upstream-api-convergence.js';
import type { SurebetImportRunRecord, SurebetPendingWorkerJobRecord } from '../../../persistence/src/index.js';
import type {
  PersistedPrivatePaperRuntimeJobPayload,
  SerializablePrivatePaperCandidatePlan,
} from '../workers/private-paper-runtime-jobs.js';

const PRIVATE_PAPER_SCHEDULE_SCHEMA = 'bws.private_paper_schedule.v1' as const;
const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const BWS_UPSTREAM_MODE_ENV = 'BWS_UPSTREAM_MODE';

export const BWS_PRIVATE_PAPER_SCHEDULE_PATH_ENV = 'BWS_PRIVATE_PAPER_SCHEDULE_PATH';
type BwsPrivatePaperSchedulerMode = 'api' | 'export';

export interface BwsPrivatePaperSchedulerEnvironment extends BwsUpstreamApiConvergenceEnvironment {
  readonly BWS_PRIVATE_PAPER_SCHEDULE_PATH?: string;
  readonly BWS_WORKER_QUEUE_NAME?: string;
}

export interface BwsPrivatePaperScheduleManifest {
  readonly schema: typeof PRIVATE_PAPER_SCHEDULE_SCHEMA;
  readonly mode: BwsPrivatePaperSchedulerMode;
  readonly schedulerCheckpointId: string;
  readonly runtimeId: string;
  readonly maxCandidatesPerCycle: number;
  readonly retryDelaysMs: readonly number[];
  readonly candidatePlans: readonly SerializablePrivatePaperCandidatePlan[];
}

interface BwsPrivatePaperSchedulerSharedConfig {
  readonly mode: BwsPrivatePaperSchedulerMode;
  readonly persistence: BwsUpstreamApiConvergenceConfig['persistence'];
  readonly queueName: string;
  readonly repositoryRoot: string;
  readonly schedule: Readonly<{
    readonly candidatePlans: readonly SerializablePrivatePaperCandidatePlan[];
    readonly configSha256: string;
    readonly manifestPath: string;
    readonly manifestSha256: string;
    readonly maxCandidatesPerCycle: number;
    readonly retryDelaysMs: readonly number[];
    readonly runtimeId: string;
    readonly schedulerCheckpointId: string;
  }>;
}

export interface BwsPrivatePaperApiSchedulerConfig extends BwsPrivatePaperSchedulerSharedConfig {
  readonly mode: 'api';
  readonly upstream: BwsUpstreamApiConvergenceConfig;
}

export interface BwsPrivatePaperExportSchedulerConfig extends BwsPrivatePaperSchedulerSharedConfig {
  readonly mode: 'export';
  readonly upstream: BwsUpstreamExportConvergenceConfig;
}

export type BwsPrivatePaperSchedulerConfig =
  | BwsPrivatePaperApiSchedulerConfig
  | BwsPrivatePaperExportSchedulerConfig;

export interface RunBwsPrivatePaperSchedulerPassRequest {
  readonly config?: BwsPrivatePaperSchedulerConfig;
  readonly environment?: BwsPrivatePaperSchedulerEnvironment;
  readonly importRuns?: Pick<SurebetImportRunRepository, 'get'>;
  readonly jobs?: Pick<SurebetWorkerJobRepository, 'create' | 'get'>;
  readonly pinnedStrategyExports?: Pick<SurebetPinnedStrategyExportRepository, 'get'>;
  readonly repositoryRoot?: string;
  readonly runUpstreamApiConvergencePass?: (
    request: { readonly config: BwsUpstreamApiConvergenceConfig },
  ) => Promise<BoundaryResult<BwsUpstreamApiConvergencePassResult>>;
  readonly runUpstreamExportConvergencePass?: (
    request: { readonly config: BwsUpstreamExportConvergenceConfig },
  ) => Promise<BoundaryResult<BwsUpstreamExportConvergencePassResult>>;
  readonly schedulerCheckpoints?: Pick<
    SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
    'advance' | 'create' | 'get'
  >;
  readonly upstreamApiCheckpoints?: Pick<SurebetUpstreamApiConvergenceRepository, 'get'>;
}

export interface BwsPrivatePaperSchedulerPassResult {
  readonly mode: BwsPrivatePaperSchedulerMode;
  readonly queueName: string;
  readonly runtimeId: string;
  readonly schedulerCheckpointId: string;
  readonly scheduled: boolean;
  readonly scheduledCycleNumber?: number;
  readonly scheduledJobId?: string;
  readonly duplicateSuppressed?: boolean;
  readonly completedCycleCount: number;
  readonly lastScheduledApiCycleNumber: number;
  readonly upstreamPass: BwsUpstreamApiConvergencePassResult | BwsUpstreamExportConvergencePassResult;
}

export function resolveBwsPrivatePaperSchedulerConfig(
  environment: BwsPrivatePaperSchedulerEnvironment = process.env as BwsPrivatePaperSchedulerEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsPrivatePaperSchedulerConfig {
  const requestedMode = environment[BWS_UPSTREAM_MODE_ENV];
  if (requestedMode !== 'api' && requestedMode !== 'export') {
    throw new Error(
      `${BWS_UPSTREAM_MODE_ENV} must be exactly api or export for the bounded private-paper scheduler; mode fallback remains forbidden.`,
    );
  }
  const resolvedRepositoryRoot = resolve(repositoryRoot);
  const queueName = requireAccepted(
    requireNonEmptyString(environment[BWS_WORKER_QUEUE_NAME_ENV], BWS_WORKER_QUEUE_NAME_ENV),
  );
  const manifestPath = resolveRepositoryFile(
    resolvedRepositoryRoot,
    requireAccepted(
      requireNonEmptyString(environment[BWS_PRIVATE_PAPER_SCHEDULE_PATH_ENV], BWS_PRIVATE_PAPER_SCHEDULE_PATH_ENV),
    ),
  );
  const manifestContents = readFileSync(manifestPath, 'utf-8');
  const manifestSha256 = sha256Hex(manifestContents);
  const manifest = parseBwsPrivatePaperScheduleManifest(manifestContents, manifestPath);
  if (!manifest.ok) {
    throw new Error(manifest.blockers.map((blocker) => blocker.message).join(' '));
  }
  if (manifest.value.mode !== requestedMode) {
    throw new Error(
      `${BWS_PRIVATE_PAPER_SCHEDULE_PATH_ENV} mode ${manifest.value.mode} must match ${BWS_UPSTREAM_MODE_ENV}=${requestedMode} exactly; BWS must not fall back between explicit upstream modes.`,
    );
  }

  if (requestedMode === 'api') {
    const upstream = resolveBwsUpstreamApiConvergenceConfig(environment, repositoryRoot);
    const configSha256 = sha256Hex(
      stableJsonStringify(
        Object.freeze({
          apiBaseUrl: upstream.query.baseUrl,
          candidatePlans: manifest.value.candidatePlans,
          checkpointId: upstream.checkpointId,
          contractVersion: upstream.query.contractVersion,
          maxCandidatesPerCycle: manifest.value.maxCandidatesPerCycle,
          maxPagesPerResource: upstream.query.maxPagesPerResource,
          mode: 'api',
          pageSize: upstream.query.pageSize,
          queueName,
          retryBackoffMs: upstream.query.retryBackoffMs,
          retryDelaysMs: manifest.value.retryDelaysMs,
          retryLimit: upstream.query.retryLimit,
          runtimeId: manifest.value.runtimeId,
          schedulerCheckpointId: manifest.value.schedulerCheckpointId,
          timeoutMs: upstream.query.timeoutMs,
          upstreamCommitSha: upstream.upstream.lock.commitSha,
          upstreamGitTreeSha: upstream.upstream.lock.gitTreeSha,
        }) as unknown as JsonValue,
      ),
    );

    return Object.freeze({
      mode: 'api',
      persistence: upstream.persistence,
      queueName,
      repositoryRoot: resolvedRepositoryRoot,
      schedule: Object.freeze({
        candidatePlans: manifest.value.candidatePlans,
        configSha256,
        manifestPath,
        manifestSha256,
        maxCandidatesPerCycle: manifest.value.maxCandidatesPerCycle,
        retryDelaysMs: manifest.value.retryDelaysMs,
        runtimeId: manifest.value.runtimeId,
        schedulerCheckpointId: manifest.value.schedulerCheckpointId,
      }),
      upstream,
    });
  }

  const upstream = resolveBwsUpstreamExportConvergenceConfig(environment, repositoryRoot);
  const configSha256 = sha256Hex(
    stableJsonStringify(
      Object.freeze({
        candidatePlans: manifest.value.candidatePlans,
        checkpointId: upstream.selection.checkpointId,
        maxCandidatesPerCycle: manifest.value.maxCandidatesPerCycle,
        mode: 'export',
        queueName,
        retryDelaysMs: manifest.value.retryDelaysMs,
        selectionManifestSha256: upstream.selection.manifestSha256,
        selectionPath: upstream.selection.manifestPath,
        runtimeId: manifest.value.runtimeId,
        schedulerCheckpointId: manifest.value.schedulerCheckpointId,
        upstreamCommitSha: upstream.upstream.lock.commitSha,
        upstreamGitTreeSha: upstream.upstream.lock.gitTreeSha,
      }) as unknown as JsonValue,
    ),
  );

  return Object.freeze({
    mode: 'export',
    persistence: upstream.persistence,
    queueName,
    repositoryRoot: resolvedRepositoryRoot,
    schedule: Object.freeze({
      candidatePlans: manifest.value.candidatePlans,
      configSha256,
      manifestPath,
      manifestSha256,
      maxCandidatesPerCycle: manifest.value.maxCandidatesPerCycle,
      retryDelaysMs: manifest.value.retryDelaysMs,
      runtimeId: manifest.value.runtimeId,
      schedulerCheckpointId: manifest.value.schedulerCheckpointId,
    }),
    upstream,
  });
}

export async function runBwsPrivatePaperSchedulerPass(
  request: RunBwsPrivatePaperSchedulerPassRequest = {},
): Promise<BoundaryResult<BwsPrivatePaperSchedulerPassResult>> {
  const config = request.config ?? resolveBwsPrivatePaperSchedulerConfig(request.environment, request.repositoryRoot);
  const lockRecordId = buildUpstreamLockRecordId(config.upstream.upstream.lock.commitSha, config.upstream.upstream.lock.gitTreeSha);
  const schedulerCheckpoints = request.schedulerCheckpoints
    ?? new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(config.persistence);
  const jobs = request.jobs ?? new SurebetWorkerJobRepository(config.persistence);
  const schedulerCheckpoint = requireAccepted(
    resolveSchedulerCheckpoint(config, lockRecordId, schedulerCheckpoints),
  );
  if (config.mode === 'api') {
    const upstreamPass = await (request.runUpstreamApiConvergencePass ?? defaultRunUpstreamApiConvergencePass)({
      config: config.upstream,
    });
    if (!upstreamPass.ok) {
      return upstreamPass;
    }

    const upstreamApiCheckpoints = request.upstreamApiCheckpoints
      ?? new SurebetUpstreamApiConvergenceRepository(config.persistence);
    const importRuns = request.importRuns ?? new SurebetImportRunRepository(config.persistence);
    const apiCheckpoint = upstreamApiCheckpoints.get(config.upstream.checkpointId);
    if (apiCheckpoint === undefined) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULER_UPSTREAM_CHECKPOINT_MISSING',
        `BWS private-paper scheduler requires upstream API checkpoint ${config.upstream.checkpointId} after convergence.`,
        'Persisted upstream API checkpoint for the selected explicit api mode.',
      );
    }

    const nextCycleNumber = (schedulerCheckpoint.lastScheduledApiCycleNumber ?? 0) + 1;
    if (nextCycleNumber > apiCheckpoint.completedCycleCount) {
      return accepted(
        Object.freeze({
          completedCycleCount: apiCheckpoint.completedCycleCount,
          lastScheduledApiCycleNumber: schedulerCheckpoint.lastScheduledApiCycleNumber ?? 0,
          mode: 'api',
          queueName: config.queueName,
          runtimeId: config.schedule.runtimeId,
          scheduled: false,
          schedulerCheckpointId: config.schedule.schedulerCheckpointId,
          upstreamPass: upstreamPass.value,
        }),
      );
    }

    const completedCycleSource = findCompletedApiCycleSource(
      config.upstream,
      lockRecordId,
      nextCycleNumber,
      importRuns,
    );
    if (!completedCycleSource.ok) {
      return completedCycleSource;
    }

    return accepted(
      scheduleRuntimeJob(
        config,
        schedulerCheckpoint,
        jobs,
        nextCycleNumber,
        completedCycleSource.value.exportedAt,
        completedCycleSource.value.sourceId,
        buildApiRuntimeJobPayload(config, nextCycleNumber, buildSchedulerCycleId(config.schedule.schedulerCheckpointId, nextCycleNumber), completedCycleSource.value),
        apiCheckpoint.completedCycleCount,
        upstreamPass.value,
        schedulerCheckpoints,
      ),
    );
  }

  const upstreamPass = await (request.runUpstreamExportConvergencePass ?? defaultRunUpstreamExportConvergencePass)({
    config: config.upstream,
  });
  if (!upstreamPass.ok) {
    return upstreamPass;
  }

  const nextCycleNumber = (schedulerCheckpoint.lastScheduledApiCycleNumber ?? 0) + 1;
  if (nextCycleNumber > upstreamPass.value.nextSelectionIndex) {
    return accepted(
      Object.freeze({
        completedCycleCount: upstreamPass.value.nextSelectionIndex,
        lastScheduledApiCycleNumber: schedulerCheckpoint.lastScheduledApiCycleNumber ?? 0,
        mode: 'export',
        queueName: config.queueName,
        runtimeId: config.schedule.runtimeId,
        scheduled: false,
        schedulerCheckpointId: config.schedule.schedulerCheckpointId,
        upstreamPass: upstreamPass.value,
      }),
    );
  }

  const pinnedStrategyExports = request.pinnedStrategyExports
    ?? new SurebetPinnedStrategyExportRepository(config.persistence);
  const completedCycleSource = findCompletedExportCycleSource(
    config,
    lockRecordId,
    nextCycleNumber,
    pinnedStrategyExports,
  );
  if (!completedCycleSource.ok) {
    return completedCycleSource;
  }

  return accepted(
    scheduleRuntimeJob(
      config,
      schedulerCheckpoint,
      jobs,
      nextCycleNumber,
      completedCycleSource.value.exportedAt,
      completedCycleSource.value.sourceId,
      buildExportRuntimeJobPayload(
        config,
        nextCycleNumber,
        buildSchedulerCycleId(config.schedule.schedulerCheckpointId, nextCycleNumber),
        completedCycleSource.value,
      ),
      upstreamPass.value.nextSelectionIndex,
      upstreamPass.value,
      schedulerCheckpoints,
    ),
  );
}

export function parseBwsPrivatePaperScheduleManifest(
  text: string,
  manifestPath: string,
): BoundaryResult<BwsPrivatePaperScheduleManifest> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_JSON_INVALID',
      `BWS private-paper schedule manifest must contain valid JSON: ${manifestPath}`,
      'Valid repo-local BWS private-paper schedule JSON.',
    );
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_INVALID',
      'BWS private-paper schedule manifest must be a JSON object.',
      'BWS private-paper schedule manifest object.',
    );
  }
  const record = parsed as Record<string, unknown>;
  if (record.schema !== PRIVATE_PAPER_SCHEDULE_SCHEMA) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_SCHEMA_INVALID',
      `BWS private-paper schedule manifest schema must be ${PRIVATE_PAPER_SCHEDULE_SCHEMA}.`,
      'Schedule manifest schema bws.private_paper_schedule.v1.',
    );
  }
  if (record.mode !== 'api' && record.mode !== 'export') {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_MODE_INVALID',
      'BWS private-paper schedule manifest must declare mode=api or mode=export.',
      'Explicit api or export mode in the private-paper schedule manifest.',
    );
  }

  const schedulerCheckpointId = requireDeterministicId(record.schedulerCheckpointId, 'schedulerCheckpointId');
  if (!schedulerCheckpointId.ok) {
    return schedulerCheckpointId;
  }
  const runtimeId = requireDeterministicId(record.runtimeId, 'runtimeId');
  if (!runtimeId.ok) {
    return runtimeId;
  }
  const maxCandidatesPerCycle = requirePositiveInteger(record.maxCandidatesPerCycle, 'maxCandidatesPerCycle');
  if (!maxCandidatesPerCycle.ok) {
    return maxCandidatesPerCycle;
  }
  const retryDelaysMs = parseRetryDelays(record.retryDelaysMs);
  if (!retryDelaysMs.ok) {
    return retryDelaysMs;
  }
  const candidatePlans = parseSerializableCandidatePlans(record.candidatePlans);
  if (!candidatePlans.ok) {
    return candidatePlans;
  }

  return accepted(
    Object.freeze({
      candidatePlans: candidatePlans.value,
      maxCandidatesPerCycle: maxCandidatesPerCycle.value,
      mode: record.mode,
      retryDelaysMs: retryDelaysMs.value,
      runtimeId: runtimeId.value,
      schema: PRIVATE_PAPER_SCHEDULE_SCHEMA,
      schedulerCheckpointId: schedulerCheckpointId.value,
    }),
  );
}

function resolveSchedulerCheckpoint(
  config: BwsPrivatePaperSchedulerConfig,
  upstreamLockRecordId: string,
  repository: Pick<SurebetPrivatePaperRuntimeSchedulerCheckpointRepository, 'advance' | 'create' | 'get'>,
): BoundaryResult<ReturnType<Pick<SurebetPrivatePaperRuntimeSchedulerCheckpointRepository, 'create'>['create']>> {
  const existing = repository.get(config.schedule.schedulerCheckpointId);
  if (existing !== undefined) {
    if (
      existing.mode !== config.mode
      || existing.runtimeId !== config.schedule.runtimeId
      || existing.queueName !== config.queueName
      || existing.upstreamCheckpointId !== resolveSchedulerUpstreamCheckpointId(config)
      || existing.upstreamLockRecordId !== upstreamLockRecordId
      || existing.configSha256 !== config.schedule.configSha256
    ) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULER_CHECKPOINT_MUTATED',
        `BWS private-paper scheduler checkpoint ${config.schedule.schedulerCheckpointId} rejects mutable schedule replacement.`,
        'An unchanged explicit private-paper schedule bound to the same queue, upstream checkpoint, mode, and upstream lock.',
      );
    }
    return accepted(existing);
  }
  return accepted(
    repository.create({
      configSha256: config.schedule.configSha256,
      mode: config.mode,
      queueName: config.queueName,
      runtimeId: config.schedule.runtimeId,
      schedulerCheckpointId: config.schedule.schedulerCheckpointId,
      upstreamCheckpointId: resolveSchedulerUpstreamCheckpointId(config),
      upstreamLockRecordId,
    }),
  );
}

function buildApiRuntimeJobPayload(
  config: BwsPrivatePaperApiSchedulerConfig,
  cycleNumber: number,
  cycleId: string,
  source: { readonly exportedAt: string; readonly sourceId: string },
): PersistedPrivatePaperRuntimeJobPayload {
  return Object.freeze({
    candidatePlans: config.schedule.candidatePlans,
    cycleId,
    maxCandidatesPerCycle: config.schedule.maxCandidatesPerCycle,
    runtimeId: config.schedule.runtimeId,
    schema: 'bws.private_paper_runtime_job.v1',
    source: Object.freeze({
      apiBaseUrl: config.upstream.query.baseUrl,
      contractVersion: config.upstream.query.contractVersion,
      exportedAt: source.exportedAt,
      kind: 'read_only_query',
      maxPagesPerResource: config.upstream.query.maxPagesPerResource,
      pageSize: config.upstream.query.pageSize,
      retryBackoffMs: config.upstream.query.retryBackoffMs,
      retryLimit: config.upstream.query.retryLimit,
      sourceManifestHash: sha256Hex(
        stableJsonStringify(
          Object.freeze({
            apiBaseUrl: config.upstream.query.baseUrl,
            checkpointId: config.upstream.checkpointId,
            cycleNumber,
            exportedAt: source.exportedAt,
            manifestSha256: config.schedule.manifestSha256,
            runtimeId: config.schedule.runtimeId,
          }) as JsonValue,
        ),
      ),
      timeoutMs: config.upstream.query.timeoutMs,
    }),
    upstreamLockRecordId: buildUpstreamLockRecordId(
      config.upstream.upstream.lock.commitSha,
      config.upstream.upstream.lock.gitTreeSha,
    ),
  });
}

function buildExportRuntimeJobPayload(
  config: BwsPrivatePaperExportSchedulerConfig,
  cycleNumber: number,
  cycleId: string,
  source: Readonly<{
    readonly exportedAt: string;
    readonly pinnedStrategyExportRecordId: string;
    readonly records: readonly JsonValue[];
    readonly sourceId: string;
    readonly sourceManifestHash: string;
  }>,
): PersistedPrivatePaperRuntimeJobPayload {
  return Object.freeze({
    candidatePlans: config.schedule.candidatePlans,
    cycleId,
    maxCandidatesPerCycle: config.schedule.maxCandidatesPerCycle,
    pinnedStrategyExportRecordId: source.pinnedStrategyExportRecordId,
    runtimeId: config.schedule.runtimeId,
    schema: 'bws.private_paper_runtime_job.v1',
    source: Object.freeze({
      exportedAt: source.exportedAt,
      kind: 'pinned_records',
      records: source.records,
      sourceBundleKind: 'resource_export',
      sourceManifestHash: source.sourceManifestHash,
    }),
    upstreamLockRecordId: buildUpstreamLockRecordId(
      config.upstream.upstream.lock.commitSha,
      config.upstream.upstream.lock.gitTreeSha,
    ),
  });
}

function findCompletedApiCycleSource(
  config: BwsUpstreamApiConvergenceConfig,
  upstreamLockRecordId: string,
  cycleNumber: number,
  importRuns: Pick<SurebetImportRunRepository, 'get'>,
): BoundaryResult<{ readonly exportedAt: string; readonly sourceId: string }> {
  for (let pageNumber = 1; pageNumber <= config.query.maxPagesPerResource; pageNumber += 1) {
    const importRun = importRuns.get(buildApiImportRunId(config.checkpointId, cycleNumber, 'settlement', pageNumber));
    if (importRun === undefined) {
      continue;
    }
    const metadata = parseApiImportRunMetadata(importRun, config.checkpointId, upstreamLockRecordId);
    if (!metadata.ok) {
      return metadata;
    }
    if (
      metadata.value.cycleNumber === cycleNumber
      && metadata.value.resource === 'settlement'
      && metadata.value.pageNumber === pageNumber
      && metadata.value.nextCursor === undefined
      && importRun.outcome === 'succeeded'
    ) {
      return accepted(
        Object.freeze({
          exportedAt: metadata.value.responseReceivedAt,
          sourceId: `api-cycle:${config.checkpointId}:${cycleNumber}`,
        }),
      );
    }
  }
  return blocked(
    'BWS_PRIVATE_PAPER_SCHEDULER_CYCLE_SOURCE_MISSING',
    `BWS private-paper scheduler requires the completed settlement page metadata for API cycle ${cycleNumber}.`,
    'Persisted succeeded settlement-page import run metadata for the completed API cycle.',
  );
}

function findCompletedExportCycleSource(
  config: BwsPrivatePaperExportSchedulerConfig,
  upstreamLockRecordId: string,
  cycleNumber: number,
  pinnedStrategyExports: Pick<SurebetPinnedStrategyExportRepository, 'get'>,
): BoundaryResult<Readonly<{
  readonly exportedAt: string;
  readonly pinnedStrategyExportRecordId: string;
  readonly records: readonly JsonValue[];
  readonly sourceId: string;
  readonly sourceManifestHash: string;
}>> {
  const selectionEntry = config.upstream.selection.entries[cycleNumber - 1];
  if (selectionEntry === undefined) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_CYCLE_SOURCE_MISSING',
      `BWS private-paper scheduler requires explicit export selection ${cycleNumber} inside checkpoint ${config.upstream.selection.checkpointId}.`,
      'An explicit immutable export selection entry for the scheduled export-mode cycle.',
    );
  }

  const pinnedStrategyExportRecordId = buildPinnedStrategyExportRecordId(
    config.upstream.selection.checkpointId,
    selectionEntry.cursor,
  );
  const pinnedStrategyExport = pinnedStrategyExports.get(pinnedStrategyExportRecordId);
  if (pinnedStrategyExport === undefined) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_CYCLE_SOURCE_MISSING',
      `BWS private-paper scheduler requires pinned strategy export ${pinnedStrategyExportRecordId} for selection ${selectionEntry.cursor}.`,
      'Persisted pinned strategy export provenance for the scheduled export-mode cycle.',
    );
  }
  if (pinnedStrategyExport.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires pinned strategy export ${pinnedStrategyExportRecordId} to remain pinned to the verified upstream lock.`,
      'Persisted pinned strategy export provenance aligned to the same verified betting-win upstream lock.',
    );
  }

  const strategyExportIntake = validatePinnedBettingWinStrategyExportIntake({
    expectedSha256: selectionEntry.expectedSha256,
    exportPath: pinnedStrategyExport.sourceLocator,
    repositoryRoot: config.repositoryRoot,
    upstreamLock: config.upstream.upstream.lock,
  });
  if (!strategyExportIntake.ok) {
    return strategyExportIntake;
  }
  if (
    strategyExportIntake.value.exportId !== pinnedStrategyExport.exportId
    || strategyExportIntake.value.exportedAt !== pinnedStrategyExport.exportedAt
    || strategyExportIntake.value.sourceSha256 !== pinnedStrategyExport.sourceSha256
  ) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires pinned strategy export ${pinnedStrategyExportRecordId} to remain immutable after convergence.`,
      'Persisted pinned strategy export provenance whose source file, export id, and exportedAt stay unchanged.',
    );
  }

  const bundleIntake = validatePinnedBettingWinBundleIntake(
    pinnedStrategyExport.sourceLocator,
    config.repositoryRoot,
  );
  if (!bundleIntake.ok) {
    return bundleIntake;
  }

  return accepted(
    Object.freeze({
      exportedAt: bundleIntake.value.bundle.exportedAt,
      pinnedStrategyExportRecordId,
      records: bundleIntake.value.bundle.records as readonly JsonValue[],
      sourceId: `export-selection:${config.upstream.selection.checkpointId}:${selectionEntry.cursor}`,
      sourceManifestHash: bundleIntake.value.bundle.reference.manifestHash,
    }),
  );
}

function parseApiImportRunMetadata(
  importRun: SurebetImportRunRecord,
  checkpointId: string,
  upstreamLockRecordId: string,
): BoundaryResult<{
  readonly cycleNumber: number;
  readonly pageNumber: number;
  readonly resource: 'identity' | 'rules' | 'quotes' | 'settlement';
  readonly nextCursor?: string;
  readonly responseReceivedAt: string;
}> {
  if (importRun.sourceKind !== 'continuous_read_only_query_page') {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires continuous read-only query import runs for ${importRun.importRunId}.`,
      'Persisted continuous_read_only_query_page import runs created by the BWS API convergence pass.',
    );
  }
  if (importRun.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires import run ${importRun.importRunId} to remain pinned to the verified upstream lock.`,
      'Persisted API import runs aligned to the same verified betting-win upstream lock.',
    );
  }
  if (typeof importRun.metadata !== 'object' || importRun.metadata === null || Array.isArray(importRun.metadata)) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires object-shaped metadata for import run ${importRun.importRunId}.`,
      'Persisted object-shaped API import-run metadata.',
    );
  }
  const metadata = importRun.metadata as Record<string, unknown>;
  if (metadata.mode !== 'api' || typeof metadata.page !== 'object' || metadata.page === null || Array.isArray(metadata.page)) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires api-mode page metadata for import run ${importRun.importRunId}.`,
      'Persisted api-mode page metadata for the completed import run.',
    );
  }
  const page = metadata.page as Record<string, unknown>;
  const provenance = typeof page.provenance === 'object' && page.provenance !== null && !Array.isArray(page.provenance)
    ? page.provenance as Record<string, unknown>
    : undefined;
  if (metadata.checkpointId !== checkpointId || metadata.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires import-run metadata aligned to checkpoint ${checkpointId} and the verified upstream lock.`,
      'Persisted API import-run metadata aligned to the same checkpointId and upstreamLockRecordId.',
    );
  }
  const cycleNumber = requirePositiveInteger(metadata.cycleNumber, 'metadata.cycleNumber');
  const pageNumber = requirePositiveInteger(page.pageNumber, 'metadata.page.pageNumber');
  const resource = requireApiResource(page.resource, 'metadata.page.resource');
  const responseReceivedAt = requireIsoTimestamp(provenance?.responseReceivedAt, 'metadata.page.provenance.responseReceivedAt');
  if (!cycleNumber.ok || !pageNumber.ok || !resource.ok || !responseReceivedAt.ok) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULER_IMPORT_METADATA_INVALID',
      `BWS private-paper scheduler requires aligned api import-run page metadata for ${importRun.importRunId}.`,
      'Persisted api import-run metadata with cycleNumber, pageNumber, resource, and responseReceivedAt.',
    );
  }
  return accepted(
    Object.freeze({
      cycleNumber: cycleNumber.value,
      pageNumber: pageNumber.value,
      resource: resource.value,
      responseReceivedAt: responseReceivedAt.value,
      ...(typeof page.nextCursor === 'string' && page.nextCursor.length > 0
        ? { nextCursor: page.nextCursor }
        : {}),
    }),
  );
}

function parseRetryDelays(value: unknown): BoundaryResult<readonly number[]> {
  if (!Array.isArray(value)) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_RETRY_DELAYS_INVALID',
      'BWS private-paper schedule manifest requires retryDelaysMs to be an array.',
      'An explicit retryDelaysMs array for scheduled private-paper jobs.',
    );
  }
  const retryDelays: number[] = [];
  for (const delay of value) {
    if (!Number.isSafeInteger(delay) || delay < 0) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULE_RETRY_DELAYS_INVALID',
        'BWS private-paper schedule manifest requires every retry delay to be a non-negative integer.',
        'Non-negative integer retryDelaysMs entries.',
      );
    }
    retryDelays.push(delay);
  }
  return accepted(Object.freeze(retryDelays));
}

function parseSerializableCandidatePlans(value: unknown): BoundaryResult<readonly SerializablePrivatePaperCandidatePlan[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_PLANS_INVALID',
      'BWS private-paper schedule manifest requires a non-empty candidatePlans array.',
      'An explicit non-empty candidatePlans array for the scheduled private-paper runtime.',
    );
  }
  const plans: SerializablePrivatePaperCandidatePlan[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULE_PLANS_INVALID',
        'BWS private-paper schedule manifest requires object-shaped candidate plans.',
        'Object-shaped scheduled private-paper candidate plans.',
      );
    }
    const record = entry as Record<string, unknown>;
    const candidateId = requireNonEmptyString(record.candidateId, 'candidatePlans.candidateId');
    const decisionTimestamp = requireIsoTimestamp(record.decisionTimestamp, 'candidatePlans.decisionTimestamp');
    const maxQuoteAgeMs = requirePositiveInteger(record.maxQuoteAgeMs, 'candidatePlans.maxQuoteAgeMs');
    if (
      !candidateId.ok
      || !decisionTimestamp.ok
      || !maxQuoteAgeMs.ok
      || typeof record.manualKill !== 'boolean'
      || !Array.isArray(record.completionEvents)
    ) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULE_PLANS_INVALID',
        'BWS private-paper schedule manifest requires candidate plans with ids, timestamps, positive maxQuoteAgeMs, manualKill, and completionEvents.',
        'Scheduled candidate plans aligned to the private-paper worker payload contract.',
      );
    }
    const completionEvents = parseSerializableCompletionEvents(record.completionEvents);
    if (!completionEvents.ok) {
      return completionEvents;
    }
    const residualExposureFloorMinor = record.residualExposureFloorMinor;
    if (residualExposureFloorMinor !== undefined && !isSignedIntegerString(residualExposureFloorMinor)) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULE_PLANS_INVALID',
        'BWS private-paper schedule manifest requires residualExposureFloorMinor to be an integer string when provided.',
        'Integer-string residualExposureFloorMinor values in scheduled candidate plans.',
      );
    }
    plans.push(
      Object.freeze({
        candidateId: candidateId.value,
        completionEvents: completionEvents.value,
        decisionTimestamp: decisionTimestamp.value,
        manualKill: record.manualKill,
        maxQuoteAgeMs: maxQuoteAgeMs.value,
        ...(residualExposureFloorMinor === undefined ? {} : { residualExposureFloorMinor: residualExposureFloorMinor as string }),
      }),
    );
  }
  return accepted(Object.freeze(plans));
}

function parseSerializableCompletionEvents(
  value: readonly unknown[],
): BoundaryResult<readonly ReturnType<typeof toSerializableCompletionEvent>[]> {
  const events: Array<ReturnType<typeof toSerializableCompletionEvent>> = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULE_EVENTS_INVALID',
        'BWS private-paper schedule manifest requires object-shaped completion events.',
        'Object-shaped completion events in scheduled candidate plans.',
      );
    }
    const record = entry as Record<string, unknown>;
    const legId = requireNonEmptyString(record.legId, 'candidatePlans.completionEvents.legId');
    const occurredAt = requireIsoTimestamp(record.occurredAt, 'candidatePlans.completionEvents.occurredAt');
    const stakeMinor = record.stakeMinor;
    if (
      !legId.ok
      || !occurredAt.ok
      || (record.type !== 'reserve'
        && record.type !== 'fill'
        && record.type !== 'reject'
        && record.type !== 'expire'
        && record.type !== 'rollback')
      || (stakeMinor !== undefined && !isSignedIntegerString(stakeMinor))
    ) {
      return blocked(
        'BWS_PRIVATE_PAPER_SCHEDULE_EVENTS_INVALID',
        'BWS private-paper schedule manifest requires supported completion events with legId, occurredAt, type, and integer-string stakeMinor when present.',
        'Scheduled private-paper completion events aligned to the worker payload contract.',
      );
    }
    events.push(toSerializableCompletionEvent(legId.value, occurredAt.value, record.type, stakeMinor));
  }
  return accepted(Object.freeze(events));
}

function requireAccepted<T>(result: BoundaryResult<T>): T {
  if (!result.ok) {
    throw new Error(result.blockers.map((blocker) => blocker.message).join(' '));
  }
  return result.value;
}

async function defaultRunUpstreamApiConvergencePass(
  request: { readonly config: BwsUpstreamApiConvergenceConfig },
): Promise<BoundaryResult<BwsUpstreamApiConvergencePassResult>> {
  return runBwsUpstreamApiConvergencePass(request);
}

async function defaultRunUpstreamExportConvergencePass(
  request: { readonly config: BwsUpstreamExportConvergenceConfig },
): Promise<BoundaryResult<BwsUpstreamExportConvergencePassResult>> {
  return runBwsUpstreamExportConvergencePass(request);
}

function resolveRepositoryFile(repositoryRoot: string, value: string): string {
  const resolved = resolve(repositoryRoot, value);
  if (!resolved.startsWith(repositoryRoot)) {
    throw new Error(`${BWS_PRIVATE_PAPER_SCHEDULE_PATH_ENV} must resolve inside the repository root.`);
  }
  return resolved;
}

function buildSchedulerJobId(schedulerCheckpointId: string, cycleNumber: number): string {
  return `private-paper:${schedulerCheckpointId}:cycle:${cycleNumber}`;
}

function buildSchedulerCycleId(schedulerCheckpointId: string, cycleNumber: number): string {
  return `${schedulerCheckpointId}:cycle:${cycleNumber}`;
}

function buildApiImportRunId(
  checkpointId: string,
  cycleNumber: number,
  resource: 'identity' | 'rules' | 'quotes' | 'settlement',
  pageNumber: number,
): string {
  return `import:${checkpointId}:cycle:${cycleNumber}:${resource}:page:${pageNumber}`;
}

function buildUpstreamLockRecordId(commitSha: string, gitTreeSha: string): string {
  return `upstream-lock:${commitSha}:${gitTreeSha}`;
}

function buildPinnedStrategyExportRecordId(checkpointId: string, cursor: string): string {
  return `pinned-export:${checkpointId}:${cursor}`;
}

function resolveSchedulerUpstreamCheckpointId(config: BwsPrivatePaperSchedulerConfig): string {
  return config.mode === 'api' ? config.upstream.checkpointId : config.upstream.selection.checkpointId;
}

function scheduleRuntimeJob(
  config: BwsPrivatePaperSchedulerConfig,
  schedulerCheckpoint: ReturnType<Pick<SurebetPrivatePaperRuntimeSchedulerCheckpointRepository, 'create'>['create']>,
  jobs: Pick<SurebetWorkerJobRepository, 'create' | 'get'>,
  cycleNumber: number,
  exportedAt: string,
  sourceId: string,
  payload: PersistedPrivatePaperRuntimeJobPayload,
  completedCycleCount: number,
  upstreamPass: BwsUpstreamApiConvergencePassResult | BwsUpstreamExportConvergencePassResult,
  schedulerCheckpoints: Pick<SurebetPrivatePaperRuntimeSchedulerCheckpointRepository, 'advance'>,
): BwsPrivatePaperSchedulerPassResult {
  const jobId = buildSchedulerJobId(config.schedule.schedulerCheckpointId, cycleNumber);
  const existingJob = jobs.get(jobId);
  jobs.create(
    Object.freeze({
      availableAt: exportedAt,
      jobId,
      jobKind: 'private_paper_runtime_cycle_v1',
      payload: payload as unknown as JsonValue,
      queueName: config.queueName,
      retryDelaysMs: config.schedule.retryDelaysMs,
    }) satisfies SurebetPendingWorkerJobRecord,
  );
  schedulerCheckpoints.advance({
    ...(schedulerCheckpoint.lastScheduledApiCycleNumber === undefined
      ? {}
      : { expectedLastScheduledApiCycleNumber: schedulerCheckpoint.lastScheduledApiCycleNumber }),
    lastScheduledApiCycleNumber: cycleNumber,
    lastScheduledAt: exportedAt,
    lastScheduledJobId: jobId,
    lastScheduledSourceId: sourceId,
    schedulerCheckpointId: config.schedule.schedulerCheckpointId,
  });

  return Object.freeze({
    completedCycleCount,
    duplicateSuppressed: existingJob !== undefined,
    lastScheduledApiCycleNumber: cycleNumber,
    mode: config.mode,
    queueName: config.queueName,
    runtimeId: config.schedule.runtimeId,
    scheduled: true,
    scheduledCycleNumber: cycleNumber,
    scheduledJobId: jobId,
    schedulerCheckpointId: config.schedule.schedulerCheckpointId,
    upstreamPass,
  });
}

function requireNonEmptyString(value: unknown, field: string): BoundaryResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_FIELD_INVALID',
      `BWS private-paper scheduler requires a non-empty ${field}.`,
      `Non-empty ${field} in the private-paper schedule configuration.`,
    );
  }
  return accepted(value.trim());
}

function requireDeterministicId(value: unknown, field: string): BoundaryResult<string> {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_ID_INVALID',
      `BWS private-paper scheduler requires ${field} to be a deterministic identifier.`,
      `Deterministic ${field} for the private-paper scheduler manifest.`,
    );
  }
  return accepted(value);
}

function requirePositiveInteger(value: unknown, field: string): BoundaryResult<number> {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_INTEGER_INVALID',
      `BWS private-paper scheduler requires ${field} to be a positive integer.`,
      `Positive integer ${field} for the private-paper scheduler configuration.`,
    );
  }
  return accepted(value as number);
}

function requireIsoTimestamp(value: unknown, field: string): BoundaryResult<string> {
  if (typeof value !== 'string' || !ISO_UTC_TIMESTAMP.test(value)) {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_TIMESTAMP_INVALID',
      `BWS private-paper scheduler requires ${field} to be an ISO-8601 UTC timestamp.`,
      `ISO-8601 UTC ${field} in the private-paper scheduler configuration.`,
    );
  }
  return accepted(value);
}

function requireApiResource(
  value: unknown,
  field: string,
): BoundaryResult<'identity' | 'rules' | 'quotes' | 'settlement'> {
  if (value !== 'identity' && value !== 'rules' && value !== 'quotes' && value !== 'settlement') {
    return blocked(
      'BWS_PRIVATE_PAPER_SCHEDULE_RESOURCE_INVALID',
      `BWS private-paper scheduler requires ${field} to be a supported API resource.`,
      `Supported API resource in ${field}.`,
    );
  }
  return accepted(value);
}

function isSignedIntegerString(value: unknown): boolean {
  return typeof value === 'string' && /^-?[0-9]+$/.test(value);
}

function toSerializableCompletionEvent(
  legId: string,
  occurredAt: string,
  type: 'reserve' | 'fill' | 'reject' | 'expire' | 'rollback',
  stakeMinor: unknown,
) {
  return Object.freeze({
    ...(stakeMinor === undefined ? {} : { stakeMinor: stakeMinor as string }),
    legId,
    occurredAt,
    type,
  });
}
