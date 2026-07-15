CREATE TABLE IF NOT EXISTS surebet.pinned_strategy_exports (
  intake_record_id text PRIMARY KEY,
  import_run_id text NOT NULL UNIQUE REFERENCES surebet.import_runs (import_run_id),
  upstream_lock_record_id text NOT NULL REFERENCES surebet.upstream_locks (lock_record_id),
  source_sha256 text NOT NULL UNIQUE CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  source_locator text NOT NULL,
  contract_schema text NOT NULL CHECK (contract_schema = 'betting-win.strategy-export.v1'),
  contract_alias text NOT NULL CHECK (contract_alias = 'betting-win-strategy-export.v1'),
  surebet_profile text NOT NULL CHECK (surebet_profile = 'surebet_standard_binary_v0'),
  export_id text NOT NULL UNIQUE,
  export_kind text NOT NULL CHECK (export_kind = 'pinned_provider_history_bundle'),
  export_profile text NOT NULL CHECK (
    export_profile IN (
      'provider_history_fixture_bundle_v1',
      'provider_history_store_backed_fixture_bundle_v1'
    )
  ),
  exported_at timestamptz NOT NULL,
  provider_id text NOT NULL,
  endpoint_id text NOT NULL,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  provider_generation_ids_json jsonb NOT NULL,
  source_lineage_record_ids_json jsonb NOT NULL,
  normalized_evidence_ids_json jsonb NOT NULL,
  imported_at timestamptz NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS pinned_strategy_exports_upstream_lock_record_id_idx
  ON surebet.pinned_strategy_exports (upstream_lock_record_id);
