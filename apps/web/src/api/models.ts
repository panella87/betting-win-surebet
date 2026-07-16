import type {
  BwsPrivatePaperRuntimeCycleItem,
  BwsPinnedStrategyExportItem,
  BwsStrategyLedgerItem,
} from '../../../../packages/bootstrap/src/api/bws-read-only-query-service.js';
import type {
  SurebetStrategyCandidateReport,
  SurebetStrategyLedgerEntry,
} from '../../../../packages/bootstrap/src/strategy/strategy-ledger.js';
import type {
  BwsOperatorCockpitMetricCard,
  BwsOperatorCockpitPageModel,
  BwsOperatorCockpitPinnedExportScope,
  BwsOperatorCockpitRoutePath,
  BwsOperatorCockpitSnapshot,
  BwsOperatorCockpitTableColumn,
  BwsOperatorCockpitTableRow,
} from './contracts.js';

function fail(message: string): never {
  throw new Error(message);
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'not_available';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => renderValue(entry)).join(', ');
  }
  return JSON.stringify(value);
}

function createCard(
  label: string,
  value: unknown,
  tone: BwsOperatorCockpitMetricCard['tone'] = 'default',
): BwsOperatorCockpitMetricCard {
  return Object.freeze({
    label,
    tone,
    value: renderValue(value),
  });
}

function createRow(
  rowId: string,
  title: string,
  values: Readonly<Record<string, string>>,
  detailFields: BwsOperatorCockpitTableRow['detailFields'],
  detailSections: BwsOperatorCockpitTableRow['detailSections'] = Object.freeze([]),
): BwsOperatorCockpitTableRow {
  return Object.freeze({
    detailFields: Object.freeze(detailFields),
    detailSections: Object.freeze(detailSections),
    rowId,
    title,
    values,
  });
}

function field(label: string, value: unknown) {
  return Object.freeze({
    label,
    value: renderValue(value),
  });
}

function strategyColumns(
  leadingLabel: string,
): readonly BwsOperatorCockpitTableColumn[] {
  return Object.freeze([
    Object.freeze({ key: 'entryId', label: leadingLabel }),
    Object.freeze({ key: 'runKind', label: 'Run Kind' }),
    Object.freeze({ key: 'acceptanceState', label: 'Acceptance' }),
    Object.freeze({ key: 'sourceKind', label: 'Source Kind' }),
    Object.freeze({ key: 'candidateCount', label: 'Candidates' }),
    Object.freeze({ key: 'blockedCandidateCount', label: 'Blocked' }),
    Object.freeze({ key: 'blockerCount', label: 'Blockers' }),
    Object.freeze({ key: 'exportedAt', label: 'Exported At' }),
  ]);
}

function flattenStrategyItems(snapshot: BwsOperatorCockpitSnapshot): readonly BwsStrategyLedgerItem[] {
  return Object.freeze([
    ...snapshot.acceptedBacktests.page.items,
    ...snapshot.blockedBacktests.page.items,
    ...snapshot.acceptedPaperRuns.page.items,
    ...snapshot.blockedPaperRuns.page.items,
  ]);
}

function assertSurfaceItemsMatchScope(
  items: readonly BwsStrategyLedgerItem[],
  expectedAcceptanceState: BwsStrategyLedgerItem['entry']['acceptanceState'],
  expectedRunKind: BwsStrategyLedgerItem['entry']['runKind'],
  label: string,
): void {
  for (const item of items) {
    if (item.entry.acceptanceState !== expectedAcceptanceState) {
      fail(
        `${label} item ${item.ledgerEntryId} carried acceptanceState ${item.entry.acceptanceState} instead of ${expectedAcceptanceState}.`,
      );
    }
    if (item.entry.runKind !== expectedRunKind) {
      fail(
        `${label} item ${item.ledgerEntryId} carried runKind ${item.entry.runKind} instead of ${expectedRunKind}.`,
      );
    }
  }
}

function assertSnapshotScopeAlignment(snapshot: BwsOperatorCockpitSnapshot): void {
  assertSurfaceItemsMatchScope(
    snapshot.acceptedBacktests.page.items,
    'accepted_local_evidence',
    'deterministic_standard_binary_backtest',
    'acceptedBacktests',
  );
  assertSurfaceItemsMatchScope(
    snapshot.blockedBacktests.page.items,
    'blocked',
    'deterministic_standard_binary_backtest',
    'blockedBacktests',
  );
  assertSurfaceItemsMatchScope(
    snapshot.acceptedPaperRuns.page.items,
    'accepted_local_evidence',
    'private_paper_runtime_cycle',
    'acceptedPaperRuns',
  );
  assertSurfaceItemsMatchScope(
    snapshot.blockedPaperRuns.page.items,
    'blocked',
    'private_paper_runtime_cycle',
    'blockedPaperRuns',
  );
  for (const item of snapshot.acceptedRuntimeCycles.page.items) {
    if (item.acceptanceState !== 'accepted_local_evidence') {
      fail(`acceptedRuntimeCycles item ${item.job.jobId} acceptanceState ${item.acceptanceState} instead of accepted_local_evidence.`);
    }
  }
  for (const item of snapshot.blockedRuntimeCycles.page.items) {
    if (item.acceptanceState !== 'blocked') {
      fail(`blockedRuntimeCycles item ${item.job.jobId} acceptanceState ${item.acceptanceState} instead of blocked.`);
    }
  }
}

function summarizePinnedExportScope(scope: BwsOperatorCockpitPinnedExportScope | undefined): string {
  if (scope === undefined) {
    return 'No explicit evidence filter has been applied.';
  }
  const entries = Object.entries(scope)
    .map(([key, value]) => `${key}=${renderValue(value)}`)
    .sort((left, right) => left.localeCompare(right));
  return entries.length === 0
    ? 'No explicit evidence filter has been applied.'
    : entries.join(' · ');
}

function toScopeSummaryRows(snapshot: BwsOperatorCockpitSnapshot): readonly BwsOperatorCockpitTableRow[] {
  const surfaces = [
    {
      itemCount: snapshot.acceptedBacktests.page.returnedCount,
      nextCursor: snapshot.acceptedBacktests.page.nextCursor,
      scope: 'accepted_backtests',
      strategy: snapshot.acceptedBacktests,
    },
    {
      itemCount: snapshot.blockedBacktests.page.returnedCount,
      nextCursor: snapshot.blockedBacktests.page.nextCursor,
      scope: 'blocked_backtests',
      strategy: snapshot.blockedBacktests,
    },
    {
      itemCount: snapshot.acceptedRuntimeCycles.page.returnedCount,
      nextCursor: snapshot.acceptedRuntimeCycles.page.nextCursor,
      scope: 'accepted_paper_runs',
      strategy: snapshot.acceptedRuntimeCycles,
    },
    {
      itemCount: snapshot.blockedRuntimeCycles.page.returnedCount,
      nextCursor: snapshot.blockedRuntimeCycles.page.nextCursor,
      scope: 'blocked_paper_runs',
      strategy: snapshot.blockedRuntimeCycles,
    },
  ];
  return Object.freeze(
    surfaces.map((surface) => createRow(
      surface.scope,
      surface.scope,
      Object.freeze({
        generatedAt: surface.strategy.generatedAt,
        itemCount: renderValue(surface.itemCount),
        nextCursor: surface.nextCursor === undefined ? 'none' : 'present',
        resource: surface.strategy.resource,
        scope: surface.scope,
      }),
      Object.freeze([
        field('Scope', surface.scope),
        field('Generated At', surface.strategy.generatedAt),
        field('Returned Count', surface.itemCount),
        field('Next Cursor', surface.nextCursor === undefined ? 'none' : surface.nextCursor),
        field('Automatic Fallback', surface.strategy.boundary.automaticFallback),
      ]),
    )),
  );
}

function createStrategyLedgerRow(item: BwsStrategyLedgerItem): BwsOperatorCockpitTableRow {
  const entry = item.entry;
  return createRow(
    item.ledgerEntryId,
    item.ledgerEntryId,
    Object.freeze({
      acceptanceState: entry.acceptanceState,
      blockedCandidateCount: renderValue(entry.blockedCandidateCount),
      blockerCount: renderValue(entry.blockerCount),
      candidateCount: renderValue(entry.candidateCount),
      entryId: item.ledgerEntryId,
      exportedAt: entry.report.exportedAt,
      runKind: entry.runKind,
      sourceKind: entry.sourceKind,
    }),
    Object.freeze([
      field('Ledger Entry Id', item.ledgerEntryId),
      field('Report Id', entry.reportId),
      field('Run Reference Id', entry.runReferenceId),
      field('Run Fingerprint', entry.runFingerprintSha256),
      field('Source Manifest Hash', entry.sourceManifestHash),
      field('Acceptance State', entry.acceptanceState),
      field('Settlement State', entry.settlementState),
      field('Pinned Strategy Export Record Id', item.provenance.pinnedStrategyExport?.intakeRecordId ?? 'none'),
      field('Import Run Id', item.provenance.importRun?.importRunId ?? 'not_available'),
      field('Upstream Lock Record Id', item.provenance.upstreamLockRecordId),
      field('Upstream Commit', item.provenance.upstreamLock.commitSha),
      field('Upstream Tree', item.provenance.upstreamLock.gitTreeSha),
    ]),
    Object.freeze([
      Object.freeze({
        records: Object.freeze(entry.report.candidates.map((candidate) => Object.freeze({
          blockerCodes: candidate.blockerCodes.join(', '),
          blockerCount: renderValue(candidate.blockerCount),
          candidateId: candidate.candidateId,
          canonicalMarketId: candidate.canonicalMarketId,
          completionGroupState: renderValue(candidate.completionGroupState),
          finalOutcome: renderValue(candidate.finalOutcome),
          resultState: candidate.resultState,
          settledNetMinor: renderValue(candidate.settledNetMinor),
        }))),
        title: 'Candidate Report Rows',
      }),
    ]),
  );
}

function toStrategyLedgerRows(
  items: readonly BwsStrategyLedgerItem[],
): readonly BwsOperatorCockpitTableRow[] {
  return Object.freeze(items.map((item) => createStrategyLedgerRow(item)));
}

function runtimeCycleColumns(): readonly BwsOperatorCockpitTableColumn[] {
  return Object.freeze([
    Object.freeze({ key: 'cycleId', label: 'Cycle Id' }),
    Object.freeze({ key: 'runtimeId', label: 'Runtime Id' }),
    Object.freeze({ key: 'acceptanceState', label: 'Acceptance' }),
    Object.freeze({ key: 'jobStatus', label: 'Job Status' }),
    Object.freeze({ key: 'attemptCount', label: 'Attempts' }),
    Object.freeze({ key: 'checkpointCount', label: 'Checkpoints' }),
    Object.freeze({ key: 'lastCheckpointAt', label: 'Last Checkpoint' }),
    Object.freeze({ key: 'blockedReasonCode', label: 'Blocked Reason' }),
  ]);
}

function toRuntimeCycleRows(
  items: readonly BwsPrivatePaperRuntimeCycleItem[],
): readonly BwsOperatorCockpitTableRow[] {
  return Object.freeze(
    items.map((item) => createRow(
      item.job.jobId,
      item.cycleId,
      Object.freeze({
        acceptanceState: item.acceptanceState,
        attemptCount: renderValue(item.job.attemptCount),
        blockedReasonCode: item.blockedReasonCode ?? 'none',
        checkpointCount: renderValue(item.job.checkpointCount),
        cycleId: item.cycleId,
        jobStatus: item.job.status,
        lastCheckpointAt: item.job.lastCheckpointAt ?? 'not_available',
        runtimeId: item.runtimeId,
      }),
      Object.freeze([
        field('Cycle Id', item.cycleId),
        field('Cycle Number', item.cycleNumber),
        field('Runtime Id', item.runtimeId),
        field('Job Id', item.job.jobId),
        field('Queue Name', item.job.queueName),
        field('Job Status', item.job.status),
        field('Attempt Count', item.job.attemptCount),
        field('Checkpoint Count', item.job.checkpointCount),
        field('Last Checkpoint Id', item.job.lastCheckpointId ?? 'not_available'),
        field('Last Checkpoint At', item.job.lastCheckpointAt ?? 'not_available'),
        field('Blocked Reason', item.blockedReasonCode ?? 'none'),
        field('Dead Letter Code', item.deadLetter?.deadLetterReasonCode ?? 'none'),
        field('Source Kind', item.sourceKind),
        field('Source Manifest Hash', item.sourceManifestHash),
        field('Scheduler Checkpoint Id', item.provenance.schedulerCheckpoint.schedulerCheckpointId),
        field('Upstream API Checkpoint Id', item.provenance.upstreamApiCheckpoint.checkpointId),
        field('Completed API Cycles', item.provenance.upstreamApiCheckpoint.completedCycleCount),
        field('Cycle Import Run Id', item.provenance.cycleImportRun?.importRunId ?? 'not_available'),
      ]),
      Object.freeze([
        Object.freeze({
          records: Object.freeze(
            item.recentCheckpoints.map((checkpoint) => Object.freeze({
              checkpointId: checkpoint.checkpointId,
              checkpointSha256: checkpoint.checkpointSha256,
              recordedAt: checkpoint.recordedAt,
              checkpointStage: renderValue(checkpoint.checkpoint['checkpointStage']),
            })),
          ),
          title: 'Recent Worker Checkpoints',
        }),
        ...(item.strategyLedger === undefined
          ? []
          : [
              Object.freeze({
                records: Object.freeze(
                  item.strategyLedger.entry.report.candidates.map((candidate) => Object.freeze({
                    blockerCodes: candidate.blockerCodes.join(', '),
                    blockerCount: renderValue(candidate.blockerCount),
                    candidateId: candidate.candidateId,
                    canonicalMarketId: candidate.canonicalMarketId,
                    resultState: candidate.resultState,
                  })),
                ),
                title: 'Strategy Ledger Candidates',
              }),
            ]),
      ]),
    )),
  );
}

interface CandidateRowContext {
  readonly entry: SurebetStrategyLedgerEntry;
  readonly item: BwsStrategyLedgerItem;
  readonly reportScope: 'accepted_backtest' | 'accepted_paper' | 'blocked_backtest' | 'blocked_paper';
}

interface FlattenedCandidateRow {
  readonly candidate: SurebetStrategyCandidateReport;
  readonly context: CandidateRowContext;
}

function flattenCandidateRows(snapshot: BwsOperatorCockpitSnapshot): readonly FlattenedCandidateRow[] {
  const groups = [
    {
      items: snapshot.acceptedBacktests.page.items,
      reportScope: 'accepted_backtest' as const,
    },
    {
      items: snapshot.blockedBacktests.page.items,
      reportScope: 'blocked_backtest' as const,
    },
    {
      items: snapshot.acceptedPaperRuns.page.items,
      reportScope: 'accepted_paper' as const,
    },
    {
      items: snapshot.blockedPaperRuns.page.items,
      reportScope: 'blocked_paper' as const,
    },
  ];
  const flattened: FlattenedCandidateRow[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      for (const candidate of item.entry.report.candidates) {
        if (candidate.resultState === 'blocked' && candidate.blockerCodes.length === 0) {
          fail('Blocked candidate summaries must carry explicit blocker codes before they can render in the cockpit.');
        }
        flattened.push(
          Object.freeze({
            candidate,
            context: Object.freeze({
              entry: item.entry,
              item,
              reportScope: group.reportScope,
            }),
          }),
        );
      }
    }
  }
  return Object.freeze(flattened);
}

function toCandidateOpportunityRows(
  snapshot: BwsOperatorCockpitSnapshot,
): readonly BwsOperatorCockpitTableRow[] {
  return Object.freeze(
    flattenCandidateRows(snapshot).map(({ candidate, context }) => createRow(
      `${context.item.ledgerEntryId}:${candidate.candidateId}`,
      candidate.candidateId,
      Object.freeze({
        acceptanceState: candidate.resultState,
        blockerCount: renderValue(candidate.blockerCount),
        candidateId: candidate.candidateId,
        canonicalMarketId: candidate.canonicalMarketId,
        finalOutcome: renderValue(candidate.finalOutcome),
        runKind: context.entry.runKind,
        scope: context.reportScope,
      }),
      Object.freeze([
        field('Candidate Id', candidate.candidateId),
        field('Canonical Market Id', candidate.canonicalMarketId),
        field('Result State', candidate.resultState),
        field('Blocker Codes', candidate.blockerCodes.join(', ')),
        field('Completion Group State', candidate.completionGroupState ?? 'not_available'),
        field('Settled Net Minor', candidate.settledNetMinor ?? 'not_available'),
        field('Final Outcome', candidate.finalOutcome ?? 'not_available'),
        field('Report Scope', context.reportScope),
        field('Ledger Entry Id', context.item.ledgerEntryId),
        field('Upstream Commit', context.item.provenance.upstreamLock.commitSha),
      ]),
    )),
  );
}

function toExposureRows(
  snapshot: BwsOperatorCockpitSnapshot,
): readonly BwsOperatorCockpitTableRow[] {
  return Object.freeze(
    flattenCandidateRows(snapshot)
      .filter(({ candidate }) => candidate.resultState === 'accepted_local_evidence')
      .map(({ candidate, context }) => createRow(
        `${context.item.ledgerEntryId}:${candidate.candidateId}:exposure`,
        candidate.candidateId,
        Object.freeze({
          candidateId: candidate.candidateId,
          canonicalMarketId: candidate.canonicalMarketId,
          completionGroupState: renderValue(candidate.completionGroupState),
          finalOutcome: renderValue(candidate.finalOutcome),
          runKind: context.entry.runKind,
          settledNetMinor: renderValue(candidate.settledNetMinor),
        }),
        Object.freeze([
          field('Candidate Id', candidate.candidateId),
          field('Completion Group State', candidate.completionGroupState),
          field('Settled Net Minor', candidate.settledNetMinor),
          field('Final Outcome', candidate.finalOutcome),
          field('Run Kind', context.entry.runKind),
          field('Report Id', context.entry.reportId),
          field('Run Fingerprint', context.entry.runFingerprintSha256),
        ]),
      )),
  );
}

function toBlockedCandidateRows(
  snapshot: BwsOperatorCockpitSnapshot,
): readonly BwsOperatorCockpitTableRow[] {
  return Object.freeze(
    flattenCandidateRows(snapshot)
      .filter(({ candidate }) => candidate.resultState === 'blocked')
      .map(({ candidate, context }) => createRow(
        `${context.item.ledgerEntryId}:${candidate.candidateId}:blocked`,
        candidate.candidateId,
        Object.freeze({
          blockerCodes: candidate.blockerCodes.join(', '),
          blockerCount: renderValue(candidate.blockerCount),
          candidateId: candidate.candidateId,
          canonicalMarketId: candidate.canonicalMarketId,
          runKind: context.entry.runKind,
          stopReason: renderValue(context.entry.report.stopReason),
        }),
        Object.freeze([
          field('Candidate Id', candidate.candidateId),
          field('Canonical Market Id', candidate.canonicalMarketId),
          field('Blocker Codes', candidate.blockerCodes.join(', ')),
          field('Stop Reason', context.entry.report.stopReason ?? 'not_available'),
          field('Report Scope', context.reportScope),
          field('Ledger Entry Id', context.item.ledgerEntryId),
          field('Upstream Lock Record Id', context.item.provenance.upstreamLockRecordId),
        ]),
      )),
  );
}

function createPinnedExportRow(item: BwsPinnedStrategyExportItem): BwsOperatorCockpitTableRow {
  return createRow(
    item.intakeRecordId,
    item.record.exportId,
    Object.freeze({
      endpointId: item.record.endpointId,
      exportId: item.record.exportId,
      importedAt: item.record.importedAt,
      intakeRecordId: item.intakeRecordId,
      providerId: item.record.providerId,
      upstreamLockRecordId: item.provenance.upstreamLockRecordId,
    }),
    Object.freeze([
      field('Intake Record Id', item.intakeRecordId),
      field('Export Id', item.record.exportId),
      field('Provider Id', item.record.providerId),
      field('Endpoint Id', item.record.endpointId),
      field('Import Run Id', item.provenance.importRun.importRunId),
      field('Source Locator', item.record.sourceLocator),
      field('Payload SHA-256', item.record.payloadSha256),
      field('Source SHA-256', item.record.sourceSha256),
      field('Upstream Commit', item.provenance.upstreamLock.commitSha),
      field('Upstream Tree', item.provenance.upstreamLock.gitTreeSha),
    ]),
    Object.freeze([
      Object.freeze({
        records: Object.freeze([
          Object.freeze({
            contractAlias: item.record.contractAlias,
            contractSchema: item.record.contractSchema,
            exportKind: item.record.exportKind,
            exportProfile: item.record.exportProfile,
            providerGenerationIds: item.record.providerGenerationIds.join(', '),
            sourceLineageRecordIds: item.record.sourceLineageRecordIds.join(', '),
          }),
        ]),
        title: 'Pinned Export Contract',
      }),
    ]),
  );
}

function toPinnedExportRows(
  items: readonly BwsPinnedStrategyExportItem[] | undefined,
): readonly BwsOperatorCockpitTableRow[] {
  if (items === undefined) {
    return Object.freeze([]);
  }
  return Object.freeze(items.map((item) => createPinnedExportRow(item)));
}

export function buildBwsOperatorCockpitPageModel(
  routePath: BwsOperatorCockpitRoutePath,
  snapshot: BwsOperatorCockpitSnapshot,
): BwsOperatorCockpitPageModel {
  assertSnapshotScopeAlignment(snapshot);
  switch (routePath) {
    case '/':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Accepted Backtests', snapshot.acceptedBacktests.page.returnedCount, 'accent'),
          createCard('Blocked Backtests', snapshot.blockedBacktests.page.returnedCount, 'warning'),
          createCard('Accepted Paper Cycles', snapshot.acceptedRuntimeCycles.page.returnedCount, 'accent'),
          createCard('Blocked Paper Cycles', snapshot.blockedRuntimeCycles.page.returnedCount, 'warning'),
        ]),
        columns: Object.freeze([
          Object.freeze({ key: 'scope', label: 'Surface' }),
          Object.freeze({ key: 'resource', label: 'Resource' }),
          Object.freeze({ key: 'itemCount', label: 'Rows' }),
          Object.freeze({ key: 'generatedAt', label: 'Generated At' }),
          Object.freeze({ key: 'nextCursor', label: 'Next Cursor' }),
        ]),
        emptyLabel: 'No bounded strategy scope rows are available.',
        note: 'Overview summaries stay bounded to fixed acceptance-state runtime and strategy scopes.',
        rows: toScopeSummaryRows(snapshot),
      });
    case '/opportunities':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Candidate Rows', flattenCandidateRows(snapshot).length, 'accent'),
          createCard('Accepted Candidate Rows', toExposureRows(snapshot).length),
          createCard('Blocked Candidate Rows', toBlockedCandidateRows(snapshot).length, 'warning'),
          createCard('Unique Reports', flattenStrategyItems(snapshot).length),
        ]),
        columns: Object.freeze([
          Object.freeze({ key: 'candidateId', label: 'Candidate Id' }),
          Object.freeze({ key: 'canonicalMarketId', label: 'Canonical Market Id' }),
          Object.freeze({ key: 'runKind', label: 'Run Kind' }),
          Object.freeze({ key: 'acceptanceState', label: 'State' }),
          Object.freeze({ key: 'blockerCount', label: 'Blockers' }),
          Object.freeze({ key: 'finalOutcome', label: 'Final Outcome' }),
          Object.freeze({ key: 'scope', label: 'Scope' }),
        ]),
        emptyLabel: 'No candidate rows are available from the bounded strategy scopes.',
        note: 'Opportunity rows are derived from immutable candidate summaries already persisted in surebet.strategy_ledger_entries.',
        rows: toCandidateOpportunityRows(snapshot),
      });
    case '/evidence':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Pinned Export Rows', snapshot.pinnedStrategyExports?.page.returnedCount ?? 0, 'accent'),
          createCard('Evidence Scope', snapshot.pinnedExportScope === undefined ? 'required' : 'applied'),
          createCard('Accepted Ledger Rows', snapshot.acceptedBacktests.page.returnedCount + snapshot.acceptedPaperRuns.page.returnedCount),
          createCard('Blocked Ledger Rows', snapshot.blockedBacktests.page.returnedCount + snapshot.blockedPaperRuns.page.returnedCount, 'warning'),
        ]),
        columns: Object.freeze([
          Object.freeze({ key: 'exportId', label: 'Export Id' }),
          Object.freeze({ key: 'providerId', label: 'Provider Id' }),
          Object.freeze({ key: 'endpointId', label: 'Endpoint Id' }),
          Object.freeze({ key: 'intakeRecordId', label: 'Intake Record Id' }),
          Object.freeze({ key: 'importedAt', label: 'Imported At' }),
          Object.freeze({ key: 'upstreamLockRecordId', label: 'Upstream Lock Record Id' }),
        ]),
        emptyLabel: 'Provide an explicit evidence filter to load pinned strategy export rows.',
        note: summarizePinnedExportScope(snapshot.pinnedExportScope),
        rows: toPinnedExportRows(snapshot.pinnedStrategyExports?.page.items),
      });
    case '/backtests':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Accepted Backtests', snapshot.acceptedBacktests.page.returnedCount, 'accent'),
          createCard('Blocked Backtests', snapshot.blockedBacktests.page.returnedCount, 'warning'),
          createCard(
            'Accepted Candidates',
            snapshot.acceptedBacktests.page.items.reduce((count, item) => count + item.entry.candidateCount, 0),
          ),
          createCard(
            'Blocked Candidates',
            snapshot.blockedBacktests.page.items.reduce((count, item) => count + item.entry.blockedCandidateCount, 0),
            'warning',
          ),
        ]),
        columns: strategyColumns('Ledger Entry Id'),
        emptyLabel: 'No backtest ledger rows are available in the bounded strategy scopes.',
        note: 'Backtest rows stay separated by acceptance state to preserve explicit blocker visibility.',
        rows: toStrategyLedgerRows([
          ...snapshot.acceptedBacktests.page.items,
          ...snapshot.blockedBacktests.page.items,
        ]),
      });
    case '/paper-runs':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Accepted Paper Cycles', snapshot.acceptedRuntimeCycles.page.returnedCount, 'accent'),
          createCard('Blocked Paper Cycles', snapshot.blockedRuntimeCycles.page.returnedCount, 'warning'),
          createCard(
            'Kill Triggered Cycles',
            [
              ...snapshot.acceptedRuntimeCycles.page.items,
              ...snapshot.blockedRuntimeCycles.page.items,
            ].filter((item) => item.strategyLedger?.entry.report.stopReason === 'kill_triggered').length,
          ),
          createCard(
            'Cycle Rows',
            snapshot.acceptedRuntimeCycles.page.returnedCount + snapshot.blockedRuntimeCycles.page.returnedCount,
          ),
        ]),
        columns: runtimeCycleColumns(),
        emptyLabel: 'No private paper cycle rows are available in the bounded strategy scopes.',
        note: 'Private paper cycles remain bounded and surface persisted worker restart, checkpoint, and blocker state without adding any execution path.',
        rows: toRuntimeCycleRows([
          ...snapshot.acceptedRuntimeCycles.page.items,
          ...snapshot.blockedRuntimeCycles.page.items,
        ]),
      });
    case '/exposure':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Accepted Exposure Rows', toExposureRows(snapshot).length, 'accent'),
          createCard('Accepted Backtest Reports', snapshot.acceptedBacktests.page.returnedCount),
          createCard('Accepted Paper Reports', snapshot.acceptedPaperRuns.page.returnedCount),
          createCard(
            'Unique Markets',
            new Set(
              toExposureRows(snapshot).map((row) => row.values['canonicalMarketId']),
            ).size,
          ),
        ]),
        columns: Object.freeze([
          Object.freeze({ key: 'candidateId', label: 'Candidate Id' }),
          Object.freeze({ key: 'canonicalMarketId', label: 'Canonical Market Id' }),
          Object.freeze({ key: 'runKind', label: 'Run Kind' }),
          Object.freeze({ key: 'completionGroupState', label: 'Completion Group State' }),
          Object.freeze({ key: 'settledNetMinor', label: 'Settled Net Minor' }),
          Object.freeze({ key: 'finalOutcome', label: 'Final Outcome' }),
        ]),
        emptyLabel: 'No accepted candidate exposure rows are available in the bounded strategy scopes.',
        note: 'Exposure rows show accepted candidate settlement output without any execution or public-distribution claim.',
        rows: toExposureRows(snapshot),
      });
    case '/blockers':
      return Object.freeze({
        cards: Object.freeze([
          createCard('Blocked Candidate Rows', toBlockedCandidateRows(snapshot).length, 'warning'),
          createCard('Blocked Backtests', snapshot.blockedBacktests.page.returnedCount, 'warning'),
          createCard('Blocked Paper Cycles', snapshot.blockedRuntimeCycles.page.returnedCount, 'warning'),
          createCard(
            'Distinct Blocker Codes',
            new Set(
              toBlockedCandidateRows(snapshot)
                .flatMap((row) => (row.values['blockerCodes'] ?? '').split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0)),
            ).size,
          ),
        ]),
        columns: Object.freeze([
          Object.freeze({ key: 'candidateId', label: 'Candidate Id' }),
          Object.freeze({ key: 'canonicalMarketId', label: 'Canonical Market Id' }),
          Object.freeze({ key: 'runKind', label: 'Run Kind' }),
          Object.freeze({ key: 'blockerCodes', label: 'Blocker Codes' }),
          Object.freeze({ key: 'blockerCount', label: 'Blocker Count' }),
          Object.freeze({ key: 'stopReason', label: 'Stop Reason' }),
        ]),
        emptyLabel: 'No blocked candidate rows are available in the bounded strategy scopes.',
        note: 'Blocked candidate summaries fail closed if blocker codes are missing or ambiguous.',
        rows: toBlockedCandidateRows(snapshot),
      });
    default:
      fail(`Unsupported BWS cockpit route ${routePath}`);
  }
}
