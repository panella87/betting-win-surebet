import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');

test('upstream baseline is design evidence and runtime pin remains uncommitted until BWS-100', () => {
  const baseline = JSON.parse(read('config/betting-win.upstream-baseline.json')) as Record<string, unknown>;
  const family = baseline.contractFamily as Record<string, unknown>;
  assert.equal((baseline.source as Record<string, unknown>).archiveSha256, '9a9eee490918ff69182acdaa302d216859a5009b0943adb41e56171c1ee9ef8f');
  assert.equal(family.schema, 'betting-win.strategy-export.v1');
  assert.equal(family.canonicalAlias, 'betting-win-strategy-export.v1');
  assert.equal(family.surebetProfile, 'surebet_standard_binary_v0');
  assert.equal(existsSync(join(ROOT, 'config/betting-win.upstream.lock.json')), false);
});

test('upstream lock schema fails closed on commit, Git tree fingerprint and contract identity', () => {
  const schema = JSON.parse(read('schemas/betting-win-upstream-lock.v1.schema.json')) as Record<string, unknown>;
  const properties = schema.properties as Record<string, Record<string, unknown>>;
  assert.equal(schema.additionalProperties, false);
  assert.equal(properties.commitSha!.pattern, '^[0-9a-f]{40}$');
  assert.equal(properties.gitTreeSha!.pattern, '^[0-9a-f]{40}$');
  assert.equal(properties.trackedTreeListingSha256!.pattern, '^[0-9a-f]{64}$');
  assert.equal(properties.sourceFingerprintAlgorithm!.const, 'sha256_git_ls_tree_r_full_tree_head_v1');
  assert.equal(properties.contractSchema!.const, 'betting-win.strategy-export.v1');
  assert.equal(properties.surebetProfile!.const, 'surebet_standard_binary_v0');
});

test('betting-win upstream contract validator passes the repository contract', () => {
  const output = execFileSync('python3', ['scripts/validate_betting_win_upstream_contract.py'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  assert.match(output, /validate_betting_win_upstream_contract: ok/);
});
