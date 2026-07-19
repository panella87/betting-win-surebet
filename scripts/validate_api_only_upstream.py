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
 'packages/bootstrap/src/cli/bws-operator-lifecycle.ts',
 'packages/bootstrap/src/cli/bws-paper-runtime-evidence.ts',
 'packages/bootstrap/src/cli/bws-external-runtime-preflight.ts',
 'packages/bootstrap/src/cli/bws-soak-campaign.ts',
]:
 text=(ROOT/rel).read_text(encoding='utf-8')
 if 'enforceBwsApiOnlyProcessEnvironment' not in text:
  errors.append(f'{rel}: missing API-only process boundary')
retired=(ROOT/'packages/bootstrap/src/cli/bws-upstream-export-convergence.ts').read_text(encoding='utf-8')
if 'export runtime has been removed' not in retired:
 errors.append('retired export CLI does not fail closed')
barrel=(ROOT/'packages/bootstrap/src/index.ts').read_text(encoding='utf-8')
if "./cli/bws-upstream-export-convergence.js" in barrel:
 errors.append('bootstrap public barrel still exposes export CLI')


api_doc=(ROOT/'docs/automation/api-only-upstream.md').read_text(encoding='utf-8')
for marker in ['fail-fast blocker before BWS enters a long runtime-evidence observation window', '127.0.0.1:4312', 'not upstream evidence']:
 if marker not in api_doc:
  errors.append(f'docs/automation/api-only-upstream.md: missing {marker}')

if errors:
 print('API_ONLY_UPSTREAM_CONTRACT_FAILED',file=sys.stderr)
 for e in errors: print('ERROR: '+e,file=sys.stderr)
 raise SystemExit(1)
print('API_ONLY_UPSTREAM_CONTRACT_OK')
print('upstream_mode=api')
print('operator_export_runtime=absent')
