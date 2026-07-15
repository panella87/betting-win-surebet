export const BWS_OPERATOR_COCKPIT_DATA_MODE_ENV = 'VITE_BWS_COCKPIT_DATA_MODE';
export const BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV = 'VITE_BWS_COCKPIT_API_BASE_URL';

export type BwsOperatorCockpitBrowserDataMode = 'api' | 'mock';

export type BwsOperatorCockpitBrowserEnvironment = Readonly<
  Record<string, string | undefined>
>;

export type BwsOperatorCockpitBrowserConfig =
  | Readonly<{
      dataMode: 'mock';
    }>
  | Readonly<{
      apiBaseUrl: string;
      dataMode: 'api';
    }>;

function fail(message: string): never {
  throw new Error(message);
}

function readExplicitMode(
  value: string | undefined,
): BwsOperatorCockpitBrowserDataMode {
  if (value === undefined) {
    fail(`${BWS_OPERATOR_COCKPIT_DATA_MODE_ENV} must be explicitly set to mock or api`);
  }
  if (value === 'mock' || value === 'api') {
    return value;
  }
  fail(`${BWS_OPERATOR_COCKPIT_DATA_MODE_ENV} must be mock or api`);
}

function normalizeBaseUrl(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) {
    fail(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} is required in api mode`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must be an absolute URL: ${message}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    fail(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must use http or https`);
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    fail(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must not include embedded credentials`);
  }
  if (parsed.search.length > 0 || parsed.hash.length > 0) {
    fail(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must not include query or hash components`);
  }
  if (!isLoopbackHostname(parsed.hostname)) {
    fail(`${BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV} must stay on an explicit loopback host`);
  }
  return parsed.href.endsWith('/') ? parsed.href.slice(0, -1) : parsed.href;
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === '127.0.0.1'
    || hostname === 'localhost'
    || hostname === '[::1]'
    || hostname === '::1';
}

export function resolveBwsOperatorCockpitBrowserConfig(
  environment: BwsOperatorCockpitBrowserEnvironment,
): BwsOperatorCockpitBrowserConfig {
  const dataMode = readExplicitMode(environment[BWS_OPERATOR_COCKPIT_DATA_MODE_ENV]);
  if (dataMode === 'mock') {
    return Object.freeze({ dataMode });
  }
  return Object.freeze({
    apiBaseUrl: normalizeBaseUrl(environment[BWS_OPERATOR_COCKPIT_API_BASE_URL_ENV]),
    dataMode,
  });
}
