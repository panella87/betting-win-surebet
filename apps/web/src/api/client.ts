import type {
  BwsB1BacktestRunItem,
  BwsB1BacktestRunQueryRequest,
  BwsPrivatePaperRuntimeCycleItem,
  BwsPrivatePaperRuntimeCycleQueryRequest,
  BwsPinnedStrategyExportItem,
  BwsPinnedStrategyExportQueryRequest,
  BwsReadOnlyQueryResponse,
  BwsStrategyLedgerItem,
  BwsStrategyLedgerQueryRequest,
} from '../../../../packages/bootstrap/src/api/bws-read-only-query-service.js';
import type { SurebetImportRunRecord, SurebetPinnedStrategyExportRecord } from '../../../../packages/persistence/src/index.js';
import type {
  SurebetStrategyAcceptanceState,
  SurebetStrategyCandidateReport,
  SurebetStrategyLedgerEntry,
  SurebetStrategyRunKind,
  SurebetStrategySettlementState,
  SurebetStrategySourceKind,
} from '../../../../packages/bootstrap/src/strategy/strategy-ledger.js';
import type { BettingWinUpstreamLock } from '../../../../packages/upstream/src/index.js';
import {
  BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV,
  BWS_OPERATOR_COCKPIT_DATA_MODE_ENV,
  normalizeBwsOperatorCockpitApiBaseUrl,
  type BwsOperatorCockpitBrowserConfig,
} from '../app/data-mode.js';
import type {
  BwsOperatorCockpitPinnedExportScope,
  BwsOperatorCockpitSnapshot,
} from './contracts.js';
import { createMockBwsOperatorCockpitSnapshot } from './mock-data.js';

export const BWS_OPERATOR_COCKPIT_API_CLIENT_PHASE = 'BWS_OPERATOR_COCKPIT_API_CLIENT_V1';

const JSON_CONTENT_TYPE = 'application/json';
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ACCEPTANCE_STATES = new Set<SurebetStrategyAcceptanceState>(['accepted_local_evidence', 'blocked']);
const RUN_KINDS = new Set<SurebetStrategyRunKind>([
  'deterministic_standard_binary_backtest',
  'private_paper_runtime_cycle',
]);
const SETTLEMENT_STATES = new Set<SurebetStrategySettlementState>(['blocked', 'reconciled']);
const SOURCE_KINDS = new Set<SurebetStrategySourceKind>(['pinned_records', 'read_only_query', 'resource_export']);

type ReadOnlyResponseItem =
  | BwsB1BacktestRunItem
  | BwsPrivatePaperRuntimeCycleItem
  | BwsStrategyLedgerItem
  | BwsPinnedStrategyExportItem;
type BwsReadOnlyApiResource = 'b1_backtest_runs' | 'pinned_strategy_exports' | 'private_paper_runtime_cycles' | 'strategy_ledger_entries';

export type BwsOperatorCockpitFetchResponse = Readonly<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export type BwsOperatorCockpitFetchLike = (
  input: string,
  init: Readonly<{
    headers: Readonly<Record<string, string>>;
    method: 'GET';
  }>,
) => Promise<BwsOperatorCockpitFetchResponse>;

export interface BwsOperatorCockpitApiClient {
  queryB1BacktestRuns(
    request: BwsB1BacktestRunQueryRequest,
  ): Promise<BwsReadOnlyQueryResponse<'b1_backtest_runs', BwsB1BacktestRunItem>>;
  queryPrivatePaperRuntimeCycles(
    request: BwsPrivatePaperRuntimeCycleQueryRequest,
  ): Promise<BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>>;
  queryPinnedStrategyExports(
    request: BwsPinnedStrategyExportQueryRequest,
  ): Promise<BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>>;
  queryStrategyLedger(
    request: BwsStrategyLedgerQueryRequest,
  ): Promise<BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>>;
}

export interface LoadBwsOperatorCockpitSnapshotRequest {
  readonly evidenceScope?: BwsOperatorCockpitPinnedExportScope;
  readonly includePinnedStrategyExports: boolean;
}

function fail(message: string): never {
  throw new Error(message);
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const normalized = requireNonEmptyString(value, label);
  if (!ISO_8601_UTC_MILLISECONDS.test(normalized) || Number.isNaN(Date.parse(normalized))) {
    fail(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    fail(`${label} must be a boolean`);
  }
  return value;
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    fail(`${label} must be a positive integer`);
  }
  return value as number;
}

function requireArray<T>(value: unknown, label: string): readonly T[] {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
  }
  return value as readonly T[];
}

function requireObjectRecord(
  value: unknown,
  label: string,
): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    fail(`${label} must be a non-negative integer`);
  }
  return value as number;
}

function requireOptionalNonEmptyString(value: unknown, label: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireNonEmptyString(value, label);
}

function requireSha256(value: unknown, label: string): string {
  const normalized = requireNonEmptyString(value, label).toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) {
    fail(`${label} must be a 64-character lower-case SHA-256 value`);
  }
  return normalized;
}

function requireCommitSha(value: unknown, label: string): string {
  const normalized = requireNonEmptyString(value, label).toLowerCase();
  if (!COMMIT_SHA_PATTERN.test(normalized)) {
    fail(`${label} must be a 40-character lower-case Git identifier`);
  }
  return normalized;
}

function requireStringArray(value: unknown, label: string): readonly string[] {
  return Object.freeze(
    requireArray<unknown>(value, label).map((entry, index) => requireNonEmptyString(entry, `${label}[${index}]`)),
  );
}

function requireLiteral<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  label: string,
): T {
  const normalized = requireNonEmptyString(value, label);
  if (!allowed.has(normalized as T)) {
    fail(`${label} must be one of ${Array.from(allowed).join(', ')}`);
  }
  return normalized as T;
}

function assertUpstreamLock(value: unknown, label: string): BettingWinUpstreamLock {
  const record = requireObjectRecord(value, label);
  const packageVersions = requireObjectRecord(record['packageVersions'], `${label}.packageVersions`);
  requireStringArray(record['capabilities'], `${label}.capabilities`);
  if (Object.keys(packageVersions).length === 0) {
    fail(`${label}.packageVersions must contain at least one package version`);
  }
  requireCommitSha(record['commitSha'], `${label}.commitSha`);
  requireNonEmptyString(record['contractAlias'], `${label}.contractAlias`);
  requireNonEmptyString(record['contractSchema'], `${label}.contractSchema`);
  requireCommitSha(record['gitTreeSha'], `${label}.gitTreeSha`);
  requireNonEmptyString(record['packageVersion'], `${label}.packageVersion`);
  for (const [key, entryValue] of Object.entries(packageVersions)) {
    requireNonEmptyString(key, `${label}.packageVersions key`);
    requireNonEmptyString(entryValue, `${label}.packageVersions.${key}`);
  }
  requireNonEmptyString(record['repository'], `${label}.repository`);
  requireNonEmptyString(record['repositoryPath'], `${label}.repositoryPath`);
  requireNonEmptyString(record['schema'], `${label}.schema`);
  requireNonEmptyString(record['sourceFingerprintAlgorithm'], `${label}.sourceFingerprintAlgorithm`);
  requireNonEmptyString(record['sourceView'], `${label}.sourceView`);
  requireNonEmptyString(record['surebetProfile'], `${label}.surebetProfile`);
  requireSha256(record['trackedTreeListingSha256'], `${label}.trackedTreeListingSha256`);
  requireIsoTimestamp(record['verifiedAt'], `${label}.verifiedAt`);
  return record as unknown as BettingWinUpstreamLock;
}

function validateUpstreamLockBoundary(lock: BettingWinUpstreamLock, label: string): BettingWinUpstreamLock {
  if (lock.repository !== 'betting-win') {
    fail(`${label}.repository must stay on betting-win`);
  }
  if (lock.sourceView !== 'committed_git_head') {
    fail(`${label}.sourceView must stay on committed_git_head`);
  }
  if (lock.contractSchema !== 'betting-win.strategy-export.v1') {
    fail(`${label}.contractSchema must stay on betting-win.strategy-export.v1`);
  }
  if (lock.contractAlias !== 'betting-win-strategy-export.v1') {
    fail(`${label}.contractAlias must stay on betting-win-strategy-export.v1`);
  }
  if (lock.surebetProfile !== 'surebet_standard_binary_v0') {
    fail(`${label}.surebetProfile must stay on surebet_standard_binary_v0`);
  }
  return lock;
}

function assertImportRunRecord(
  value: unknown,
  label: string,
  expectedUpstreamLockRecordId: string,
): SurebetImportRunRecord {
  const record = requireObjectRecord(value, label);
  const upstreamLockRecordId = requireNonEmptyString(
    record['upstreamLockRecordId'],
    `${label}.upstreamLockRecordId`,
  );
  if (upstreamLockRecordId !== expectedUpstreamLockRecordId) {
    fail(`${label}.upstreamLockRecordId must match the enclosing provenance upstream lock record`);
  }
  requireOptionalNonEmptyString(record['completedAt'], `${label}.completedAt`);
  requireOptionalNonEmptyString(record['failureCode'], `${label}.failureCode`);
  requireNonEmptyString(record['importRunId'], `${label}.importRunId`);
  if (record['importedRecordCount'] !== undefined) {
    requireNonNegativeInteger(record['importedRecordCount'], `${label}.importedRecordCount`);
  }
  requireIsoTimestamp(record['insertedAt'], `${label}.insertedAt`);
  requireNonEmptyString(record['outcome'], `${label}.outcome`);
  requireIsoTimestamp(record['requestedAt'], `${label}.requestedAt`);
  requireNonEmptyString(record['sourceKind'], `${label}.sourceKind`);
  requireNonEmptyString(record['sourceLocator'], `${label}.sourceLocator`);
  requireIsoTimestamp(record['startedAt'], `${label}.startedAt`);
  requireIsoTimestamp(record['updatedAt'], `${label}.updatedAt`);
  return record as unknown as SurebetImportRunRecord;
}

function assertPinnedStrategyExportRecord(
  value: unknown,
  label: string,
  expectedUpstreamLockRecordId: string,
): SurebetPinnedStrategyExportRecord {
  const record = requireObjectRecord(value, label);
  const upstreamLockRecordId = requireNonEmptyString(
    record['upstreamLockRecordId'],
    `${label}.upstreamLockRecordId`,
  );
  if (upstreamLockRecordId !== expectedUpstreamLockRecordId) {
    fail(`${label}.upstreamLockRecordId must match the enclosing provenance upstream lock record`);
  }
  requireNonEmptyString(record['contractAlias'], `${label}.contractAlias`);
  requireNonEmptyString(record['contractSchema'], `${label}.contractSchema`);
  requireNonEmptyString(record['endpointId'], `${label}.endpointId`);
  requireNonEmptyString(record['exportId'], `${label}.exportId`);
  requireNonEmptyString(record['exportKind'], `${label}.exportKind`);
  requireNonEmptyString(record['exportProfile'], `${label}.exportProfile`);
  requireIsoTimestamp(record['exportedAt'], `${label}.exportedAt`);
  requireNonEmptyString(record['importRunId'], `${label}.importRunId`);
  requireIsoTimestamp(record['importedAt'], `${label}.importedAt`);
  requireIsoTimestamp(record['insertedAt'], `${label}.insertedAt`);
  requireNonEmptyString(record['intakeRecordId'], `${label}.intakeRecordId`);
  requireStringArray(record['normalizedEvidenceIds'], `${label}.normalizedEvidenceIds`);
  requireSha256(record['payloadSha256'], `${label}.payloadSha256`);
  requireStringArray(record['providerGenerationIds'], `${label}.providerGenerationIds`);
  requireNonEmptyString(record['providerId'], `${label}.providerId`);
  requireStringArray(record['sourceLineageRecordIds'], `${label}.sourceLineageRecordIds`);
  requireNonEmptyString(record['sourceLocator'], `${label}.sourceLocator`);
  requireSha256(record['sourceSha256'], `${label}.sourceSha256`);
  requireNonEmptyString(record['surebetProfile'], `${label}.surebetProfile`);
  return record as unknown as SurebetPinnedStrategyExportRecord;
}

function assertCandidateReport(value: unknown, label: string): SurebetStrategyCandidateReport {
  const record = requireObjectRecord(value, label);
  const resultState = requireLiteral(record['resultState'], ACCEPTANCE_STATES, `${label}.resultState`);
  const blockerCodes = requireStringArray(record['blockerCodes'], `${label}.blockerCodes`);
  if (resultState === 'blocked' && blockerCodes.length === 0) {
    fail(`${label}.blockerCodes must contain explicit blocker codes for blocked candidates`);
  }
  requireNonNegativeInteger(record['blockerCount'], `${label}.blockerCount`);
  requireNonEmptyString(record['candidateId'], `${label}.candidateId`);
  requireNonEmptyString(record['canonicalMarketId'], `${label}.canonicalMarketId`);
  requireOptionalNonEmptyString(record['completionGroupState'], `${label}.completionGroupState`);
  requireOptionalNonEmptyString(record['finalOutcome'], `${label}.finalOutcome`);
  requireOptionalNonEmptyString(record['killReason'], `${label}.killReason`);
  requireOptionalNonEmptyString(record['settledNetMinor'], `${label}.settledNetMinor`);
  return record as unknown as SurebetStrategyCandidateReport;
}

function assertStrategyLedgerEntry(value: unknown, label: string): SurebetStrategyLedgerEntry {
  const record = requireObjectRecord(value, label);
  const acceptanceState = requireLiteral(record['acceptanceState'], ACCEPTANCE_STATES, `${label}.acceptanceState`);
  const runKind = requireLiteral(record['runKind'], RUN_KINDS, `${label}.runKind`);
  const sourceKind = requireLiteral(record['sourceKind'], SOURCE_KINDS, `${label}.sourceKind`);
  const settlementState = requireLiteral(record['settlementState'], SETTLEMENT_STATES, `${label}.settlementState`);
  const report = requireObjectRecord(record['report'], `${label}.report`);
  const candidates = requireArray<unknown>(report['candidates'], `${label}.report.candidates`)
    .map((candidate, index) => assertCandidateReport(candidate, `${label}.report.candidates[${index}]`));
  const reportUpstream = requireObjectRecord(report['upstream'], `${label}.report.upstream`);
  requireNonEmptyString(record['ledgerEntryId'], `${label}.ledgerEntryId`);
  requireNonNegativeInteger(record['blockedCandidateCount'], `${label}.blockedCandidateCount`);
  requireNonNegativeInteger(record['blockerCount'], `${label}.blockerCount`);
  const candidateCount = requireNonNegativeInteger(record['candidateCount'], `${label}.candidateCount`);
  requireNonEmptyString(record['liveState'], `${label}.liveState`);
  requireNonEmptyString(record['privacy'], `${label}.privacy`);
  requireNonEmptyString(record['profitabilityState'], `${label}.profitabilityState`);
  requireNonEmptyString(record['publicDistributionState'], `${label}.publicDistributionState`);
  requireNonEmptyString(record['reportId'], `${label}.reportId`);
  requireNonEmptyString(record['reportKind'], `${label}.reportKind`);
  requireSha256(record['reportSha256'], `${label}.reportSha256`);
  requireSha256(record['runFingerprintSha256'], `${label}.runFingerprintSha256`);
  requireNonEmptyString(record['runReferenceId'], `${label}.runReferenceId`);
  requireSha256(record['sourceManifestHash'], `${label}.sourceManifestHash`);
  requireNonNegativeInteger(report['blockedCandidateCount'], `${label}.report.blockedCandidateCount`);
  requireNonNegativeInteger(report['blockerCount'], `${label}.report.blockerCount`);
  requireNonNegativeInteger(report['candidateCount'], `${label}.report.candidateCount`);
  requireIsoTimestamp(report['exportedAt'], `${label}.report.exportedAt`);
  requireNonEmptyString(report['liveState'], `${label}.report.liveState`);
  requireNonEmptyString(report['privacy'], `${label}.report.privacy`);
  requireNonEmptyString(report['profitabilityState'], `${label}.report.profitabilityState`);
  requireNonEmptyString(report['publicDistributionState'], `${label}.report.publicDistributionState`);
  requireNonEmptyString(report['reportId'], `${label}.report.reportId`);
  requireNonEmptyString(report['reportKind'], `${label}.report.reportKind`);
  requireSha256(report['runFingerprintSha256'], `${label}.report.runFingerprintSha256`);
  requireNonEmptyString(report['runReferenceId'], `${label}.report.runReferenceId`);
  requireSha256(report['sourceManifestHash'], `${label}.report.sourceManifestHash`);
  requireNonEmptyString(report['statement'], `${label}.report.statement`);
  requireOptionalNonEmptyString(report['stopReason'], `${label}.report.stopReason`);
  requireNonEmptyString(reportUpstream['repository'], `${label}.report.upstream.repository`);
  requireCommitSha(reportUpstream['commitSha'], `${label}.report.upstream.commitSha`);
  requireCommitSha(reportUpstream['gitTreeSha'], `${label}.report.upstream.gitTreeSha`);
  requireSha256(reportUpstream['trackedTreeListingSha256'], `${label}.report.upstream.trackedTreeListingSha256`);
  requireNonEmptyString(reportUpstream['contractSchema'], `${label}.report.upstream.contractSchema`);
  requireNonEmptyString(reportUpstream['contractAlias'], `${label}.report.upstream.contractAlias`);
  requireNonEmptyString(reportUpstream['surebetProfile'], `${label}.report.upstream.surebetProfile`);
  if (requireNonEmptyString(report['reportId'], `${label}.report.reportId`) !== requireNonEmptyString(record['reportId'], `${label}.reportId`)
    || runKind !== requireLiteral(report['runKind'], RUN_KINDS, `${label}.report.runKind`)
    || requireNonEmptyString(report['runReferenceId'], `${label}.report.runReferenceId`) !== requireNonEmptyString(record['runReferenceId'], `${label}.runReferenceId`)
    || sourceKind !== requireLiteral(report['sourceKind'], SOURCE_KINDS, `${label}.report.sourceKind`)
    || requireSha256(report['sourceManifestHash'], `${label}.report.sourceManifestHash`) !== requireSha256(record['sourceManifestHash'], `${label}.sourceManifestHash`)
    || requireSha256(report['runFingerprintSha256'], `${label}.report.runFingerprintSha256`) !== requireSha256(record['runFingerprintSha256'], `${label}.runFingerprintSha256`)
    || acceptanceState !== requireLiteral(report['acceptanceState'], ACCEPTANCE_STATES, `${label}.report.acceptanceState`)
    || settlementState !== requireLiteral(report['settlementState'], SETTLEMENT_STATES, `${label}.report.settlementState`)) {
    fail(`${label} must keep top-level strategy ledger fields aligned with the nested report`);
  }
  if (candidateCount !== candidates.length) {
    fail(`${label}.candidateCount must equal the nested report candidate row count`);
  }
  return record as unknown as SurebetStrategyLedgerEntry;
}

function assertStrategyLedgerItem(value: unknown, label: string): BwsStrategyLedgerItem {
  const record = requireObjectRecord(value, label);
  const provenance = requireObjectRecord(record['provenance'], `${label}.provenance`);
  const upstreamLockRecordId = requireNonEmptyString(
    provenance['upstreamLockRecordId'],
    `${label}.provenance.upstreamLockRecordId`,
  );
  const upstreamLock = validateUpstreamLockBoundary(
    assertUpstreamLock(provenance['upstreamLock'], `${label}.provenance.upstreamLock`),
    `${label}.provenance.upstreamLock`,
  );
  const entry = assertStrategyLedgerEntry(record['entry'], `${label}.entry`);
  const pinnedStrategyExport = provenance['pinnedStrategyExport'] === undefined
    ? undefined
    : assertPinnedStrategyExportRecord(
        provenance['pinnedStrategyExport'],
        `${label}.provenance.pinnedStrategyExport`,
        upstreamLockRecordId,
      );
  const importRun = provenance['importRun'] === undefined
    ? undefined
    : assertImportRunRecord(
        provenance['importRun'],
        `${label}.provenance.importRun`,
        upstreamLockRecordId,
      );
  if (entry.sourceKind === 'read_only_query') {
    if (pinnedStrategyExport !== undefined || importRun !== undefined) {
      fail(`${label}.provenance must omit pinned export and import run evidence for read_only_query rows`);
    }
  } else if (pinnedStrategyExport === undefined || importRun === undefined) {
    fail(`${label}.provenance must include pinned export and import run evidence for ${entry.sourceKind} rows`);
  }
  if (entry.report.upstream.commitSha !== upstreamLock.commitSha
    || entry.report.upstream.gitTreeSha !== upstreamLock.gitTreeSha
    || entry.report.upstream.trackedTreeListingSha256 !== upstreamLock.trackedTreeListingSha256) {
    fail(`${label}.entry.report.upstream must match the expanded committed-HEAD upstream lock provenance`);
  }
  requireIsoTimestamp(record['insertedAt'], `${label}.insertedAt`);
  if (requireNonEmptyString(record['ledgerEntryId'], `${label}.ledgerEntryId`) !== entry.ledgerEntryId) {
    fail(`${label}.ledgerEntryId must match entry.ledgerEntryId`);
  }
  return record as unknown as BwsStrategyLedgerItem;
}

function assertPrivatePaperRuntimeCycleItem(value: unknown, label: string): BwsPrivatePaperRuntimeCycleItem {
  const record = requireObjectRecord(value, label);
  const acceptanceState = requireLiteral(record['acceptanceState'], ACCEPTANCE_STATES, `${label}.acceptanceState`);
  requireOptionalNonEmptyString(record['blockedReasonCode'], `${label}.blockedReasonCode`);
  const cycleId = requireNonEmptyString(record['cycleId'], `${label}.cycleId`);
  requirePositiveInteger(record['cycleNumber'], `${label}.cycleNumber`);
  requireNonEmptyString(record['runtimeId'], `${label}.runtimeId`);
  requireLiteral(record['sourceKind'], SOURCE_KINDS, `${label}.sourceKind`);
  requireSha256(record['sourceManifestHash'], `${label}.sourceManifestHash`);

  const job = requireObjectRecord(record['job'], `${label}.job`);
  requirePositiveInteger(job['attemptCount'], `${label}.job.attemptCount`);
  requireNonNegativeInteger(job['checkpointCount'], `${label}.job.checkpointCount`);
  requireOptionalNonEmptyString(job['completedAt'], `${label}.job.completedAt`);
  requireIsoTimestamp(job['insertedAt'], `${label}.job.insertedAt`);
  requireNonEmptyString(job['jobId'], `${label}.job.jobId`);
  requireOptionalNonEmptyString(job['lastCheckpointAt'], `${label}.job.lastCheckpointAt`);
  requireOptionalNonEmptyString(job['lastCheckpointId'], `${label}.job.lastCheckpointId`);
  requireOptionalNonEmptyString(job['lastErrorCode'], `${label}.job.lastErrorCode`);
  requireNonEmptyString(job['queueName'], `${label}.job.queueName`);
  requireNonEmptyString(job['status'], `${label}.job.status`);
  requireIsoTimestamp(job['updatedAt'], `${label}.job.updatedAt`);

  const provenance = requireObjectRecord(record['provenance'], `${label}.provenance`);
  const upstreamLockRecordId = requireNonEmptyString(
    provenance['upstreamLockRecordId'],
    `${label}.provenance.upstreamLockRecordId`,
  );
  validateUpstreamLockBoundary(
    assertUpstreamLock(provenance['upstreamLock'], `${label}.provenance.upstreamLock`),
    `${label}.provenance.upstreamLock`,
  );

  const schedulerCheckpoint = requireObjectRecord(
    provenance['schedulerCheckpoint'],
    `${label}.provenance.schedulerCheckpoint`,
  );
  if (requireNonEmptyString(
    schedulerCheckpoint['upstreamLockRecordId'],
    `${label}.provenance.schedulerCheckpoint.upstreamLockRecordId`,
  ) !== upstreamLockRecordId) {
    fail(`${label}.provenance.schedulerCheckpoint.upstreamLockRecordId must match provenance.upstreamLockRecordId`);
  }
  requireNonEmptyString(
    schedulerCheckpoint['schedulerCheckpointId'],
    `${label}.provenance.schedulerCheckpoint.schedulerCheckpointId`,
  );
  requireNonEmptyString(schedulerCheckpoint['runtimeId'], `${label}.provenance.schedulerCheckpoint.runtimeId`);
  requireNonEmptyString(schedulerCheckpoint['queueName'], `${label}.provenance.schedulerCheckpoint.queueName`);
  requireNonEmptyString(
    schedulerCheckpoint['upstreamCheckpointId'],
    `${label}.provenance.schedulerCheckpoint.upstreamCheckpointId`,
  );

  const upstreamApiCheckpoint = requireObjectRecord(
    provenance['upstreamApiCheckpoint'],
    `${label}.provenance.upstreamApiCheckpoint`,
  );
  if (requireNonEmptyString(
    upstreamApiCheckpoint['upstreamLockRecordId'],
    `${label}.provenance.upstreamApiCheckpoint.upstreamLockRecordId`,
  ) !== upstreamLockRecordId) {
    fail(`${label}.provenance.upstreamApiCheckpoint.upstreamLockRecordId must match provenance.upstreamLockRecordId`);
  }
  requireNonEmptyString(upstreamApiCheckpoint['checkpointId'], `${label}.provenance.upstreamApiCheckpoint.checkpointId`);
  requirePositiveInteger(upstreamApiCheckpoint['currentCycleNumber'], `${label}.provenance.upstreamApiCheckpoint.currentCycleNumber`);
  requireNonNegativeInteger(
    upstreamApiCheckpoint['completedCycleCount'],
    `${label}.provenance.upstreamApiCheckpoint.completedCycleCount`,
  );

  if (provenance['cycleImportRun'] !== undefined) {
    assertImportRunRecord(provenance['cycleImportRun'], `${label}.provenance.cycleImportRun`, upstreamLockRecordId);
  }

  const recentCheckpoints = requireArray<unknown>(record['recentCheckpoints'], `${label}.recentCheckpoints`);
  for (const [index, checkpointValue] of recentCheckpoints.entries()) {
    const checkpoint = requireObjectRecord(checkpointValue, `${label}.recentCheckpoints[${index}]`);
    requireObjectRecord(checkpoint['checkpoint'], `${label}.recentCheckpoints[${index}].checkpoint`);
    requireNonEmptyString(checkpoint['checkpointId'], `${label}.recentCheckpoints[${index}].checkpointId`);
    requireSha256(checkpoint['checkpointSha256'], `${label}.recentCheckpoints[${index}].checkpointSha256`);
    requireIsoTimestamp(checkpoint['recordedAt'], `${label}.recentCheckpoints[${index}].recordedAt`);
  }

  const strategyLedger = record['strategyLedger'] === undefined
    ? undefined
    : assertStrategyLedgerItem(record['strategyLedger'], `${label}.strategyLedger`);
  if (strategyLedger !== undefined && strategyLedger.entry.acceptanceState !== acceptanceState) {
    fail(`${label}.strategyLedger.entry.acceptanceState must match the runtime cycle acceptanceState`);
  }

  const deadLetter = record['deadLetter'] === undefined
    ? undefined
    : requireObjectRecord(record['deadLetter'], `${label}.deadLetter`);
  if (deadLetter !== undefined) {
    requireNonNegativeInteger(deadLetter['checkpointCount'], `${label}.deadLetter.checkpointCount`);
    requireNonEmptyString(deadLetter['deadLetterReasonCode'], `${label}.deadLetter.deadLetterReasonCode`);
    requireObjectRecord(deadLetter['deadLetterReasonDetails'], `${label}.deadLetter.deadLetterReasonDetails`);
    requirePositiveInteger(deadLetter['finalAttemptCount'], `${label}.deadLetter.finalAttemptCount`);
    requireIsoTimestamp(deadLetter['insertedAt'], `${label}.deadLetter.insertedAt`);
  }
  if (acceptanceState === 'accepted_local_evidence' && strategyLedger === undefined) {
    fail(`${label} accepted runtime cycles must expose strategy-ledger evidence`);
  }
  if (acceptanceState === 'blocked' && strategyLedger === undefined && deadLetter === undefined) {
    fail(`${label} blocked runtime cycles must expose either strategy-ledger evidence or a dead-letter record`);
  }
  return record as unknown as BwsPrivatePaperRuntimeCycleItem;
}

function assertPinnedStrategyExportItem(value: unknown, label: string): BwsPinnedStrategyExportItem {
  const record = requireObjectRecord(value, label);
  const provenance = requireObjectRecord(record['provenance'], `${label}.provenance`);
  const upstreamLockRecordId = requireNonEmptyString(
    provenance['upstreamLockRecordId'],
    `${label}.provenance.upstreamLockRecordId`,
  );
  const upstreamLock = validateUpstreamLockBoundary(
    assertUpstreamLock(provenance['upstreamLock'], `${label}.provenance.upstreamLock`),
    `${label}.provenance.upstreamLock`,
  );
  const pinnedRecord = assertPinnedStrategyExportRecord(
    record['record'],
    `${label}.record`,
    upstreamLockRecordId,
  );
  const importRun = assertImportRunRecord(
    provenance['importRun'],
    `${label}.provenance.importRun`,
    upstreamLockRecordId,
  );
  if (pinnedRecord.importRunId !== importRun.importRunId) {
    fail(`${label}.record.importRunId must match provenance.importRun.importRunId`);
  }
  if (pinnedRecord.upstreamLockRecordId !== upstreamLockRecordId) {
    fail(`${label}.record.upstreamLockRecordId must match provenance.upstreamLockRecordId`);
  }
  if (pinnedRecord.contractSchema !== upstreamLock.contractSchema
    || pinnedRecord.contractAlias !== upstreamLock.contractAlias
    || pinnedRecord.surebetProfile !== upstreamLock.surebetProfile) {
    fail(`${label}.record must stay aligned with the expanded committed-HEAD upstream lock contract`);
  }
  requireNonEmptyString(record['intakeRecordId'], `${label}.intakeRecordId`);
  requireIsoTimestamp(record['insertedAt'], `${label}.insertedAt`);
  return record as unknown as BwsPinnedStrategyExportItem;
}

function assertB1BacktestRunItem(value: unknown, label: string): BwsB1BacktestRunItem {
  const record = requireObjectRecord(value, label);
  const run = requireObjectRecord(record['run'], `${label}.run`);
  if (requireNonEmptyString(run['runKind'], `${label}.run.runKind`) !== 'deterministic_b1_cross_venue_offline_backtest') {
    fail(`${label}.run.runKind must remain deterministic_b1_cross_venue_offline_backtest`);
  }
  if (requireBoolean(run['runtimeEvidence'], `${label}.run.runtimeEvidence`) !== false) {
    fail(`${label}.run.runtimeEvidence must stay false`);
  }
  if (requireBoolean(run['executable'], `${label}.run.executable`) !== false) {
    fail(`${label}.run.executable must stay false`);
  }
  if (requireNonEmptyString(run['liveReadiness'], `${label}.run.liveReadiness`) !== 'not_authorized_bws_900_parked') {
    fail(`${label}.run.liveReadiness must keep BWS-900 parked`);
  }
  if (
    requireNonEmptyString(run['upstreamReadiness'], `${label}.run.upstreamReadiness`)
    !== 'blocked_until_betting_win_b1_multi_venue_markets_v1'
  ) {
    fail(`${label}.run.upstreamReadiness must preserve the upstream B1 blocker`);
  }
  requireNonEmptyString(run['runId'], `${label}.run.runId`);
  requireSha256(run['runHash'], `${label}.run.runHash`);
  requireSha256(run['sourceManifestHash'], `${label}.run.sourceManifestHash`);
  requireSha256(run['upstreamLockFingerprint'], `${label}.run.upstreamLockFingerprint`);
  requireIsoTimestamp(run['observedAt'], `${label}.run.observedAt`);
  requireIsoTimestamp(run['insertedAt'], `${label}.run.insertedAt`);
  requireObjectRecord(run['metrics'], `${label}.run.metrics`);
  requireObjectRecord(run['report'], `${label}.run.report`);

  const policy = requireObjectRecord(record['policy'], `${label}.policy`);
  if (requireBoolean(policy['runtimeEvidence'], `${label}.policy.runtimeEvidence`) !== false) {
    fail(`${label}.policy.runtimeEvidence must stay false`);
  }
  if (requireNonEmptyString(policy['execution'], `${label}.policy.execution`) !== 'forbidden') {
    fail(`${label}.policy.execution must be forbidden`);
  }
  if (requireNonEmptyString(policy['publicSignals'], `${label}.policy.publicSignals`) !== 'forbidden') {
    fail(`${label}.policy.publicSignals must be forbidden`);
  }
  if (
    requireNonEmptyString(policy['upstreamReadiness'], `${label}.policy.upstreamReadiness`)
    !== 'blocked_until_betting_win_b1_multi_venue_markets_v1'
  ) {
    fail(`${label}.policy.upstreamReadiness must preserve the upstream B1 blocker`);
  }

  for (const [index, candidate] of requireArray<unknown>(record['candidateSnapshots'], `${label}.candidateSnapshots`).entries()) {
    const candidateRecord = requireObjectRecord(candidate, `${label}.candidateSnapshots[${index}]`);
    requireNonEmptyString(candidateRecord['candidateId'], `${label}.candidateSnapshots[${index}].candidateId`);
    requireNonEmptyString(candidateRecord['status'], `${label}.candidateSnapshots[${index}].status`);
    requireNonEmptyString(candidateRecord['stage'], `${label}.candidateSnapshots[${index}].stage`);
    requireObjectRecord(candidateRecord['candidate'], `${label}.candidateSnapshots[${index}].candidate`);
  }
  for (const [index, simulation] of requireArray<unknown>(record['simulationResults'], `${label}.simulationResults`).entries()) {
    const simulationRecord = requireObjectRecord(simulation, `${label}.simulationResults[${index}]`);
    requireNonEmptyString(simulationRecord['candidateId'], `${label}.simulationResults[${index}].candidateId`);
    requireNonEmptyString(simulationRecord['simulationKind'], `${label}.simulationResults[${index}].simulationKind`);
    requireNonEmptyString(simulationRecord['status'], `${label}.simulationResults[${index}].status`);
    requireObjectRecord(simulationRecord['result'], `${label}.simulationResults[${index}].result`);
  }
  return record as unknown as BwsB1BacktestRunItem;
}

function assertResponseItems<
  TResource extends BwsReadOnlyApiResource,
>(
  resource: TResource,
  items: readonly unknown[],
) {
  if (resource === 'b1_backtest_runs') {
    return Object.freeze(
      items.map((item, index) => assertB1BacktestRunItem(item, `page.items[${index}]`)),
    );
  }
  if (resource === 'pinned_strategy_exports') {
    return Object.freeze(
      items.map((item, index) => assertPinnedStrategyExportItem(item, `page.items[${index}]`)),
    );
  }
  if (resource === 'private_paper_runtime_cycles') {
    return Object.freeze(
      items.map((item, index) => assertPrivatePaperRuntimeCycleItem(item, `page.items[${index}]`)),
    );
  }
  return Object.freeze(
    items.map((item, index) => assertStrategyLedgerItem(item, `page.items[${index}]`)),
  );
}

function assertReadOnlyQueryResponse<
  TResource extends BwsReadOnlyApiResource,
  TItem extends ReadOnlyResponseItem,
>(
  value: unknown,
  resource: TResource,
): BwsReadOnlyQueryResponse<TResource, TItem> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('BWS cockpit API response must be an object');
  }
  const record = value as Record<string, unknown>;
  const returnedResource = requireNonEmptyString(record['resource'], 'resource');
  if (returnedResource !== resource) {
    fail(`BWS cockpit API response resource ${returnedResource} did not match ${resource}`);
  }
  const generatedAt = requireIsoTimestamp(record['generatedAt'], 'generatedAt');
  const boundary = record['boundary'];
  if (boundary === null || typeof boundary !== 'object' || Array.isArray(boundary)) {
    fail('BWS cockpit API response boundary must be an object');
  }
  const boundaryRecord = boundary as Record<string, unknown>;
  if (requireNonEmptyString(boundaryRecord['automaticFallback'], 'boundary.automaticFallback') !== 'forbidden') {
    fail('BWS cockpit API boundary must keep automaticFallback=forbidden');
  }
  requireNonEmptyString(boundaryRecord['bwsReadOnlyQueryServiceBoundary'], 'boundary.bwsReadOnlyQueryServiceBoundary');
  requireNonEmptyString(boundaryRecord['upstreamReadOnlyQueryClientBoundary'], 'boundary.upstreamReadOnlyQueryClientBoundary');
  const page = record['page'];
  if (page === null || typeof page !== 'object' || Array.isArray(page)) {
    fail('BWS cockpit API response page must be an object');
  }
  const pageRecord = page as Record<string, unknown>;
  const items = assertResponseItems(resource, requireArray<unknown>(pageRecord['items'], 'page.items')) as readonly TItem[];
  const pageSize = requirePositiveInteger(pageRecord['pageSize'], 'page.pageSize');
  const returnedCountValue = pageRecord['returnedCount'];
  if (typeof returnedCountValue !== 'number'
    || !Number.isSafeInteger(returnedCountValue)
    || returnedCountValue < 0
    || returnedCountValue > pageSize) {
    fail('page.returnedCount must stay between zero and pageSize');
  }
  const returnedCount = returnedCountValue;
  if (returnedCount !== items.length) {
    fail(`page.returnedCount ${returnedCount} must match page.items length ${items.length}`);
  }
  if ((pageRecord['nextCursor'] ?? undefined) !== undefined) {
    requireNonEmptyString(pageRecord['nextCursor'], 'page.nextCursor');
  }
  return Object.freeze({
    boundary: Object.freeze({
      automaticFallback: 'forbidden',
      bwsReadOnlyQueryServiceBoundary: requireNonEmptyString(
        boundaryRecord['bwsReadOnlyQueryServiceBoundary'],
        'boundary.bwsReadOnlyQueryServiceBoundary',
      ),
      upstreamReadOnlyQueryClientBoundary: requireNonEmptyString(
        boundaryRecord['upstreamReadOnlyQueryClientBoundary'],
        'boundary.upstreamReadOnlyQueryClientBoundary',
      ),
    }),
    generatedAt,
    page: Object.freeze({
      items,
      ...(pageRecord['nextCursor'] === undefined
        ? {}
        : { nextCursor: requireNonEmptyString(pageRecord['nextCursor'], 'page.nextCursor') }),
      pageSize,
      returnedCount,
    }),
    resource,
  }) as BwsReadOnlyQueryResponse<TResource, TItem>;
}

function appendQueryParameter(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined) {
    return;
  }
  searchParams.set(key, String(value));
}

function normalizeOptionalScopeValue(value: string | undefined, label: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    fail(`${label} must be a non-empty string when provided`);
  }
  return trimmed;
}

function normalizeOptionalSha256(value: string | undefined, label: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!SHA256_PATTERN.test(value)) {
    fail(`${label} must be a 64-character lower-case SHA-256 value`);
  }
  return value;
}

export function normalizeBwsOperatorCockpitPinnedExportScope(
  scope: BwsOperatorCockpitPinnedExportScope,
): BwsOperatorCockpitPinnedExportScope {
  const normalized: Partial<Record<keyof BwsOperatorCockpitPinnedExportScope, string>> = {};
  const endpointId = normalizeOptionalScopeValue(scope.endpointId, 'endpointId');
  const exportId = normalizeOptionalScopeValue(scope.exportId, 'exportId');
  const importRunId = normalizeOptionalScopeValue(scope.importRunId, 'importRunId');
  const providerId = normalizeOptionalScopeValue(scope.providerId, 'providerId');
  const sourceSha256 = normalizeOptionalSha256(scope.sourceSha256, 'sourceSha256');
  const upstreamLockRecordId = normalizeOptionalScopeValue(
    scope.upstreamLockRecordId,
    'upstreamLockRecordId',
  );
  if (endpointId !== undefined) {
    normalized.endpointId = endpointId;
  }
  if (exportId !== undefined) {
    normalized.exportId = exportId;
  }
  if (importRunId !== undefined) {
    normalized.importRunId = importRunId;
  }
  if (providerId !== undefined) {
    normalized.providerId = providerId;
  }
  if (sourceSha256 !== undefined) {
    normalized.sourceSha256 = sourceSha256;
  }
  if (upstreamLockRecordId !== undefined) {
    normalized.upstreamLockRecordId = upstreamLockRecordId;
  }

  if (Object.keys(normalized).length === 0) {
    fail(
      'Pinned strategy export queries require at least one explicit scope filter: exportId, importRunId, providerId, endpointId, sourceSha256, or upstreamLockRecordId.',
    );
  }
  return Object.freeze(normalized) as BwsOperatorCockpitPinnedExportScope;
}

function createStrategyLedgerRequest(
  acceptanceState: 'accepted_local_evidence' | 'blocked',
  runKind: 'deterministic_standard_binary_backtest' | 'private_paper_runtime_cycle',
): BwsStrategyLedgerQueryRequest {
  return Object.freeze({
    expand: 'provenance',
    filters: Object.freeze({
      acceptanceState,
      runKind,
    }),
    pageSize: 8,
  });
}

function createPrivatePaperRuntimeCycleRequest(
  acceptanceState: 'accepted_local_evidence' | 'blocked',
): BwsPrivatePaperRuntimeCycleQueryRequest {
  return Object.freeze({
    expand: 'provenance',
    filters: Object.freeze({
      acceptanceState,
    }),
    pageSize: 8,
  });
}

function createB1BacktestRunRequest(): BwsB1BacktestRunQueryRequest {
  return Object.freeze({
    expand: 'reporting',
    filters: Object.freeze({
      offlineFalsificationStatus: 'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
    }),
    pageSize: 8,
  });
}

function buildStrategyLedgerUrl(
  baseUrl: string,
  request: BwsStrategyLedgerQueryRequest,
): string {
  const searchParams = new URLSearchParams();
  appendQueryParameter(searchParams, 'pageSize', request.pageSize);
  appendQueryParameter(searchParams, 'expand', request.expand);
  appendQueryParameter(searchParams, 'cursor', request.cursor);
  appendQueryParameter(searchParams, 'acceptanceState', request.filters.acceptanceState);
  appendQueryParameter(searchParams, 'pinnedStrategyExportRecordId', request.filters.pinnedStrategyExportRecordId);
  appendQueryParameter(searchParams, 'reportId', request.filters.reportId);
  appendQueryParameter(searchParams, 'runFingerprintSha256', request.filters.runFingerprintSha256);
  appendQueryParameter(searchParams, 'runKind', request.filters.runKind);
  appendQueryParameter(searchParams, 'runReferenceId', request.filters.runReferenceId);
  appendQueryParameter(searchParams, 'sourceKind', request.filters.sourceKind);
  appendQueryParameter(searchParams, 'sourceManifestHash', request.filters.sourceManifestHash);
  appendQueryParameter(searchParams, 'upstreamLockRecordId', request.filters.upstreamLockRecordId);
  return new URL(`/api/read-only/strategy-ledger?${searchParams.toString()}`, baseUrl).href;
}

function buildB1BacktestRunsUrl(
  baseUrl: string,
  request: BwsB1BacktestRunQueryRequest,
): string {
  const searchParams = new URLSearchParams();
  appendQueryParameter(searchParams, 'pageSize', request.pageSize);
  appendQueryParameter(searchParams, 'expand', request.expand);
  appendQueryParameter(searchParams, 'cursor', request.cursor);
  appendQueryParameter(searchParams, 'offlineFalsificationStatus', request.filters.offlineFalsificationStatus);
  appendQueryParameter(searchParams, 'runId', request.filters.runId);
  appendQueryParameter(searchParams, 'sourceManifestHash', request.filters.sourceManifestHash);
  appendQueryParameter(searchParams, 'upstreamCheckpointId', request.filters.upstreamCheckpointId);
  appendQueryParameter(searchParams, 'upstreamLockFingerprint', request.filters.upstreamLockFingerprint);
  return new URL(`/api/read-only/b1/backtest-runs?${searchParams.toString()}`, baseUrl).href;
}

function buildPinnedStrategyExportsUrl(
  baseUrl: string,
  request: BwsPinnedStrategyExportQueryRequest,
): string {
  const normalizedScope = normalizeBwsOperatorCockpitPinnedExportScope(request.filters);
  const searchParams = new URLSearchParams();
  appendQueryParameter(searchParams, 'pageSize', request.pageSize);
  appendQueryParameter(searchParams, 'expand', request.expand);
  appendQueryParameter(searchParams, 'cursor', request.cursor);
  appendQueryParameter(searchParams, 'endpointId', normalizedScope.endpointId);
  appendQueryParameter(searchParams, 'exportId', normalizedScope.exportId);
  appendQueryParameter(searchParams, 'importRunId', normalizedScope.importRunId);
  appendQueryParameter(searchParams, 'providerId', normalizedScope.providerId);
  appendQueryParameter(searchParams, 'sourceSha256', normalizedScope.sourceSha256);
  appendQueryParameter(searchParams, 'upstreamLockRecordId', normalizedScope.upstreamLockRecordId);
  return new URL(`/api/read-only/pinned-strategy-exports?${searchParams.toString()}`, baseUrl).href;
}

function buildPrivatePaperRuntimeCyclesUrl(
  baseUrl: string,
  request: BwsPrivatePaperRuntimeCycleQueryRequest,
): string {
  const searchParams = new URLSearchParams();
  appendQueryParameter(searchParams, 'pageSize', request.pageSize);
  appendQueryParameter(searchParams, 'expand', request.expand);
  appendQueryParameter(searchParams, 'acceptanceState', request.filters.acceptanceState);
  appendQueryParameter(searchParams, 'queueName', request.filters.queueName);
  appendQueryParameter(searchParams, 'runtimeId', request.filters.runtimeId);
  appendQueryParameter(searchParams, 'schedulerCheckpointId', request.filters.schedulerCheckpointId);
  appendQueryParameter(searchParams, 'upstreamLockRecordId', request.filters.upstreamLockRecordId);
  return new URL(`/api/read-only/private-paper-runtime-cycles?${searchParams.toString()}`, baseUrl).href;
}

function buildErrorMessage(path: string, status: number, payloadText: string): string {
  if (payloadText.trim().length === 0) {
    return `BWS cockpit GET ${path} failed with status ${status}`;
  }
  try {
    const parsed = JSON.parse(payloadText) as {
      readonly error?: {
        readonly code?: string;
        readonly evidenceRequired?: string;
        readonly message?: string;
      };
    };
    if (parsed.error?.message !== undefined) {
      const evidence = parsed.error.evidenceRequired === undefined
        ? ''
        : ` Evidence required: ${parsed.error.evidenceRequired}`;
      return `${parsed.error.code ?? 'BWS_QUERY_ERROR'}: ${parsed.error.message}${evidence}`;
    }
  } catch {
    // fall through to the raw payload response
  }
  return `BWS cockpit GET ${path} failed with status ${status}: ${payloadText.trim()}`;
}

function assertStrategyLedgerResponseMatchesRequest(
  response: BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>,
  request: BwsStrategyLedgerQueryRequest,
): BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem> {
  for (const item of response.page.items) {
    if (request.filters.acceptanceState !== undefined && item.entry.acceptanceState !== request.filters.acceptanceState) {
      fail(
        `strategy_ledger_entries response acceptanceState ${item.entry.acceptanceState} did not match requested ${request.filters.acceptanceState}`,
      );
    }
    if (request.filters.pinnedStrategyExportRecordId !== undefined) {
      if (item.provenance.pinnedStrategyExport === undefined) {
        fail('strategy_ledger_entries response missing pinnedStrategyExport provenance for requested pinnedStrategyExportRecordId');
      }
      if (item.provenance.pinnedStrategyExport.intakeRecordId !== request.filters.pinnedStrategyExportRecordId) {
        fail(
          `strategy_ledger_entries response pinnedStrategyExportRecordId ${item.provenance.pinnedStrategyExport.intakeRecordId} did not match requested ${request.filters.pinnedStrategyExportRecordId}`,
        );
      }
    }
    if (request.filters.reportId !== undefined && item.entry.reportId !== request.filters.reportId) {
      fail(`strategy_ledger_entries response reportId ${item.entry.reportId} did not match requested ${request.filters.reportId}`);
    }
    if (
      request.filters.runFingerprintSha256 !== undefined
      && item.entry.runFingerprintSha256 !== request.filters.runFingerprintSha256
    ) {
      fail(
        `strategy_ledger_entries response runFingerprintSha256 ${item.entry.runFingerprintSha256} did not match requested ${request.filters.runFingerprintSha256}`,
      );
    }
    if (request.filters.runKind !== undefined && item.entry.runKind !== request.filters.runKind) {
      fail(`strategy_ledger_entries response runKind ${item.entry.runKind} did not match requested ${request.filters.runKind}`);
    }
    if (request.filters.runReferenceId !== undefined && item.entry.runReferenceId !== request.filters.runReferenceId) {
      fail(
        `strategy_ledger_entries response runReferenceId ${item.entry.runReferenceId} did not match requested ${request.filters.runReferenceId}`,
      );
    }
    if (request.filters.sourceKind !== undefined && item.entry.sourceKind !== request.filters.sourceKind) {
      fail(`strategy_ledger_entries response sourceKind ${item.entry.sourceKind} did not match requested ${request.filters.sourceKind}`);
    }
    if (request.filters.sourceManifestHash !== undefined && item.entry.sourceManifestHash !== request.filters.sourceManifestHash) {
      fail(
        `strategy_ledger_entries response sourceManifestHash ${item.entry.sourceManifestHash} did not match requested ${request.filters.sourceManifestHash}`,
      );
    }
    if (
      request.filters.upstreamLockRecordId !== undefined
      && item.provenance.upstreamLockRecordId !== request.filters.upstreamLockRecordId
    ) {
      fail(
        `strategy_ledger_entries response upstreamLockRecordId ${item.provenance.upstreamLockRecordId} did not match requested ${request.filters.upstreamLockRecordId}`,
      );
    }
  }

  return response;
}

function assertB1BacktestRunsResponseMatchesRequest(
  response: BwsReadOnlyQueryResponse<'b1_backtest_runs', BwsB1BacktestRunItem>,
  request: BwsB1BacktestRunQueryRequest,
): BwsReadOnlyQueryResponse<'b1_backtest_runs', BwsB1BacktestRunItem> {
  for (const item of response.page.items) {
    if (request.filters.runId !== undefined && item.run.runId !== request.filters.runId) {
      fail(`b1_backtest_runs response runId ${item.run.runId} did not match requested ${request.filters.runId}`);
    }
    if (
      request.filters.offlineFalsificationStatus !== undefined
      && item.run.offlineFalsificationStatus !== request.filters.offlineFalsificationStatus
    ) {
      fail(
        `b1_backtest_runs response offlineFalsificationStatus ${item.run.offlineFalsificationStatus} did not match requested ${request.filters.offlineFalsificationStatus}`,
      );
    }
    if (request.filters.sourceManifestHash !== undefined && item.run.sourceManifestHash !== request.filters.sourceManifestHash) {
      fail(
        `b1_backtest_runs response sourceManifestHash ${item.run.sourceManifestHash} did not match requested ${request.filters.sourceManifestHash}`,
      );
    }
    if (
      request.filters.upstreamLockFingerprint !== undefined
      && item.run.upstreamLockFingerprint !== request.filters.upstreamLockFingerprint
    ) {
      fail(
        `b1_backtest_runs response upstreamLockFingerprint ${item.run.upstreamLockFingerprint} did not match requested ${request.filters.upstreamLockFingerprint}`,
      );
    }
    if (request.filters.upstreamCheckpointId !== undefined && item.run.upstreamCheckpointId !== request.filters.upstreamCheckpointId) {
      fail(
        `b1_backtest_runs response upstreamCheckpointId ${item.run.upstreamCheckpointId} did not match requested ${request.filters.upstreamCheckpointId}`,
      );
    }
  }
  return response;
}

function assertPrivatePaperRuntimeCyclesResponseMatchesRequest(
  response: BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>,
  request: BwsPrivatePaperRuntimeCycleQueryRequest,
): BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem> {
  for (const item of response.page.items) {
    if (request.filters.acceptanceState !== undefined && item.acceptanceState !== request.filters.acceptanceState) {
      fail(
        `private_paper_runtime_cycles response acceptanceState ${item.acceptanceState} did not match requested ${request.filters.acceptanceState}`,
      );
    }
    if (request.filters.runtimeId !== undefined && item.runtimeId !== request.filters.runtimeId) {
      fail(`private_paper_runtime_cycles response runtimeId ${item.runtimeId} did not match requested ${request.filters.runtimeId}`);
    }
    if (request.filters.queueName !== undefined && item.job.queueName !== request.filters.queueName) {
      fail(`private_paper_runtime_cycles response queueName ${item.job.queueName} did not match requested ${request.filters.queueName}`);
    }
    if (
      request.filters.schedulerCheckpointId !== undefined
      && item.provenance.schedulerCheckpoint.schedulerCheckpointId !== request.filters.schedulerCheckpointId
    ) {
      fail(
        `private_paper_runtime_cycles response schedulerCheckpointId ${item.provenance.schedulerCheckpoint.schedulerCheckpointId} did not match requested ${request.filters.schedulerCheckpointId}`,
      );
    }
    if (
      request.filters.upstreamLockRecordId !== undefined
      && item.provenance.upstreamLockRecordId !== request.filters.upstreamLockRecordId
    ) {
      fail(
        `private_paper_runtime_cycles response upstreamLockRecordId ${item.provenance.upstreamLockRecordId} did not match requested ${request.filters.upstreamLockRecordId}`,
      );
    }
  }
  return response;
}

function assertPinnedStrategyExportsResponseMatchesRequest(
  response: BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>,
  request: BwsPinnedStrategyExportQueryRequest,
): BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem> {
  for (const item of response.page.items) {
    if (request.filters.endpointId !== undefined && item.record.endpointId !== request.filters.endpointId) {
      fail(`pinned_strategy_exports response endpointId ${item.record.endpointId} did not match requested ${request.filters.endpointId}`);
    }
    if (request.filters.exportId !== undefined && item.record.exportId !== request.filters.exportId) {
      fail(`pinned_strategy_exports response exportId ${item.record.exportId} did not match requested ${request.filters.exportId}`);
    }
    if (request.filters.importRunId !== undefined && item.record.importRunId !== request.filters.importRunId) {
      fail(`pinned_strategy_exports response importRunId ${item.record.importRunId} did not match requested ${request.filters.importRunId}`);
    }
    if (request.filters.providerId !== undefined && item.record.providerId !== request.filters.providerId) {
      fail(`pinned_strategy_exports response providerId ${item.record.providerId} did not match requested ${request.filters.providerId}`);
    }
    if (request.filters.sourceSha256 !== undefined && item.record.sourceSha256 !== request.filters.sourceSha256) {
      fail(`pinned_strategy_exports response sourceSha256 ${item.record.sourceSha256} did not match requested ${request.filters.sourceSha256}`);
    }
    if (
      request.filters.upstreamLockRecordId !== undefined
      && item.provenance.upstreamLockRecordId !== request.filters.upstreamLockRecordId
    ) {
      fail(
        `pinned_strategy_exports response upstreamLockRecordId ${item.provenance.upstreamLockRecordId} did not match requested ${request.filters.upstreamLockRecordId}`,
      );
    }
  }
  return response;
}

function defaultFetchLike(): BwsOperatorCockpitFetchLike {
  return async (input, init) => {
    const response = await fetch(input, init);
    return Object.freeze({
      ok: response.ok,
      status: response.status,
      async text() {
        return response.text();
      },
    });
  };
}

export async function readOnlyGetJson<T>(
  path: string,
  fetchImpl: BwsOperatorCockpitFetchLike,
): Promise<T> {
  const response = await fetchImpl(path, {
    headers: { accept: JSON_CONTENT_TYPE },
    method: 'GET',
  });
  const payloadText = await response.text();
  if (!response.ok) {
    fail(buildErrorMessage(path, response.status, payloadText));
  }
  try {
    return JSON.parse(payloadText) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`BWS cockpit GET ${path} returned invalid JSON: ${message}`);
  }
}

export function createBwsOperatorCockpitApiClient(
  configuration: Extract<BwsOperatorCockpitBrowserConfig, { dataMode: 'api' }>,
  fetchImpl: BwsOperatorCockpitFetchLike = defaultFetchLike(),
): BwsOperatorCockpitApiClient {
  const apiBaseUrl = normalizeBwsOperatorCockpitApiBaseUrl(configuration.apiBaseUrl);
  return Object.freeze({
    async queryB1BacktestRuns(
      request: BwsB1BacktestRunQueryRequest,
    ) {
      const path = buildB1BacktestRunsUrl(apiBaseUrl, request);
      const response = await readOnlyGetJson<unknown>(path, fetchImpl);
      return assertB1BacktestRunsResponseMatchesRequest(
        assertReadOnlyQueryResponse<'b1_backtest_runs', BwsB1BacktestRunItem>(
          response,
          'b1_backtest_runs',
        ),
        request,
      );
    },
    async queryPrivatePaperRuntimeCycles(
      request: BwsPrivatePaperRuntimeCycleQueryRequest,
    ) {
      const path = buildPrivatePaperRuntimeCyclesUrl(apiBaseUrl, request);
      const response = await readOnlyGetJson<unknown>(path, fetchImpl);
      return assertPrivatePaperRuntimeCyclesResponseMatchesRequest(
        assertReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>(
          response,
          'private_paper_runtime_cycles',
        ),
        request,
      );
    },
    async queryPinnedStrategyExports(
      request: BwsPinnedStrategyExportQueryRequest,
    ) {
      const path = buildPinnedStrategyExportsUrl(apiBaseUrl, request);
      const response = await readOnlyGetJson<unknown>(path, fetchImpl);
      return assertPinnedStrategyExportsResponseMatchesRequest(
        assertReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>(
          response,
          'pinned_strategy_exports',
        ),
        request,
      );
    },
    async queryStrategyLedger(
      request: BwsStrategyLedgerQueryRequest,
    ) {
      const path = buildStrategyLedgerUrl(apiBaseUrl, request);
      const response = await readOnlyGetJson<unknown>(path, fetchImpl);
      return assertStrategyLedgerResponseMatchesRequest(
        assertReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>(
          response,
          'strategy_ledger_entries',
        ),
        request,
      );
    },
  });
}

export async function loadBwsOperatorCockpitSnapshot(
  configuration: BwsOperatorCockpitBrowserConfig,
  request: LoadBwsOperatorCockpitSnapshotRequest,
  fetchImpl: BwsOperatorCockpitFetchLike = defaultFetchLike(),
): Promise<BwsOperatorCockpitSnapshot> {
  if (configuration.dataMode === 'mock') {
    const mockSnapshot = createMockBwsOperatorCockpitSnapshot();
    if (!request.includePinnedStrategyExports) {
      return mockSnapshot;
    }
    if (request.evidenceScope === undefined) {
      return Object.freeze({
        acceptedBacktests: mockSnapshot.acceptedBacktests,
        acceptedPaperRuns: mockSnapshot.acceptedPaperRuns,
        acceptedRuntimeCycles: mockSnapshot.acceptedRuntimeCycles,
        b1BacktestRuns: mockSnapshot.b1BacktestRuns,
        blockedBacktests: mockSnapshot.blockedBacktests,
        blockedPaperRuns: mockSnapshot.blockedPaperRuns,
        blockedRuntimeCycles: mockSnapshot.blockedRuntimeCycles,
      });
    }
    return Object.freeze({
      ...mockSnapshot,
      pinnedExportScope: request.evidenceScope,
    });
  }

  const client = createBwsOperatorCockpitApiClient(configuration, fetchImpl);
  const [
    acceptedBacktests,
    blockedBacktests,
    acceptedPaperRuns,
    blockedPaperRuns,
    acceptedRuntimeCycles,
    blockedRuntimeCycles,
    b1BacktestRuns,
    pinnedStrategyExports,
  ] = await Promise.all([
    client.queryStrategyLedger(
      createStrategyLedgerRequest('accepted_local_evidence', 'deterministic_standard_binary_backtest'),
    ),
    client.queryStrategyLedger(
      createStrategyLedgerRequest('blocked', 'deterministic_standard_binary_backtest'),
    ),
    client.queryStrategyLedger(
      createStrategyLedgerRequest('accepted_local_evidence', 'private_paper_runtime_cycle'),
    ),
    client.queryStrategyLedger(
      createStrategyLedgerRequest('blocked', 'private_paper_runtime_cycle'),
    ),
    client.queryPrivatePaperRuntimeCycles(
      createPrivatePaperRuntimeCycleRequest('accepted_local_evidence'),
    ),
    client.queryPrivatePaperRuntimeCycles(
      createPrivatePaperRuntimeCycleRequest('blocked'),
    ),
    client.queryB1BacktestRuns(
      createB1BacktestRunRequest(),
    ),
    request.includePinnedStrategyExports && request.evidenceScope !== undefined
      ? client.queryPinnedStrategyExports(
          Object.freeze({
            expand: 'provenance',
            filters: normalizeBwsOperatorCockpitPinnedExportScope(request.evidenceScope),
            pageSize: 8,
          } satisfies BwsPinnedStrategyExportQueryRequest),
        )
      : Promise.resolve(undefined),
  ]);

  return Object.freeze({
    acceptedBacktests,
    acceptedPaperRuns,
    acceptedRuntimeCycles,
    b1BacktestRuns,
    blockedBacktests,
    blockedPaperRuns,
    blockedRuntimeCycles,
    ...(request.includePinnedStrategyExports && request.evidenceScope !== undefined && pinnedStrategyExports !== undefined
      ? {
          pinnedExportScope: request.evidenceScope,
          pinnedStrategyExports,
        }
      : {}),
  });
}

export function describeBwsOperatorCockpitApiClientBoundary(): string {
  return `@betting-win-surebet/web:${BWS_OPERATOR_COCKPIT_API_CLIENT_PHASE}`;
}

export function readBwsOperatorCockpitEnvironmentSummary(): readonly string[] {
  return Object.freeze([
    `${BWS_OPERATOR_COCKPIT_DATA_MODE_ENV}=mock|api`,
    `${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV}=https://loopback.example.invalid`,
  ]);
}
