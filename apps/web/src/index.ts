export {
  BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV,
  BWS_OPERATOR_COCKPIT_DATA_MODE_ENV,
  resolveBwsOperatorCockpitBrowserConfig,
  type BwsOperatorCockpitBrowserConfig,
  type BwsOperatorCockpitBrowserDataMode,
  type BwsOperatorCockpitBrowserEnvironment,
} from './app/data-mode.js';
export {
  describeBwsOperatorCockpitProcessDefinition,
} from './app/process-contract.js';
export {
  createBwsOperatorCockpitUrlSearch,
  defaultBwsOperatorCockpitUrlState,
  mergeBwsOperatorCockpitUrlState,
  readBwsOperatorCockpitUrlState,
  type BwsOperatorCockpitUrlState,
  type BwsOperatorCockpitUrlStatePatch,
} from './app/url-state.js';
export {
  BWS_OPERATOR_COCKPIT_API_CLIENT_PHASE,
  createBwsOperatorCockpitApiClient,
  describeBwsOperatorCockpitApiClientBoundary,
  loadBwsOperatorCockpitSnapshot,
  normalizeBwsOperatorCockpitPinnedExportScope,
  readBwsOperatorCockpitEnvironmentSummary,
  readOnlyGetJson,
  type BwsOperatorCockpitApiClient,
  type BwsOperatorCockpitFetchLike,
  type LoadBwsOperatorCockpitSnapshotRequest,
} from './api/client.js';
export {
  buildBwsOperatorCockpitPageModel,
} from './api/models.js';
export {
  createMockBwsOperatorCockpitSnapshot,
} from './api/mock-data.js';
export {
  BWS_OPERATOR_COCKPIT_BROWSER_PHASE,
  BWS_OPERATOR_COCKPIT_BROWSER_ROUTES,
  BWS_OPERATOR_COCKPIT_BROWSER_SCHEMA_VERSION,
  type BwsOperatorCockpitBrowserRoute,
  type BwsOperatorCockpitCardTone,
  type BwsOperatorCockpitDetailField,
  type BwsOperatorCockpitDetailSection,
  type BwsOperatorCockpitMetricCard,
  type BwsOperatorCockpitPageModel,
  type BwsOperatorCockpitPinnedExportScope,
  type BwsOperatorCockpitRoutePath,
  type BwsOperatorCockpitSnapshot,
  type BwsOperatorCockpitTableColumn,
  type BwsOperatorCockpitTableRow,
} from './api/contracts.js';

import { BWS_OPERATOR_COCKPIT_BROWSER_ROUTES } from './api/contracts.js';

export const BWS_OPERATOR_COCKPIT_BROWSER_BOUNDARY = 'BWS_OPERATOR_COCKPIT_R1';

export function listBwsOperatorCockpitRoutes() {
  return BWS_OPERATOR_COCKPIT_BROWSER_ROUTES;
}

export function describeBwsOperatorCockpitBrowserBoundary(): string {
  return `@betting-win-surebet/web:${BWS_OPERATOR_COCKPIT_BROWSER_BOUNDARY}`;
}
