import process from 'node:process';

export const BWS_API_ONLY_UPSTREAM_MODE = 'api' as const;

export function enforceBwsApiOnlyProcessEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  environment.BWS_UPSTREAM_MODE = BWS_API_ONLY_UPSTREAM_MODE;
  delete environment.BWS_UPSTREAM_EXPORT_SELECTION_PATH;
  return environment;
}
