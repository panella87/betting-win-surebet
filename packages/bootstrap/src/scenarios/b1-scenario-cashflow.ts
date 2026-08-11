import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import {
  B1_DECIMAL_ODDS_SCALE_MICRO,
} from '../opportunity/b1-gross-spread.js';
import type { B1TerminalScenario } from './b1-terminal-scenario.js';

export interface B1ScenarioCashflowLegTerms {
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly stakeMinor: bigint;
  readonly decimalOddsMicro: bigint;
}

export interface B1ScenarioCashflowRow {
  readonly scenarioId: string;
  readonly winningSelectionEquivalenceKey: string;
  readonly selectionEquivalenceKey: string;
  readonly venueOrBookmakerId: string;
  readonly stakeMinor: bigint;
  readonly payoutMinor: bigint;
}

export interface B1ScenarioCashflowMatrix {
  readonly rows: readonly B1ScenarioCashflowRow[];
}

export function buildB1ScenarioCashflowMatrix(
  scenarios: readonly B1TerminalScenario[],
  legTerms: readonly B1ScenarioCashflowLegTerms[],
): BoundaryResult<B1ScenarioCashflowMatrix> {
  const scenarioValidation = validateB1TerminalScenarioSet(scenarios);
  if (!scenarioValidation.ok) {
    return scenarioValidation;
  }

  const termsBySelection = new Map<string, B1ScenarioCashflowLegTerms>();
  for (const term of legTerms) {
    const termValidation = validateB1ScenarioCashflowLegTerm(term);
    if (!termValidation.ok) {
      return termValidation;
    }
    if (termsBySelection.has(term.selectionEquivalenceKey)) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_DUPLICATE_LEG',
        'B1 scenario cash-flow construction requires exactly one stake term per terminal outcome.',
        'Unique B1 stake term keyed by selection_equivalence_key.',
      );
    }
    termsBySelection.set(term.selectionEquivalenceKey, termValidation.value);
  }

  if (termsBySelection.size !== scenarios.length) {
    return blocked(
      'B1_SCENARIO_CASHFLOW_TERMS_INCOMPLETE',
      'B1 scenario cash-flow construction requires one stake term for every terminal outcome.',
      'B1 stake terms aligned to the complete terminal scenario set.',
    );
  }

  const rows: B1ScenarioCashflowRow[] = [];
  for (const scenario of scenarios) {
    for (const term of legTermsBySelectionOrder(termsBySelection)) {
      rows.push(Object.freeze({
        scenarioId: scenario.scenarioId,
        winningSelectionEquivalenceKey: scenario.selectionEquivalenceKey,
        selectionEquivalenceKey: term.selectionEquivalenceKey,
        venueOrBookmakerId: term.venueOrBookmakerId,
        stakeMinor: term.stakeMinor,
        payoutMinor: term.selectionEquivalenceKey === scenario.selectionEquivalenceKey
          ? calculateB1PayoutMinor(term.stakeMinor, term.decimalOddsMicro)
          : 0n,
      }));
    }
  }

  return validateB1ScenarioCashflowMatrix(rows);
}

export function validateB1ScenarioCashflowMatrix(
  rows: readonly B1ScenarioCashflowRow[],
): BoundaryResult<B1ScenarioCashflowMatrix> {
  if (rows.length === 0) {
    return blocked(
      'B1_SCENARIO_CASHFLOW_EMPTY',
      'B1 scenario cash-flow rows are required.',
      'Complete B1 scenario cash-flow matrix.',
    );
  }
  for (const row of rows) {
    if (!isRecord(row)) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_ROW_INVALID',
        'B1 scenario cash-flow rows must be structured objects.',
        'Structured B1 scenario cash-flow rows.',
      );
    }
    if (!isNonEmptyString(row.scenarioId)) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_SCENARIO_ID_MISSING',
        'B1 scenario cash-flow validation requires scenario identity evidence for every row.',
        'B1 scenario cash-flow scenario_id.',
      );
    }
    if (!isNonEmptyString(row.winningSelectionEquivalenceKey) || !isNonEmptyString(row.selectionEquivalenceKey)) {
      return blocked(
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1 scenario cash-flow validation requires winner selection equivalence evidence for every row.',
        'B1 scenario cash-flow winning_selection_equivalence_key.',
      );
    }
    if (!isNonEmptyString(row.venueOrBookmakerId)) {
      return blocked(
        'B1_VENUE_PAIR_INCOMPLETE',
        'B1 scenario cash-flow validation requires venue evidence for every row.',
        'B1 scenario cash-flow venue_or_bookmaker_id.',
      );
    }
    if (typeof row.stakeMinor !== 'bigint' || typeof row.payoutMinor !== 'bigint') {
      return blocked(
        'B1_SCENARIO_CASHFLOW_VALUE_INVALID',
        'B1 scenario cash-flow values must be bigint integer minor units.',
        'Bigint B1 integer minor-unit scenario cash-flow rows.',
      );
    }
    if (row.stakeMinor < 0n || row.payoutMinor < 0n) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_NEGATIVE_VALUE',
        'B1 scenario cash-flow values must be non-negative integer minor units.',
        'Non-negative B1 integer minor-unit scenario cash-flow rows.',
      );
    }
  }

  const scenarioIds = [...new Set(rows.map((row) => row.scenarioId))].sort();
  const selectionKeys = [...new Set(rows.map((row) => row.selectionEquivalenceKey))].sort();
  const legKeys = [...new Set(rows.map((row) => buildB1ScenarioLegKey(
    row.selectionEquivalenceKey,
    row.venueOrBookmakerId,
  )))].sort();
  if (scenarioIds.length !== 2 && scenarioIds.length !== 3) {
    return blocked(
      'B1_STAKE_VECTOR_OUTCOME_COUNT_UNSUPPORTED',
      'B1 scenario cash-flow validation supports only complete 2-way and 3-way terminal outcome sets.',
      'Complete B1 2-way or 3-way scenario cash-flow matrix.',
    );
  }
  if (selectionKeys.length !== scenarioIds.length) {
    return blocked(
      'B1_SCENARIO_CASHFLOW_MATRIX_INCOMPLETE',
      'B1 scenario cash-flow validation requires every leg to appear in every terminal scenario.',
      'Complete B1 scenario-by-selection cash-flow matrix.',
    );
  }
  if (legKeys.length !== selectionKeys.length) {
    return blocked(
      'B1_SCENARIO_CASHFLOW_LEG_KEY_DRIFT',
      'B1 scenario cash-flow validation requires each selection to keep one stable venue across terminal scenarios.',
      'Stable B1 scenario-by-leg-key coverage keyed by selection_equivalence_key and venue_or_bookmaker_id.',
    );
  }
  if (rows.length !== scenarioIds.length * legKeys.length) {
    return blocked(
      'B1_SCENARIO_CASHFLOW_MATRIX_INCOMPLETE',
      'B1 scenario cash-flow validation requires every leg to appear in every terminal scenario.',
      'Complete B1 scenario-by-leg-key cash-flow matrix.',
    );
  }

  const scenarioWinningSelectionKeys: string[] = [];
  for (const scenarioId of scenarioIds) {
    const rowsForScenario = rows.filter((row) => row.scenarioId === scenarioId);
    const winningSelectionKeys = [...new Set(rowsForScenario.map((row) => row.winningSelectionEquivalenceKey))].sort();
    if (winningSelectionKeys.length !== 1) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
        'B1 scenario cash-flow validation requires one declared winning selection per terminal scenario.',
        'One winning B1 terminal outcome per scenario.',
      );
    }
    const winningSelectionKey = winningSelectionKeys[0];
    if (winningSelectionKey === undefined) {
      throw new Error('B1 scenario cash-flow validation lost scenario winner after non-empty row validation.');
    }
    scenarioWinningSelectionKeys.push(winningSelectionKey);
    const rowsLegKeys = rowsForScenario.map((row) => buildB1ScenarioLegKey(
      row.selectionEquivalenceKey,
      row.venueOrBookmakerId,
    )).sort();
    for (let index = 0; index < legKeys.length; index += 1) {
      if (rowsLegKeys[index] !== legKeys[index]) {
        return blocked(
          'B1_SCENARIO_CASHFLOW_MATRIX_INCOMPLETE',
          'B1 scenario cash-flow validation requires every leg to appear in every terminal scenario.',
          'Complete B1 scenario-by-leg-key cash-flow matrix.',
        );
      }
    }
    const winningRows = rowsForScenario.filter((row) => row.payoutMinor > 0n);
    if (winningRows.length !== 1) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
        'B1 scenario cash-flow validation requires exactly one positive payout in each terminal scenario.',
        'One winning B1 terminal outcome per scenario.',
      );
    }
    const winningRow = winningRows[0];
    if (winningRow === undefined) {
      throw new Error('B1 scenario cash-flow validation lost winning row after winner count validation.');
    }
    if (winningRow.selectionEquivalenceKey !== winningSelectionKey) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
        'B1 scenario cash-flow validation requires the positive payout row to match the declared winner.',
        'One winning B1 terminal outcome per scenario.',
      );
    }
  }
  const sortedScenarioWinningSelectionKeys = [...scenarioWinningSelectionKeys].sort();
  for (let index = 0; index < selectionKeys.length; index += 1) {
    if (sortedScenarioWinningSelectionKeys[index] !== selectionKeys[index]) {
      return blocked(
        'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
        'B1 scenario cash-flow validation requires terminal winners to cover every compared selection exactly once.',
        'One winning B1 terminal outcome for each compared selection.',
      );
    }
  }

  return accepted(Object.freeze({ rows: Object.freeze([...rows].sort(compareCashflowRows)) }));
}

export function calculateB1PayoutMinor(stakeMinor: bigint, decimalOddsMicro: bigint): bigint {
  return (stakeMinor * decimalOddsMicro) / B1_DECIMAL_ODDS_SCALE_MICRO;
}

function validateB1TerminalScenarioSet(
  scenarios: readonly B1TerminalScenario[],
): BoundaryResult<readonly B1TerminalScenario[]> {
  if (scenarios.length !== 2 && scenarios.length !== 3) {
    return blocked(
      'B1_STAKE_VECTOR_OUTCOME_COUNT_UNSUPPORTED',
      'B1 scenario cash-flow construction supports only complete 2-way and 3-way terminal outcome sets.',
      'Complete B1 2-way or 3-way terminal scenario set.',
    );
  }
  const seen = new Set<string>();
  for (const scenario of scenarios) {
    if (!isRecord(scenario)) {
      return blocked(
        'B1_TERMINAL_SCENARIO_INVALID',
        'B1 scenario cash-flow construction requires structured terminal scenarios.',
        'Structured B1 terminal scenario inputs.',
      );
    }
    if (!isNonEmptyString(scenario.selectionEquivalenceKey) || !isNonEmptyString(scenario.scenarioId)) {
      return blocked(
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1 scenario cash-flow construction requires selection equivalence evidence for every terminal scenario.',
        'B1 terminal scenario selection_equivalence_key.',
      );
    }
    if (seen.has(scenario.selectionEquivalenceKey)) {
      return blocked(
        'B1_OUTCOME_SET_INCOMPLETE',
        'B1 scenario cash-flow construction requires one terminal scenario per outcome.',
        'Unique B1 terminal scenario selection_equivalence_key values.',
      );
    }
    seen.add(scenario.selectionEquivalenceKey);
  }
  return accepted(Object.freeze([...scenarios]));
}

function validateB1ScenarioCashflowLegTerm(
  term: B1ScenarioCashflowLegTerms,
): BoundaryResult<B1ScenarioCashflowLegTerms> {
  if (!isRecord(term)) {
    return blocked(
      'B1_SCENARIO_CASHFLOW_LEG_TERM_INVALID',
      'B1 scenario cash-flow leg terms must be structured objects.',
      'Structured B1 scenario cash-flow leg terms.',
    );
  }
  if (!isNonEmptyString(term.selectionEquivalenceKey)) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 scenario cash-flow leg terms require selection equivalence evidence.',
      'B1 leg term selection_equivalence_key.',
    );
  }
  if (!isNonEmptyString(term.venueOrBookmakerId)) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 scenario cash-flow leg terms require venue evidence.',
      'B1 leg term venue_or_bookmaker_id.',
    );
  }
  if (typeof term.stakeMinor !== 'bigint') {
    return blocked(
      'B1_STAKE_INVALID',
      'B1 scenario cash-flow leg terms require bigint integer minor-unit stakes.',
      'Bigint B1 stake in integer minor units.',
    );
  }
  if (typeof term.decimalOddsMicro !== 'bigint') {
    return blocked(
      'B1_DECIMAL_ODDS_INVALID',
      'B1 scenario cash-flow leg terms require bigint decimal odds micro values.',
      'Bigint B1 decimal odds scaled to micro units.',
    );
  }
  if (term.stakeMinor <= 0n) {
    return blocked(
      'B1_STAKE_NOT_POSITIVE',
      'B1 scenario cash-flow leg terms require positive integer minor-unit stakes.',
      'Positive B1 stake in integer minor units.',
    );
  }
  if (term.decimalOddsMicro <= B1_DECIMAL_ODDS_SCALE_MICRO) {
    return blocked(
      'B1_DECIMAL_ODDS_NOT_ABOVE_ONE',
      'B1 scenario cash-flow leg terms require decimal odds greater than one.',
      'B1 decimal odds greater than 1.000000.',
    );
  }
  return accepted(Object.freeze({ ...term }));
}

function legTermsBySelectionOrder(
  termsBySelection: ReadonlyMap<string, B1ScenarioCashflowLegTerms>,
): readonly B1ScenarioCashflowLegTerms[] {
  return Object.freeze([...termsBySelection.values()].sort(compareLegTerms));
}

function compareCashflowRows(left: B1ScenarioCashflowRow, right: B1ScenarioCashflowRow): number {
  const scenarioComparison = left.scenarioId.localeCompare(right.scenarioId);
  if (scenarioComparison !== 0) {
    return scenarioComparison;
  }
  const selectionComparison = left.selectionEquivalenceKey.localeCompare(right.selectionEquivalenceKey);
  if (selectionComparison !== 0) {
    return selectionComparison;
  }
  return left.venueOrBookmakerId.localeCompare(right.venueOrBookmakerId);
}

function compareLegTerms(left: B1ScenarioCashflowLegTerms, right: B1ScenarioCashflowLegTerms): number {
  const selectionComparison = left.selectionEquivalenceKey.localeCompare(right.selectionEquivalenceKey);
  if (selectionComparison !== 0) {
    return selectionComparison;
  }
  return left.venueOrBookmakerId.localeCompare(right.venueOrBookmakerId);
}

function buildB1ScenarioLegKey(selectionEquivalenceKey: string, venueOrBookmakerId: string): string {
  return `${selectionEquivalenceKey}\u0000${venueOrBookmakerId}`;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
