import { SurebetPersistenceError } from '../errors.js';
import { executePsqlCommand, queryPsqlJsonRows, quoteSqlLiteral, stableJsonStringify, toJsonLiteral } from '../psql.js';
import type { JsonValue, SurebetPersistenceConfig } from '../types.js';
import type {
  B1CrossVenueBacktestCandidateResult,
  B1CrossVenueBacktestRun,
} from '../../../bootstrap/src/backtest/b1-cross-venue-backtest.js';
import type { B1BacktestReportCandidateSummary } from '../../../bootstrap/src/reporting/b1-backtest-report.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256_REGEX = /^[0-9a-f]{64}$/;

export interface SurebetB1BacktestRunCreateRecord {
  readonly runId: string;
  readonly upstreamCheckpointId?: string;
  readonly run: B1CrossVenueBacktestRun;
  readonly observedAt: string;
}

export interface SurebetB1BacktestRunRecord {
  readonly runId: string;
  readonly upstreamCheckpointId?: string;
  readonly runKind: 'deterministic_b1_cross_venue_offline_backtest';
  readonly runHash: string;
  readonly sourceManifestHash: string;
  readonly upstreamLockFingerprint: string;
  readonly fixtureKind: 'deterministic_b1_multi_venue_fixture';
  readonly runtimeEvidence: false;
  readonly upstreamReadiness: 'blocked_until_betting_win_b1_multi_venue_markets_v1';
  readonly offlineFalsificationStatus:
    | 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED'
    | 'B1_FALSIFIED_NET_EDGE_DISAPPEARED'
    | 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT';
  readonly metrics: JsonValue;
  readonly report: JsonValue;
  readonly executable: false;
  readonly liveReadiness: 'not_authorized_bws_900_parked';
  readonly observedAt: string;
  readonly insertedAt: string;
}

export interface SurebetB1BacktestRunListFilters {
  readonly runId?: string;
  readonly upstreamCheckpointId?: string;
  readonly offlineFalsificationStatus?: SurebetB1BacktestRunRecord['offlineFalsificationStatus'];
  readonly sourceManifestHash?: string;
  readonly upstreamLockFingerprint?: string;
}

export interface SurebetB1BacktestRunListRequest {
  readonly afterRunId?: string;
  readonly filters: SurebetB1BacktestRunListFilters;
  readonly limit: number;
}

export interface SurebetB1CandidateSnapshotRecord {
  readonly candidateSnapshotId: string;
  readonly runId: string;
  readonly candidateId: string;
  readonly status: 'accepted' | 'blocked';
  readonly stage: B1BacktestReportCandidateSummary['stage'];
  readonly marketEquivalenceKey?: string;
  readonly venuePairKey?: string;
  readonly grossSpreadPpm?: string;
  readonly netSpreadPpm?: string;
  readonly worstCaseNetMinor?: string;
  readonly blockers: JsonValue;
  readonly candidate: JsonValue;
  readonly insertedAt: string;
}

export interface SurebetB1SimulationResultRecord {
  readonly simulationResultId: string;
  readonly runId: string;
  readonly candidateId: string;
  readonly simulationKind: 'fill_rejection_timeout' | 'residual_exposure' | 'settlement_replay' | 'false_positive';
  readonly status: 'accepted' | 'blocked';
  readonly result: JsonValue;
  readonly blockers: JsonValue;
  readonly falsePositive?: boolean;
  readonly residualExposureMinor?: string;
  readonly settledNetMinor?: string;
  readonly insertedAt: string;
}

interface RawB1BacktestRunRow extends Omit<SurebetB1BacktestRunRecord, 'upstreamCheckpointId'> {
  readonly upstreamCheckpointId: string | null;
}

interface RawB1CandidateSnapshotRow extends Omit<
  SurebetB1CandidateSnapshotRecord,
  'marketEquivalenceKey' | 'venuePairKey' | 'grossSpreadPpm' | 'netSpreadPpm' | 'worstCaseNetMinor'
> {
  readonly marketEquivalenceKey: string | null;
  readonly venuePairKey: string | null;
  readonly grossSpreadPpm: string | null;
  readonly netSpreadPpm: string | null;
  readonly worstCaseNetMinor: string | null;
}

interface RawB1SimulationResultRow extends Omit<
  SurebetB1SimulationResultRecord,
  'falsePositive' | 'residualExposureMinor' | 'settledNetMinor'
> {
  readonly falsePositive: boolean | null;
  readonly residualExposureMinor: string | null;
  readonly settledNetMinor: string | null;
}

export class SurebetB1BacktestRunRepository {
  readonly #config: SurebetPersistenceConfig;

  constructor(config: SurebetPersistenceConfig) {
    this.#config = config;
  }

  create(record: SurebetB1BacktestRunCreateRecord): SurebetB1BacktestRunRecord {
    validateCreateRecord(record);
    const existing = this.get(record.runId);
    if (existing !== undefined) {
      if (existing.runHash !== record.run.report.runHash) {
        throw new SurebetPersistenceError(
          'SUREBET_B1_BACKTEST_RUN_CONFLICT',
          `B1 backtest run ${record.runId} already exists with a different run hash.`,
        );
      }
      return existing;
    }

    const serializableReport = toJsonValue(record.run.report);
    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.b1_backtest_runs (
  run_id,
  upstream_checkpoint_id,
  run_kind,
  run_hash,
  source_manifest_hash,
  upstream_lock_fingerprint,
  fixture_kind,
  runtime_evidence,
  upstream_readiness,
  offline_falsification_status,
  metrics_json,
  report_json,
  executable,
  live_readiness,
  observed_at
)
VALUES (
  ${quoteSqlLiteral(record.runId)},
  ${optionalText(record.upstreamCheckpointId)},
  ${quoteSqlLiteral(record.run.runKind)},
  ${quoteSqlLiteral(record.run.report.runHash)},
  ${quoteSqlLiteral(record.run.report.sourceManifestHash)},
  ${quoteSqlLiteral(record.run.report.upstreamLockFingerprint)},
  ${quoteSqlLiteral(record.run.report.fixtureKind)},
  false,
  ${quoteSqlLiteral(record.run.report.upstreamReadiness)},
  ${quoteSqlLiteral(record.run.report.offlineFalsificationStatus)},
  ${toJsonLiteral(toJsonValue(record.run.report.metrics))},
  ${toJsonLiteral(serializableReport)},
  false,
  ${quoteSqlLiteral(record.run.liveReadiness)},
  ${quoteSqlLiteral(record.observedAt)}::timestamptz
);
`,
    );

    for (const candidate of record.run.candidateResults) {
      this.createCandidateSnapshot(record.runId, candidate);
      this.createSimulationResults(record.runId, candidate);
    }

    return this.require(record.runId);
  }

  get(runId: string): SurebetB1BacktestRunRecord | undefined {
    const rows = queryPsqlJsonRows<RawB1BacktestRunRow>(
      this.#config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    run_id AS "runId",
    upstream_checkpoint_id AS "upstreamCheckpointId",
    run_kind AS "runKind",
    run_hash AS "runHash",
    source_manifest_hash AS "sourceManifestHash",
    upstream_lock_fingerprint AS "upstreamLockFingerprint",
    fixture_kind AS "fixtureKind",
    runtime_evidence AS "runtimeEvidence",
    upstream_readiness AS "upstreamReadiness",
    offline_falsification_status AS "offlineFalsificationStatus",
    metrics_json AS metrics,
    report_json AS report,
    executable,
    live_readiness AS "liveReadiness",
    to_char(observed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "observedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.b1_backtest_runs
  WHERE run_id = ${quoteSqlLiteral(requireNonEmptyString(runId, 'runId'))}
) AS t;
`,
    );
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    return normalizeRunRow(row);
  }

  list(request: SurebetB1BacktestRunListRequest): readonly SurebetB1BacktestRunRecord[] {
    validateListRequest(request);
    const conditions: string[] = [];
    if (request.afterRunId !== undefined) {
      conditions.push(`run_id > ${quoteSqlLiteral(requireNonEmptyString(request.afterRunId, 'afterRunId'))}`);
    }
    if (request.filters.runId !== undefined) {
      conditions.push(`run_id = ${quoteSqlLiteral(requireNonEmptyString(request.filters.runId, 'filters.runId'))}`);
    }
    if (request.filters.upstreamCheckpointId !== undefined) {
      conditions.push(
        `upstream_checkpoint_id = ${quoteSqlLiteral(requireNonEmptyString(request.filters.upstreamCheckpointId, 'filters.upstreamCheckpointId'))}`,
      );
    }
    if (request.filters.offlineFalsificationStatus !== undefined) {
      conditions.push(
        `offline_falsification_status = ${quoteSqlLiteral(request.filters.offlineFalsificationStatus)}`,
      );
    }
    if (request.filters.sourceManifestHash !== undefined) {
      requireSha256(request.filters.sourceManifestHash, 'filters.sourceManifestHash');
      conditions.push(`source_manifest_hash = ${quoteSqlLiteral(request.filters.sourceManifestHash)}`);
    }
    if (request.filters.upstreamLockFingerprint !== undefined) {
      requireSha256(request.filters.upstreamLockFingerprint, 'filters.upstreamLockFingerprint');
      conditions.push(`upstream_lock_fingerprint = ${quoteSqlLiteral(request.filters.upstreamLockFingerprint)}`);
    }
    const whereClause = conditions.length === 0 ? '' : `WHERE ${conditions.join('\n    AND ')}`;
    return Object.freeze(
      queryPsqlJsonRows<RawB1BacktestRunRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    run_id AS "runId",
    upstream_checkpoint_id AS "upstreamCheckpointId",
    run_kind AS "runKind",
    run_hash AS "runHash",
    source_manifest_hash AS "sourceManifestHash",
    upstream_lock_fingerprint AS "upstreamLockFingerprint",
    fixture_kind AS "fixtureKind",
    runtime_evidence AS "runtimeEvidence",
    upstream_readiness AS "upstreamReadiness",
    offline_falsification_status AS "offlineFalsificationStatus",
    metrics_json AS metrics,
    report_json AS report,
    executable,
    live_readiness AS "liveReadiness",
    to_char(observed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "observedAt",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.b1_backtest_runs
  ${whereClause}
  ORDER BY run_id
  LIMIT ${request.limit}
) AS t;
`,
      ).map((row) => normalizeRunRow(row)),
    );
  }

  listCandidates(runId: string): readonly SurebetB1CandidateSnapshotRecord[] {
    return Object.freeze(
      queryPsqlJsonRows<RawB1CandidateSnapshotRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    candidate_snapshot_id AS "candidateSnapshotId",
    run_id AS "runId",
    candidate_id AS "candidateId",
    status,
    stage,
    market_equivalence_key AS "marketEquivalenceKey",
    venue_pair_key AS "venuePairKey",
    gross_spread_ppm::text AS "grossSpreadPpm",
    net_spread_ppm::text AS "netSpreadPpm",
    worst_case_net_minor::text AS "worstCaseNetMinor",
    blockers_json AS blockers,
    candidate_json AS candidate,
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.b1_candidate_snapshots
  WHERE run_id = ${quoteSqlLiteral(requireNonEmptyString(runId, 'runId'))}
  ORDER BY candidate_id
) AS t;
`,
      ).map((row) => normalizeCandidateRow(row)),
    );
  }

  listSimulationResults(runId: string): readonly SurebetB1SimulationResultRecord[] {
    return Object.freeze(
      queryPsqlJsonRows<RawB1SimulationResultRow>(
        this.#config,
        `
SELECT row_to_json(t)::text
FROM (
  SELECT
    simulation_result_id AS "simulationResultId",
    run_id AS "runId",
    candidate_id AS "candidateId",
    simulation_kind AS "simulationKind",
    status,
    result_json AS result,
    blockers_json AS blockers,
    false_positive AS "falsePositive",
    residual_exposure_minor::text AS "residualExposureMinor",
    settled_net_minor::text AS "settledNetMinor",
    to_char(inserted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "insertedAt"
  FROM surebet.b1_simulation_results
  WHERE run_id = ${quoteSqlLiteral(requireNonEmptyString(runId, 'runId'))}
  ORDER BY candidate_id, simulation_kind
) AS t;
`,
      ).map((row) => normalizeSimulationRow(row)),
    );
  }

  require(runId: string): SurebetB1BacktestRunRecord {
    const record = this.get(runId);
    if (record === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_B1_BACKTEST_RUN_NOT_FOUND',
        `B1 backtest run ${runId} does not exist.`,
      );
    }
    return record;
  }

  private createCandidateSnapshot(runId: string, candidate: B1CrossVenueBacktestCandidateResult): void {
    const candidateJson = toJsonValue(candidate);
    const summary = toCandidateSummary(candidate);
    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.b1_candidate_snapshots (
  candidate_snapshot_id,
  run_id,
  candidate_id,
  status,
  stage,
  market_equivalence_key,
  venue_pair_key,
  gross_spread_ppm,
  net_spread_ppm,
  worst_case_net_minor,
  blockers_json,
  candidate_json
)
VALUES (
  ${quoteSqlLiteral(`${runId}:${candidate.candidateId}`)},
  ${quoteSqlLiteral(runId)},
  ${quoteSqlLiteral(candidate.candidateId)},
  ${quoteSqlLiteral(summary.status)},
  ${quoteSqlLiteral(summary.stage)},
  ${optionalText(summary.marketEquivalenceKey)},
  ${optionalText(summary.venuePairKey)},
  ${optionalBigInt(summary.grossSpreadPpm)},
  ${optionalBigInt(summary.netSpreadPpm)},
  ${optionalBigInt(summary.worstCaseNetMinor)},
  ${toJsonLiteral(toJsonValue(summary.blockers ?? []))},
  ${toJsonLiteral(candidateJson)}
);
`,
    );
  }

  private createSimulationResults(runId: string, candidate: B1CrossVenueBacktestCandidateResult): void {
    if (!candidate.ok) {
      this.insertSimulationResult(runId, candidate.candidateId, 'false_positive', 'blocked', candidate, candidate.blockers);
      return;
    }
    this.insertSimulationResult(
      runId,
      candidate.candidateId,
      'fill_rejection_timeout',
      'accepted',
      candidate.fillabilitySimulation,
      [],
    );
    this.insertSimulationResult(
      runId,
      candidate.candidateId,
      'residual_exposure',
      'accepted',
      candidate.fillabilitySimulation,
      [],
    );
    this.insertSimulationResult(
      runId,
      candidate.candidateId,
      'settlement_replay',
      'accepted',
      candidate.settlementReplay,
      [],
      candidate.settlementReplay.falsePositive,
      candidate.fillabilitySimulation.residualExposure?.worstCaseNetMinor,
      candidate.settlementReplay.settledNetMinor,
    );
    this.insertSimulationResult(
      runId,
      candidate.candidateId,
      'false_positive',
      'accepted',
      { falsePositive: candidate.settlementReplay.falsePositive },
      [],
      candidate.settlementReplay.falsePositive,
    );
  }

  private insertSimulationResult(
    runId: string,
    candidateId: string,
    simulationKind: SurebetB1SimulationResultRecord['simulationKind'],
    status: SurebetB1SimulationResultRecord['status'],
    result: unknown,
    blockers: unknown,
    falsePositive?: boolean,
    residualExposureMinor?: bigint,
    settledNetMinor?: bigint,
  ): void {
    executePsqlCommand(
      this.#config,
      `
INSERT INTO surebet.b1_simulation_results (
  simulation_result_id,
  run_id,
  candidate_id,
  simulation_kind,
  status,
  result_json,
  blockers_json,
  false_positive,
  residual_exposure_minor,
  settled_net_minor
)
VALUES (
  ${quoteSqlLiteral(`${runId}:${candidateId}:${simulationKind}`)},
  ${quoteSqlLiteral(runId)},
  ${quoteSqlLiteral(candidateId)},
  ${quoteSqlLiteral(simulationKind)},
  ${quoteSqlLiteral(status)},
  ${toJsonLiteral(toJsonValue(result))},
  ${toJsonLiteral(toJsonValue(blockers))},
  ${optionalBoolean(falsePositive)},
  ${optionalBigInt(residualExposureMinor)},
  ${optionalBigInt(settledNetMinor)}
);
`,
    );
  }
}

function validateCreateRecord(record: SurebetB1BacktestRunCreateRecord): void {
  requireNonEmptyString(record.runId, 'runId');
  if (record.upstreamCheckpointId !== undefined) {
    requireNonEmptyString(record.upstreamCheckpointId, 'upstreamCheckpointId');
  }
  requireIsoTimestamp(record.observedAt, 'observedAt');
  if (record.run.runKind !== 'deterministic_b1_cross_venue_offline_backtest') {
    throw new SurebetPersistenceError('SUREBET_B1_BACKTEST_RUN_KIND_INVALID', 'B1 backtest runs require the deterministic offline kind.');
  }
  if (record.run.executable !== false || record.run.report.executable !== false) {
    throw new SurebetPersistenceError('SUREBET_B1_EXECUTION_FORBIDDEN', 'B1 backtest persistence requires executable=false.');
  }
  if (record.run.liveReadiness !== 'not_authorized_bws_900_parked' || record.run.report.liveReadiness !== 'not_authorized_bws_900_parked') {
    throw new SurebetPersistenceError('SUREBET_B1_LIVE_READINESS_FORBIDDEN', 'B1 backtest persistence must preserve BWS-900 parked readiness.');
  }
  if (record.run.report.runtimeEvidence !== false) {
    throw new SurebetPersistenceError('SUREBET_B1_RUNTIME_EVIDENCE_FORBIDDEN', 'B1 backtest persistence must not claim runtime evidence.');
  }
  requireSha256(record.run.report.runHash, 'run.report.runHash');
  requireSha256(record.run.report.sourceManifestHash, 'run.report.sourceManifestHash');
  requireSha256(record.run.report.upstreamLockFingerprint, 'run.report.upstreamLockFingerprint');
}

function validateListRequest(request: SurebetB1BacktestRunListRequest): void {
  if (!Number.isInteger(request.limit) || request.limit <= 0) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_LIMIT_INVALID',
      'B1 backtest run list requests require an explicit positive limit.',
    );
  }
  if (request.afterRunId !== undefined) {
    requireNonEmptyString(request.afterRunId, 'afterRunId');
  }
  if (request.filters.runId !== undefined) {
    requireNonEmptyString(request.filters.runId, 'filters.runId');
  }
  if (request.filters.upstreamCheckpointId !== undefined) {
    requireNonEmptyString(request.filters.upstreamCheckpointId, 'filters.upstreamCheckpointId');
  }
  if (
    request.filters.offlineFalsificationStatus !== undefined
    && request.filters.offlineFalsificationStatus !== 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED'
    && request.filters.offlineFalsificationStatus !== 'B1_FALSIFIED_NET_EDGE_DISAPPEARED'
    && request.filters.offlineFalsificationStatus !== 'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT'
  ) {
    throw new SurebetPersistenceError(
      'SUREBET_B1_OFFLINE_FALSIFICATION_STATUS_INVALID',
      'B1 backtest run list filters require a supported offline falsification status.',
    );
  }
  if (request.filters.sourceManifestHash !== undefined) {
    requireSha256(request.filters.sourceManifestHash, 'filters.sourceManifestHash');
  }
  if (request.filters.upstreamLockFingerprint !== undefined) {
    requireSha256(request.filters.upstreamLockFingerprint, 'filters.upstreamLockFingerprint');
  }
}

function toCandidateSummary(candidate: B1CrossVenueBacktestCandidateResult): B1BacktestReportCandidateSummary {
  if (!candidate.ok) {
    const summary: {
      blockers: NonNullable<B1BacktestReportCandidateSummary['blockers']>;
      candidateId: string;
      grossSpreadPpm?: bigint;
      marketEquivalenceKey?: string;
      stage: B1BacktestReportCandidateSummary['stage'];
      status: 'blocked';
      venuePairKey?: string;
    } = {
      blockers: candidate.blockers,
      candidateId: candidate.candidateId,
      stage: candidate.stage,
      status: 'blocked',
    };
    if (candidate.grossCandidate !== undefined) {
      summary.marketEquivalenceKey = candidate.grossCandidate.marketEquivalenceKey;
      summary.venuePairKey = candidate.grossCandidate.venuePairKey;
      if (candidate.grossCandidate.ok) {
        summary.grossSpreadPpm = candidate.grossCandidate.grossSpreadPpm;
      }
    }
    return Object.freeze(summary);
  }
  return Object.freeze({
    candidateId: candidate.candidateId,
    falsePositive: candidate.settlementReplay.falsePositive,
    grossSpreadPpm: candidate.grossCandidate.grossSpreadPpm,
    marketEquivalenceKey: candidate.grossCandidate.marketEquivalenceKey,
    netSpreadPpm: candidate.netCandidate.netSpreadPpm,
    settledNetMinor: candidate.settlementReplay.settledNetMinor,
    stage: 'accepted',
    status: 'accepted',
    venuePairKey: candidate.grossCandidate.venuePairKey,
    worstCaseNetMinor: candidate.netCandidate.worstCaseNetMinor,
  });
}

function normalizeRunRow(row: RawB1BacktestRunRow): SurebetB1BacktestRunRecord {
  const { upstreamCheckpointId, ...required } = row;
  return Object.freeze({
    ...required,
    ...(upstreamCheckpointId === null ? {} : { upstreamCheckpointId }),
  });
}

function normalizeCandidateRow(row: RawB1CandidateSnapshotRow): SurebetB1CandidateSnapshotRecord {
  const {
    grossSpreadPpm,
    marketEquivalenceKey,
    netSpreadPpm,
    venuePairKey,
    worstCaseNetMinor,
    ...required
  } = row;
  return Object.freeze({
    ...required,
    ...(marketEquivalenceKey === null ? {} : { marketEquivalenceKey }),
    ...(venuePairKey === null ? {} : { venuePairKey }),
    ...(grossSpreadPpm === null ? {} : { grossSpreadPpm }),
    ...(netSpreadPpm === null ? {} : { netSpreadPpm }),
    ...(worstCaseNetMinor === null ? {} : { worstCaseNetMinor }),
  });
}

function normalizeSimulationRow(row: RawB1SimulationResultRow): SurebetB1SimulationResultRecord {
  const { falsePositive, residualExposureMinor, settledNetMinor, ...required } = row;
  return Object.freeze({
    ...required,
    ...(falsePositive === null ? {} : { falsePositive }),
    ...(residualExposureMinor === null ? {} : { residualExposureMinor }),
    ...(settledNetMinor === null ? {} : { settledNetMinor }),
  });
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new SurebetPersistenceError('SUREBET_B1_JSON_INVALID', 'B1 persistence JSON numbers must be finite.');
    }
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => toJsonValue(entry)));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, toJsonValue(entryValue)] as const);
    return Object.freeze(Object.fromEntries(entries));
  }
  throw new SurebetPersistenceError('SUREBET_B1_JSON_INVALID', 'B1 persistence JSON cannot serialize unsupported values.');
}

function optionalText(value: string | undefined): string {
  if (value === undefined) {
    return 'NULL';
  }
  return quoteSqlLiteral(value);
}

function optionalBigInt(value: bigint | undefined): string {
  if (value === undefined) {
    return 'NULL';
  }
  return value.toString();
}

function optionalBoolean(value: boolean | undefined): string {
  if (value === undefined) {
    return 'NULL';
  }
  return value ? 'true' : 'false';
}

function requireNonEmptyString(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError('SUREBET_B1_REQUIRED_FIELD_MISSING', `B1 persistence field ${name} must be a non-empty string.`);
  }
  return value;
}

function requireSha256(value: string, name: string): void {
  requireNonEmptyString(value, name);
  if (!SHA256_REGEX.test(value)) {
    throw new SurebetPersistenceError('SUREBET_B1_SHA256_INVALID', `B1 persistence field ${name} must be a SHA-256 hex string.`);
  }
}

function requireIsoTimestamp(value: string, name: string): void {
  requireNonEmptyString(value, name);
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    throw new SurebetPersistenceError('SUREBET_B1_TIMESTAMP_INVALID', `B1 persistence field ${name} must be an ISO-8601 UTC timestamp.`);
  }
}
