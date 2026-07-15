import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { SurebetPersistenceError } from './errors.js';
import type { JsonValue, SurebetPersistenceConfig } from './types.js';

const PSQL_BASE_ARGS = ['-X', '--set=ON_ERROR_STOP=1', '--no-psqlrc'] as const;
const SQL_COMMENT_PATTERN = /--.*$/gm;
const SQL_BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
const SQL_IDENTIFIER = '(?:"[^"]+"|[a-z_][a-z0-9_$]*)';
const SQL_QUALIFIED_IDENTIFIER = `(${SQL_IDENTIFIER}(?:\\s*\\.\\s*${SQL_IDENTIFIER})?)`;
const SUREBET_SCHEMA_PREFIX = /^"?surebet"?\s*\./i;
const SUREBET_MIGRATION_TARGET_PATTERNS = Object.freeze([
  {
    type: 'write target',
    pattern: new RegExp(`\\b(?:INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|TRUNCATE(?:\\s+TABLE)?)\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
  {
    type: 'table target',
    pattern: new RegExp(`\\b(?:CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?|ALTER\\s+TABLE(?:\\s+ONLY)?|DROP\\s+TABLE(?:\\s+IF\\s+EXISTS)?)\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
  {
    type: 'schema target',
    pattern: new RegExp(`\\b(?:CREATE\\s+SCHEMA(?:\\s+IF\\s+NOT\\s+EXISTS)?|DROP\\s+SCHEMA(?:\\s+IF\\s+EXISTS)?)\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
  {
    type: 'index target',
    pattern: new RegExp(`\\bCREATE\\s+INDEX(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+${SQL_IDENTIFIER}\\s+ON\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
  {
    type: 'reference target',
    pattern: new RegExp(`\\bREFERENCES\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
  {
    type: 'sequence target',
    pattern: new RegExp(`\\b(?:CREATE\\s+SEQUENCE(?:\\s+IF\\s+NOT\\s+EXISTS)?|ALTER\\s+SEQUENCE|DROP\\s+SEQUENCE(?:\\s+IF\\s+EXISTS)?)\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
  {
    type: 'view target',
    pattern: new RegExp(`\\b(?:CREATE(?:\\s+OR\\s+REPLACE)?\\s+VIEW|DROP\\s+VIEW(?:\\s+IF\\s+EXISTS)?|CREATE\\s+MATERIALIZED\\s+VIEW|DROP\\s+MATERIALIZED\\s+VIEW(?:\\s+IF\\s+EXISTS)?)\\s+${SQL_QUALIFIED_IDENTIFIER}`, 'gi'),
  },
]);

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
    assertSurebetOnlyMigrationSql(sql, path);
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

function assertSurebetOnlyMigrationSql(sql: string, path: string): void {
  const normalizedSql = normalizeMigrationSql(sql);

  for (const { type, pattern } of SUREBET_MIGRATION_TARGET_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(normalizedSql);
    while (match !== null) {
      const identifier = match[1];
      if (identifier === undefined) {
        throw new SurebetPersistenceError(
          'SUREBET_MIGRATION_SCOPE_INVALID',
          `Surebet migration ${path} contains an unreadable ${type} reference.`,
        );
      }
      assertSurebetTarget(type, identifier, path);
      match = pattern.exec(normalizedSql);
    }
  }
}

function normalizeMigrationSql(sql: string): string {
  return sql
    .replace(SQL_BLOCK_COMMENT_PATTERN, ' ')
    .replace(SQL_COMMENT_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertSurebetTarget(type: string, identifier: string, path: string): void {
  const normalizedIdentifier = identifier.replace(/\s+/g, '');
  if (type === 'schema target') {
    if (!/^"?surebet"?$/i.test(normalizedIdentifier)) {
      throw new SurebetPersistenceError(
        'SUREBET_MIGRATION_SCOPE_INVALID',
        `Surebet migration file must keep every ${type} inside the surebet schema: ${path}`,
      );
    }
    return;
  }

  if (!SUREBET_SCHEMA_PREFIX.test(normalizedIdentifier)) {
    throw new SurebetPersistenceError(
      'SUREBET_MIGRATION_SCOPE_INVALID',
      `Surebet migration file must keep every ${type} inside surebet.*: ${path}`,
    );
  }
}
