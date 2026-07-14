import { SurebetPersistenceError } from './errors.js';
import type { SurebetPersistenceConfig, SurebetPersistenceEnvironment } from './types.js';

const PORT_MIN = 1;
const PORT_MAX = 65535;

export function resolveSurebetPersistenceConfig(
  environment: SurebetPersistenceEnvironment = process.env as SurebetPersistenceEnvironment,
): SurebetPersistenceConfig {
  const database = requireNonEmptyString(environment.SUREBET_PG_DATABASE, 'SUREBET_PG_DATABASE');
  const user = requireNonEmptyString(environment.SUREBET_PG_USER, 'SUREBET_PG_USER');
  const port = parseRequiredPort(environment.SUREBET_PG_PORT);
  const host = optionalNonEmptyString(environment.SUREBET_PG_HOST, 'SUREBET_PG_HOST');
  const socketDirectory = optionalNonEmptyString(
    environment.SUREBET_PG_SOCKET_DIRECTORY,
    'SUREBET_PG_SOCKET_DIRECTORY',
  );
  const password = optionalNonEmptyString(environment.SUREBET_PG_PASSWORD, 'SUREBET_PG_PASSWORD');

  if ((host === undefined && socketDirectory === undefined) || (host !== undefined && socketDirectory !== undefined)) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_TARGET_INVALID',
      'Surebet persistence requires exactly one explicit connection target: SUREBET_PG_HOST or SUREBET_PG_SOCKET_DIRECTORY.',
    );
  }

  const config: SurebetPersistenceConfig = {
    database,
    user,
    port,
  };
  if (host !== undefined) {
    Object.assign(config, { host });
  }
  if (socketDirectory !== undefined) {
    Object.assign(config, { socketDirectory });
  }
  if (password !== undefined) {
    Object.assign(config, { password });
  }
  return Object.freeze(config);
}

function requireNonEmptyString(value: string | undefined, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_CONFIG_MISSING',
      `Surebet persistence requires a non-empty ${name} value.`,
    );
  }
  return value.trim();
}

function optionalNonEmptyString(value: string | undefined, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value.trim().length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_CONFIG_INVALID',
      `Surebet persistence does not accept an empty ${name} value.`,
    );
  }
  return value.trim();
}

function parseRequiredPort(value: string | undefined): number {
  const rawValue = requireNonEmptyString(value, 'SUREBET_PG_PORT');
  if (!/^\d+$/.test(rawValue)) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_CONFIG_INVALID',
      'Surebet persistence requires SUREBET_PG_PORT to be a base-10 integer.',
    );
  }
  const port = Number.parseInt(rawValue, 10);
  if (!Number.isSafeInteger(port) || port < PORT_MIN || port > PORT_MAX) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_CONFIG_INVALID',
      `Surebet persistence requires SUREBET_PG_PORT to be between ${PORT_MIN} and ${PORT_MAX}.`,
    );
  }
  return port;
}
