import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_LANE_SPEC } from '../src/contracts/local-types.js';
import { toBettingWinReference } from '../src/contracts/betting-win-contract-imports.js';

test('first lane is paper-only with direct provider connection prohibited', () => {
  assert.equal(FIRST_LANE_SPEC.laneId, 'polymarket_standard_binary_complete_set_v0');
  assert.equal(FIRST_LANE_SPEC.mode, 'paper_only');
  assert.equal(FIRST_LANE_SPEC.providerConnection, 'prohibited');
});

test('contract metadata must come from betting-win with a manifest hash', () => {
  const result = toBettingWinReference({ packageName: '@internal/betting-win-contracts', version: '0.0.0-test', schemaVersion: 'fixture', manifestHash: 'a'.repeat(64), generatedBy: 'betting-win' });
  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail('expected valid betting-win metadata to be accepted');
  }
  assert.deepEqual(result.value, {
    source: 'betting-win',
    contractVersion: '@internal/betting-win-contracts@0.0.0-test:fixture',
    manifestHash: 'a'.repeat(64),
  });
});

test('contract metadata validation fails closed before dereferencing malformed input', () => {
  for (const metadata of [undefined, null, 'metadata', 42, []]) {
    assertBlockedReference(metadata, 'CONTRACT_METADATA_INVALID');
  }
});

test('contract metadata validation rejects malformed reference fields', () => {
  const validMetadata = {
    packageName: '@internal/betting-win-contracts',
    version: '0.0.0-test',
    schemaVersion: 'fixture',
    manifestHash: 'a'.repeat(64),
    generatedBy: 'betting-win',
  };

  for (const metadata of [
    withoutField(validMetadata, 'packageName'),
    { ...validMetadata, packageName: '' },
    { ...validMetadata, packageName: '   ' },
    { ...validMetadata, packageName: ' @internal/betting-win-contracts ' },
    { ...validMetadata, packageName: 7 },
  ]) {
    assertBlockedReference(metadata, 'CONTRACT_PACKAGE_NAME_INVALID');
  }

  for (const metadata of [
    withoutField(validMetadata, 'version'),
    { ...validMetadata, version: '' },
    { ...validMetadata, version: '   ' },
    { ...validMetadata, version: ' 0.0.0-test ' },
    { ...validMetadata, version: false },
  ]) {
    assertBlockedReference(metadata, 'CONTRACT_VERSION_INVALID');
  }

  for (const metadata of [
    withoutField(validMetadata, 'schemaVersion'),
    { ...validMetadata, schemaVersion: '' },
    { ...validMetadata, schemaVersion: '   ' },
    { ...validMetadata, schemaVersion: ' fixture ' },
    { ...validMetadata, schemaVersion: {} },
  ]) {
    assertBlockedReference(metadata, 'CONTRACT_SCHEMA_VERSION_INVALID');
  }

  for (const metadata of [
    withoutField(validMetadata, 'generatedBy'),
    { ...validMetadata, generatedBy: 'other-system' },
    { ...validMetadata, generatedBy: 7 },
  ]) {
    assertBlockedReference(metadata, 'CONTRACT_SOURCE_NOT_BETTING_WIN');
  }

  for (const metadata of [
    withoutField(validMetadata, 'manifestHash'),
    { ...validMetadata, manifestHash: '' },
    { ...validMetadata, manifestHash: '   ' },
    { ...validMetadata, manifestHash: 'a'.repeat(63) },
    { ...validMetadata, manifestHash: 'a'.repeat(32) },
    { ...validMetadata, manifestHash: 'x'.repeat(64) },
    { ...validMetadata, manifestHash: 'A'.repeat(64) },
    { ...validMetadata, manifestHash: `${'a'.repeat(64)} ` },
    { ...validMetadata, manifestHash: 7 },
  ]) {
    assertBlockedReference(metadata, 'CONTRACT_MANIFEST_HASH_INVALID');
  }
});

function assertBlockedReference(metadata: unknown, expectedCode: string): void {
  const result = toBettingWinReference(metadata);
  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected metadata to be rejected');
  }
  assert.equal(result.blockers[0]?.code, expectedCode);
}

function withoutField<T extends Record<string, unknown>>(value: T, fieldName: keyof T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== String(fieldName)));
}
