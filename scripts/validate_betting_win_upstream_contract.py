from __future__ import annotations

from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'config' / 'betting-win.upstream-baseline.json'
LOCK_SCHEMA = ROOT / 'schemas' / 'betting-win-upstream-lock.v1.schema.json'
EXPECTED_ARCHIVE_SHA256 = '9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f'
REQUIRED_PACKAGES = {
    '@betting-win/contracts', '@betting-win/foundation', '@betting-win/identity',
    '@betting-win/paper-ledger', '@betting-win/provider-collection',
    '@betting-win/provider-generation', '@betting-win/query-service',
    '@betting-win/quotes', '@betting-win/rules', '@betting-win/source-lineage',
}
REQUIRED_CAPABILITIES = {
    'exportHistoricalBundle', 'getHistoricalQuotes',
    'getProviderGenerations', 'inspectSourceLineage',
}


def fail(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        fail(f'missing required file: {rel}')
    return path.read_text(encoding='utf-8')


def load_json(rel: str) -> dict[str, object]:
    try:
        data = json.loads(read(rel))
    except json.JSONDecodeError as exc:
        fail(f'invalid JSON in {rel}: {exc}')
    if not isinstance(data, dict):
        fail(f'{rel} must contain a JSON object')
    return data


def require(text: str, marker: str, rel: str) -> None:
    if marker not in text:
        fail(f'{rel} missing required marker: {marker}')


def main() -> None:
    baseline = load_json('config/betting-win.upstream-baseline.json')
    if baseline.get('schema') != 'betting-win-surebet-upstream-baseline-v1':
        fail('upstream baseline schema mismatch')
    source = baseline.get('source')
    if not isinstance(source, dict):
        fail('upstream baseline source must be an object')
    expected_source = {
        'repository': 'betting-win',
        'sourceKind': 'uploaded_source_archive',
        'archiveSha256': EXPECTED_ARCHIVE_SHA256,
        'packageVersion': '0.48.0',
        'nodeEngine': '20.x',
    }
    for key, expected in expected_source.items():
        if source.get(key) != expected:
            fail(f'upstream baseline source.{key} must be {expected!r}')

    family = baseline.get('contractFamily')
    if not isinstance(family, dict):
        fail('upstream baseline contractFamily must be an object')
    expected_family = {
        'schema': 'betting-win.strategy-export.v1',
        'canonicalAlias': 'betting-win-strategy-export.v1',
        'surebetProfile': 'surebet_standard_binary_v0',
        'providerHistoryExportKind': 'pinned_provider_history_bundle',
        'downstreamProofProfile': 'downstream_pinned_provider_history_consumption_proof_v1',
    }
    for key, expected in expected_family.items():
        if family.get(key) != expected:
            fail(f'upstream baseline contractFamily.{key} must be {expected!r}')
    if not REQUIRED_CAPABILITIES.issubset(set(family.get('readOnlyFunctions', []))):
        fail('upstream baseline is missing required read-only functions')
    if not REQUIRED_PACKAGES.issubset(set(baseline.get('requiredCompatibilityPackages', []))):
        fail('upstream baseline is missing required compatibility packages')
    limitations = set(baseline.get('limitations', []))
    for marker in [
        'archive_has_no_git_commit_metadata',
        'archive_has_no_source_manifest',
        'baseline_is_design_evidence_not_runtime_lock',
        'accepted_continuous_live_read_only_input_is_not_proven_for_all_providers',
    ]:
        if marker not in limitations:
            fail(f'upstream baseline missing limitation: {marker}')

    schema = load_json('schemas/betting-win-upstream-lock.v1.schema.json')
    if schema.get('additionalProperties') is not False:
        fail('upstream lock schema must reject additional properties')
    required = set(schema.get('required', []))
    for field in [
        'schema', 'repository', 'repositoryPath', 'commitSha', 'sourceView',
        'packageVersion', 'gitTreeSha', 'trackedTreeListingSha256',
        'sourceFingerprintAlgorithm', 'contractSchema', 'contractAlias',
        'surebetProfile', 'verifiedAt', 'packageVersions', 'capabilities',
    ]:
        if field not in required:
            fail(f'upstream lock schema missing required field: {field}')
    properties = schema.get('properties')
    if not isinstance(properties, dict):
        fail('upstream lock schema properties must be an object')
    consts = {
        'schema': 'betting-win-surebet-upstream-lock-v1',
        'repository': 'betting-win',
        'sourceView': 'committed_git_head',
        'contractSchema': 'betting-win.strategy-export.v1',
        'contractAlias': 'betting-win-strategy-export.v1',
        'surebetProfile': 'surebet_standard_binary_v0',
    }
    for field, expected in consts.items():
        value = properties.get(field)
        if not isinstance(value, dict) or value.get('const') != expected:
            fail(f'upstream lock schema {field}.const must be {expected!r}')
    if properties.get('commitSha', {}).get('pattern') != '^[0-9a-f]{40}$':
        fail('upstream lock commitSha must require a 40-character lowercase Git SHA')
    if properties.get('gitTreeSha', {}).get('pattern') != '^[0-9a-f]{40}$':
        fail('upstream lock gitTreeSha must require a 40-character lowercase Git tree SHA')
    if properties.get('trackedTreeListingSha256', {}).get('pattern') != '^[0-9a-f]{64}$':
        fail('upstream lock trackedTreeListingSha256 must require lowercase SHA-256')
    if properties.get('sourceFingerprintAlgorithm', {}).get('const') != 'sha256_git_ls_tree_r_full_tree_head_v1':
        fail('upstream lock sourceFingerprintAlgorithm must identify the canonical Git tree listing algorithm')

    env = read('.env.example')
    for marker in ['BETTING_WIN_REPO_PATH', 'BWS_UPSTREAM_LOCK_PATH', 'BWS_UPSTREAM_API_BASE_URL']:
        require(env, marker, '.env.example')
    if re.search(r'^BETTING_WIN_REPO_PATH=', env, re.MULTILINE):
        fail('.env.example must not provide a silent active BETTING_WIN_REPO_PATH default')
    for forbidden in ['BWS_UPSTREAM_MODE', 'BWS_UPSTREAM_EXPORT_SELECTION_PATH']:
        if forbidden in env:
            fail(f'.env.example must not expose removed runtime selector: {forbidden}')

    package = load_json('package.json')
    serialized = json.dumps(package, sort_keys=True)
    if 'file:../betting-win' in serialized or 'file:../../betting-win' in serialized:
        fail('package.json must not contain a floating sibling betting-win dependency')
    scripts = package.get('scripts')
    if not isinstance(scripts, dict):
        fail('package.json scripts must be an object')
    if 'npm run validate:upstream-boundary' not in scripts.get('validate:ops', ''):
        fail('package.json validate:ops must invoke validate:upstream-boundary')
    if scripts.get('generate:upstream-lock') != 'node scripts/run_betting_win_upstream_lock.mjs generate':
        fail('package.json generate:upstream-lock is missing or non-canonical')
    if scripts.get('verify:upstream-lock') != 'node scripts/run_betting_win_upstream_lock.mjs verify':
        fail('package.json verify:upstream-lock is missing or non-canonical')
    if scripts.get('validate:upstream-boundary') != 'PYTHONDONTWRITEBYTECODE=1 python3 scripts/validate_betting_win_upstream_contract.py && npm run generate:upstream-lock && npm run verify:upstream-lock':
        fail('package.json validate:upstream-boundary is missing or non-canonical')

    docs = {
        'README.md': [EXPECTED_ARCHIVE_SHA256, 'BWS-100', 'betting-win.strategy-export.v1', 'surebet_standard_binary_v0'],
        'docs/002_dependency_contract_with_betting_win.md': ['workspace', 'export', 'api', 'There is no automatic fallback'],
        'docs/016_pinned_betting_win_interface_readiness.md': ['The upstream interface is no longer hypothetical', 'BWS-100'],
        'docs/030_upstream_compatibility_and_pin_contract.md': ['BETTING_WIN_REPO_PATH', 'committed `HEAD`', 'git show HEAD:', 'git ls-tree -r --full-tree HEAD', 'No fallback'],
        'docs/automation/current-implementation-task.md': ['prove the betting-win committed HEAD remains unchanged', 'no placeholder fields', 'no clone or temporary worktree'],
    }
    for rel, markers in docs.items():
        text = read(rel)
        for marker in markers:
            require(text, marker, rel)

    implementation = read('src/upstream/betting-win-upstream-lock.ts')
    for marker in [
        "const SOURCE_VIEW = 'committed_git_head'",
        "['show', 'HEAD:package.json']",
        "['show', 'HEAD:packages/provider-collection/src/index.ts']",
        "['ls-tree', '-r', '--name-only', 'HEAD'",
    ]:
        require(implementation, marker, 'src/upstream/betting-win-upstream-lock.ts')
    for forbidden in [
        "['status', '--porcelain'",
        'BETTING_WIN_WORKTREE_DIRTY',
        'checkout must be clean before generating the upstream lock',
    ]:
        if forbidden in implementation:
            fail(f'src/upstream/betting-win-upstream-lock.ts contains forbidden worktree-coupled marker: {forbidden}')

    source_manifest_validator = read('scripts/validate_source_manifest.py')
    require(
        source_manifest_validator,
        "'config/betting-win.upstream.lock.json'",
        'scripts/validate_source_manifest.py',
    )

    repo_validator = read('scripts/validate_repo.py')
    for marker in [
        'config/betting-win.upstream-baseline.json',
        'schemas/betting-win-upstream-lock.v1.schema.json',
        'scripts/validate_betting_win_upstream_contract.py',
        'scripts/run_betting_win_upstream_lock.mjs',
        'tests/betting-win-upstream-contract.test.ts',
    ]:
        require(repo_validator, marker, 'scripts/validate_repo.py')

    print('validate_betting_win_upstream_contract: ok')


if __name__ == '__main__':
    main()
