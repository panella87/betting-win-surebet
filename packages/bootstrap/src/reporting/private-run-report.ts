import { accepted, blocked, FIRST_LANE_SPEC, type BoundaryResult, type FirstLaneId } from '../contracts/local-types.js';
import type { ConsumedSettlementReplay } from '../simulation/settlement-replay.js';
import type { PrivateCandidateReport } from './opportunity-report.js';

const MANIFEST_HASH_PATTERN = /^[0-9a-f]{64}$/;
const ISO_8601_UTC_MILLISECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const FORBIDDEN_REPORT_TEXT_PATTERN = /(profit|profitable|execution|ready|signal)/i;
const PRIVATE_RUN_REPORT_KEYS = new Set([
  'reportKind',
  'laneId',
  'runId',
  'sourceManifestHash',
  'accepted',
  'status',
  'candidateReports',
  'blockerCount',
  'settlement',
  'settlementSummaries',
]);
const BLOCKED_CANDIDATE_REPORT_KEYS = new Set([
  'reportKind',
  'laneId',
  'candidateId',
  'accepted',
  'status',
  'blockers',
]);
const OPPORTUNITY_CANDIDATE_REPORT_KEYS = new Set([
  'reportKind',
  'laneId',
  'candidateId',
  'accepted',
  'status',
  'blockers',
  'stakeVector',
  'residualExposure',
]);
const SETTLEMENT_SUMMARY_KEYS = new Set([
  'candidateId',
  'canonicalMarketId',
  'ruleProfileId',
  'resultSourceId',
  'finalityPolicyId',
  'finalityAuthorityId',
  'replayManifestHash',
  'replayAcceptedAt',
  'scenarioId',
  'finalOutcome',
]);
const STAKE_VECTOR_SUMMARY_KEYS = new Set(['stakes', 'scenarioNets', 'worstCaseNetMinor']);
const STAKE_VECTOR_STAKE_KEYS = new Set(['legId', 'unitCount', 'stakeQuantumMinor', 'stakeMinor']);
const SCENARIO_NET_SUMMARY_KEYS = new Set(['scenarioId', 'netMinor']);
const RESIDUAL_EXPOSURE_SUMMARY_KEYS = new Set([
  'groupState',
  'filledLegIds',
  'excludedLegIds',
  'scenarioNets',
  'worstCaseNetMinor',
]);

export interface PrivateRunSettlementSummary {
  readonly candidateId: string;
  readonly canonicalMarketId: string;
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
  readonly finalityAuthorityId: string;
  readonly replayManifestHash: string;
  readonly replayAcceptedAt: string;
  readonly scenarioId: string;
  readonly finalOutcome: 'yes' | 'no';
}

export interface PrivateRunReport {
  readonly reportKind: 'private_paper_run';
  readonly laneId: FirstLaneId;
  readonly runId: string;
  readonly sourceManifestHash: string;
  readonly accepted: false;
  readonly status: 'fixture_results_only';
  readonly candidateReports: readonly PrivateCandidateReport[];
  readonly blockerCount: number;
  readonly settlement?: PrivateRunSettlementSummary;
  readonly settlementSummaries?: readonly PrivateRunSettlementSummary[];
}

export function createPrivateRunReport(
  runId: string,
  sourceManifestHash: string,
  candidateReports: readonly PrivateCandidateReport[],
  settlements?: ConsumedSettlementReplay | readonly ConsumedSettlementReplay[],
): PrivateRunReport {
  if (runId.trim().length === 0) {
    throw new Error('Private run report requires a non-empty run id.');
  }
  if (!MANIFEST_HASH_PATTERN.test(sourceManifestHash)) {
    throw new Error('Private run report requires a 64-character lower-case source manifest hash.');
  }
  if (candidateReports.length === 0) {
    throw new Error('Private run report requires at least one candidate report.');
  }

  const sortedCandidateReports = [...candidateReports]
    .map((candidateReport) => cloneCandidateReport(candidateReport))
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));

  const report: PrivateRunReport = {
    reportKind: 'private_paper_run',
    laneId: FIRST_LANE_SPEC.laneId,
    runId,
    sourceManifestHash,
    accepted: false,
    status: 'fixture_results_only',
    candidateReports: Object.freeze(sortedCandidateReports),
    blockerCount: sortedCandidateReports.reduce(
      (currentBlockerCount, candidateReport) => currentBlockerCount + candidateReport.blockers.length,
      0,
    ),
  };

  const settlementSummaries = toSettlementSummaries(settlements);
  if (settlementSummaries.length === 0) {
    return Object.freeze(report);
  }

  const reportWithSettlementSummaries: PrivateRunReport = {
    ...report,
    settlementSummaries: Object.freeze(settlementSummaries),
  };

  if (settlementSummaries.length !== 1) {
    return Object.freeze(reportWithSettlementSummaries);
  }

  const singleSettlementSummary = settlementSummaries[0];
  if (singleSettlementSummary === undefined) {
    return Object.freeze(reportWithSettlementSummaries);
  }

  return Object.freeze({
    ...reportWithSettlementSummaries,
    settlement: singleSettlementSummary,
  });
}

export function validatePrivateRunReportArtifact(report: PrivateRunReport): BoundaryResult<undefined> {
  if (!isRecord(report)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SHAPE_INVALID',
      'Private paper-mode artifacts must be serialized objects.',
      'Serialized private paper-mode run artifact object.',
    );
  }
  if (!hasOnlySupportedFields(report, PRIVATE_RUN_REPORT_KEYS)) {
    return blocked(
      'PRIVATE_RUN_REPORT_UNSUPPORTED_FIELDS',
      'Private paper-mode artifacts must not retain unsupported run report fields.',
      'Serialized private paper-mode run artifact with only supported private fields.',
    );
  }
  if (report.reportKind !== 'private_paper_run') {
    return blocked(
      'PRIVATE_RUN_REPORT_KIND_INVALID',
      'Private paper-mode artifacts must use the private_paper_run report kind.',
      'Serialized private paper-mode run artifact with reportKind=private_paper_run.',
    );
  }
  if (report.laneId !== FIRST_LANE_SPEC.laneId) {
    return blocked(
      'PRIVATE_RUN_REPORT_LANE_ID_INVALID',
      'Private paper-mode artifacts must include the first-lane identifier.',
      'Serialized private paper-mode run artifact with the repo first-lane id.',
    );
  }
  if (!isNonEmptyString(report.runId)) {
    return blocked(
      'PRIVATE_RUN_REPORT_RUN_ID_MISSING',
      'Private paper-mode artifacts must include a non-empty run id.',
      'Serialized private paper-mode run artifact with a non-empty run id.',
    );
  }
  if (typeof report.sourceManifestHash !== 'string' || !MANIFEST_HASH_PATTERN.test(report.sourceManifestHash)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SOURCE_MANIFEST_HASH_INVALID',
      'Private paper-mode artifacts must include a 64-character lower-case source manifest hash.',
      'Serialized private paper-mode run artifact with the source bundle manifest hash.',
    );
  }
  if (report.accepted !== false) {
    return blocked(
      'PRIVATE_RUN_REPORT_ACCEPTED_FLAG_INVALID',
      'Private paper-mode artifacts must remain accepted=false.',
      'Serialized private paper-mode run artifact with accepted=false.',
    );
  }
  if (report.status !== 'fixture_results_only') {
    return blocked(
      'PRIVATE_RUN_REPORT_STATUS_INVALID',
      'Private paper-mode artifacts must remain fixture_results_only.',
      'Serialized private paper-mode run artifact with status=fixture_results_only.',
    );
  }
  if (!Array.isArray(report.candidateReports) || report.candidateReports.length === 0) {
    return blocked(
      'PRIVATE_RUN_REPORT_CANDIDATES_MISSING',
      'Private paper-mode artifacts must include at least one candidate report.',
      'Serialized private paper-mode run artifact with candidate reports.',
    );
  }

  const candidateIds = new Set<string>();
  let previousCandidateId: string | undefined;
  for (const candidateReport of report.candidateReports) {
    const candidateValidation = validatePrivateCandidateReportArtifact(candidateReport, candidateIds);
    if (!candidateValidation.ok) {
      return candidateValidation;
    }
    if (previousCandidateId !== undefined && previousCandidateId.localeCompare(candidateReport.candidateId) > 0) {
      return blocked(
        'PRIVATE_RUN_REPORT_CANDIDATES_ORDER_INVALID',
        'Private paper-mode candidate reports must remain sorted by candidate id.',
        'Serialized private paper-mode run artifact with candidateReports in producer canonical order.',
      );
    }
    previousCandidateId = candidateReport.candidateId;
    candidateIds.add(candidateReport.candidateId);
  }

  const computedBlockerCount = report.candidateReports.reduce(
    (currentBlockerCount, candidateReport) => currentBlockerCount + candidateReport.blockers.length,
    0,
  );
  if (report.blockerCount !== computedBlockerCount) {
    return blocked(
      'PRIVATE_RUN_REPORT_BLOCKER_COUNT_INVALID',
      'Private paper-mode artifacts must keep blockerCount aligned with candidate report blockers.',
      'Serialized private paper-mode run artifact with blockerCount matching the candidate reports.',
    );
  }

  const settlementSummaries = report.settlementSummaries;
  if (settlementSummaries !== undefined) {
    const settlementValidation = validatePrivateRunSettlementSummaries(settlementSummaries, candidateIds);
    if (!settlementValidation.ok) {
      return settlementValidation;
    }
    if (settlementSummaries.length === 1) {
      if (report.settlement === undefined) {
        return blocked(
          'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARY_MISMATCH',
          'Private paper-mode artifacts must keep legacy settlement aligned with single settlementSummaries entries.',
          'Serialized private paper-mode run artifact with aligned single-candidate settlement fields.',
        );
      }
      const singleSettlementSummary = settlementSummaries[0];
      if (singleSettlementSummary === undefined || !privateRunSettlementSummariesEqual(singleSettlementSummary, report.settlement)) {
        return blocked(
          'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARY_MISMATCH',
          'Private paper-mode artifacts must keep settlement and settlementSummaries aligned for single-candidate runs.',
          'Serialized private paper-mode run artifact with aligned single-candidate settlement fields.',
        );
      }
    }
  }
  if (report.settlement !== undefined) {
    const singleSettlementValidation = validatePrivateRunSettlementSummary(report.settlement, candidateIds);
    if (!singleSettlementValidation.ok) {
      return singleSettlementValidation;
    }
    if (settlementSummaries === undefined || settlementSummaries.length !== 1) {
      return blocked(
        'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARIES_INVALID',
        'Private paper-mode artifacts with a single settlement summary must also expose settlementSummaries.',
        'Serialized private paper-mode run artifact with settlement summaries when settlement context is present.',
      );
    }
  }

  for (const text of collectStrings(report)) {
    if (FORBIDDEN_REPORT_TEXT_PATTERN.test(text)) {
      return blocked(
        'PRIVATE_RUN_REPORT_FORBIDDEN_LANGUAGE',
        'Private paper-mode artifacts must not contain public-signal, profitability, or execution-readiness language.',
        'Serialized private paper-mode run artifact without forbidden public/execution/profitability language.',
      );
    }
  }

  return accepted(undefined);
}

function validatePrivateCandidateReportArtifact(
  candidateReport: PrivateCandidateReport,
  existingCandidateIds: ReadonlySet<string>,
): BoundaryResult<undefined> {
  if (!isRecord(candidateReport)) {
    return privateCandidateShapeBlocker();
  }
  if (candidateReport.reportKind !== 'private_paper_blocked' && candidateReport.reportKind !== 'private_paper_opportunity') {
    return privateCandidateShapeBlocker();
  }
  if (
    candidateReport.reportKind === 'private_paper_blocked'
    && !hasOnlySupportedFields(candidateReport, BLOCKED_CANDIDATE_REPORT_KEYS)
  ) {
    return privateCandidateUnsupportedFieldsBlocker();
  }
  if (
    candidateReport.reportKind === 'private_paper_opportunity'
    && !hasOnlySupportedFields(candidateReport, OPPORTUNITY_CANDIDATE_REPORT_KEYS)
  ) {
    return privateCandidateUnsupportedFieldsBlocker();
  }
  if (candidateReport.laneId !== FIRST_LANE_SPEC.laneId) {
    return blocked(
      'PRIVATE_RUN_REPORT_CANDIDATE_LANE_ID_INVALID',
      'Private paper-mode candidate reports must include the first-lane identifier.',
      'Serialized private paper-mode candidate report with the repo first-lane id.',
    );
  }
  if (!isNonEmptyString(candidateReport.candidateId)) {
    return blocked(
      'PRIVATE_RUN_REPORT_CANDIDATE_ID_INVALID',
      'Private paper-mode candidate reports must include non-empty candidate ids.',
      'Serialized private paper-mode candidate report with a non-empty candidate id.',
    );
  }
  if (existingCandidateIds.has(candidateReport.candidateId)) {
    return blocked(
      'PRIVATE_RUN_REPORT_CANDIDATE_ID_DUPLICATE',
      'Private paper-mode candidate reports must not contain duplicate candidate ids.',
      'Serialized private paper-mode candidate reports with unique candidate ids.',
    );
  }
  if (candidateReport.accepted !== false) {
    return blocked(
      'PRIVATE_RUN_REPORT_CANDIDATE_ACCEPTED_FLAG_INVALID',
      'Private paper-mode candidate reports must remain accepted=false.',
      'Serialized private paper-mode candidate report with accepted=false.',
    );
  }
  if (!Array.isArray(candidateReport.blockers)) {
    return privateCandidateShapeBlocker();
  }
  for (const blocker of candidateReport.blockers) {
    if (!isBlocker(blocker)) {
      return privateCandidateShapeBlocker();
    }
  }

  if (candidateReport.reportKind === 'private_paper_blocked') {
    if (candidateReport.status !== 'blocked' || candidateReport.blockers.length === 0) {
      return privateCandidateShapeBlocker();
    }
    if (Object.hasOwn(candidateReport, 'stakeVector') || Object.hasOwn(candidateReport, 'residualExposure')) {
      return privateCandidateShapeBlocker();
    }
    return accepted(undefined);
  }

  if (candidateReport.status !== 'fixture_candidate_only' || candidateReport.blockers.length !== 0) {
    return privateCandidateShapeBlocker();
  }
  const stakeVectorValidation = validateStakeVectorSummary(candidateReport.stakeVector);
  if (!stakeVectorValidation.ok) {
    return stakeVectorValidation;
  }
  if (candidateReport.residualExposure !== undefined) {
    const residualExposureValidation = validateResidualExposureSummary(candidateReport.residualExposure);
    if (!residualExposureValidation.ok) {
      return residualExposureValidation;
    }
  }

  return accepted(undefined);
}

function validateStakeVectorSummary(value: unknown): BoundaryResult<undefined> {
  if (!isRecord(value) || !Array.isArray(value.stakes) || value.stakes.length === 0) {
    return privateCandidateShapeBlocker();
  }
  if (!hasOnlySupportedFields(value, STAKE_VECTOR_SUMMARY_KEYS)) {
    return privateCandidateUnsupportedFieldsBlocker();
  }
  if (!Array.isArray(value.scenarioNets) || value.scenarioNets.length === 0 || !isIntegerLike(value.worstCaseNetMinor)) {
    return privateCandidateShapeBlocker();
  }
  for (const stake of value.stakes) {
    if (!isRecord(stake)) {
      return privateCandidateShapeBlocker();
    }
    if (!hasOnlySupportedFields(stake, STAKE_VECTOR_STAKE_KEYS)) {
      return privateCandidateUnsupportedFieldsBlocker();
    }
    const unitCount = integerLikeToBigInt(stake.unitCount);
    const stakeQuantumMinor = integerLikeToBigInt(stake.stakeQuantumMinor);
    const stakeMinor = integerLikeToBigInt(stake.stakeMinor);
    if (
      !isNonEmptyString(stake.legId)
      || unitCount === undefined
      || stakeQuantumMinor === undefined
      || stakeMinor === undefined
      || unitCount <= 0n
      || stakeQuantumMinor <= 0n
      || stakeMinor <= 0n
      || unitCount * stakeQuantumMinor !== stakeMinor
    ) {
      return privateCandidateShapeBlocker();
    }
  }
  for (const scenarioNet of value.scenarioNets) {
    const scenarioNetValidation = validateScenarioNetSummary(scenarioNet);
    if (!scenarioNetValidation.ok) {
      return scenarioNetValidation;
    }
  }

  return accepted(undefined);
}

function validateResidualExposureSummary(value: unknown): BoundaryResult<undefined> {
  if (
    !isRecord(value)
    || value.groupState !== 'group_incomplete'
    || !Array.isArray(value.filledLegIds)
    || !Array.isArray(value.excludedLegIds)
    || !Array.isArray(value.scenarioNets)
    || value.scenarioNets.length === 0
    || !isIntegerLike(value.worstCaseNetMinor)
  ) {
    return privateCandidateShapeBlocker();
  }
  if (!hasOnlySupportedFields(value, RESIDUAL_EXPOSURE_SUMMARY_KEYS)) {
    return privateCandidateUnsupportedFieldsBlocker();
  }
  if (!value.filledLegIds.every(isNonEmptyString) || !value.excludedLegIds.every(isNonEmptyString)) {
    return privateCandidateShapeBlocker();
  }
  for (const scenarioNet of value.scenarioNets) {
    const scenarioNetValidation = validateScenarioNetSummary(scenarioNet);
    if (!scenarioNetValidation.ok) {
      return scenarioNetValidation;
    }
  }

  return accepted(undefined);
}

function validatePrivateRunSettlementSummaries(
  settlementSummaries: readonly PrivateRunSettlementSummary[],
  candidateIds: ReadonlySet<string>,
): BoundaryResult<undefined> {
  if (!Array.isArray(settlementSummaries) || settlementSummaries.length === 0) {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARIES_INVALID',
      'Private paper-mode artifacts must keep settlementSummaries as non-empty arrays when present.',
      'Serialized private paper-mode run artifact with settlement summaries when settlement context is present.',
    );
  }
  const settlementCandidateIds = new Set<string>();
  let previousSettlementCandidateId: string | undefined;
  for (const settlementSummary of settlementSummaries) {
    const settlementValidation = validatePrivateRunSettlementSummary(settlementSummary, candidateIds);
    if (!settlementValidation.ok) {
      return settlementValidation;
    }
    if (settlementCandidateIds.has(settlementSummary.candidateId)) {
      return blocked(
        'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARY_DUPLICATE',
        'Private paper-mode settlement summaries must not contain duplicate candidate ids.',
        'Serialized private paper-mode settlement summaries with unique candidate ids.',
      );
    }
    if (
      previousSettlementCandidateId !== undefined
      && previousSettlementCandidateId.localeCompare(settlementSummary.candidateId) > 0
    ) {
      return blocked(
        'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARIES_ORDER_INVALID',
        'Private paper-mode settlement summaries must remain sorted by candidate id.',
        'Serialized private paper-mode run artifact with settlementSummaries in producer canonical order.',
      );
    }
    previousSettlementCandidateId = settlementSummary.candidateId;
    settlementCandidateIds.add(settlementSummary.candidateId);
  }

  return accepted(undefined);
}

function validatePrivateRunSettlementSummary(
  settlementSummary: PrivateRunSettlementSummary,
  candidateIds: ReadonlySet<string>,
): BoundaryResult<undefined> {
  if (!isRecord(settlementSummary)) {
    return privateSettlementShapeBlocker();
  }
  if (!hasOnlySupportedFields(settlementSummary, SETTLEMENT_SUMMARY_KEYS)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_UNSUPPORTED_FIELDS',
      'Private paper-mode settlement summaries must not retain unsupported fields.',
      'Serialized private paper-mode settlement summaries with only supported private fields.',
    );
  }
  if (!isNonEmptyString(settlementSummary.candidateId) || !candidateIds.has(settlementSummary.candidateId)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_CANDIDATE_INVALID',
      'Private paper-mode settlement summaries must reference known non-empty candidate ids.',
      'Serialized private paper-mode settlement summaries keyed to candidateReports.',
    );
  }
  if (settlementSummary.canonicalMarketId !== settlementSummary.candidateId) {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_CANDIDATE_MISMATCH',
      'Private paper-mode settlement summaries must keep candidateId aligned to canonicalMarketId.',
      'Serialized private paper-mode settlement summaries with aligned candidate and canonical market ids.',
    );
  }
  if (
    !isNonEmptyString(settlementSummary.ruleProfileId)
    || !isNonEmptyString(settlementSummary.resultSourceId)
    || !isNonEmptyString(settlementSummary.finalityPolicyId)
    || !isNonEmptyString(settlementSummary.finalityAuthorityId)
    || !isNonEmptyString(settlementSummary.scenarioId)
  ) {
    return privateSettlementShapeBlocker();
  }
  if (!MANIFEST_HASH_PATTERN.test(settlementSummary.replayManifestHash)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_REPLAY_HASH_INVALID',
      'Private paper-mode settlement summaries must include 64-character lower-case replay manifest hashes.',
      'Serialized private paper-mode settlement summaries with replay manifest hashes.',
    );
  }
  if (!isIsoUtcTimestamp(settlementSummary.replayAcceptedAt)) {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_TIMESTAMP_INVALID',
      'Private paper-mode settlement summaries must include ISO-8601 UTC replay acceptance timestamps.',
      'Serialized private paper-mode settlement summaries with ISO-8601 UTC replayAcceptedAt values.',
    );
  }
  if (settlementSummary.finalOutcome !== 'yes' && settlementSummary.finalOutcome !== 'no') {
    return blocked(
      'PRIVATE_RUN_REPORT_SETTLEMENT_OUTCOME_INVALID',
      'Private paper-mode settlement summaries must include a supported final outcome.',
      'Serialized private paper-mode settlement summaries with finalOutcome yes or no.',
    );
  }

  return accepted(undefined);
}

function privateRunSettlementSummariesEqual(
  left: PrivateRunSettlementSummary,
  right: PrivateRunSettlementSummary,
): boolean {
  return left.candidateId === right.candidateId
    && left.canonicalMarketId === right.canonicalMarketId
    && left.ruleProfileId === right.ruleProfileId
    && left.resultSourceId === right.resultSourceId
    && left.finalityPolicyId === right.finalityPolicyId
    && left.finalityAuthorityId === right.finalityAuthorityId
    && left.replayManifestHash === right.replayManifestHash
    && left.replayAcceptedAt === right.replayAcceptedAt
    && left.scenarioId === right.scenarioId
    && left.finalOutcome === right.finalOutcome;
}

function validateScenarioNetSummary(value: unknown): BoundaryResult<undefined> {
  if (!isRecord(value)) {
    return privateCandidateShapeBlocker();
  }
  if (!hasOnlySupportedFields(value, SCENARIO_NET_SUMMARY_KEYS)) {
    return privateCandidateUnsupportedFieldsBlocker();
  }
  if (!isNonEmptyString(value.scenarioId) || !isIntegerLike(value.netMinor)) {
    return privateCandidateShapeBlocker();
  }

  return accepted(undefined);
}

function isBlocker(value: unknown): value is { readonly code: string; readonly message: string; readonly evidenceRequired: string } {
  return isRecord(value)
    && isNonEmptyString(value.code)
    && isNonEmptyString(value.message)
    && isNonEmptyString(value.evidenceRequired);
}

function isIntegerLike(value: unknown): boolean {
  return integerLikeToBigInt(value) !== undefined;
}

function integerLikeToBigInt(value: unknown): bigint | undefined {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  return undefined;
}

function isIsoUtcTimestamp(value: unknown): boolean {
  if (typeof value !== 'string' || !ISO_8601_UTC_MILLISECONDS.test(value)) {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlySupportedFields(value: Record<string, unknown>, supportedFields: ReadonlySet<string>): boolean {
  return Object.keys(value).every((field) => supportedFields.has(field));
}

function privateCandidateShapeBlocker(): BoundaryResult<undefined> {
  return blocked(
    'PRIVATE_RUN_REPORT_CANDIDATE_SHAPE_INVALID',
    'Private paper-mode artifacts must keep candidate reports in the supported blocked or opportunity shape.',
    'Serialized private paper-mode candidate reports with lane/status/blocker and stake-vector fields aligned to reportKind.',
  );
}

function privateCandidateUnsupportedFieldsBlocker(): BoundaryResult<undefined> {
  return blocked(
    'PRIVATE_RUN_REPORT_CANDIDATE_UNSUPPORTED_FIELDS',
    'Private paper-mode candidate reports must not retain unsupported fields.',
    'Serialized private paper-mode candidate report with only supported private fields for its reportKind.',
  );
}

function privateSettlementShapeBlocker(): BoundaryResult<undefined> {
  return blocked(
    'PRIVATE_RUN_REPORT_SETTLEMENT_SUMMARY_SHAPE_INVALID',
    'Private paper-mode settlement summaries must include complete non-empty replay metadata.',
    'Serialized private paper-mode settlement summaries with complete replay metadata fields.',
  );
}

function toSettlementSummaries(
  settlements: ConsumedSettlementReplay | readonly ConsumedSettlementReplay[] | undefined,
): readonly PrivateRunSettlementSummary[] {
  if (settlements === undefined) {
    return Object.freeze([]);
  }
  const settlementList = Array.isArray(settlements) ? settlements : [settlements];
  return Object.freeze(
    settlementList
      .map((settlement) =>
        Object.freeze({
          candidateId: settlement.canonicalMarketId,
          canonicalMarketId: settlement.canonicalMarketId,
          ruleProfileId: settlement.ruleProfileId,
          resultSourceId: settlement.resultSourceId,
          finalityPolicyId: settlement.finalityPolicyId,
          finalityAuthorityId: settlement.finalityAuthorityId,
          replayManifestHash: settlement.replayManifestHash,
          replayAcceptedAt: settlement.replayAcceptedAt,
          scenarioId: settlement.scenarioId,
          finalOutcome: settlement.finalOutcome,
        }),
      )
      .sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
  );
}

function cloneCandidateReport(candidateReport: PrivateCandidateReport): PrivateCandidateReport {
  if (candidateReport.reportKind === 'private_paper_blocked') {
    return Object.freeze({
      reportKind: 'private_paper_blocked',
      laneId: candidateReport.laneId,
      candidateId: candidateReport.candidateId,
      accepted: false,
      status: 'blocked',
      blockers: Object.freeze(candidateReport.blockers.map((blocker) => Object.freeze({ ...blocker }))),
    });
  }

  if (candidateReport.residualExposure === undefined) {
    return Object.freeze({
      reportKind: 'private_paper_opportunity',
      laneId: candidateReport.laneId,
      candidateId: candidateReport.candidateId,
      accepted: false,
      status: 'fixture_candidate_only',
      blockers: Object.freeze([]),
      stakeVector: Object.freeze({
        stakes: Object.freeze(candidateReport.stakeVector.stakes.map((stake) => Object.freeze({ ...stake }))),
        scenarioNets: Object.freeze(candidateReport.stakeVector.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
        worstCaseNetMinor: candidateReport.stakeVector.worstCaseNetMinor,
      }),
    });
  }

  return Object.freeze({
    reportKind: 'private_paper_opportunity',
    laneId: candidateReport.laneId,
    candidateId: candidateReport.candidateId,
    accepted: false,
    status: 'fixture_candidate_only',
    blockers: Object.freeze([]),
    stakeVector: Object.freeze({
      stakes: Object.freeze(candidateReport.stakeVector.stakes.map((stake) => Object.freeze({ ...stake }))),
      scenarioNets: Object.freeze(candidateReport.stakeVector.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
      worstCaseNetMinor: candidateReport.stakeVector.worstCaseNetMinor,
    }),
    residualExposure: Object.freeze({
      groupState: 'group_incomplete',
      filledLegIds: Object.freeze([...candidateReport.residualExposure.filledLegIds]),
      excludedLegIds: Object.freeze([...candidateReport.residualExposure.excludedLegIds]),
      scenarioNets: Object.freeze(candidateReport.residualExposure.scenarioNets.map((scenarioNet) => Object.freeze({ ...scenarioNet }))),
      worstCaseNetMinor: candidateReport.residualExposure.worstCaseNetMinor,
    }),
  });
}

function collectStrings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStrings(entry));
  }

  return Object.values(value).flatMap((entry) => collectStrings(entry));
}
