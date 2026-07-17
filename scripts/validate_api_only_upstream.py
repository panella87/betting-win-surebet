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

if errors:
 print('API_ONLY_UPSTREAM_CONTRACT_FAILED',file=sys.stderr)
 for e in errors: print('ERROR: '+e,file=sys.stderr)
 raise SystemExit(1)
print('API_ONLY_UPSTREAM_CONTRACT_OK')
print('upstream_mode=api')
print('operator_export_runtime=absent')
