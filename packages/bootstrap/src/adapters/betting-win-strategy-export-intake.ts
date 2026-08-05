import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';

const URL_SCHEME_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i;
const SHA256_REGEX = /^[0-9a-f]{64}$/;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PROVIDER_COLLECTION_SCHEMA_VERSION = '1.0.0' as const;
const PROVIDER_HISTORY_EXPORT_PHASE = 'F2-005F' as const;
const STORE_BACKED_PROVIDER_HISTORY_EXPORT_PHASE = 'F2-005J' as const;
const PROVIDER_HISTORY_EXPORT_PROFILE = 'provider_history_fixture_bundle_v1' as const;
const STORE_BACKED_PROVIDER_HISTORY_EXPORT_PROFILE = 'provider_history_store_backed_fixture_bundle_v1' as const;
const PINNED_PROVIDER_HISTORY_EXPORT_KIND = 'pinned_provider_history_bundle' as const;
const BETTING_WIN_STRATEGY_EXPORT_SCHEMA = 'betting-win.strategy-export.v1' as const;
const BETTING_WIN_STRATEGY_EXPORT_ALIAS = 'betting-win-strategy-export.v1' as const;
const BETTING_WIN_SUREBET_PROFILE = 'surebet_standard_binary_v0' as const;

export type BettingWinStrategyExportPhase =
  | typeof PROVIDER_HISTORY_EXPORT_PHASE
  | typeof STORE_BACKED_PROVIDER_HISTORY_EXPORT_PHASE;

export type BettingWinStrategyExportProfile =
  | typeof PROVIDER_HISTORY_EXPORT_PROFILE
  | typeof STORE_BACKED_PROVIDER_HISTORY_EXPORT_PROFILE;

export interface ValidatePinnedBettingWinStrategyExportIntakeOptions {
  readonly exportPath: string;
  readonly expectedSha256: string;
  readonly repositoryRoot: string;
  readonly upstreamLock: BettingWinUpstreamLock;
}

export interface PinnedBettingWinStrategyExportIntake {
  readonly exportPath: string;
  readonly sourceSha256: string;
  readonly contractSchema: typeof BETTING_WIN_STRATEGY_EXPORT_SCHEMA;
  readonly contractAlias: typeof BETTING_WIN_STRATEGY_EXPORT_ALIAS;
  readonly surebetProfile: typeof BETTING_WIN_SUREBET_PROFILE;
  readonly schemaVersion: typeof PROVIDER_COLLECTION_SCHEMA_VERSION;
  readonly phase: BettingWinStrategyExportPhase;
  readonly exportId: string;
  readonly exportProfile: BettingWinStrategyExportProfile;
  readonly exportKind: typeof PINNED_PROVIDER_HISTORY_EXPORT_KIND;
  readonly exportedAt: string;
  readonly fixtureId: string;
  readonly providerId: string;
  readonly endpointId: string;
  readonly transportMode: 'fixture' | 'mock';
  readonly liveTransportAllowed: false;
  readonly payloadSha256: string;
  readonly providerGenerationIds: readonly string[];
  readonly sourceLineageRecordIds: readonly string[];
  readonly normalizedEvidenceIds: readonly string[];
  readonly rawObservationCount: number;
  readonly sourceLineageRecordCount: number;
  readonly sourceLineageEventCount: number;
  readonly generationResolutionCount: number;
  readonly normalizedEvidenceCount: number;
  readonly normalizedRejectionCount: number;
}

interface StrategyExportDocument {
  readonly schemaVersion: string;
  readonly phase: BettingWinStrategyExportPhase;
  readonly exportId: string;
  readonly exportProfile: BettingWinStrategyExportProfile;
  readonly exportKind: typeof PINNED_PROVIDER_HISTORY_EXPORT_KIND;
  readonly exportedAt: string;
  readonly fixtureId: string;
  readonly providerId: string;
  readonly endpointId: string;
  readonly transportMode: 'fixture' | 'mock';
  readonly liveTransportAllowed: false;
  readonly payloadSha256: string;
  readonly providerGenerationIds: readonly string[];
  readonly sourceLineageRecordIds: readonly string[];
  readonly normalizedEvidenceIds: readonly string[];
  readonly payload: Record<string, unknown>;
  readonly collectionReportSha256?: string;
  readonly rawStoreStateSha256?: string;
  readonly quoteStoreStateSha256?: string;
}

export function validatePinnedBettingWinStrategyExportIntake(
  options: ValidatePinnedBettingWinStrategyExportIntakeOptions,
): BoundaryResult<PinnedBettingWinStrategyExportIntake> {
  if (!isObject(options)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_OPTIONS_INVALID',
      'Pinned strategy export intake options must be an object.',
      'Object-shaped pinned strategy export intake options.',
    );
  }

  const exportPath = requireNonEmptyString(
    options.exportPath,
    'PINNED_STRATEGY_EXPORT_PATH_MISSING',
    'A pinned strategy export file path is required.',
    'Pinned strategy export JSON file path.',
  );
  if (!exportPath.ok) {
    return exportPath;
  }
  const repositoryRoot = requireNonEmptyString(
    options.repositoryRoot,
    'PINNED_STRATEGY_EXPORT_REPOSITORY_ROOT_INVALID',
    'Pinned strategy export intake requires a repository root.',
    'Repository root containing the pinned strategy export.',
  );
  if (!repositoryRoot.ok) {
    return repositoryRoot;
  }
  const expectedSha256 = requireSha256(
    options.expectedSha256,
    'PINNED_STRATEGY_EXPORT_EXPECTED_SHA256_INVALID',
    'Pinned strategy export intake requires expectedSha256 to be 64 hexadecimal characters.',
    'Expected pinned strategy export SHA-256.',
  );
  if (!expectedSha256.ok) {
    return expectedSha256;
  }

  const upstreamContract = validateUpstreamContract(options.upstreamLock);
  if (!upstreamContract.ok) {
    return upstreamContract;
  }

  const exportFile = readImmutableExportFile(exportPath.value, repositoryRoot.value);
  if (!exportFile.ok) {
    return exportFile;
  }

  if (exportFile.value.sourceSha256 !== expectedSha256.value) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_SHA256_MISMATCH',
      'Pinned strategy export SHA-256 does not match the expected immutable digest.',
      'Pinned strategy export file with the expected SHA-256.',
    );
  }

  const parsed = parseStrategyExportDocument(exportFile.value.parsed);
  if (!parsed.ok) {
    return parsed;
  }

  const validatedPayload = validateStrategyExportPayload(parsed.value);
  if (!validatedPayload.ok) {
    return validatedPayload;
  }

  return accepted(
    Object.freeze({
      exportPath: exportFile.value.exportPath,
      sourceSha256: exportFile.value.sourceSha256,
      contractSchema: BETTING_WIN_STRATEGY_EXPORT_SCHEMA,
      contractAlias: BETTING_WIN_STRATEGY_EXPORT_ALIAS,
      surebetProfile: BETTING_WIN_SUREBET_PROFILE,
      schemaVersion: PROVIDER_COLLECTION_SCHEMA_VERSION,
      phase: parsed.value.phase,
      exportId: parsed.value.exportId,
      exportProfile: parsed.value.exportProfile,
      exportKind: PINNED_PROVIDER_HISTORY_EXPORT_KIND,
      exportedAt: parsed.value.exportedAt,
      fixtureId: parsed.value.fixtureId,
      providerId: parsed.value.providerId,
      endpointId: parsed.value.endpointId,
      transportMode: parsed.value.transportMode,
      liveTransportAllowed: false,
      payloadSha256: parsed.value.payloadSha256,
      providerGenerationIds: Object.freeze([...validatedPayload.value.providerGenerationIds]),
      sourceLineageRecordIds: Object.freeze([...validatedPayload.value.sourceLineageRecordIds]),
      normalizedEvidenceIds: Object.freeze([...validatedPayload.value.normalizedEvidenceIds]),
      rawObservationCount: validatedPayload.value.rawObservationCount,
      sourceLineageRecordCount: validatedPayload.value.sourceLineageRecordCount,
      sourceLineageEventCount: validatedPayload.value.sourceLineageEventCount,
      generationResolutionCount: validatedPayload.value.generationResolutionCount,
      normalizedEvidenceCount: validatedPayload.value.normalizedEvidenceCount,
      normalizedRejectionCount: validatedPayload.value.normalizedRejectionCount,
    }),
  );
}

function validateUpstreamContract(upstreamLock: BettingWinUpstreamLock): BoundaryResult<undefined> {
  if (!isObject(upstreamLock)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_UPSTREAM_LOCK_INVALID',
      'Pinned strategy export intake requires an object-shaped upstream lock.',
      'Validated betting-win upstream lock for betting-win.strategy-export.v1.',
    );
  }
  if (upstreamLock.contractSchema !== BETTING_WIN_STRATEGY_EXPORT_SCHEMA) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_SCHEMA_MISMATCH',
      `Pinned strategy export intake requires upstream lock contractSchema ${BETTING_WIN_STRATEGY_EXPORT_SCHEMA}.`,
      'Validated betting-win upstream lock for betting-win.strategy-export.v1.',
    );
  }
  if (upstreamLock.contractAlias !== BETTING_WIN_STRATEGY_EXPORT_ALIAS) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_ALIAS_MISMATCH',
      `Pinned strategy export intake requires upstream lock contractAlias ${BETTING_WIN_STRATEGY_EXPORT_ALIAS}.`,
      'Validated betting-win upstream lock with the canonical strategy export alias.',
    );
  }
  if (upstreamLock.surebetProfile !== BETTING_WIN_SUREBET_PROFILE) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PROFILE_MISMATCH',
      `Pinned strategy export intake requires upstream lock surebetProfile ${BETTING_WIN_SUREBET_PROFILE}.`,
      'Validated betting-win upstream lock with the surebet intake profile.',
    );
  }
  return accepted(undefined);
}

function readImmutableExportFile(
  exportPath: string,
  repositoryRoot: string,
): BoundaryResult<Readonly<{ exportPath: string; parsed: unknown; sourceSha256: string }>> {
  if (typeof exportPath !== 'string' || exportPath.trim().length === 0) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PATH_MISSING',
      'A pinned strategy export file path is required.',
      'Pinned strategy export JSON file path.',
    );
  }
  if (typeof repositoryRoot !== 'string' || repositoryRoot.trim().length === 0) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_REPOSITORY_ROOT_INVALID',
      'Pinned strategy export intake requires a repository root.',
      'Repository root containing the pinned strategy export.',
    );
  }
  const trimmedExportPath = exportPath.trim();
  const trimmedRepositoryRoot = repositoryRoot.trim();
  if (URL_SCHEME_PREFIX.test(trimmedExportPath)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_REMOTE_URL_FORBIDDEN',
      'Pinned strategy export intake requires a filesystem path, not a URL.',
      'Pinned strategy export JSON file path.',
    );
  }

  const resolvedRepositoryRoot = resolve(trimmedRepositoryRoot);
  const resolvedPath = isAbsolute(trimmedExportPath)
    ? resolve(trimmedExportPath)
    : resolve(resolvedRepositoryRoot, trimmedExportPath);
  if (!isPathInsideRoot(resolvedRepositoryRoot, resolvedPath)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PATH_OUTSIDE_REPO',
      'Pinned strategy export path must stay inside the current repository.',
      'Repo-contained pinned strategy export JSON file path.',
    );
  }

  try {
    const repositoryRealPath = realpathSync(resolvedRepositoryRoot);
    const linkStats = lstatSync(resolvedPath);
    if (linkStats.isSymbolicLink()) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_SYMLINK_FORBIDDEN',
        'Pinned strategy export path must be a real file, not a symbolic link.',
        'Non-symlink pinned strategy export JSON file.',
      );
    }

    const stats = statSync(resolvedPath);
    if (!stats.isFile()) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_PATH_NOT_FILE',
        'Pinned strategy export path must resolve to a JSON file.',
        'Pinned strategy export JSON file.',
      );
    }

    const immutablePath = realpathSync(resolvedPath);
    if (!isPathInsideRoot(repositoryRealPath, immutablePath)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_REALPATH_OUTSIDE_REPO',
        'Pinned strategy export realpath must stay inside the current repository.',
        'Repo-contained pinned strategy export JSON file realpath.',
      );
    }

    let parsed: unknown;
    let contents: string;
    try {
      contents = readFileSync(immutablePath, 'utf-8');
      parsed = JSON.parse(contents) as unknown;
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return blocked(
          'PINNED_STRATEGY_EXPORT_JSON_INVALID',
          'Pinned strategy export file must contain valid JSON.',
          'Valid pinned strategy export JSON file.',
        );
      }
      throw error;
    }

    return accepted(
      Object.freeze({
        exportPath: immutablePath,
        parsed,
        sourceSha256: sha256Hex(contents),
      }),
    );
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return blocked(
        'PINNED_STRATEGY_EXPORT_FILE_MISSING',
        'Pinned strategy export file does not exist.',
        'Pinned strategy export JSON file.',
      );
    }
    throw error;
  }
}

function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return relativePath.length === 0 || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function parseStrategyExportDocument(value: unknown): BoundaryResult<StrategyExportDocument> {
  if (!isObject(value)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_NOT_OBJECT',
      'Pinned strategy export must be a JSON object.',
      'Pinned strategy export JSON document.',
    );
  }

  if (value.schemaVersion !== PROVIDER_COLLECTION_SCHEMA_VERSION) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_SCHEMA_VERSION_INVALID',
      `Pinned strategy export schemaVersion must be ${PROVIDER_COLLECTION_SCHEMA_VERSION}.`,
      'Pinned strategy export schemaVersion from the validated betting-win export contract.',
    );
  }

  const phase = value.phase;
  if (phase !== PROVIDER_HISTORY_EXPORT_PHASE && phase !== STORE_BACKED_PROVIDER_HISTORY_EXPORT_PHASE) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PHASE_INVALID',
      'Pinned strategy export phase must be F2-005F or F2-005J.',
      'Pinned strategy export phase from the validated betting-win export contract.',
    );
  }

  const exportProfile = value.exportProfile;
  if (
    (phase === PROVIDER_HISTORY_EXPORT_PHASE && exportProfile !== PROVIDER_HISTORY_EXPORT_PROFILE)
    || (phase === STORE_BACKED_PROVIDER_HISTORY_EXPORT_PHASE && exportProfile !== STORE_BACKED_PROVIDER_HISTORY_EXPORT_PROFILE)
  ) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PROFILE_INVALID',
      'Pinned strategy export profile must match the export phase.',
      'Pinned strategy export profile from the validated betting-win export contract.',
    );
  }

  if (value.exportKind !== PINNED_PROVIDER_HISTORY_EXPORT_KIND) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_KIND_INVALID',
      `Pinned strategy export kind must be ${PINNED_PROVIDER_HISTORY_EXPORT_KIND}.`,
      'Pinned strategy export kind from the validated betting-win export contract.',
    );
  }

  const exportId = requireNonEmptyString(
    value.exportId,
    'PINNED_STRATEGY_EXPORT_ID_MISSING',
    'Pinned strategy export exportId is required.',
    'Pinned strategy export id.',
  );
  if (!exportId.ok) {
    return exportId;
  }

  const exportedAt = requireIsoTimestamp(
    value.exportedAt,
    'PINNED_STRATEGY_EXPORT_EXPORTED_AT_INVALID',
    'Pinned strategy export exportedAt must be an ISO-8601 UTC timestamp.',
    'Pinned strategy export exportedAt timestamp.',
  );
  if (!exportedAt.ok) {
    return exportedAt;
  }

  const fixtureId = requireNonEmptyString(
    value.fixtureId,
    'PINNED_STRATEGY_EXPORT_FIXTURE_ID_MISSING',
    'Pinned strategy export fixtureId is required.',
    'Pinned strategy export fixture id.',
  );
  if (!fixtureId.ok) {
    return fixtureId;
  }

  const providerId = requireNonEmptyString(
    value.providerId,
    'PINNED_STRATEGY_EXPORT_PROVIDER_ID_MISSING',
    'Pinned strategy export providerId is required.',
    'Pinned strategy export provider id.',
  );
  if (!providerId.ok) {
    return providerId;
  }

  const endpointId = requireNonEmptyString(
    value.endpointId,
    'PINNED_STRATEGY_EXPORT_ENDPOINT_ID_MISSING',
    'Pinned strategy export endpointId is required.',
    'Pinned strategy export endpoint id.',
  );
  if (!endpointId.ok) {
    return endpointId;
  }

  const transportMode = requireTransportMode(value.transportMode);
  if (!transportMode.ok) {
    return transportMode;
  }

  if (value.liveTransportAllowed !== false) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_LIVE_TRANSPORT_FORBIDDEN',
      'Pinned strategy export intake requires liveTransportAllowed to be false.',
      'Pinned strategy export with live transport disabled.',
    );
  }

  const payloadSha256 = requireSha256(
    value.payloadSha256,
    'PINNED_STRATEGY_EXPORT_PAYLOAD_SHA256_INVALID',
    'Pinned strategy export payloadSha256 must be 64 hexadecimal characters.',
    'Pinned strategy export payload SHA-256.',
  );
  if (!payloadSha256.ok) {
    return payloadSha256;
  }

  if (!isObject(value.payload)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PAYLOAD_MISSING',
      'Pinned strategy export payload must be a JSON object.',
      'Pinned strategy export payload.',
    );
  }

  const actualPayloadSha256 = sha256Hex(stableJsonCompact(value.payload));
  if (actualPayloadSha256 !== payloadSha256.value) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PAYLOAD_SHA256_MISMATCH',
      'Pinned strategy export payloadSha256 does not match the payload content.',
      'Pinned strategy export whose payload SHA-256 matches the immutable payload.',
    );
  }

  if (phase === PROVIDER_HISTORY_EXPORT_PHASE) {
    if (value.rawStoreStateSha256 !== undefined || value.quoteStoreStateSha256 !== undefined) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_PHASE_HASH_FIELDS_INVALID',
        'Pinned strategy export F2-005F documents must not carry store-backed hash fields.',
        'Pinned strategy export hash fields that match the export phase.',
      );
    }
    const collectionReportSha256 = requireSha256(
      value.collectionReportSha256,
      'PINNED_STRATEGY_EXPORT_COLLECTION_REPORT_SHA256_INVALID',
      'Pinned strategy export collectionReportSha256 must be 64 hexadecimal characters.',
      'Pinned strategy export collection report SHA-256.',
    );
    if (!collectionReportSha256.ok) {
      return collectionReportSha256;
    }

    const collectionReport = value.payload.collectionReport;
    if (!isObject(collectionReport)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_COLLECTION_REPORT_MISSING',
        'Pinned strategy export collectionReport must be present for F2-005F exports.',
        'Pinned strategy export collection report.',
      );
    }
    const actualCollectionReportSha256 = sha256Hex(stableJsonCompact(collectionReport));
    if (actualCollectionReportSha256 !== collectionReportSha256.value) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_COLLECTION_REPORT_SHA256_MISMATCH',
        'Pinned strategy export collectionReportSha256 does not match collectionReport content.',
        'Pinned strategy export whose collection report SHA-256 matches the immutable content.',
      );
    }
  }

  if (phase === STORE_BACKED_PROVIDER_HISTORY_EXPORT_PHASE) {
    if (value.collectionReportSha256 !== undefined) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_PHASE_HASH_FIELDS_INVALID',
        'Pinned strategy export F2-005J documents must not carry collection report hash fields.',
        'Pinned strategy export hash fields that match the export phase.',
      );
    }
    const rawStoreStateSha256 = requireSha256(
      value.rawStoreStateSha256,
      'PINNED_STRATEGY_EXPORT_RAW_STORE_SHA256_INVALID',
      'Pinned strategy export rawStoreStateSha256 must be 64 hexadecimal characters.',
      'Pinned strategy export raw store state SHA-256.',
    );
    if (!rawStoreStateSha256.ok) {
      return rawStoreStateSha256;
    }
    const quoteStoreStateSha256 = requireSha256(
      value.quoteStoreStateSha256,
      'PINNED_STRATEGY_EXPORT_QUOTE_STORE_SHA256_INVALID',
      'Pinned strategy export quoteStoreStateSha256 must be 64 hexadecimal characters.',
      'Pinned strategy export quote store state SHA-256.',
    );
    if (!quoteStoreStateSha256.ok) {
      return quoteStoreStateSha256;
    }
    const rawStore = value.payload.rawStore;
    if (!isObject(rawStore)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_RAW_STORE_MISSING',
        'Pinned strategy export payload.rawStore must be a JSON object.',
        'Pinned strategy export raw store payload.',
      );
    }
    const actualRawStoreStateSha256 = sha256Hex(stableJsonCompact(rawStore));
    if (actualRawStoreStateSha256 !== rawStoreStateSha256.value) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_RAW_STORE_SHA256_MISMATCH',
        'Pinned strategy export rawStoreStateSha256 does not match payload.rawStore content.',
        'Pinned strategy export whose raw store SHA-256 matches the immutable content.',
      );
    }
    const quoteStore = value.payload.quoteStore;
    if (!isObject(quoteStore)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_QUOTE_STORE_MISSING',
        'Pinned strategy export payload.quoteStore must be a JSON object.',
        'Pinned strategy export quote store payload.',
      );
    }
    const actualQuoteStoreStateSha256 = sha256Hex(stableJsonCompact(quoteStore));
    if (actualQuoteStoreStateSha256 !== quoteStoreStateSha256.value) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_QUOTE_STORE_SHA256_MISMATCH',
        'Pinned strategy export quoteStoreStateSha256 does not match payload.quoteStore content.',
        'Pinned strategy export whose quote store SHA-256 matches the immutable content.',
      );
    }
  }

  const providerGenerationIds = requireStringArray(
    value.providerGenerationIds,
    'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATION_IDS_INVALID',
    'Pinned strategy export providerGenerationIds must be a non-empty string array.',
    'Pinned strategy export provider generation ids.',
  );
  if (!providerGenerationIds.ok) {
    return providerGenerationIds;
  }
  const sourceLineageRecordIds = requireStringArray(
    value.sourceLineageRecordIds,
    'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_IDS_INVALID',
    'Pinned strategy export sourceLineageRecordIds must be a non-empty string array.',
    'Pinned strategy export source lineage record ids.',
  );
  if (!sourceLineageRecordIds.ok) {
    return sourceLineageRecordIds;
  }
  const normalizedEvidenceIds = requireStringArray(
    value.normalizedEvidenceIds,
    'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_IDS_INVALID',
    'Pinned strategy export normalizedEvidenceIds must be a string array.',
    'Pinned strategy export normalized evidence ids.',
    { allowEmpty: true },
  );
  if (!normalizedEvidenceIds.ok) {
    return normalizedEvidenceIds;
  }

  return accepted(
    Object.freeze({
      schemaVersion: PROVIDER_COLLECTION_SCHEMA_VERSION,
      phase,
      exportId: exportId.value,
      exportProfile: exportProfile as BettingWinStrategyExportProfile,
      exportKind: PINNED_PROVIDER_HISTORY_EXPORT_KIND,
      exportedAt: exportedAt.value,
      fixtureId: fixtureId.value,
      providerId: providerId.value,
      endpointId: endpointId.value,
      transportMode: transportMode.value,
      liveTransportAllowed: false,
      payloadSha256: payloadSha256.value,
      providerGenerationIds: providerGenerationIds.value,
      sourceLineageRecordIds: sourceLineageRecordIds.value,
      normalizedEvidenceIds: normalizedEvidenceIds.value,
      payload: value.payload,
      ...(typeof value.collectionReportSha256 === 'string'
        ? { collectionReportSha256: value.collectionReportSha256 }
        : {}),
      ...(typeof value.rawStoreStateSha256 === 'string'
        ? { rawStoreStateSha256: value.rawStoreStateSha256 }
        : {}),
      ...(typeof value.quoteStoreStateSha256 === 'string'
        ? { quoteStoreStateSha256: value.quoteStoreStateSha256 }
        : {}),
    }),
  );
}

function validateStrategyExportPayload(
  document: StrategyExportDocument,
): BoundaryResult<
  Readonly<{
    providerGenerationIds: readonly string[];
    sourceLineageRecordIds: readonly string[];
    normalizedEvidenceIds: readonly string[];
    rawObservationCount: number;
    sourceLineageRecordCount: number;
    sourceLineageEventCount: number;
    generationResolutionCount: number;
    normalizedEvidenceCount: number;
    normalizedRejectionCount: number;
  }>
> {
  const payload = document.payload;
  const rawStore = payload.rawStore;
  if (!isObject(rawStore)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_RAW_STORE_MISSING',
      'Pinned strategy export payload.rawStore must be a JSON object.',
      'Pinned strategy export raw store payload.',
    );
  }
  const quoteStore = payload.quoteStore;
  if (!isObject(quoteStore)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_QUOTE_STORE_MISSING',
      'Pinned strategy export payload.quoteStore must be a JSON object.',
      'Pinned strategy export quote store payload.',
    );
  }

  const observations = requireObjectArray(
    rawStore.observations,
    'PINNED_STRATEGY_EXPORT_RAW_OBSERVATIONS_INVALID',
    'Pinned strategy export payload.rawStore.observations must be a non-empty array.',
    'Pinned strategy export raw observations.',
  );
  if (!observations.ok) {
    return observations;
  }
  const sourceLineageRecords = requireObjectArray(
    rawStore.sourceLineageRecords,
    'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_RECORDS_INVALID',
    'Pinned strategy export payload.rawStore.sourceLineageRecords must be a non-empty array.',
    'Pinned strategy export source lineage records.',
  );
  if (!sourceLineageRecords.ok) {
    return sourceLineageRecords;
  }
  const sourceLineageEvents = requireObjectArray(
    rawStore.sourceLineageEvents,
    'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_EVENTS_INVALID',
    'Pinned strategy export payload.rawStore.sourceLineageEvents must be a non-empty array.',
    'Pinned strategy export source lineage events.',
  );
  if (!sourceLineageEvents.ok) {
    return sourceLineageEvents;
  }
  const generationResolutions = requireObjectArray(
    quoteStore.generationResolutions,
    'PINNED_STRATEGY_EXPORT_GENERATION_RESOLUTIONS_INVALID',
    'Pinned strategy export payload.quoteStore.generationResolutions must be a non-empty array.',
    'Pinned strategy export generation resolutions.',
  );
  if (!generationResolutions.ok) {
    return generationResolutions;
  }
  const normalizedEvidence = requireObjectArray(
    quoteStore.normalizedEvidence,
    'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_INVALID',
    'Pinned strategy export payload.quoteStore.normalizedEvidence must be an array.',
    'Pinned strategy export normalized evidence.',
    { allowEmpty: true },
  );
  if (!normalizedEvidence.ok) {
    return normalizedEvidence;
  }
  const normalizedRejections = requireObjectArray(
    quoteStore.normalizedRejections,
    'PINNED_STRATEGY_EXPORT_NORMALIZED_REJECTIONS_INVALID',
    'Pinned strategy export payload.quoteStore.normalizedRejections must be an array.',
    'Pinned strategy export normalized rejections.',
    { allowEmpty: true },
  );
  if (!normalizedRejections.ok) {
    return normalizedRejections;
  }
  if (normalizedEvidence.value.length === 0 && normalizedRejections.value.length === 0) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_NORMALIZED_RESULTS_MISSING',
      'Pinned strategy export payload.quoteStore must contain normalized evidence or normalized rejections.',
      'Pinned strategy export quote store with normalized evidence or rejections.',
    );
  }

  const payloadBinding = payload.binding;
  if (!isObject(payloadBinding)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_BINDING_MISSING',
      'Pinned strategy export payload.binding must be a JSON object.',
      'Pinned strategy export binding payload.',
    );
  }

  const bindingProviderId = payloadBinding.providerId;
  if (bindingProviderId !== document.providerId) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PROVIDER_MISMATCH',
      'Pinned strategy export providerId does not match payload.binding.providerId.',
      'Pinned strategy export whose provider identity is internally consistent.',
    );
  }
  const bindingEndpointId = payloadBinding.endpointId;
  if (bindingEndpointId !== document.endpointId) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_ENDPOINT_MISMATCH',
      'Pinned strategy export endpointId does not match payload.binding.endpointId.',
      'Pinned strategy export whose endpoint identity is internally consistent.',
    );
  }

  const rawRecordIds: string[] = [];
  for (const record of sourceLineageRecords.value) {
    const recordId = record.recordId;
    if (typeof recordId !== 'string' || recordId.trim().length === 0) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_RECORD_ID_MISSING',
        'Pinned strategy export source lineage records must contain a non-empty recordId.',
        'Pinned strategy export source lineage record ids.',
      );
    }
    rawRecordIds.push(recordId);
    if (record.provider !== document.providerId) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_PROVIDER_MISMATCH',
        'Pinned strategy export source lineage records must match the export providerId.',
        'Pinned strategy export with provider-consistent source lineage records.',
      );
    }
  }
  if (new Set(rawRecordIds).size !== rawRecordIds.length) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_DUPLICATE',
      'Pinned strategy export source lineage record ids must be unique.',
      'Pinned strategy export with unique source lineage record ids.',
    );
  }
  const expectedSourceLineageRecordIds = Object.freeze([...rawRecordIds].sort());
  if (!equalStringArrays(document.sourceLineageRecordIds, expectedSourceLineageRecordIds)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_MISMATCH',
      'Pinned strategy export sourceLineageRecordIds do not match payload.rawStore.sourceLineageRecords.',
      'Pinned strategy export whose lineage id summary matches the raw lineage records.',
    );
  }

  const generationIds: string[] = [];
  const resolvedGenerationIds: string[] = [];
  for (const generationResolution of generationResolutions.value) {
    const providerGenerationId = requireGenerationReference(generationResolution, 'generation resolution');
    if (!providerGenerationId.ok) {
      return providerGenerationId;
    }
    resolvedGenerationIds.push(providerGenerationId.value);
    generationIds.push(providerGenerationId.value);
  }
  const resolvedGenerationIdSet = new Set(resolvedGenerationIds);
  for (const evidence of normalizedEvidence.value) {
    const providerGenerationId = requireGenerationReference(evidence, 'normalized evidence');
    if (!providerGenerationId.ok) {
      return providerGenerationId;
    }
    if (!resolvedGenerationIdSet.has(providerGenerationId.value)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATION_REFERENCE_MISSING',
        'Pinned strategy export normalized evidence must reference a resolved provider generation id.',
        'Pinned strategy export normalized evidence backed by generation resolutions.',
      );
    }
    generationIds.push(providerGenerationId.value);
  }
  for (const rejection of normalizedRejections.value) {
    const providerGenerationId = requireGenerationReference(rejection, 'normalized rejection');
    if (!providerGenerationId.ok) {
      return providerGenerationId;
    }
    if (!resolvedGenerationIdSet.has(providerGenerationId.value)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATION_REFERENCE_MISSING',
        'Pinned strategy export normalized rejections must reference a resolved provider generation id.',
        'Pinned strategy export normalized rejections backed by generation resolutions.',
      );
    }
    generationIds.push(providerGenerationId.value);
  }
  if (generationIds.length === 0) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATIONS_MISSING',
      'Pinned strategy export payload must resolve at least one provider generation id.',
      'Pinned strategy export with resolved provider generation ids.',
    );
  }
  const expectedProviderGenerationIds = Object.freeze(Array.from(new Set(generationIds)).sort());
  if (!equalStringArrays(document.providerGenerationIds, expectedProviderGenerationIds)) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATION_MISMATCH',
      'Pinned strategy export providerGenerationIds do not match the payload generation references.',
      'Pinned strategy export whose provider generation id summary matches the payload references.',
    );
  }

  const sourceLineageIdSet = new Set(expectedSourceLineageRecordIds);
  for (const generationResolution of generationResolutions.value) {
    const recordId = generationResolution.recordId;
    if (typeof recordId !== 'string' || !sourceLineageIdSet.has(recordId)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_GENERATION_LINEAGE_MISMATCH',
        'Pinned strategy export generation resolutions must reference known source lineage record ids.',
        'Pinned strategy export with generation resolutions anchored to known lineage records.',
      );
    }
  }

  const expectedNormalizedEvidenceIds = normalizedEvidence.value
    .map((evidence) => evidence.normalizedEvidenceId)
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .sort();
  if (expectedNormalizedEvidenceIds.length !== normalizedEvidence.value.length) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_ID_MISSING',
      'Pinned strategy export normalized evidence entries must contain normalizedEvidenceId values.',
      'Pinned strategy export normalized evidence ids.',
    );
  }
  if (new Set(expectedNormalizedEvidenceIds).size !== expectedNormalizedEvidenceIds.length) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_DUPLICATE',
      'Pinned strategy export normalized evidence ids must be unique.',
      'Pinned strategy export with unique normalized evidence ids.',
    );
  }
  if (!equalStringArrays(document.normalizedEvidenceIds, Object.freeze(expectedNormalizedEvidenceIds))) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_MISMATCH',
      'Pinned strategy export normalizedEvidenceIds do not match payload.quoteStore.normalizedEvidence.',
      'Pinned strategy export whose normalized evidence id summary matches the payload evidence.',
    );
  }

  for (const evidence of normalizedEvidence.value) {
    const sourceLineageRecordId = evidence.sourceLineageRecordId;
    if (typeof sourceLineageRecordId !== 'string' || !sourceLineageIdSet.has(sourceLineageRecordId)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_LINEAGE_MISMATCH',
        'Pinned strategy export normalized evidence must reference known source lineage record ids.',
        'Pinned strategy export with normalized evidence anchored to known lineage records.',
      );
    }
    if (evidence.provider !== document.providerId) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_PROVIDER_MISMATCH',
        'Pinned strategy export normalized evidence must match the export providerId.',
        'Pinned strategy export with provider-consistent normalized evidence.',
      );
    }
  }

  for (const rejection of normalizedRejections.value) {
    const sourceLineageRecordId = rejection.sourceLineageRecordId;
    if (typeof sourceLineageRecordId !== 'string' || !sourceLineageIdSet.has(sourceLineageRecordId)) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_NORMALIZED_REJECTION_LINEAGE_MISMATCH',
        'Pinned strategy export normalized rejections must reference known source lineage record ids.',
        'Pinned strategy export with normalized rejections anchored to known lineage records.',
      );
    }
    if (rejection.provider !== document.providerId) {
      return blocked(
        'PINNED_STRATEGY_EXPORT_NORMALIZED_REJECTION_PROVIDER_MISMATCH',
        'Pinned strategy export normalized rejections must match the export providerId.',
        'Pinned strategy export with provider-consistent normalized rejections.',
      );
    }
  }

  return accepted(
    Object.freeze({
      providerGenerationIds: expectedProviderGenerationIds,
      sourceLineageRecordIds: expectedSourceLineageRecordIds,
      normalizedEvidenceIds: Object.freeze(expectedNormalizedEvidenceIds),
      rawObservationCount: observations.value.length,
      sourceLineageRecordCount: sourceLineageRecords.value.length,
      sourceLineageEventCount: sourceLineageEvents.value.length,
      generationResolutionCount: generationResolutions.value.length,
      normalizedEvidenceCount: normalizedEvidence.value.length,
      normalizedRejectionCount: normalizedRejections.value.length,
    }),
  );
}

function requireGenerationReference(
  record: Readonly<Record<string, unknown>>,
  label: string,
): BoundaryResult<string> {
  const providerGenerationId = record.providerGenerationId;
  if (typeof providerGenerationId !== 'string' || providerGenerationId.trim().length === 0) {
    return blocked(
      'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATION_ID_MISSING',
      `Pinned strategy export ${label} records must contain a non-empty providerGenerationId.`,
      'Pinned strategy export with provider generation provenance on every normalized record.',
    );
  }
  return accepted(providerGenerationId.trim());
}

function requireNonEmptyString(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value.trim());
}

function requireIsoTimestamp(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireTransportMode(value: unknown): BoundaryResult<'fixture' | 'mock'> {
  if (value !== 'fixture' && value !== 'mock') {
    return blocked(
      'PINNED_STRATEGY_EXPORT_TRANSPORT_MODE_INVALID',
      'Pinned strategy export transportMode must be fixture or mock.',
      'Pinned strategy export transport mode.',
    );
  }
  return accepted(value);
}

function requireSha256(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
): BoundaryResult<string> {
  if (typeof value !== 'string' || !SHA256_REGEX.test(value)) {
    return blocked(code, message, evidenceRequired);
  }
  return accepted(value);
}

function requireStringArray(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
  options: Readonly<{ allowEmpty?: boolean }> = {},
): BoundaryResult<readonly string[]> {
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    return blocked(code, message, evidenceRequired);
  }
  const entries: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      return blocked(code, message, evidenceRequired);
    }
    entries.push(entry);
  }
  if (new Set(entries).size !== entries.length) {
    return blocked(
      code.replace(/_INVALID$/, '_DUPLICATE'),
      'Pinned strategy export summary arrays must not contain duplicate ids.',
      evidenceRequired,
    );
  }
  return accepted(Object.freeze(entries));
}

function requireObjectArray(
  value: unknown,
  code: string,
  message: string,
  evidenceRequired: string,
  options: Readonly<{ allowEmpty?: boolean }> = {},
): BoundaryResult<readonly Record<string, unknown>[]> {
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    return blocked(code, message, evidenceRequired);
  }
  const entries: Record<string, unknown>[] = [];
  for (const entry of value) {
    if (!isObject(entry)) {
      return blocked(code, message, evidenceRequired);
    }
    entries.push(entry);
  }
  return accepted(Object.freeze(entries));
}

function stableJsonCompact(value: unknown): string {
  return JSON.stringify(stableSort(value));
}

function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = stableSort((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function equalStringArrays(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
