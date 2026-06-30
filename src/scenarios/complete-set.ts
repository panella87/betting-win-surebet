import { accepted, blocked, type BoundaryResult, type CompleteSetLeg } from '../contracts/local-types.js';
import { standardBinaryTerminalScenarios } from './terminal-scenario.js';

export interface StandardBinaryCompleteSet {
  readonly legs: readonly CompleteSetLeg[];
  readonly scenarioIds: readonly string[];
}

export function validateStandardBinaryCompleteSet(legs: readonly CompleteSetLeg[]): BoundaryResult<StandardBinaryCompleteSet> {
  const outcomeSet = new Set(legs.map((leg) => leg.outcome));
  if (legs.length !== 2 || outcomeSet.size !== 2 || !outcomeSet.has('yes') || !outcomeSet.has('no')) {
    return blocked('NOT_STANDARD_BINARY_COMPLETE_SET', 'The first lane requires exactly one yes leg and one no leg.', 'Canonical yes/no complete-set legs.');
  }
  return accepted({
    legs: Object.freeze([...legs]),
    scenarioIds: standardBinaryTerminalScenarios().map((scenario) => scenario.scenarioId),
  });
}
