import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import {
  BETTING_WIN_EXPORT_BUNDLE_SCHEMA,
  parseBettingWinExportBundle,
} from '../src/adapters/betting-win-export-reader.js';
import { readLocalBettingWinExportBundle } from '../src/adapters/betting-win-local-bundle-reader.js';
import { buildReadOnlyQueryContractRequest } from '../src/adapters/betting-win-query-client.js';

const REPO_ROOT = process.cwd();

function createFixtureBundle(overrides: Record<string, unknown> = {}) {
  return {
    schema: BETTING_WIN_EXPORT_BUNDLE_SCHEMA,
    reference: {
      source: 'betting-win',
      contractVersion: '0.0.0-test',
      manifestHash: 'a'.repeat(64),
    },
    bundleKind: 'resource_export',
    exportedAt: '2026-07-01T00:00:00.000Z',
    records: [{ marketId: 'market-001' }],
    ...overrides,
  };
}

test('export bundle parser rejects bundles that are not sourced from betting-win', () => {
  const result = parseBettingWinExportBundle(
    createFixtureBundle({
      reference: {
        source: 'other-source',
        contractVersion: '0.0.0-test',
        manifestHash: 'a'.repeat(64),
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'EXPORT_NOT_FROM_BETTING_WIN',
      message: 'Export bundle must reference betting-win.',
      evidenceRequired: 'betting-win export reference.',
    },
  ]);
});

test('export bundle parser rejects malformed local fixture bundle metadata', () => {
  const result = parseBettingWinExportBundle(
    createFixtureBundle({
      schema: 'wrong.schema',
      reference: {
        source: 'betting-win',
        contractVersion: '   ',
        manifestHash: 'not-a-manifest-hash',
      },
      bundleKind: 'unsupported_kind',
      exportedAt: '2026-07-01',
    }),
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'EXPORT_SCHEMA_INVALID',
      message: `Export bundle schema must be ${BETTING_WIN_EXPORT_BUNDLE_SCHEMA}.`,
      evidenceRequired: 'Pinned betting-win export bundle schema string.',
    },
  ]);
});

test('export bundle parser rejects blank contract version after source check passes', () => {
  const result = parseBettingWinExportBundle(
    createFixtureBundle({
      reference: {
        source: 'betting-win',
        contractVersion: '   ',
        manifestHash: 'a'.repeat(64),
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'EXPORT_CONTRACT_VERSION_MISSING',
      message: 'Export bundle contract version is required.',
      evidenceRequired: 'Pinned betting-win export contract version.',
    },
  ]);
});

test('export bundle parser rejects malformed manifest hash, timestamp, and bundle kind', () => {
  const invalidManifest = parseBettingWinExportBundle(
    createFixtureBundle({
      reference: {
        source: 'betting-win',
        contractVersion: '0.0.0-test',
        manifestHash: 'x'.repeat(64),
      },
    }),
  );
  assert.equal(invalidManifest.ok, false);
  assert.deepEqual(invalidManifest.blockers, [
    {
      code: 'EXPORT_MANIFEST_HASH_INVALID',
      message: 'Export bundle manifest hash must be 64 hexadecimal characters.',
      evidenceRequired: 'Pinned betting-win export manifest hash.',
    },
  ]);

  const invalidKind = parseBettingWinExportBundle(createFixtureBundle({ bundleKind: 'unsupported_kind' }));
  assert.equal(invalidKind.ok, false);
  assert.deepEqual(invalidKind.blockers, [
    {
      code: 'EXPORT_BUNDLE_KIND_INVALID',
      message: 'Export bundle kind must be a supported local export bundle kind.',
      evidenceRequired: 'Pinned betting-win export bundle kind.',
    },
  ]);

  const invalidTimestamp = parseBettingWinExportBundle(createFixtureBundle({ exportedAt: '2026-07-01' }));
  assert.equal(invalidTimestamp.ok, false);
  assert.deepEqual(invalidTimestamp.blockers, [
    {
      code: 'EXPORT_TIMESTAMP_INVALID',
      message: 'Export bundle timestamp must be an ISO-8601 UTC timestamp.',
      evidenceRequired: 'Export timestamp.',
    },
  ]);
});

test('export bundle parser accepts and freezes pinned betting-win export metadata', () => {
  const sourceBundle = createFixtureBundle();
  const result = parseBettingWinExportBundle(sourceBundle);

  assert.equal(result.ok, true);
  assert.notStrictEqual(result.value, sourceBundle);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.reference), true);
  assert.equal(Object.isFrozen(result.value.records), true);
  assert.notStrictEqual(result.value.records, sourceBundle.records);
  assert.equal(result.value.schema, BETTING_WIN_EXPORT_BUNDLE_SCHEMA);
  assert.equal(result.value.reference.source, 'betting-win');
  assert.equal(result.value.bundleKind, 'resource_export');
  assert.equal(result.value.records.length, 1);
});

test('read-only query contract request rejects an unpinned contract version', () => {
  const result = buildReadOnlyQueryContractRequest({
    contractVersion: '   ',
    resource: 'quotes',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'QUERY_CONTRACT_NOT_PINNED',
      message: 'A pinned betting-win read-only query contract is required before SURE-002.',
      evidenceRequired: 'Pinned betting-win query contract version.',
    },
  ]);
});

test('read-only query contract request returns a frozen copy when pinned', () => {
  const request = {
    contractVersion: '0.0.0-test',
    resource: 'settlement' as const,
    cursor: 'cursor-001',
  };

  const result = buildReadOnlyQueryContractRequest(request);

  assert.equal(result.ok, true);
  assert.notStrictEqual(result.value, request);
  assert.equal(Object.isFrozen(result.value), true);
  assert.deepEqual(result.value, request);
});

test('local export bundle reader accepts a repo-local fixture path', () => {
  const result = readLocalBettingWinExportBundle('tests/fixtures/local-only-export-bundles/valid-resource-export.json', REPO_ROOT);

  assert.equal(result.ok, true);
  assert.equal(result.value.reference.source, 'betting-win');
  assert.equal(result.value.bundleKind, 'resource_export');
  assert.equal(result.value.records.length, 1);
});

test('local export bundle reader accepts an absolute repo-local fixture path', () => {
  const result = readLocalBettingWinExportBundle(
    join(REPO_ROOT, 'tests/fixtures/local-only-export-bundles/valid-resource-export.json'),
    REPO_ROOT,
  );

  assert.equal(result.ok, true);
  assert.equal(result.value.exportedAt, '2026-07-01T00:00:00.000Z');
});

test('local export bundle reader rejects remote URLs and repo-escaping paths', () => {
  const remoteUrl = readLocalBettingWinExportBundle('https://example.com/export.json', REPO_ROOT);
  assert.equal(remoteUrl.ok, false);
  assert.deepEqual(remoteUrl.blockers, [
    {
      code: 'LOCAL_EXPORT_REMOTE_URL_FORBIDDEN',
      message: 'Export bundle path must be a repo-local filesystem path, not a URL.',
      evidenceRequired: 'Repo-local JSON export bundle path.',
    },
  ]);

  const outsidePath = readLocalBettingWinExportBundle('/tmp/export.json', REPO_ROOT);
  assert.equal(outsidePath.ok, false);
  assert.deepEqual(outsidePath.blockers, [
    {
      code: 'LOCAL_EXPORT_PATH_OUTSIDE_REPO',
      message: 'Export bundle path must stay inside the current repository.',
      evidenceRequired: 'Repo-local JSON export bundle path.',
    },
  ]);

  const traversalPath = readLocalBettingWinExportBundle('../outside-export.json', join(REPO_ROOT, 'tests'));
  assert.equal(traversalPath.ok, false);
  assert.deepEqual(traversalPath.blockers, [
    {
      code: 'LOCAL_EXPORT_PATH_OUTSIDE_REPO',
      message: 'Export bundle path must stay inside the current repository.',
      evidenceRequired: 'Repo-local JSON export bundle path.',
    },
  ]);
});

test('local export bundle reader rejects missing files and malformed json', () => {
  const missingFile = readLocalBettingWinExportBundle('tests/fixtures/local-only-export-bundles/missing.json', REPO_ROOT);
  assert.equal(missingFile.ok, false);
  assert.deepEqual(missingFile.blockers, [
    {
      code: 'LOCAL_EXPORT_FILE_MISSING',
      message: 'Export bundle file does not exist.',
      evidenceRequired: 'Repo-local JSON export bundle file.',
    },
  ]);

  const malformedJson = readLocalBettingWinExportBundle('tests/fixtures/local-only-export-bundles/malformed-json.json', REPO_ROOT);
  assert.equal(malformedJson.ok, false);
  assert.deepEqual(malformedJson.blockers, [
    {
      code: 'LOCAL_EXPORT_JSON_INVALID',
      message: 'Export bundle file must contain valid JSON.',
      evidenceRequired: 'Valid repo-local export bundle JSON.',
    },
  ]);
});

test('local export bundle reader returns bundle contract blockers for invalid metadata', () => {
  const result = readLocalBettingWinExportBundle('tests/fixtures/local-only-export-bundles/invalid-export-metadata.json', REPO_ROOT);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'EXPORT_SCHEMA_INVALID',
      message: `Export bundle schema must be ${BETTING_WIN_EXPORT_BUNDLE_SCHEMA}.`,
      evidenceRequired: 'Pinned betting-win export bundle schema string.',
    },
  ]);
});
