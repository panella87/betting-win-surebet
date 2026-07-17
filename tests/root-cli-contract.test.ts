import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

test('root CLI exposes soak, external preflight, and final acceptance commands through the repo entrypoint', () => {
  const cliSource = readFileSync(join(REPO_ROOT, 'cli.js'), 'utf-8');

  assert.match(cliSource, /const SOAK_CAMPAIGN_DIST_ENTRY = 'dist\/packages\/bootstrap\/src\/cli\/bws-soak-campaign\.js';/);
  assert.match(
    cliSource,
    /const EXTERNAL_RUNTIME_PREFLIGHT_DIST_ENTRY = 'dist\/packages\/bootstrap\/src\/cli\/bws-external-runtime-preflight\.js';/,
  );
  assert.match(
    cliSource,
    /const FINAL_LOCAL_ACCEPTANCE_DIST_ENTRY = 'dist\/packages\/bootstrap\/src\/cli\/bws-final-local-acceptance\.js';/,
  );
  assert.match(cliSource, /soak-campaign\s+Build and run the BWS-592 soak campaign CLI/);
  assert.match(
    cliSource,
    /external-runtime-preflight\s+Build and run the BWS-593 external runtime preflight CLI/,
  );
  assert.match(
    cliSource,
    /final-local-acceptance\s+Build and run the staged BWS-599 final local acceptance CLI/,
  );
  assert.match(cliSource, /if \(command === 'soak-campaign'\) \{/);
  assert.match(cliSource, /runBuiltEntry\(SOAK_CAMPAIGN_DIST_ENTRY, process\.argv\.slice\(3\)\);/);
  assert.match(cliSource, /if \(command === 'external-runtime-preflight'\) \{/);
  assert.match(cliSource, /runBuiltEntry\(EXTERNAL_RUNTIME_PREFLIGHT_DIST_ENTRY, process\.argv\.slice\(3\)\);/);
  assert.match(cliSource, /if \(command === 'final-local-acceptance'\) \{/);
  assert.match(cliSource, /runBuiltEntry\(FINAL_LOCAL_ACCEPTANCE_DIST_ENTRY, process\.argv\.slice\(3\)\);/);
});

test('root CLI help reflects the full-stack lifecycle boundary', () => {
  const cliSource = readFileSync(join(REPO_ROOT, 'cli.js'), 'utf-8');

  assert.match(cliSource, /runtime-start\s+Build and start the repo-owned full BWS stack lifecycle/);
  assert.match(cliSource, /runtime-status\s+Build and print machine-readable full-stack BWS lifecycle status and evidence/);
  assert.match(cliSource, /runtime-stop\s+Build and stop the repo-owned full BWS stack lifecycle/);
});
