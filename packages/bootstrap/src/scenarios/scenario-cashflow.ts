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
  if (!Array.isArray(rows)) {
    return blocked(
      'SCENARIO_CASHFLOW_ROWS_INVALID',
      'Scenario cash-flow rows must be supplied as an array.',
      'Array of structured scenario cash-flow rows.',
    );
  }
  if (rows.length === 0) {
    return blocked('SCENARIO_CASHFLOW_EMPTY', 'Scenario cash-flow rows are required.', 'Complete scenario cash-flow matrix.');
  }
  for (const row of rows) {
    if (!isRecord(row)) {
      return blocked(
        'SCENARIO_CASHFLOW_ROW_INVALID',
        'Scenario cash-flow rows must be structured objects.',
        'Structured scenario cash-flow rows.',
      );
    }
    if (!isNonEmptyString(row.scenarioId) || !isNonEmptyString(row.legId)) {
      return blocked(
        'SCENARIO_CASHFLOW_IDENTITY_INVALID',
        'Scenario cash-flow rows require non-empty scenario and leg identities.',
        'Non-empty scenarioId and legId values for every cash-flow row.',
      );
    }
    if (
      typeof row.stakeMinor !== 'bigint'
      || typeof row.payoutMinor !== 'bigint'
      || typeof row.feeMinor !== 'bigint'
      || typeof row.costMinor !== 'bigint'
    ) {
      return blocked(
        'SCENARIO_CASHFLOW_VALUE_INVALID',
        'Cash-flow values must be bigint fixed-point amounts.',
        'Bigint fixed-point rows for stake, payout, fee and cost.',
      );
    }
    if (row.stakeMinor < 0n || row.payoutMinor < 0n || row.feeMinor < 0n || row.costMinor < 0n) {
      return blocked('SCENARIO_CASHFLOW_NEGATIVE_VALUE', 'Cash-flow values must be non-negative fixed-point amounts.', 'Non-negative fixed-point rows.');
    }
  }
  const scenarioCoverage = validateScenarioCoverage([...new Set(rows.map((row) => row.scenarioId))].sort());
  if (!scenarioCoverage.ok) {
    return scenarioCoverage;
  }
  return accepted({ rows: Object.freeze([...rows]) });
}

export function buildStandardBinaryScenarioCashflowMatrix(
  completeSet: StandardBinaryCompleteSet,
  legTerms: readonly ScenarioCashflowLegTerms[],
): BoundaryResult<ScenarioCashflowMatrix> {
  if (
    !isRecord(completeSet)
    || !Array.isArray(completeSet.scenarioIds)
    || !Array.isArray(completeSet.legs)
    || !isRecord(completeSet.quotesByOutcome)
  ) {
    return blocked(
      'SCENARIO_CASHFLOW_COMPLETE_SET_INVALID',
      'Scenario cash-flow builder requires a structured standard-binary complete set.',
      'Validated standard-binary complete set with scenarios, legs and quote terms.',
    );
  }
  if (!Array.isArray(legTerms)) {
    return blocked(
      'SCENARIO_CASHFLOW_LEG_TERMS_INVALID',
      'Scenario cash-flow terms must be supplied as an array.',
      'Array of structured stake and payout terms for each complete-set leg.',
    );
  }

  const scenarioValidation = validateScenarioCoverage(completeSet.scenarioIds);
  if (!scenarioValidation.ok) {
    return scenarioValidation;
  }

  const termsByLegId = new Map<string, ScenarioCashflowLegTerms>();
  for (const term of legTerms) {
    if (!isRecord(term)) {
      return blocked(
        'SCENARIO_CASHFLOW_LEG_TERMS_INVALID',
        'Scenario cash-flow terms must be structured objects.',
        'Structured stake and payout terms for each complete-set leg.',
      );
    }
    if (!isNonEmptyString(term.legId)) {
      return blocked(
        'SCENARIO_CASHFLOW_LEG_TERMS_INVALID',
        'Scenario cash-flow terms require non-empty leg identities.',
        'Non-empty legId values for each complete-set leg term.',
      );
    }
    if (termsByLegId.has(term.legId)) {
      return blocked(
        'SCENARIO_CASHFLOW_DUPLICATE_LEG_TERMS',
        'Scenario cash-flow terms must include exactly one stake and payout entry per leg.',
        'One deterministic stake and payout pair for each complete-set leg.',
      );
    }
    if (typeof term.stakeMinor !== 'bigint') {
      return blocked(
        'SCENARIO_CASHFLOW_STAKE_INVALID',
        'Scenario cash-flow stakes must be bigint fixed-point amounts.',
        'Bigint fixed-point stake amounts for each complete-set leg.',
      );
    }
    if (typeof term.payoutMinor !== 'bigint') {
      return blocked(
        'SCENARIO_CASHFLOW_PAYOUT_INVALID',
        'Scenario cash-flow payouts must be bigint fixed-point amounts.',
        'Bigint fixed-point payout amounts for each complete-set leg.',
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
    termsByLegId.set(term.legId, Object.freeze({
      legId: term.legId,
      stakeMinor: term.stakeMinor,
      payoutMinor: term.payoutMinor,
    }));
  }

  const rows: ScenarioCashflowRow[] = [];
  for (const scenario of standardBinaryTerminalScenarios()) {
    for (const leg of completeSet.legs) {
      if (!isRecord(leg)) {
        return blocked(
          'SCENARIO_CASHFLOW_LEG_INVALID',
          'Scenario cash-flow builder requires structured complete-set legs.',
          'Structured standard-binary complete-set legs.',
        );
      }
      if (!isNonEmptyString(leg.legId)) {
        return blocked(
          'SCENARIO_CASHFLOW_LEG_INVALID',
          'Scenario cash-flow builder requires complete-set legs with non-empty leg ids.',
          'Structured standard-binary complete-set legs with legId.',
        );
      }
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
  const expectedScenarios = standardBinaryTerminalScenarios().map((scenario) => scenario.scenarioId).sort();
  const actualScenarios = [...scenarioIds].sort();
  if (actualScenarios.length !== expectedScenarios.length) {
    return blocked(
      'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
      'Scenario cash-flow builder requires every standard-binary terminal scenario.',
      'Complete YES-wins and NO-wins scenario coverage.',
    );
  }

  for (let index = 0; index < expectedScenarios.length; index += 1) {
    if (actualScenarios[index] !== expectedScenarios[index]) {
      return blocked(
        'SCENARIO_CASHFLOW_SCENARIOS_INCOMPLETE',
        'Scenario cash-flow builder requires every standard-binary terminal scenario.',
        'Complete YES-wins and NO-wins scenario coverage.',
      );
    }
  }

  return accepted(Object.freeze([...actualScenarios]));
}

function isOutcomeSide(value: unknown): value is OutcomeSide {
  return value === 'yes' || value === 'no';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
