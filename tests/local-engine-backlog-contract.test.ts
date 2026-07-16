import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('historical local-engine ledger is bootstrap evidence while operator-runtime work remains active', () => {
  const historical = read('docs/015_local_engine_implementation_backlog.md');
  assert.match(historical, /status=SUPERSEDED_BOOTSTRAP_LEDGER/);
  assert.match(historical, /legacy_stage=SURE-002A_LOCAL_INTERFACE_AND_ENGINE_BOOTSTRAP/);
  assert.match(historical, /active_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1/);
  assert.match(historical, /bootstrap, not the complete application/);
  assert.match(read('README.md'), /packages\/bootstrap/);
  assert.match(read('docs/repo_status_current.md'), /BWS-580/);
  assert.match(read('docs/repo_status_current.md'), /BWS-581/);
  assert.match(read('docs/repo_status_current.md'), /BWS-599/);
});
