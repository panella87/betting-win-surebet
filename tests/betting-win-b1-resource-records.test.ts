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

test('B1 deterministic fixture parser accepts signed spread line values', () => {
  const fixture = readFixture();
  const rows = fixture.rows as Array<Record<string, unknown>>;
  for (const row of rows) {
    row.market_type = 'spread';
    row.market_equivalence_key = 'event-001:spread:-1.5:full-game';
    row.line_value = '-1.5';
  }

  const result = parseBettingWinB1DeterministicFixture(fixture);

  assert.equal(result.ok, true);
  assert.equal(result.value.rows.length, 2);
  assert.equal(result.value.rows[0]?.marketType, 'spread');
  assert.equal(result.value.rows[0]?.lineValue, '-1.5');
  assert.equal(result.value.rows[1]?.lineValue, '-1.5');
});

test('B1 deterministic fixture parser rejects malformed signed line values', () => {
  for (const lineValue of ['--1.5', '-', '-.5', ' -1.5', '-1.5 ']) {
    const fixture = readFixture();
    const rows = fixture.rows as Array<Record<string, unknown>>;
    const firstRow = rows[0];
    assert.ok(firstRow);
    firstRow.market_type = 'spread';
    firstRow.line_value = lineValue;

    const result = parseBettingWinB1DeterministicFixture(fixture);

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: 'B1_LINE_VALUE_INVALID',
        message: 'B1 row line_value must be a signed decimal string.',
        evidenceRequired: 'B1 line value.',
      },
    ]);
  }
});

test('B1 deterministic fixture parser preserves unsigned odds and minor-unit parsing', () => {
  const malformedFields = [
    {
      field: 'decimal_odds',
      value: '-2.10',
      code: 'B1_DECIMAL_ODDS_INVALID',
      message: 'B1 row decimal_odds must be a decimal string.',
      evidenceRequired: 'B1 decimal odds.',
    },
    {
      field: 'price_minor_or_probability_minor',
      value: '-210000',
      code: 'B1_PRICE_MINOR_OR_PROBABILITY_INVALID',
      message: 'B1 row price_minor_or_probability_minor must be a non-negative integer string or bigint.',
      evidenceRequired: 'B1 price or probability minor units.',
    },
    {
      field: 'available_size_minor',
      value: '-1200000',
      code: 'B1_AVAILABLE_SIZE_INVALID',
      message: 'B1 row available_size_minor must be a non-negative integer string or bigint.',
      evidenceRequired: 'B1 available size minor units.',
    },
    {
      field: 'quote_age_ms',
      value: '-1',
      code: 'B1_QUOTE_AGE_INVALID',
      message: 'B1 row quote_age_ms must be a non-negative integer string or bigint.',
      evidenceRequired: 'B1 quote age.',
    },
  ] as const;

  for (const malformedField of malformedFields) {
    const fixture = readFixture();
    const rows = fixture.rows as Array<Record<string, unknown>>;
    const firstRow = rows[0];
    assert.ok(firstRow);
    firstRow[malformedField.field] = malformedField.value;

    const result = parseBettingWinB1DeterministicFixture(fixture);

    assert.equal(result.ok, false);
    assert.deepEqual(result.blockers, [
      {
        code: malformedField.code,
        message: malformedField.message,
        evidenceRequired: malformedField.evidenceRequired,
      },
    ]);
  }
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

test('B1 deterministic fixture parser rejects noncanonical manifest metadata identifiers', () => {
  const whitespaceFixture = readFixture();
  const whitespaceManifest = whitespaceFixture.manifest as Record<string, unknown>;
  whitespaceManifest.providerGenerationIds = [' generation-001 '];

  const whitespaceResult = parseBettingWinB1DeterministicFixture(whitespaceFixture);

  assert.equal(whitespaceResult.ok, false);
  assert.deepEqual(whitespaceResult.blockers, [
    {
      code: 'B1_PROVIDER_GENERATION_IDS_MISSING',
      message: 'B1 manifest providerGenerationIds must contain at least one id.',
      evidenceRequired: 'B1 provider generation ids from betting-win.',
    },
  ]);

  const duplicateFixture = readFixture();
  const duplicateManifest = duplicateFixture.manifest as Record<string, unknown>;
  duplicateManifest.sourceLineageRecordIds = ['lineage-001', 'lineage-001'];

  const duplicateResult = parseBettingWinB1DeterministicFixture(duplicateFixture);

  assert.equal(duplicateResult.ok, false);
  assert.deepEqual(duplicateResult.blockers, [
    {
      code: 'B1_SOURCE_LINEAGE_RECORD_IDS_MISSING',
      message: 'B1 manifest sourceLineageRecordIds must contain at least one id.',
      evidenceRequired: 'B1 source lineage record ids from betting-win.',
    },
  ]);

  const uppercaseHashFixture = readFixture();
  const uppercaseHashManifest = uppercaseHashFixture.manifest as Record<string, unknown>;
  uppercaseHashManifest.sourceManifestHash = 'A'.repeat(64);

  const uppercaseHashResult = parseBettingWinB1DeterministicFixture(uppercaseHashFixture);

  assert.equal(uppercaseHashResult.ok, false);
  assert.deepEqual(uppercaseHashResult.blockers, [
    {
      code: 'B1_SOURCE_MANIFEST_HASH_INVALID',
      message: 'B1 manifest sourceManifestHash must be 64 hexadecimal characters.',
      evidenceRequired: 'B1 source manifest hash.',
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
