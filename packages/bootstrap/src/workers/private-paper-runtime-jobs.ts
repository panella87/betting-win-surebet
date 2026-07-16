import type { SurebetStrategyLedgerRepository } from '../../../persistence/src/repositories/strategy-ledger-repository.js';
import type { SurebetUpstreamLockRepository } from '../../../persistence/src/repositories/upstream-lock-repository.js';
import type { JsonValue } from '../../../persistence/src/types.js';
import {
  createReadOnlyQueryApiClient,
  type IdentityReadOnlyQueryItem,
  type NormalizedReadOnlyQueryItem,
  type RulesReadOnlyQueryItem,
} from '../adapters/betting-win-query-client.js';
import { parseBettingWinResourceRecords, type BettingWinResourceRecord } from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import { createPrivatePaperStrategyLedgerEntry } from '../strategy/strategy-ledger.js';
import {
  runBoundedPrivatePaperRuntimeCycle,
  type PrivatePaperCandidateRuntimePlan,
  type PrivatePaperReadOnlyQueryRecordMappers,
  type PrivatePaperRuntimeRequest,
} from '../runtime/private-paper-runtime.js';
import type {
  BoundedWorkerJobHandler,
  BoundedWorkerJobHandlerDeadLetter,
  BoundedWorkerJobHandlerContext,
  BoundedWorkerJobHandlerResult,
} from './bounded-job-worker.js';

const JOB_PAYLOAD_SCHEMA = 'bws.private_paper_runtime_job.v1';
const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SIGNED_INTEGER_STRING = /^-?[0-9]+$/;

export interface SerializablePrivatePaperCompletionEvent {
  readonly legId: string;
  readonly type: 'reserve' | 'fill' | 'reject' | 'expire' | 'rollback';
  readonly stakeMinor?: string;
  readonly occurredAt: string;
}

export interface SerializablePrivatePaperCandidatePlan {
  readonly candidateId: string;
  readonly decisionTimestamp: string;
  readonly maxQuoteAgeMs: number;
  readonly manualKill: boolean;
  readonly completionEvents: readonly SerializablePrivatePaperCompletionEvent[];
  readonly residualExposureFloorMinor?: string;
}

export interface PersistedPrivatePaperRuntimeJobPayload {
  readonly schema: typeof JOB_PAYLOAD_SCHEMA;
  readonly upstreamLockRecordId: string;
  readonly pinnedStrategyExportRecordId?: string;
  readonly runtimeId: string;
  readonly cycleId: string;
  readonly maxCandidatesPerCycle: number;
  readonly source: PersistedPrivatePaperRuntimeJobSource;
  readonly candidatePlans: readonly SerializablePrivatePaperCandidatePlan[];
}

export interface PersistedPrivatePaperRuntimePinnedRecordSource {
  readonly kind: 'pinned_records';
  readonly sourceBundleKind: 'resource_export';
  readonly exportedAt: string;
  readonly sourceManifestHash: string;
  readonly records: readonly JsonValue[];
}

export interface PersistedPrivatePaperRuntimeReadOnlyQuerySource {
  readonly kind: 'read_only_query';
  readonly exportedAt: string;
  readonly sourceManifestHash: string;
  readonly apiBaseUrl: string;
  readonly contractVersion: string;
  readonly pageSize: number;
  readonly maxPagesPerResource: number;
  readonly retryBackoffMs: number;
  readonly retryLimit: number;
  readonly timeoutMs: number;
}

export type PersistedPrivatePaperRuntimeJobSource =
  | PersistedPrivatePaperRuntimePinnedRecordSource
  | PersistedPrivatePaperRuntimeReadOnlyQuerySource;

export interface PrivatePaperRuntimeJobHandlerDependencies {
  readonly runCycle?: typeof runBoundedPrivatePaperRuntimeCycle;
  readonly strategyLedger: Pick<SurebetStrategyLedgerRepository, 'create'>;
  readonly upstreamLocks: Pick<SurebetUpstreamLockRepository, 'get'>;
}

export function createPrivatePaperRuntimeJobHandler(
  dependencies: PrivatePaperRuntimeJobHandlerDependencies,
): BoundedWorkerJobHandler {
  return {
    async run(context: BoundedWorkerJobHandlerContext): Promise<BoundedWorkerJobHandlerResult> {
      const parsedPayload = parsePersistedJobPayload(context.job.payload, context.now());
      if (!parsedPayload.ok) {
        return parsedPayload.error;
      }

      context.recordCheckpoint({
        checkpoint: Object.freeze({
          checkpointStage: 'payload_validated',
          schema: parsedPayload.value.schema,
        }),
        checkpointId: `attempt-${context.job.attemptCount}-payload-validated`,
        recordedAt: context.now(),
      });

      const upstreamLock = dependencies.upstreamLocks.get(parsedPayload.value.upstreamLockRecordId);
      if (upstreamLock === undefined) {
        return deadLetter(
          context.now(),
          'BWS_PRIVATE_PAPER_UPSTREAM_LOCK_MISSING',
          Object.freeze({
            evidenceRequired: 'A persisted surebet upstream lock record for the private-paper worker job.',
            upstreamLockRecordId: parsedPayload.value.upstreamLockRecordId,
          }),
        );
      }

      const runtimeResult = await (dependencies.runCycle ?? runBoundedPrivatePaperRuntimeCycle)(
        toRuntimeRequest(parsedPayload.value, upstreamLock.lock),
      );
      if (!runtimeResult.ok) {
        return deadLetter(
          context.now(),
          'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED',
          Object.freeze({
            blockers: runtimeResult.blockers.map((blocker) =>
              Object.freeze({
                code: blocker.code,
                evidenceRequired: blocker.evidenceRequired,
                message: blocker.message,
              })),
          }),
        );
      }

      context.recordCheckpoint({
        checkpoint: Object.freeze({
          blockedCandidateCount: runtimeResult.value.blockedCandidateCount,
          candidateCount: runtimeResult.value.candidateCount,
          checkpointStage: 'runtime_cycle_completed',
          cycleFingerprint: runtimeResult.value.cycleFingerprint,
          stopReason: runtimeResult.value.stopReason,
        }),
        checkpointId: `attempt-${context.job.attemptCount}-runtime-cycle`,
        recordedAt: context.now(),
      });

      context.heartbeat(context.now());

      const ledgerEntry = createPrivatePaperStrategyLedgerEntry({
        cycle: runtimeResult.value,
        upstreamLock: upstreamLock.lock,
      });
      if (!ledgerEntry.ok) {
        return deadLetter(
          context.now(),
          'BWS_PRIVATE_PAPER_LEDGER_BLOCKED',
          Object.freeze({
            blockers: ledgerEntry.blockers.map((blocker) =>
              Object.freeze({
                code: blocker.code,
                evidenceRequired: blocker.evidenceRequired,
                message: blocker.message,
              })),
          }),
        );
      }

      const persistedLedger = dependencies.strategyLedger.create({
        entry: ledgerEntry.value,
        ...(parsedPayload.value.pinnedStrategyExportRecordId === undefined
          ? {}
          : { pinnedStrategyExportRecordId: parsedPayload.value.pinnedStrategyExportRecordId }),
        upstreamLockRecordId: parsedPayload.value.upstreamLockRecordId,
      });

      context.recordCheckpoint({
        checkpoint: Object.freeze({
          acceptanceState: persistedLedger.entry.acceptanceState,
          checkpointStage: 'strategy_ledger_persisted',
          ledgerEntryId: persistedLedger.ledgerEntryId,
          reportId: persistedLedger.entry.reportId,
        }),
        checkpointId: `attempt-${context.job.attemptCount}-strategy-ledger`,
        recordedAt: context.now(),
      });

      return {
        completedAt: context.now(),
        outcome: 'completed',
        successResult: Object.freeze({
          acceptanceState: persistedLedger.entry.acceptanceState,
          ledgerEntryId: persistedLedger.ledgerEntryId,
          reportId: persistedLedger.entry.reportId,
          runFingerprintSha256: persistedLedger.entry.runFingerprintSha256,
          settlementState: persistedLedger.entry.settlementState,
        }),
      };
    },
  };
}

function parsePersistedJobPayload(
  value: JsonValue,
  failedAt: string,
): { readonly ok: true; readonly value: PersistedPrivatePaperRuntimeJobPayload }
  | { readonly ok: false; readonly error: BoundedWorkerJobHandlerResult } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_PAYLOAD_INVALID',
        Object.freeze({
          evidenceRequired: 'A JSON object payload for the private-paper worker job.',
        }),
      ),
      ok: false,
    };
  }
  const payload = value as Record<string, unknown>;
  if (payload.schema !== JOB_PAYLOAD_SCHEMA) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_SCHEMA_INVALID',
        Object.freeze({
          evidenceRequired: `A ${JOB_PAYLOAD_SCHEMA} payload for the private-paper worker job.`,
          receivedSchema: payload.schema === undefined ? null : String(payload.schema),
        }),
      ),
      ok: false,
    };
  }
  const source = parsePersistedJobSource(payload.source, failedAt);
  if (!source.ok) {
    return source;
  }

  const candidatePlans = parseCandidatePlans(payload.candidatePlans);
  if (!candidatePlans.ok) {
    return {
      error: deadLetter(failedAt, candidatePlans.code, candidatePlans.details),
      ok: false,
    };
  }

  const runtimeId = requireNonEmptyString(payload.runtimeId);
  const cycleId = requireNonEmptyString(payload.cycleId);
  const upstreamLockRecordId = requireNonEmptyString(payload.upstreamLockRecordId);
  const pinnedStrategyExportRecordId = requireNonEmptyString(payload.pinnedStrategyExportRecordId);
  const maxCandidatesPerCycle = typeof payload.maxCandidatesPerCycle === 'number'
    ? payload.maxCandidatesPerCycle
    : undefined;
  if (
    runtimeId === undefined
    || cycleId === undefined
    || upstreamLockRecordId === undefined
  ) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_IDENTIFIERS_INVALID',
        Object.freeze({
          evidenceRequired: 'Non-empty runtime, cycle, and upstream-lock identifiers for the worker job.',
        }),
      ),
      ok: false,
    };
  }

  if (
    maxCandidatesPerCycle === undefined
    || !Number.isSafeInteger(maxCandidatesPerCycle)
    || maxCandidatesPerCycle <= 0
  ) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_BOUND_INVALID',
        Object.freeze({
          evidenceRequired: 'A positive integer maxCandidatesPerCycle for the worker job.',
        }),
      ),
      ok: false,
    };
  }
  const boundedMaxCandidatesPerCycle = maxCandidatesPerCycle;

  return {
    ok: true,
    value: Object.freeze({
      candidatePlans: candidatePlans.value,
      cycleId,
      maxCandidatesPerCycle: boundedMaxCandidatesPerCycle,
      ...(pinnedStrategyExportRecordId === undefined ? {} : { pinnedStrategyExportRecordId }),
      runtimeId,
      schema: JOB_PAYLOAD_SCHEMA,
      source: source.value,
      upstreamLockRecordId,
    }),
  };
}

function parsePersistedJobSource(
  value: unknown,
  failedAt: string,
): { readonly ok: true; readonly value: PersistedPrivatePaperRuntimeJobSource }
  | { readonly ok: false; readonly error: BoundedWorkerJobHandlerResult } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_SOURCE_INVALID',
        Object.freeze({
          evidenceRequired: 'A pinned-record or read_only_query private-paper source definition.',
        }),
      ),
      ok: false,
    };
  }
  const sourceRecord = value as Record<string, unknown>;
  const exportedAt = requireIsoTimestamp(sourceRecord.exportedAt, 'source.exportedAt');
  if (exportedAt === undefined) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_EXPORTED_AT_INVALID',
        Object.freeze({
          evidenceRequired: 'An ISO-8601 UTC exportedAt timestamp for the private-paper worker source.',
        }),
      ),
      ok: false,
    };
  }
  const sourceManifestHash = requireSha256String(sourceRecord.sourceManifestHash);
  if (sourceManifestHash === undefined) {
    return {
      error: deadLetter(
        failedAt,
        'BWS_PRIVATE_PAPER_JOB_SOURCE_MANIFEST_INVALID',
        Object.freeze({
          evidenceRequired: 'A 64-character sourceManifestHash for the private-paper worker source.',
        }),
      ),
      ok: false,
    };
  }

  if (sourceRecord.kind === 'pinned_records') {
    if (sourceRecord.sourceBundleKind !== 'resource_export' || !Array.isArray(sourceRecord.records)) {
      return {
        error: deadLetter(
          failedAt,
          'BWS_PRIVATE_PAPER_JOB_SOURCE_UNSUPPORTED',
          Object.freeze({
            evidenceRequired: 'A pinned_records/resource_export private-paper worker source.',
          }),
        ),
        ok: false,
      };
    }
    const records = parseBettingWinResourceRecords(sourceRecord.records);
    if (!records.ok) {
      return {
        error: deadLetter(
          failedAt,
          'BWS_PRIVATE_PAPER_JOB_RECORDS_INVALID',
          Object.freeze({
            blockers: records.blockers.map((blocker) =>
              Object.freeze({
                code: blocker.code,
                evidenceRequired: blocker.evidenceRequired,
                message: blocker.message,
              })),
          }),
        ),
        ok: false,
      };
    }
    return {
      ok: true,
      value: Object.freeze({
        exportedAt,
        kind: 'pinned_records',
        records: records.value.map((record) => serializeResourceRecord(record)),
        sourceBundleKind: 'resource_export',
        sourceManifestHash,
      }),
    };
  }

  if (sourceRecord.kind === 'read_only_query') {
    const apiBaseUrl = requireNonEmptyString(sourceRecord.apiBaseUrl);
    const contractVersion = requireNonEmptyString(sourceRecord.contractVersion);
    const pageSize = requirePositiveInteger(sourceRecord.pageSize);
    const maxPagesPerResource = requirePositiveInteger(sourceRecord.maxPagesPerResource);
    const retryBackoffMs = requirePositiveInteger(sourceRecord.retryBackoffMs);
    const retryLimit = requireNonNegativeInteger(sourceRecord.retryLimit);
    const timeoutMs = requirePositiveInteger(sourceRecord.timeoutMs);
    if (
      apiBaseUrl === undefined
      || contractVersion === undefined
      || pageSize === undefined
      || maxPagesPerResource === undefined
      || retryBackoffMs === undefined
      || retryLimit === undefined
      || timeoutMs === undefined
    ) {
      return {
        error: deadLetter(
          failedAt,
          'BWS_PRIVATE_PAPER_JOB_SOURCE_UNSUPPORTED',
          Object.freeze({
            evidenceRequired: 'A read_only_query worker source with apiBaseUrl, contractVersion, bounded page settings, retry settings, and timeout.',
          }),
        ),
        ok: false,
      };
    }
    return {
      ok: true,
      value: Object.freeze({
        apiBaseUrl,
        contractVersion,
        exportedAt,
        kind: 'read_only_query',
        maxPagesPerResource,
        pageSize,
        retryBackoffMs,
        retryLimit,
        sourceManifestHash,
        timeoutMs,
      }),
    };
  }

  return {
    error: deadLetter(
      failedAt,
      'BWS_PRIVATE_PAPER_JOB_SOURCE_UNSUPPORTED',
      Object.freeze({
        evidenceRequired: 'A pinned_records/resource_export or read_only_query private-paper worker source.',
      }),
    ),
    ok: false,
  };
}

function parseCandidatePlans(
  value: unknown,
): { readonly ok: true; readonly value: readonly SerializablePrivatePaperCandidatePlan[] }
  | { readonly ok: false; readonly code: string; readonly details: JsonValue } {
  if (!Array.isArray(value)) {
    return {
      code: 'BWS_PRIVATE_PAPER_JOB_PLANS_INVALID',
      details: Object.freeze({
        evidenceRequired: 'An array of candidate plans for the private-paper worker job.',
      }),
      ok: false,
    };
  }
  const plans: SerializablePrivatePaperCandidatePlan[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return {
        code: 'BWS_PRIVATE_PAPER_JOB_PLAN_INVALID',
        details: Object.freeze({
          evidenceRequired: 'Object-shaped candidate plans for the private-paper worker job.',
        }),
        ok: false,
      };
    }
    const plan = entry as Record<string, unknown>;
    const candidateId = requireNonEmptyString(plan.candidateId);
    const decisionTimestamp = requireIsoTimestamp(plan.decisionTimestamp, 'candidatePlans.decisionTimestamp');
    const maxQuoteAgeMs = typeof plan.maxQuoteAgeMs === 'number' ? plan.maxQuoteAgeMs : undefined;
    if (
      candidateId === undefined
      || decisionTimestamp === undefined
      || maxQuoteAgeMs === undefined
      || !Number.isSafeInteger(maxQuoteAgeMs)
      || maxQuoteAgeMs <= 0
      || typeof plan.manualKill !== 'boolean'
      || !Array.isArray(plan.completionEvents)
    ) {
      return {
        code: 'BWS_PRIVATE_PAPER_JOB_PLAN_INVALID',
        details: Object.freeze({
          evidenceRequired: 'Candidate plans with ids, timestamps, positive maxQuoteAgeMs, manualKill, and completionEvents.',
        }),
        ok: false,
      };
    }
    const boundedMaxQuoteAgeMs = maxQuoteAgeMs;
    const completionEvents: SerializablePrivatePaperCompletionEvent[] = [];
    for (const eventValue of plan.completionEvents) {
      if (typeof eventValue !== 'object' || eventValue === null || Array.isArray(eventValue)) {
        return {
          code: 'BWS_PRIVATE_PAPER_JOB_EVENT_INVALID',
          details: Object.freeze({
            evidenceRequired: 'Object-shaped completion events for the private-paper worker job.',
          }),
          ok: false,
        };
      }
      const event = eventValue as Record<string, unknown>;
      const legId = requireNonEmptyString(event.legId);
      const occurredAt = requireIsoTimestamp(event.occurredAt, 'candidatePlans.completionEvents.occurredAt');
      const eventType = event.type;
      const stakeMinor = event.stakeMinor;
      if (
        legId === undefined
        || occurredAt === undefined
        || (eventType !== 'reserve'
          && eventType !== 'fill'
          && eventType !== 'reject'
          && eventType !== 'expire'
          && eventType !== 'rollback')
        || (stakeMinor !== undefined && !isSignedIntegerString(stakeMinor))
      ) {
        return {
          code: 'BWS_PRIVATE_PAPER_JOB_EVENT_INVALID',
          details: Object.freeze({
            evidenceRequired: 'Completion events with legId, occurredAt, supported type, and integer-string stakeMinor when provided.',
          }),
          ok: false,
        };
      }
      completionEvents.push(
        Object.freeze({
          ...(stakeMinor === undefined ? {} : { stakeMinor: stakeMinor as string }),
          legId,
          occurredAt,
          type: eventType,
        }),
      );
    }

    const residualExposureFloorMinor = plan.residualExposureFloorMinor;
    if (residualExposureFloorMinor !== undefined && !isSignedIntegerString(residualExposureFloorMinor)) {
      return {
        code: 'BWS_PRIVATE_PAPER_JOB_PLAN_INVALID',
        details: Object.freeze({
          evidenceRequired: 'An integer-string residualExposureFloorMinor when the worker job requests one.',
        }),
        ok: false,
      };
    }

    plans.push(
      Object.freeze({
        candidateId,
        completionEvents: Object.freeze(completionEvents),
        decisionTimestamp,
        manualKill: plan.manualKill,
        maxQuoteAgeMs: boundedMaxQuoteAgeMs,
        ...(residualExposureFloorMinor === undefined ? {} : { residualExposureFloorMinor: residualExposureFloorMinor as string }),
      }),
    );
  }
  return { ok: true, value: Object.freeze(plans) };
}

function toRuntimeRequest(
  payload: PersistedPrivatePaperRuntimeJobPayload,
  upstreamLock: NonNullable<ReturnType<PrivatePaperRuntimeJobHandlerDependencies['upstreamLocks']['get']>>['lock'],
): PrivatePaperRuntimeRequest {
  const source = payload.source.kind === 'pinned_records'
    ? accepted(
      Object.freeze({
        exportedAt: payload.source.exportedAt,
        kind: 'pinned_records' as const,
        records: payload.source.records.map((record) => deserializeResourceRecord(record)),
        sourceBundleKind: 'resource_export' as const,
        sourceManifestHash: payload.source.sourceManifestHash,
      }),
    )
    : buildReadOnlyQuerySource(payload.source, upstreamLock);
  if (!source.ok) {
    throw new Error(source.blockers.map((blocker) => blocker.message).join(' '));
  }
  return Object.freeze({
    candidatePlans: payload.candidatePlans.map((plan) => deserializeCandidatePlan(plan)),
    cycleId: payload.cycleId,
    maxCandidatesPerCycle: payload.maxCandidatesPerCycle,
    runtimeId: payload.runtimeId,
    source: source.value,
    upstreamLock,
  });
}

function buildReadOnlyQuerySource(
  source: PersistedPrivatePaperRuntimeReadOnlyQuerySource,
  upstreamLock: NonNullable<ReturnType<PrivatePaperRuntimeJobHandlerDependencies['upstreamLocks']['get']>>['lock'],
): BoundaryResult<Extract<PrivatePaperRuntimeRequest['source'], { readonly kind: 'read_only_query' }>> {
  const client = createReadOnlyQueryApiClient({
    baseUrl: source.apiBaseUrl,
    contractVersion: source.contractVersion,
    fetchImplementation: globalThis.fetch.bind(globalThis),
    maxPageSize: source.pageSize,
    retryBackoffMs: source.retryBackoffMs,
    retryLimit: source.retryLimit,
    timeoutMs: source.timeoutMs,
    upstreamLock,
  });
  if (!client.ok) {
    return client;
  }
  return accepted(
    Object.freeze({
      client: client.value,
      exportedAt: source.exportedAt,
      kind: 'read_only_query',
      mappers: createReadOnlyQueryRecordMappers(),
      requests: Object.freeze({
        identity: Object.freeze({ maxPages: source.maxPagesPerResource, pageSize: source.pageSize }),
        quotes: Object.freeze({ maxPages: source.maxPagesPerResource, pageSize: source.pageSize }),
        rules: Object.freeze({ maxPages: source.maxPagesPerResource, pageSize: source.pageSize }),
        settlement: Object.freeze({
          filters: Object.freeze({ finalityStatus: 'terminal' }),
          maxPages: source.maxPagesPerResource,
          pageSize: source.pageSize,
        }),
      }),
      sourceManifestHash: source.sourceManifestHash,
    }),
  );
}

function deserializeCandidatePlan(plan: SerializablePrivatePaperCandidatePlan): PrivatePaperCandidateRuntimePlan {
  return Object.freeze({
    candidateId: plan.candidateId,
    completionEvents: plan.completionEvents.map((event) =>
      Object.freeze({
        ...(event.stakeMinor === undefined ? {} : { stakeMinor: BigInt(event.stakeMinor) }),
        legId: event.legId,
        occurredAt: event.occurredAt,
        type: event.type,
      })),
    decisionTimestamp: plan.decisionTimestamp,
    manualKill: plan.manualKill,
    maxQuoteAgeMs: plan.maxQuoteAgeMs,
    ...(plan.residualExposureFloorMinor === undefined
      ? {}
      : { residualExposureFloorMinor: BigInt(plan.residualExposureFloorMinor) }),
  });
}

function serializeResourceRecord(record: BettingWinResourceRecord): JsonValue {
  switch (record.recordType) {
    case 'identity':
      return Object.freeze(record) as unknown as JsonValue;
    case 'rules':
      return Object.freeze(record) as unknown as JsonValue;
    case 'quotes':
      return Object.freeze({
        canonicalMarketId: record.canonicalMarketId,
        costMinor: record.costMinor.toString(),
        currency: record.evidence.currency,
        evidenceId: record.evidence.evidenceId,
        feeMinor: record.feeMinor.toString(),
        minStakeMinor: record.minStakeMinor.toString(),
        observedAt: record.evidence.observedAt,
        outcome: record.outcome,
        priceMinor: record.evidence.priceMinor.toString(),
        quoteSourceManifestHash: record.quoteSourceManifestHash,
        recordType: 'quotes',
        availableSizeMinor: record.evidence.availableSizeMinor.toString(),
      });
    case 'settlement':
      return Object.freeze(record) as unknown as JsonValue;
  }
}

function deserializeResourceRecord(record: JsonValue): BettingWinResourceRecord {
  const parsed = parseBettingWinResourceRecords([record]);
  if (!parsed.ok) {
    throw new Error(parsed.blockers[0]?.message ?? 'Invalid persisted private-paper resource record.');
  }
  return parsed.value[0]!;
}

function createReadOnlyQueryRecordMappers(): PrivatePaperReadOnlyQueryRecordMappers {
  return Object.freeze({
    identity: (item: IdentityReadOnlyQueryItem) =>
      mapReadOnlyQueryRecord(
        Object.freeze({
          canonicalEventId: requireString((item.providerReferences?.[0] as Record<string, unknown> | undefined)?.canonicalEventId),
          canonicalMarketId: requireString(item.canonicalId),
          providerGeneration: requireString((item.providerReferences?.[0] as Record<string, unknown> | undefined)?.providerGeneration),
          providerMarketId: requireString((item.providerReferences?.[0] as Record<string, unknown> | undefined)?.providerMarketId),
          recordType: 'identity',
        }),
      ),
    quotes: (item: NormalizedReadOnlyQueryItem) => {
      const normalizedEvidence = item.normalizedEvidence as Record<string, unknown> | undefined;
      return mapReadOnlyQueryRecord(
        Object.freeze({
          availableSizeMinor: requireString(normalizedEvidence?.availableSizeMinor),
          canonicalMarketId: requireString(normalizedEvidence?.canonicalMarketId),
          costMinor: requireString(normalizedEvidence?.costMinor),
          currency: requireString(normalizedEvidence?.currency),
          evidenceId: requireString(normalizedEvidence?.evidenceId),
          feeMinor: requireString(normalizedEvidence?.feeMinor),
          minStakeMinor: requireString(normalizedEvidence?.minStakeMinor),
          observedAt: requireString(normalizedEvidence?.observedAt),
          outcome: requireString(normalizedEvidence?.outcome),
          priceMinor: requireString(normalizedEvidence?.priceMinor),
          quoteSourceManifestHash: requireString(normalizedEvidence?.quoteSourceManifestHash),
          recordType: 'quotes',
        }),
      );
    },
    rules: (item: RulesReadOnlyQueryItem) => {
      const ruleProfile = item.ruleProfile as Record<string, unknown> | undefined;
      const resultSource = item.resultSource as Record<string, unknown> | undefined;
      return mapReadOnlyQueryRecord(
        Object.freeze({
          canonicalMarketId: requireString(ruleProfile?.canonicalMarketId),
          finalityPolicyId: requireString(ruleProfile?.finalityPolicyId),
          recordType: 'rules',
          resultSourceId: requireString(resultSource?.resultSourceId),
          ruleProfileId: requireString(ruleProfile?.ruleProfileId),
        }),
      );
    },
    settlement: (item: NormalizedReadOnlyQueryItem) => {
      const normalizedEvidence = item.normalizedEvidence as Record<string, unknown> | undefined;
      return mapReadOnlyQueryRecord(
        Object.freeze({
          acceptanceStatus: requireString(normalizedEvidence?.acceptanceStatus),
          canonicalMarketId: requireString(normalizedEvidence?.canonicalMarketId),
          finalOutcome: requireString(normalizedEvidence?.finalOutcome),
          finalityAuthorityId: requireString(normalizedEvidence?.finalityAuthorityId),
          finalityPolicyId: requireString(normalizedEvidence?.finalityPolicyId),
          recordType: 'settlement',
          replayAcceptedAt: requireString(normalizedEvidence?.replayAcceptedAt),
          replayManifestHash: requireString(normalizedEvidence?.replayManifestHash),
          resultSourceId: requireString(normalizedEvidence?.resultSourceId),
          ruleProfileId: requireString(normalizedEvidence?.ruleProfileId),
        }),
      );
    },
  });
}

function mapReadOnlyQueryRecord(record: Record<string, unknown>): BoundaryResult<readonly BettingWinResourceRecord[]> {
  const parsed = parseBettingWinResourceRecords([record]);
  if (!parsed.ok) {
    return blocked(
      'BWS_PRIVATE_PAPER_QUERY_MAPPER_INVALID',
      parsed.blockers[0]?.message ?? 'Read-only query records must map to canonical BWS resource records.',
      parsed.blockers[0]?.evidenceRequired ?? 'Canonical BWS read-only query record mapping.',
    );
  }
  return accepted(parsed.value);
}

function deadLetter(
  failedAt: string,
  errorCode: string,
  errorDetails: JsonValue,
): BoundedWorkerJobHandlerDeadLetter {
  return Object.freeze({
    errorCode,
    errorDetails,
    failedAt,
    outcome: 'dead_letter',
  });
}

function requireNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function requireString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function requireIsoTimestamp(value: unknown, _field: string): string | undefined {
  return typeof value === 'string' && ISO_UTC_TIMESTAMP.test(value) ? value : undefined;
}

function requireSha256String(value: unknown): string | undefined {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value) ? value.toLowerCase() : undefined;
}

function requirePositiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function requireNonNegativeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function isSignedIntegerString(value: unknown): boolean {
  return typeof value === 'string' && SIGNED_INTEGER_STRING.test(value);
}
