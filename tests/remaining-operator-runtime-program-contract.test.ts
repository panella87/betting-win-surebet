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
    'current_task=BWS-599', 'safe_local_terminal_gate=BWS-599',
    'paper evaluation=runtime_evidence_mode_validated',
    'backlog/bws_remaining_safe_local_map.csv',
    'BWS-581', 'BWS-589', 'BWS-590', 'BWS-593', 'BWS-599',
  ]) assert.match(program, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  for (const rel of [
    'docs/035_continuous_service_supervisor_contract.md',
    'docs/036_root_wrappers_and_paper_automation_integration.md',
    'docs/037_database_backup_retention_and_recovery.md',
    'docs/038_observability_metrics_and_evidence_contract.md',
    'docs/039_release_deployment_and_upgrade_contract.md',
    'docs/040_soak_failure_injection_and_operator_acceptance.md',
    'docs/041_external_runtime_preflight_and_bws600_campaign.md',
    'docs/042_release_packaging_implementation_blueprint.md',
    'docs/043_upgrade_rollback_recovery_implementation_blueprint.md',
    'docs/044_soak_failure_injection_implementation_blueprint.md',
    'docs/045_external_runtime_preflight_implementation_blueprint.md',
    'docs/046_final_local_acceptance_implementation_blueprint.md',
    'decisions/ADR-0006-full-stack-runtime-and-automation-boundary.md',
  ]) assert.ok(read(rel).length > 100, `${rel} should contain a substantive contract`);

  const map = read('backlog/bws_remaining_safe_local_map.csv');
  for (const marker of ['BWS-592-A', 'BWS-592-C', 'BWS-593-C', 'BWS-599-A', 'BWS-599-D']) {
    assert.match(map, new RegExp(marker));
  }
});

test('remaining operator runtime validator passes', () => {
  const output = execFileSync('python3', ['scripts/validate_remaining_operator_runtime_program.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_remaining_operator_runtime_program: ok/);
});
