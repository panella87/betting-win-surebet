import { createHash } from 'node:crypto';
import type {
  SurebetWorkerJobCompletionRequest,
  SurebetWorkerJobFailureRequest,
  SurebetWorkerJobRecord,
  SurebetWorkerJobRepository,
} from '../../../persistence/src/repositories/worker-job-repository.js';
import type { JsonValue } from '../../../persistence/src/types.js';
import { accepted, blocked, type BoundaryResult, type IsoTimestamp } from '../contracts/local-types.js';

const ISO_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const MAX_JOBS_PER_PASS = 128;

export interface BoundedWorkerJobCheckpointRequest {
  readonly checkpointId: string;
  readonly checkpoint: JsonValue;
  readonly recordedAt: IsoTimestamp;
}

export interface BoundedWorkerJobHandlerContext {
  readonly job: SurebetWorkerJobRecord;
  readonly leaseDurationMs: number;
  readonly now: () => IsoTimestamp;
  heartbeat(heartbeatAt: IsoTimestamp): SurebetWorkerJobRecord;
  recordCheckpoint(request: BoundedWorkerJobCheckpointRequest): void;
}

export interface BoundedWorkerJobHandlerCompletion {
  readonly outcome: 'completed';
  readonly completedAt: IsoTimestamp;
  readonly successResult: JsonValue;
}

export interface BoundedWorkerJobHandlerRetry {
  readonly outcome: 'retry';
  readonly failedAt: IsoTimestamp;
  readonly errorCode: string;
  readonly errorDetails: JsonValue;
}

export interface BoundedWorkerJobHandlerDeadLetter {
  readonly outcome: 'dead_letter';
  readonly failedAt: IsoTimestamp;
  readonly errorCode: string;
  readonly errorDetails: JsonValue;
}

export type BoundedWorkerJobHandlerResult =
  | BoundedWorkerJobHandlerCompletion
  | BoundedWorkerJobHandlerRetry
  | BoundedWorkerJobHandlerDeadLetter;

export interface BoundedWorkerJobHandler {
  run(context: BoundedWorkerJobHandlerContext): Promise<BoundedWorkerJobHandlerResult>;
}

export interface RunBoundedWorkerPassRequest {
  readonly handlers: Readonly<Record<string, BoundedWorkerJobHandler>>;
  readonly jobs: Pick<
    SurebetWorkerJobRepository,
    | 'claimNext'
    | 'complete'
    | 'deadLetterOwnedJob'
    | 'fail'
    | 'heartbeatLease'
    | 'recordCheckpoint'
    | 'reapExpiredLeases'
  >;
  readonly leaseDurationMs: number;
  readonly maxJobs: number;
  readonly now: () => IsoTimestamp;
  readonly queueName: string;
  readonly workerId: string;
}

export interface BoundedWorkerProcessedJob {
  readonly finalStatus: 'completed' | 'retry_wait' | 'dead_lettered';
  readonly jobId: string;
  readonly jobKind: string;
}

export interface BoundedWorkerPassResult {
  readonly workerId: string;
  readonly queueName: string;
  readonly startedAt: IsoTimestamp;
  readonly finishedAt: IsoTimestamp;
  readonly claimedCount: number;
  readonly completedCount: number;
  readonly retryCount: number;
  readonly deadLetterCount: number;
  readonly expiredLeaseDeadLetterCount: number;
  readonly processedJobs: readonly BoundedWorkerProcessedJob[];
}

export async function runBoundedWorkerPass(
  request: RunBoundedWorkerPassRequest,
): Promise<BoundaryResult<BoundedWorkerPassResult>> {
  const validated = validateWorkerPassRequest(request);
  if (!validated.ok) {
    return validated;
  }

  const startedAt = validated.value.now();
  const expiredLeaseDeadLetterCount = validated.value.jobs.reapExpiredLeases(startedAt).length;
  const processedJobs: BoundedWorkerProcessedJob[] = [];
  let claimedCount = 0;
  let completedCount = 0;
  let retryCount = 0;
  let deadLetterCount = 0;

  for (let index = 0; index < validated.value.maxJobs; index += 1) {
    const claimedAt = validated.value.now();
    const leaseToken = createLeaseToken(
      validated.value.workerId,
      validated.value.queueName,
      claimedAt,
      index,
    );
    const job = validated.value.jobs.claimNext({
      claimedAt,
      leaseDurationMs: validated.value.leaseDurationMs,
      leaseToken,
      queueName: validated.value.queueName,
      workerId: validated.value.workerId,
    });
    if (job === undefined) {
      break;
    }
    claimedCount += 1;

    const handler = validated.value.handlers[job.jobKind];
    const handlerContext: BoundedWorkerJobHandlerContext = {
      job,
      leaseDurationMs: validated.value.leaseDurationMs,
      now: validated.value.now,
      heartbeat: (heartbeatAt) =>
        validated.value.jobs.heartbeatLease({
          heartbeatAt,
          jobId: job.jobId,
          leaseDurationMs: validated.value.leaseDurationMs,
          leaseToken,
          workerId: validated.value.workerId,
        }),
      recordCheckpoint: ({ checkpoint, checkpointId, recordedAt }) => {
        validated.value.jobs.recordCheckpoint({
          checkpoint,
          checkpointId,
          jobId: job.jobId,
          leaseToken,
          recordedAt,
          workerId: validated.value.workerId,
        });
      },
    };

    let handlerResult: BoundedWorkerJobHandlerResult;
    if (handler === undefined) {
      handlerResult = {
        errorCode: 'BWS_WORKER_HANDLER_MISSING',
        errorDetails: Object.freeze({
          evidenceRequired: 'A registered bounded worker handler for the claimed job kind.',
          jobKind: job.jobKind,
        }),
        failedAt: validated.value.now(),
        outcome: 'dead_letter',
      };
    } else {
      try {
        handlerResult = await handler.run(handlerContext);
      } catch (error) {
        handlerResult = {
          errorCode: 'BWS_WORKER_HANDLER_THROWN',
          errorDetails: toErrorDetails(error),
          failedAt: validated.value.now(),
          outcome: 'dead_letter',
        };
      }
    }

    switch (handlerResult.outcome) {
      case 'completed':
        validated.value.jobs.complete(toCompletionRequest(job.jobId, validated.value.workerId, leaseToken, handlerResult));
        completedCount += 1;
        processedJobs.push(Object.freeze({ finalStatus: 'completed', jobId: job.jobId, jobKind: job.jobKind }));
        break;
      case 'retry': {
        const updated = validated.value.jobs.fail(toFailureRequest(job.jobId, validated.value.workerId, leaseToken, handlerResult));
        retryCount += updated.status === 'retry_wait' ? 1 : 0;
        deadLetterCount += updated.status === 'dead_lettered' ? 1 : 0;
        processedJobs.push(
          Object.freeze({
            finalStatus: updated.status === 'dead_lettered' ? 'dead_lettered' : 'retry_wait',
            jobId: job.jobId,
            jobKind: job.jobKind,
          }),
        );
        break;
      }
      case 'dead_letter':
        validated.value.jobs.deadLetterOwnedJob(job, handlerResult.failedAt, handlerResult.errorCode, handlerResult.errorDetails);
        deadLetterCount += 1;
        processedJobs.push(Object.freeze({ finalStatus: 'dead_lettered', jobId: job.jobId, jobKind: job.jobKind }));
        break;
    }
  }

  return accepted(
    Object.freeze({
      claimedCount,
      completedCount,
      deadLetterCount,
      expiredLeaseDeadLetterCount,
      finishedAt: validated.value.now(),
      processedJobs: Object.freeze(processedJobs),
      queueName: validated.value.queueName,
      retryCount,
      startedAt,
      workerId: validated.value.workerId,
    }),
  );
}

function validateWorkerPassRequest(
  request: RunBoundedWorkerPassRequest,
): BoundaryResult<RunBoundedWorkerPassRequest> {
  if (typeof request.now !== 'function') {
    return blocked(
      'BWS_WORKER_CLOCK_MISSING',
      'Bounded workers require an explicit UTC clock function.',
      'A deterministic UTC timestamp source for job claims and checkpoints.',
    );
  }
  if (Object.keys(request.handlers).length === 0) {
    return blocked(
      'BWS_WORKER_HANDLERS_EMPTY',
      'Bounded workers require at least one registered handler.',
      'A non-empty job-kind to handler mapping for the bounded worker pass.',
    );
  }
  if (typeof request.queueName !== 'string' || request.queueName.trim().length === 0) {
    return blocked(
      'BWS_WORKER_QUEUE_INVALID',
      'Bounded workers require a non-empty queue name.',
      'An explicit surebet worker queue name.',
    );
  }
  if (typeof request.workerId !== 'string' || request.workerId.trim().length === 0) {
    return blocked(
      'BWS_WORKER_ID_INVALID',
      'Bounded workers require a non-empty worker id.',
      'A stable worker id for lease ownership and observability.',
    );
  }
  if (!Number.isSafeInteger(request.leaseDurationMs) || request.leaseDurationMs < 1) {
    return blocked(
      'BWS_WORKER_LEASE_INVALID',
      'Bounded workers require a positive integer lease duration.',
      'An explicit bounded job lease duration in milliseconds.',
    );
  }
  if (
    !Number.isSafeInteger(request.maxJobs)
    || request.maxJobs < 1
    || request.maxJobs > MAX_JOBS_PER_PASS
  ) {
    return blocked(
      'BWS_WORKER_BOUND_INVALID',
      `Bounded workers require maxJobs to stay between 1 and ${MAX_JOBS_PER_PASS}.`,
      'An explicit bounded job count for each worker pass.',
    );
  }
  const probe = request.now();
  if (!ISO_UTC_TIMESTAMP.test(probe)) {
    return blocked(
      'BWS_WORKER_CLOCK_INVALID',
      'Bounded workers require the UTC clock to emit ISO-8601 UTC timestamps.',
      'A UTC clock function that returns ISO-8601 timestamps.',
    );
  }
  return accepted(request);
}

function createLeaseToken(
  workerId: string,
  queueName: string,
  claimedAt: string,
  index: number,
): string {
  return createHash('sha256')
    .update(`${workerId}\n${queueName}\n${claimedAt}\n${index}`)
    .digest('hex');
}

function toCompletionRequest(
  jobId: string,
  workerId: string,
  leaseToken: string,
  result: BoundedWorkerJobHandlerCompletion,
): SurebetWorkerJobCompletionRequest {
  return Object.freeze({
    completedAt: result.completedAt,
    jobId,
    leaseToken,
    successResult: result.successResult,
    workerId,
  });
}

function toFailureRequest(
  jobId: string,
  workerId: string,
  leaseToken: string,
  result: BoundedWorkerJobHandlerRetry,
): SurebetWorkerJobFailureRequest {
  return Object.freeze({
    errorCode: result.errorCode,
    errorDetails: result.errorDetails,
    failedAt: result.failedAt,
    jobId,
    leaseToken,
    workerId,
  });
}

function toErrorDetails(error: unknown): JsonValue {
  if (error instanceof Error) {
    return Object.freeze({
      ...(typeof error.cause === 'string' ? { cause: error.cause } : {}),
      message: error.message,
      name: error.name,
    });
  }
  return Object.freeze({
    message: String(error),
    name: 'NonErrorThrow',
  });
}
