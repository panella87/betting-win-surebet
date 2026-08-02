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
