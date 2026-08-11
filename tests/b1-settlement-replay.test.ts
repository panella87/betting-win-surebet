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

test('B1 settlement replay rejects malformed top-level input containers without throwing', () => {
  const result = analyzeB1SettlementReplay(null as never);
  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_INPUT_INVALID',
      message: 'B1 settlement replay requires structured analysis input.',
      evidenceRequired: 'Structured B1 settlement replay analysis input.',
    },
  ]);

  const arrayResult = analyzeB1SettlementReplay([] as never);
  assert.equal(arrayResult.ok, false);
  assert.equal(arrayResult.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_INPUT_INVALID');

  const malformedFillabilitySimulation = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: null,
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  } as never);
  assert.equal(malformedFillabilitySimulation.ok, false);
  assert.equal(malformedFillabilitySimulation.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID');
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

test('B1 settlement replay fails closed on fractional partial payout scaling', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: fractionalPartialPayoutMatrix(),
    fillabilitySimulation: partialSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_PAYOUT_SCALING_FRACTIONAL',
      message: 'B1 settlement replay requires partial payout scaling to resolve to integer minor units.',
      evidenceRequired: 'B1 settled scenario payout scaling with no fractional minor-unit remainder.',
    },
  ]);
});

test('B1 settlement replay blocks zero-stake matrix rows before settled-net arithmetic', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: zeroStakeMatrix(),
    fillabilitySimulation: partialSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_STAKE_NOT_POSITIVE',
      message: 'B1 scenario cash-flow validation requires positive stake rows.',
      evidenceRequired: 'Positive B1 scenario cash-flow stake amounts in integer minor units.',
    },
  ]);
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

test('B1 settlement replay rejects forged aggregate group state before residual replay decisions', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...partialSimulationWithoutResidualExposure(),
      groupState: 'group_filled',
    }),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_FILLABILITY_GROUP_STATE_MISMATCH',
      message: 'B1 settlement replay requires aggregate fillability group state to match leg snapshots.',
      evidenceRequired: 'B1 fillability simulation groupState derived from validated leg snapshots.',
    },
  ]);
});

test('B1 settlement replay rejects over-limit incomplete residual exposure evidence', () => {
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
        maxResidualExposureMinor: 4_999n,
        residualExposureWithinLimit: false,
      }),
    }),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_OVER_LIMIT',
      message: 'B1 settlement replay requires incomplete residual exposure evidence to stay within the configured exposure limit.',
      evidenceRequired: 'B1 residual exposure evidence with residualExposureWithinLimit=true.',
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

test('B1 settlement replay rejects malformed top-level matrix containers without throwing', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: null,
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  } as never);

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_MATRIX_INVALID',
      message: 'B1 settlement replay requires a structured scenario cash-flow matrix.',
      evidenceRequired: 'Structured B1 scenario cash-flow matrix with rows.',
    },
  ]);

  const malformedRows = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: { rows: null },
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  } as never);

  assert.equal(malformedRows.ok, false);
  assert.equal(malformedRows.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_MATRIX_INVALID');

  const malformedMatrixArray = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: [],
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  } as never);
  assert.equal(malformedMatrixArray.ok, false);
  assert.equal(malformedMatrixArray.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_MATRIX_INVALID');
});

test('B1 settlement replay rejects null fillability snapshots without throwing', () => {
  const simulation = filledSimulation();
  const secondLeg = simulation.legs[1];
  assert.ok(secondLeg);
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      legs: Object.freeze([null, secondLeg]),
    }) as never,
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      message: 'B1 settlement replay requires structured fillability leg snapshots.',
      evidenceRequired: 'Structured B1 fillability leg snapshot objects.',
    },
  ]);

  const arraySnapshot = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      legs: Object.freeze([[], secondLeg]),
    }) as never,
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });
  assert.equal(arraySnapshot.ok, false);
  assert.equal(arraySnapshot.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID');
});

test('B1 settlement replay rejects non-bigint fillability stake fields without throwing', () => {
  const simulation = filledSimulation();
  const secondLeg = simulation.legs[1];
  assert.ok(secondLeg);
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      legs: Object.freeze([
        Object.freeze({
          ...leg('event-001:moneyline:away', 'venue-b', 10_000n, 10_000n, 'leg_filled'),
          liveFilledStakeMinor: 10_000,
        }),
        secondLeg,
      ]),
    }) as never,
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_FILLABILITY_SNAPSHOT_INVALID',
      message: 'B1 settlement replay requires integer minor-unit fillability snapshot stake fields.',
      evidenceRequired: 'B1 fillability snapshot stake fields encoded as bigint integer minor units.',
    },
  ]);
});

test('B1 settlement replay rejects malformed settlement records without throwing', () => {
  const malformedContainer = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: null,
  } as never);

  assert.equal(malformedContainer.ok, false);
  assert.equal(malformedContainer.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_RECORD_INVALID');

  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: Object.freeze([
      null,
      settlementRecords('event-001:moneyline:away')[1],
    ]) as never,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RECORD_INVALID',
      message: 'B1 settlement replay requires structured settlement replay records.',
      evidenceRequired: 'Structured B1 settlement replay record objects.',
    },
  ]);
});

test('B1 settlement replay rejects malformed residual exposure replay evidence without throwing', () => {
  const simulation = partialSimulation();
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      residualExposure: Object.freeze({
        ...simulation.residualExposure,
        scenarioNets: Object.freeze([null]),
      }),
    }) as never,
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID',
      message: 'B1 settlement replay requires typed residual exposure scenario nets.',
      evidenceRequired: 'B1 residual exposure scenario nets encoded with the expected runtime types.',
    },
  ]);

  const nullResidualExposure = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: Object.freeze({
      ...simulation,
      residualExposure: null,
    }) as never,
    settlementRecords: settlementRecords('event-001:moneyline:away'),
  });
  assert.equal(nullResidualExposure.ok, false);
  assert.equal(nullResidualExposure.blockers[0]?.code, 'B1_SETTLEMENT_REPLAY_RESIDUAL_EXPOSURE_INVALID');
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

test('B1 settlement replay analysis is not reached for scenario leg-key venue drift', () => {
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: venueDriftMatrix(),
    fillabilitySimulation: partialSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:home'),
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_SCENARIO_CASHFLOW_LEG_KEY_DRIFT',
      message: 'B1 scenario cash-flow validation requires each selection to keep one stable venue across terminal scenarios.',
      evidenceRequired: 'Stable B1 scenario-by-leg-key coverage keyed by selection_equivalence_key and venue_or_bookmaker_id.',
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

test('B1 settlement replay blocks whitespace-only rule and void-rule identifiers', () => {
  const blankSettlementRule = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away').map((record) => Object.freeze({
      ...record,
      settlementRuleVersion: '   ',
    })),
  });
  assert.equal(blankSettlementRule.ok, false);
  assert.deepEqual(blankSettlementRule.blockers, [
    {
      code: 'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      message: 'B1 settlement replay requires an explicit settlement rule version.',
      evidenceRequired: 'B1 settlement_rule_version for every compared leg.',
    },
  ]);

  const blankVoidRule = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: settlementRecords('event-001:moneyline:away').map((record) => Object.freeze({
      ...record,
      voidRuleId: '   ',
    })),
  });
  assert.equal(blankVoidRule.ok, false);
  assert.deepEqual(blankVoidRule.blockers, [
    {
      code: 'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
      message: 'B1 settlement replay requires an explicit void-rule id.',
      evidenceRequired: 'B1 void_rule_id for every compared leg.',
    },
  ]);
});

test('B1 settlement replay normalizes padded rule and void-rule identifiers', () => {
  const records = settlementRecords('event-001:moneyline:away');
  const result = analyzeB1SettlementReplay({
    candidateId: 'event-001:moneyline|venue-a|venue-b',
    matrix: twoWayMatrix(),
    fillabilitySimulation: filledSimulation(),
    settlementRecords: Object.freeze([
      Object.freeze({
        ...(records[0] as B1SettlementReplayRecord),
        settlementRuleVersion: ' settlement-rule-v1 ',
        voidRuleId: ' void-rule-push-refund-v1 ',
      }),
      records[1] as B1SettlementReplayRecord,
    ]),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.voidRuleReplay.settlementRuleVersion, 'settlement-rule-v1');
  assert.equal(result.value.voidRuleReplay.voidRuleId, 'void-rule-push-refund-v1');
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

function zeroStakeMatrix() {
  return Object.freeze({
    rows: Object.freeze(twoWayMatrix().rows.map((row, index) => Object.freeze({
      ...row,
      stakeMinor: index === 0 ? 0n : row.stakeMinor,
    }))),
  });
}

function venueDriftMatrix() {
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
        venueOrBookmakerId: 'venue-x',
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

function fractionalPartialPayoutMatrix() {
  return Object.freeze({
    rows: Object.freeze(twoWayMatrix().rows.map((row) => Object.freeze({
      ...row,
      payoutMinor: row.scenarioId === 'b1_terminal:event-001:moneyline:away'
        && row.selectionEquivalenceKey === 'event-001:moneyline:away'
        ? 21_001n
        : row.payoutMinor,
    }))),
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
