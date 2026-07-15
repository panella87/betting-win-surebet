import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createReadOnlyQueryApiClient } from '../src/adapters/betting-win-query-client.js';
import { validatePinnedBettingWinBundleIntake } from '../src/adapters/betting-win-pinned-bundle-intake.js';
import type {
  IdentityReadOnlyQueryItem,
  NormalizedReadOnlyQueryItem,
  RulesReadOnlyQueryItem,
} from '../src/adapters/betting-win-query-client.js';
import type { BettingWinResourceRecord } from '../src/contracts/betting-win-resource-records.js';
import {
  runBoundedPrivatePaperRuntimeCycle,
  type PrivatePaperReadOnlyQueryRecordMappers,
  type PrivatePaperRuntimeRequest,
} from '../src/runtime/private-paper-runtime.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-14T10:00:00.000Z';
const SOLVER_READY_BUNDLE = 'tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json';

test('private paper runtime executes a bounded loopback read-only query cycle', async () => {
  await withLoopbackServer(async (baseUrl) => {
    const runtimeResult = await runBoundedPrivatePaperRuntimeCycle({
      runtimeId: 'runtime-loopback-001',
      cycleId: 'cycle-loopback-001',
      maxCandidatesPerCycle: 2,
      upstreamLock: sampleUpstreamLock(),
      source: {
        kind: 'read_only_query',
        exportedAt: '2026-07-01T00:00:03.000Z',
        sourceManifestHash: 'd'.repeat(64),
        client: createClient(baseUrl),
        requests: {
          identity: { pageSize: 10, maxPages: 1, filters: { canonicalId: 'market-002' } },
          rules: { pageSize: 10, maxPages: 1, filters: { ruleProfileId: 'rules-002' } },
          quotes: { pageSize: 10, maxPages: 1, filters: { marketId: 'market-002' } },
          settlement: { pageSize: 10, maxPages: 1, filters: { marketId: 'market-002' } },
        },
        mappers: createLoopbackRecordMappers(),
      },
      candidatePlans: [
        {
          candidateId: 'market-002',
          decisionTimestamp: '2026-07-01T00:00:02.500Z',
          maxQuoteAgeMs: 2_000,
          manualKill: false,
          completionEvents: [
            { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
            { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
            { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
            { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
          ],
        },
      ],
    } satisfies PrivatePaperRuntimeRequest);

    assert.equal(runtimeResult.ok, true);
    assert.equal(runtimeResult.value.sourceKind, 'read_only_query');
    assert.equal(runtimeResult.value.candidateCount, 1);
    assert.equal(runtimeResult.value.blockedCandidateCount, 0);
    assert.equal(runtimeResult.value.killTriggered, false);
    assert.equal(runtimeResult.value.stopReason, 'cycle_complete');
    assert.equal(runtimeResult.value.state.completedCycles.length, 1);
    assert.equal(runtimeResult.value.state.completedCycles[0]?.cycleId, 'cycle-loopback-001');

    const acceptedCandidate = runtimeResult.value.candidateResults[0];
    assert.equal(acceptedCandidate?.ok, true);
    if (acceptedCandidate?.ok !== true) {
      throw new Error('Expected accepted runtime candidate.');
    }
    assert.equal(acceptedCandidate.completionGroupState, 'group_complete');
    assert.equal(acceptedCandidate.settlement.finalOutcome, 'yes');
    assert.equal(acceptedCandidate.settledNetMinor, 5n);
  }, (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    switch (url.pathname) {
      case '/query/identity-entities':
        writeJson(response, 200, createEnvelope('identity', {
          page: {
            items: [
              {
                canonicalId: 'market-002',
                entityType: 'market',
                providerReferences: [
                  {
                    sourceLineageRecordId: 'identity-record-002',
                    canonicalEventId: 'event-002',
                    providerMarketId: 'provider-market-002',
                    providerGeneration: 'generation-002',
                  },
                ],
              },
            ],
            pageSize: 10,
            returnedCount: 1,
          },
        }));
        return;
      case '/query/rule-profiles':
        writeJson(response, 200, createEnvelope('rules', {
          page: {
            items: [
              {
                resultSource: { resultSourceId: 'result-source-002' },
                ruleProfile: {
                  ruleProfileId: 'rules-002',
                  canonicalMarketId: 'market-002',
                  finalityPolicyId: 'finality-002',
                },
              },
            ],
            pageSize: 10,
            returnedCount: 1,
          },
        }));
        return;
      case '/query/normalized-records':
        if (url.searchParams.get('recordFamily') === 'quotes') {
          writeJson(response, 200, createEnvelope('quotes', {
            page: {
              items: [
                {
                  recordType: 'evidence',
                  normalizedEvidence: {
                    sourceLineageRecordId: 'quote-yes-002',
                    canonicalMarketId: 'market-002',
                    outcome: 'yes',
                    quoteSourceManifestHash: '1'.repeat(64),
                    minStakeMinor: '100',
                    feeMinor: '5',
                    costMinor: '0',
                    evidenceId: 'quote-evidence-yes-002',
                    observedAt: '2026-07-01T00:00:02.000Z',
                    priceMinor: '1150000',
                    availableSizeMinor: '500',
                    currency: 'USDC',
                  },
                },
                {
                  recordType: 'evidence',
                  normalizedEvidence: {
                    sourceLineageRecordId: 'quote-no-002',
                    canonicalMarketId: 'market-002',
                    outcome: 'no',
                    quoteSourceManifestHash: '2'.repeat(64),
                    minStakeMinor: '100',
                    feeMinor: '5',
                    costMinor: '0',
                    evidenceId: 'quote-evidence-no-002',
                    observedAt: '2026-07-01T00:00:02.100Z',
                    priceMinor: '1250000',
                    availableSizeMinor: '500',
                    currency: 'USDC',
                  },
                },
              ],
              pageSize: 10,
              returnedCount: 2,
            },
          }));
          return;
        }
        writeJson(response, 200, createEnvelope('settlement', {
          page: {
            items: [
              {
                recordType: 'evidence',
                normalizedEvidence: {
                  sourceLineageRecordId: 'settlement-002',
                  canonicalMarketId: 'market-002',
                  ruleProfileId: 'rules-002',
                  resultSourceId: 'result-source-002',
                  finalityPolicyId: 'finality-002',
                  finalityAuthorityId: 'authority-002',
                  replayManifestHash: '9'.repeat(64),
                  replayAcceptedAt: '2026-07-01T00:05:00.000Z',
                  acceptanceStatus: 'accepted',
                  finalOutcome: 'yes',
                },
              },
            ],
            pageSize: 10,
            returnedCount: 1,
          },
        }));
        return;
      default:
        response.statusCode = 404;
        response.end();
    }
  });
});

test('private paper runtime triggers the residual exposure kill criteria and records one restart-safe cycle', async () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const runtimeResult = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-kill-001',
    cycleId: 'cycle-kill-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        residualExposureFloorMinor: 0n,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);

  assert.equal(runtimeResult.ok, true);
  assert.equal(runtimeResult.value.killTriggered, true);
  assert.equal(runtimeResult.value.stopReason, 'kill_triggered');
  assert.equal(runtimeResult.value.state.completedCycles.length, 1);

  const acceptedCandidate = runtimeResult.value.candidateResults[0];
  assert.equal(acceptedCandidate?.ok, true);
  if (acceptedCandidate?.ok !== true) {
    throw new Error('Expected accepted runtime candidate.');
  }
  assert.equal(acceptedCandidate.killTriggered, true);
  assert.equal(acceptedCandidate.killReason, 'residual_exposure_floor');
  assert.equal(acceptedCandidate.completionGroupState, 'group_killed');
});

test('private paper runtime rejects repeated cycle ids when restart input changes', async () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const firstRun = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-restart-001',
    cycleId: 'cycle-restart-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
          { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);
  assert.equal(firstRun.ok, true);

  const secondRun = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-restart-001',
    cycleId: 'cycle-restart-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    previousState: firstRun.value.state,
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);

  assert.equal(secondRun.ok, false);
  assert.deepEqual(secondRun.blockers, [
    {
      code: 'PRIVATE_PAPER_RUNTIME_IDEMPOTENCY_MISMATCH',
      message: 'Private paper runtime rejects a repeated cycle id when the runtime input fingerprint changes.',
      evidenceRequired: 'Repeated cycle ids with byte-for-byte identical runtime inputs.',
    },
  ]);
});

test('private paper runtime rejects repeated cycle ids when the pinned source content changes with the same record count', async () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const firstRun = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-source-restart-001',
    cycleId: 'cycle-source-restart-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
          { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);
  assert.equal(firstRun.ok, true);

  const changedRecords = intake.value.records.map((record) => {
    if (record.recordType !== 'quotes' || record.outcome !== 'yes') {
      return record;
    }
    return Object.freeze({
      ...record,
      quoteSourceManifestHash: 'a'.repeat(64),
    } satisfies BettingWinResourceRecord);
  });

  const secondRun = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-source-restart-001',
    cycleId: 'cycle-source-restart-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    previousState: firstRun.value.state,
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: changedRecords,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
          { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);

  assert.equal(secondRun.ok, false);
  assert.deepEqual(secondRun.blockers, [
    {
      code: 'PRIVATE_PAPER_RUNTIME_IDEMPOTENCY_MISMATCH',
      message: 'Private paper runtime rejects a repeated cycle id when the runtime input fingerprint changes.',
      evidenceRequired: 'Repeated cycle ids with byte-for-byte identical runtime inputs.',
    },
  ]);
});

test('private paper runtime rejects candidate runtime plans that do not map to a derived candidate', async () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const runtimeResult = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-unknown-plan-001',
    cycleId: 'cycle-unknown-plan-001',
    maxCandidatesPerCycle: 2,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          { legId: 'market-002:no', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.700Z' },
          { legId: 'market-002:yes', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.800Z' },
          { legId: 'market-002:no', type: 'fill', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.900Z' },
        ],
      },
      {
        candidateId: 'market-404',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-404:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);

  assert.equal(runtimeResult.ok, false);
  assert.deepEqual(runtimeResult.blockers, [
    {
      code: 'PRIVATE_PAPER_RUNTIME_PLAN_UNKNOWN_CANDIDATE',
      message: 'Private paper runtime requires every candidate runtime plan to target a derived canonical market candidate.',
      evidenceRequired: 'Candidate runtime plans aligned to the derived canonical market candidates.',
    },
  ]);
});

test('private paper runtime fails closed when quote evidence is stale at decision time', async () => {
  const intake = validatePinnedBettingWinBundleIntake(SOLVER_READY_BUNDLE, REPO_ROOT);
  assert.equal(intake.ok, true);

  const runtimeResult = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-stale-quote-001',
    cycleId: 'cycle-stale-quote-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'pinned_records',
      sourceBundleKind: 'resource_export',
      exportedAt: intake.value.bundle.exportedAt,
      sourceManifestHash: intake.value.bundle.reference.manifestHash,
      records: intake.value.records,
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:10.000Z',
        maxQuoteAgeMs: 1_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:10.100Z' },
        ],
      },
    ],
  } satisfies PrivatePaperRuntimeRequest);

  assert.equal(runtimeResult.ok, true);
  assert.equal(runtimeResult.value.blockedCandidateCount, 1);
  assert.equal(runtimeResult.value.stopReason, 'cycle_complete');

  const candidateResult = runtimeResult.value.candidateResults[0];
  assert.equal(candidateResult?.ok, false);
  assert.equal(candidateResult?.blockers[0]?.code, 'QUOTE_EVIDENCE_STALE');
});

test('private paper runtime rejects read-only query pagination that exceeds the configured bound', async () => {
  await withLoopbackServer(async (baseUrl) => {
    const runtimeResult = await runBoundedPrivatePaperRuntimeCycle({
      runtimeId: 'runtime-bound-001',
      cycleId: 'cycle-bound-001',
      maxCandidatesPerCycle: 1,
      upstreamLock: sampleUpstreamLock(),
      source: {
        kind: 'read_only_query',
        exportedAt: '2026-07-01T00:00:03.000Z',
        sourceManifestHash: 'e'.repeat(64),
        client: createClient(baseUrl),
        requests: {
          identity: { pageSize: 1, maxPages: 1, filters: { canonicalId: 'market-002' } },
          rules: { pageSize: 1, maxPages: 1, filters: { ruleProfileId: 'rules-002' } },
          quotes: { pageSize: 1, maxPages: 1, filters: { marketId: 'market-002' } },
          settlement: { pageSize: 1, maxPages: 1, filters: { marketId: 'market-002' } },
        },
        mappers: createLoopbackRecordMappers(),
      },
      candidatePlans: [
        {
          candidateId: 'market-002',
          decisionTimestamp: '2026-07-01T00:00:02.500Z',
          maxQuoteAgeMs: 2_000,
          manualKill: false,
          completionEvents: [
            { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
          ],
        },
      ],
    } satisfies PrivatePaperRuntimeRequest);

    assert.equal(runtimeResult.ok, false);
    assert.equal(runtimeResult.blockers[0]?.code, 'PRIVATE_PAPER_RUNTIME_QUERY_PAGE_BOUND_EXCEEDED');
  }, (_request, response) => {
    writeJson(response, 200, createEnvelope('identity', {
      page: {
        items: [
          {
            canonicalId: 'market-002',
            entityType: 'market',
            providerReferences: [
              {
                sourceLineageRecordId: 'identity-record-002',
                canonicalEventId: 'event-002',
                providerMarketId: 'provider-market-002',
                providerGeneration: 'generation-002',
              },
            ],
          },
        ],
        nextCursor: 'still-more',
        pageSize: 1,
        returnedCount: 1,
      },
    }));
  });
});

test('private paper runtime rejects unsupported read-only settlement polling without explicit filters', async () => {
  const client = createClient('http://127.0.0.1:9');
  const runtimeResult = await runBoundedPrivatePaperRuntimeCycle({
    runtimeId: 'runtime-invalid-001',
    cycleId: 'cycle-invalid-001',
    maxCandidatesPerCycle: 1,
    upstreamLock: sampleUpstreamLock(),
    source: {
      kind: 'read_only_query',
      exportedAt: '2026-07-01T00:00:03.000Z',
      sourceManifestHash: 'f'.repeat(64),
      client,
      requests: {
        identity: { pageSize: 1, maxPages: 1, filters: { canonicalId: 'market-002' } },
        rules: { pageSize: 1, maxPages: 1, filters: { ruleProfileId: 'rules-002' } },
        quotes: { pageSize: 1, maxPages: 1, filters: { marketId: 'market-002' } },
        settlement: { pageSize: 1, maxPages: 1 },
      },
      mappers: createLoopbackRecordMappers(),
    },
    candidatePlans: [
      {
        candidateId: 'market-002',
        decisionTimestamp: '2026-07-01T00:00:02.500Z',
        maxQuoteAgeMs: 2_000,
        manualKill: false,
        completionEvents: [
          { legId: 'market-002:yes', type: 'reserve', stakeMinor: 100n, occurredAt: '2026-07-01T00:00:02.600Z' },
        ],
      },
    ],
  } as PrivatePaperRuntimeRequest);

  assert.equal(runtimeResult.ok, false);
  assert.deepEqual(runtimeResult.blockers, [
    {
      code: 'PRIVATE_PAPER_RUNTIME_QUERY_RESOURCE_UNSUPPORTED',
      message: 'Private paper runtime requires an explicit settlement query filter set before polling the read-only API.',
      evidenceRequired: 'Explicit settlement read-only query scope for the runtime cycle.',
    },
  ]);
});

function createClient(baseUrl: string) {
  const client = createReadOnlyQueryApiClient({
    baseUrl,
    contractVersion: '1.0.0',
    fetchImplementation: globalThis.fetch.bind(globalThis),
    maxPageSize: 50,
    retryBackoffMs: 1,
    retryLimit: 1,
    timeoutMs: 50,
    upstreamLock: sampleUpstreamLock(),
  });
  assert.equal(client.ok, true);
  return client.value;
}

function createLoopbackRecordMappers(): PrivatePaperReadOnlyQueryRecordMappers {
  return {
    identity(item: IdentityReadOnlyQueryItem) {
      const firstReference = item.providerReferences?.[0] as Record<string, unknown> | undefined;
      if (firstReference === undefined) {
        return { ok: false, blockers: [{ code: 'IDENTITY_MAPPER_REFERENCE_MISSING', message: 'missing', evidenceRequired: 'identity reference' }] };
      }
      return {
        ok: true,
        value: Object.freeze([
          Object.freeze({
            recordType: 'identity',
            canonicalEventId: requireString(firstReference['canonicalEventId']),
            canonicalMarketId: item.canonicalId,
            providerMarketId: requireString(firstReference['providerMarketId']),
            providerGeneration: requireString(firstReference['providerGeneration']),
          } satisfies BettingWinResourceRecord),
        ]),
      };
    },
    rules(item: RulesReadOnlyQueryItem) {
      const ruleProfile = item.ruleProfile as Record<string, unknown> | undefined;
      const resultSource = item.resultSource as Record<string, unknown> | undefined;
      if (ruleProfile === undefined || resultSource === undefined) {
        return { ok: false, blockers: [{ code: 'RULES_MAPPER_VALUES_MISSING', message: 'missing', evidenceRequired: 'rule profile and result source' }] };
      }
      return {
        ok: true,
        value: Object.freeze([
          Object.freeze({
            recordType: 'rules',
            canonicalMarketId: requireString(ruleProfile['canonicalMarketId']),
            ruleProfileId: requireString(ruleProfile['ruleProfileId']),
            resultSourceId: requireString(resultSource['resultSourceId']),
            finalityPolicyId: requireString(ruleProfile['finalityPolicyId']),
          } satisfies BettingWinResourceRecord),
        ]),
      };
    },
    quotes(item: NormalizedReadOnlyQueryItem) {
      const normalizedEvidence = item.normalizedEvidence as Record<string, unknown> | undefined;
      if (normalizedEvidence === undefined) {
        return { ok: false, blockers: [{ code: 'QUOTES_MAPPER_EVIDENCE_MISSING', message: 'missing', evidenceRequired: 'normalized quote evidence' }] };
      }
      return {
        ok: true,
        value: Object.freeze([
          Object.freeze({
            recordType: 'quotes',
            canonicalMarketId: requireString(normalizedEvidence['canonicalMarketId']),
            outcome: requireOutcome(normalizedEvidence['outcome']),
            quoteSourceManifestHash: requireString(normalizedEvidence['quoteSourceManifestHash']),
            minStakeMinor: BigInt(requireString(normalizedEvidence['minStakeMinor'])),
            feeMinor: BigInt(requireString(normalizedEvidence['feeMinor'])),
            costMinor: BigInt(requireString(normalizedEvidence['costMinor'])),
            evidence: Object.freeze({
              evidenceId: requireString(normalizedEvidence['evidenceId']),
              observedAt: requireString(normalizedEvidence['observedAt']),
              priceMinor: BigInt(requireString(normalizedEvidence['priceMinor'])),
              availableSizeMinor: BigInt(requireString(normalizedEvidence['availableSizeMinor'])),
              currency: requireCurrency(normalizedEvidence['currency']),
            }),
          } satisfies BettingWinResourceRecord),
        ]),
      };
    },
    settlement(item: NormalizedReadOnlyQueryItem) {
      const normalizedEvidence = item.normalizedEvidence as Record<string, unknown> | undefined;
      if (normalizedEvidence === undefined) {
        return { ok: false, blockers: [{ code: 'SETTLEMENT_MAPPER_EVIDENCE_MISSING', message: 'missing', evidenceRequired: 'normalized settlement evidence' }] };
      }
      return {
        ok: true,
        value: Object.freeze([
          Object.freeze({
            recordType: 'settlement',
            canonicalMarketId: requireString(normalizedEvidence['canonicalMarketId']),
            ruleProfileId: requireString(normalizedEvidence['ruleProfileId']),
            resultSourceId: requireString(normalizedEvidence['resultSourceId']),
            finalityPolicyId: requireString(normalizedEvidence['finalityPolicyId']),
            finalityAuthorityId: requireString(normalizedEvidence['finalityAuthorityId']),
            replayManifestHash: requireString(normalizedEvidence['replayManifestHash']),
            replayAcceptedAt: requireString(normalizedEvidence['replayAcceptedAt']),
            acceptanceStatus: 'accepted',
            finalOutcome: requireOutcome(normalizedEvidence['finalOutcome']),
          } satisfies BettingWinResourceRecord),
        ]),
      };
    },
  };
}

async function withLoopbackServer(
  run: (baseUrl: string) => Promise<void>,
  handler: (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage>,
  ) => void | Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    Promise.resolve(handler(request, response)).catch((error: unknown) => {
      response.statusCode = 500;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown error' }));
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  const loopbackAddress = address as AddressInfo;

  try {
    await run(`http://127.0.0.1:${loopbackAddress.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

function createEnvelope(
  resource: 'identity' | 'quotes' | 'rules' | 'settlement',
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    contractAlias: 'betting-win-strategy-export.v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractVersion: '1.0.0',
    page: {
      items: [],
      pageSize: 1,
      returnedCount: 0,
    },
    provenance: {
      commitSha: sampleUpstreamLock().commitSha,
      repository: 'betting-win',
      responseReceivedAt: TEST_TIMESTAMP,
      sourceView: 'committed_git_head',
      verifiedAt: TEST_TIMESTAMP,
    },
    resource,
    surebetProfile: 'surebet_standard_binary_v0',
    ...overrides,
  };
}

function writeJson(response: ServerResponse<IncomingMessage>, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(`${JSON.stringify(body)}\n`);
}

function sampleUpstreamLock(): BettingWinUpstreamLock {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: '/tmp/betting-win',
    commitSha: '1'.repeat(40),
    gitTreeSha: '2'.repeat(40),
    sourceView: 'committed_git_head',
    packageVersion: '0.48.0',
    trackedTreeListingSha256: '3'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt: TEST_TIMESTAMP,
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
  });
}

function requireString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Expected non-empty string.');
  }
  return value;
}

function requireOutcome(value: unknown): 'yes' | 'no' {
  if (value !== 'yes' && value !== 'no') {
    throw new Error('Expected yes/no outcome.');
  }
  return value;
}

function requireCurrency(value: unknown): 'USDC' | 'USD' | 'UNKNOWN' {
  if (value !== 'USDC' && value !== 'USD' && value !== 'UNKNOWN') {
    throw new Error('Expected supported quote currency.');
  }
  return value;
}
