import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildB1ScenarioCashflowMatrix,
  type B1ScenarioCashflowLegTerms,
  type B1ScenarioCashflowMatrix,
  validateB1ScenarioCashflowMatrix,
} from '../src/scenarios/b1-scenario-cashflow.js';
import type { B1TerminalScenario } from '../src/scenarios/b1-terminal-scenario.js';

const SCENARIOS: readonly B1TerminalScenario[] = Object.freeze([
  Object.freeze({
    scenarioId: 'b1_terminal:event-001:moneyline:away',
    selectionEquivalenceKey: 'event-001:moneyline:away',
    outcomeName: 'Away',
    outcomeSide: 'away',
  }),
  Object.freeze({
    scenarioId: 'b1_terminal:event-001:moneyline:draw',
    selectionEquivalenceKey: 'event-001:moneyline:draw',
    outcomeName: 'Draw',
    outcomeSide: 'draw',
  }),
  Object.freeze({
    scenarioId: 'b1_terminal:event-001:moneyline:home',
    selectionEquivalenceKey: 'event-001:moneyline:home',
    outcomeName: 'Home',
    outcomeSide: 'home',
  }),
]);

test('B1 scenario cash-flow builder supports deterministic 3-way terminal portfolios', () => {
  const result = buildB1ScenarioCashflowMatrix(SCENARIOS, Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      decimalOddsMicro: 3_200_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      decimalOddsMicro: 3_600_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:draw',
      venueOrBookmakerId: 'venue-c',
      stakeMinor: 1_059n,
      decimalOddsMicro: 3_400_000n,
    }),
  ]));

  assert.equal(result.ok, true);
  assert.equal(result.value.rows.length, 9);
  assert.deepEqual(result.value.rows.filter((row) => row.payoutMinor > 0n).map((row) => ({
    scenarioId: row.scenarioId,
    selectionEquivalenceKey: row.selectionEquivalenceKey,
    payoutMinor: row.payoutMinor,
  })), [
    {
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      payoutMinor: 3_600n,
    },
    {
      scenarioId: 'b1_terminal:event-001:moneyline:draw',
      selectionEquivalenceKey: 'event-001:moneyline:draw',
      payoutMinor: 3_600n,
    },
    {
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      payoutMinor: 3_600n,
    },
  ]);
});

test('B1 scenario cash-flow validation rejects malformed row shape before field access', () => {
  const result = validateB1ScenarioCashflowMatrix(Object.freeze([
    null,
  ] as unknown as B1ScenarioCashflowMatrix['rows']));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_ROW_INVALID',
      message: 'B1 scenario cash-flow rows must be structured objects.',
      evidenceRequired: 'Structured B1 scenario cash-flow rows.',
    },
  ]);
});

test('B1 scenario cash-flow validation rejects malformed row identities before sorting', () => {
  for (const malformedValue of ['', 100, null, undefined]) {
    const scenarioIdResult = validateB1ScenarioCashflowMatrix(createTwoWayRows({ scenarioId: malformedValue }));
    assert.equal(scenarioIdResult.ok, false);
    assert.deepEqual(scenarioIdResult.blockers, [
      {
        code: 'B1_SCENARIO_CASHFLOW_SCENARIO_ID_MISSING',
        message: 'B1 scenario cash-flow validation requires scenario identity evidence for every row.',
        evidenceRequired: 'B1 scenario cash-flow scenario_id.',
      },
    ]);

    const selectionResult = validateB1ScenarioCashflowMatrix(createTwoWayRows({ selectionEquivalenceKey: malformedValue }));
    assert.equal(selectionResult.ok, false);
    assert.deepEqual(selectionResult.blockers, [
      {
        code: 'B1_SELECTION_EQUIVALENCE_MISSING',
        message: 'B1 scenario cash-flow validation requires winner selection equivalence evidence for every row.',
        evidenceRequired: 'B1 scenario cash-flow winning_selection_equivalence_key.',
      },
    ]);

    const winnerResult = validateB1ScenarioCashflowMatrix(createTwoWayRows({ winningSelectionEquivalenceKey: malformedValue }));
    assert.equal(winnerResult.ok, false);
    assert.deepEqual(winnerResult.blockers, [
      {
        code: 'B1_SELECTION_EQUIVALENCE_MISSING',
        message: 'B1 scenario cash-flow validation requires winner selection equivalence evidence for every row.',
        evidenceRequired: 'B1 scenario cash-flow winning_selection_equivalence_key.',
      },
    ]);

    const venueResult = validateB1ScenarioCashflowMatrix(createTwoWayRows({ venueOrBookmakerId: malformedValue }));
    assert.equal(venueResult.ok, false);
    assert.deepEqual(venueResult.blockers, [
      {
        code: 'B1_VENUE_PAIR_INCOMPLETE',
        message: 'B1 scenario cash-flow validation requires venue evidence for every row.',
        evidenceRequired: 'B1 scenario cash-flow venue_or_bookmaker_id.',
      },
    ]);
  }
});

test('B1 scenario cash-flow validation rejects malformed fixed-point row values before comparisons', () => {
  for (const field of ['stakeMinor', 'payoutMinor'] as const) {
    for (const malformedValue of [1_000, '1000', null, undefined]) {
      const malformedRow = Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 1_000n,
        payoutMinor: 3_600n,
        [field]: malformedValue,
      });
      const result = validateB1ScenarioCashflowMatrix(Object.freeze([
        malformedRow,
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:away',
          winningSelectionEquivalenceKey: 'event-001:moneyline:away',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          venueOrBookmakerId: 'venue-a',
          stakeMinor: 1_125n,
          payoutMinor: 0n,
        }),
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:home',
          winningSelectionEquivalenceKey: 'event-001:moneyline:home',
          selectionEquivalenceKey: 'event-001:moneyline:away',
          venueOrBookmakerId: 'venue-b',
          stakeMinor: 1_000n,
          payoutMinor: 0n,
        }),
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:home',
          winningSelectionEquivalenceKey: 'event-001:moneyline:home',
          selectionEquivalenceKey: 'event-001:moneyline:home',
          venueOrBookmakerId: 'venue-a',
          stakeMinor: 1_125n,
          payoutMinor: 3_600n,
        }),
      ] as unknown as B1ScenarioCashflowMatrix['rows']));

      assert.equal(result.ok, false);
      assert.deepEqual(result.blockers, [
        {
          code: 'B1_SCENARIO_CASHFLOW_VALUE_INVALID',
          message: 'B1 scenario cash-flow values must be bigint integer minor units.',
          evidenceRequired: 'Bigint B1 integer minor-unit scenario cash-flow rows.',
        },
      ]);
    }
  }
});

test('B1 scenario cash-flow builder rejects malformed leg-term values before payout arithmetic', () => {
  const malformedScenarioShape = buildB1ScenarioCashflowMatrix(
    Object.freeze([null, SCENARIOS[1], SCENARIOS[2]] as unknown as readonly B1TerminalScenario[]),
    validThreeWayTerms(),
  );
  assert.equal(malformedScenarioShape.ok, false);
  assert.deepEqual(malformedScenarioShape.blockers, [
    {
      code: 'B1_TERMINAL_SCENARIO_INVALID',
      message: 'B1 scenario cash-flow construction requires structured terminal scenarios.',
      evidenceRequired: 'Structured B1 terminal scenario inputs.',
    },
  ]);

  const malformedScenarioIdentity = buildB1ScenarioCashflowMatrix(
    Object.freeze([
      { ...SCENARIOS[0], selectionEquivalenceKey: 100 },
      SCENARIOS[1],
      SCENARIOS[2],
    ] as unknown as readonly B1TerminalScenario[]),
    validThreeWayTerms(),
  );
  assert.equal(malformedScenarioIdentity.ok, false);
  assert.deepEqual(malformedScenarioIdentity.blockers, [
    {
      code: 'B1_SELECTION_EQUIVALENCE_MISSING',
      message: 'B1 scenario cash-flow construction requires selection equivalence evidence for every terminal scenario.',
      evidenceRequired: 'B1 terminal scenario selection_equivalence_key.',
    },
  ]);

  const malformedTermShape = buildB1ScenarioCashflowMatrix(SCENARIOS, Object.freeze([
    null,
    ...validThreeWayTerms().slice(1),
  ] as unknown as readonly B1ScenarioCashflowLegTerms[]));
  assert.equal(malformedTermShape.ok, false);
  assert.deepEqual(malformedTermShape.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_LEG_TERM_INVALID',
      message: 'B1 scenario cash-flow leg terms must be structured objects.',
      evidenceRequired: 'Structured B1 scenario cash-flow leg terms.',
    },
  ]);

  const malformedTermSelection = buildB1ScenarioCashflowMatrix(SCENARIOS, Object.freeze([
    { ...validThreeWayTerms()[0], selectionEquivalenceKey: 100 },
    ...validThreeWayTerms().slice(1),
  ] as unknown as readonly B1ScenarioCashflowLegTerms[]));
  assert.equal(malformedTermSelection.ok, false);
  assert.deepEqual(malformedTermSelection.blockers, [
    {
      code: 'B1_SELECTION_EQUIVALENCE_MISSING',
      message: 'B1 scenario cash-flow leg terms require selection equivalence evidence.',
      evidenceRequired: 'B1 leg term selection_equivalence_key.',
    },
  ]);

  const malformedTermVenue = buildB1ScenarioCashflowMatrix(SCENARIOS, Object.freeze([
    { ...validThreeWayTerms()[0], venueOrBookmakerId: 100 },
    ...validThreeWayTerms().slice(1),
  ] as unknown as readonly B1ScenarioCashflowLegTerms[]));
  assert.equal(malformedTermVenue.ok, false);
  assert.deepEqual(malformedTermVenue.blockers, [
    {
      code: 'B1_VENUE_PAIR_INCOMPLETE',
      message: 'B1 scenario cash-flow leg terms require venue evidence.',
      evidenceRequired: 'B1 leg term venue_or_bookmaker_id.',
    },
  ]);

  const malformedStake = buildB1ScenarioCashflowMatrix(SCENARIOS, Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125,
      decimalOddsMicro: 3_200_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      decimalOddsMicro: 3_600_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:draw',
      venueOrBookmakerId: 'venue-c',
      stakeMinor: 1_059n,
      decimalOddsMicro: 3_400_000n,
    }),
  ] as unknown as readonly B1ScenarioCashflowLegTerms[]));

  assert.equal(malformedStake.ok, false);
  assert.deepEqual(malformedStake.blockers, [
    {
      code: 'B1_STAKE_INVALID',
      message: 'B1 scenario cash-flow leg terms require bigint integer minor-unit stakes.',
      evidenceRequired: 'Bigint B1 stake in integer minor units.',
    },
  ]);

  const malformedOdds = buildB1ScenarioCashflowMatrix(SCENARIOS, Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      decimalOddsMicro: 3_200_000,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      decimalOddsMicro: 3_600_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:draw',
      venueOrBookmakerId: 'venue-c',
      stakeMinor: 1_059n,
      decimalOddsMicro: 3_400_000n,
    }),
  ] as unknown as readonly B1ScenarioCashflowLegTerms[]));

  assert.equal(malformedOdds.ok, false);
  assert.deepEqual(malformedOdds.blockers, [
    {
      code: 'B1_DECIMAL_ODDS_INVALID',
      message: 'B1 scenario cash-flow leg terms require bigint decimal odds micro values.',
      evidenceRequired: 'Bigint B1 decimal odds scaled to micro units.',
    },
  ]);
});

function createTwoWayRows(
  firstRowOverride: Readonly<Record<string, unknown>>,
): B1ScenarioCashflowMatrix['rows'] {
  return Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
      ...firstRowOverride,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 3_600n,
    }),
  ] as unknown as B1ScenarioCashflowMatrix['rows']);
}

function venueDriftRows(): B1ScenarioCashflowMatrix['rows'] {
  return Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-x',
      stakeMinor: 1_000n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 3_600n,
    }),
  ]);
}

function validThreeWayTerms(): readonly B1ScenarioCashflowLegTerms[] {
  return Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      decimalOddsMicro: 3_200_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      decimalOddsMicro: 3_600_000n,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:draw',
      venueOrBookmakerId: 'venue-c',
      stakeMinor: 1_059n,
      decimalOddsMicro: 3_400_000n,
    }),
  ]);
}

test('B1 scenario cash-flow validation fails closed on incomplete matrices', () => {
  const result = validateB1ScenarioCashflowMatrix(Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 3_600n,
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_MATRIX_INCOMPLETE',
      message: 'B1 scenario cash-flow validation requires every leg to appear in every terminal scenario.',
      evidenceRequired: 'Complete B1 scenario-by-leg-key cash-flow matrix.',
    },
  ]);
});

test('B1 scenario cash-flow validation rejects selection venue drift across terminal scenarios', () => {
  const result = validateB1ScenarioCashflowMatrix(venueDriftRows());

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_LEG_KEY_DRIFT',
      message: 'B1 scenario cash-flow validation requires each selection to keep one stable venue across terminal scenarios.',
      evidenceRequired: 'Stable B1 scenario-by-leg-key coverage keyed by selection_equivalence_key and venue_or_bookmaker_id.',
    },
  ]);
});

test('B1 scenario cash-flow validation fails closed on missing winning selection equivalence keys', () => {
  const result = validateB1ScenarioCashflowMatrix(Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: '',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: '',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 3_600n,
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SELECTION_EQUIVALENCE_MISSING',
      message: 'B1 scenario cash-flow validation requires winner selection equivalence evidence for every row.',
      evidenceRequired: 'B1 scenario cash-flow winning_selection_equivalence_key.',
    },
  ]);
});

test('B1 scenario cash-flow validation fails closed on conflicting scenario winner keys', () => {
  const result = validateB1ScenarioCashflowMatrix(Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 3_600n,
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
      message: 'B1 scenario cash-flow validation requires one declared winning selection per terminal scenario.',
      evidenceRequired: 'One winning B1 terminal outcome per scenario.',
    },
  ]);
});

test('B1 scenario cash-flow validation fails closed on duplicate terminal winners', () => {
  const result = validateB1ScenarioCashflowMatrix(Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
      message: 'B1 scenario cash-flow validation requires terminal winners to cover every compared selection exactly once.',
      evidenceRequired: 'One winning B1 terminal outcome for each compared selection.',
    },
  ]);
});

test('B1 scenario cash-flow validation fails closed when positive payout does not match declared winner', () => {
  const result = validateB1ScenarioCashflowMatrix(Object.freeze([
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 0n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:away',
      winningSelectionEquivalenceKey: 'event-001:moneyline:away',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      stakeMinor: 1_000n,
      payoutMinor: 3_600n,
    }),
    Object.freeze({
      scenarioId: 'b1_terminal:event-001:moneyline:home',
      winningSelectionEquivalenceKey: 'event-001:moneyline:home',
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      stakeMinor: 1_125n,
      payoutMinor: 0n,
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
      message: 'B1 scenario cash-flow validation requires the positive payout row to match the declared winner.',
      evidenceRequired: 'One winning B1 terminal outcome per scenario.',
    },
  ]);
});
