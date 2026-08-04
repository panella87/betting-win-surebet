import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  B1_MULTI_VENUE_MARKETS_SCHEMA,
  B1_UPSTREAM_READINESS_BLOCKER,
} from '../src/contracts/b1-local-types.js';
import {
  parseBettingWinB1DeterministicFixture,
} from '../src/contracts/betting-win-b1-resource-records.js';

const FIXTURE_PATH = 'tests/fixtures/b1-local-contract/valid-b1-multi-venue-markets.json';

function readFixture(): Record<string, unknown> {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as Record<string, unknown>;
}

test('B1 deterministic fixture parser accepts local contract rows without upstream readiness', () => {
  const result = parseBettingWinB1DeterministicFixture(readFixture());

  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.manifest), true);
  assert.equal(Object.isFrozen(result.value.rows), true);
  assert.equal(result.value.runtimeEvidence, false);
  assert.equal(result.value.upstreamReadiness, B1_UPSTREAM_READINESS_BLOCKER);
  assert.equal(result.value.manifest.contractSchema, B1_MULTI_VENUE_MARKETS_SCHEMA);
  assert.equal(result.value.rows.length, 2);
  const firstRow = result.value.rows[0];
  assert.ok(firstRow);
  assert.equal(firstRow.marketEquivalenceKey, 'event-001:moneyline:full-game');
  assert.equal(firstRow.selectionEquivalenceKey, 'event-001:moneyline:home');
  assert.equal(firstRow.quoteAgeMs, 1250n);
  assert.equal(firstRow.availableSizeMinor, 1200000n);
});

test('B1 deterministic fixture parser rejects runtime evidence claims', () => {
  const fixture = readFixture();
  fixture.runtimeEvidence = true;

  const result = parseBettingWinB1DeterministicFixture(fixture);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FIXTURE_RUNTIME_EVIDENCE_FORBIDDEN',
      message: 'B1 deterministic fixtures must explicitly declare runtimeEvidence as false.',
      evidenceRequired: 'A local fixture that cannot satisfy upstream runtime evidence.',
    },
  ]);
});

test('B1 deterministic fixture parser fails closed on missing equivalence evidence', () => {
  const fixture = readFixture();
  const rows = fixture.rows as Array<Record<string, unknown>>;
  const firstRow = rows[0];
  assert.ok(firstRow);
  firstRow.market_equivalence_key = '';

  const result = parseBettingWinB1DeterministicFixture(fixture);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_MARKET_EQUIVALENCE_MISSING',
      message: 'B1 row market_equivalence_key is required before quote comparison.',
      evidenceRequired: 'B1 market equivalence key.',
    },
  ]);
});

test('B1 deterministic fixture parser rejects unknown settlement compatibility', () => {
  const fixture = readFixture();
  const rows = fixture.rows as Array<Record<string, unknown>>;
  const firstRow = rows[0];
  assert.ok(firstRow);
  firstRow.settlement_compatibility_flag = 'unknown';

  const result = parseBettingWinB1DeterministicFixture(fixture);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      message: 'B1 row settlement_compatibility_flag must be explicit before quote comparison.',
      evidenceRequired: 'Explicit B1 settlement compatibility evidence.',
    },
  ]);
});

test('B1 deterministic fixture parser rejects missing manifest lineage evidence', () => {
  const fixture = readFixture();
  const manifest = fixture.manifest as Record<string, unknown>;
  manifest.sourceLineageRecordIds = [];

  const result = parseBettingWinB1DeterministicFixture(fixture);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SOURCE_LINEAGE_RECORD_IDS_MISSING',
      message: 'B1 manifest sourceLineageRecordIds must contain at least one id.',
      evidenceRequired: 'B1 source lineage record ids from betting-win.',
    },
  ]);
});

test('B1 deterministic fixture parser binds manifest lineage ids to row lineage ids', () => {
  const fixtureWithUnusedManifestLineage = readFixture();
  const unusedManifest = fixtureWithUnusedManifestLineage.manifest as Record<string, unknown>;
  unusedManifest.sourceLineageRecordIds = ['lineage-001', 'lineage-002', 'lineage-unused'];

  const unusedResult = parseBettingWinB1DeterministicFixture(fixtureWithUnusedManifestLineage);

  assert.equal(unusedResult.ok, false);
  assert.deepEqual(unusedResult.blockers, [
    {
      code: 'B1_SOURCE_LINEAGE_MANIFEST_ID_UNUSED',
      message: 'B1 manifest sourceLineageRecordIds must be represented by fixture rows.',
      evidenceRequired: 'Every manifest source lineage id represented by at least one B1 row.',
    },
  ]);

  const fixtureWithUnboundRowLineage = readFixture();
  const rows = fixtureWithUnboundRowLineage.rows as Array<Record<string, unknown>>;
  const firstRow = rows[0];
  assert.ok(firstRow);
  firstRow.source_lineage_id = 'lineage-not-in-manifest';

  const rowResult = parseBettingWinB1DeterministicFixture(fixtureWithUnboundRowLineage);

  assert.equal(rowResult.ok, false);
  assert.deepEqual(rowResult.blockers, [
    {
      code: 'B1_SOURCE_LINEAGE_ROW_NOT_IN_MANIFEST',
      message: 'B1 fixture rows must be bound to manifest sourceLineageRecordIds.',
      evidenceRequired: 'Every row source_lineage_id represented in the B1 manifest lineage ids.',
    },
  ]);
});
