from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PROGRAM = 'BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1'
B1_DOCS = [
    'docs/047_b1_cross_venue_offline_falsification_program.md',
    'docs/048_b1_upstream_contract.md',
    'docs/049_b1_market_equivalence.md',
    'docs/050_b1_falsification_acceptance.md',
    'docs/051_b1_implementation_map.md',
    'docs/052_b1_future_strategy_stubs.md',
    'docs/automation/current-implementation-task.md',
    'docs/repo_status_current.md',
]
B1_LOCAL_CONTRACT_FILES = [
    'packages/bootstrap/src/contracts/b1-local-types.ts',
    'packages/bootstrap/src/contracts/betting-win-b1-resource-records.ts',
    'packages/bootstrap/src/economics/b1-capital-lock.ts',
    'packages/bootstrap/src/economics/b1-fee-matrix.ts',
    'packages/bootstrap/src/economics/b1-lateness-penalty.ts',
    'packages/bootstrap/src/economics/b1-net-spread.ts',
    'packages/bootstrap/src/identity/b1-market-equivalence.ts',
    'packages/bootstrap/src/identity/b1-selection-equivalence.ts',
    'packages/bootstrap/src/identity/b1-venue-pair-key.ts',
    'packages/bootstrap/src/opportunity/b1-cross-venue-derivation.ts',
    'packages/bootstrap/src/opportunity/b1-gross-spread.ts',
    'packages/bootstrap/src/quotes/b1-quote-age-penalty.ts',
    'packages/bootstrap/src/reporting/b1-false-positive-report.ts',
    'packages/bootstrap/src/reporting/b1-backtest-report.ts',
    'packages/bootstrap/src/backtest/b1-cross-venue-backtest.ts',
    'packages/bootstrap/src/api/bws-read-only-query-service.ts',
    'packages/bootstrap/src/api/bws-read-only-query-http.ts',
    'packages/bootstrap/src/workers/b1-private-observation-jobs.ts',
    'packages/bootstrap/src/scenarios/b1-scenario-cashflow.ts',
    'packages/bootstrap/src/scenarios/b1-terminal-scenario.ts',
    'packages/bootstrap/src/simulation/b1-leg-completion.ts',
    'packages/bootstrap/src/simulation/b1-residual-exposure.ts',
    'packages/bootstrap/src/simulation/b1-settlement-replay.ts',
    'packages/bootstrap/src/simulation/b1-void-rule-replay.ts',
    'packages/bootstrap/src/solver/b1-generalized-stake-vector.ts',
    'packages/bootstrap/src/solver/b1-rounding.ts',
    'src/contracts/b1-local-types.ts',
    'src/contracts/betting-win-b1-resource-records.ts',
    'src/economics/b1-capital-lock.ts',
    'src/economics/b1-fee-matrix.ts',
    'src/economics/b1-lateness-penalty.ts',
    'src/economics/b1-net-spread.ts',
    'src/identity/b1-market-equivalence.ts',
    'src/identity/b1-selection-equivalence.ts',
    'src/identity/b1-venue-pair-key.ts',
    'src/opportunity/b1-cross-venue-derivation.ts',
    'src/opportunity/b1-gross-spread.ts',
    'src/quotes/b1-quote-age-penalty.ts',
    'src/reporting/b1-false-positive-report.ts',
    'src/reporting/b1-backtest-report.ts',
    'src/backtest/b1-cross-venue-backtest.ts',
    'apps/web/src/api/contracts.ts',
    'apps/web/src/api/client.ts',
    'apps/web/src/api/models.ts',
    'apps/web/src/api/mock-data.ts',
    'apps/web/src/app/page-chrome.ts',
    'src/workers/b1-private-observation-jobs.ts',
    'src/scenarios/b1-scenario-cashflow.ts',
    'src/scenarios/b1-terminal-scenario.ts',
    'src/simulation/b1-leg-completion.ts',
    'src/simulation/b1-residual-exposure.ts',
    'src/simulation/b1-settlement-replay.ts',
    'src/simulation/b1-void-rule-replay.ts',
    'src/solver/b1-generalized-stake-vector.ts',
    'src/solver/b1-rounding.ts',
    'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json',
    'tests/betting-win-b1-resource-records.test.ts',
    'tests/b1-market-equivalence.test.ts',
    'tests/b1-gross-spread.test.ts',
    'tests/b1-cross-venue-derivation.test.ts',
    'tests/b1-capital-lock.test.ts',
    'tests/b1-net-spread.test.ts',
    'tests/b1-scenario-cashflow.test.ts',
    'tests/b1-generalized-stake-vector.test.ts',
    'tests/b1-rejection-model.test.ts',
    'tests/b1-residual-exposure.test.ts',
    'tests/b1-settlement-replay.test.ts',
    'tests/b1-false-positive-report.test.ts',
    'tests/b1-cross-venue-backtest.test.ts',
    'tests/b1-persistence.test.ts',
    'tests/b1-private-observation-jobs.test.ts',
    'tests/b1-read-only-api.test.ts',
    'tests/b1-operator-cockpit.test.ts',
]
FORBIDDEN_CLAIMS = [
    'execution_gate=open',
    'BWS-900=authorized',
    'live_execution=authorized',
    'provider_connections=allowed',
    'provider_credentials=allowed',
    'public_signals=allowed',
    'profitability_claims=allowed',
    'runtime_file_export_fallback=allowed',
    'fixture_runtime_fallback=allowed',
    'B1_ACCEPTED_OFFLINE_FALSIFICATION_PASSED',
    'runtimeEvidence": true',
]
REQUIRED_MARKERS = [
    'provider_connections=prohibited',
    'provider_credentials=prohibited',
    'betting_win_checkout_mutation=prohibited',
    'execution=prohibited',
    'public_signals=prohibited',
    'profitability_claims=prohibited',
    'BWS-900',
]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def main() -> None:
    combined = ''
    for rel in B1_DOCS:
        text = read(rel)
        if PROGRAM not in text:
            fail(f'{rel} missing B1 program marker')
        combined += '\n' + text

    for marker in REQUIRED_MARKERS:
        if marker not in combined:
            fail(f'B1 boundary docs missing required marker: {marker}')

    for claim in FORBIDDEN_CLAIMS:
        if claim in combined:
            fail(f'forbidden B1 boundary claim found: {claim}')

    local_contract_surface = ''
    for rel in B1_LOCAL_CONTRACT_FILES:
        local_contract_surface += '\n' + read(rel)
    for marker in [
        'betting-win.b1_multi_venue_markets.v1',
        'blocked_until_betting_win_b1_multi_venue_markets_v1',
        'B1_FIXTURE_RUNTIME_EVIDENCE_FORBIDDEN',
        'B1_MARKET_EQUIVALENCE_MISSING',
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1_OUTCOME_SET_INCOMPLETE',
        'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
        'B1_GROSS_SPREAD_NOT_POSITIVE',
        'B1_NET_SPREAD_NOT_POSITIVE',
        'B1_FEE_MATRIX_ENTRY_MISSING',
        'B1_QUOTE_AGE_PENALTY_LIMIT_EXCEEDED',
        'B1_CAPITAL_LOCK_POLICY_MISSING',
        'gross_only',
        'deterministic_gross_cross_venue_candidate',
        'deterministic_net_cross_venue_candidate',
        'deterministic_b1_generalized_stake_vector',
        'deterministic_b1_fill_rejection_timeout_simulation',
        'deterministic_b1_residual_exposure',
        'deterministic_b1_settlement_replay',
        'deterministic_b1_void_rule_replay',
        'deterministic_b1_false_positive_report',
        'deterministic_b1_cross_venue_backtest_report',
        'deterministic_b1_cross_venue_offline_backtest',
        'B1_BACKTEST_PLAN_MISSING',
        'B1_BACKTEST_FIXTURE_RUNTIME_EVIDENCE_FORBIDDEN',
        'B1_BACKTEST_UPSTREAM_READINESS_CLAIM_FORBIDDEN',
        'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
        'B1_OFFLINE_RESEARCH_CANDIDATES_OBSERVED',
        'SUREBET_B1_RUNTIME_EVIDENCE_FORBIDDEN',
        'SUREBET_B1_EXECUTION_FORBIDDEN',
        'B1_PRIVATE_OBSERVATION_RUNTIME_EVIDENCE_FORBIDDEN',
        'B1_PRIVATE_OBSERVATION_BACKTEST_BLOCKED',
        'b1_backtest_runs',
        'BWS_B1_QUERY_FILTERS_UNBOUNDED',
        'BWS_B1_QUERY_POLICY_INVALID',
        '/api/read-only/b1/backtest-runs',
        '/b1-research',
        'B1_STAKE_VECTOR_ROUNDING_LOSS',
        'B1_SCENARIO_CASHFLOW_MATRIX_INCOMPLETE',
        'B1_FILLABILITY_UNWIND_FORBIDDEN',
        'B1_FILLABILITY_EVENT_TARGET_UNKNOWN',
        'B1_RESIDUAL_EXPOSURE_LIMIT_INVALID',
        'B1_VOID_RULE_MISMATCH',
        'B1_SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
        'B1_FALSE_POSITIVE_RATE_DENOMINATOR_MISSING',
        'not_authorized_bws_900_parked',
    ]:
        if marker not in local_contract_surface:
            fail(f'B1 local contract surface missing marker: {marker}')

    fixture = read('tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json')
    for marker in [
        '"runtimeEvidence": false',
        '"fixtureKind": "deterministic_b1_multi_venue_fixture"',
        '"known_coverage_gaps": ["not_upstream_runtime_evidence"]',
    ]:
        if marker not in fixture:
            fail(f'B1 deterministic fixture missing non-evidence marker: {marker}')

    upstream = read('docs/048_b1_upstream_contract.md')
    for marker in [
        'contract_schema=betting-win.b1_multi_venue_markets.v1',
        'runtime_file_export_fallback=prohibited',
        'current_real_intake_status=BLOCKED_UPSTREAM_CONTRACT_ABSENT',
        'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT',
    ]:
        if marker not in upstream:
            fail(f'docs/048_b1_upstream_contract.md missing marker: {marker}')

    package = json.loads(read('package.json'))
    for section in ['dependencies', 'devDependencies', 'optionalDependencies']:
        deps = package.get(section, {})
        if isinstance(deps, dict):
            for dep in deps:
                lowered = dep.lower()
                if any(token in lowered for token in ['polymarket', 'azuro', 'walletconnect', 'ethers', 'viem', 'web3']):
                    fail(f'forbidden provider/execution dependency present: {dep}')

    print('validate_bws_b1_boundary: ok')


if __name__ == '__main__':
    main()
