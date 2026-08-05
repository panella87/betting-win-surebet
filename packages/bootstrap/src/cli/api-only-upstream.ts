import process from 'node:process';

export const BWS_API_ONLY_UPSTREAM_MODE = 'api' as const;
const RETIRED_UPSTREAM_SELECTOR_KEYS = Object.freeze([
  'BWS_UPSTREAM_EXPORT_SELECTION_PATH',
  'BWS_PINNED_EXPORT_PATH',
  'BWS_UPSTREAM_EXPORT_FILE',
  'BWS_UPSTREAM_EXPORT_PATH',
  'SUREBET_PINNED_BUNDLE',
]);

export function enforceBwsApiOnlyProcessEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  environment.BWS_UPSTREAM_MODE = BWS_API_ONLY_UPSTREAM_MODE;
  for (const key of RETIRED_UPSTREAM_SELECTOR_KEYS) {
    delete environment[key];
  }
  return environment;
}
