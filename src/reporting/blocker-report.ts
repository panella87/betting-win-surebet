import type { Blocker } from '../contracts/local-types.js';

export function summarizeBlockers(blockers: readonly Blocker[]): string {
  if (blockers.length === 0) return 'no_blockers_recorded';
  return blockers.map((blocker) => `${blocker.code}: ${blocker.evidenceRequired}`).join('\n');
}
