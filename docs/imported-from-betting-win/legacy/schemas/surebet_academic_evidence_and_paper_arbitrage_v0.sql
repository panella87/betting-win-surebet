-- Research-only schema for Prompt 26 evidence and future paper simulation.
-- No order placement, wallet action or live execution is authorized.

create table if not exists surebet_literature_work (
  work_id text primary key,
  title text not null,
  doi text,
  openalex_id text,
  publication_year integer,
  evidence_role text not null,
  peer_review_status text,
  duplicate_group text,
  source_artifact_sha256 text not null,
  reviewed_status text not null
);

create table if not exists surebet_rule_profile (
  rule_profile_id text primary key,
  venue text not null,
  sport text not null,
  market_type text not null,
  rule_version text not null,
  regulation_scope text,
  overtime_scope text,
  void_policy text,
  retirement_policy text,
  postponement_policy text,
  result_source text,
  dispute_policy text,
  observed_at_utc text not null,
  source_lineage text not null
);

create table if not exists surebet_paper_opportunity (
  opportunity_id text primary key,
  canonical_event_id text not null,
  canonical_market_id text not null,
  detected_at_utc text not null,
  theoretical_margin numeric not null,
  cost_adjusted_margin numeric,
  executable_margin numeric,
  identity_verified boolean not null default false,
  rules_compatible boolean not null default false,
  fully_hedged_simulated boolean not null default false,
  status text not null check (status in (
    'quoted_only','rejected_identity','rejected_rules','rejected_stale',
    'rejected_depth','partially_fillable','paper_fully_hedged','settled_simulated'
  )),
  raw_source_hash text not null
);

create table if not exists surebet_paper_leg (
  opportunity_id text not null,
  leg_index integer not null,
  venue text not null,
  outcome_id text not null,
  side text not null check (side in ('back','lay','yes','no','other')),
  quoted_odds numeric not null,
  requested_stake numeric,
  executable_size numeric,
  accepted_stake numeric,
  commission_rate numeric,
  fixed_cost numeric,
  quote_timestamp_utc text not null,
  rule_profile_id text not null,
  fill_status text not null,
  primary key (opportunity_id, leg_index)
);

create table if not exists surebet_paper_outcome_cashflow (
  opportunity_id text not null,
  canonical_outcome_id text not null,
  net_cashflow numeric not null,
  includes_fees boolean not null,
  includes_rounding boolean not null,
  includes_void_scenario boolean not null,
  primary key (opportunity_id, canonical_outcome_id)
);

create table if not exists surebet_research_gate (
  singleton integer primary key check (singleton = 1),
  academic_status text not null,
  module_role text not null,
  prompt27_integrated boolean not null default false,
  operational_audit_complete boolean not null default false,
  paper_capture_authorized boolean not null default false,
  implementation_authorized boolean not null default false,
  live_execution_authorized boolean not null default false
);
