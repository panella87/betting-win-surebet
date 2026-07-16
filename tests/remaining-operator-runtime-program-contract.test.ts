import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('remaining operator runtime program documents every safe local stage through BWS-599', () => {
  const program = read('docs/034_remaining_operator_runtime_implementation_program.md');
  for (const marker of [
    'current_task=BWS-590', 'safe_local_terminal_gate=BWS-599',
    'paper evaluation=runtime_evidence_mode_validated',
    'BWS-581', 'BWS-585', 'BWS-586', 'BWS-589', 'BWS-593', 'BWS-599',
  ]) assert.match(program, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  for (const rel of [
    'docs/035_continuous_service_supervisor_contract.md',
    'docs/036_root_wrappers_and_paper_automation_integration.md',
    'docs/037_database_backup_retention_and_recovery.md',
    'docs/038_observability_metrics_and_evidence_contract.md',
    'docs/039_release_deployment_and_upgrade_contract.md',
    'docs/040_soak_failure_injection_and_operator_acceptance.md',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md',
  ]) assert.ok(read(rel).length > 100, `${rel} should contain a substantive contract`);
});

test('remaining operator runtime validator passes', () => {
  const output = execFileSync('python3', ['scripts/validate_remaining_operator_runtime_program.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_remaining_operator_runtime_program: ok/);
});
