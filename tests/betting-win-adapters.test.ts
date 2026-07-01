import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBettingWinExportBundle } from '../src/adapters/betting-win-export-reader.js';
import { buildReadOnlyQueryContractRequest } from '../src/adapters/betting-win-query-client.js';

test('export bundle parser rejects bundles that are not sourced from betting-win', () => {
  const result = parseBettingWinExportBundle({
    reference: {
      source: 'other-source',
      contractVersion: '0.0.0-test',
      manifestHash: 'a'.repeat(64),
    },
    exportedAt: '2026-07-01T00:00:00.000Z',
    records: [],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'EXPORT_NOT_FROM_BETTING_WIN',
      message: 'Export bundle must reference betting-win.',
      evidenceRequired: 'betting-win export reference.',
    },
  ]);
});

test('export bundle parser accepts pinned betting-win export metadata', () => {
  const result = parseBettingWinExportBundle({
    reference: {
      source: 'betting-win',
      contractVersion: '0.0.0-test',
      manifestHash: 'a'.repeat(64),
    },
    exportedAt: '2026-07-01T00:00:00.000Z',
    records: [{ marketId: 'market-001' }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.reference.source, 'betting-win');
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
