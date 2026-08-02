import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';
import type { B1GrossQuoteContribution } from '../opportunity/b1-gross-spread.js';

export interface B1TerminalScenario {
  readonly scenarioId: string;
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly outcomeSide: string;
}

export function buildB1TerminalScenarios(
  selectedQuotes: readonly B1GrossQuoteContribution[],
): BoundaryResult<readonly B1TerminalScenario[]> {
  if (selectedQuotes.length !== 2 && selectedQuotes.length !== 3) {
    return blocked(
      'B1_STAKE_VECTOR_OUTCOME_COUNT_UNSUPPORTED',
      'B1 generalized stake-vector solving supports only complete 2-way and 3-way terminal outcome sets.',
      'Complete B1 2-way or 3-way selected quote set.',
    );
  }

  const seenSelections = new Set<string>();
  const scenarios: B1TerminalScenario[] = [];
  for (const quote of [...selectedQuotes].sort(compareSelectedQuotes)) {
    if (quote.selectionEquivalenceKey.length === 0) {
      return blocked(
        'B1_SELECTION_EQUIVALENCE_MISSING',
        'B1 terminal scenarios require selection equivalence evidence for every outcome.',
        'B1 selection_equivalence_key for every terminal outcome.',
      );
    }
    if (seenSelections.has(quote.selectionEquivalenceKey)) {
      return blocked(
        'B1_OUTCOME_SET_INCOMPLETE',
        'B1 terminal scenarios require one selected quote per terminal outcome.',
        'Unique B1 selection_equivalence_key values for the complete outcome set.',
      );
    }
    seenSelections.add(quote.selectionEquivalenceKey);
    scenarios.push(Object.freeze({
      scenarioId: `b1_terminal:${quote.selectionEquivalenceKey}`,
      selectionEquivalenceKey: quote.selectionEquivalenceKey,
      outcomeName: quote.outcomeName,
      outcomeSide: quote.outcomeSide,
    }));
  }

  return accepted(Object.freeze(scenarios));
}

function compareSelectedQuotes(left: B1GrossQuoteContribution, right: B1GrossQuoteContribution): number {
  const selectionComparison = left.selectionEquivalenceKey.localeCompare(right.selectionEquivalenceKey);
  if (selectionComparison !== 0) {
    return selectionComparison;
  }
  return left.venueOrBookmakerId.localeCompare(right.venueOrBookmakerId);
}
