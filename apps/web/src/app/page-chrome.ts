import type { BwsOperatorCockpitBrowserRoute } from '../api/contracts.js';

export type BwsOperatorCockpitPageChrome = Readonly<{
  detailPrompt: string;
  focusAreas: readonly string[];
  scopeSummary: string;
  scopeTitle: string;
  searchPlaceholder: string;
}>;

const PAGE_CHROME: Readonly<Record<string, BwsOperatorCockpitPageChrome>> = Object.freeze({
  '/': Object.freeze({
    detailPrompt: 'Choose a surface summary row to inspect the bounded query posture and latest immutable references.',
    focusAreas: Object.freeze(['bounded strategy scopes', 'closed-execution policy', 'immutable provenance']),
    scopeSummary: 'Accepted and blocked strategy scopes stay separated so the cockpit never infers a global state from an unbounded query.',
    scopeTitle: 'Bounded overview',
    searchPlaceholder: 'Search surface, run kind, or source scope',
  }),
  '/opportunities': Object.freeze({
    detailPrompt: 'Choose a candidate row to inspect report lineage, blocker codes, and upstream evidence references.',
    focusAreas: Object.freeze(['candidate lineage', 'accepted vs blocked state', 'deterministic report evidence']),
    scopeSummary: 'Opportunity rows are flattened from immutable strategy reports and never imply execution, routing, or public claims.',
    scopeTitle: 'Candidate inspection',
    searchPlaceholder: 'Search candidate id, market id, blocker code, or run scope',
  }),
  '/evidence': Object.freeze({
    detailPrompt: 'Choose a pinned export row to inspect import provenance and the committed-HEAD upstream reference.',
    focusAreas: Object.freeze(['pinned exports only', 'explicit evidence filter', 'no fallback to local mocks']),
    scopeSummary: 'Pinned export evidence loads only after an explicit scope filter is supplied, preserving the API bound enforced by BWS-400.',
    scopeTitle: 'Pinned evidence intake',
    searchPlaceholder: 'Search export id, provider id, import run, or upstream lock',
  }),
  '/backtests': Object.freeze({
    detailPrompt: 'Choose a backtest run row to inspect accepted and blocked candidate evidence.',
    focusAreas: Object.freeze(['deterministic run fingerprints', 'strategy report immutability', 'blocked candidate visibility']),
    scopeSummary: 'Backtest rows remain bounded to deterministic strategy ledger entries and expose report provenance directly.',
    scopeTitle: 'Backtest ledger',
    searchPlaceholder: 'Search report id, run reference, source manifest, or upstream lock',
  }),
  '/paper-runs': Object.freeze({
    detailPrompt: 'Choose a paper-cycle row to inspect stop reasons, acceptance state, and replay-backed settlement evidence.',
    focusAreas: Object.freeze(['bounded runtime cycles', 'kill-trigger visibility', 'reconciled settlement evidence']),
    scopeSummary: 'Private paper cycles remain read-only strategy evidence and preserve the bounded-worker surface from BWS-410.',
    scopeTitle: 'Private paper cycles',
    searchPlaceholder: 'Search cycle fingerprint, stop reason, source kind, or report id',
  }),
  '/exposure': Object.freeze({
    detailPrompt: 'Choose an accepted candidate row to inspect completion-group state and reconciled settlement output.',
    focusAreas: Object.freeze(['completion groups', 'settled net', 'terminal outcome evidence']),
    scopeSummary: 'Exposure rows show accepted completion and settlement output only; blocked or ambiguous candidate states fail closed.',
    scopeTitle: 'Accepted exposure evidence',
    searchPlaceholder: 'Search candidate id, completion state, outcome, or run kind',
  }),
  '/blockers': Object.freeze({
    detailPrompt: 'Choose a blocked candidate row to inspect explicit blocker codes and the enclosing report provenance.',
    focusAreas: Object.freeze(['explicit blocker codes', 'ambiguous state rejection', 'kill-trigger context']),
    scopeSummary: 'Blocked candidate summaries must carry explicit blocker codes; ambiguous blocked states are rejected before rendering.',
    scopeTitle: 'Blocked candidate evidence',
    searchPlaceholder: 'Search blocker code, candidate id, market id, or stop reason',
  }),
});

export function readBwsOperatorCockpitPageChrome(
  route: BwsOperatorCockpitBrowserRoute,
): BwsOperatorCockpitPageChrome {
  const pageChrome = PAGE_CHROME[route.path];
  if (pageChrome === undefined) {
    throw new Error(`Unsupported BWS cockpit page chrome route ${route.path}`);
  }
  return pageChrome;
}
