import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  SurebetImportRunRepository,
  SurebetPinnedStrategyExportRepository,
  SurebetPrivatePaperRuntimeSchedulerCheckpointRepository,
  SurebetStrategyLedgerRepository,
  SurebetUpstreamApiConvergenceRepository,
  SurebetUpstreamExportConvergenceRepository,
  SurebetUpstreamLockRepository,
  SurebetWorkerJobRepository,
  listAppliedSurebetMigrations,
  loadSurebetMigrationFiles,
  queryPsqlJsonRows,
  resolveSurebetPersistenceConfig,
  sha256Hex,
  stableJsonStringify,
  type AppliedSurebetMigration,
  type SurebetMigrationFile,
  type SurebetPersistenceConfig,
  type SurebetPersistenceEnvironment,
} from '../../../persistence/src/index.js';
import {
  createBwsReadOnlyQueryService,
  type BwsReadOnlyQueryDependencies,
  type BwsReadOnlyQueryResponse,
  type BwsPinnedStrategyExportItem,
  type BwsPrivatePaperRuntimeCycleItem,
  type BwsStrategyLedgerItem,
} from '../api/bws-read-only-query-service.js';
import { createBwsReadOnlyQueryHttpHandler } from '../api/bws-read-only-query-http.js';

const BACKUP_MANIFEST_SCHEMA = 'bws.database_backup_manifest.v1';
const BACKUP_RESULT_SCHEMA = 'bws.database_backup_result.v1';
const MIGRATION_STATUS_SCHEMA = 'bws.database_migration_status.v1';
const RESTORE_VERIFICATION_SCHEMA = 'bws.database_restore_verification.v1';
const RETENTION_PLAN_SCHEMA = 'bws.database_retention_plan.v1';
const RETENTION_APPLY_SCHEMA = 'bws.database_retention_apply.v1';
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;
const LOOPBACK_HOST = '127.0.0.1';
const MAX_DATABASE_NAME_BYTES = 63;
const BACKUP_DUMP_FILE = 'surebet.dump';
const BACKUP_MANIFEST_FILE = 'manifest.json';
const BACKUP_SHA256_FILE = 'SHA256SUMS';
const DEFAULT_RETENTION_SCOPES = Object.freeze([
  'import_runs',
  'scheduler_checkpoints',
  'upstream_api_checkpoints',
  'upstream_export_checkpoints',
  'worker_job_checkpoints',
  'worker_job_dead_letters',
] as const);

type BwsRetentionScope = (typeof DEFAULT_RETENTION_SCOPES)[number];

interface DatabaseIdentityRow {
  readonly currentDatabase: string;
  readonly currentUser: string;
  readonly serverVersion: string;
  readonly serverVersionNum: string;
}

interface DatabaseTableRow {
  readonly tableName: string;
}

interface DatabaseObjectCountRow {
  readonly objectCount: number;
}

interface SingleValueRow {
  readonly value: string;
}

interface MigrationChecksumMismatch {
  readonly appliedSha256: string;
  readonly expectedSha256: string;
  readonly migrationName: string;
}

export interface BwsDatabaseIdentity {
  readonly connectionTarget: string;
  readonly currentDatabase: string;
  readonly currentUser: string;
  readonly requestedDatabase: string;
  readonly requestedUser: string;
  readonly serverVersion: string;
  readonly serverVersionNum: string;
}

export interface BwsDatabaseTableCount {
  readonly rowCount: number;
  readonly tableName: string;
}

export interface BwsMigrationStatusResult {
  readonly compatibility: Readonly<{
    readonly reasons: readonly string[];
    readonly status: 'compatible' | 'incompatible';
  }>;
  readonly database: BwsDatabaseIdentity;
  readonly drain: Readonly<{
    readonly activeLifecycleDetected: boolean;
    readonly reasons: readonly string[];
    readonly requiredForMigrationApply: boolean;
    readonly stateFilePath: string;
  }>;
  readonly generatedAt: string;
  readonly migrationLedger: Readonly<{
    readonly applied: readonly AppliedSurebetMigration[];
    readonly available: readonly Readonly<{
      readonly migrationName: string;
      readonly path: string;
      readonly sha256: string;
    }>[];
    readonly checksumMismatches: readonly MigrationChecksumMismatch[];
    readonly pending: readonly Readonly<{
      readonly migrationName: string;
      readonly path: string;
      readonly sha256: string;
    }>[];
  }>;
  readonly ownership: Readonly<{
    readonly migrationScope: 'surebet_only_verified';
    readonly schema: 'surebet';
    readonly schemaExists: boolean;
    readonly schemaOwnedObjectCount: number;
  }>;
  readonly schema: typeof MIGRATION_STATUS_SCHEMA;
}

export interface BwsDatabaseBackupManifest {
  readonly backupDumpFile: string;
  readonly createdAt: string;
  readonly database: BwsDatabaseIdentity;
  readonly migrationLedger: BwsMigrationStatusResult['migrationLedger'];
  readonly rowCounts: readonly BwsDatabaseTableCount[];
  readonly schema: typeof BACKUP_MANIFEST_SCHEMA;
}

export interface BwsCreateDatabaseBackupRequest {
  readonly allowOverwrite?: boolean;
  readonly now?: () => string;
  readonly outputPath: string;
  readonly persistenceConfig?: SurebetPersistenceConfig;
  readonly persistenceEnvironment?: SurebetPersistenceEnvironment;
  readonly repositoryRoot?: string;
  readonly runCommand?: UtilityCommandRunner;
}

export interface BwsCreateDatabaseBackupResult {
  readonly backupDirectory: string;
  readonly createdAt: string;
  readonly dumpFile: string;
  readonly manifest: BwsDatabaseBackupManifest;
  readonly manifestFile: string;
  readonly schema: typeof BACKUP_RESULT_SCHEMA;
  readonly sha256File: string;
}

export interface BwsVerifyDatabaseRestoreRequest {
  readonly backupPath: string;
  readonly now?: () => string;
  readonly persistenceConfig?: SurebetPersistenceConfig;
  readonly persistenceEnvironment?: SurebetPersistenceEnvironment;
  readonly repositoryRoot?: string;
  readonly runCommand?: UtilityCommandRunner;
}

export interface BwsVerifyDatabaseRestoreResult {
  readonly apiChecks: Readonly<{
    readonly firstRun: readonly ApiVerificationResult[];
    readonly secondRun: readonly ApiVerificationResult[];
  }>;
  readonly backupManifest: BwsDatabaseBackupManifest;
  readonly createdAt: string;
  readonly disposableDatabase: string;
  readonly migrationStatus: BwsMigrationStatusResult;
  readonly restoredRowCounts: readonly BwsDatabaseTableCount[];
  readonly schema: typeof RESTORE_VERIFICATION_SCHEMA;
  readonly serverRestartsVerified: boolean;
}

interface ApiVerificationResult {
  readonly resource: 'pinned_strategy_exports' | 'private_paper_runtime_cycles' | 'strategy_ledger_entries';
  readonly returnedCount: number;
}

export interface BwsDatabaseRetentionPlanRequest {
  readonly cutoff: string;
  readonly maxRows: number;
  readonly now?: () => string;
  readonly persistenceConfig?: SurebetPersistenceConfig;
  readonly persistenceEnvironment?: SurebetPersistenceEnvironment;
  readonly repositoryRoot?: string;
  readonly scope: BwsRetentionScope;
}

export interface BwsDatabaseRetentionPlan {
  readonly candidates: readonly RetentionCandidate[];
  readonly cutoff: string;
  readonly generatedAt: string;
  readonly maxRows: number;
  readonly planFingerprint: string;
  readonly plannedDeleteCount: number;
  readonly schema: typeof RETENTION_PLAN_SCHEMA;
  readonly scope: BwsRetentionScope;
  readonly totalEligibleRows: number;
}

export interface BwsApplyDatabaseRetentionRequest extends BwsDatabaseRetentionPlanRequest {
  readonly planFingerprint: string;
}

export interface BwsApplyDatabaseRetentionResult {
  readonly cutoff: string;
  readonly deletedCount: number;
  readonly deletedKeys: readonly RetentionCandidate[];
  readonly generatedAt: string;
  readonly maxRows: number;
  readonly planFingerprint: string;
  readonly schema: typeof RETENTION_APPLY_SCHEMA;
  readonly scope: BwsRetentionScope;
}

interface RetentionCandidate {
  readonly primaryKey: Readonly<Record<string, string>>;
  readonly recordedAt: string;
}

interface RetentionCandidateRow {
  readonly primaryKey: Readonly<Record<string, string>>;
  readonly recordedAt: string;
}

interface RetentionDeletionRow {
  readonly deletedCount: number;
}

interface UtilityCommandRunner {
  (
    command: string,
    args: readonly string[],
    config: SurebetPersistenceConfig,
    stdin?: string,
  ): string;
}

export function getBwsDatabaseMigrationStatus(
  request: {
    readonly now?: () => string;
    readonly persistenceConfig?: SurebetPersistenceConfig;
    readonly persistenceEnvironment?: SurebetPersistenceEnvironment;
    readonly repositoryRoot?: string;
  } = {},
): BwsMigrationStatusResult {
  const repositoryRoot = request.repositoryRoot === undefined
    ? process.cwd()
    : request.repositoryRoot;
  const now = request.now === undefined ? defaultNow : request.now;
  const config = request.persistenceConfig === undefined
    ? resolveSurebetPersistenceConfig(request.persistenceEnvironment)
    : request.persistenceConfig;
  const databaseIdentity = queryDatabaseIdentity(config);
  const availableMigrations = loadSurebetMigrationFiles(repositoryRoot);
  const appliedMigrations = listAppliedSurebetMigrations(config);
  const pending = buildPendingMigrations(availableMigrations, appliedMigrations);
  const checksumMismatches = buildMigrationChecksumMismatches(availableMigrations, appliedMigrations);
  const ownership = inspectSurebetOwnership(config);
  const drain = detectDrainRequirement(repositoryRoot, config, pending.length > 0);
  const compatibilityReasons: string[] = [];
  if (checksumMismatches.length > 0) {
    compatibilityReasons.push('Applied migration checksums differ from tracked surebet migration files.');
  }
  if (!ownership.schemaExists) {
    compatibilityReasons.push('The surebet schema does not exist in the target database.');
  }
  const compatibility = compatibilityReasons.length === 0 ? 'compatible' : 'incompatible';
  return Object.freeze({
    compatibility: Object.freeze({
      reasons: Object.freeze(compatibilityReasons),
      status: compatibility,
    }),
    database: databaseIdentity,
    drain,
    generatedAt: now(),
    migrationLedger: Object.freeze({
      applied: Object.freeze(appliedMigrations),
      available: Object.freeze(availableMigrations.map(toMigrationDescriptor)),
      checksumMismatches: Object.freeze(checksumMismatches),
      pending: Object.freeze(pending.map(toMigrationDescriptor)),
    }),
    ownership,
    schema: MIGRATION_STATUS_SCHEMA,
  });
}

export function createBwsDatabaseBackup(
  request: BwsCreateDatabaseBackupRequest,
): BwsCreateDatabaseBackupResult {
  const repositoryRoot = request.repositoryRoot === undefined
    ? process.cwd()
    : request.repositoryRoot;
  const now = request.now === undefined ? defaultNow : request.now;
  const config = request.persistenceConfig === undefined
    ? resolveSurebetPersistenceConfig(request.persistenceEnvironment)
    : request.persistenceConfig;
  const runner = request.runCommand === undefined ? runUtilityCommand : request.runCommand;
  const outputPath = requireOutputPath(request.outputPath, repositoryRoot);
  const allowOverwrite = request.allowOverwrite === true;
  const tempDirectory = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
  if (existsSync(outputPath) && !allowOverwrite) {
    throw new Error(`Backup output path already exists and overwrite was not allowed: ${outputPath}`);
  }
  rmSync(tempDirectory, { force: true, recursive: true });
  mkdirSync(tempDirectory, { recursive: true });

  try {
    const migrationStatus = getBwsDatabaseMigrationStatus({
      now,
      persistenceConfig: config,
      repositoryRoot,
    });
    const temporaryDumpFile = join(tempDirectory, BACKUP_DUMP_FILE);
    runner(
      'pg_dump',
      Object.freeze([
        '--format=custom',
        '--file',
        temporaryDumpFile,
        '--schema=surebet',
        ...buildPgUtilityConnectionArgs(config),
      ]),
      config,
    );
    const rowCounts = querySurebetTableCounts(config);
    const manifest: BwsDatabaseBackupManifest = Object.freeze({
      backupDumpFile: BACKUP_DUMP_FILE,
      createdAt: now(),
      database: migrationStatus.database,
      migrationLedger: migrationStatus.migrationLedger,
      rowCounts,
      schema: BACKUP_MANIFEST_SCHEMA,
    });
    const temporaryManifestFile = join(tempDirectory, BACKUP_MANIFEST_FILE);
    writeJsonFile(temporaryManifestFile, manifest);
    const dumpSha256 = fileSha256(temporaryDumpFile);
    const manifestSha256 = fileSha256(temporaryManifestFile);
    writeFileSync(
      join(tempDirectory, BACKUP_SHA256_FILE),
      [
        `${dumpSha256}  ${BACKUP_DUMP_FILE}`,
        `${manifestSha256}  ${BACKUP_MANIFEST_FILE}`,
      ].join('\n') + '\n',
      'utf-8',
    );
    if (existsSync(outputPath) && allowOverwrite) {
      rmSync(outputPath, { force: true, recursive: true });
    }
    renameSync(tempDirectory, outputPath);
    return Object.freeze({
      backupDirectory: outputPath,
      createdAt: manifest.createdAt,
      dumpFile: join(outputPath, BACKUP_DUMP_FILE),
      manifest,
      manifestFile: join(outputPath, BACKUP_MANIFEST_FILE),
      schema: BACKUP_RESULT_SCHEMA,
      sha256File: join(outputPath, BACKUP_SHA256_FILE),
    });
  } catch (error) {
    rmSync(tempDirectory, { force: true, recursive: true });
    throw error;
  }
}

export async function verifyBwsDatabaseRestore(
  request: BwsVerifyDatabaseRestoreRequest,
): Promise<BwsVerifyDatabaseRestoreResult> {
  const repositoryRoot = request.repositoryRoot === undefined
    ? process.cwd()
    : request.repositoryRoot;
  const now = request.now === undefined ? defaultNow : request.now;
  const config = request.persistenceConfig === undefined
    ? resolveSurebetPersistenceConfig(request.persistenceEnvironment)
    : request.persistenceConfig;
  const runner = request.runCommand === undefined ? runUtilityCommand : request.runCommand;
  const backupPath = resolve(request.backupPath);
  const manifest = readAndValidateBackupManifest(backupPath);
  verifyBackupChecksums(backupPath);
  const disposableDatabase = buildDisposableRestoreDatabaseName(now());
  const restoreConfig = Object.freeze({
    ...config,
    database: disposableDatabase,
  });
  createDisposableDatabase(config, disposableDatabase, runner);
  try {
    runner(
      'pg_restore',
      Object.freeze([
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '-U',
        config.user,
        '-p',
        String(config.port),
        '-h',
        config.host === undefined
          ? requireNonEmptyString(config.socketDirectory, 'socketDirectory')
          : config.host,
        '--dbname',
        disposableDatabase,
        join(backupPath, BACKUP_DUMP_FILE),
      ]),
      config,
    );
    const migrationStatus = getBwsDatabaseMigrationStatus({
      now,
      persistenceConfig: restoreConfig,
      repositoryRoot,
    });
    if (migrationStatus.compatibility.status !== 'compatible') {
      throw new Error('Restored database is incompatible with the tracked surebet migration ledger.');
    }
    if (migrationStatus.migrationLedger.pending.length > 0) {
      throw new Error('Restored database still reports pending surebet migrations.');
    }
    const restoredRowCounts = querySurebetTableCounts(restoreConfig);
    assertRowCountsMatch(manifest.rowCounts, restoredRowCounts);
    const firstRun = await verifyReadOnlyApiQueries(restoreConfig);
    const secondRun = await verifyReadOnlyApiQueries(restoreConfig);
    return Object.freeze({
      apiChecks: Object.freeze({
        firstRun: Object.freeze(firstRun),
        secondRun: Object.freeze(secondRun),
      }),
      backupManifest: manifest,
      createdAt: now(),
      disposableDatabase,
      migrationStatus,
      restoredRowCounts,
      schema: RESTORE_VERIFICATION_SCHEMA,
      serverRestartsVerified: true,
    });
  } finally {
    dropDisposableDatabase(config, disposableDatabase, runner);
  }
}

export function planBwsDatabaseRetention(
  request: BwsDatabaseRetentionPlanRequest,
): BwsDatabaseRetentionPlan {
  const now = request.now === undefined ? defaultNow : request.now;
  const config = request.persistenceConfig === undefined
    ? resolveSurebetPersistenceConfig(request.persistenceEnvironment)
    : request.persistenceConfig;
  const validated = validateRetentionRequest(request.scope, request.cutoff, request.maxRows);
  const query = buildRetentionPlanQuery(validated.scope, validated.cutoff, validated.maxRows);
  const candidates = Object.freeze(
    queryPsqlJsonRows<RetentionCandidateRow>(config, query.candidateSql).map((row) => normalizeRetentionCandidate(row)),
  );
  const totalRow = queryPsqlJsonRows<{ readonly totalEligibleRows: number }>(config, query.totalSql)[0];
  const totalEligibleRows = totalRow === undefined ? 0 : totalRow.totalEligibleRows;
  const fingerprint = computeRetentionPlanFingerprint(validated.scope, validated.cutoff, validated.maxRows, candidates);
  return Object.freeze({
    candidates,
    cutoff: validated.cutoff,
    generatedAt: now(),
    maxRows: validated.maxRows,
    planFingerprint: fingerprint,
    plannedDeleteCount: candidates.length,
    schema: RETENTION_PLAN_SCHEMA,
    scope: validated.scope,
    totalEligibleRows,
  });
}

export function applyBwsDatabaseRetention(
  request: BwsApplyDatabaseRetentionRequest,
): BwsApplyDatabaseRetentionResult {
  const now = request.now === undefined ? defaultNow : request.now;
  const plan = planBwsDatabaseRetention(request);
  if (plan.planFingerprint !== request.planFingerprint) {
    throw new Error(
      `Retention plan fingerprint mismatch. Expected ${plan.planFingerprint} for scope ${plan.scope}.`,
    );
  }
  if (plan.candidates.length === 0) {
    return Object.freeze({
      cutoff: plan.cutoff,
      deletedCount: 0,
      deletedKeys: Object.freeze([]),
      generatedAt: now(),
      maxRows: plan.maxRows,
      planFingerprint: plan.planFingerprint,
      schema: RETENTION_APPLY_SCHEMA,
      scope: plan.scope,
    });
  }
  const config = request.persistenceConfig === undefined
    ? resolveSurebetPersistenceConfig(request.persistenceEnvironment)
    : request.persistenceConfig;
  const deletionSql = buildRetentionDeleteSql(plan.scope, plan.candidates);
  const deletedRow = queryPsqlJsonRows<RetentionDeletionRow>(config, deletionSql)[0];
  const deletedCount = deletedRow === undefined ? 0 : deletedRow.deletedCount;
  if (deletedCount !== plan.candidates.length) {
    throw new Error(
      `Retention apply deleted ${deletedCount} rows but planned ${plan.candidates.length}; partial prune is not allowed.`,
    );
  }
  return Object.freeze({
    cutoff: plan.cutoff,
    deletedCount,
    deletedKeys: plan.candidates,
    generatedAt: now(),
    maxRows: plan.maxRows,
    planFingerprint: plan.planFingerprint,
    schema: RETENTION_APPLY_SCHEMA,
    scope: plan.scope,
  });
}

function validateRetentionRequest(
  scope: BwsRetentionScope,
  cutoff: string,
  maxRows: number,
): Readonly<{
  readonly cutoff: string;
  readonly maxRows: number;
  readonly scope: BwsRetentionScope;
}> {
  if (!DEFAULT_RETENTION_SCOPES.includes(scope)) {
    throw new Error(`Unsupported retention scope: ${scope}`);
  }
  requireIsoTimestamp(cutoff, 'cutoff');
  if (!Number.isSafeInteger(maxRows) || maxRows <= 0) {
    throw new Error('Retention maxRows must be a positive integer.');
  }
  return Object.freeze({
    cutoff,
    maxRows,
    scope,
  });
}

function buildRetentionPlanQuery(
  scope: BwsRetentionScope,
  cutoff: string,
  maxRows: number,
): Readonly<{
  readonly candidateSql: string;
  readonly totalSql: string;
}> {
  if (scope === 'import_runs') {
    return Object.freeze({
      candidateSql: `
SELECT row_to_json(t)::text
FROM (
  SELECT
    json_build_object('importRunId', runs.import_run_id) AS "primaryKey",
    to_char(runs.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt"
  FROM surebet.import_runs AS runs
  LEFT JOIN surebet.pinned_strategy_exports AS exports
    ON exports.import_run_id = runs.import_run_id
  WHERE runs.outcome <> 'running'
    AND runs.updated_at < ${quoteTimestamp(cutoff)}
    AND exports.intake_record_id IS NULL
  ORDER BY runs.updated_at ASC, runs.import_run_id ASC
  LIMIT ${maxRows}
) AS t;
`,
      totalSql: `
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "totalEligibleRows"
  FROM surebet.import_runs AS runs
  LEFT JOIN surebet.pinned_strategy_exports AS exports
    ON exports.import_run_id = runs.import_run_id
  WHERE runs.outcome <> 'running'
    AND runs.updated_at < ${quoteTimestamp(cutoff)}
    AND exports.intake_record_id IS NULL
) AS t;
`,
    });
  }
  if (scope === 'worker_job_checkpoints') {
    return Object.freeze({
      candidateSql: `
SELECT row_to_json(t)::text
FROM (
  SELECT
    json_build_object('jobId', checkpoints.job_id, 'checkpointId', checkpoints.checkpoint_id) AS "primaryKey",
    to_char(checkpoints.recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt"
  FROM surebet.worker_job_checkpoints AS checkpoints
  JOIN surebet.worker_jobs AS jobs
    ON jobs.job_id = checkpoints.job_id
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id = CONCAT(
        COALESCE(jobs.payload_json->>'runtimeId', ''),
        ':',
        COALESCE(jobs.payload_json->>'cycleId', '')
      )
  WHERE checkpoints.recorded_at < ${quoteTimestamp(cutoff)}
    AND ledger.ledger_entry_id IS NULL
  ORDER BY checkpoints.recorded_at ASC, checkpoints.job_id ASC, checkpoints.checkpoint_id ASC
  LIMIT ${maxRows}
) AS t;
`,
      totalSql: `
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "totalEligibleRows"
  FROM surebet.worker_job_checkpoints AS checkpoints
  JOIN surebet.worker_jobs AS jobs
    ON jobs.job_id = checkpoints.job_id
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id = CONCAT(
        COALESCE(jobs.payload_json->>'runtimeId', ''),
        ':',
        COALESCE(jobs.payload_json->>'cycleId', '')
      )
  WHERE checkpoints.recorded_at < ${quoteTimestamp(cutoff)}
    AND ledger.ledger_entry_id IS NULL
) AS t;
`,
    });
  }
  if (scope === 'worker_job_dead_letters') {
    return Object.freeze({
      candidateSql: `
SELECT row_to_json(t)::text
FROM (
  SELECT
    json_build_object('jobId', dead_letters.job_id) AS "primaryKey",
    to_char(dead_letters.inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt"
  FROM surebet.worker_job_dead_letters AS dead_letters
  JOIN surebet.worker_jobs AS jobs
    ON jobs.job_id = dead_letters.job_id
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id = CONCAT(
        COALESCE(jobs.payload_json->>'runtimeId', ''),
        ':',
        COALESCE(jobs.payload_json->>'cycleId', '')
      )
  WHERE dead_letters.inserted_at < ${quoteTimestamp(cutoff)}
    AND ledger.ledger_entry_id IS NULL
  ORDER BY dead_letters.inserted_at ASC, dead_letters.job_id ASC
  LIMIT ${maxRows}
) AS t;
`,
      totalSql: `
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "totalEligibleRows"
  FROM surebet.worker_job_dead_letters AS dead_letters
  JOIN surebet.worker_jobs AS jobs
    ON jobs.job_id = dead_letters.job_id
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id = CONCAT(
        COALESCE(jobs.payload_json->>'runtimeId', ''),
        ':',
        COALESCE(jobs.payload_json->>'cycleId', '')
      )
  WHERE dead_letters.inserted_at < ${quoteTimestamp(cutoff)}
    AND ledger.ledger_entry_id IS NULL
) AS t;
`,
    });
  }
  if (scope === 'scheduler_checkpoints') {
    return Object.freeze({
      candidateSql: `
WITH ranked AS (
  SELECT
    checkpoints.scheduler_checkpoint_id,
    checkpoints.runtime_id,
    checkpoints.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY checkpoints.queue_name
      ORDER BY checkpoints.updated_at DESC, checkpoints.scheduler_checkpoint_id DESC
    ) AS queue_rank
  FROM surebet.private_paper_runtime_scheduler_checkpoints AS checkpoints
)
SELECT row_to_json(t)::text
FROM (
  SELECT
    json_build_object('schedulerCheckpointId', ranked.scheduler_checkpoint_id) AS "primaryKey",
    to_char(ranked.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt"
  FROM ranked
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id LIKE ranked.runtime_id || ':%'
  WHERE ranked.updated_at < ${quoteTimestamp(cutoff)}
    AND ranked.queue_rank > 1
    AND ledger.ledger_entry_id IS NULL
  ORDER BY ranked.updated_at ASC, ranked.scheduler_checkpoint_id ASC
  LIMIT ${maxRows}
) AS t;
`,
      totalSql: `
WITH ranked AS (
  SELECT
    checkpoints.scheduler_checkpoint_id,
    checkpoints.runtime_id,
    checkpoints.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY checkpoints.queue_name
      ORDER BY checkpoints.updated_at DESC, checkpoints.scheduler_checkpoint_id DESC
    ) AS queue_rank
  FROM surebet.private_paper_runtime_scheduler_checkpoints AS checkpoints
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "totalEligibleRows"
  FROM ranked
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id LIKE ranked.runtime_id || ':%'
  WHERE ranked.updated_at < ${quoteTimestamp(cutoff)}
    AND ranked.queue_rank > 1
    AND ledger.ledger_entry_id IS NULL
) AS t;
`,
    });
  }
  if (scope === 'upstream_api_checkpoints') {
    return Object.freeze({
      candidateSql: `
WITH ranked AS (
  SELECT
    checkpoints.checkpoint_id,
    checkpoints.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY checkpoints.api_base_url
      ORDER BY checkpoints.updated_at DESC, checkpoints.checkpoint_id DESC
    ) AS api_rank
  FROM surebet.upstream_api_convergence_checkpoints AS checkpoints
)
SELECT row_to_json(t)::text
FROM (
  SELECT
    json_build_object('checkpointId', ranked.checkpoint_id) AS "primaryKey",
    to_char(ranked.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt"
  FROM ranked
  LEFT JOIN surebet.private_paper_runtime_scheduler_checkpoints AS scheduler
    ON scheduler.upstream_checkpoint_id = ranked.checkpoint_id
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id LIKE scheduler.runtime_id || ':%'
  WHERE ranked.updated_at < ${quoteTimestamp(cutoff)}
    AND ranked.api_rank > 1
    AND ledger.ledger_entry_id IS NULL
  ORDER BY ranked.updated_at ASC, ranked.checkpoint_id ASC
  LIMIT ${maxRows}
) AS t;
`,
      totalSql: `
WITH ranked AS (
  SELECT
    checkpoints.checkpoint_id,
    checkpoints.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY checkpoints.api_base_url
      ORDER BY checkpoints.updated_at DESC, checkpoints.checkpoint_id DESC
    ) AS api_rank
  FROM surebet.upstream_api_convergence_checkpoints AS checkpoints
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "totalEligibleRows"
  FROM ranked
  LEFT JOIN surebet.private_paper_runtime_scheduler_checkpoints AS scheduler
    ON scheduler.upstream_checkpoint_id = ranked.checkpoint_id
  LEFT JOIN surebet.strategy_ledger_entries AS ledger
    ON ledger.run_kind = 'private_paper_runtime_cycle'
   AND ledger.acceptance_state = 'accepted_local_evidence'
   AND ledger.run_reference_id LIKE scheduler.runtime_id || ':%'
  WHERE ranked.updated_at < ${quoteTimestamp(cutoff)}
    AND ranked.api_rank > 1
    AND ledger.ledger_entry_id IS NULL
) AS t;
`,
    });
  }
  return Object.freeze({
    candidateSql: `
WITH ranked AS (
  SELECT
    checkpoints.checkpoint_id,
    checkpoints.updated_at,
    ROW_NUMBER() OVER (
      ORDER BY checkpoints.updated_at DESC, checkpoints.checkpoint_id DESC
    ) AS export_rank
  FROM surebet.upstream_export_convergence_checkpoints AS checkpoints
)
SELECT row_to_json(t)::text
FROM (
  SELECT
    json_build_object('checkpointId', ranked.checkpoint_id) AS "primaryKey",
    to_char(ranked.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "recordedAt"
  FROM ranked
  WHERE ranked.updated_at < ${quoteTimestamp(cutoff)}
    AND ranked.export_rank > 1
  ORDER BY ranked.updated_at ASC, ranked.checkpoint_id ASC
  LIMIT ${maxRows}
) AS t;
`,
    totalSql: `
WITH ranked AS (
  SELECT
    checkpoints.checkpoint_id,
    checkpoints.updated_at,
    ROW_NUMBER() OVER (
      ORDER BY checkpoints.updated_at DESC, checkpoints.checkpoint_id DESC
    ) AS export_rank
  FROM surebet.upstream_export_convergence_checkpoints AS checkpoints
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "totalEligibleRows"
  FROM ranked
  WHERE ranked.updated_at < ${quoteTimestamp(cutoff)}
    AND ranked.export_rank > 1
) AS t;
`,
  });
}

function buildRetentionDeleteSql(scope: BwsRetentionScope, candidates: readonly RetentionCandidate[]): string {
  const valuesSql = candidates
    .map((candidate) => buildRetentionCandidateValue(scope, candidate))
    .join(',\n');
  if (scope === 'import_runs') {
    return `
WITH candidates(import_run_id) AS (
  VALUES
  ${valuesSql}
),
deleted AS (
  DELETE FROM surebet.import_runs AS runs
  USING candidates
  WHERE runs.import_run_id = candidates.import_run_id
  RETURNING runs.import_run_id
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "deletedCount"
  FROM deleted
) AS t;
`;
  }
  if (scope === 'worker_job_checkpoints') {
    return `
WITH candidates(job_id, checkpoint_id) AS (
  VALUES
  ${valuesSql}
),
deleted AS (
  DELETE FROM surebet.worker_job_checkpoints AS checkpoints
  USING candidates
  WHERE checkpoints.job_id = candidates.job_id
    AND checkpoints.checkpoint_id = candidates.checkpoint_id
  RETURNING checkpoints.job_id
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "deletedCount"
  FROM deleted
) AS t;
`;
  }
  if (scope === 'worker_job_dead_letters') {
    return `
WITH candidates(job_id) AS (
  VALUES
  ${valuesSql}
),
deleted AS (
  DELETE FROM surebet.worker_job_dead_letters AS dead_letters
  USING candidates
  WHERE dead_letters.job_id = candidates.job_id
  RETURNING dead_letters.job_id
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "deletedCount"
  FROM deleted
) AS t;
`;
  }
  if (scope === 'scheduler_checkpoints') {
    return `
WITH candidates(scheduler_checkpoint_id) AS (
  VALUES
  ${valuesSql}
),
deleted AS (
  DELETE FROM surebet.private_paper_runtime_scheduler_checkpoints AS checkpoints
  USING candidates
  WHERE checkpoints.scheduler_checkpoint_id = candidates.scheduler_checkpoint_id
  RETURNING checkpoints.scheduler_checkpoint_id
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "deletedCount"
  FROM deleted
) AS t;
`;
  }
  return `
WITH candidates(checkpoint_id) AS (
  VALUES
  ${valuesSql}
),
deleted AS (
  DELETE FROM surebet.${scope === 'upstream_api_checkpoints' ? 'upstream_api_convergence_checkpoints' : 'upstream_export_convergence_checkpoints'} AS checkpoints
  USING candidates
  WHERE checkpoints.checkpoint_id = candidates.checkpoint_id
  RETURNING checkpoints.checkpoint_id
)
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "deletedCount"
  FROM deleted
) AS t;
`;
}

function buildRetentionCandidateValue(scope: BwsRetentionScope, candidate: RetentionCandidate): string {
  if (scope === 'import_runs') {
    return `(${quoteString(candidate.primaryKey['importRunId'])})`;
  }
  if (scope === 'worker_job_checkpoints') {
    return `(${quoteString(candidate.primaryKey['jobId'])}, ${quoteString(candidate.primaryKey['checkpointId'])})`;
  }
  if (scope === 'worker_job_dead_letters') {
    return `(${quoteString(candidate.primaryKey['jobId'])})`;
  }
  if (scope === 'scheduler_checkpoints') {
    return `(${quoteString(candidate.primaryKey['schedulerCheckpointId'])})`;
  }
  return `(${quoteString(candidate.primaryKey['checkpointId'])})`;
}

function normalizeRetentionCandidate(row: RetentionCandidateRow): RetentionCandidate {
  const keys = Object.entries(row.primaryKey)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, requireNonEmptyString(value, key)] as const);
  return Object.freeze({
    primaryKey: Object.freeze(Object.fromEntries(keys)),
    recordedAt: requireIsoTimestamp(row.recordedAt, 'recordedAt'),
  });
}

function computeRetentionPlanFingerprint(
  scope: BwsRetentionScope,
  cutoff: string,
  maxRows: number,
  candidates: readonly RetentionCandidate[],
): string {
  const candidatePayload = candidates.map((candidate) =>
    Object.freeze({
      primaryKey: Object.freeze({ ...candidate.primaryKey }),
      recordedAt: candidate.recordedAt,
    }),
  );
  return sha256Hex(
    stableJsonStringify(
      Object.freeze({
        candidates: Object.freeze(candidatePayload),
        cutoff,
        maxRows,
        scope,
      }) as unknown as import('../../../persistence/src/types.js').JsonValue,
    ),
  );
}

function readAndValidateBackupManifest(backupPath: string): BwsDatabaseBackupManifest {
  const manifestPath = join(backupPath, BACKUP_MANIFEST_FILE);
  const dumpPath = join(backupPath, BACKUP_DUMP_FILE);
  const shaPath = join(backupPath, BACKUP_SHA256_FILE);
  if (!existsSync(manifestPath) || !existsSync(dumpPath) || !existsSync(shaPath)) {
    throw new Error(`Backup path must contain ${BACKUP_MANIFEST_FILE}, ${BACKUP_DUMP_FILE}, and ${BACKUP_SHA256_FILE}.`);
  }
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Partial<BwsDatabaseBackupManifest>;
  if (parsed.schema !== BACKUP_MANIFEST_SCHEMA) {
    throw new Error(`Unexpected backup manifest schema in ${manifestPath}.`);
  }
  if (!Array.isArray(parsed.rowCounts)) {
    throw new Error(`Backup manifest ${manifestPath} must contain surebet table row counts.`);
  }
  return Object.freeze(parsed as BwsDatabaseBackupManifest);
}

function verifyBackupChecksums(backupPath: string): void {
  const checksums = readFileSync(join(backupPath, BACKUP_SHA256_FILE), 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const expected = new Map<string, string>();
  for (const line of checksums) {
    const match = /^([0-9a-f]{64})\s{2}(.+)$/.exec(line);
    if (match === null) {
      throw new Error(`Invalid checksum manifest line: ${line}`);
    }
    expected.set(match[2]!, match[1]!);
  }
  for (const fileName of [BACKUP_DUMP_FILE, BACKUP_MANIFEST_FILE] as const) {
    const digest = expected.get(fileName);
    if (digest === undefined) {
      throw new Error(`Checksum manifest is missing ${fileName}.`);
    }
    const actual = fileSha256(join(backupPath, fileName));
    if (actual !== digest) {
      throw new Error(`Checksum mismatch for ${fileName}.`);
    }
  }
}

function buildPendingMigrations(
  availableMigrations: readonly SurebetMigrationFile[],
  appliedMigrations: readonly AppliedSurebetMigration[],
): readonly SurebetMigrationFile[] {
  const applied = new Set(appliedMigrations.map((migration) => migration.migrationName));
  return Object.freeze(availableMigrations.filter((migration) => !applied.has(migration.migrationName)));
}

function buildMigrationChecksumMismatches(
  availableMigrations: readonly SurebetMigrationFile[],
  appliedMigrations: readonly AppliedSurebetMigration[],
): readonly MigrationChecksumMismatch[] {
  const expectedByName = new Map(availableMigrations.map((migration) => [migration.migrationName, migration.sha256] as const));
  const mismatches: MigrationChecksumMismatch[] = [];
  for (const appliedMigration of appliedMigrations) {
    const expectedSha256 = expectedByName.get(appliedMigration.migrationName);
    if (expectedSha256 === undefined) {
      continue;
    }
    if (expectedSha256 !== appliedMigration.sha256) {
      mismatches.push(
        Object.freeze({
          appliedSha256: appliedMigration.sha256,
          expectedSha256,
          migrationName: appliedMigration.migrationName,
        }),
      );
    }
  }
  return Object.freeze(mismatches);
}

function inspectSurebetOwnership(config: SurebetPersistenceConfig): BwsMigrationStatusResult['ownership'] {
  const schemaRow = queryPsqlJsonRows<{ readonly schemaExists: boolean }>(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'surebet'
  ) AS "schemaExists"
) AS t;
`,
  )[0];
  const countRow = queryPsqlJsonRows<DatabaseObjectCountRow>(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT COUNT(*)::int AS "objectCount"
  FROM pg_class AS objects
  JOIN pg_namespace AS namespaces
    ON namespaces.oid = objects.relnamespace
  WHERE namespaces.nspname = 'surebet'
    AND objects.relkind IN ('r', 'i', 'S', 'v', 'm')
) AS t;
`,
  )[0];
  return Object.freeze({
    migrationScope: 'surebet_only_verified',
    schema: 'surebet',
    schemaExists: schemaRow !== undefined && schemaRow.schemaExists === true,
    schemaOwnedObjectCount: countRow === undefined ? 0 : countRow.objectCount,
  });
}

function detectDrainRequirement(
  repositoryRoot: string,
  config: SurebetPersistenceConfig,
  pendingMigrationsExist: boolean,
): BwsMigrationStatusResult['drain'] {
  const stateFilePath = resolve(repositoryRoot, 'runtime/bws-operator-lifecycle/state.json');
  const reasons: string[] = [];
  let activeLifecycleDetected = false;
  if (existsSync(stateFilePath)) {
    const parsed = JSON.parse(readFileSync(stateFilePath, 'utf-8')) as {
      configuration?: {
        persistence?: {
          database?: string;
          host?: string;
          port?: number;
          socketDirectory?: string;
          user?: string;
        };
      };
    };
    const persistence = parsed.configuration === undefined ? undefined : parsed.configuration.persistence;
    if (
      persistence !== undefined
      && persistence.database === config.database
      && persistence.user === config.user
      && persistence.port === config.port
      && persistence.host === config.host
      && persistence.socketDirectory === config.socketDirectory
    ) {
      activeLifecycleDetected = true;
      reasons.push('A repo-owned full-stack lifecycle state file targets this surebet database.');
    }
  }
  if (pendingMigrationsExist) {
    reasons.push('Pending tracked surebet migrations require an explicit maintenance window or drain before apply.');
  }
  return Object.freeze({
    activeLifecycleDetected,
    reasons: Object.freeze(reasons),
    requiredForMigrationApply: activeLifecycleDetected || pendingMigrationsExist,
    stateFilePath,
  });
}

function queryDatabaseIdentity(config: SurebetPersistenceConfig): BwsDatabaseIdentity {
  const row = queryPsqlJsonRows<DatabaseIdentityRow>(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT
    current_database() AS "currentDatabase",
    current_user AS "currentUser",
    current_setting('server_version') AS "serverVersion",
    current_setting('server_version_num') AS "serverVersionNum"
) AS t;
`,
  )[0];
  if (row === undefined) {
    throw new Error('Failed to inspect the target surebet database identity.');
  }
  const connectionTarget = config.host === undefined
    ? requireNonEmptyString(config.socketDirectory, 'socketDirectory')
    : config.host;
  return Object.freeze({
    connectionTarget,
    currentDatabase: row.currentDatabase,
    currentUser: row.currentUser,
    requestedDatabase: config.database,
    requestedUser: config.user,
    serverVersion: row.serverVersion,
    serverVersionNum: row.serverVersionNum,
  });
}

function querySurebetTableCounts(config: SurebetPersistenceConfig): readonly BwsDatabaseTableCount[] {
  const tableRows = queryPsqlJsonRows<DatabaseTableRow>(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT tablename AS "tableName"
  FROM pg_tables
  WHERE schemaname = 'surebet'
  ORDER BY tablename ASC
) AS t;
`,
  );
  if (tableRows.length === 0) {
    return Object.freeze([]);
  }
  const countSql = tableRows
    .map((row) => {
      const tableName = quoteIdentifier(row.tableName);
      return `
SELECT row_to_json(t)::text
FROM (
  SELECT
    ${quoteString(row.tableName)} AS "tableName",
    COUNT(*)::int AS "rowCount"
  FROM surebet.${tableName}
) AS t`;
    })
    .join('\nUNION ALL\n');
  return Object.freeze(
    queryPsqlJsonRows<BwsDatabaseTableCount>(config, countSql).map((row) =>
      Object.freeze({
        rowCount: row.rowCount,
        tableName: row.tableName,
      }),
    ),
  );
}

async function verifyReadOnlyApiQueries(
  config: SurebetPersistenceConfig,
): Promise<readonly ApiVerificationResult[]> {
  const pinnedExportId = readSingleStringValue(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT export_id AS value
  FROM surebet.pinned_strategy_exports
  ORDER BY intake_record_id ASC
  LIMIT 1
) AS t;
`,
  );
  const acceptedBacktestLockId = readSingleStringValue(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT upstream_lock_record_id AS value
  FROM surebet.strategy_ledger_entries
  WHERE acceptance_state = 'accepted_local_evidence'
    AND run_kind = 'deterministic_standard_binary_backtest'
  ORDER BY ledger_entry_id ASC
  LIMIT 1
) AS t;
`,
  );
  const dependencies = createReadOnlyQueryDependencies(config);
  const serviceResult = createBwsReadOnlyQueryService(dependencies, {
    generatedAt: defaultNow,
    maxPageSize: 25,
  });
  if (!serviceResult.ok) {
    throw new Error(serviceResult.blockers[0]?.message ?? 'Failed to build the BWS read-only query service.');
  }
  const server = createServer(createBwsReadOnlyQueryHttpHandler(serviceResult.value));
  await listenLoopback(server);
  try {
    const baseUrl = `http://${LOOPBACK_HOST}:${getServerPort(server)}`;
    const pinnedResponse = await fetchJson<BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>>(
      pinnedExportId === undefined
        ? `${baseUrl}/api/read-only/pinned-strategy-exports?expand=provenance&pageSize=1&exportId=restore-verification-empty`
        : `${baseUrl}/api/read-only/pinned-strategy-exports?expand=provenance&pageSize=1&exportId=${encodeURIComponent(pinnedExportId)}`,
    );
    const strategyResponse = await fetchJson<BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>>(
      acceptedBacktestLockId === undefined
        ? `${baseUrl}/api/read-only/strategy-ledger?expand=provenance&pageSize=1&acceptanceState=accepted_local_evidence&runKind=deterministic_standard_binary_backtest`
        : `${baseUrl}/api/read-only/strategy-ledger?expand=provenance&pageSize=1&acceptanceState=accepted_local_evidence&upstreamLockRecordId=${encodeURIComponent(acceptedBacktestLockId)}`,
    );
    const runtimeResponse = await fetchJson<BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>>(
      `${baseUrl}/api/read-only/private-paper-runtime-cycles?expand=provenance&pageSize=1&acceptanceState=blocked`,
    );
    return Object.freeze([
      Object.freeze({
        resource: pinnedResponse.resource,
        returnedCount: pinnedResponse.page.returnedCount,
      }),
      Object.freeze({
        resource: strategyResponse.resource,
        returnedCount: strategyResponse.page.returnedCount,
      }),
      Object.freeze({
        resource: runtimeResponse.resource,
        returnedCount: runtimeResponse.page.returnedCount,
      }),
    ]);
  } finally {
    server.close();
    await waitForClose(server);
  }
}

function readSingleStringValue(
  config: SurebetPersistenceConfig,
  sql: string,
): string | undefined {
  const row = queryPsqlJsonRows<SingleValueRow>(config, sql)[0];
  return row === undefined ? undefined : row.value;
}

function createReadOnlyQueryDependencies(config: SurebetPersistenceConfig): BwsReadOnlyQueryDependencies {
  return Object.freeze({
    importRuns: new SurebetImportRunRepository(config),
    pinnedStrategyExports: new SurebetPinnedStrategyExportRepository(config),
    privatePaperSchedulerCheckpoints: new SurebetPrivatePaperRuntimeSchedulerCheckpointRepository(config),
    strategyLedger: new SurebetStrategyLedgerRepository(config),
    upstreamApiCheckpoints: new SurebetUpstreamApiConvergenceRepository(config),
    upstreamLocks: new SurebetUpstreamLockRepository(config),
    workerJobs: new SurebetWorkerJobRepository(config),
  } satisfies BwsReadOnlyQueryDependencies);
}

function assertRowCountsMatch(
  expectedRows: readonly BwsDatabaseTableCount[],
  restoredRows: readonly BwsDatabaseTableCount[],
): void {
  const actualByTable = new Map(restoredRows.map((row) => [row.tableName, row.rowCount] as const));
  for (const expectedRow of expectedRows) {
    const actual = actualByTable.get(expectedRow.tableName);
    if (actual !== expectedRow.rowCount) {
      throw new Error(
        `Restored table ${expectedRow.tableName} row count mismatch: expected ${expectedRow.rowCount}, received ${actual ?? 'missing'}.`,
      );
    }
  }
}

function buildDisposableRestoreDatabaseName(createdAt: string): string {
  const normalized = createdAt.replace(/[^0-9]/g, '');
  const rawName = `bws_restore_verify_${normalized}_${process.pid}`;
  return rawName.length <= MAX_DATABASE_NAME_BYTES
    ? rawName
    : rawName.slice(0, MAX_DATABASE_NAME_BYTES);
}

function createDisposableDatabase(
  adminConfig: SurebetPersistenceConfig,
  databaseName: string,
  runner: UtilityCommandRunner,
): void {
  runner(
    'createdb',
    Object.freeze([
      '-U',
      adminConfig.user,
      '-p',
      String(adminConfig.port),
      '-h',
      adminConfig.host === undefined
        ? requireNonEmptyString(adminConfig.socketDirectory, 'socketDirectory')
        : adminConfig.host,
      '--maintenance-db',
      adminConfig.database,
      databaseName,
    ]),
    adminConfig,
  );
}

function dropDisposableDatabase(
  adminConfig: SurebetPersistenceConfig,
  databaseName: string,
  runner: UtilityCommandRunner,
): void {
  runner(
    'dropdb',
    Object.freeze([
      '-U',
      adminConfig.user,
      '-p',
      String(adminConfig.port),
      '-h',
      adminConfig.host === undefined
        ? requireNonEmptyString(adminConfig.socketDirectory, 'socketDirectory')
        : adminConfig.host,
      '--maintenance-db',
      adminConfig.database,
      '--if-exists',
      databaseName,
    ]),
    adminConfig,
  );
}

function requireOutputPath(outputPath: string, repositoryRoot: string): string {
  const resolved = resolve(outputPath);
  const runtimeDirectory = resolve(repositoryRoot, 'runtime');
  const runtimeStateDirectory = resolve(repositoryRoot, 'runtime-state');
  if (resolved === runtimeDirectory || resolved.startsWith(`${runtimeDirectory}/`)) {
    throw new Error('Backup output path must stay outside transient runtime directories.');
  }
  if (resolved === runtimeStateDirectory || resolved.startsWith(`${runtimeStateDirectory}/`)) {
    throw new Error('Backup output path must stay outside transient runtime directories.');
  }
  const parentDirectory = dirname(resolved);
  if (!existsSync(parentDirectory) || !statSync(parentDirectory).isDirectory()) {
    throw new Error(`Backup output parent directory does not exist: ${parentDirectory}`);
  }
  return resolved;
}

function runUtilityCommand(
  command: string,
  args: readonly string[],
  config: SurebetPersistenceConfig,
  stdin?: string,
): string {
  const env = config.password === undefined
    ? process.env
    : { ...process.env, PGPASSWORD: config.password };
  try {
    return execFileSync(command, [...args], {
      encoding: 'utf-8',
      env,
      input: stdin,
      stdio: 'pipe',
    });
  } catch (error) {
    const message = error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
      ? error.stderr.trim()
      : error instanceof Error
        ? error.message
        : String(error);
    throw new Error(`${command} failed: ${message}`);
  }
}

function buildPgUtilityConnectionArgs(config: SurebetPersistenceConfig): readonly string[] {
  return Object.freeze([
    '-d',
    config.database,
    '-U',
    config.user,
    '-p',
    String(config.port),
    '-h',
    config.host === undefined
      ? requireNonEmptyString(config.socketDirectory, 'socketDirectory')
      : config.host,
  ]);
}

function toMigrationDescriptor(migration: SurebetMigrationFile): Readonly<{
  readonly migrationName: string;
  readonly path: string;
  readonly sha256: string;
}> {
  return Object.freeze({
    migrationName: migration.migrationName,
    path: migration.path,
    sha256: migration.sha256,
  });
}

function writeJsonFile(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function fileSha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteString(value: string | undefined): string {
  if (value === undefined) {
    throw new Error('Unexpected missing SQL string literal value.');
  }
  return `'${value.replaceAll("'", "''")}'`;
}

function quoteTimestamp(value: string): string {
  requireIsoTimestamp(value, 'timestamp');
  return `${quoteString(value)}::timestamptz`;
}

function requireIsoTimestamp(value: string, field: string): string {
  if (!ISO_8601_UTC_MILLISECONDS.test(value)) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp.`);
  }
  return value;
}

function requireNonEmptyString(value: string | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

async function listenLoopback(server: Server): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, LOOPBACK_HOST, () => {
      server.off('error', rejectPromise);
      resolvePromise();
    });
  });
}

async function waitForClose(server: Server): Promise<void> {
  if (!server.listening) {
    return;
  }
  await new Promise<void>((resolvePromise) => {
    server.once('close', () => resolvePromise());
  });
}

function getServerPort(server: Server): number {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected a loopback server address.');
  }
  return address.port;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Read-only API query failed for ${url}: ${response.status} ${bodyText}`);
  }
  return JSON.parse(bodyText) as T;
}

function defaultNow(): string {
  return new Date().toISOString();
}

export function listSupportedRetentionScopes(): readonly BwsRetentionScope[] {
  return DEFAULT_RETENTION_SCOPES;
}
