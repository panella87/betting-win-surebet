import type {
  BwsPrivatePaperRuntimeCycleItem,
  BwsPinnedStrategyExportItem,
  BwsReadOnlyQueryResponse,
  BwsStrategyLedgerItem,
} from '../../../../packages/bootstrap/src/api/bws-read-only-query-service.js';

export const BWS_OPERATOR_COCKPIT_BROWSER_PHASE = 'BWS_OPERATOR_COCKPIT_R1';
export const BWS_OPERATOR_COCKPIT_BROWSER_SCHEMA_VERSION = '1.0.0';

export const BWS_OPERATOR_COCKPIT_BROWSER_ROUTES = Object.freeze([
  {
    group: 'Monitor',
    path: '/',
    summary: 'Bounded scope summary across accepted and blocked backtest and paper evidence.',
    title: 'Overview',
  },
  {
    group: 'Monitor',
    path: '/opportunities',
    summary: 'Flattened candidate rows derived from immutable strategy ledger entries.',
    title: 'Opportunities',
  },
  {
    group: 'Evidence',
    path: '/evidence',
    summary: 'Pinned strategy export evidence loaded only from an explicit bounded filter.',
    title: 'Evidence',
  },
  {
    group: 'Runs',
    path: '/backtests',
    summary: 'Deterministic historical backtest ledger evidence and candidate outcomes.',
    title: 'Backtests',
  },
  {
    group: 'Runs',
    path: '/paper-runs',
    summary: 'Bounded private paper runtime cycles and kill-trigger visibility.',
    title: 'Paper Runs',
  },
  {
    group: 'Monitor',
    path: '/exposure',
    summary: 'Accepted candidate completion groups and reconciled settlement output.',
    title: 'Exposure',
  },
  {
    group: 'Evidence',
    path: '/blockers',
    summary: 'Blocked candidate summaries with explicit blocker codes and stop reasons.',
    title: 'Blockers',
  },
] as const);

export type BwsOperatorCockpitBrowserRoute =
  (typeof BWS_OPERATOR_COCKPIT_BROWSER_ROUTES)[number];

export type BwsOperatorCockpitRoutePath =
  BwsOperatorCockpitBrowserRoute['path'];

export type BwsOperatorCockpitCardTone = 'accent' | 'default' | 'warning';

export interface BwsOperatorCockpitMetricCard {
  readonly label: string;
  readonly tone: BwsOperatorCockpitCardTone;
  readonly value: string;
}

export interface BwsOperatorCockpitTableColumn {
  readonly key: string;
  readonly label: string;
}

export interface BwsOperatorCockpitDetailField {
  readonly label: string;
  readonly value: string;
}

export interface BwsOperatorCockpitDetailSection {
  readonly records: readonly Readonly<Record<string, string>>[];
  readonly title: string;
}

export interface BwsOperatorCockpitTableRow {
  readonly detailFields: readonly BwsOperatorCockpitDetailField[];
  readonly detailSections: readonly BwsOperatorCockpitDetailSection[];
  readonly rowId: string;
  readonly title: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface BwsOperatorCockpitPageModel {
  readonly cards: readonly BwsOperatorCockpitMetricCard[];
  readonly columns: readonly BwsOperatorCockpitTableColumn[];
  readonly emptyLabel: string;
  readonly note?: string;
  readonly rows: readonly BwsOperatorCockpitTableRow[];
}

export interface BwsOperatorCockpitPinnedExportScope {
  readonly endpointId?: string;
  readonly exportId?: string;
  readonly importRunId?: string;
  readonly providerId?: string;
  readonly sourceSha256?: string;
  readonly upstreamLockRecordId?: string;
}

export interface BwsOperatorCockpitSnapshot {
  readonly acceptedBacktests: BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>;
  readonly acceptedPaperRuns: BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>;
  readonly acceptedRuntimeCycles: BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>;
  readonly blockedBacktests: BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>;
  readonly blockedPaperRuns: BwsReadOnlyQueryResponse<'strategy_ledger_entries', BwsStrategyLedgerItem>;
  readonly blockedRuntimeCycles: BwsReadOnlyQueryResponse<'private_paper_runtime_cycles', BwsPrivatePaperRuntimeCycleItem>;
  readonly pinnedExportScope?: BwsOperatorCockpitPinnedExportScope;
  readonly pinnedStrategyExports?: BwsReadOnlyQueryResponse<'pinned_strategy_exports', BwsPinnedStrategyExportItem>;
}
