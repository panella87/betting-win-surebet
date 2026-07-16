import type { BwsProcessDefinition } from '../../../../packages/bootstrap/src/operations/service-runtime.js';
import type { BwsOperatorCockpitBrowserConfig } from './data-mode.js';
import { BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV, BWS_OPERATOR_COCKPIT_DATA_MODE_ENV } from './data-mode.js';

const BWS_OPERATOR_COCKPIT_BROWSER_BOUNDARY = '@betting-win-surebet/web:BWS_OPERATOR_COCKPIT_R1';

export function describeBwsOperatorCockpitProcessDefinition(
  config: BwsOperatorCockpitBrowserConfig,
): BwsProcessDefinition {
  const networkBindings = config.dataMode === 'api'
    ? Object.freeze([
      Object.freeze({
        exposure: 'loopback_only' as const,
        host: readLoopbackHostname(config.apiBaseUrl),
        port: readLoopbackPort(config.apiBaseUrl),
        protocol: 'http' as const,
        purpose: 'operator_cockpit' as const,
      }),
    ])
    : Object.freeze([]);
  return Object.freeze({
    automaticFallback: 'forbidden',
    boundary: BWS_OPERATOR_COCKPIT_BROWSER_BOUNDARY,
    execution: 'disabled',
    exposure: config.dataMode === 'api' ? 'loopback_only' : 'browser_only',
    networkBindings,
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

function readLoopbackHostname(baseUrl: string): '127.0.0.1' {
  const parsed = new URL(baseUrl);
  if (parsed.hostname !== '127.0.0.1') {
    throw new Error(`Managed cockpit process metadata requires a 127.0.0.1 API base URL. Received ${parsed.hostname}.`);
  }
  return '127.0.0.1';
}

function readLoopbackPort(baseUrl: string): number {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'http:') {
    throw new Error(`Managed cockpit process metadata requires an http loopback API base URL. Received ${parsed.protocol}.`);
  }
  if (parsed.port.length === 0) {
    throw new Error('Managed cockpit process metadata requires an explicit loopback API port.');
  }
  const port = Number.parseInt(parsed.port, 10);
  if (!Number.isSafeInteger(port) || port <= 0) {
    throw new Error(`Managed cockpit process metadata requires a positive loopback API port. Received ${parsed.port}.`);
  }
  return port;
}
