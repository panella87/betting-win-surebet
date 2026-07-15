import { createHash } from 'node:crypto';
import type { BettingWinUpstreamLock } from '../../../upstream/src/upstream/betting-win-upstream-lock.js';
import type {
  StandardBinaryBacktestAcceptedCandidateResult,
  StandardBinaryBacktestBlockedCandidateResult,
  StandardBinaryBacktestRun,
} from '../backtest/standard-binary-backtest.js';
import { accepted, blocked, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';
import type {
  PrivatePaperRuntimeAcceptedCandidateResult,
  PrivatePaperRuntimeBlockedCandidateResult,
  PrivatePaperRuntimeCycleResult,
} from '../runtime/private-paper-runtime.js';

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const LOWERCASE_SHA256_REGEX = /^[0-9a-f]{64}$/;
const SIGNED_INTEGER_STRING_REGEX = /^-?[0-9]+$/;
const FORBIDDEN_REPORT_TEXT_PATTERN = /(profit|profitable|execution|ready|signal)/i;
const STRATEGY_REPORT_STATEMENT =
  'private deterministic surebet strategy evidence only; excludes public distribution, wallet actions, and approval claims';
const STRATEGY_LEDGER_ENTRY_FIELDS = Object.freeze([
  'ledgerEntryId',
  'runKind',
  'runReferenceId',
  'runFingerprintSha256',
  'sourceKind',
  'sourceManifestHash',
  'reportKind',
  'reportId',
  'reportSha256',
  'acceptanceState',
  'settlementState',
  'privacy',
  'profitabilityState',
  'publicDistributionState',
  'liveState',
  'candidateCount',
  'blockedCandidateCount',
  'blockerCount',
  'report',
]);
const STRATEGY_REPORT_FIELDS = Object.freeze([
  'reportKind',
  'reportId',
  'runKind',
  'runReferenceId',
  'runFingerprintSha256',
  'sourceKind',
  'sourceManifestHash',
  'exportedAt',
  'upstream',
  'privacy',
  'profitabilityState',
  'publicDistributionState',
  'liveState',
  'acceptanceState',
  'settlementState',
  'candidateCount',
  'blockedCandidateCount',
  'blockerCount',
  'stopReason',
  'candidates',
  'statement',
]);
const STRATEGY_UPSTREAM_REFERENCE_FIELDS = Object.freeze([
  'repository',
  'commitSha',
  'gitTreeSha',
  'trackedTreeListingSha256',
  'contractSchema',
  'contractAlias',
  'surebetProfile',
]);
const STRATEGY_CANDIDATE_REPORT_FIELDS = Object.freeze([
  'candidateId',
  'canonicalMarketId',
  'resultState',
  'blockerCodes',
  'blockerCount',
  'completionGroupState',
  'settledNetMinor',
  'finalOutcome',
  'killReason',
]);

export type SurebetStrategyRunKind =
  | 'deterministic_standard_binary_backtest'
  | 'private_paper_runtime_cycle';

export type SurebetStrategySourceKind =
  | 'resource_export'
  | 'pinned_records'
  | 'read_only_query';

export type SurebetStrategyAcceptanceState =
  | 'blocked'
  | 'accepted_local_evidence';

export type SurebetStrategySettlementState =
  | 'blocked'
  | 'reconciled';

export interface SurebetStrategyUpstreamReference {
  readonly repository: string;
  readonly commitSha: string;
  readonly gitTreeSha: string;
  readonly trackedTreeListingSha256: string;
  readonly contractSchema: 'betting-win.strategy-export.v1';
  readonly contractAlias: 'betting-win-strategy-export.v1';
  readonly surebetProfile: 'surebet_standard_binary_v0';
}

export interface SurebetStrategyCandidateReport {
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly resultState: SurebetStrategyAcceptanceState;
  readonly blockerCodes: readonly string[];
  readonly blockerCount: number;
  readonly completionGroupState?: string;
  readonly settledNetMinor?: string;
  readonly finalOutcome?: 'yes' | 'no';
  readonly killReason?: PrivatePaperRuntimeAcceptedCandidateResult['killReason'];
}

export interface SurebetStrategyReport {
  readonly reportKind: 'surebet_strategy_report_v1';
  readonly reportId: string;
  readonly runKind: SurebetStrategyRunKind;
  readonly runReferenceId: string;
  readonly runFingerprintSha256: string;
  readonly sourceKind: SurebetStrategySourceKind;
  readonly sourceManifestHash: string;
  readonly exportedAt: IsoTimestamp;
  readonly upstream: SurebetStrategyUpstreamReference;
  readonly privacy: 'private_only';
  readonly profitabilityState: 'not_reported';
  readonly publicDistributionState: 'withheld';
  readonly liveState: 'not_claimed';
  readonly acceptanceState: SurebetStrategyAcceptanceState;
  readonly settlementState: SurebetStrategySettlementState;
  readonly candidateCount: number;
  readonly blockedCandidateCount: number;
  readonly blockerCount: number;
  readonly stopReason?: PrivatePaperRuntimeCycleResult['stopReason'];
  readonly candidates: readonly SurebetStrategyCandidateReport[];
  readonly statement: string;
}

export interface SurebetStrategyLedgerEntry {
  readonly ledgerEntryId: string;
  readonly runKind: SurebetStrategyRunKind;
  readonly runReferenceId: string;
  readonly runFingerprintSha256: string;
  readonly sourceKind: SurebetStrategySourceKind;
  readonly sourceManifestHash: string;
  readonly reportKind: 'surebet_strategy_report_v1';
  readonly reportId: string;
  readonly reportSha256: string;
  readonly acceptanceState: SurebetStrategyAcceptanceState;
  readonly settlementState: SurebetStrategySettlementState;
  readonly privacy: 'private_only';
  readonly profitabilityState: 'not_reported';
  readonly publicDistributionState: 'withheld';
  readonly liveState: 'not_claimed';
  readonly candidateCount: number;
  readonly blockedCandidateCount: number;
  readonly blockerCount: number;
  readonly report: SurebetStrategyReport;
}

export function createBacktestStrategyLedgerEntry(
  input: {
    readonly upstreamLock: BettingWinUpstreamLock;
    readonly run: StandardBinaryBacktestRun;
  },
): BoundaryResult<SurebetStrategyLedgerEntry> {
  const upstreamReference = validateUpstreamReference(input.upstreamLock);
  if (!upstreamReference.ok) {
    return upstreamReference;
  }
  const runValidation = validateBacktestRun(input.run);
  if (!runValidation.ok) {
    return runValidation;
  }

  const candidateReports = Object.freeze(
    input.run.candidateResults
      .map((candidateResult) => toBacktestCandidateReport(candidateResult))
      .sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
  );
  const blockedCandidateCount = candidateReports.filter((candidate) => candidate.resultState === 'blocked').length;
  const blockerCount = candidateReports.reduce((count, candidate) => count + candidate.blockerCount, 0);
  const acceptanceState = blockedCandidateCount === 0 ? 'accepted_local_evidence' : 'blocked';
  const settlementState = acceptanceState === 'accepted_local_evidence' ? 'reconciled' : 'blocked';
  const reportFingerprint = input.run.runHash;
  const report = freezeStrategyReport({
    reportKind: 'surebet_strategy_report_v1',
    reportId: toStrategyReportId(input.run.runKind, reportFingerprint),
    runKind: input.run.runKind,
    runReferenceId: input.run.runHash,
    runFingerprintSha256: reportFingerprint,
    sourceKind: 'resource_export',
    sourceManifestHash: input.run.sourceManifestHash,
    exportedAt: input.run.exportedAt,
    upstream: upstreamReference.value,
    privacy: 'private_only',
    profitabilityState: 'not_reported',
    publicDistributionState: 'withheld',
    liveState: 'not_claimed',
    acceptanceState,
    settlementState,
    candidateCount: candidateReports.length,
    blockedCandidateCount,
    blockerCount,
    candidates: candidateReports,
    statement: STRATEGY_REPORT_STATEMENT,
  });

  return validateSurebetStrategyLedgerEntry(toLedgerEntry(report));
}

export function createPrivatePaperStrategyLedgerEntry(
  input: {
    readonly upstreamLock: BettingWinUpstreamLock;
    readonly cycle: PrivatePaperRuntimeCycleResult;
  },
): BoundaryResult<SurebetStrategyLedgerEntry> {
  const upstreamReference = validateUpstreamReference(input.upstreamLock);
  if (!upstreamReference.ok) {
    return upstreamReference;
  }
  const cycleValidation = validatePrivatePaperCycle(input.cycle);
  if (!cycleValidation.ok) {
    return cycleValidation;
  }

  const candidateReports = Object.freeze(
    input.cycle.candidateResults
      .map((candidateResult) => toPrivatePaperCandidateReport(candidateResult))
      .sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
  );
  const blockedCandidateCount = candidateReports.filter((candidate) => candidate.resultState === 'blocked').length;
  const blockerCount = candidateReports.reduce((count, candidate) => count + candidate.blockerCount, 0);
  const acceptanceState = blockedCandidateCount === 0 && input.cycle.stopReason === 'cycle_complete'
    ? 'accepted_local_evidence'
    : 'blocked';
  const settlementState = acceptanceState === 'accepted_local_evidence' ? 'reconciled' : 'blocked';
  const report = freezeStrategyReport({
    reportKind: 'surebet_strategy_report_v1',
    reportId: toStrategyReportId(input.cycle.runtimeKind, input.cycle.cycleFingerprint),
    runKind: input.cycle.runtimeKind,
    runReferenceId: `${input.cycle.runtimeId}:${input.cycle.cycleId}`,
    runFingerprintSha256: input.cycle.cycleFingerprint,
    sourceKind: input.cycle.sourceKind,
    sourceManifestHash: input.cycle.sourceManifestHash,
    exportedAt: input.cycle.exportedAt,
    upstream: upstreamReference.value,
    privacy: 'private_only',
    profitabilityState: 'not_reported',
    publicDistributionState: 'withheld',
    liveState: 'not_claimed',
    acceptanceState,
    settlementState,
    candidateCount: candidateReports.length,
    blockedCandidateCount,
    blockerCount,
    stopReason: input.cycle.stopReason,
    candidates: candidateReports,
    statement: STRATEGY_REPORT_STATEMENT,
  });

  return validateSurebetStrategyLedgerEntry(toLedgerEntry(report));
}

export function validateSurebetStrategyLedgerEntry(
  entry: SurebetStrategyLedgerEntry,
): BoundaryResult<SurebetStrategyLedgerEntry> {
  const structuralValidation = validateStrategyLedgerEntryStructure(entry);
  if (!structuralValidation.ok) {
    return structuralValidation;
  }
  return accepted(entry);
}

export function validateBacktestStrategyLedgerEntry(
  entry: SurebetStrategyLedgerEntry,
  run: StandardBinaryBacktestRun,
  upstreamLock: BettingWinUpstreamLock,
): BoundaryResult<undefined> {
  const structuralValidation = validateStrategyLedgerEntryStructure(entry);
  if (!structuralValidation.ok) {
    return structuralValidation;
  }
  const expected = createBacktestStrategyLedgerEntry({ run, upstreamLock });
  if (!expected.ok) {
    return expected;
  }
  return compareLedgerEntries(entry, expected.value, 'BACKTEST_STRATEGY_LEDGER_MISMATCH');
}

export function validatePrivatePaperStrategyLedgerEntry(
  entry: SurebetStrategyLedgerEntry,
  cycle: PrivatePaperRuntimeCycleResult,
  upstreamLock: BettingWinUpstreamLock,
): BoundaryResult<undefined> {
  const structuralValidation = validateStrategyLedgerEntryStructure(entry);
  if (!structuralValidation.ok) {
    return structuralValidation;
  }
  const expected = createPrivatePaperStrategyLedgerEntry({ cycle, upstreamLock });
  if (!expected.ok) {
    return expected;
  }
  return compareLedgerEntries(entry, expected.value, 'PRIVATE_PAPER_STRATEGY_LEDGER_MISMATCH');
}

export function hashSurebetStrategyReport(report: SurebetStrategyReport): string {
  return createHash('sha256').update(stableJsonCompact(report)).digest('hex');
}

function validateStrategyLedgerEntryStructure(
  entry: SurebetStrategyLedgerEntry,
): BoundaryResult<undefined> {
  const unsupportedEntryFields = findUnsupportedFields(
    entry as unknown as Record<string, unknown>,
    STRATEGY_LEDGER_ENTRY_FIELDS,
  );
  if (unsupportedEntryFields.length > 0) {
    return blocked(
      'STRATEGY_LEDGER_ENTRY_FIELDS_UNSUPPORTED',
      'Surebet strategy ledger entries must reject unsupported fields to keep run evidence immutable.',
      'A strategy ledger entry payload containing only the supported deterministic fields.',
    );
  }
  const reportValidation = validateReportStructure(entry.report);
  if (!reportValidation.ok) {
    return reportValidation;
  }
  if (entry.ledgerEntryId !== toStrategyLedgerEntryId(entry.runKind, entry.runFingerprintSha256)) {
    return blocked(
      'STRATEGY_LEDGER_ENTRY_ID_INVALID',
      'Surebet strategy ledger entries must derive ledgerEntryId deterministically from the run kind and run fingerprint.',
      'Deterministic surebet strategy ledger entry ids derived from the report fingerprint.',
    );
  }
  if (entry.reportSha256 !== hashSurebetStrategyReport(entry.report)) {
    return blocked(
      'STRATEGY_LEDGER_REPORT_SHA_MISMATCH',
      'Surebet strategy ledger entries must keep reportSha256 aligned with the canonical report serialization.',
      'Surebet strategy report SHA-256 derived from the canonical report payload.',
    );
  }
  if (entry.runKind !== entry.report.runKind
    || entry.runReferenceId !== entry.report.runReferenceId
    || entry.runFingerprintSha256 !== entry.report.runFingerprintSha256
    || entry.sourceKind !== entry.report.sourceKind
    || entry.sourceManifestHash !== entry.report.sourceManifestHash
    || entry.reportKind !== entry.report.reportKind
    || entry.reportId !== entry.report.reportId
    || entry.acceptanceState !== entry.report.acceptanceState
    || entry.settlementState !== entry.report.settlementState
    || entry.privacy !== entry.report.privacy
    || entry.profitabilityState !== entry.report.profitabilityState
    || entry.publicDistributionState !== entry.report.publicDistributionState
    || entry.liveState !== entry.report.liveState
    || entry.candidateCount !== entry.report.candidateCount
    || entry.blockedCandidateCount !== entry.report.blockedCandidateCount
    || entry.blockerCount !== entry.report.blockerCount) {
    return blocked(
      'STRATEGY_LEDGER_ENTRY_REPORT_MISMATCH',
      'Surebet strategy ledger entry summary fields must stay aligned with the persisted private report payload.',
      'Surebet strategy ledger entry fields copied deterministically from the private report payload.',
    );
  }
  return accepted(undefined);
}

function validateReportStructure(report: SurebetStrategyReport): BoundaryResult<undefined> {
  const unsupportedReportFields = findUnsupportedFields(
    report as unknown as Record<string, unknown>,
    STRATEGY_REPORT_FIELDS,
  );
  if (unsupportedReportFields.length > 0) {
    return blocked(
      'STRATEGY_LEDGER_REPORT_FIELDS_UNSUPPORTED',
      'Surebet strategy ledger reports must reject unsupported fields to keep report evidence immutable.',
      'A strategy report payload containing only the supported deterministic fields.',
    );
  }
  const unsupportedUpstreamFields = findUnsupportedFields(
    report.upstream as unknown as Record<string, unknown>,
    STRATEGY_UPSTREAM_REFERENCE_FIELDS,
  );
  if (unsupportedUpstreamFields.length > 0) {
    return blocked(
      'STRATEGY_LEDGER_UPSTREAM_FIELDS_UNSUPPORTED',
      'Surebet strategy ledger upstream references must reject unsupported fields to keep provenance deterministic.',
      'An upstream reference payload containing only repository, commit, tree, schema, alias, profile, and tracked-tree evidence.',
    );
  }
  if (report.reportKind !== 'surebet_strategy_report_v1') {
    return blocked(
      'STRATEGY_LEDGER_REPORT_KIND_INVALID',
      'Surebet strategy ledger reports must use the surebet_strategy_report_v1 kind.',
      'A surebet strategy report payload with reportKind=surebet_strategy_report_v1.',
    );
  }
  if (!isIdentifier(report.reportId)) {
    return blocked(
      'STRATEGY_LEDGER_REPORT_ID_INVALID',
      'Surebet strategy ledger reports must use a deterministic non-empty report id.',
      'A deterministic surebet strategy report id.',
    );
  }
  if (!isIdentifier(report.runReferenceId)) {
    return blocked(
      'STRATEGY_LEDGER_RUN_REFERENCE_ID_INVALID',
      'Surebet strategy ledger reports must use a deterministic non-empty run reference id.',
      'A deterministic backtest or private-paper run reference id.',
    );
  }
  if (!LOWERCASE_SHA256_REGEX.test(report.runFingerprintSha256)) {
    return blocked(
      'STRATEGY_LEDGER_RUN_FINGERPRINT_INVALID',
      'Surebet strategy ledger reports must use a 64-character lower-case run fingerprint.',
      'A 64-character lower-case backtest run hash or private-paper cycle fingerprint.',
    );
  }
  if (!LOWERCASE_SHA256_REGEX.test(report.sourceManifestHash)) {
    return blocked(
      'STRATEGY_LEDGER_SOURCE_MANIFEST_HASH_INVALID',
      'Surebet strategy ledger reports must use a 64-character lower-case source manifest hash.',
      'A 64-character lower-case source manifest hash from the pinned bundle or read-only query source.',
    );
  }
  if (!ISO_TIMESTAMP_REGEX.test(report.exportedAt) || Number.isNaN(Date.parse(report.exportedAt))) {
    return blocked(
      'STRATEGY_LEDGER_EXPORTED_AT_INVALID',
      'Surebet strategy ledger reports must use an ISO-8601 UTC exportedAt timestamp.',
      'An ISO-8601 UTC exportedAt timestamp from the run evidence.',
    );
  }
  if (report.privacy !== 'private_only'
    || report.profitabilityState !== 'not_reported'
    || report.publicDistributionState !== 'withheld'
    || report.liveState !== 'not_claimed') {
    return blocked(
      'STRATEGY_LEDGER_POLICY_STATE_INVALID',
      'Surebet strategy ledger reports must remain private, with profitability withheld and no live claim.',
      'Private-only strategy reports with profitabilityState=not_reported, publicDistributionState=withheld, and liveState=not_claimed.',
    );
  }
  if (report.statement !== STRATEGY_REPORT_STATEMENT) {
    return blocked(
      'STRATEGY_LEDGER_STATEMENT_INVALID',
      'Surebet strategy ledger reports must carry the fixed private-evidence statement.',
      'The fixed private surebet strategy evidence statement.',
    );
  }
  if (!Number.isSafeInteger(report.candidateCount) || report.candidateCount <= 0) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_COUNT_INVALID',
      'Surebet strategy ledger reports must include a positive integer candidateCount.',
      'A positive integer candidateCount derived from the run evidence.',
    );
  }
  if (!Number.isSafeInteger(report.blockedCandidateCount)
    || report.blockedCandidateCount < 0
    || report.blockedCandidateCount > report.candidateCount) {
    return blocked(
      'STRATEGY_LEDGER_BLOCKED_CANDIDATE_COUNT_INVALID',
      'Surebet strategy ledger reports must keep blockedCandidateCount as a bounded non-negative integer.',
      'A blockedCandidateCount that stays between zero and candidateCount.',
    );
  }
  if (!Number.isSafeInteger(report.blockerCount) || report.blockerCount < 0) {
    return blocked(
      'STRATEGY_LEDGER_BLOCKER_COUNT_INVALID',
      'Surebet strategy ledger reports must keep blockerCount as a non-negative integer.',
      'A non-negative blockerCount derived from the candidate blocker codes.',
    );
  }
  if (report.candidates.length !== report.candidateCount) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_SUMMARY_COUNT_MISMATCH',
      'Surebet strategy ledger reports must keep candidateCount aligned with the candidate summaries.',
      'Candidate summaries whose count matches candidateCount.',
    );
  }
  const computedBlockedCandidateCount = report.candidates.filter((candidate) => candidate.resultState === 'blocked').length;
  if (computedBlockedCandidateCount !== report.blockedCandidateCount) {
    return blocked(
      'STRATEGY_LEDGER_BLOCKED_CANDIDATE_COUNT_MISMATCH',
      'Surebet strategy ledger reports must keep blockedCandidateCount aligned with candidate acceptance states.',
      'Candidate acceptance states whose blocked count matches blockedCandidateCount.',
    );
  }
  const computedBlockerCount = report.candidates.reduce((count, candidate) => count + candidate.blockerCount, 0);
  if (computedBlockerCount !== report.blockerCount) {
    return blocked(
      'STRATEGY_LEDGER_BLOCKER_COUNT_MISMATCH',
      'Surebet strategy ledger reports must keep blockerCount aligned with the candidate blocker summaries.',
      'Candidate blocker summaries whose combined blockerCount matches the report.',
    );
  }
  if (!isSortedUnique(report.candidates.map((candidate) => candidate.candidateId))) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_ORDER_INVALID',
      'Surebet strategy ledger reports must keep candidate summaries in deterministic unique candidateId order.',
      'Candidate summaries sorted uniquely by candidateId.',
    );
  }
  for (const candidate of report.candidates) {
    const candidateValidation = validateCandidateReport(report.runKind, candidate);
    if (!candidateValidation.ok) {
      return candidateValidation;
    }
  }
  if (report.acceptanceState === 'accepted_local_evidence') {
    if (report.blockedCandidateCount !== 0 || report.blockerCount !== 0 || report.settlementState !== 'reconciled') {
      return blocked(
        'STRATEGY_LEDGER_ACCEPTANCE_STATE_INVALID',
        'Surebet strategy ledger accepted_local_evidence reports must have zero blockers and reconciled settlement state.',
        'Accepted-local-evidence reports with zero blocked candidates, zero blockers, and settlementState=reconciled.',
      );
    }
  } else if (report.settlementState !== 'blocked') {
    return blocked(
      'STRATEGY_LEDGER_SETTLEMENT_STATE_INVALID',
      'Surebet strategy ledger blocked reports must keep settlementState=blocked.',
      'Blocked strategy reports with settlementState=blocked.',
    );
  }
  if (report.runKind === 'deterministic_standard_binary_backtest' && report.stopReason !== undefined) {
    return blocked(
      'STRATEGY_LEDGER_STOP_REASON_INVALID',
      'Surebet strategy ledger backtest reports must not carry a private-paper stopReason.',
      'Backtest strategy reports without a private-paper stopReason.',
    );
  }
  if (report.runKind === 'private_paper_runtime_cycle' && report.stopReason === undefined) {
    return blocked(
      'STRATEGY_LEDGER_STOP_REASON_MISSING',
      'Surebet strategy ledger private-paper reports must carry the private-paper stopReason.',
      'Private-paper strategy reports with stopReason copied from the runtime cycle.',
    );
  }
  if (report.runKind === 'private_paper_runtime_cycle'
    && report.acceptanceState === 'blocked'
    && report.blockerCount === 0
    && report.stopReason !== 'kill_triggered') {
    return blocked(
      'STRATEGY_LEDGER_BLOCKED_STATE_AMBIGUOUS',
      'Surebet strategy ledger blocked private-paper reports without blocker codes must be backed by an explicit kill_triggered stopReason.',
      'A blocked private-paper strategy report with either blocker codes or stopReason=kill_triggered.',
    );
  }
  for (const text of collectStrings(report)) {
    if (FORBIDDEN_REPORT_TEXT_PATTERN.test(text)) {
      return blocked(
        'STRATEGY_LEDGER_FORBIDDEN_LANGUAGE',
        'Surebet strategy ledger reports must not contain profitability, execution, readiness, or signal language.',
        'Private strategy reports without forbidden profitability, execution, readiness, or signal language.',
      );
    }
  }
  return accepted(undefined);
}

function compareLedgerEntries(
  actual: SurebetStrategyLedgerEntry,
  expected: SurebetStrategyLedgerEntry,
  code: string,
): BoundaryResult<undefined> {
  if (stableJsonCompact(actual) !== stableJsonCompact(expected)) {
    return blocked(
      code,
      'Surebet strategy ledger evidence must remain byte-for-byte deterministic for the same run provenance and upstream lock.',
      'Deterministic strategy ledger evidence whose canonical serialization matches the expected run-derived payload.',
    );
  }
  return accepted(undefined);
}

function validateCandidateReport(
  runKind: SurebetStrategyRunKind,
  candidate: SurebetStrategyCandidateReport,
): BoundaryResult<undefined> {
  const unsupportedCandidateFields = findUnsupportedFields(
    candidate as unknown as Record<string, unknown>,
    STRATEGY_CANDIDATE_REPORT_FIELDS,
  );
  if (unsupportedCandidateFields.length > 0) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_FIELDS_UNSUPPORTED',
      'Surebet strategy ledger candidate summaries must reject unsupported fields to keep report evidence immutable.',
      'A candidate summary payload containing only the supported deterministic fields.',
    );
  }
  if (!isIdentifier(candidate.candidateId) || !isIdentifier(candidate.canonicalMarketId)) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_IDENTIFIER_INVALID',
      'Surebet strategy ledger candidate summaries must use deterministic non-empty candidate and canonical market ids.',
      'Candidate summaries with deterministic candidateId and canonicalMarketId values.',
    );
  }
  if (!Number.isSafeInteger(candidate.blockerCount) || candidate.blockerCount < 0) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_BLOCKER_COUNT_INVALID',
      'Surebet strategy ledger candidate summaries must keep blockerCount as a bounded non-negative integer.',
      'Candidate summaries whose blockerCount is a non-negative integer.',
    );
  }
  if (candidate.blockerCodes.length !== candidate.blockerCount) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_BLOCKER_COUNT_MISMATCH',
      'Surebet strategy ledger candidate summaries must keep blockerCount aligned with blockerCodes.',
      'Candidate summaries whose blockerCount matches blockerCodes.',
    );
  }
  if (!isSortedUnique(candidate.blockerCodes)) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_BLOCKER_CODES_INVALID',
      'Surebet strategy ledger candidate summaries must keep blockerCodes sorted uniquely.',
      'Candidate summaries with blockerCodes sorted uniquely.',
    );
  }
  if (candidate.resultState === 'accepted_local_evidence') {
    if (candidate.blockerCount !== 0
      || candidate.blockerCodes.length !== 0
      || typeof candidate.completionGroupState !== 'string'
      || candidate.completionGroupState.trim().length === 0
      || candidate.settledNetMinor === undefined
      || !SIGNED_INTEGER_STRING_REGEX.test(candidate.settledNetMinor)
      || (candidate.finalOutcome !== 'yes' && candidate.finalOutcome !== 'no')) {
      return blocked(
        'STRATEGY_LEDGER_CANDIDATE_ACCEPTANCE_STATE_INVALID',
        'Surebet strategy ledger accepted candidate summaries must include reconciled settlement evidence and no blocker codes.',
        'Accepted candidate summaries with zero blockers plus completionGroupState, settledNetMinor, and finalOutcome evidence.',
      );
    }
    if (runKind === 'deterministic_standard_binary_backtest' && candidate.killReason !== undefined) {
      return blocked(
        'STRATEGY_LEDGER_CANDIDATE_KILL_REASON_INVALID',
        'Surebet strategy ledger backtest candidate summaries must not carry private-paper kill metadata.',
        'Backtest candidate summaries without private-paper kill metadata.',
      );
    }
    return accepted(undefined);
  }
  if (candidate.blockerCount === 0
    || candidate.completionGroupState !== undefined
    || candidate.settledNetMinor !== undefined
    || candidate.finalOutcome !== undefined
    || candidate.killReason !== undefined) {
    return blocked(
      'STRATEGY_LEDGER_CANDIDATE_ACCEPTANCE_STATE_INVALID',
      'Surebet strategy ledger blocked candidate summaries must carry explicit blocker codes and no accepted-settlement fields.',
      'Blocked candidate summaries with blocker codes only, without accepted settlement evidence fields.',
    );
  }
  return accepted(undefined);
}

function validateBacktestRun(run: StandardBinaryBacktestRun): BoundaryResult<undefined> {
  if (run.runKind !== 'deterministic_standard_binary_backtest') {
    return blocked(
      'STRATEGY_LEDGER_BACKTEST_KIND_INVALID',
      'Surebet strategy ledger backtest evidence requires runKind=deterministic_standard_binary_backtest.',
      'A deterministic standard-binary backtest run.',
    );
  }
  if (!LOWERCASE_SHA256_REGEX.test(run.runHash) || !LOWERCASE_SHA256_REGEX.test(run.sourceManifestHash)) {
    return blocked(
      'STRATEGY_LEDGER_BACKTEST_PROVENANCE_INVALID',
      'Surebet strategy ledger backtest evidence requires lower-case SHA-256 run and source hashes.',
      'Backtest runHash and sourceManifestHash in lower-case SHA-256 format.',
    );
  }
  if (!ISO_TIMESTAMP_REGEX.test(run.exportedAt) || Number.isNaN(Date.parse(run.exportedAt))) {
    return blocked(
      'STRATEGY_LEDGER_BACKTEST_EXPORTED_AT_INVALID',
      'Surebet strategy ledger backtest evidence requires an ISO-8601 UTC exportedAt timestamp.',
      'Backtest exportedAt in ISO-8601 UTC format.',
    );
  }
  if (run.candidateResults.length === 0
    || run.acceptedCandidateCount + run.blockedCandidateCount !== run.candidateResults.length) {
    return blocked(
      'STRATEGY_LEDGER_BACKTEST_COUNTS_INVALID',
      'Surebet strategy ledger backtest evidence requires non-empty candidate results with aligned accepted and blocked counts.',
      'Backtest candidate results whose accepted and blocked counts sum to the candidate result count.',
    );
  }
  return accepted(undefined);
}

function validatePrivatePaperCycle(cycle: PrivatePaperRuntimeCycleResult): BoundaryResult<undefined> {
  if (cycle.runtimeKind !== 'private_paper_runtime_cycle') {
    return blocked(
      'STRATEGY_LEDGER_PRIVATE_PAPER_KIND_INVALID',
      'Surebet strategy ledger private-paper evidence requires runtimeKind=private_paper_runtime_cycle.',
      'A bounded private-paper runtime cycle result.',
    );
  }
  if (!LOWERCASE_SHA256_REGEX.test(cycle.cycleFingerprint) || !LOWERCASE_SHA256_REGEX.test(cycle.sourceManifestHash)) {
    return blocked(
      'STRATEGY_LEDGER_PRIVATE_PAPER_PROVENANCE_INVALID',
      'Surebet strategy ledger private-paper evidence requires lower-case SHA-256 cycle and source hashes.',
      'Private-paper cycleFingerprint and sourceManifestHash in lower-case SHA-256 format.',
    );
  }
  if (!ISO_TIMESTAMP_REGEX.test(cycle.exportedAt) || Number.isNaN(Date.parse(cycle.exportedAt))) {
    return blocked(
      'STRATEGY_LEDGER_PRIVATE_PAPER_EXPORTED_AT_INVALID',
      'Surebet strategy ledger private-paper evidence requires an ISO-8601 UTC exportedAt timestamp.',
      'Private-paper exportedAt in ISO-8601 UTC format.',
    );
  }
  if (cycle.candidateResults.length === 0
    || cycle.candidateResults.length !== cycle.candidateCount
    || cycle.blockedCandidateCount < 0
    || cycle.blockedCandidateCount > cycle.candidateCount) {
    return blocked(
      'STRATEGY_LEDGER_PRIVATE_PAPER_COUNTS_INVALID',
      'Surebet strategy ledger private-paper evidence requires non-empty candidate results with aligned candidate counts.',
      'Private-paper candidate results whose count matches candidateCount and bounds blockedCandidateCount.',
    );
  }
  return accepted(undefined);
}

function validateUpstreamReference(
  upstreamLock: BettingWinUpstreamLock,
): BoundaryResult<SurebetStrategyUpstreamReference> {
  if (upstreamLock.contractSchema !== 'betting-win.strategy-export.v1'
    || upstreamLock.contractAlias !== 'betting-win-strategy-export.v1'
    || upstreamLock.surebetProfile !== 'surebet_standard_binary_v0'
    || upstreamLock.sourceView !== 'committed_git_head'
    || !LOWERCASE_SHA256_REGEX.test(upstreamLock.trackedTreeListingSha256)
    || !/^[0-9a-f]{40}$/.test(upstreamLock.commitSha)
    || !/^[0-9a-f]{40}$/.test(upstreamLock.gitTreeSha)
    || upstreamLock.repository.trim().length === 0) {
    return blocked(
      'STRATEGY_LEDGER_UPSTREAM_LOCK_INVALID',
      'Surebet strategy ledger evidence requires the validated committed-HEAD betting-win upstream lock contract.',
      'A committed-HEAD betting-win upstream lock with schema, alias, profile, commit, tree, and tracked-tree fingerprint evidence.',
    );
  }
  return accepted(
    Object.freeze({
      repository: upstreamLock.repository,
      commitSha: upstreamLock.commitSha,
      gitTreeSha: upstreamLock.gitTreeSha,
      trackedTreeListingSha256: upstreamLock.trackedTreeListingSha256,
      contractSchema: upstreamLock.contractSchema,
      contractAlias: upstreamLock.contractAlias,
      surebetProfile: upstreamLock.surebetProfile,
    }),
  );
}

function toLedgerEntry(report: SurebetStrategyReport): SurebetStrategyLedgerEntry {
  return Object.freeze({
    ledgerEntryId: toStrategyLedgerEntryId(report.runKind, report.runFingerprintSha256),
    runKind: report.runKind,
    runReferenceId: report.runReferenceId,
    runFingerprintSha256: report.runFingerprintSha256,
    sourceKind: report.sourceKind,
    sourceManifestHash: report.sourceManifestHash,
    reportKind: report.reportKind,
    reportId: report.reportId,
    reportSha256: hashSurebetStrategyReport(report),
    acceptanceState: report.acceptanceState,
    settlementState: report.settlementState,
    privacy: report.privacy,
    profitabilityState: report.profitabilityState,
    publicDistributionState: report.publicDistributionState,
    liveState: report.liveState,
    candidateCount: report.candidateCount,
    blockedCandidateCount: report.blockedCandidateCount,
    blockerCount: report.blockerCount,
    report,
  });
}

function toStrategyReportId(runKind: SurebetStrategyRunKind, runFingerprintSha256: string): string {
  return `surebet-strategy-report.${runKind}.${runFingerprintSha256.slice(0, 12)}`;
}

function toStrategyLedgerEntryId(runKind: SurebetStrategyRunKind, runFingerprintSha256: string): string {
  return `surebet-strategy-ledger.${runKind}.${runFingerprintSha256}`;
}

function toBacktestCandidateReport(
  candidateResult: StandardBinaryBacktestAcceptedCandidateResult | StandardBinaryBacktestBlockedCandidateResult,
): SurebetStrategyCandidateReport {
  if (!candidateResult.ok) {
    return Object.freeze({
      candidateId: candidateResult.candidateId,
      canonicalMarketId: candidateResult.canonicalMarketId,
      resultState: 'blocked',
      blockerCodes: Object.freeze(candidateResult.blockers.map((blocker) => blocker.code).sort()),
      blockerCount: candidateResult.blockers.length,
    });
  }
  return Object.freeze({
    candidateId: candidateResult.candidateId,
    canonicalMarketId: candidateResult.canonicalMarketId,
    resultState: 'accepted_local_evidence',
    blockerCodes: Object.freeze([]),
    blockerCount: 0,
    completionGroupState: candidateResult.completionGroupState,
    settledNetMinor: candidateResult.settledNetMinor.toString(),
    finalOutcome: candidateResult.settlement.finalOutcome,
  });
}

function toPrivatePaperCandidateReport(
  candidateResult: PrivatePaperRuntimeAcceptedCandidateResult | PrivatePaperRuntimeBlockedCandidateResult,
): SurebetStrategyCandidateReport {
  if (!candidateResult.ok) {
    return Object.freeze({
      candidateId: candidateResult.candidateId,
      canonicalMarketId: candidateResult.canonicalMarketId,
      resultState: 'blocked',
      blockerCodes: Object.freeze(candidateResult.blockers.map((blocker) => blocker.code).sort()),
      blockerCount: candidateResult.blockers.length,
    });
  }
  return Object.freeze({
    candidateId: candidateResult.candidateId,
    canonicalMarketId: candidateResult.canonicalMarketId,
    resultState: 'accepted_local_evidence',
    blockerCodes: Object.freeze([]),
    blockerCount: 0,
    completionGroupState: candidateResult.completionGroupState,
    settledNetMinor: candidateResult.settledNetMinor.toString(),
    finalOutcome: candidateResult.settlement.finalOutcome,
    ...(candidateResult.killReason === undefined ? {} : { killReason: candidateResult.killReason }),
  });
}

function freezeStrategyReport(report: SurebetStrategyReport): SurebetStrategyReport {
  return Object.freeze({
    ...report,
    upstream: Object.freeze({ ...report.upstream }),
    candidates: Object.freeze(
      report.candidates.map((candidate) =>
        Object.freeze({
          ...candidate,
          blockerCodes: Object.freeze([...candidate.blockerCodes]),
        }),
      ),
    ),
  });
}

function stableJsonCompact(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Non-finite number in strategy ledger payload.');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonCompact(entry)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonCompact(record[key])}`)
      .join(',')}}`;
  }
  throw new Error('Unsupported strategy ledger payload.');
}

function collectStrings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStrings(entry));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((entry) => collectStrings(entry));
  }
  return [];
}

function findUnsupportedFields(
  record: Record<string, unknown>,
  allowedFields: readonly string[],
): readonly string[] {
  const allowed = new Set(allowedFields);
  return Object.keys(record)
    .filter((key) => !allowed.has(key))
    .sort();
}

function isIdentifier(value: string): boolean {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{2,127}$/u.test(value);
}

function isSortedUnique(values: readonly string[]): boolean {
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (current === undefined || current.trim().length === 0) {
      return false;
    }
    if (index > 0) {
      const previous = values[index - 1];
      if (previous === undefined || previous >= current) {
        return false;
      }
    }
  }
  return true;
}
