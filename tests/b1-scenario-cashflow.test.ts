import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildB1ScenarioCashflowMatrix,
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
      evidenceRequired: 'Complete B1 scenario-by-selection cash-flow matrix.',
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
