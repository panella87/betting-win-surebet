-- Stage 27 research-only schema for strict market identity, scenario cash flows and
-- paper leg-completion simulation. It authorizes no wallet, signer or order action.

create table if not exists provider_generation (
  provider_generation_id text primary key,
  provider text not null,
  api_generation text not null,
  protocol_generation text,
  contract_generation text,
  collateral_asset text,
  collateral_generation text,
  fee_schedule_version text,
  observed_at_utc text not null,
  source_lineage_hash text not null
);

create table if not exists canonical_event_contract (
  canonical_event_id text primary key,
  sport text not null,
  competition_id text not null,
  home_or_participant_one_id text not null,
  away_or_participant_two_id text,
  participant_roles_json text not null,
  scheduled_start_utc text not null,
  venue_id text,
  neutral_site boolean,
  series_or_game_number text,
  identity_status text not null check (identity_status in (
    'candidate','review_required','verified','rejected','superseded'
  )),
  identity_evidence_hash text not null
);

create table if not exists provider_event_binding (
  provider_generation_id text not null,
  provider_event_id text not null,
  canonical_event_id text not null,
  observed_start_utc text,
  provider_status text,
  mapping_method text not null,
  mapping_confidence numeric,
  reviewer_status text not null,
  source_lineage_hash text not null,
  primary key (provider_generation_id, provider_event_id)
);

create table if not exists canonical_market_contract (
  canonical_market_id text primary key,
  canonical_event_id text not null,
  market_family text not null,
  period_scope text not null,
  line_value numeric,
  participant_requirement text,
  regulation_scope text not null,
  overtime_scope text,
  push_policy text,
  quarter_line_policy text,
  void_policy text not null,
  postponement_policy text,
  retirement_walkover_policy text,
  result_source text not null,
  dispute_finality_policy text,
  negative_risk boolean,
  rule_profile_version text not null,
  identity_status text not null check (identity_status in (
    'candidate','review_required','verified','rejected','superseded'
  )),
  identity_evidence_hash text not null
);

create table if not exists terminal_scenario (
  canonical_market_id text not null,
  scenario_id text not null,
  scenario_type text not null,
  description text not null,
  is_nominal_outcome boolean not null,
  primary key (canonical_market_id, scenario_id)
);

create table if not exists provider_market_binding (
  provider_generation_id text not null,
  provider_market_id text not null,
  provider_outcome_id text not null,
  canonical_market_id text not null,
  canonical_outcome_id text not null,
  provider_market_type text,
  provider_rule_version text not null,
  binding_status text not null,
  source_lineage_hash text not null,
  primary key (provider_generation_id, provider_market_id, provider_outcome_id)
);

create table if not exists quote_evidence (
  quote_evidence_id text primary key,
  provider_generation_id text not null,
  provider_market_id text not null,
  provider_outcome_id text not null,
  evidence_class text not null check (evidence_class in (
    'price_only','top_level','depth_snapshot','reserved_paper_capacity',
    'accepted_order','final_fill'
  )),
  side text not null,
  price numeric not null,
  size numeric,
  level_index integer,
  min_size numeric,
  max_size numeric,
  tick_size numeric,
  source_timestamp_utc text,
  received_at_utc text not null,
  sequence_or_cursor text,
  block_number text,
  raw_evidence_hash text not null,
  freshness_budget_ms integer not null,
  parser_version text not null
);

create table if not exists leg_fee_cashflow_rule (
  fee_rule_id text primary key,
  provider_generation_id text not null,
  venue_order_type text,
  fee_function_version text not null,
  fee_parameters_json text not null,
  gas_cost_accounting_rule text,
  currency_conversion_rule text,
  rounding_rule text not null,
  source_lineage_hash text not null
);

create table if not exists paper_arbitrage_opportunity (
  opportunity_id text primary key,
  family text not null check (family in (
    'cross_venue_surebet','same_venue_complete_set','back_lay',
    'synthetic_equivalence'
  )),
  canonical_market_id text not null,
  detected_at_utc text not null,
  identity_verified boolean not null default false,
  rules_verified boolean not null default false,
  scenario_coverage_complete boolean not null default false,
  capacity_sufficient boolean not null default false,
  minimum_scenario_cashflow numeric,
  completion_failure_reserve numeric,
  settlement_disagreement_reserve numeric,
  conservative_net_cashflow numeric,
  status text not null check (status in (
    'candidate','identity_review_required','rejected_identity','rejected_rules',
    'rejected_scenarios','rejected_stale','rejected_depth','rejected_costs',
    'paper_armed','partially_completed','paper_fully_hedged',
    'compensation_required','failed','settled_simulated','settlement_mismatch'
  )),
  source_snapshot_hash text not null
);

create table if not exists paper_arbitrage_leg_plan (
  opportunity_id text not null,
  leg_index integer not null,
  provider_generation_id text not null,
  provider_market_id text not null,
  provider_outcome_id text not null,
  canonical_outcome_id text not null,
  side text not null,
  requested_quantity numeric not null,
  worst_acceptable_price numeric not null,
  quote_evidence_id text not null,
  fee_rule_id text not null,
  planned_order_type text,
  leg_order_priority integer,
  primary key (opportunity_id, leg_index)
);

create table if not exists paper_leg_completion (
  opportunity_id text not null,
  leg_index integer not null,
  attempt_index integer not null,
  simulated_at_utc text not null,
  status text not null check (status in (
    'pending','rejected','partially_filled','fully_filled','expired','unknown'
  )),
  accepted_quantity numeric,
  final_filled_quantity numeric,
  average_fill_price numeric,
  completion_latency_ms integer,
  residual_quantity numeric,
  failure_reason text,
  evidence_hash text not null,
  primary key (opportunity_id, leg_index, attempt_index)
);

create table if not exists paper_scenario_cashflow (
  opportunity_id text not null,
  scenario_id text not null,
  gross_cashflow numeric not null,
  variable_fees numeric not null,
  fixed_costs numeric not null,
  currency_haircut numeric not null,
  rounding_reserve numeric not null,
  compensation_cost numeric not null,
  net_cashflow numeric not null,
  calculation_version text not null,
  primary key (opportunity_id, scenario_id)
);

create table if not exists paper_residual_exposure (
  opportunity_id text not null,
  exposure_id text not null,
  detected_at_utc text not null,
  canonical_outcome_id text not null,
  quantity numeric not null,
  conservative_mark_price numeric,
  worst_case_loss numeric not null,
  compensation_available boolean not null,
  compensation_cost numeric,
  status text not null,
  primary key (opportunity_id, exposure_id)
);

create table if not exists paper_arbitrage_settlement_replay (
  opportunity_id text not null,
  provider_generation_id text not null,
  provider_market_id text not null,
  provider_settlement_status text not null,
  terminal_scenario_id text,
  settled_cashflow numeric,
  correction_or_dispute_status text,
  settled_at_utc text,
  source_lineage_hash text not null,
  primary key (opportunity_id, provider_generation_id, provider_market_id)
);
