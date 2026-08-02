from __future__ import annotations

from pathlib import Path
import csv
import json
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required BWS-820 marker: {marker}')


def main() -> None:
    operations = read('packages/bootstrap/src/operations/b1-runtime-evidence.ts')
    shim = read('src/operations/b1-runtime-evidence.ts')
    test = read('tests/b1-runtime-evidence.test.ts')
    package = json.loads(read('package.json'))

    for marker in [
        'deterministic_b1_runtime_evidence_acceptance_v1',
        'deterministic_b1_runtime_acceptance_evidence',
        'B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET',
        'B1_FALSIFIED_NET_EDGE_DISAPPEARED',
        'B1_BLOCKED_UPSTREAM_DATA_INSUFFICIENT',
        'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT',
        'B1_BLOCKED_SETTLEMENT_COMPATIBILITY',
        'B1_BLOCKED_FILLABILITY_EVIDENCE',
        'B1_BLOCKED_CAPACITY_OR_LIMITS',
        'B1_KILLED_QUOTE_STALENESS_EXPLAINS_GROSS_EDGE',
        'B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH',
        'B1_KILLED_CAPITAL_LOCK_UNACCEPTABLE',
        'not_authorized_bws_900_parked',
        "publicSignals: 'forbidden'",
        'runtimeEvidence: false',
        'executable: false',
    ]:
        require(operations, marker, 'packages/bootstrap/src/operations/b1-runtime-evidence.ts')

    require(shim, "export * from '../../packages/bootstrap/src/operations/b1-runtime-evidence.js';", 'src/operations/b1-runtime-evidence.ts')

    for marker in [
        'BWS-820 classifies accepted offline thresholds without execution or public claims',
        'BWS-820 runtime evidence gate blocks deterministic fixtures as upstream evidence',
        'BWS-820 blocks insufficient acceptance coverage with explicit evidence requirements',
        'BWS-820 falsifies the B1 hypothesis when net edge disappears',
        'BWS-820 maps kill criteria to deterministic terminal outcomes',
        'BWS-820 maps operational blockers to deterministic terminal outcomes',
        'B1_BLOCKED_UPSTREAM_CONTRACT_ABSENT',
        'B1_KILLED_FALSE_POSITIVE_RATE_TOO_HIGH',
    ]:
        require(test, marker, 'tests/b1-runtime-evidence.test.ts')

    scripts = package.get('scripts', {})
    validate_bws_b1 = scripts.get('validate:bws-b1', '')
    if 'scripts/validate_bws_b1_acceptance.py' not in validate_bws_b1:
        fail('package.json validate:bws-b1 must invoke scripts/validate_bws_b1_acceptance.py')
    if 'dist/tests/b1-runtime-evidence.test.js' not in validate_bws_b1:
        fail('package.json validate:bws-b1 must run b1-runtime-evidence.test.js')

    with (ROOT / 'backlog' / 'bws_b1_cross_venue_implementation.csv').open(newline='', encoding='utf-8') as handle:
        rows = {row['id']: row for row in csv.DictReader(handle)}
    if rows['BWS-820']['status'] != 'VALIDATED':
        fail('BWS-820 must be VALIDATED after acceptance/kill criteria proof lands')

    print('validate_bws_b1_acceptance: ok')


if __name__ == '__main__':
    main()
