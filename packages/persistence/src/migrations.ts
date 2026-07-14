import {
  executePsqlCommand,
  loadSurebetMigrationFiles,
  queryPsqlJsonRows,
  quoteSqlLiteral,
} from './psql.js';
import { SurebetPersistenceError } from './errors.js';
import type { SurebetPersistenceConfig } from './types.js';

const MIGRATION_BOOTSTRAP_SQL = `
CREATE SCHEMA IF NOT EXISTS surebet;
CREATE TABLE IF NOT EXISTS surebet.schema_migrations (
  migration_name text PRIMARY KEY,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  applied_at timestamptz NOT NULL
);
`;

export interface AppliedSurebetMigration {
  readonly migrationName: string;
  readonly sha256: string;
  readonly appliedAt: string;
}

export interface ApplySurebetMigrationsOptions {
  readonly repositoryRoot?: string;
  readonly migrationsDirectory?: string;
}

export interface ApplySurebetMigrationsResult {
  readonly applied: readonly AppliedSurebetMigration[];
  readonly skipped: readonly AppliedSurebetMigration[];
}

interface AppliedMigrationRow {
  readonly migrationName: string;
  readonly sha256: string;
  readonly appliedAt: string;
}

export function applySurebetMigrations(
  config: SurebetPersistenceConfig,
  options: ApplySurebetMigrationsOptions = {},
): ApplySurebetMigrationsResult {
  executePsqlCommand(config, MIGRATION_BOOTSTRAP_SQL);
  const migrations = loadSurebetMigrationFiles(options.repositoryRoot, options.migrationsDirectory);
  const appliedBefore = new Map(
    listAppliedSurebetMigrations(config).map((migration) => [migration.migrationName, migration] as const),
  );
  const applied: AppliedSurebetMigration[] = [];
  const skipped: AppliedSurebetMigration[] = [];

  for (const migration of migrations) {
    const existing = appliedBefore.get(migration.migrationName);
    if (existing !== undefined) {
      if (existing.sha256 !== migration.sha256) {
        throw new SurebetPersistenceError(
          'SUREBET_MIGRATION_CHECKSUM_MISMATCH',
          `Surebet migration checksum mismatch for ${migration.migrationName}.`,
        );
      }
      skipped.push(existing);
      continue;
    }

    executePsqlCommand(
      config,
      [
        'BEGIN;',
        migration.sql.trimEnd(),
        `INSERT INTO surebet.schema_migrations (migration_name, sha256, applied_at) VALUES (${quoteSqlLiteral(migration.migrationName)}, ${quoteSqlLiteral(migration.sha256)}, CURRENT_TIMESTAMP);`,
        'COMMIT;',
      ].join('\n'),
    );

    const persistedMigration = getAppliedMigration(config, migration.migrationName);
    if (persistedMigration === undefined) {
      throw new SurebetPersistenceError(
        'SUREBET_MIGRATION_INSERT_MISSING',
        `Surebet migration record was not persisted for ${migration.migrationName}.`,
      );
    }
    applied.push(persistedMigration);
  }

  return Object.freeze({
    applied: Object.freeze(applied),
    skipped: Object.freeze(skipped),
  });
}

export function listAppliedSurebetMigrations(config: SurebetPersistenceConfig): readonly AppliedSurebetMigration[] {
  executePsqlCommand(config, MIGRATION_BOOTSTRAP_SQL);
  return Object.freeze(
    queryPsqlJsonRows<AppliedMigrationRow>(
      config,
      `
SELECT row_to_json(t)::text
FROM (
  SELECT
    migration_name AS "migrationName",
    sha256,
    to_char(applied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "appliedAt"
  FROM surebet.schema_migrations
  ORDER BY migration_name
) AS t;
`,
    ),
  );
}

function getAppliedMigration(
  config: SurebetPersistenceConfig,
  migrationName: string,
): AppliedSurebetMigration | undefined {
  const rows = queryPsqlJsonRows<AppliedMigrationRow>(
    config,
    `
SELECT row_to_json(t)::text
FROM (
  SELECT
    migration_name AS "migrationName",
    sha256,
    to_char(applied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "appliedAt"
  FROM surebet.schema_migrations
  WHERE migration_name = ${quoteSqlLiteral(migrationName)}
) AS t;
`,
  );
  return rows[0];
}
