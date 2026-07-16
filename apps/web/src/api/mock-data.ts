import type {
  BwsPrivatePaperRuntimeCycleItem,
  BwsPinnedStrategyExportItem,
  BwsReadOnlyQueryResponse,
  BwsStrategyLedgerItem,
} from '../../../../packages/bootstrap/src/api/bws-read-only-query-service.js';
import type { SurebetStrategyLedgerEntry } from '../../../../packages/bootstrap/src/strategy/strategy-ledger.js';
import type {
  BwsOperatorCockpitPinnedExportScope,
  BwsOperatorCockpitSnapshot,
} from './contracts.js';

const MOCK_GENERATED_AT = '2026-07-15T08:30:00.000Z';
const MOCK_CONTRACT_ALIAS = 'betting-win-strategy-export.v1' as const;

function strategyEntry(
  values: Readonly<{
    acceptanceState: SurebetStrategyLedgerEntry['acceptanceState'];
    blockedCandidateCount: number;
    blockerCodes: readonly string[];
    blockerCount: number;
    candidateId: string;
    canonicalMarketId: string;
    completionGroupState?: string;
    exportedAt: string;
    finalOutcome?: 'yes' | 'no';
    killReason?: 'manual' | 'residual_exposure_floor';
    ledgerEntryId: string;
    reportId: string;
    runFingerprintSha256: string;
    runKind: SurebetStrategyLedgerEntry['runKind'];
    runReferenceId: string;
    settledNetMinor?: string;
    sourceKind: SurebetStrategyLedgerEntry['sourceKind'];
    sourceManifestHash: string;
    stopReason?: 'cycle_complete' | 'kill_triggered';
  }>,
): BwsStrategyLedgerItem {
  const entry: SurebetStrategyLedgerEntry = Object.freeze({
    acceptanceState: values.acceptanceState,
    blockedCandidateCount: values.blockedCandidateCount,
    blockerCount: values.blockerCount,
    candidateCount: 1,
    ledgerEntryId: values.ledgerEntryId,
    liveState: 'not_claimed',
    privacy: 'private_only',
    profitabilityState: 'not_reported',
    publicDistributionState: 'withheld',
    report: Object.freeze({
      acceptanceState: values.acceptanceState,
      blockedCandidateCount: values.blockedCandidateCount,
      blockerCount: values.blockerCount,
      candidateCount: 1,
      candidates: Object.freeze([
        Object.freeze({
          blockerCodes: Object.freeze(values.blockerCodes),
          blockerCount: values.blockerCount,
          candidateId: values.candidateId,
          canonicalMarketId: values.canonicalMarketId,
          ...(values.completionGroupState === undefined ? {} : { completionGroupState: values.completionGroupState }),
          ...(values.finalOutcome === undefined ? {} : { finalOutcome: values.finalOutcome }),
          ...(values.killReason === undefined ? {} : { killReason: values.killReason }),
          resultState: values.acceptanceState,
          ...(values.settledNetMinor === undefined ? {} : { settledNetMinor: values.settledNetMinor }),
        }),
      ]),
      exportedAt: values.exportedAt,
      liveState: 'not_claimed',
      privacy: 'private_only',
      profitabilityState: 'not_reported',
      publicDistributionState: 'withheld',
      reportId: values.reportId,
      reportKind: 'surebet_strategy_report_v1',
      runFingerprintSha256: values.runFingerprintSha256,
      runKind: values.runKind,
      runReferenceId: values.runReferenceId,
      settlementState: values.acceptanceState === 'accepted_local_evidence' ? 'reconciled' : 'blocked',
      sourceKind: values.sourceKind,
      sourceManifestHash: values.sourceManifestHash,
      statement:
        'private deterministic surebet strategy evidence only; excludes public distribution, wallet actions, and approval claims',
      ...(values.stopReason === undefined ? {} : { stopReason: values.stopReason }),
      upstream: Object.freeze({
        commitSha: '1'.repeat(40),
        contractAlias: MOCK_CONTRACT_ALIAS,
        contractSchema: 'betting-win.strategy-export.v1',
        gitTreeSha: '2'.repeat(40),
        repository: 'betting-win',
        surebetProfile: 'surebet_standard_binary_v0',
        trackedTreeListingSha256: '3'.repeat(64),
      }),
    }),
    reportId: values.reportId,
    reportKind: 'surebet_strategy_report_v1',
    reportSha256: values.runFingerprintSha256,
    runFingerprintSha256: values.runFingerprintSha256,
    runKind: values.runKind,
    runReferenceId: values.runReferenceId,
    settlementState: values.acceptanceState === 'accepted_local_evidence' ? 'reconciled' : 'blocked',
    sourceKind: values.sourceKind,
    sourceManifestHash: values.sourceManifestHash,
  });

  return Object.freeze({
    entry,
    insertedAt: values.exportedAt,
    ledgerEntryId: values.ledgerEntryId,
    provenance: Object.freeze({
      ...(values.sourceKind === 'read_only_query'
        ? {}
        : {
            importRun: Object.freeze({
              completedAt: values.exportedAt,
              importRunId: 'import-run-001',
              importedRecordCount: 4,
              metadata: Object.freeze({
                contractSchema: 'betting-win.strategy-export.v1',
              }),
              outcome: 'succeeded',
              requestedAt: values.exportedAt,
              sourceKind: 'workspace_export_bundle',
              sourceLocator: '/artifacts/imports/export-001.json',
              startedAt: values.exportedAt,
              upstreamLockRecordId: 'lock-001',
              insertedAt: values.exportedAt,
              updatedAt: values.exportedAt,
          }),
        }),
      ...(values.sourceKind === 'read_only_query'
        ? {}
        : {
            pinnedStrategyExport: Object.freeze({
              contractAlias: MOCK_CONTRACT_ALIAS,
              contractSchema: 'betting-win.strategy-export.v1',
              endpointId: 'endpoint-pm-primary',
              exportId: 'provider-history-export.mock-001',
              exportKind: 'pinned_provider_history_bundle',
              exportProfile: 'provider_history_fixture_bundle_v1',
              exportedAt: values.exportedAt,
              importedAt: values.exportedAt,
              importRunId: 'import-run-001',
              intakeRecordId: 'intake-001',
              normalizedEvidenceIds: Object.freeze(['normalized-001']),
              payloadSha256: '4'.repeat(64),
              providerGenerationIds: Object.freeze(['generation-001']),
              providerId: 'polymarket',
              sourceLineageRecordIds: Object.freeze(['record-001']),
              sourceLocator: '/artifacts/exports/export-001.json',
              sourceSha256: '5'.repeat(64),
              surebetProfile: 'surebet_standard_binary_v0',
              upstreamLockRecordId: 'lock-001',
              insertedAt: values.exportedAt,
            }),
          }),
      upstreamLock: Object.freeze({
        capabilities: Object.freeze([
          'exportHistoricalBundle',
          'getHistoricalQuotes',
          'getProviderGenerations',
          'inspectSourceLineage',
        ]),
        commitSha: '1'.repeat(40),
        contractAlias: MOCK_CONTRACT_ALIAS,
        contractSchema: 'betting-win.strategy-export.v1',
        gitTreeSha: '2'.repeat(40),
        packageVersion: '0.48.0',
        packageVersions: Object.freeze({
          '@betting-win/query-service': '0.48.0',
        }),
        repository: 'betting-win',
        repositoryPath: '/workspace/betting-win',
        schema: 'betting-win-surebet-upstream-lock-v1',
        sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
        sourceView: 'committed_git_head',
        surebetProfile: 'surebet_standard_binary_v0',
        trackedTreeListingSha256: '3'.repeat(64),
        verifiedAt: values.exportedAt,
      }),
      upstreamLockRecordId: 'lock-001',
    }),
  });
}

function strategyResponse(
  items: readonly BwsStrategyLedgerItem[],
): BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem> {
  return Object.freeze({
    boundary: Object.freeze({
      automaticFallback: 'forbidden',
      bwsReadOnlyQueryServiceBoundary: '@betting-win-surebet/bootstrap:BWS-400',
      upstreamReadOnlyQueryClientBoundary: '@betting-win-surebet/bootstrap:BWS-140',
    }),
    generatedAt: MOCK_GENERATED_AT,
    page: Object.freeze({
      items: Object.freeze(items),
      pageSize: 8,
      returnedCount: items.length,
    }),
    resource: 'strategy_ledger_entries',
  });
}

function runtimeCycleResponse(
  items: readonly BwsPrivatePaperRuntimeCycleItem[],
): BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem> {
  return Object.freeze({
    boundary: Object.freeze({
      automaticFallback: 'forbidden',
      bwsReadOnlyQueryServiceBoundary: '@betting-win-surebet/bootstrap:BWS-400',
      upstreamReadOnlyQueryClientBoundary: '@betting-win-surebet/bootstrap:BWS-140',
    }),
    generatedAt: MOCK_GENERATED_AT,
    page: Object.freeze({
      items: Object.freeze(items),
      pageSize: 8,
      returnedCount: items.length,
    }),
    resource: 'private_paper_runtime_cycles',
  });
}

function runtimeCycle(
  values: Readonly<{
    acceptanceState: 'accepted_local_evidence' | 'blocked';
    blockedReasonCode?: string;
    cycleNumber: number;
    deadLetterReasonCode?: string;
    jobId: string;
    lastErrorCode?: string;
    runtimeId: string;
    schedulerCheckpointId: string;
    sourceManifestHash: string;
    strategyLedger?: BwsStrategyLedgerItem;
  }>,
): BwsPrivatePaperRuntimeCycleItem {
  const cycleId = `${values.schedulerCheckpointId}:cycle:${values.cycleNumber}`;
  return Object.freeze({
    acceptanceState: values.acceptanceState,
    ...(values.blockedReasonCode === undefined ? {} : { blockedReasonCode: values.blockedReasonCode }),
    cycleId,
    cycleNumber: values.cycleNumber,
    ...(values.deadLetterReasonCode === undefined
      ? {}
      : {
          deadLetter: Object.freeze({
            checkpointCount: 1,
            deadLetterReasonCode: values.deadLetterReasonCode,
            deadLetterReasonDetails: Object.freeze({
              evidenceRequired: 'Persisted dead-letter evidence.',
              lastErrorCode: values.lastErrorCode ?? values.deadLetterReasonCode,
            }),
            finalAttemptCount: values.acceptanceState === 'accepted_local_evidence' ? 1 : 2,
            insertedAt: MOCK_GENERATED_AT,
          }),
        }),
    job: Object.freeze({
      attemptCount: values.acceptanceState === 'accepted_local_evidence' ? 2 : 2,
      checkpointCount: values.acceptanceState === 'accepted_local_evidence' ? 3 : 1,
      completedAt: MOCK_GENERATED_AT,
      insertedAt: MOCK_GENERATED_AT,
      jobId: values.jobId,
      lastCheckpointAt: MOCK_GENERATED_AT,
      lastCheckpointId: values.acceptanceState === 'accepted_local_evidence'
        ? 'attempt-2-strategy-ledger'
        : 'attempt-2-runtime-blocked',
      ...(values.lastErrorCode === undefined ? {} : { lastErrorCode: values.lastErrorCode }),
      queueName: 'private-paper',
      status: values.deadLetterReasonCode === undefined ? 'succeeded' : 'dead_lettered',
      updatedAt: MOCK_GENERATED_AT,
    }),
    provenance: Object.freeze({
      cycleImportRun: Object.freeze({
        completedAt: MOCK_GENERATED_AT,
        importRunId: `import:${values.schedulerCheckpointId}:cycle:${values.cycleNumber}:settlement:page:1`,
        importedRecordCount: 4,
        insertedAt: MOCK_GENERATED_AT,
        metadata: Object.freeze({
          checkpointId: values.schedulerCheckpointId,
          contractSchema: 'betting-win.strategy-export.v1',
          cycleNumber: values.cycleNumber,
          mode: 'api',
          page: Object.freeze({
            pageNumber: 1,
            provenance: Object.freeze({
              responseReceivedAt: MOCK_GENERATED_AT,
            }),
            resource: 'settlement',
          }),
          upstreamLockRecordId: 'lock-001',
        }),
        outcome: 'succeeded',
        requestedAt: MOCK_GENERATED_AT,
        sourceKind: 'continuous_read_only_query_page',
        sourceLocator: '/artifacts/imports/runtime-cycle-page-001.json',
        startedAt: MOCK_GENERATED_AT,
        updatedAt: MOCK_GENERATED_AT,
        upstreamLockRecordId: 'lock-001',
      }),
      schedulerCheckpoint: Object.freeze({
        configSha256: 'a'.repeat(64),
        insertedAt: MOCK_GENERATED_AT,
        lastScheduledApiCycleNumber: values.cycleNumber,
        lastScheduledAt: MOCK_GENERATED_AT,
        lastScheduledJobId: values.jobId,
        lastScheduledSourceId: `api-cycle:${values.schedulerCheckpointId}:${values.cycleNumber}`,
        mode: 'api',
        queueName: 'private-paper',
        runtimeId: values.runtimeId,
        schedulerCheckpointId: values.schedulerCheckpointId,
        updatedAt: MOCK_GENERATED_AT,
        upstreamCheckpointId: 'checkpoint-api-001',
        upstreamLockRecordId: 'lock-001',
      }),
      upstreamApiCheckpoint: Object.freeze({
        apiBaseUrl: 'http://127.0.0.1:4312',
        checkpointId: 'checkpoint-api-001',
        completedCycleCount: values.cycleNumber,
        contractVersion: 'v1',
        currentCycleNumber: values.cycleNumber + 1,
        currentResource: 'identity',
        currentResourcePageCount: 0,
        insertedAt: MOCK_GENERATED_AT,
        maxPagesPerResource: 4,
        mode: 'api',
        pageSize: 2,
        retryBackoffMs: 250,
        retryLimit: 1,
        timeoutMs: 1000,
        updatedAt: MOCK_GENERATED_AT,
        upstreamLockRecordId: 'lock-001',
      }),
      upstreamLock: Object.freeze({
        capabilities: Object.freeze([
          'exportHistoricalBundle',
          'getHistoricalQuotes',
          'getProviderGenerations',
          'inspectSourceLineage',
        ]),
        commitSha: '1'.repeat(40),
        contractAlias: MOCK_CONTRACT_ALIAS,
        contractSchema: 'betting-win.strategy-export.v1',
        gitTreeSha: '2'.repeat(40),
        packageVersion: '0.48.0',
        packageVersions: Object.freeze({
          '@betting-win/query-service': '0.48.0',
        }),
        repository: 'betting-win',
        repositoryPath: '/workspace/betting-win',
        schema: 'betting-win-surebet-upstream-lock-v1',
        sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
        sourceView: 'committed_git_head',
        surebetProfile: 'surebet_standard_binary_v0',
        trackedTreeListingSha256: '3'.repeat(64),
        verifiedAt: MOCK_GENERATED_AT,
      }),
      upstreamLockRecordId: 'lock-001',
    }),
    recentCheckpoints: Object.freeze(
      (values.acceptanceState === 'accepted_local_evidence'
        ? [
            {
              checkpoint: Object.freeze({ checkpointStage: 'payload_validated' }),
              checkpointId: 'attempt-2-payload-validated',
            },
            {
              checkpoint: Object.freeze({ checkpointStage: 'runtime_cycle_completed', stopReason: 'cycle_complete' }),
              checkpointId: 'attempt-2-runtime-cycle',
            },
            {
              checkpoint: Object.freeze({ checkpointStage: 'strategy_ledger_persisted', ledgerEntryId: values.strategyLedger?.ledgerEntryId }),
              checkpointId: 'attempt-2-strategy-ledger',
            },
          ]
        : [
            {
              checkpoint: Object.freeze({ checkpointStage: 'runtime_cycle_completed', blockerCode: values.deadLetterReasonCode }),
              checkpointId: 'attempt-2-runtime-blocked',
            },
          ]).map((checkpoint) =>
        Object.freeze({
          ...checkpoint,
          checkpointSha256: '6'.repeat(64),
          recordedAt: MOCK_GENERATED_AT,
        })),
    ),
    runtimeId: values.runtimeId,
    sourceKind: 'read_only_query',
    sourceManifestHash: values.sourceManifestHash,
    ...(values.strategyLedger === undefined ? {} : { strategyLedger: values.strategyLedger }),
  });
}

function pinnedExport(
  scope: BwsOperatorCockpitPinnedExportScope,
): BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem> {
  return Object.freeze({
    boundary: Object.freeze({
      automaticFallback: 'forbidden',
      bwsReadOnlyQueryServiceBoundary: '@betting-win-surebet/bootstrap:BWS-400',
      upstreamReadOnlyQueryClientBoundary: '@betting-win-surebet/bootstrap:BWS-140',
    }),
    generatedAt: MOCK_GENERATED_AT,
    page: Object.freeze({
      items: Object.freeze([
        Object.freeze({
          intakeRecordId: 'intake-001',
          insertedAt: MOCK_GENERATED_AT,
          provenance: Object.freeze({
            importRun: Object.freeze({
              completedAt: MOCK_GENERATED_AT,
              importRunId: 'import-run-001',
              importedRecordCount: 4,
              metadata: Object.freeze({
                contractSchema: 'betting-win.strategy-export.v1',
              }),
              outcome: 'succeeded',
              requestedAt: MOCK_GENERATED_AT,
              sourceKind: 'workspace_export_bundle',
              sourceLocator: '/artifacts/imports/export-001.json',
              startedAt: MOCK_GENERATED_AT,
              upstreamLockRecordId: 'lock-001',
              insertedAt: MOCK_GENERATED_AT,
              updatedAt: MOCK_GENERATED_AT,
            }),
            upstreamLock: Object.freeze({
              capabilities: Object.freeze([
                'exportHistoricalBundle',
                'getHistoricalQuotes',
                'getProviderGenerations',
                'inspectSourceLineage',
              ]),
              commitSha: '1'.repeat(40),
              contractAlias: MOCK_CONTRACT_ALIAS,
              contractSchema: 'betting-win.strategy-export.v1',
              gitTreeSha: '2'.repeat(40),
              packageVersion: '0.48.0',
              packageVersions: Object.freeze({
                '@betting-win/query-service': '0.48.0',
              }),
              repository: 'betting-win',
              repositoryPath: '/workspace/betting-win',
              schema: 'betting-win-surebet-upstream-lock-v1',
              sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
              sourceView: 'committed_git_head',
              surebetProfile: 'surebet_standard_binary_v0',
              trackedTreeListingSha256: '3'.repeat(64),
              verifiedAt: MOCK_GENERATED_AT,
            }),
            upstreamLockRecordId: scope.upstreamLockRecordId ?? 'lock-001',
          }),
          record: Object.freeze({
            contractAlias: MOCK_CONTRACT_ALIAS,
            contractSchema: 'betting-win.strategy-export.v1',
            endpointId: scope.endpointId ?? 'endpoint-pm-primary',
            exportId: scope.exportId ?? 'provider-history-export.mock-001',
            exportKind: 'pinned_provider_history_bundle',
            exportProfile: 'provider_history_fixture_bundle_v1',
            exportedAt: MOCK_GENERATED_AT,
            importedAt: MOCK_GENERATED_AT,
            importRunId: scope.importRunId ?? 'import-run-001',
            normalizedEvidenceIds: Object.freeze(['normalized-001']),
            payloadSha256: '4'.repeat(64),
            providerGenerationIds: Object.freeze(['generation-001']),
            providerId: scope.providerId ?? 'polymarket',
            sourceLineageRecordIds: Object.freeze(['record-001']),
            sourceLocator: '/artifacts/exports/export-001.json',
            sourceSha256: scope.sourceSha256 ?? '5'.repeat(64),
            surebetProfile: 'surebet_standard_binary_v0',
            intakeRecordId: 'intake-001',
            upstreamLockRecordId: scope.upstreamLockRecordId ?? 'lock-001',
            insertedAt: MOCK_GENERATED_AT,
          }),
        }),
      ]),
      pageSize: 8,
      returnedCount: 1,
    }),
    resource: 'pinned_strategy_exports',
  });
}

export function createMockBwsOperatorCockpitSnapshot(): BwsOperatorCockpitSnapshot {
  const acceptedPaperRuns = strategyResponse([
    strategyEntry({
      acceptanceState: 'accepted_local_evidence',
      blockedCandidateCount: 0,
      blockerCodes: Object.freeze([]),
      blockerCount: 0,
      candidateId: 'candidate-paper-accepted-001',
      canonicalMarketId: 'market-003',
      completionGroupState: 'group_complete',
      exportedAt: MOCK_GENERATED_AT,
      finalOutcome: 'no',
      ledgerEntryId: 'private_paper_runtime_cycle:cccc',
      reportId: 'report-paper-accepted-001',
      runFingerprintSha256: 'c'.repeat(64),
      runKind: 'private_paper_runtime_cycle',
      runReferenceId: 'runtime-001:scheduler-001:cycle:1',
      settledNetMinor: '-3',
      sourceKind: 'read_only_query',
      sourceManifestHash: 'd'.repeat(64),
      stopReason: 'cycle_complete',
    }),
  ]);
  const blockedPaperRuns = strategyResponse([
    strategyEntry({
      acceptanceState: 'blocked',
      blockedCandidateCount: 1,
      blockerCodes: Object.freeze(['RESIDUAL_EXPOSURE_FLOOR_TRIGGERED']),
      blockerCount: 1,
      candidateId: 'candidate-paper-blocked-001',
      canonicalMarketId: 'market-005',
      exportedAt: MOCK_GENERATED_AT,
      ledgerEntryId: 'private_paper_runtime_cycle:9999',
      reportId: 'report-paper-blocked-001',
      runFingerprintSha256: '9'.repeat(64),
      runKind: 'private_paper_runtime_cycle',
      runReferenceId: 'runtime-001:scheduler-001:cycle:2',
      sourceKind: 'read_only_query',
      sourceManifestHash: '8'.repeat(64),
      stopReason: 'kill_triggered',
    }),
  ]);
  return Object.freeze({
    acceptedBacktests: strategyResponse([
      strategyEntry({
        acceptanceState: 'accepted_local_evidence',
        blockedCandidateCount: 0,
        blockerCodes: Object.freeze([]),
        blockerCount: 0,
        candidateId: 'candidate-backtest-accepted-001',
        canonicalMarketId: 'market-002',
        completionGroupState: 'group_complete',
        exportedAt: MOCK_GENERATED_AT,
        finalOutcome: 'yes',
        ledgerEntryId: 'deterministic_standard_binary_backtest:aaaa',
        reportId: 'report-backtest-accepted-001',
        runFingerprintSha256: 'a'.repeat(64),
        runKind: 'deterministic_standard_binary_backtest',
        runReferenceId: 'backtest-run-001',
        settledNetMinor: '5',
        sourceKind: 'resource_export',
        sourceManifestHash: 'b'.repeat(64),
      }),
    ]),
    acceptedPaperRuns,
    acceptedRuntimeCycles: runtimeCycleResponse([
      runtimeCycle({
        acceptanceState: 'accepted_local_evidence',
        cycleNumber: 1,
        jobId: 'private-paper:scheduler-001:cycle:1',
        runtimeId: 'runtime-001',
        schedulerCheckpointId: 'scheduler-001',
        sourceManifestHash: 'd'.repeat(64),
        strategyLedger: acceptedPaperRuns.page.items[0]!,
      }),
    ]),
    blockedBacktests: strategyResponse([
      strategyEntry({
        acceptanceState: 'blocked',
        blockedCandidateCount: 1,
        blockerCodes: Object.freeze(['QUOTE_FRESHNESS_EXCEEDED']),
        blockerCount: 1,
        candidateId: 'candidate-backtest-blocked-001',
        canonicalMarketId: 'market-004',
        exportedAt: MOCK_GENERATED_AT,
        ledgerEntryId: 'deterministic_standard_binary_backtest:eeee',
        reportId: 'report-backtest-blocked-001',
        runFingerprintSha256: 'e'.repeat(64),
        runKind: 'deterministic_standard_binary_backtest',
        runReferenceId: 'backtest-run-002',
        sourceKind: 'resource_export',
        sourceManifestHash: 'f'.repeat(64),
      }),
    ]),
    blockedPaperRuns,
    blockedRuntimeCycles: runtimeCycleResponse([
      runtimeCycle({
        acceptanceState: 'blocked',
        blockedReasonCode: 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED',
        cycleNumber: 2,
        deadLetterReasonCode: 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED',
        jobId: 'private-paper:scheduler-001:cycle:2',
        lastErrorCode: 'BWS_PRIVATE_PAPER_RUNTIME_BLOCKED',
        runtimeId: 'runtime-001',
        schedulerCheckpointId: 'scheduler-001',
        sourceManifestHash: '8'.repeat(64),
      }),
    ]),
    pinnedExportScope: Object.freeze({
      providerId: 'polymarket',
      upstreamLockRecordId: 'lock-001',
    }),
    pinnedStrategyExports: pinnedExport(
      Object.freeze({
        providerId: 'polymarket',
        upstreamLockRecordId: 'lock-001',
      }),
    ),
  });
}
