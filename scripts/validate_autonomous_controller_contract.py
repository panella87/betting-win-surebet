from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / 'run-autonomous-implementation.sh'
CONTRACT_DOC = ROOT / 'docs' / 'autonomous_loop_contract.md'
STATUS_CONTRACT_DOC = ROOT / 'docs' / '013_autonomous_controller_status_contract.md'
PACKAGE = ROOT / 'package.json'


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f'missing required file: {path.relative_to(ROOT)}')
    return path.read_text(encoding='utf-8')


def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')


def require_order(text: str, earlier: str, later: str, rel: str, *, after: str | None = None) -> None:
    search_start = 0
    if after is not None:
        after_index = text.find(after)
        if after_index < 0:
            fail(f'{rel} missing required anchor: {after}')
        search_start = after_index
    earlier_index = text.find(earlier, search_start)
    later_index = text.find(later, search_start)
    if earlier_index < 0:
        fail(f'{rel} missing required marker: {earlier}')
    if later_index < 0:
        fail(f'{rel} missing required marker: {later}')
    if earlier_index >= later_index:
        fail(f'{rel} marker order is unsafe: {earlier} must appear before {later}')


def extract_required_cycle_artifacts(text: str) -> list[str]:
    marker = 'REQUIRED_CYCLE_ARTIFACTS=('
    start = text.find(marker)
    if start < 0:
        fail('run-autonomous-implementation.sh missing REQUIRED_CYCLE_ARTIFACTS array')
    start += len(marker)
    end = text.find('\n)', start)
    if end < 0:
        fail('run-autonomous-implementation.sh missing REQUIRED_CYCLE_ARTIFACTS closing marker')
    entries: list[str] = []
    for raw_line in text[start:end].splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith('#'):
            continue
        entries.append(line)
    return entries


def main() -> None:
    runner = read(RUNNER)
    contract_doc = read(CONTRACT_DOC)
    status_contract_doc = read(STATUS_CONTRACT_DOC)
    package = json.loads(read(PACKAGE))
    required_cycle_artifacts = extract_required_cycle_artifacts(runner)

    for marker in [
        'REQUIRED_CYCLE_ARTIFACTS=(',
        'validate_cycle_artifacts()',
        'invalid_cycle_artifacts.txt',
        'placeholder_cycle_artifact=',
        'empty_required_cycle_artifact=',
        'invalid_cycle_artifacts',
        'request_flags.txt must contain exactly two lines:',
        'SERVICE_REFRESH_REQUIRED=no',
        'RUNTIME_EVIDENCE_REQUIRED=no',
        'read_continue_status()',
        'read_request_flags()',
        'invalid_request_flags.txt',
        'request_flags_must_have_exactly_two_lines',
        'unexpected_request_flags',
        'invalid_continue_status.txt',
        'continue_status_must_have_exactly_one_non_empty_line',
        'unrecognized_continue_status',
        'codex_cycle_failed',
        'invalid_request_flags',
        'invalid_continue_status',
        'AUTONOMOUS_GOAL_COMPLETE=yes|CONTINUE_REQUIRED=yes|BLOCKED=yes',
    ]:
        require(runner, marker, 'run-autonomous-implementation.sh')

    duplicates = sorted({name for name in required_cycle_artifacts if required_cycle_artifacts.count(name) > 1})
    if duplicates:
        fail(
            'run-autonomous-implementation.sh REQUIRED_CYCLE_ARTIFACTS must not contain duplicates: '
            + ', '.join(duplicates)
        )

    if 'CONTINUE_REQUIRED=yes|*)' in runner:
        fail('run-autonomous-implementation.sh must not treat unknown continue_status values as CONTINUE_REQUIRED')

    loop_anchor = 'run_validation "cycle_${cycle}" "$cycle_dir"'
    require_order(
        runner,
        'if [[ "$codex_rc" -ne 0 ]]',
        'if ! status_line="$(read_continue_status "$cycle_dir")"',
        'run-autonomous-implementation.sh',
        after=loop_anchor,
    )
    require_order(
        runner,
        'if [[ "$validation_rc" -ne 0 ]]',
        'if ! validate_cycle_artifacts "$cycle_dir"; then',
        'run-autonomous-implementation.sh',
        after=loop_anchor,
    )
    require_order(
        runner,
        'if ! validate_cycle_artifacts "$cycle_dir"; then',
        'if ! read_request_flags "$cycle_dir"; then',
        'run-autonomous-implementation.sh',
        after=loop_anchor,
    )
    require_order(
        runner,
        'if ! read_request_flags "$cycle_dir"; then',
        'if ! status_line="$(read_continue_status "$cycle_dir")"',
        'run-autonomous-implementation.sh',
        after=loop_anchor,
    )
    require_order(
        runner,
        'if ! status_line="$(read_continue_status "$cycle_dir")"',
        'case "$status_line" in',
        'run-autonomous-implementation.sh',
        after=loop_anchor,
    )

    for marker in [
        'exactly one non-empty line',
        'malformed, missing, combined, or unknown status must fail closed',
        'request_flags.txt',
        'required cycle report artifact',
        'placeholder',
        'exactly two lines',
        'SERVICE_REFRESH_REQUIRED=no',
        'RUNTIME_EVIDENCE_REQUIRED=no',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'CONTINUE_REQUIRED=yes',
        'BLOCKED=yes',
    ]:
        require(contract_doc, marker, 'docs/autonomous_loop_contract.md')

    for marker in [
        'strict machine contract',
        'exactly one non-empty line',
        'request_flags.txt',
        'required cycle reports',
        'placeholder',
        'exactly two lines',
        'SERVICE_REFRESH_REQUIRED=no',
        'RUNTIME_EVIDENCE_REQUIRED=no',
        'AUTONOMOUS_GOAL_COMPLETE=yes',
        'CONTINUE_REQUIRED=yes',
        'BLOCKED=yes',
        'Codex process exits nonzero',
        'post-cycle `npm run validate` gate must pass',
        'does not authorize SURE-002',
    ]:
        require(status_contract_doc, marker, 'docs/013_autonomous_controller_status_contract.md')

    validate_ops = package.get('scripts', {}).get('validate:ops', '')
    if 'scripts/validate_autonomous_controller_contract.py' not in validate_ops:
        fail('package.json validate:ops must include validate_autonomous_controller_contract.py')

    print('validate_autonomous_controller_contract: ok')


if __name__ == '__main__':
    main()
