import type { TerminalScenario } from '../contracts/local-types.js';

export function standardBinaryTerminalScenarios(): readonly TerminalScenario[] {
  return Object.freeze([
    Object.freeze({ scenarioId: 'yes_wins', winningOutcome: 'yes', description: 'YES resolves as the winning outcome.' }),
    Object.freeze({ scenarioId: 'no_wins', winningOutcome: 'no', description: 'NO resolves as the winning outcome.' }),
  ]);
}
