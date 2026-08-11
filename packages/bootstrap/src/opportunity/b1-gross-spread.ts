import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';

export const B1_DECIMAL_ODDS_SCALE_MICRO = 1_000_000n;
export const B1_IMPLIED_PROBABILITY_SCALE_PPM = 1_000_000n;

export interface B1GrossQuoteInput {
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly outcomeSide: string;
  readonly venueOrBookmakerId: string;
  readonly decimalOdds: string;
}

export interface B1GrossQuoteContribution {
  readonly selectionEquivalenceKey: string;
  readonly outcomeName: string;
  readonly outcomeSide: string;
  readonly venueOrBookmakerId: string;
  readonly decimalOdds: string;
  readonly decimalOddsMicro: bigint;
  readonly impliedProbabilityPpm: bigint;
}

export interface B1GrossSpread {
  readonly grossSpreadKind: 'gross_only';
  readonly impliedProbabilityPpmSum: bigint;
  readonly grossSpreadPpm: bigint;
  readonly quoteContributions: readonly B1GrossQuoteContribution[];
}

export function calculateB1GrossSpread(
  quoteInputs: readonly B1GrossQuoteInput[],
): BoundaryResult<B1GrossSpread> {
  if (!Array.isArray(quoteInputs)) {
    return blocked(
      'B1_GROSS_QUOTE_INPUTS_INVALID',
      'B1 gross spread requires quote inputs as an array.',
      'Array of structured B1 terminal outcome quotes.',
    );
  }
  if (quoteInputs.length < 2) {
    return blocked(
      'B1_OUTCOME_SET_INCOMPLETE',
      'B1 gross spread requires at least two terminal outcome quotes.',
      'Complete B1 terminal outcome quote set.',
    );
  }

  const seenSelections = new Set<string>();
  const quoteContributions: B1GrossQuoteContribution[] = [];
  let impliedProbabilityPpmSum = 0n;
  for (const quoteInput of quoteInputs) {
    const contribution = buildB1GrossQuoteContribution(quoteInput);
    if (!contribution.ok) {
      return contribution;
    }
    if (seenSelections.has(contribution.value.selectionEquivalenceKey)) {
      return blocked(
        'B1_OUTCOME_SET_INCOMPLETE',
        'B1 gross spread requires one quote for each terminal outcome.',
        'Unique B1 selection_equivalence_key values in the selected quote set.',
      );
    }
    seenSelections.add(contribution.value.selectionEquivalenceKey);

    quoteContributions.push(contribution.value);
    impliedProbabilityPpmSum += contribution.value.impliedProbabilityPpm;
  }

  if (impliedProbabilityPpmSum >= B1_IMPLIED_PROBABILITY_SCALE_PPM) {
    return blocked(
      'B1_GROSS_SPREAD_NOT_POSITIVE',
      'B1 gross derivation requires the selected terminal outcome odds to sum below one implied probability.',
      'Cross-venue terminal outcome quotes with positive gross spread before net economics.',
    );
  }

  return accepted(Object.freeze({
    grossSpreadKind: 'gross_only',
    impliedProbabilityPpmSum,
    grossSpreadPpm: B1_IMPLIED_PROBABILITY_SCALE_PPM - impliedProbabilityPpmSum,
    quoteContributions: Object.freeze(quoteContributions),
  }));
}

export function buildB1GrossQuoteContribution(
  quoteInput: B1GrossQuoteInput,
): BoundaryResult<B1GrossQuoteContribution> {
  if (
    typeof quoteInput !== 'object'
    || quoteInput === null
    || Array.isArray(quoteInput)
    || typeof quoteInput.selectionEquivalenceKey !== 'string'
    || typeof quoteInput.outcomeName !== 'string'
    || typeof quoteInput.outcomeSide !== 'string'
    || typeof quoteInput.venueOrBookmakerId !== 'string'
    || typeof quoteInput.decimalOdds !== 'string'
  ) {
    return blocked(
      'B1_GROSS_QUOTE_INVALID',
      'B1 gross spread requires structured quote inputs with string identity and odds fields.',
      'Structured B1 quote input fields.',
    );
  }
  if (quoteInput.selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_SELECTION_EQUIVALENCE_MISSING',
      'B1 gross spread requires selection equivalence evidence for every terminal outcome.',
      'B1 selection_equivalence_key for every selected quote.',
    );
  }
  if (quoteInput.venueOrBookmakerId.length === 0) {
    return blocked(
      'B1_VENUE_PAIR_INCOMPLETE',
      'B1 gross spread requires venue evidence for every selected quote.',
      'B1 venue_or_bookmaker_id for every selected quote.',
    );
  }

  const decimalOddsMicro = parseB1DecimalOddsMicro(quoteInput.decimalOdds);
  if (!decimalOddsMicro.ok) {
    return decimalOddsMicro;
  }
  if (decimalOddsMicro.value <= B1_DECIMAL_ODDS_SCALE_MICRO) {
    return blocked(
      'B1_DECIMAL_ODDS_NOT_ABOVE_ONE',
      'B1 gross spread requires decimal odds greater than one for every selected quote.',
      'B1 decimal_odds greater than 1.000000.',
    );
  }

  return accepted(Object.freeze({
    selectionEquivalenceKey: quoteInput.selectionEquivalenceKey,
    outcomeName: quoteInput.outcomeName,
    outcomeSide: quoteInput.outcomeSide,
    venueOrBookmakerId: quoteInput.venueOrBookmakerId,
    decimalOdds: quoteInput.decimalOdds,
    decimalOddsMicro: decimalOddsMicro.value,
    impliedProbabilityPpm: ceilDiv(
      B1_DECIMAL_ODDS_SCALE_MICRO * B1_IMPLIED_PROBABILITY_SCALE_PPM,
      decimalOddsMicro.value,
    ),
  }));
}

export function parseB1DecimalOddsMicro(value: string): BoundaryResult<bigint> {
  if (typeof value !== 'string' || value.length === 0) {
    return blocked(
      'B1_DECIMAL_ODDS_INVALID',
      'B1 decimal odds must be a non-empty decimal string.',
      'B1 decimal_odds string.',
    );
  }

  const parts = value.split('.');
  if (parts.length > 2) {
    return blocked(
      'B1_DECIMAL_ODDS_INVALID',
      'B1 decimal odds must contain at most one decimal point.',
      'B1 decimal_odds string.',
    );
  }
  const whole = parts[0];
  if (whole === undefined || !/^(0|[1-9][0-9]*)$/.test(whole)) {
    return blocked(
      'B1_DECIMAL_ODDS_INVALID',
      'B1 decimal odds must have a valid non-negative whole-number component.',
      'B1 decimal_odds string.',
    );
  }

  const fractional = parts[1];
  if (fractional !== undefined && !/^[0-9]+$/.test(fractional)) {
    return blocked(
      'B1_DECIMAL_ODDS_INVALID',
      'B1 decimal odds fractional component must contain only digits.',
      'B1 decimal_odds string.',
    );
  }
  if (fractional !== undefined && fractional.length > 6) {
    return blocked(
      'B1_DECIMAL_ODDS_PRECISION_UNSUPPORTED',
      'B1 gross spread requires decimal odds precision no finer than six decimal places.',
      'B1 decimal_odds with at most six fractional digits.',
    );
  }

  const paddedFractional = fractional === undefined ? '000000' : `${fractional}${'0'.repeat(6 - fractional.length)}`;
  return accepted((BigInt(whole) * B1_DECIMAL_ODDS_SCALE_MICRO) + BigInt(paddedFractional));
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  if (numerator % denominator === 0n) {
    return quotient;
  }
  return quotient + 1n;
}
