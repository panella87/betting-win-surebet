import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BETTING_WIN_EXPORT_BUNDLE_SCHEMA as packageExportBundleSchema,
  buildReadOnlyQueryContractRequest as packageQueryRequest,
  createReadOnlyQueryApiClient as packageCreateQueryClient,
  checkQuoteFreshness as packageCheckQuoteFreshness,
  consumeStandardBinarySettlementReplay as packageConsumeSettlementReplay,
  deriveStandardBinaryOpportunityCandidates as packageDeriveOpportunityCandidates,
  createPrivateRunReport as packageCreatePrivateRunReport,
  describeReadOnlyQueryApiClientBoundary as packageDescribeQueryClientBoundary,
  readLocalBettingWinExportBundle as packageReadLocalBundle,
  runBoundedPrivatePaperRuntimeCycle as packageRunPrivatePaperRuntimeCycle,
  runDeterministicStandardBinaryBacktest as packageRunBacktest,
  simulateNonAtomicPaperGroupCompletion as packageSimulateCompletion,
  solveStandardBinaryStakeVector as packageSolveStakeVector,
  buildStandardBinaryStakeVectorInput as packageBuildStakeVectorInput,
  validateStandardBinaryCompleteSet as packageValidateCompleteSet,
  validatePinnedBettingWinStrategyExportIntake as packageValidateStrategyExportIntake,
} from '../packages/bootstrap/src/index.js';
import {
  applySurebetMigrations as packageApplySurebetMigrations,
  resolveSurebetPersistenceConfig as packageResolveSurebetPersistenceConfig,
} from '../packages/persistence/src/index.js';
import { generateBettingWinUpstreamLock as packageGenerateUpstreamLock } from '../packages/upstream/src/index.js';
import { BETTING_WIN_EXPORT_BUNDLE_SCHEMA as legacyExportBundleSchema } from '../src/adapters/betting-win-export-reader.js';
import { readLocalBettingWinExportBundle as legacyReadLocalBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { applySurebetMigrations as legacyApplySurebetMigrations, resolveSurebetPersistenceConfig as legacyResolveSurebetPersistenceConfig } from '../src/persistence/surebet-persistence.js';
import {
  buildReadOnlyQueryContractRequest as legacyQueryRequest,
  createReadOnlyQueryApiClient as legacyCreateQueryClient,
  describeReadOnlyQueryApiClientBoundary as legacyDescribeQueryClientBoundary,
} from '../src/adapters/betting-win-query-client.js';
import { validatePinnedBettingWinStrategyExportIntake as legacyValidateStrategyExportIntake } from '../src/adapters/betting-win-strategy-export-intake.js';
import { runDeterministicStandardBinaryBacktest as legacyRunBacktest } from '../src/backtest/standard-binary-backtest.js';
import { checkQuoteFreshness as legacyCheckQuoteFreshness } from '../src/quotes/quote-freshness.js';
import { createPrivateRunReport as legacyCreatePrivateRunReport } from '../src/reporting/private-run-report.js';
import { deriveStandardBinaryOpportunityCandidates as legacyDeriveOpportunityCandidates } from '../src/opportunity/standard-binary-derivation.js';
import { buildStandardBinaryStakeVectorInput as legacyBuildStakeVectorInput } from '../src/opportunity/standard-binary-stake-solver.js';
import { runBoundedPrivatePaperRuntimeCycle as legacyRunPrivatePaperRuntimeCycle } from '../src/runtime/private-paper-runtime.js';
import { validateStandardBinaryCompleteSet as legacyValidateCompleteSet } from '../src/scenarios/complete-set.js';
import { simulateNonAtomicPaperGroupCompletion as legacySimulateCompletion } from '../src/simulation/non-atomic-completion.js';
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
  assert.equal(legacyCreateQueryClient, packageCreateQueryClient);
  assert.equal(legacyDescribeQueryClientBoundary, packageDescribeQueryClientBoundary);
  assert.equal(legacyValidateStrategyExportIntake, packageValidateStrategyExportIntake);
  assert.equal(legacyValidateCompleteSet, packageValidateCompleteSet);
  assert.equal(legacyDeriveOpportunityCandidates, packageDeriveOpportunityCandidates);
  assert.equal(legacyBuildStakeVectorInput, packageBuildStakeVectorInput);
  assert.equal(legacyCheckQuoteFreshness, packageCheckQuoteFreshness);
  assert.equal(legacySolveStakeVector, packageSolveStakeVector);
  assert.equal(legacySimulateCompletion, packageSimulateCompletion);
  assert.equal(legacyConsumeSettlementReplay, packageConsumeSettlementReplay);
  assert.equal(legacyRunBacktest, packageRunBacktest);
  assert.equal(legacyRunPrivatePaperRuntimeCycle, packageRunPrivatePaperRuntimeCycle);
  assert.equal(legacyCreatePrivateRunReport, packageCreatePrivateRunReport);
  assert.equal(legacyGenerateUpstreamLock, packageGenerateUpstreamLock);
  assert.equal(legacyApplySurebetMigrations, packageApplySurebetMigrations);
  assert.equal(legacyResolveSurebetPersistenceConfig, packageResolveSurebetPersistenceConfig);
});
