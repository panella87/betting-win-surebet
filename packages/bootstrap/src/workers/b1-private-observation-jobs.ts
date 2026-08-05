import type {
  SurebetB1BacktestRunRepository,
  SurebetB1PrivateObservationRepository,
} from '../../../persistence/src/index.js';
import type { JsonValue } from '../../../persistence/src/types.js';
import type {
  B1CrossVenueBacktestInput,
  B1CrossVenueBacktestRun,
} from '../backtest/b1-cross-venue-backtest.js';
import { runDeterministicB1CrossVenueBacktest } from '../backtest/b1-cross-venue-backtest.js';
import type { BoundaryResult } from '../contracts/local-types.js';
import type {
  BoundedWorkerJobHandler,
  BoundedWorkerJobHandlerContext,
  BoundedWorkerJobHandlerDeadLetter,
  BoundedWorkerJobHandlerResult,
} from './bounded-job-worker.js';

const JOB_PAYLOAD_SCHEMA = 'bws.b1_private_observation_job.v1';
export const B1_PRIVATE_OBSERVATION_JOB_KIND = 'b1_private_observation_cycle_v1' as const;
const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export interface PersistedB1PrivateObservationJobPayload {
  readonly schema: typeof JOB_PAYLOAD_SCHEMA;
  readonly runtimeId: string;
  readonly observationCycleId: string;
  readonly upstreamCheckpointId: string;
  readonly backtestRunId: string;
  readonly observedAt: string;
  readonly input: B1CrossVenueBacktestInput;
}

export interface B1PrivateObservationJobHandlerDependencies {
  readonly backtestRuns: Pick<SurebetB1BacktestRunRepository, 'create'>;
  readonly observations: Pick<SurebetB1PrivateObservationRepository, 'create' | 'complete' | 'block'>;
  readonly runBacktest?: typeof runDeterministicB1CrossVenueBacktest;
}

export function createB1PrivateObservationJobHandler(
  dependencies: B1PrivateObservationJobHandlerDependencies,
): BoundedWorkerJobHandler {
  return {
    async run(context: BoundedWorkerJobHandlerContext): Promise<BoundedWorkerJobHandlerResult> {
      const parsedPayload = parseB1PrivateObservationJobPayload(context.job.payload, context.now());
      if (!parsedPayload.ok) {
        return parsedPayload.error;
      }

      context.recordCheckpoint({
        checkpoint: Object.freeze({
          checkpointStage: 'b1_payload_validated',
          schema: parsedPayload.value.schema,
          upstreamReadiness: parsedPayload.value.input.fixture.upstreamReadiness,
        }),
        checkpointId: `attempt-${context.job.attemptCount}-b1-payload-validated`,
        recordedAt: context.now(),
      });

      dependencies.observations.create({
        cycleStartedAt: parsedPayload.value.observedAt,
        evidence: Object.freeze({
          checkpointStage: 'b1_observation_started',
          fixtureKind: parsedPayload.value.input.fixture.fixtureKind,
          runtimeEvidence: false,
          upstreamReadiness: parsedPayload.value.input.fixture.upstreamReadiness,
        }),
        executable: false,
        observationCycleId: parsedPayload.value.observationCycleId,
        queueName: context.job.queueName,
        runtimeEvidence: false,
        runtimeId: parsedPayload.value.runtimeId,
        upstreamCheckpointId: parsedPayload.value.upstreamCheckpointId,
        workerJobId: context.job.jobId,
      });

      const backtest = (dependencies.runBacktest ?? runDeterministicB1CrossVenueBacktest)(parsedPayload.value.input);
      if (!backtest.ok) {
        dependencies.observations.block({
          blockerCode: 'B1_PRIVATE_OBSERVATION_BACKTEST_BLOCKED',
          blockerDetails: Object.freeze({
            blockers: backtest.blockers.map((blocker) => Object.freeze({ ...blocker })),
          }),
          cycleCompletedAt: context.now(),
          evidence: Object.freeze({
            checkpointStage: 'b1_backtest_blocked',
            runtimeEvidence: false,
          }),
          observationCycleId: parsedPayload.value.observationCycleId,
        });
        return deadLetter(context.now(), 'B1_PRIVATE_OBSERVATION_BACKTEST_BLOCKED', Object.freeze({
          blockers: backtest.blockers.map((blocker) => Object.freeze({ ...blocker })),
        }));
      }

      context.recordCheckpoint({
        checkpoint: Object.freeze({
          candidateCount: backtest.value.report.metrics.candidateCount,
          checkpointStage: 'b1_backtest_completed',
          offlineFalsificationStatus: backtest.value.report.offlineFalsificationStatus,
          runHash: backtest.value.report.runHash,
        }),
        checkpointId: `attempt-${context.job.attemptCount}-b1-backtest`,
        recordedAt: context.now(),
      });

      const persistedRun = dependencies.backtestRuns.create({
        observedAt: parsedPayload.value.observedAt,
        run: backtest.value,
        runId: parsedPayload.value.backtestRunId,
        upstreamCheckpointId: parsedPayload.value.upstreamCheckpointId,
      });

      dependencies.observations.complete({
        backtestRunId: persistedRun.runId,
        cycleCompletedAt: context.now(),
        evidence: Object.freeze({
          checkpointStage: 'b1_observation_completed',
          offlineFalsificationStatus: persistedRun.offlineFalsificationStatus,
          runHash: persistedRun.runHash,
          runtimeEvidence: false,
        }),
        observationCycleId: parsedPayload.value.observationCycleId,
      });

      return {
        completedAt: context.now(),
        outcome: 'completed',
        successResult: Object.freeze({
          backtestRunId: persistedRun.runId,
          executable: false,
          liveReadiness: persistedRun.liveReadiness,
          observationCycleId: parsedPayload.value.observationCycleId,
          offlineFalsificationStatus: persistedRun.offlineFalsificationStatus,
          runHash: persistedRun.runHash,
          runtimeEvidence: false,
        }),
      };
    },
  };
}

function parseB1PrivateObservationJobPayload(
  value: JsonValue,
  failedAt: string,
): { readonly ok: true; readonly value: PersistedB1PrivateObservationJobPayload }
  | { readonly ok: false; readonly error: BoundedWorkerJobHandlerDeadLetter } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_JOB_PAYLOAD_INVALID', {
      evidenceRequired: 'A JSON object payload for the B1 private observation worker job.',
    });
  }
  const payload = value as Record<string, unknown>;
  if (payload.schema !== JOB_PAYLOAD_SCHEMA) {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_JOB_SCHEMA_INVALID', {
      evidenceRequired: `A ${JOB_PAYLOAD_SCHEMA} payload for the B1 private observation worker job.`,
      receivedSchema: payload.schema === undefined ? null : String(payload.schema),
    });
  }
  const runtimeId = requireNonEmptyString(payload.runtimeId);
  const observationCycleId = requireNonEmptyString(payload.observationCycleId);
  const upstreamCheckpointId = requireNonEmptyString(payload.upstreamCheckpointId);
  const backtestRunId = requireNonEmptyString(payload.backtestRunId);
  const observedAt = requireNonEmptyString(payload.observedAt);
  if (
    runtimeId === undefined
    || observationCycleId === undefined
    || upstreamCheckpointId === undefined
    || backtestRunId === undefined
    || observedAt === undefined
    || typeof payload.input !== 'object'
    || payload.input === null
    || Array.isArray(payload.input)
  ) {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_JOB_REQUIRED_FIELD_MISSING', {
      evidenceRequired: 'runtimeId, observationCycleId, upstreamCheckpointId, backtestRunId, observedAt and input.',
    });
  }
  if (!isIsoUtcTimestamp(observedAt)) {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_OBSERVED_AT_INVALID', {
      evidenceRequired: 'observedAt must be an ISO-8601 UTC timestamp.',
    });
  }

  const inputRecord = payload.input as Record<string, unknown>;
  if (
    typeof inputRecord.fixture !== 'object'
    || inputRecord.fixture === null
    || Array.isArray(inputRecord.fixture)
  ) {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_FIXTURE_INVALID', {
      evidenceRequired: 'payload.input.fixture must be a JSON object.',
    });
  }

  const input = payload.input as B1CrossVenueBacktestInput;
  if (input.fixture.runtimeEvidence !== false) {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_RUNTIME_EVIDENCE_FORBIDDEN', {
      evidenceRequired: 'B1 deterministic fixture with runtimeEvidence=false.',
    });
  }
  if (input.fixture.upstreamReadiness !== 'blocked_until_betting_win_b1_multi_venue_markets_v1') {
    return invalidPayload(failedAt, 'B1_PRIVATE_OBSERVATION_UPSTREAM_READINESS_FORBIDDEN', {
      evidenceRequired: 'B1 upstream readiness blocker preserved until betting-win exposes the accepted B1 API.',
    });
  }

  return {
    ok: true,
    value: Object.freeze({
      backtestRunId,
      input,
      observationCycleId,
      observedAt,
      runtimeId,
      schema: JOB_PAYLOAD_SCHEMA,
      upstreamCheckpointId,
    }),
  };
}

function invalidPayload(
  failedAt: string,
  errorCode: string,
  errorDetails: JsonValue,
): { readonly ok: false; readonly error: BoundedWorkerJobHandlerDeadLetter } {
  return {
    error: deadLetter(failedAt, errorCode, errorDetails),
    ok: false,
  };
}

function deadLetter(
  failedAt: string,
  errorCode: string,
  errorDetails: JsonValue,
): BoundedWorkerJobHandlerDeadLetter {
  return {
    errorCode,
    errorDetails,
    failedAt,
    outcome: 'dead_letter',
  };
}

function requireNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return value;
}

function isIsoUtcTimestamp(value: string): boolean {
  if (!ISO_UTC_TIMESTAMP.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export type B1PrivateObservationBacktestRunner = (
  input: B1CrossVenueBacktestInput,
) => BoundaryResult<B1CrossVenueBacktestRun>;
