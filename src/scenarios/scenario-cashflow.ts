import { accepted, blocked, type BoundaryResult, type OutcomeSide, type ScenarioCashflowRow } from '../contracts/local-types.js';
import type { StandardBinaryCompleteSet } from './complete-set.js';
import { standardBinaryTerminalScenarios } from './terminal-scenario.js';

export interface ScenarioCashflowMatrix {
  readonly rows: readonly ScenarioCashflowRow[];
}

export interface ScenarioCashflowLegTerms {
  readonly legId: string;
  readonly stakeMinor: bigint;
  readonly payoutMinor: bigint;
}

export function validateScenarioCashflowMatrix(rows: readonly ScenarioCashflowRow[]): BoundaryResult<ScenarioCashflowMatrix> {
  if (rows.length === 0) {
    return blocked('SCENARIO_CASHFLOW_EMPTY', 'Scenario cash-flow rows are required.', 'Complete scenario cash-flow matrix.');
  }
  for (const row of rows) {
    if (row.stakeMinor < 0n || row.payoutMinor < 0n || row.feeMinor < 0n || row.costMinor < 0n) {
      return blocked('SCENARIO_CASHFLOW_NEGATIVE_VALUE', 'Cash-flow values must be non-negative fixed-point amounts.', 'Non-negative fixed-point rows.');
    }
  }
  return accepted({ rows: Object.freeze([...rows]) });
}

export function buildStandardBinaryScenarioCashflowMatrix(
  completeSet: StandardBinaryCompleteSet,
  legTerms: readonly ScenarioCashflowLegTerms[],
): BoundaryResult<ScenarioCashflowMatrix> {
  const scenarioValidation = validateScenarioCoverage(completeSet.scenarioIds);
  if (!scenarioValidation.ok) {
    return scenarioValidation;
  }

  const termsByLegId = new Map<string, ScenarioCashflowLegTerms>();
  for (const term of legTerms) {
    if (termsByLegId.has(term.legId)) {
      return blocked(
        'SCENARIO_CASHFLOW_DUPLICATE_LEG_TERMS',
        'Scenario cash-flow terms must include exactly one stake and payout entry per leg.',
        'One deterministic stake and payout pair for each complete-set leg.',
      );
    }
    if (term.stakeMinor < 0n) {
      return blocked(
        'SCENARIO_CASHFLOW_STAKE_NEGATIVE',
        'Scenario cash-flow stakes must be non-negative fixed-point amounts.',
        'Non-negative fixed-point stake amounts for each complete-set leg.',
      );
    }
    if (term.payoutMinor < 0n) {
      return blocked(
        'SCENARIO_CASHFLOW_PAYOUT_NEGATIVE',
        'Scenario cash-flow payouts must be non-negative fixed-point amounts.',
        'Non-negative fixed-point payout amounts for each complete-set leg.',
      );
    }
    termsByLegId.set(term.legId, Object.freeze({ ...term }));
  }

  const rows: ScenarioCashflowRow[] = [];
  for (const scenario of standardBinaryTerminalScenarios()) {
    for (const leg of completeSet.legs) {
      if (!isOutcomeSide(leg.outcome)) {
        return blocked(
          'SCENARIO_CASHFLOW_OUTCOME_INVALID',
          'Scenario cash-flow builder requires standard-binary YES/NO legs.',
          'Validated standard-binary complete-set legs.',
        );
      }

      const quoteRecord = completeSet.quotesByOutcome[leg.outcome];
      if (!quoteRecord) {
        return blocked(
          'SCENARIO_CASHFLOW_QUOTE_MISSING',
          'Scenario cash-flow builder requires quote terms for every complete-set leg outcome.',
          'Validated local YES and NO quote records for the complete-set.',
        );
      }

      const term = termsByLegId.get(leg.legId);
      if (!term) {
        return blocked(
          'SCENARIO_CASHFLOW_TERMS_INCOMPLETE',
          'Scenario cash-flow builder requires one stake and payout pair for every complete-set leg.',
          'One deterministic stake and payout pair for each complete-set leg.',
        );
      }

      rows.push(
        Object.freeze({
          scenarioId: scenario.scenarioId,
          legId: leg.legId,
          stakeMinor: term.stakeMinor,
          payoutMinor: scenario.winningOutcome === leg.outcome ? term.payoutMinor : 0n,
          feeMinor: quoteRecord.feeMinor,
          costMinor: quoteRecord.costMinor,
        }),
      );
    }
  }

  if (termsByLegId.size !== completeSet.legs.length) {
    return blocked(
      'SCENARIO_CASHFLOW_UNKNOWN_LEG_TERMS',
      'Scenario cash-flow builder rejects stake and payout terms for unknown legs.',
      'Stake and payout terms aligned to the validated complete-set leg ids.',
    );
  }

  return validateScenarioCashflowMatrix(rows);
}

function validateScenarioCoverage(scenarioIds: readonly string[]): BoundaryResult<readonly string[]> {
  const expectedScenarios = standardBinaryTerminalScenarios().map((scenario) => scenario.scenarioId);
  if (scenarioIds.length !== expectedScenarios.length) {
    return blocked(
      'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
      'Scenario cash-flow builder requires every standard-binary terminal scenario.',
      'Complete YES-wins and NO-wins scenario coverage.',
    );
  }

  for (let index = 0; index < expectedScenarios.length; index += 1) {
    if (scenarioIds[index] !== expectedScenarios[index]) {
      return blocked(
        'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
        'Scenario cash-flow builder requires every standard-binary terminal scenario.',
        'Complete YES-wins and NO-wins scenario coverage.',
      );
    }
  }

  return accepted(Object.freeze([...scenarioIds]));
}

function isOutcomeSide(value: string): value is OutcomeSide {
  return value === 'yes' || value === 'no';
}
