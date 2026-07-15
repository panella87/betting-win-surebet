import { createHash } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validatePinnedBettingWinStrategyExportIntake } from '../src/adapters/betting-win-strategy-export-intake.js';
import type { BettingWinUpstreamLock } from '../packages/upstream/src/upstream/betting-win-upstream-lock.js';

const REPO_ROOT = process.cwd();
const TEST_TIMESTAMP = '2026-07-14T10:00:00.000Z';

test('pinned strategy export intake accepts a hashed immutable export that matches the upstream contract', () => {
  const tempDir = createTempDir('strategy-export-ok-');

  try {
    const exportDocument = createStrategyExportDocument();
    const exportPath = join(tempDir, 'valid-export.json');
    const sourceSha256 = writeJsonAndHash(exportPath, exportDocument);
    const result = validatePinnedBettingWinStrategyExportIntake({
      exportPath,
      expectedSha256: sourceSha256,
      repositoryRoot: REPO_ROOT,
      upstreamLock: sampleUpstreamLock(),
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.contractSchema, 'betting-win.strategy-export.v1');
    assert.equal(result.value.contractAlias, 'betting-win-strategy-export.v1');
    assert.equal(result.value.surebetProfile, 'surebet_standard_binary_v0');
    assert.equal(result.value.sourceSha256, sourceSha256);
    assert.deepEqual(result.value.providerGenerationIds, ['generation-id-001']);
    assert.deepEqual(result.value.sourceLineageRecordIds, ['record-001']);
    assert.deepEqual(result.value.normalizedEvidenceIds, ['normalized-001']);
    assert.equal(result.value.rawObservationCount, 1);
    assert.equal(Object.isFrozen(result.value.providerGenerationIds), true);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('pinned strategy export intake fails closed on SHA and upstream alias mismatches', () => {
  const tempDir = createTempDir('strategy-export-sha-');

  try {
    const exportDocument = createStrategyExportDocument();
    const exportPath = join(tempDir, 'valid-export.json');
    const sourceSha256 = writeJsonAndHash(exportPath, exportDocument);

    const wrongSha = validatePinnedBettingWinStrategyExportIntake({
      exportPath,
      expectedSha256: 'f'.repeat(64),
      repositoryRoot: REPO_ROOT,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(wrongSha.ok, false);
    assert.equal(wrongSha.blockers[0]?.code, 'PINNED_STRATEGY_EXPORT_SHA256_MISMATCH');

    const aliasMismatchLock = sampleUpstreamLock({ contractAlias: 'wrong.alias' as never });
    const aliasMismatch = validatePinnedBettingWinStrategyExportIntake({
      exportPath,
      expectedSha256: sourceSha256,
      repositoryRoot: REPO_ROOT,
      upstreamLock: aliasMismatchLock,
    });
    assert.equal(aliasMismatch.ok, false);
    assert.equal(aliasMismatch.blockers[0]?.code, 'PINNED_STRATEGY_EXPORT_ALIAS_MISMATCH');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('pinned strategy export intake rejects generation and lineage mismatches', () => {
  const tempDir = createTempDir('strategy-export-mismatch-');

  try {
    const generationMismatchPath = join(tempDir, 'generation-mismatch.json');
    const generationMismatch = createStrategyExportDocument({ providerGenerationIds: ['other-generation-id'] });
    const generationMismatchSha256 = writeJsonAndHash(generationMismatchPath, generationMismatch);
    const generationResult = validatePinnedBettingWinStrategyExportIntake({
      exportPath: generationMismatchPath,
      expectedSha256: generationMismatchSha256,
      repositoryRoot: REPO_ROOT,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(generationResult.ok, false);
    assert.equal(generationResult.blockers[0]?.code, 'PINNED_STRATEGY_EXPORT_PROVIDER_GENERATION_MISMATCH');

    const lineageMismatchPath = join(tempDir, 'lineage-mismatch.json');
    const basePayload = createStrategyExportPayload();
    const lineageMismatch = createStrategyExportDocument({
      payload: {
        ...basePayload,
        quoteStore: {
          ...(basePayload.quoteStore as Record<string, unknown>),
          normalizedEvidence: [
            {
              normalizedEvidenceId: 'normalized-001',
              sourceLineageRecordId: 'missing-record',
              provider: 'polymarket',
              providerGenerationId: 'generation-id-001',
            },
          ],
        },
      },
    });
    const lineageMismatchSha256 = writeJsonAndHash(lineageMismatchPath, lineageMismatch);
    const lineageResult = validatePinnedBettingWinStrategyExportIntake({
      exportPath: lineageMismatchPath,
      expectedSha256: lineageMismatchSha256,
      repositoryRoot: REPO_ROOT,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(lineageResult.ok, false);
    assert.equal(lineageResult.blockers[0]?.code, 'PINNED_STRATEGY_EXPORT_NORMALIZED_EVIDENCE_LINEAGE_MISMATCH');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('pinned strategy export intake rejects duplicate lineage ids and invalid export profiles', () => {
  const tempDir = createTempDir('strategy-export-duplicate-');

  try {
    const duplicateLineagePath = join(tempDir, 'duplicate-lineage.json');
    const basePayload = createStrategyExportPayload();
    const duplicateLineage = createStrategyExportDocument({
      payload: {
        ...basePayload,
        rawStore: {
          ...(basePayload.rawStore as Record<string, unknown>),
          sourceLineageRecords: [
            { recordId: 'record-001', provider: 'polymarket' },
            { recordId: 'record-001', provider: 'polymarket' },
          ],
        },
      },
    });
    const duplicateLineageSha256 = writeJsonAndHash(duplicateLineagePath, duplicateLineage);
    const duplicateLineageResult = validatePinnedBettingWinStrategyExportIntake({
      exportPath: duplicateLineagePath,
      expectedSha256: duplicateLineageSha256,
      repositoryRoot: REPO_ROOT,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(duplicateLineageResult.ok, false);
    assert.equal(duplicateLineageResult.blockers[0]?.code, 'PINNED_STRATEGY_EXPORT_SOURCE_LINEAGE_DUPLICATE');

    const invalidProfilePath = join(tempDir, 'invalid-profile.json');
    const invalidProfile = createStrategyExportDocument({
      exportProfile: 'provider_history_store_backed_fixture_bundle_v1',
    });
    const invalidProfileSha256 = writeJsonAndHash(invalidProfilePath, invalidProfile);
    const invalidProfileResult = validatePinnedBettingWinStrategyExportIntake({
      exportPath: invalidProfilePath,
      expectedSha256: invalidProfileSha256,
      repositoryRoot: REPO_ROOT,
      upstreamLock: sampleUpstreamLock(),
    });
    assert.equal(invalidProfileResult.ok, false);
    assert.equal(invalidProfileResult.blockers[0]?.code, 'PINNED_STRATEGY_EXPORT_PROFILE_INVALID');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTempDir(prefix: string): string {
  mkdirSync(join(REPO_ROOT, 'artifacts'), { recursive: true });
  return mkdtempSync(join(REPO_ROOT, 'artifacts', prefix));
}

function createStrategyExportDocument(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  const payload = (overrides.payload as Record<string, unknown> | undefined) ?? createStrategyExportPayload();
  const collectionReport = payload.collectionReport as Record<string, unknown>;
  return {
    schemaVersion: '1.0.0',
    phase: 'F2-005F',
    exportId: 'provider-history-export.fixture-001.20260714t100000000z.fixture',
    exportProfile: 'provider_history_fixture_bundle_v1',
    exportKind: 'pinned_provider_history_bundle',
    exportedAt: TEST_TIMESTAMP,
    fixtureId: 'fixture-001',
    providerId: 'polymarket',
    endpointId: 'endpoint-001',
    transportMode: 'fixture',
    liveTransportAllowed: false,
    providerGenerationIds: ['generation-id-001'],
    sourceLineageRecordIds: ['record-001'],
    normalizedEvidenceIds: ['normalized-001'],
    payloadSha256: sha256Hex(stableJsonCompact(payload)),
    collectionReportSha256: sha256Hex(stableJsonCompact(collectionReport)),
    payload,
    ...overrides,
  };
}

function createStrategyExportPayload(): Record<string, unknown> {
  return {
    endpointDeclaration: { endpointId: 'endpoint-001' },
    fixtureDeclaration: { fixtureId: 'fixture-001' },
    binding: {
      providerId: 'polymarket',
      endpointId: 'endpoint-001',
    },
    collectionReport: {
      reportId: 'collection-report-001',
      normalizedEvidenceIds: ['normalized-001'],
    },
    rawStore: {
      observations: [{ observationId: 'observation-001' }],
      sourceLineageRecords: [{ recordId: 'record-001', provider: 'polymarket' }],
      sourceLineageEvents: [{ eventId: 'event-001' }],
    },
    quoteStore: {
      generationResolutions: [{ recordId: 'record-001', providerGenerationId: 'generation-id-001' }],
      normalizedEvidence: [
        {
          normalizedEvidenceId: 'normalized-001',
          sourceLineageRecordId: 'record-001',
          provider: 'polymarket',
          providerGenerationId: 'generation-id-001',
        },
      ],
      normalizedRejections: [],
    },
  };
}

function sampleUpstreamLock(
  overrides: Partial<BettingWinUpstreamLock> = {},
): BettingWinUpstreamLock {
  return Object.freeze({
    schema: 'betting-win-surebet-upstream-lock-v1',
    repository: 'betting-win',
    repositoryPath: '/tmp/betting-win',
    commitSha: '1'.repeat(40),
    gitTreeSha: '2'.repeat(40),
    sourceView: 'committed_git_head',
    packageVersion: '0.48.0',
    trackedTreeListingSha256: '3'.repeat(64),
    sourceFingerprintAlgorithm: 'sha256_git_ls_tree_r_full_tree_head_v1',
    contractSchema: 'betting-win.strategy-export.v1',
    contractAlias: 'betting-win-strategy-export.v1',
    surebetProfile: 'surebet_standard_binary_v0',
    verifiedAt: TEST_TIMESTAMP,
    packageVersions: Object.freeze({
      '@betting-win/provider-collection': '0.48.0',
    }),
    capabilities: Object.freeze([
      'exportHistoricalBundle',
      'getHistoricalQuotes',
      'getProviderGenerations',
      'inspectSourceLineage',
    ]),
    ...overrides,
  });
}

function writeJsonAndHash(path: string, value: unknown): string {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path, text, 'utf-8');
  return sha256Hex(text);
}

function stableJsonCompact(value: unknown): string {
  return JSON.stringify(stableSort(value));
}

function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = stableSort((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
