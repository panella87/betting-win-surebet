import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createB1FalsePositiveReport,
} from '../src/reporting/b1-false-positive-report.js';

test('B1 false-positive report records deterministic settlement and void-rule metrics', () => {
  const result = createB1FalsePositiveReport(Object.freeze([
    Object.freeze({
      candidateId: 'candidate-positive',
      settlementStatus: 'accepted',
      settledNetMinor: 1_000n,
      falsePositive: false,
    }),
    Object.freeze({
      candidateId: 'candidate-false-positive',
      settlementStatus: 'accepted',
      settledNetMinor: -500n,
      falsePositive: true,
    }),
    Object.freeze({
      candidateId: 'candidate-blocked',
      settlementStatus: 'blocked',
      blockers: Object.freeze([
        Object.freeze({
          code: 'B1_VOID_RULE_MISMATCH',
          message: 'void mismatch',
          evidenceRequired: 'compatible void rules',
        }),
        Object.freeze({
          code: 'B1_SETTLEMENT_RULE_MISMATCH',
          message: 'settlement mismatch',
          evidenceRequired: 'compatible settlement rules',
        }),
      ]),
    }),
  ]));

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    reportKind: 'deterministic_b1_false_positive_report',
    candidateCount: 3,
    acceptedSettlementCount: 2,
    blockedSettlementCount: 1,
    falsePositiveCount: 1,
    falsePositiveRateBps: 5_000n,
    settlementMismatchBlockCount: 1,
    voidRuleMismatchBlockCount: 1,
    settlementCompatibilityBlockCount: 0,
    observations: [
      {
        candidateId: 'candidate-positive',
        settlementStatus: 'accepted',
        settledNetMinor: 1_000n,
        falsePositive: false,
      },
      {
        candidateId: 'candidate-false-positive',
        settlementStatus: 'accepted',
        settledNetMinor: -500n,
        falsePositive: true,
      },
      {
        candidateId: 'candidate-blocked',
        settlementStatus: 'blocked',
        blockers: [
          {
            code: 'B1_VOID_RULE_MISMATCH',
            message: 'void mismatch',
            evidenceRequired: 'compatible void rules',
          },
          {
            code: 'B1_SETTLEMENT_RULE_MISMATCH',
            message: 'settlement mismatch',
            evidenceRequired: 'compatible settlement rules',
          },
        ],
      },
    ],
    executable: false,
    liveReadiness: 'not_authorized_bws_900_parked',
  });
});

test('B1 false-positive report fails closed when accepted settlement metrics are incomplete', () => {
  const result = createB1FalsePositiveReport(Object.freeze([
    Object.freeze({
      candidateId: 'candidate-incomplete',
      settlementStatus: 'accepted',
      settledNetMinor: 0n,
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FALSE_POSITIVE_ACCEPTED_OBSERVATION_INCOMPLETE',
      message: 'B1 false-positive reporting requires settled net and false-positive status for accepted settlement replays.',
      evidenceRequired: 'Accepted B1 settlement replay observation with settledNetMinor and falsePositive fields.',
    },
  ]);
});

test('B1 false-positive report refuses an ambiguous zero-denominator rate', () => {
  const result = createB1FalsePositiveReport(Object.freeze([
    Object.freeze({
      candidateId: 'candidate-blocked',
      settlementStatus: 'blocked',
      blockers: Object.freeze([
        Object.freeze({
          code: 'B1_SETTLEMENT_COMPATIBILITY_UNKNOWN',
          message: 'unknown',
          evidenceRequired: 'explicit compatibility',
        }),
      ]),
    }),
  ]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    {
      code: 'B1_FALSE_POSITIVE_RATE_DENOMINATOR_MISSING',
      message: 'B1 false-positive reporting requires at least one accepted settlement replay to compute a deterministic rate.',
      evidenceRequired: 'At least one accepted B1 settlement replay observation.',
    },
  ]);
});
