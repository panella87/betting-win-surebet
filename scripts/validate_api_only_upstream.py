#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
ACTIVE=[
 '.env.example','config/bws.private.env.template','package.json','cli.js',
 'run-paper-evaluation.sh','run-paper-autopilot.sh','run-autonomous-implementation.sh',
 'scripts/bws-root-wrapper-runtime.mjs',
 'packages/bootstrap/src/cli/bws-upstream-api-convergence.ts',
 'packages/bootstrap/src/cli/bws-upstream-convergence-service.ts',
 'packages/bootstrap/src/cli/bws-private-paper-scheduler.ts',
 'packages/bootstrap/src/cli/bws-private-paper-scheduler-service.ts',
 'packages/bootstrap/src/cli/bws-read-only-api.ts',
 'packages/bootstrap/src/cli/bws-private-paper-worker.ts',
 'packages/bootstrap/src/cli/bws-private-paper-worker-service.ts',
 'packages/bootstrap/src/cli/bws-paper-runtime-handoff.ts',
 'packages/bootstrap/src/cli/bws-observability.ts',
 'packages/bootstrap/src/cli/bws-operator-lifecycle.ts',
 'packages/bootstrap/src/cli/bws-paper-runtime-evidence.ts',
 'packages/bootstrap/src/cli/bws-external-runtime-preflight.ts',
 'packages/bootstrap/src/cli/bws-soak-campaign.ts',
 'packages/bootstrap/src/cli/api-only-upstream.ts',
 'packages/bootstrap/src/cli/bws-upstream-export-convergence.ts',
]
errors=[]
allowed_compatibility_files={
 'packages/bootstrap/src/cli/api-only-upstream.ts',
 'packages/bootstrap/src/cli/bws-upstream-export-convergence.ts',
 'scripts/bws-root-wrapper-runtime.mjs',
 'packages/bootstrap/src/cli/bws-soak-campaign.ts',
 'packages/bootstrap/src/cli/bws-external-runtime-preflight.ts',
}
for rel in ACTIVE:
 p=ROOT/rel
 if not p.is_file(): errors.append(f'{rel}: missing'); continue
 text=p.read_text(encoding='utf-8')
 patterns=[
  (r'BWS_UPSTREAM_MODE','legacy mode selector'),
  (r'BWS_UPSTREAM_EXPORT_SELECTION_PATH','legacy export selector'),
  (r'--upstream-mode','legacy mode flag'),
  (r'runtime:upstream-export','export runtime package command'),
  (r'runtime-upstream-export','export runtime CLI command'),
 ]
 if rel in allowed_compatibility_files:
  patterns=[item for item in patterns if item[0] not in {r'BWS_UPSTREAM_MODE',r'BWS_UPSTREAM_EXPORT_SELECTION_PATH',r'--upstream-mode'}]
 for pat,label in patterns:
  if re.search(pat,text): errors.append(f'{rel}: {label}')
package=json.loads((ROOT/'package.json').read_text())
if 'runtime:upstream-export' in package.get('scripts',{}): errors.append('package.json: export runtime remains')
for rel in ['run-paper-evaluation.sh','run-paper-autopilot.sh']:
 if 'upstream_mode=api' not in (ROOT/rel).read_text(): errors.append(f'{rel}: missing upstream_mode=api')
wrapper=(ROOT/'scripts/bws-root-wrapper-runtime.mjs').read_text(encoding='utf-8')
if 'merged.BWS_PRIVATE_PAPER_SCHEDULE_PATH =' in wrapper:
 errors.append('scripts/bws-root-wrapper-runtime.mjs: private-paper schedule fallback must not be synthesized')
for marker in [
 "case 'paper-runtime-evidence'",
 "BWS_UPSTREAM_API_BASE_URL: 'http://127.0.0.1:3000'",
 "prepareRuntimeBuild(environment);",
 "merged.BWS_UPSTREAM_MODE = 'api'",
 "merged.SUREBET_RUNTIME_MODE = 'paper'",
 "merged.SUREBET_PROVIDER_CONNECTIONS = 'disabled'",
 "merged.SUREBET_EXECUTION_ENABLED = 'false'",
 "readProcessValue(key, merged) === undefined && fileEnvironment.has(key)",
 "'BWS_PRIVATE_PAPER_SCHEDULE_PATH'",
 "'BWS_PINNED_EXPORT_PATH'",
 "'BWS_UPSTREAM_EXPORT_FILE'",
 "'BWS_UPSTREAM_EXPORT_PATH'",
 "'BWS_UPSTREAM_EXPORT_SELECTION_PATH'",
 "'SUREBET_PINNED_BUNDLE'",
]:
 if marker not in wrapper: errors.append(f'scripts/bws-root-wrapper-runtime.mjs: missing {marker}')

env_template=(ROOT/'config/bws.private.env.template').read_text(encoding='utf-8')
if 'BWS_PRIVATE_PAPER_SCHEDULE_PATH=runtime/operator-inputs/bws.private-paper-schedule.json' not in env_template:
 errors.append('config/bws.private.env.template: missing operator-approved private-paper schedule path')

for marker in ['POSTGRES_ADDRESS=127.0.0.1:5432', 'POSTGRES_USER=betting_win', 'POSTGRES_PASSWORD=replace_me', 'POSTGRES_DB=betting_win_surebet']:
 if marker not in env_template:
  errors.append(f'config/bws.private.env.template: missing canonical database marker {marker}')
for marker in ['DB_URL=', 'DB_URL_TEST=', 'SUREBET_PG_DATABASE=', 'SUREBET_PG_USER=', 'SUREBET_PG_HOST=']:
 if marker in env_template:
  errors.append(f'config/bws.private.env.template: contains retired database marker {marker}')

if '/runtime/' not in (ROOT/'.gitignore').read_text(encoding='utf-8'):
 errors.append('.gitignore: runtime output and operator inputs must be ignored')
for rel in [
 'packages/bootstrap/src/cli/bws-operator-lifecycle.ts',
 'packages/bootstrap/src/cli/bws-paper-runtime-evidence.ts',
]:
 if 'BWS_PRIVATE_PAPER_SCHEDULE_PATH' not in (ROOT/rel).read_text(encoding='utf-8'):
  errors.append(f'{rel}: missing private-paper schedule requirement')
paper=(ROOT/'run-paper-evaluation.sh').read_text(encoding='utf-8')
for marker in ['scripts/bws-root-wrapper-runtime.mjs', 'paper-runtime-evidence', 'runtime_environment_loader=selective_root_wrapper_env', 'runtime_schedule_loader=operator_approved_repo_local_manifest']:
 if marker not in paper: errors.append(f'run-paper-evaluation.sh: missing {marker}')

for rel in [
 'packages/bootstrap/src/cli/bws-upstream-api-convergence.ts',
 'packages/bootstrap/src/cli/bws-upstream-convergence-service.ts',
 'packages/bootstrap/src/cli/bws-private-paper-scheduler.ts',
 'packages/bootstrap/src/cli/bws-private-paper-scheduler-service.ts',
 'packages/bootstrap/src/cli/bws-read-only-api.ts',
 'packages/bootstrap/src/cli/bws-private-paper-worker.ts',
 'packages/bootstrap/src/cli/bws-private-paper-worker-service.ts',
 'packages/bootstrap/src/cli/bws-paper-runtime-handoff.ts',
 'packages/bootstrap/src/cli/bws-observability.ts',
 'packages/bootstrap/src/cli/bws-operator-lifecycle.ts',
 'packages/bootstrap/src/cli/bws-paper-runtime-evidence.ts',
 'packages/bootstrap/src/cli/bws-external-runtime-preflight.ts',
 'packages/bootstrap/src/cli/bws-soak-campaign.ts',
]:
 text=(ROOT/rel).read_text(encoding='utf-8')
 if 'enforceBwsApiOnlyProcessEnvironment' not in text:
  errors.append(f'{rel}: missing API-only process boundary')
paper_runtime=(ROOT/'packages/bootstrap/src/operations/paper-runtime-evidence.ts').read_text(encoding='utf-8')
for marker in [
 'PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE',
 'BWS_UPSTREAM_API_BASE_URL',
 "probePath: PAPER_RUNTIME_UPSTREAM_PROBE_PATH",
 "'upstream_api_preflight'",
 "must not target the local BWS API",
]:
 if marker not in paper_runtime:
  errors.append(f'packages/bootstrap/src/operations/paper-runtime-evidence.ts: missing {marker}')
external_preflight=(ROOT/'packages/bootstrap/src/operations/external-runtime-preflight.ts').read_text(encoding='utf-8')
for marker in [
 "selectedInput.apiBaseUrl",
 "readonly apiContractPath: string",
 "normalizeContractPath(input.apiContractPath)",
 "must stay on an explicit loopback host",
 "must not target the local BWS API",
]:
 if marker not in external_preflight:
  errors.append(f'packages/bootstrap/src/operations/external-runtime-preflight.ts: missing {marker}')
if "input.apiContractPath === undefined" in external_preflight or "? '/contract'" in external_preflight:
 errors.append('packages/bootstrap/src/operations/external-runtime-preflight.ts: API contract path must not silently default to /contract')
external_preflight_cli=(ROOT/'packages/bootstrap/src/cli/bws-external-runtime-preflight.ts').read_text(encoding='utf-8')
for marker in [
 "apiContractPath: requireFlagValue(options, '--api-contract-path')",
 "--api-contract-path </contract>",
]:
 if marker not in external_preflight_cli:
  errors.append(f'packages/bootstrap/src/cli/bws-external-runtime-preflight.ts: missing {marker}')
if "[--api-contract-path" in external_preflight_cli:
 errors.append('packages/bootstrap/src/cli/bws-external-runtime-preflight.ts: --api-contract-path must not be documented as optional')
external_preflight_schema=(ROOT/'schemas/bws-external-runtime-campaign.v1.schema.json').read_text(encoding='utf-8')
for marker in [
 '"apiContractPath"',
 '"pattern": "^/(?!/)[^?#\\\\\\\\]*$"',
]:
 if marker not in external_preflight_schema:
  errors.append(f'schemas/bws-external-runtime-campaign.v1.schema.json: missing {marker}')
retired=(ROOT/'packages/bootstrap/src/cli/bws-upstream-export-convergence.ts').read_text(encoding='utf-8')
if 'export runtime has been removed' not in retired:
 errors.append('retired export CLI does not fail closed')
barrel=(ROOT/'packages/bootstrap/src/index.ts').read_text(encoding='utf-8')
if "./cli/bws-upstream-export-convergence.js" in barrel:
 errors.append('bootstrap public barrel still exposes export CLI')
if "./operations/upstream-export-convergence.js" in barrel:
 errors.append('bootstrap public barrel still exposes export convergence operation')
compatibility=(ROOT/'src/operations/upstream-export-convergence.ts').read_text(encoding='utf-8')
if 'export * from' in compatibility or 'upstream-export-convergence.js' in compatibility:
 errors.append('compatibility operation shim still re-exports active export convergence implementation')
if 'export runtime has been removed' not in compatibility:
 errors.append('compatibility operation shim does not fail closed')
for rel in [
 'packages/bootstrap/src/operations/upstream-api-convergence.ts',
 'packages/bootstrap/src/operations/upstream-convergence-service.ts',
]:
 text=(ROOT/rel).read_text(encoding='utf-8')
 if "from './upstream-export-convergence.js'" in text:
  errors.append(f'{rel}: API-only code imports retired export convergence implementation')

release_api_tuple=[
 'BWS_UPSTREAM_API_CHECKPOINT_ID',
 'BWS_UPSTREAM_API_BASE_URL',
 'BWS_UPSTREAM_API_CONTRACT_VERSION',
 'BWS_UPSTREAM_API_PAGE_SIZE',
 'BWS_UPSTREAM_API_MAX_PAGES_PER_RESOURCE',
 'BWS_UPSTREAM_API_RETRY_LIMIT',
 'BWS_UPSTREAM_API_RETRY_BACKOFF_MS',
 'BWS_UPSTREAM_API_TIMEOUT_MS',
]
for rel in [
 'packages/bootstrap/src/operations/release-packaging.ts',
 'packages/bootstrap/src/operations/release-upgrade.ts',
]:
 text=(ROOT/rel).read_text(encoding='utf-8')
 if "'api' | 'export'" in text or 'api or export' in text:
  errors.append(f'{rel}: release boundary still accepts api/export upstream mode union')
 if 'BWS_UPSTREAM_MODE=api' not in text:
  errors.append(f'{rel}: missing explicit API-only mode rejection message')
 if 'BWS_UPSTREAM_EXPORT_SELECTION_PATH' in text and 'forbid' not in text.lower():
  errors.append(f'{rel}: retired export selector is referenced without fail-closed rejection')
 for marker in release_api_tuple:
  if marker not in text:
   errors.append(f'{rel}: missing required API tuple marker {marker}')

final_acceptance=(ROOT/'packages/bootstrap/src/operations/final-local-acceptance.ts').read_text(encoding='utf-8')
if "'api' | 'export'" in final_acceptance or 'both api and export' in final_acceptance:
 errors.append('packages/bootstrap/src/operations/final-local-acceptance.ts: final acceptance still requires export runtime evidence')
if 'selectedUpstreamMode=api' not in final_acceptance:
 errors.append('packages/bootstrap/src/operations/final-local-acceptance.ts: missing API-only runtime evidence rejection')

for rel in [
 'tests/bws-release-packaging.test.ts',
 'tests/bws-release-upgrade.test.ts',
 'tests/bws-final-local-acceptance.test.ts',
]:
 text=(ROOT/rel).read_text(encoding='utf-8')
 fixture_text=text
 if rel == 'tests/bws-release-upgrade.test.ts':
  fixture_text=text.split('function writeEnvironmentFile(',1)[1].split('function createCaptureStream',1)[0]
 elif rel in {'tests/bws-release-packaging.test.ts','tests/bws-final-local-acceptance.test.ts'}:
  fixture_text=text.split('function writePrivateEnvironmentFile(',1)[1].split('function writeJsonFile',1)[0]
 for retired in [
  'BWS_UPSTREAM_MODE=export',
  'BWS_UPSTREAM_EXPORT_SELECTION_PATH=/operator/input/export-selection.json',
 ]:
  if retired in fixture_text:
   errors.append(f'{rel}: release/operator fixture still contains retired export input {retired}')
 for marker in release_api_tuple:
  if marker not in fixture_text:
   errors.append(f'{rel}: release/operator fixture missing required API tuple marker {marker}')


api_doc=(ROOT/'docs/automation/api-only-upstream.md').read_text(encoding='utf-8')
for marker in ['fail-fast blocker before BWS enters a long runtime-evidence observation window', '127.0.0.1:4312', 'not upstream evidence']:
 if marker not in api_doc:
  errors.append(f'docs/automation/api-only-upstream.md: missing {marker}')
for rel,markers in {
 'docs/automation/paper-autopilot.md': ['only after the upstream betting-win read-only API preflight succeeds', '127.0.0.1:4312', 'PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE'],
 'docs/041_external_runtime_preflight_and_bws600_campaign.md': ['post_source_fix_controller=run-paper-autopilot.sh', 'bws_local_api_4312_does_not_satisfy_upstream_preflight=true', 'BWS must fail fast if the upstream betting-win read-only API is unavailable before starting the long runtime-evidence observation window'],
}.items():
 text=(ROOT/rel).read_text(encoding='utf-8')
 for marker in markers:
  if marker not in text:
   errors.append(f'{rel}: missing {marker}')

if errors:
 print('API_ONLY_UPSTREAM_CONTRACT_FAILED',file=sys.stderr)
 for e in errors: print('ERROR: '+e,file=sys.stderr)
 raise SystemExit(1)
print('API_ONLY_UPSTREAM_CONTRACT_OK')
print('upstream_mode=api')
print('operator_export_runtime=absent')
