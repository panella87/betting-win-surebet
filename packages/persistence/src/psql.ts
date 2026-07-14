import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { SurebetPersistenceError } from './errors.js';
import type { JsonValue, SurebetPersistenceConfig } from './types.js';

const PSQL_BASE_ARGS = ['-X', '--set=ON_ERROR_STOP=1', '--no-psqlrc'] as const;

export interface SurebetMigrationFile {
  readonly migrationName: string;
  readonly path: string;
  readonly sha256: string;
  readonly sql: string;
}

export function buildPsqlConnectionArgs(config: SurebetPersistenceConfig): readonly string[] {
  const host = config.host ?? config.socketDirectory;
  if (host === undefined) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_TARGET_INVALID',
      'Surebet persistence config must provide either host or socketDirectory.',
    );
  }
  return Object.freeze([
    ...PSQL_BASE_ARGS,
    '-d',
    config.database,
    '-U',
    config.user,
    '-p',
    String(config.port),
    '-h',
    host,
  ]);
}

export function executePsqlCommand(config: SurebetPersistenceConfig, sql: string): void {
  runPsql(config, ['--command', sql], 'SUREBET_PSQL_COMMAND_FAILED');
}

export function queryPsqlJsonRows<T>(config: SurebetPersistenceConfig, sql: string): readonly T[] {
  const output = runPsql(
    config,
    ['-A', '-t', '--command', sql],
    'SUREBET_PSQL_QUERY_FAILED',
  ).trim();
  if (output.length === 0) {
    return Object.freeze([] as T[]);
  }
  return Object.freeze(
    output
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T),
  );
}

export function loadSurebetMigrationFiles(
  repositoryRoot: string = process.cwd(),
  migrationsDirectory: string = 'database/migrations/surebet',
): readonly SurebetMigrationFile[] {
  const resolvedDirectory = resolve(repositoryRoot, migrationsDirectory);
  if (!existsSync(resolvedDirectory)) {
    throw new SurebetPersistenceError(
      'SUREBET_MIGRATIONS_DIRECTORY_MISSING',
      `Surebet migration directory does not exist: ${resolvedDirectory}`,
    );
  }
  if (!statSync(resolvedDirectory).isDirectory()) {
    throw new SurebetPersistenceError(
      'SUREBET_MIGRATIONS_DIRECTORY_INVALID',
      `Surebet migration path must be a directory: ${resolvedDirectory}`,
    );
  }
  const fileNames = readdirSync(resolvedDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));
  if (fileNames.length === 0) {
    throw new SurebetPersistenceError(
      'SUREBET_MIGRATIONS_DIRECTORY_EMPTY',
      `Surebet migration directory must contain at least one .sql file: ${resolvedDirectory}`,
    );
  }

  const migrations = fileNames.map((fileName) => {
    const path = resolve(resolvedDirectory, fileName);
    const sql = readFileSync(path, 'utf-8');
    if (sql.trim().length === 0) {
      throw new SurebetPersistenceError(
        'SUREBET_MIGRATION_FILE_EMPTY',
        `Surebet migration file must not be empty: ${path}`,
      );
    }
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)\b/im.test(sql)) {
      throw new SurebetPersistenceError(
        'SUREBET_MIGRATION_TRANSACTION_CONTROL_FORBIDDEN',
        `Surebet migration file must not declare its own transaction control: ${path}`,
      );
    }
    return Object.freeze({
      migrationName: fileName,
      path,
      sha256: createHash('sha256').update(sql).digest('hex'),
      sql,
    });
  });

  const uniqueNames = new Set(migrations.map((migration) => migration.migrationName));
  if (uniqueNames.size !== migrations.length) {
    throw new SurebetPersistenceError(
      'SUREBET_MIGRATION_NAME_DUPLICATE',
      'Surebet migration file names must be unique.',
    );
  }

  return Object.freeze(migrations);
}

export function quoteSqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function toJsonLiteral(value: JsonValue): string {
  return `${quoteSqlLiteral(stableJsonStringify(value))}::jsonb`;
}

export function stableJsonStringify(value: JsonValue): string {
  return JSON.stringify(canonicalizeJsonValue(value));
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalizeJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => canonicalizeJsonValue(entry)));
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, childValue]) => [key, canonicalizeJsonValue(childValue)] as const);
    return Object.freeze(Object.fromEntries(entries));
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new SurebetPersistenceError(
      'SUREBET_PERSISTENCE_JSON_INVALID',
      'Surebet persistence JSON payloads must not contain non-finite numbers.',
    );
  }
  return value;
}

function runPsql(
  config: SurebetPersistenceConfig,
  extraArgs: readonly string[],
  errorCode: string,
): string {
  try {
    const env = config.password === undefined
      ? process.env
      : { ...process.env, PGPASSWORD: config.password };
    return execFileSync(
      'psql',
      [...buildPsqlConnectionArgs(config), ...extraArgs],
      {
        encoding: 'utf-8',
        env,
        stdio: 'pipe',
      },
    );
  } catch (error) {
    const message = error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
      ? error.stderr.trim()
      : error instanceof Error
        ? error.message
        : String(error);
    throw new SurebetPersistenceError(errorCode, `psql command failed: ${message}`);
  }
}
