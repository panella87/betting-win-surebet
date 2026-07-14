import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BETTING_WIN_EXPORT_BUNDLE_SCHEMA as packageExportBundleSchema,
  buildReadOnlyQueryContractRequest as packageQueryRequest,
  checkQuoteFreshness as packageCheckQuoteFreshness,
  consumeStandardBinarySettlementReplay as packageConsumeSettlementReplay,
  createPrivateRunReport as packageCreatePrivateRunReport,
  readLocalBettingWinExportBundle as packageReadLocalBundle,
  solveStandardBinaryStakeVector as packageSolveStakeVector,
  validateStandardBinaryCompleteSet as packageValidateCompleteSet,
} from '../packages/bootstrap/src/index.js';
import {
  applySurebetMigrations as packageApplySurebetMigrations,
  resolveSurebetPersistenceConfig as packageResolveSurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import { generateBettingWinUpstreamLock as packageGenerateUpstreamLock } from '../packages/upstream/src/index.js';
import { BETTING_WIN_EXPORT_BUNDLE_SCHEMA as legacyExportBundleSchema } from '../src/adapters/betting-win-export-reader.js';
import { readLocalBettingWinExportBundle as legacyReadLocalBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { applySurebetMigrations as legacyApplySurebetMigrations, resolveSurebetPersistenceConfig as legacyResolveSurebetPersistenceConfig } from '../src/persistence/surebet-persistence.js';
import { buildReadOnlyQueryContractRequest as legacyQueryRequest } from '../src/adapters/betting-win-query-client.js';
import { checkQuoteFreshness as legacyCheckQuoteFreshness } from '../src/quotes/quote-freshness.js';
import { createPrivateRunReport as legacyCreatePrivateRunReport } from '../src/reporting/private-run-report.js';
import { validateStandardBinaryCompleteSet as legacyValidateCompleteSet } from '../src/scenarios/complete-set.js';
import { consumeStandardBinarySettlementReplay as legacyConsumeSettlementReplay } from '../src/simulation/settlement-replay.js';
import { solveStandardBinaryStakeVector as legacySolveStakeVector } from '../src/solver/stake-vector.js';
import { generateBettingWinUpstreamLock as legacyGenerateUpstreamLock } from '../src/upstream/betting-win-upstream-lock.js';

const ROOT = process.cwd();

test('root workspace metadata and migrated package manifests remain wired for BWS-110', () => {
  const rootPackage = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8')) as {
    readonly workspaces?: readonly string[];
  };
  const bootstrapPackage = JSON.parse(readFileSync(resolve(ROOT, 'packages/bootstrap/package.json'), 'utf-8')) as {
    readonly name?: string;
  };
  const upstreamPackage = JSON.parse(readFileSync(resolve(ROOT, 'packages/upstream/package.json'), 'utf-8')) as {
    readonly name?: string;
  };
  const persistencePackage = JSON.parse(readFileSync(resolve(ROOT, 'packages/persistence/package.json'), 'utf-8')) as {
    readonly name?: string;
  };

  assert.deepEqual(rootPackage.workspaces, ['packages/*', 'apps/*']);
  assert.equal(bootstrapPackage.name, '@betting-win-surebet/bootstrap');
  assert.equal(upstreamPackage.name, '@betting-win-surebet/upstream');
  assert.equal(persistencePackage.name, '@betting-win-surebet/persistence');
});

test('legacy src shims preserve the migrated workspace implementation surface', () => {
  assert.equal(legacyExportBundleSchema, packageExportBundleSchema);
  assert.equal(legacyReadLocalBundle, packageReadLocalBundle);
  assert.equal(legacyQueryRequest, packageQueryRequest);
  assert.equal(legacyValidateCompleteSet, packageValidateCompleteSet);
  assert.equal(legacyCheckQuoteFreshness, packageCheckQuoteFreshness);
  assert.equal(legacySolveStakeVector, packageSolveStakeVector);
  assert.equal(legacyConsumeSettlementReplay, packageConsumeSettlementReplay);
  assert.equal(legacyCreatePrivateRunReport, packageCreatePrivateRunReport);
  assert.equal(legacyGenerateUpstreamLock, packageGenerateUpstreamLock);
  assert.equal(legacyApplySurebetMigrations, packageApplySurebetMigrations);
  assert.equal(legacyResolveSurebetPersistenceConfig, packageResolveSurebetPersistenceConfig);
});
