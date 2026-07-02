import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const RUNNER = join(REPO_ROOT, 'run-autonomous-implementation.sh');
const CONTRACT_DOC = join(REPO_ROOT, 'docs', 'autonomous_loop_contract.md');
const STATUS_DOC = join(REPO_ROOT, 'docs', '013_autonomous_controller_status_contract.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

function extractRequiredCycleArtifacts(text: string): string[] {
  const match = text.match(/REQUIRED_CYCLE_ARTIFACTS=\(([\s\S]*?)\n\)/);
  assert.ok(match, 'missing REQUIRED_CYCLE_ARTIFACTS array');
  const body = match[1];
  assert.ok(body !== undefined, 'missing REQUIRED_CYCLE_ARTIFACTS body');

  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function assertOrdered(text: string, earlier: string, later: string): void {
  const earlierIndex = text.indexOf(earlier);
  const laterIndex = text.indexOf(later);

  assert.notStrictEqual(earlierIndex, -1, `missing marker: ${earlier}`);
  assert.notStrictEqual(laterIndex, -1, `missing marker: ${later}`);
  assert.ok(earlierIndex < laterIndex, `${earlier} must appear before ${later}`);
}

test('autonomous controller rejects malformed request flags before continue status acceptance', () => {
  const script = read(RUNNER);

  assert.match(script, /request_flags\.txt must contain exactly two lines:/);
  assert.match(script, /SERVICE_REFRESH_REQUIRED=no/);
  assert.match(script, /RUNTIME_EVIDENCE_REQUIRED=no/);
  assert.match(script, /read_request_flags\(\)/);
  assert.match(script, /request_flags_must_have_exactly_two_lines/);
  assert.match(script, /unexpected_request_flags/);
  assert.match(script, /STOP_REASON="invalid_request_flags"/);

  assertOrdered(script, 'if [[ "$validation_rc" -ne 0 ]]', 'if ! read_request_flags "$cycle_dir"; then');
  assertOrdered(script, 'if ! read_request_flags "$cycle_dir"; then', 'if ! status_line="$(read_continue_status "$cycle_dir")"; then');
});

test('autonomous controller docs record the strict request flags machine contract', () => {
  const contractDoc = read(CONTRACT_DOC);
  const statusDoc = read(STATUS_DOC);

  for (const text of [contractDoc, statusDoc]) {
    assert.match(text, /request_flags\.txt/);
    assert.match(text, /exactly two lines/);
    assert.match(text, /SERVICE_REFRESH_REQUIRED=no/);
    assert.match(text, /RUNTIME_EVIDENCE_REQUIRED=no/);
    assert.match(text, /fail closed/i);
  }
});

test('autonomous controller rejects placeholder cycle artifacts before status acceptance', () => {
  const script = read(RUNNER);

  assert.match(script, /REQUIRED_CYCLE_ARTIFACTS=\(/);
  assert.match(script, /validate_cycle_artifacts\(\)/);
  assert.match(script, /invalid_cycle_artifacts\.txt/);
  assert.match(script, /placeholder_cycle_artifact=/);
  assert.match(script, /empty_required_cycle_artifact=/);
  assert.match(script, /STOP_REASON="invalid_cycle_artifacts"/);

  assertOrdered(script, 'if [[ "$validation_rc" -ne 0 ]]', 'if ! validate_cycle_artifacts "$cycle_dir"; then');
  assertOrdered(script, 'if ! validate_cycle_artifacts "$cycle_dir"; then', 'if ! read_request_flags "$cycle_dir"; then');
  assertOrdered(script, 'if ! validate_cycle_artifacts "$cycle_dir"; then', 'if ! status_line="$(read_continue_status "$cycle_dir")"; then');
});

test('autonomous controller required cycle artifacts stay unique', () => {
  const script = read(RUNNER);
  const artifacts = extractRequiredCycleArtifacts(script);
  const duplicates = artifacts.filter((artifact, index) => artifacts.indexOf(artifact) !== index);

  assert.deepEqual(duplicates, []);
});

test('autonomous controller docs record required report artifact quality', () => {
  const contractDoc = read(CONTRACT_DOC);
  const statusDoc = read(STATUS_DOC);

  for (const text of [contractDoc, statusDoc]) {
    assert.match(text, /required cycle report/i);
    assert.match(text, /placeholder/i);
    assert.match(text, /fail closed|BLOCKED=yes/i);
  }
});
