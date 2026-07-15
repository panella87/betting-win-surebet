import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
  type FormEvent,
} from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { loadBwsOperatorCockpitSnapshot, normalizeBwsOperatorCockpitPinnedExportScope } from '../api/client.js';
import {
  BWS_OPERATOR_COCKPIT_BROWSER_ROUTES,
  type BwsOperatorCockpitBrowserRoute,
  type BwsOperatorCockpitPinnedExportScope,
  type BwsOperatorCockpitSnapshot,
  type BwsOperatorCockpitTableRow,
} from '../api/contracts.js';
import { buildBwsOperatorCockpitPageModel } from '../api/models.js';
import type { BwsOperatorCockpitBrowserConfig } from './data-mode.js';
import { readBwsOperatorCockpitPageChrome } from './page-chrome.js';
import {
  createBwsOperatorCockpitUrlSearch,
  defaultBwsOperatorCockpitUrlState,
  mergeBwsOperatorCockpitUrlState,
  readBwsOperatorCockpitUrlState,
} from './url-state.js';

const DEFAULT_PAGE_SIZE = 10;

const TABLE_COLUMN_LABELS: Readonly<Record<string, string>> = Object.freeze({
  acceptanceState: 'Acceptance',
  blockedCandidateCount: 'Blocked',
  blockerCodes: 'Blocker Codes',
  blockerCount: 'Blockers',
  candidateCount: 'Candidates',
  candidateId: 'Candidate Id',
  canonicalMarketId: 'Canonical Market Id',
  completionGroupState: 'Completion Group State',
  endpointId: 'Endpoint Id',
  entryId: 'Ledger Entry Id',
  exportedAt: 'Exported At',
  exportId: 'Export Id',
  finalOutcome: 'Final Outcome',
  generatedAt: 'Generated At',
  importedAt: 'Imported At',
  intakeRecordId: 'Intake Record Id',
  itemCount: 'Rows',
  nextCursor: 'Next Cursor',
  providerId: 'Provider Id',
  resource: 'Resource',
  runKind: 'Run Kind',
  scope: 'Scope',
  settledNetMinor: 'Settled Net Minor',
  sourceKind: 'Source Kind',
  stopReason: 'Stop Reason',
  upstreamLockRecordId: 'Upstream Lock Record Id',
});

interface EvidenceScopeDraft {
  readonly endpointId: string;
  readonly exportId: string;
  readonly importRunId: string;
  readonly providerId: string;
  readonly sourceSha256: string;
  readonly upstreamLockRecordId: string;
}

function emptyEvidenceScopeDraft(): EvidenceScopeDraft {
  return Object.freeze({
    endpointId: '',
    exportId: '',
    importRunId: '',
    providerId: '',
    sourceSha256: '',
    upstreamLockRecordId: '',
  });
}

function toEvidenceScope(draft: EvidenceScopeDraft): BwsOperatorCockpitPinnedExportScope {
  return Object.freeze({
    ...(draft.endpointId.trim().length === 0 ? {} : { endpointId: draft.endpointId.trim() }),
    ...(draft.exportId.trim().length === 0 ? {} : { exportId: draft.exportId.trim() }),
    ...(draft.importRunId.trim().length === 0 ? {} : { importRunId: draft.importRunId.trim() }),
    ...(draft.providerId.trim().length === 0 ? {} : { providerId: draft.providerId.trim() }),
    ...(draft.sourceSha256.trim().length === 0 ? {} : { sourceSha256: draft.sourceSha256.trim() }),
    ...(draft.upstreamLockRecordId.trim().length === 0 ? {} : { upstreamLockRecordId: draft.upstreamLockRecordId.trim() }),
  });
}

function fromEvidenceScope(scope: BwsOperatorCockpitPinnedExportScope | undefined): EvidenceScopeDraft {
  return Object.freeze({
    endpointId: scope?.endpointId ?? '',
    exportId: scope?.exportId ?? '',
    importRunId: scope?.importRunId ?? '',
    providerId: scope?.providerId ?? '',
    sourceSha256: scope?.sourceSha256 ?? '',
    upstreamLockRecordId: scope?.upstreamLockRecordId ?? '',
  });
}

async function loadCockpitSnapshot(
  route: BwsOperatorCockpitBrowserRoute,
  configuration: BwsOperatorCockpitBrowserConfig,
  evidenceScope: BwsOperatorCockpitPinnedExportScope | undefined,
): Promise<BwsOperatorCockpitSnapshot> {
  return loadBwsOperatorCockpitSnapshot(
    configuration,
    Object.freeze({
      includePinnedStrategyExports: route.path === '/evidence',
      ...(evidenceScope === undefined ? {} : { evidenceScope }),
    }),
  );
}

function filterRows(rows: readonly BwsOperatorCockpitTableRow[], needle: string): readonly BwsOperatorCockpitTableRow[] {
  if (needle.length === 0) {
    return rows;
  }
  return rows.filter((row) => {
    if (row.title.toLowerCase().includes(needle)) {
      return true;
    }
    return Object.values(row.values).some((value) => value.toLowerCase().includes(needle));
  });
}

function paginateRows(
  rows: readonly BwsOperatorCockpitTableRow[],
  pageIndex: number,
): readonly BwsOperatorCockpitTableRow[] {
  const offset = pageIndex * DEFAULT_PAGE_SIZE;
  return rows.slice(offset, offset + DEFAULT_PAGE_SIZE);
}

export function BwsOperatorCockpitShell(props: Readonly<{
  configuration: BwsOperatorCockpitBrowserConfig;
  route: BwsOperatorCockpitBrowserRoute;
}>) {
  const pageChrome = readBwsOperatorCockpitPageChrome(props.route);
  const location = useLocation();
  const navigate = useNavigate();
  const urlState = readBwsOperatorCockpitUrlState(location.search);
  const [snapshot, setSnapshot] = useState<BwsOperatorCockpitSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEvidenceScope, setActiveEvidenceScope] = useState<BwsOperatorCockpitPinnedExportScope | undefined>(
    undefined,
  );
  const [evidenceScopeDraft, setEvidenceScopeDraft] = useState<EvidenceScopeDraft>(
    emptyEvidenceScopeDraft,
  );
  const deferredSearch = useDeferredValue(urlState.search.trim().toLowerCase());

  useEffect(() => {
    setEvidenceScopeDraft(fromEvidenceScope(activeEvidenceScope));
  }, [activeEvidenceScope]);

  const loadSnapshot = useEffectEvent(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const nextSnapshot = await loadCockpitSnapshot(
        props.route,
        props.configuration,
        activeEvidenceScope,
      );
      setSnapshot(nextSnapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSnapshot(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadSnapshot();
  }, [activeEvidenceScope, loadSnapshot, props.configuration, props.route]);

  const model = snapshot === null
    ? null
    : buildBwsOperatorCockpitPageModel(props.route.path, snapshot);
  const filteredRows = model === null ? [] : filterRows(model.rows, deferredSearch);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / DEFAULT_PAGE_SIZE));
  const boundedPageIndex = Math.min(urlState.page, pageCount - 1);
  const visibleRows = paginateRows(filteredRows, boundedPageIndex);
  const selectedRow = model === null || urlState.record === null
    ? null
    : model.rows.find((row) => row.rowId === urlState.record) ?? null;

  function setUrlState(patch: Parameters<typeof mergeBwsOperatorCockpitUrlState>[1]) {
    const nextState = mergeBwsOperatorCockpitUrlState(
      urlState.page > 0 || urlState.record !== null || urlState.search.length > 0
        ? urlState
        : defaultBwsOperatorCockpitUrlState(),
      patch,
    );
    startTransition(() => {
      navigate({
        pathname: location.pathname,
        search: createBwsOperatorCockpitUrlSearch(nextState),
      }, { replace: true });
    });
  }

  function submitEvidenceScope(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextScope = normalizeBwsOperatorCockpitPinnedExportScope(
        toEvidenceScope(evidenceScopeDraft),
      );
      setActiveEvidenceScope(nextScope);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    }
  }

  return (
    <div className="cockpit-shell">
      <aside className="cockpit-nav" aria-label="Primary">
        <div className="brand-panel">
          <p className="eyebrow">BWS</p>
          <h1>Operator Cockpit</h1>
          <p className="brand-copy">
            Private strategy evidence, explicit blockers, committed-HEAD provenance, and no execution path.
          </p>
        </div>
        <nav className="nav-groups">
          {Array.from(
            new Set(BWS_OPERATOR_COCKPIT_BROWSER_ROUTES.map((route) => route.group)),
          ).map((group) => (
            <section key={group} className="nav-group" aria-labelledby={`group-${group}`}>
              <h2 id={`group-${group}`}>{group}</h2>
              {BWS_OPERATOR_COCKPIT_BROWSER_ROUTES
                .filter((route) => route.group === group)
                .map((displayRoute) => {
                return (
                  <NavLink
                    key={displayRoute.path}
                    className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}
                    to={displayRoute.path}
                  >
                    <span className="nav-link-title">{displayRoute.title}</span>
                    <span className="nav-link-summary">{displayRoute.summary}</span>
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>
      </aside>
      <main className="cockpit-main">
        <header className="cockpit-header panel">
          <div>
            <p className="eyebrow">Read-Only Strategy Surface</p>
            <h2>{props.route.title}</h2>
            <p className="route-summary">{props.route.summary}</p>
          </div>
          <div className="badge-row" role="status" aria-live="polite">
            <span className="mode-badge">
              {props.configuration.dataMode === 'mock' ? 'MOCK DATA · DESIGN PREVIEW' : 'API DATA · BOUNDED READS'}
            </span>
            <span className="mode-badge mode-badge-warning">NO ORDERS · NO WALLET · NO PUBLIC CLAIMS</span>
            {props.configuration.dataMode === 'api' ? (
              <span className="mode-badge">{props.configuration.apiBaseUrl}</span>
            ) : null}
          </div>
        </header>
        <section className="panel page-focus-panel" aria-label={`${props.route.title} cockpit scope`}>
          <div className="page-focus-copy">
            <p className="eyebrow">Page Scope</p>
            <h3>{pageChrome.scopeTitle}</h3>
            <p className="route-summary">{pageChrome.scopeSummary}</p>
          </div>
          <ul className="focus-chip-list" aria-label={`${props.route.title} focus areas`}>
            {pageChrome.focusAreas.map((focusArea) => (
              <li key={focusArea} className="focus-chip">
                {focusArea}
              </li>
            ))}
          </ul>
        </section>
        {props.route.path === '/evidence' ? (
          <section className="panel evidence-scope-panel" aria-label="Evidence scope filter">
            <div className="overview-section-header">
              <div>
                <p className="eyebrow">Evidence Filter</p>
                <h3>Explicit pinned-export scope</h3>
              </div>
            </div>
            <form className="filter-grid evidence-grid" onSubmit={submitEvidenceScope}>
              <label>
                <span>Provider Id</span>
                <input
                  name="providerId"
                  onChange={(event) => setEvidenceScopeDraft({
                    ...evidenceScopeDraft,
                    providerId: event.currentTarget.value,
                  })}
                  placeholder="polymarket"
                  type="text"
                  value={evidenceScopeDraft.providerId}
                />
              </label>
              <label>
                <span>Export Id</span>
                <input
                  name="exportId"
                  onChange={(event) => setEvidenceScopeDraft({
                    ...evidenceScopeDraft,
                    exportId: event.currentTarget.value,
                  })}
                  placeholder="provider-history-export..."
                  type="text"
                  value={evidenceScopeDraft.exportId}
                />
              </label>
              <label>
                <span>Import Run Id</span>
                <input
                  name="importRunId"
                  onChange={(event) => setEvidenceScopeDraft({
                    ...evidenceScopeDraft,
                    importRunId: event.currentTarget.value,
                  })}
                  placeholder="import-run-001"
                  type="text"
                  value={evidenceScopeDraft.importRunId}
                />
              </label>
              <label>
                <span>Endpoint Id</span>
                <input
                  name="endpointId"
                  onChange={(event) => setEvidenceScopeDraft({
                    ...evidenceScopeDraft,
                    endpointId: event.currentTarget.value,
                  })}
                  placeholder="endpoint-pm-primary"
                  type="text"
                  value={evidenceScopeDraft.endpointId}
                />
              </label>
              <label>
                <span>Upstream Lock Record Id</span>
                <input
                  name="upstreamLockRecordId"
                  onChange={(event) => setEvidenceScopeDraft({
                    ...evidenceScopeDraft,
                    upstreamLockRecordId: event.currentTarget.value,
                  })}
                  placeholder="lock-001"
                  type="text"
                  value={evidenceScopeDraft.upstreamLockRecordId}
                />
              </label>
              <label>
                <span>Source SHA-256</span>
                <input
                  name="sourceSha256"
                  onChange={(event) => setEvidenceScopeDraft({
                    ...evidenceScopeDraft,
                    sourceSha256: event.currentTarget.value,
                  })}
                  placeholder="64-char lower-case SHA-256"
                  type="text"
                  value={evidenceScopeDraft.sourceSha256}
                />
              </label>
              <div className="filter-actions evidence-actions">
                <button type="submit">Apply filter</button>
                <button
                  onClick={() => {
                    setEvidenceScopeDraft(emptyEvidenceScopeDraft());
                    setActiveEvidenceScope(undefined);
                  }}
                  type="button"
                >
                  Clear filter
                </button>
              </div>
            </form>
          </section>
        ) : null}
        {isLoading ? (
          <section className="panel loading-panel" aria-label="Loading page data">
            <p>Loading bounded cockpit data...</p>
          </section>
        ) : null}
        {errorMessage !== null ? (
          <section className="panel error-panel" aria-label="Visible failure">
            <p className="eyebrow">Visible Failure</p>
            <h3>No silent fallback was applied</h3>
            <p>{errorMessage}</p>
          </section>
        ) : null}
        {model !== null && !isLoading ? (
          <>
            <section className="cards-grid">
              {model.cards.map((card) => (
                <article
                  key={card.label}
                  className={`metric-card metric-card-${card.tone}`}
                >
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </section>
            <section className="panel filter-panel" aria-label="Search and pagination">
              <div className="filter-grid">
                <label>
                  <span>Search</span>
                  <input
                    name="search"
                    onChange={(event) => setUrlState({
                      page: 0,
                      record: null,
                      search: event.currentTarget.value,
                    })}
                    placeholder={pageChrome.searchPlaceholder}
                    type="search"
                    value={urlState.search}
                  />
                </label>
                <div className="filter-actions filter-actions-wide">
                  <button
                    onClick={() => setUrlState({
                      page: 0,
                      record: null,
                      search: '',
                    })}
                    type="button"
                  >
                    Clear search
                  </button>
                  <span>
                    Page {boundedPageIndex + 1} / {pageCount}
                  </span>
                </div>
              </div>
              {model.note !== undefined ? <p className="filter-note">{model.note}</p> : null}
            </section>
            <section className="content-grid">
              <section className="panel table-panel" aria-label={`${props.route.title} rows`}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {model.columns.map((column) => (
                          <th key={column.key} scope="col">
                            {TABLE_COLUMN_LABELS[column.key] ?? column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.length === 0 ? (
                        <tr>
                          <td colSpan={model.columns.length}>
                            <div className="empty-state">{model.emptyLabel}</div>
                          </td>
                        </tr>
                      ) : visibleRows.map((row) => (
                        <tr
                          key={row.rowId}
                          onClick={() => setUrlState({
                            record: row.rowId,
                          })}
                        >
                          {model.columns.map((column) => (
                            <td key={column.key}>{row.values[column.key] ?? 'not_available'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-cards">
                  {visibleRows.length === 0 ? (
                    <div className="empty-state">{model.emptyLabel}</div>
                  ) : visibleRows.map((row) => (
                    <button
                      key={row.rowId}
                      className="mobile-card"
                      onClick={() => setUrlState({
                        record: row.rowId,
                      })}
                      type="button"
                    >
                      {model.columns.slice(0, 4).map((column) => (
                        <span key={column.key}>
                          <strong>{TABLE_COLUMN_LABELS[column.key] ?? column.label}</strong>
                          <em>{row.values[column.key] ?? 'not_available'}</em>
                        </span>
                      ))}
                    </button>
                  ))}
                </div>
                <footer className="pager">
                  <button
                    disabled={boundedPageIndex === 0}
                    onClick={() => setUrlState({ page: Math.max(0, boundedPageIndex - 1) })}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    disabled={boundedPageIndex >= pageCount - 1}
                    onClick={() => setUrlState({ page: Math.min(pageCount - 1, boundedPageIndex + 1) })}
                    type="button"
                  >
                    Next
                  </button>
                </footer>
              </section>
              <aside
                aria-label="Read-only detail drawer"
                className={selectedRow === null ? 'detail-drawer detail-drawer-hidden' : 'detail-drawer'}
              >
                {selectedRow === null ? (
                  <div className="panel detail-placeholder">
                    <p className="eyebrow">Read-only Drawer</p>
                    <h3>Choose a row</h3>
                    <p>{pageChrome.detailPrompt}</p>
                  </div>
                ) : (
                  <div className="panel detail-panel">
                    <div className="detail-header">
                      <div>
                        <p className="eyebrow">Detail Drawer</p>
                        <h3>{selectedRow.title}</h3>
                      </div>
                      <button
                        onClick={() => setUrlState({ record: null })}
                        type="button"
                      >
                        Close
                      </button>
                    </div>
                    <dl className="detail-list">
                      {selectedRow.detailFields.map((detailField) => (
                        <div key={detailField.label} className="detail-list-row">
                          <dt>{detailField.label}</dt>
                          <dd>{detailField.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {selectedRow.detailSections.map((section) => (
                      <section key={section.title} className="detail-section">
                        <h4>{section.title}</h4>
                        {section.records.length === 0 ? (
                          <p className="detail-empty">No additional linked rows are available.</p>
                        ) : (
                          <div className="detail-record-grid">
                            {section.records.map((record, index) => (
                              <dl key={`${section.title}:${index}`} className="detail-record-card">
                                {Object.entries(record).map(([key, value]) => (
                                  <div key={key}>
                                    <dt>{key}</dt>
                                    <dd>{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </aside>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
