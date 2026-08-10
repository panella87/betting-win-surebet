import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeB1SettlementReplay,
  type B1SettlementReplayRecord,
} from '../src/simulation/b1-settlement-replay.js';
import type { B1FillabilitySimulation } from '../src/simulation/b1-leg-completion.js';

test('B1 settlement replay accepts compatible filled legs and records deterministic positive settlement', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    replayKind: 'deterministic_b1_settlement_replay',
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    finalOutcomeSelectionEquivalenceKey: 'event-001:moneyline:away',
    finalScenarioId: 'b1_terminal:event-001:moneyline:away',
    settledNetMinor: 1_000n,
    falsePositive: false,
    falsePositiveReason: 'none',
    replayCount: 2,
    uniqueReplayCount: 1,
    correctionCount: 0,
    finalityProgressionCount: 0,
    voidRuleReplay: {
      replayKind: 'deterministic_b1_void_rule_replay',
      settlementRuleVersion: 'settlement-rule-v1',
      voidRuleId: 'void-rule-push-refund-v1',
      comparedLegCount: 2,
      settlementCompatibility: 'compatible',
    },
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  });
});

test('B1 settlement replay marks non-positive settled net as a false positive metric', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: partialSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:home'),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.settledNetMinor, -5_000n);
  assert.equal(result.value.falsePositive, true);
  assert.equal(result.value.falsePositiveReason, 'settled_net_non_positive');
});

test('B1 settlement replay rejects whitespace-only finality authority evidence', () => {
  const records = settlementRecords('event-001:moneyline:away').map((record) => Object.freeze({
    ...record,
    finalityAuthorityId: '   ',
  }));

  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: records,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_FINALITY_AUTHORITY_MISSING',
      message: 'B1 settlement replay requires explicit finality authority evidence.',
      evidenceRequired: 'B1 settlement replay finality_authority_id.',
    },
  ]);
});

test('B1 settlement replay rejects candidate ids that differ from fillability evidence', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-c',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_CANDIDATE_ID_MISMATCH',
      message: 'B1 settlement replay requires the caller candidate id to match fillability simulation evidence.',
      evidenceRequired: 'B1 settlement replay input aligned to the fillability simulation candidate id.',
    },
  ]);
});

test('B1 settlement replay rejects incomplete fillability simulations without residual exposure evidence', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: partialSimulationWithoutResidualExposure(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_MISSING',
      message: 'B1 settlement replay requires residual exposure evidence for incomplete fillability simulations.',
      evidenceRequired: 'B1 residual exposure output from the validated fillability simulation.',
    },
  ]);
});

test('B1 settlement replay rejects incomplete fillability simulations missing the final residual scenario', () => {
  const simulation = partialSimulation();
  const residualExposure = simulation.residualExposure;
  assert.ok(residualExposure);

  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      residualExposure: Object.freeze({
        ...residualExposure,
        scenarioNets: Object.freeze(residualExposure.scenarioNets.filter(
          (scenarioNet) => scenarioNet.scenarioId !== 'b1_terminal:event-001:moneyline:away',
        )),
      }),
    }),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RESIDUAL_SCENARIO_MISSING',
      message: 'B1 settlement replay requires residual exposure coverage for every terminal scenario.',
      evidenceRequired: 'Complete B1 residual exposure scenario nets aligned to the scenario cash-flow matrix.',
    },
  ]);
});

test('B1 settlement replay rejects residual exposure that contradicts settled final scenario net', () => {
  const simulation = partialSimulation();
  const residualExposure = simulation.residualExposure;
  assert.ok(residualExposure);

  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      residualExposure: Object.freeze({
        ...residualExposure,
        scenarioNets: Object.freeze(residualExposure.scenarioNets.map((scenarioNet) =>
          scenarioNet.scenarioId === 'b1_terminal:event-001:moneyline:away'
            ? Object.freeze({ ...scenarioNet, netMinor: 5_501n })
            : scenarioNet,
        )),
      }),
    }),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RESIDUAL_RECONCILIATION_MISMATCH',
      message: 'B1 settlement replay requires the settled final scenario net to match residual exposure evidence.',
      evidenceRequired: 'B1 residual exposure scenario nets reconciled to the accepted settlement replay.',
    },
  ]);
});

test('B1 settlement replay rejects stale residual exposure for non-final scenario nets', () => {
  const simulation = partialSimulation();
  const residualExposure = simulation.residualExposure;
  assert.ok(residualExposure);

  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      residualExposure: Object.freeze({
        ...residualExposure,
        scenarioNets: Object.freeze(residualExposure.scenarioNets.map((scenarioNet) =>
          scenarioNet.scenarioId === 'b1_terminal:event-001:moneyline:home'
            ? Object.freeze({ ...scenarioNet, netMinor: -5_001n })
            : scenarioNet,
        )),
      }),
    }),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RESIDUAL_RECONCILIATION_MISMATCH',
      message: 'B1 settlement replay requires residual exposure scenario nets to match fillability evidence.',
      evidenceRequired: 'Fresh B1 residual exposure scenario nets derived from the fillability simulation.',
    },
  ]);
});

test('B1 settlement replay rejects partial correction manifests before final replay selection', () => {
  const initialRecords = settlementRecords('event-001:moneyline:away');
  const correctionRecords = settlementRecords('event-001:moneyline:home');
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: Object.freeze([
      ...initialRecords,
      Object.freeze({
        ...(correctionRecords[0] as B1SettlementReplayRecord),
        replayManifestHash: 'b'.repeat(64),
        replayAcceptedAtUtc: '2026-07-01T02:01:00.000Z',
      }),
    ]),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_LEG_MISSING',
      message: 'B1 settlement replay requires each replay manifest to contain settlement evidence for every compared leg.',
      evidenceRequired: 'Complete per-manifest B1 settlement replay records aligned to every compared leg.',
    },
  ]);
});

test('B1 settlement replay accepts complete later correction manifests', () => {
  const initialRecords = settlementRecords('event-001:moneyline:away');
  const correctionRecords = settlementRecords('event-001:moneyline:home').map((record) => Object.freeze({
    ...record,
    replayManifestHash: 'b'.repeat(64),
    replayAcceptedAtUtc: '2026-07-01T02:01:00.000Z',
  }));
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: Object.freeze([
      ...initialRecords,
      ...correctionRecords,
    ]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.finalOutcomeSelectionEquivalenceKey, 'event-001:moneyline:home');
  assert.equal(result.value.finalScenarioId, 'b1_terminal:event-001:moneyline:home');
  assert.equal(result.value.replayCount, 4);
  assert.equal(result.value.uniqueReplayCount, 2);
  assert.equal(result.value.correctionCount, 1);
});

test('B1 settlement replay rejects malformed fillability snapshots before settled-net arithmetic', () => {
  const simulation = filledSimulation();
  const secondLeg = simulation.legs[1];
  assert.ok(secondLeg);
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      legs: Object.freeze([
        leg('event-001:moneyline:away', 'venue-b', 10_000n, -5_000n, 'leg_partial'),
        secondLeg,
      ]),
    }),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      message: 'B1 settlement replay requires non-negative fillability snapshot stake values.',
      evidenceRequired: 'Non-negative B1 live filled and unfilled stake values.',
    },
  ]);
});

test('B1 settlement replay blocks calendar-invalid replay acceptance timestamps', () => {
  const records = settlementRecords('event-001:moneyline:away').map((record) => Object.freeze({
    ...record,
    replayAcceptedAtUtc: '2026-02-31T02:00:00.000Z',
  }));

  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: records,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_ACCEPTED_AT_INVALID',
      message: 'B1 settlement replay requires ISO-8601 UTC replay acceptance timestamps.',
      evidenceRequired: 'B1 replayAcceptedAtUtc timestamp in ISO-8601 UTC form.',
    },
  ]);
});

test('B1 settlement replay analysis is not reached for malformed scenario winner matrices', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: malformedWinnerMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_WINNER_INVALID',
      message: 'B1 scenario cash-flow validation requires the positive payout row to match the declared winner.',
      evidenceRequired: 'One winning B1 terminal outcome per scenario.',
    },
  ]);
});

test('B1 settlement replay blocks unknown settlement compatibility before false-positive analysis', () => {
  const records = settlementRecords('event-001:moneyline:away').map((record) => Object.freeze({
    ...record,
    settlementCompatibilityFlag: 'incompatible' as const,
  }));
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: records,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      message: 'B1 settlement replay requires explicit compatible settlement evidence before false-positive analysis.',
      evidenceRequired: 'B1 settlement_compatibility_flag=compatible for every compared leg.',
    },
  ]);
});

test('B1 settlement replay blocks cross-venue void-rule mismatch', () => {
  const records = settlementRecords('event-001:moneyline:away');
  const mismatched = Object.freeze([
    records[0] as B1SettlementReplayRecord,
    Object.freeze({
      ...(records[1] as B1SettlementReplayRecord),
      voidRuleId: 'void-rule-dead-heat-v2',
      replayManifestHash: 'b'.repeat(64),
    }),
  ] as const);
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: mismatched,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_VOID_RULE_MISMATCH',
      message: 'B1 settlement replay blocks cross-venue candidates with mismatched void rules.',
      evidenceRequired: 'One explicit compatible void_rule_id across every compared B1 leg.',
    },
  ]);
});

test('B1 settlement replay blocks unresolved final outcome scenarios', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:draw'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_SCENARIO_UNRESOLVED',
      message: 'B1 settlement replay requires the final outcome to resolve to one terminal B1 scenario.',
      evidenceRequired: 'B1 terminal scenario matching the accepted settlement final outcome.',
    },
  ]);
});

function settlementRecords(finalOutcomeSelectionEquivalenceKey: string): readonly B1SettlementReplayRecord[] {
  return Object.freeze([
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:away',
      venueOrBookmakerId: 'venue-b',
      settlementRuleVersion: 'settlement-rule-v1',
      settlementCompatibilityFlag: 'compatible',
      voidRuleId: 'void-rule-push-refund-v1',
      replayManifestHash: 'a'.repeat(64),
      replayAcceptedAtUtc: '2026-07-01T02:00:00.000Z',
      finalityAuthorityId: 'finality-authority-001',
      finalOutcomeSelectionEquivalenceKey,
    }),
    Object.freeze({
      selectionEquivalenceKey: 'event-001:moneyline:home',
      venueOrBookmakerId: 'venue-a',
      settlementRuleVersion: 'settlement-rule-v1',
      settlementCompatibilityFlag: 'compatible',
      voidRuleId: 'void-rule-push-refund-v1',
      replayManifestHash: 'a'.repeat(64),
      replayAcceptedAtUtc: '2026-07-01T02:00:00.000Z',
      finalityAuthorityId: 'finality-authority-001',
      finalOutcomeSelectionEquivalenceKey,
    }),
  ]);
}

function filledSimulation(): B1FillabilitySimulation {
  return Object.freeze({
    simulationKind: 'deterministic_b1_fill_rejection_timeout_simulation',
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    groupState: 'group_filled',
    legs: Object.freeze([
      leg('event-001:moneyline:away', 'venue-b', 10_000n, 10_000n, 'leg_filled'),
      leg('event-001:moneyline:home', 'venue-a', 10_000n, 10_000n, 'leg_filled'),
    ]),
    executable: false,
    unwindAttempted: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  });
}

function partialSimulation(): B1FillabilitySimulation {
  return Object.freeze({
    simulationKind: 'deterministic_b1_fill_rejection_timeout_simulation',
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    groupState: 'group_incomplete',
    legs: Object.freeze([
      leg('event-001:moneyline:away', 'venue-b', 10_000n, 5_000n, 'leg_partial'),
      leg('event-001:moneyline:home', 'venue-a', 10_000n, 0n, 'leg_timed_out'),
    ]),
    residualExposure: Object.freeze({
      exposureKind: 'deterministic_b1_residual_exposure',
      exposedLegIds: Object.freeze(['b1_leg:event-001:moneyline:away:venue-b']),
      excludedLegIds: Object.freeze(['b1_leg:event-001:moneyline:home:venue-a']),
      scenarioNets: Object.freeze([
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:away',
          winningSelectionEquivalenceKey: 'event-001:moneyline:away',
          netMinor: 5_500n,
        }),
        Object.freeze({
          scenarioId: 'b1_terminal:event-001:moneyline:home',
          winningSelectionEquivalenceKey: 'event-001:moneyline:home',
          netMinor: -5_000n,
        }),
      ]),
      worstCaseNetMinor: -5_000n,
      worstCaseScenarioId: 'b1_terminal:event-001:moneyline:home',
      maxResidualExposureMinor: 5_000n,
      residualExposureWithinLimit: true,
    }),
    executable: false,
    unwindAttempted: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  });
}

function partialSimulationWithoutResidualExposure(): B1FillabilitySimulation {
  return Object.freeze({
    simulationKind: 'deterministic_b1_fill_rejection_timeout_simulation',
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    groupState: 'group_incomplete',
    legs: partialSimulation().legs,
    executable: false,
    unwindAttempted: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  });
}

function leg(
  selectionEquivalenceKey: string,
  venueOrBookmakerId: string,
  plannedStakeMinor: bigint,
  liveFilledStakeMinor: bigint,
  state: 'leg_filled' | 'leg_partial' | 'leg_timed_out',
) {
  return Object.freeze({
    legId: `b1_leg:${selectionEquivalenceKey}:${venueOrBookmakerId}`,
    selectionEquivalenceKey,
    venueOrBookmakerId,
    plannedStakeMinor,
    liveFilledStakeMinor,
    unfilledStakeMinor: plannedStakeMinor - liveFilledStakeMinor,
    terminalDisposition: state === 'leg_timed_out' ? 'timed_out' as const : 'none' as const,
    updatedAtUtc: '2026-07-01T00:00:04.000Z',
    state,
  });
}

function twoWayMatrix() {
  return Object.freeze({
    rows: Object.freeze([
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 10_000n,
        payoutMinor: 21_000n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        stakeMinor: 10_000n,
        payoutMinor: 0n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 10_000n,
        payoutMinor: 0n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        stakeMinor: 10_000n,
        payoutMinor: 21_000n,
      }),
    ]),
  });
}

function malformedWinnerMatrix() {
  return Object.freeze({
    rows: Object.freeze([
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 10_000n,
        payoutMinor: 0n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:away',
        winningSelectionEquivalenceKey: 'event-001:moneyline:away',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        stakeMinor: 10_000n,
        payoutMinor: 21_000n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:away',
        venueOrBookmakerId: 'venue-b',
        stakeMinor: 10_000n,
        payoutMinor: 21_000n,
      }),
      Object.freeze({
        scenarioId: 'b1_terminal:event-001:moneyline:home',
        winningSelectionEquivalenceKey: 'event-001:moneyline:home',
        selectionEquivalenceKey: 'event-001:moneyline:home',
        venueOrBookmakerId: 'venue-a',
        stakeMinor: 10_000n,
        payoutMinor: 0n,
      }),
    ]),
  });
}
