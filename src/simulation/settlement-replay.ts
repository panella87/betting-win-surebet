import type { BettingWinSettlementRecord } from '../contracts/betting-win-resource-records.js';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import type { StandardBinaryCompleteSet } from '../scenarios/complete-set.js';
import { standardBinaryTerminalScenarios } from '../scenarios/terminal-scenario.js';

const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/i;

export interface ConsumedSettlementReplay {
  readonly canonicalMarketId: string;
  readonly ruleProfileId: string;
  readonly resultSourceId: string;
  readonly finalityPolicyId: string;
  readonly finalityAuthorityId: string;
  readonly replayManifestHash: string;
  readonly replayAcceptedAt: string;
  readonly scenarioId: string;
  readonly finalOutcome: 'yes' | 'no';
}

export function consumeStandardBinarySettlementReplay(
  completeSet: StandardBinaryCompleteSet,
  settlementRecord: BettingWinSettlementRecord,
): BoundaryResult<ConsumedSettlementReplay> {
  if (settlementRecord.canonicalMarketId !== completeSet.canonicalMarketId) {
    return blocked(
      'SETTLEMENT_REPLAY_MARKET_IDENTITY_MISMATCH',
      'Settlement replay consumption requires the canonical market identity to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set market identity.',
    );
  }
  if (settlementRecord.ruleProfileId !== completeSet.ruleProfileId) {
    return blocked(
      'SETTLEMENT_REPLAY_RULE_PROFILE_MISMATCH',
      'Settlement replay consumption requires the rule profile to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set rule profile.',
    );
  }
  if (settlementRecord.resultSourceId !== completeSet.resultSourceId) {
    return blocked(
      'SETTLEMENT_REPLAY_RESULT_SOURCE_MISMATCH',
      'Settlement replay consumption requires the result source to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set result source.',
    );
  }
  if (settlementRecord.finalityPolicyId !== completeSet.finalityPolicyId) {
    return blocked(
      'SETTLEMENT_REPLAY_FINALITY_POLICY_MISMATCH',
      'Settlement replay consumption requires the finality policy to match the complete-set.',
      'Accepted local settlement replay fixture aligned to the complete-set finality policy.',
    );
  }
  if (settlementRecord.acceptanceStatus !== 'accepted') {
    return blocked(
      'SETTLEMENT_REPLAY_ACCEPTANCE_STATUS_INVALID',
      'Settlement replay consumption requires an accepted local settlement replay fixture.',
      'Accepted local settlement replay fixture.',
    );
  }
  if (settlementRecord.finalityAuthorityId.trim().length === 0) {
    return blocked(
      'SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISSING',
      'Settlement replay consumption requires a finality authority id.',
      'Accepted local settlement replay finality authority.',
    );
  }
  if (!MANIFEST_HASH_REGEX.test(settlementRecord.replayManifestHash)) {
    return blocked(
      'SETTLEMENT_REPLAY_MANIFEST_HASH_INVALID',
      'Settlement replay consumption requires a 64-character hexadecimal replay manifest hash.',
      'Accepted local settlement replay manifest hash.',
    );
  }

  const matchingScenario = standardBinaryTerminalScenarios().find(
    (scenario) =>
      scenario.winningOutcome === settlementRecord.finalOutcome && completeSet.scenarioIds.includes(scenario.scenarioId),
  );
  if (!matchingScenario) {
    return blocked(
      'SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
      'Settlement replay consumption requires a terminal scenario that matches the accepted final outcome.',
      'Validated standard-binary terminal scenarios for the complete-set.',
    );
  }

  return accepted(
    Object.freeze({
      canonicalMarketId: settlementRecord.canonicalMarketId,
      ruleProfileId: settlementRecord.ruleProfileId,
      resultSourceId: settlementRecord.resultSourceId,
      finalityPolicyId: settlementRecord.finalityPolicyId,
      finalityAuthorityId: settlementRecord.finalityAuthorityId,
      replayManifestHash: settlementRecord.replayManifestHash,
      replayAcceptedAt: settlementRecord.replayAcceptedAt,
      scenarioId: matchingScenario.scenarioId,
      finalOutcome: settlementRecord.finalOutcome,
    }),
  );
}
