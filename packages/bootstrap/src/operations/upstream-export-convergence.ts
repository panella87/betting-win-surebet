import { readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetUpstreamExportConvergenceRepository,
  SurebetUpstreamLockRepository,
  type SurebetImportRunRecord,
  type SurebetPinnedStrategyExportRecord,
  type SurebetUpstreamExportConvergenceCheckpointRecord,
  resolveSurebetPersistenceConfig,
  sha256Hex,
  type JsonValue,
  type SurebetPersistenceConfig,
  type SurebetPersistenceEnvironment,
} from '../../../persistence/src/index.js';
import {
  readBettingWinUpstreamLock,
  verifyBettingWinUpstreamLock,
  type BettingWinUpstreamLock,
} from '../../../upstream/src/index.js';
import { validatePinnedBettingWinStrategyExportIntake } from '../adapters/betting-win-strategy-export-intake.js';
import { accepted, blocked, type Blocker, type BoundaryResult } from '../contracts/local-types.js';
import {
  BWS_UPSTREAM_LOCK_PATH_ENV,
  SUREBET_EXECUTION_ENABLED_ENV,
  SUREBET_PROVIDER_CONNECTIONS_ENV,
  SUREBET_RUNTIME_MODE_ENV,
} from './service-runtime.js';

const URL_SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i;
const LOWERCASE_SHA256_REGEX = /^[0-9a-f]{64}$/;
const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

export const BWS_UPSTREAM_MODE_ENV = 'BWS_UPSTREAM_MODE';
export const BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV = 'BWS_UPSTREAM_EXPORT_SELECTION_PATH';
export const BWS_UPSTREAM_API_BASE_URL_ENV = 'BWS_UPSTREAM_API_BASE_URL';
export const BWS_UPSTREAM_API_TIMEOUT_MS_ENV = 'BWS_UPSTREAM_API_TIMEOUT_MS';
export const BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA = 'bws.upstream_export_selection.v1' as const;

export interface BwsUpstreamExportConvergenceEnvironment extends SurebetPersistenceEnvironment {
  readonly BETTING_WIN_REPO_PATH?: string;
  readonly BWS_UPSTREAM_LOCK_PATH?: string;
  readonly BWS_UPSTREAM_MODE?: string;
  readonly BWS_UPSTREAM_EXPORT_SELECTION_PATH?: string;
  readonly BWS_UPSTREAM_API_BASE_URL?: string;
  readonly BWS_UPSTREAM_API_TIMEOUT_MS?: string;
  readonly SUREBET_PINNED_BUNDLE?: string;
  readonly SUREBET_RUNTIME_MODE?: string;
  readonly SUREBET_PROVIDER_CONNECTIONS?: string;
  readonly SUREBET_EXECUTION_ENABLED?: string;
}

export interface BwsUpstreamExportSelectionEntry {
  readonly cursor: string;
  readonly exportPath: string;
  readonly expectedSha256: string;
  readonly expectedProviderGenerationIds: readonly string[];
  readonly expectedSourceLineageRecordIds: readonly string[];
}

export interface BwsUpstreamExportSelectionManifest {
  readonly schema: typeof BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA;
  readonly mode: 'export';
  readonly checkpointId: string;
  readonly contractSchema: 'betting-win.strategy-export.v1';
  readonly contractAlias: 'betting-win-strategy-export.v1';
  readonly surebetProfile: 'surebet_standard_binary_v0';
  readonly exports: readonly BwsUpstreamExportSelectionEntry[];
}

export interface BwsUpstreamExportConvergenceConfig {
  readonly mode: 'export';
  readonly persistence: SurebetPersistenceConfig;
  readonly repositoryRoot: string;
  readonly selection: Readonly<{
    readonly checkpointId: string;
    readonly contractAlias: 'betting-win-strategy-export.v1';
    readonly contractSchema: 'betting-win.strategy-export.v1';
    readonly entries: readonly BwsUpstreamExportSelectionEntry[];
    readonly manifestPath: string;
    readonly manifestSha256: string;
    readonly surebetProfile: 'surebet_standard_binary_v0';
  }>;
  readonly upstream: Readonly<{
    readonly lock: BettingWinUpstreamLock;
    readonly lockPath: string;
    readonly repoPath: string;
  }>;
}

export interface RunBwsUpstreamExportConvergencePassRequest {
  readonly config?: BwsUpstreamExportConvergenceConfig;
  readonly environment?: BwsUpstreamExportConvergenceEnvironment;
  readonly importRuns?: Pick<SurebetImportRunRepository, 'create' | 'finalize' | 'get'>;
  readonly now?: () => string;
  readonly pinnedStrategyExports?: Pick<SurebetPinnedStrategyExportRepository, 'create' | 'get' | 'getByExportId' | 'getBySourceSha256'>;
  readonly repositoryRoot?: string;
  readonly upstreamExportCheckpoints?: Pick<SurebetUpstreamExportConvergenceRepository, 'advance' | 'create' | 'get'>;
  readonly upstreamLocks?: Pick<SurebetUpstreamLockRepository, 'put'>;
}

export interface BwsUpstreamExportConvergencePassResult {
  readonly completed: boolean;
  readonly checkpointId: string;
  readonly importRunId?: string;
  readonly mode: 'export';
  readonly nextSelectionIndex: number;
  readonly pinnedStrategyExportRecordId?: string;
  readonly processedCount: 0 | 1;
  readonly processedSelectionCursor?: string;
  readonly selectionCount: number;
}

export function resolveBwsUpstreamExportConvergenceConfig(
  environment: BwsUpstreamExportConvergenceEnvironment = process.env as BwsUpstreamExportConvergenceEnvironment,
  repositoryRoot: string = process.cwd(),
): BwsUpstreamExportConvergenceConfig {
  const resolvedRepositoryRoot = resolve(repositoryRoot);
  requireLiteral(environment[SUREBET_RUNTIME_MODE_ENV], SUREBET_RUNTIME_MODE_ENV, 'paper');
  requireLiteral(environment[SUREBET_PROVIDER_CONNECTIONS_ENV], SUREBET_PROVIDER_CONNECTIONS_ENV, 'disabled');
  requireLiteral(environment[SUREBET_EXECUTION_ENABLED_ENV], SUREBET_EXECUTION_ENABLED_ENV, 'false');
  requireLiteral(environment[BWS_UPSTREAM_MODE_ENV], BWS_UPSTREAM_MODE_ENV, 'export');

  if (environment[BWS_UPSTREAM_API_BASE_URL_ENV] !== undefined || environment[BWS_UPSTREAM_API_TIMEOUT_MS_ENV] !== undefined) {
    throw new Error(
      `${BWS_UPSTREAM_MODE_ENV}=export forbids ${BWS_UPSTREAM_API_BASE_URL_ENV} and ${BWS_UPSTREAM_API_TIMEOUT_MS_ENV}; BWS must not fall back to api mode.`,
    );
  }
  if (environment.SUREBET_PINNED_BUNDLE !== undefined) {
    throw new Error(
      `${BWS_UPSTREAM_MODE_ENV}=export forbids SUREBET_PINNED_BUNDLE; BWS must not fall back to local fixture or mock intake.`,
    );
  }

  const upstreamRepoPath = requireReadableDirectory(environment.BETTING_WIN_REPO_PATH, 'BETTING_WIN_REPO_PATH');
  const lockPath = requireRepositoryFile(
    resolvedRepositoryRoot,
    requireNonEmptyString(environment[BWS_UPSTREAM_LOCK_PATH_ENV], BWS_UPSTREAM_LOCK_PATH_ENV),
    BWS_UPSTREAM_LOCK_PATH_ENV,
  );
  const upstreamLock = verifyBettingWinUpstreamLock(
    readBettingWinUpstreamLock(lockPath, resolvedRepositoryRoot),
    {
      bettingWinRepoPath: upstreamRepoPath,
      repositoryRoot: resolvedRepositoryRoot,
    },
  );
  const manifestPath = requireRepositoryFile(
    resolvedRepositoryRoot,
    requireNonEmptyString(environment[BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV], BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV),
    BWS_UPSTREAM_EXPORT_SELECTION_PATH_ENV,
  );
  const manifestContents = readFileSync(manifestPath, 'utf-8');
  const manifestSha256 = sha256Hex(manifestContents);
  const manifest = parseBwsUpstreamExportSelectionManifest(manifestContents, manifestPath);

  if (!manifest.ok) {
    throw new Error(manifest.blockers.map((entry) => entry.message).join(' '));
  }
  if (manifest.value.contractSchema !== upstreamLock.contractSchema) {
    throw new Error('BWS upstream export selection contractSchema must match the verified betting-win upstream lock exactly.');
  }
  if (manifest.value.contractAlias !== upstreamLock.contractAlias) {
    throw new Error('BWS upstream export selection contractAlias must match the verified betting-win upstream lock exactly.');
  }
  if (manifest.value.surebetProfile !== upstreamLock.surebetProfile) {
    throw new Error('BWS upstream export selection surebetProfile must match the verified betting-win upstream lock exactly.');
  }

  return Object.freeze({
    mode: 'export',
    persistence: resolveSurebetPersistenceConfig(environment),
    repositoryRoot: resolvedRepositoryRoot,
    selection: Object.freeze({
      checkpointId: manifest.value.checkpointId,
      contractAlias: manifest.value.contractAlias,
      contractSchema: manifest.value.contractSchema,
      entries: manifest.value.exports,
      manifestPath,
      manifestSha256,
      surebetProfile: manifest.value.surebetProfile,
    }),
    upstream: Object.freeze({
      lock: upstreamLock,
      lockPath,
      repoPath: upstreamRepoPath,
    }),
  });
}

export function parseBwsUpstreamExportSelectionManifest(
  text: string,
  manifestPath: string,
): BoundaryResult<BwsUpstreamExportSelectionManifest> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_JSON_INVALID',
      `BWS upstream export selection manifest must contain valid JSON: ${manifestPath}`,
      'Valid repo-local BWS upstream export selection JSON.',
    );
  }
  if (!isObject(parsed)) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_INVALID',
      'BWS upstream export selection manifest must be a JSON object.',
      'BWS upstream export selection manifest object.',
    );
  }
  if (parsed.schema !== BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA_INVALID',
      `BWS upstream export selection manifest schema must be ${BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA}.`,
      'Selection manifest schema bws.upstream_export_selection.v1.',
    );
  }
  if (parsed.mode !== 'export') {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_MODE_INVALID',
      'BWS upstream export selection manifest must declare mode=export.',
      'Explicit export mode in the upstream export selection manifest.',
    );
  }
  const checkpointId = validateManifestId(parsed.checkpointId, 'checkpointId');
  if (!checkpointId.ok) {
    return checkpointId;
  }
  if (parsed.contractSchema !== 'betting-win.strategy-export.v1') {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_CONTRACT_INVALID',
      'BWS upstream export selection manifest must require contractSchema betting-win.strategy-export.v1.',
      'Selection manifest contractSchema betting-win.strategy-export.v1.',
    );
  }
  if (parsed.contractAlias !== 'betting-win-strategy-export.v1') {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_ALIAS_INVALID',
      'BWS upstream export selection manifest must require contractAlias betting-win-strategy-export.v1.',
      'Selection manifest contractAlias betting-win-strategy-export.v1.',
    );
  }
  if (parsed.surebetProfile !== 'surebet_standard_binary_v0') {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_PROFILE_INVALID',
      'BWS upstream export selection manifest must require surebetProfile surebet_standard_binary_v0.',
      'Selection manifest surebetProfile surebet_standard_binary_v0.',
    );
  }
  if (!Array.isArray(parsed.exports) || parsed.exports.length === 0) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_EMPTY',
      'BWS upstream export selection manifest requires a non-empty exports array.',
      'At least one explicit immutable export selection entry.',
    );
  }

  const entries: BwsUpstreamExportSelectionEntry[] = [];
  const seenCursors = new Set<string>();
  const seenSourceSha256 = new Set<string>();
  const seenExportPaths = new Set<string>();
  for (const [index, entryValue] of parsed.exports.entries()) {
    if (!isObject(entryValue)) {
      return blocked(
        'BWS_UPSTREAM_EXPORT_SELECTION_ENTRY_INVALID',
        `BWS upstream export selection entry ${index} must be an object.`,
        'Immutable export selection entry object.',
      );
    }
    const cursor = validateManifestId(entryValue.cursor, `exports[${index}].cursor`);
    if (!cursor.ok) {
      return cursor;
    }
    if (seenCursors.has(cursor.value)) {
      return blocked(
        'BWS_UPSTREAM_EXPORT_SELECTION_CURSOR_DUPLICATE',
        `BWS upstream export selection cursor ${cursor.value} must be unique.`,
        'Unique immutable export selection cursors.',
      );
    }
    const exportPath = validateExportPath(entryValue.exportPath, `exports[${index}].exportPath`);
    if (!exportPath.ok) {
      return exportPath;
    }
    if (seenExportPaths.has(exportPath.value)) {
      return blocked(
        'BWS_UPSTREAM_EXPORT_SELECTION_PATH_DUPLICATE',
        `BWS upstream export selection exportPath ${exportPath.value} must be unique.`,
        'Unique immutable export selection paths with no directory scanning.',
      );
    }
    const expectedSha256 = validateLowercaseSha256(entryValue.expectedSha256, `exports[${index}].expectedSha256`);
    if (!expectedSha256.ok) {
      return expectedSha256;
    }
    if (seenSourceSha256.has(expectedSha256.value)) {
      return blocked(
        'BWS_UPSTREAM_EXPORT_SELECTION_SHA256_DUPLICATE',
        `BWS upstream export selection expectedSha256 ${expectedSha256.value} must be unique to prevent duplicate replay.`,
        'Unique immutable export SHA-256 selections.',
      );
    }
    const expectedProviderGenerationIds = validateIdArray(
      entryValue.expectedProviderGenerationIds,
      `exports[${index}].expectedProviderGenerationIds`,
    );
    if (!expectedProviderGenerationIds.ok) {
      return expectedProviderGenerationIds;
    }
    const expectedSourceLineageRecordIds = validateIdArray(
      entryValue.expectedSourceLineageRecordIds,
      `exports[${index}].expectedSourceLineageRecordIds`,
    );
    if (!expectedSourceLineageRecordIds.ok) {
      return expectedSourceLineageRecordIds;
    }

    seenCursors.add(cursor.value);
    seenExportPaths.add(exportPath.value);
    seenSourceSha256.add(expectedSha256.value);
    entries.push(
      Object.freeze({
        cursor: cursor.value,
        expectedProviderGenerationIds: expectedProviderGenerationIds.value,
        expectedSha256: expectedSha256.value,
        expectedSourceLineageRecordIds: expectedSourceLineageRecordIds.value,
        exportPath: exportPath.value,
      }),
    );
  }

  return accepted(
    Object.freeze({
      checkpointId: checkpointId.value,
      contractAlias: 'betting-win-strategy-export.v1',
      contractSchema: 'betting-win.strategy-export.v1',
      exports: Object.freeze(entries),
      mode: 'export',
      schema: BWS_UPSTREAM_EXPORT_SELECTION_SCHEMA,
      surebetProfile: 'surebet_standard_binary_v0',
    }),
  );
}

export function runBwsUpstreamExportConvergencePass(
  request: RunBwsUpstreamExportConvergencePassRequest = {},
): BoundaryResult<BwsUpstreamExportConvergencePassResult> {
  const config = request.config ?? resolveBwsUpstreamExportConvergenceConfig(request.environment, request.repositoryRoot);
  const now = request.now ?? defaultNow;
  const passTimestamp = now();
  const upstreamLocks = request.upstreamLocks ?? new SurebetUpstreamLockRepository(config.persistence);
  const importRuns = request.importRuns ?? new SurebetImportRunRepository(config.persistence);
  const pinnedStrategyExports = request.pinnedStrategyExports ?? new SurebetPinnedStrategyExportRepository(config.persistence);
  const checkpoints = request.upstreamExportCheckpoints ?? new SurebetUpstreamExportConvergenceRepository(config.persistence);
  const lockRecordId = buildUpstreamLockRecordId(config.upstream.lock);
  const lockRecord = upstreamLocks.put({
    lock: config.upstream.lock,
    lockRecordId,
  });
  const existingCheckpoint = checkpoints.get(config.selection.checkpointId);

  if (existingCheckpoint !== undefined) {
    const checkpointBoundary = validateExistingCheckpoint(existingCheckpoint, config, lockRecord.lockRecordId);
    if (!checkpointBoundary.ok) {
      return checkpointBoundary;
    }
  }

  const checkpoint = existingCheckpoint ?? checkpoints.create({
    checkpointId: config.selection.checkpointId,
    contractAlias: config.selection.contractAlias,
    contractSchema: config.selection.contractSchema,
    mode: 'export',
    nextSelectionIndex: 0,
    selectionCount: config.selection.entries.length,
    selectionManifestLocator: config.selection.manifestPath,
    selectionManifestSha256: config.selection.manifestSha256,
    surebetProfile: config.selection.surebetProfile,
    upstreamLockRecordId: lockRecord.lockRecordId,
  });
  if (checkpoint.nextSelectionIndex === checkpoint.selectionCount) {
    return accepted(
      Object.freeze({
        checkpointId: checkpoint.checkpointId,
        completed: true,
        mode: 'export',
        nextSelectionIndex: checkpoint.nextSelectionIndex,
        processedCount: 0,
        selectionCount: checkpoint.selectionCount,
      }),
    );
  }

  const selectionEntry = config.selection.entries[checkpoint.nextSelectionIndex];
  if (selectionEntry === undefined) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_CURSOR_INVALID',
      `BWS upstream export convergence checkpoint ${checkpoint.checkpointId} points beyond the explicit export selection manifest.`,
      'A checkpoint whose nextSelectionIndex remains inside the explicit export selection manifest.',
    );
  }
  const importRunId = buildImportRunId(checkpoint.checkpointId, selectionEntry.cursor);
  const pinnedStrategyExportRecordId = buildPinnedStrategyExportRecordId(checkpoint.checkpointId, selectionEntry.cursor);
  const sourceLocator = `${config.selection.manifestPath}#${selectionEntry.cursor}`;
  const importRun = importRuns.create({
    importRunId,
    metadata: buildImportRunMetadata(config, selectionEntry),
    requestedAt: passTimestamp,
    sourceKind: 'continuous_immutable_strategy_export',
    sourceLocator,
    startedAt: passTimestamp,
    upstreamLockRecordId: lockRecord.lockRecordId,
  });

  let pinnedStrategyExport = pinnedStrategyExports.get(pinnedStrategyExportRecordId);
  if (pinnedStrategyExport === undefined) {
    const intake = validatePinnedBettingWinStrategyExportIntake({
      expectedSha256: selectionEntry.expectedSha256,
      exportPath: selectionEntry.exportPath,
      repositoryRoot: config.repositoryRoot,
      upstreamLock: config.upstream.lock,
    });
    if (!intake.ok) {
      finalizeFailedImportRun(importRuns, importRun, passTimestamp, intake.blockers);
      return intake;
    }

    const providerGenerations = compareExpectedIds(
      selectionEntry.expectedProviderGenerationIds,
      intake.value.providerGenerationIds,
      'BWS_UPSTREAM_EXPORT_PROVIDER_GENERATIONS_MISMATCH',
      'BWS upstream export convergence requires the accepted export providerGenerationIds to match the explicit operator selection exactly.',
      'Operator-selected immutable export with matching provider generation ids.',
    );
    if (!providerGenerations.ok) {
      finalizeFailedImportRun(importRuns, importRun, passTimestamp, providerGenerations.blockers);
      return providerGenerations;
    }

    const sourceLineage = compareExpectedIds(
      selectionEntry.expectedSourceLineageRecordIds,
      intake.value.sourceLineageRecordIds,
      'BWS_UPSTREAM_EXPORT_SOURCE_LINEAGE_MISMATCH',
      'BWS upstream export convergence requires the accepted export sourceLineageRecordIds to match the explicit operator selection exactly.',
      'Operator-selected immutable export with matching source lineage ids.',
    );
    if (!sourceLineage.ok) {
      finalizeFailedImportRun(importRuns, importRun, passTimestamp, sourceLineage.blockers);
      return sourceLineage;
    }

    pinnedStrategyExport = pinnedStrategyExports.create({
      contractAlias: intake.value.contractAlias,
      contractSchema: intake.value.contractSchema,
      endpointId: intake.value.endpointId,
      exportId: intake.value.exportId,
      exportKind: intake.value.exportKind,
      exportProfile: intake.value.exportProfile,
      exportedAt: intake.value.exportedAt,
      importRunId,
      importedAt: passTimestamp,
      intakeRecordId: pinnedStrategyExportRecordId,
      normalizedEvidenceIds: intake.value.normalizedEvidenceIds,
      payloadSha256: intake.value.payloadSha256,
      providerGenerationIds: intake.value.providerGenerationIds,
      providerId: intake.value.providerId,
      sourceLineageRecordIds: intake.value.sourceLineageRecordIds,
      sourceLocator: intake.value.exportPath,
      sourceSha256: intake.value.sourceSha256,
      surebetProfile: intake.value.surebetProfile,
      upstreamLockRecordId: lockRecord.lockRecordId,
    });
  } else {
    const persistedPinnedExport = validatePersistedPinnedStrategyExport(
      pinnedStrategyExport,
      config,
      lockRecord.lockRecordId,
      importRunId,
      selectionEntry,
    );
    if (!persistedPinnedExport.ok) {
      return persistedPinnedExport;
    }
  }

  const completedImportRun = finalizeSucceededImportRun(
    importRuns,
    importRun,
    pinnedStrategyExport.importedAt,
  );

  const nextSelectionIndex = checkpoint.nextSelectionIndex + 1;
  checkpoints.advance({
    checkpointId: checkpoint.checkpointId,
    expectedNextSelectionIndex: checkpoint.nextSelectionIndex,
    lastImportRunId: importRunId,
    lastPinnedStrategyExportRecordId: pinnedStrategyExportRecordId,
    lastSelectionCursor: selectionEntry.cursor,
    lastSourceSha256: pinnedStrategyExport.sourceSha256,
    nextSelectionIndex,
    ...(nextSelectionIndex === checkpoint.selectionCount
      ? { completedAt: completedImportRun.completedAt ?? pinnedStrategyExport.importedAt }
      : {}),
  });

  return accepted(
    Object.freeze({
      checkpointId: checkpoint.checkpointId,
      completed: nextSelectionIndex === checkpoint.selectionCount,
      importRunId,
      mode: 'export',
      nextSelectionIndex,
      pinnedStrategyExportRecordId,
      processedCount: 1,
      processedSelectionCursor: selectionEntry.cursor,
      selectionCount: checkpoint.selectionCount,
    }),
  );
}

function validateExistingCheckpoint(
  checkpoint: SurebetUpstreamExportConvergenceCheckpointRecord,
  config: BwsUpstreamExportConvergenceConfig,
  upstreamLockRecordId: string,
): BoundaryResult<undefined> {
  if (checkpoint.mode !== 'export') {
    return blocked(
      'BWS_UPSTREAM_EXPORT_CHECKPOINT_MODE_MISMATCH',
      `BWS upstream export checkpoint ${checkpoint.checkpointId} must remain in export mode.`,
      'Persisted export-mode convergence checkpoint.',
    );
  }
  if (checkpoint.upstreamLockRecordId !== upstreamLockRecordId) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_CHECKPOINT_LOCK_MISMATCH',
      `BWS upstream export checkpoint ${checkpoint.checkpointId} must stay pinned to the exact verified upstream lock.`,
      'Persisted export checkpoint bound to the same verified betting-win upstream lock.',
    );
  }
  if (checkpoint.selectionManifestLocator !== config.selection.manifestPath || checkpoint.selectionManifestSha256 !== config.selection.manifestSha256) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_MUTATED',
      `BWS upstream export checkpoint ${checkpoint.checkpointId} rejects mutable selection manifest replacement.`,
      'The exact repo-local immutable export selection manifest that originally initialized the checkpoint.',
    );
  }
  if (checkpoint.selectionCount !== config.selection.entries.length) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_COUNT_MISMATCH',
      `BWS upstream export checkpoint ${checkpoint.checkpointId} requires the explicit selection count to remain unchanged.`,
      'Unmodified explicit immutable export selection count.',
    );
  }
  if (checkpoint.contractSchema !== config.selection.contractSchema
    || checkpoint.contractAlias !== config.selection.contractAlias
    || checkpoint.surebetProfile !== config.selection.surebetProfile) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_CONTRACT_MISMATCH',
      `BWS upstream export checkpoint ${checkpoint.checkpointId} requires the explicit contract schema, alias, and profile to remain unchanged.`,
      'Unmodified export selection contract schema, alias, and profile.',
    );
  }
  return accepted(undefined);
}

function buildImportRunMetadata(
  config: BwsUpstreamExportConvergenceConfig,
  entry: BwsUpstreamExportSelectionEntry,
): JsonValue {
  return Object.freeze({
    checkpointId: config.selection.checkpointId,
    contractAlias: config.selection.contractAlias,
    contractSchema: config.selection.contractSchema,
    expectedProviderGenerationIds: entry.expectedProviderGenerationIds,
    expectedSha256: entry.expectedSha256,
    expectedSourceLineageRecordIds: entry.expectedSourceLineageRecordIds,
    exportPath: entry.exportPath,
    manifestPath: config.selection.manifestPath,
    manifestSha256: config.selection.manifestSha256,
    mode: 'export',
    selectionCursor: entry.cursor,
    surebetProfile: config.selection.surebetProfile,
  });
}

function finalizeFailedImportRun(
  importRuns: Pick<SurebetImportRunRepository, 'finalize'>,
  importRun: SurebetImportRunRecord,
  completedAt: string,
  blockers: readonly Blocker[],
): void {
  if (importRun.outcome === 'failed') {
    return;
  }
  if (importRun.outcome === 'succeeded') {
    return;
  }
  importRuns.finalize({
    completedAt,
    failureCode: blockers[0]?.code ?? 'BWS_UPSTREAM_EXPORT_CONVERGENCE_FAILED',
    failureDetails: Object.freeze({
      blockers: blockers.map((entry) =>
        Object.freeze({
          code: entry.code,
          evidenceRequired: entry.evidenceRequired,
          message: entry.message,
        })),
      mode: 'export',
    }) as JsonValue,
    importRunId: importRun.importRunId,
    importedRecordCount: 0,
    outcome: 'failed',
  });
}

function finalizeSucceededImportRun(
  importRuns: Pick<SurebetImportRunRepository, 'finalize'>,
  importRun: SurebetImportRunRecord,
  completedAt: string,
): SurebetImportRunRecord {
  if (importRun.outcome === 'succeeded') {
    return importRun;
  }
  if (importRun.outcome === 'failed') {
    throw new Error(
      `BWS upstream export convergence import run ${importRun.importRunId} was already finalized as failed and must not be replayed.`,
    );
  }
  return importRuns.finalize({
    completedAt,
    importRunId: importRun.importRunId,
    importedRecordCount: 1,
    outcome: 'succeeded',
  });
}

function validatePersistedPinnedStrategyExport(
  pinnedStrategyExport: SurebetPinnedStrategyExportRecord,
  config: BwsUpstreamExportConvergenceConfig,
  upstreamLockRecordId: string,
  importRunId: string,
  selectionEntry: BwsUpstreamExportSelectionEntry,
): BoundaryResult<undefined> {
  if (pinnedStrategyExport.upstreamLockRecordId !== upstreamLockRecordId || pinnedStrategyExport.importRunId !== importRunId) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_PERSISTED_PROVENANCE_MISMATCH',
      `BWS upstream export convergence requires persisted pinned export ${pinnedStrategyExport.intakeRecordId} to remain on the same import run and upstream lock.`,
      'Persisted pinned export provenance bound to the same explicit import run and verified upstream lock.',
    );
  }
  if (pinnedStrategyExport.contractSchema !== config.selection.contractSchema
    || pinnedStrategyExport.contractAlias !== config.selection.contractAlias
    || pinnedStrategyExport.surebetProfile !== config.selection.surebetProfile) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_PERSISTED_CONTRACT_MISMATCH',
      `BWS upstream export convergence requires persisted pinned export ${pinnedStrategyExport.intakeRecordId} to keep the explicit contract schema, alias, and surebet profile.`,
      'Persisted pinned export with unchanged contract schema, alias, and surebet profile.',
    );
  }
  if (pinnedStrategyExport.sourceSha256 !== selectionEntry.expectedSha256) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_PERSISTED_SHA256_MISMATCH',
      `BWS upstream export convergence requires persisted pinned export ${pinnedStrategyExport.intakeRecordId} to match the explicit expected SHA-256.`,
      'Persisted pinned export with the originally selected immutable SHA-256.',
    );
  }
  const providerGenerations = compareExpectedIds(
    selectionEntry.expectedProviderGenerationIds,
    pinnedStrategyExport.providerGenerationIds,
    'BWS_UPSTREAM_EXPORT_PROVIDER_GENERATIONS_MISMATCH',
    'BWS upstream export convergence requires the accepted export providerGenerationIds to match the explicit operator selection exactly.',
    'Operator-selected immutable export with matching provider generation ids.',
  );
  if (!providerGenerations.ok) {
    return providerGenerations;
  }
  return compareExpectedIds(
    selectionEntry.expectedSourceLineageRecordIds,
    pinnedStrategyExport.sourceLineageRecordIds,
    'BWS_UPSTREAM_EXPORT_SOURCE_LINEAGE_MISMATCH',
    'BWS upstream export convergence requires the accepted export sourceLineageRecordIds to match the explicit operator selection exactly.',
    'Operator-selected immutable export with matching source lineage ids.',
  );
}

function compareExpectedIds(
  expected: readonly string[],
  actual: readonly string[],
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<undefined> {
  if (expected.length !== actual.length) {
    return blocked(code, message, evidenceRequired);
  }
  for (const [index, value] of expected.entries()) {
    if (actual[index] !== value) {
      return blocked(code, message, evidenceRequired);
    }
  }
  return accepted(undefined);
}

function validateManifestId(value: unknown, field: string): BoundaryResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0 || !ID_PATTERN.test(value.trim())) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_ID_INVALID',
      `BWS upstream export selection ${field} must be a non-empty id matching ${ID_PATTERN.source}.`,
      'Deterministic explicit export checkpoint and cursor ids.',
    );
  }
  return accepted(value.trim());
}

function validateExportPath(value: unknown, field: string): BoundaryResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_PATH_INVALID',
      `BWS upstream export selection ${field} must be a non-empty filesystem path.`,
      'Explicit immutable export filesystem path.',
    );
  }
  if (URL_SCHEME_PREFIX.test(value) || /[*?\[\]]/.test(value)) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_PATH_INVALID',
      `BWS upstream export selection ${field} must stay on an explicit filesystem path with no URLs or directory-scanning patterns.`,
      'Explicit immutable export filesystem path with no directory scanning.',
    );
  }
  return accepted(value.trim());
}

function validateLowercaseSha256(value: unknown, field: string): BoundaryResult<string> {
  if (typeof value !== 'string' || !LOWERCASE_SHA256_REGEX.test(value)) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_SHA256_INVALID',
      `BWS upstream export selection ${field} must be 64 lowercase hexadecimal characters.`,
      'Explicit immutable export SHA-256 digest.',
    );
  }
  return accepted(value);
}

function validateIdArray(value: unknown, field: string): BoundaryResult<readonly string[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return blocked(
      'BWS_UPSTREAM_EXPORT_SELECTION_IDS_INVALID',
      `BWS upstream export selection ${field} must be a non-empty array of deterministic ids.`,
      'Explicit immutable export id array.',
    );
  }
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || item.trim().length === 0 || !ID_PATTERN.test(item.trim())) {
      return blocked(
        'BWS_UPSTREAM_EXPORT_SELECTION_IDS_INVALID',
        `BWS upstream export selection ${field} must contain only deterministic ids matching ${ID_PATTERN.source}.`,
        'Explicit immutable export id array.',
      );
    }
    const normalizedValue = item.trim();
    if (seen.has(normalizedValue)) {
      return blocked(
        'BWS_UPSTREAM_EXPORT_SELECTION_IDS_DUPLICATE',
        `BWS upstream export selection ${field} must not contain duplicates.`,
        'Explicit immutable export id array with unique values.',
      );
    }
    seen.add(normalizedValue);
    normalized.push(normalizedValue);
  }
  return accepted(Object.freeze(normalized));
}

function buildUpstreamLockRecordId(lock: BettingWinUpstreamLock): string {
  return `upstream-lock:${lock.commitSha}:${lock.gitTreeSha}`;
}

function buildImportRunId(checkpointId: string, cursor: string): string {
  return `import:${checkpointId}:${cursor}`;
}

function buildPinnedStrategyExportRecordId(checkpointId: string, cursor: string): string {
  return `intake:${checkpointId}:${cursor}`;
}

function requireLiteral(value: string | undefined, name: string, expected: string): string {
  if (value !== expected) {
    throw new Error(`${name} must be exactly ${expected}.`);
  }
  return value;
}

function requireNonEmptyString(value: string | undefined, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value.trim();
}

function requireReadableDirectory(value: string | undefined, name: string): string {
  const resolved = resolve(requireNonEmptyString(value, name));
  const stats = statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error(`${name} must point to a readable directory.`);
  }
  return realpathSync(resolved);
}

function requireRepositoryFile(repositoryRoot: string, filePath: string, name: string): string {
  if (URL_SCHEME_PREFIX.test(filePath)) {
    throw new Error(`${name} must stay on a repo-local filesystem path.`);
  }
  const resolved = isAbsolute(filePath) ? resolve(filePath) : resolve(repositoryRoot, filePath);
  const root = realpathSync(repositoryRoot);
  const normalized = realpathSync(resolved);
  if (!normalized.startsWith(`${root}/`) && normalized !== root) {
    throw new Error(`${name} must stay within the BWS repository root.`);
  }
  const stats = statSync(normalized);
  if (!stats.isFile()) {
    throw new Error(`${name} must point to a readable file.`);
  }
  return normalized;
}

function defaultNow(): string {
  const now = new Date().toISOString();
  if (!ISO_UTC_TIMESTAMP.test(now)) {
    throw new Error('BWS upstream export convergence timestamp source must emit ISO-8601 UTC timestamps.');
  }
  return now;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
