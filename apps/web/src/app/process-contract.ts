import type { BwsProcessDefinition } from '../../../../packages/bootstrap/src/operations/service-runtime.js';
import type { BwsOperatorCockpitBrowserConfig } from './data-mode.js';
import { BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV, BWS_OPERATOR_COCKPIT_DATA_MODE_ENV } from './data-mode.js';

const BWS_OPERATOR_COCKPIT_BROWSER_BOUNDARY = '@betting-win-surebet/web:BWS_OPERATOR_COCKPIT_R1';

export function describeBwsOperatorCockpitProcessDefinition(
  config: BwsOperatorCockpitBrowserConfig,
): BwsProcessDefinition {
  return Object.freeze({
    automaticFallback: 'forbidden',
    boundary: BWS_OPERATOR_COCKPIT_BROWSER_BOUNDARY,
    execution: 'disabled',
    exposure: 'browser_only',
    networkBindings: Object.freeze([]),
    notes: Object.freeze([
      config.dataMode === 'api'
        ? `Reads the loopback-safe BWS API through ${config.apiBaseUrl}.`
        : 'Uses typed mock data only for bounded operator-cockpit preview.',
      'Cockpit never enables provider connections, execution, or silent fallback.',
    ]),
    processName: 'bws-operator-cockpit',
    providerConnections: 'disabled',
    requiredEnvironmentKeys: Object.freeze(
      config.dataMode === 'api'
        ? [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV, BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]
        : [BWS_OPERATOR_COCKPIT_DATA_MODE_ENV],
    ),
    role: 'cockpit',
  });
}
