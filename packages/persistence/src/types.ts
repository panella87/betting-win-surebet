export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | { readonly [key: string]: JsonValue }
  | readonly JsonValue[];

export interface SurebetPersistenceConfig {
  readonly database: string;
  readonly user: string;
  readonly port: number;
  readonly host?: string;
  readonly socketDirectory?: string;
  readonly password?: string;
}

export interface SurebetPersistenceEnvironment {
  readonly SUREBET_PG_DATABASE?: string;
  readonly SUREBET_PG_USER?: string;
  readonly SUREBET_PG_PORT?: string;
  readonly SUREBET_PG_HOST?: string;
  readonly SUREBET_PG_SOCKET_DIRECTORY?: string;
  readonly SUREBET_PG_PASSWORD?: string;
}
