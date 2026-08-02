import {
  accepted,
  blocked,
  type BoundaryResult,
} from '../contracts/local-types.js';

export interface B1FeeMatrixEntry {
  readonly venueOrBookmakerId: string;
  readonly selectionEquivalenceKey: string;
  readonly feeBps: bigint;
  readonly fixedFeeMinor: bigint;
}

export interface B1FeeMatrix {
  readonly entries: readonly B1FeeMatrixEntry[];
}

export interface B1FeeCharge {
  readonly venueOrBookmakerId: string;
  readonly selectionEquivalenceKey: string;
  readonly stakeMinor: bigint;
  readonly feeBps: bigint;
  readonly fixedFeeMinor: bigint;
  readonly feeMinor: bigint;
}

export function calculateB1FeeCharge(
  matrix: B1FeeMatrix,
  venueOrBookmakerId: string,
  selectionEquivalenceKey: string,
  stakeMinor: bigint,
): BoundaryResult<B1FeeCharge> {
  const normalizedMatrix = normalizeB1FeeMatrix(matrix);
  if (!normalizedMatrix.ok) {
    return normalizedMatrix;
  }
  if (venueOrBookmakerId.length === 0) {
    return blocked(
      'B1_FEE_VENUE_MISSING',
      'B1 fee calculation requires an explicit venue for every selected quote.',
      'B1 selected quote venue_or_bookmaker_id.',
    );
  }
  if (selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_FEE_SELECTION_MISSING',
      'B1 fee calculation requires selection equivalence evidence for every selected quote.',
      'B1 selected quote selection_equivalence_key.',
    );
  }
  if (stakeMinor <= 0n) {
    return blocked(
      'B1_STAKE_NOT_POSITIVE',
      'B1 fee calculation requires a positive stake assumption.',
      'Positive B1 stake in minor units.',
    );
  }

  const matchingEntries = normalizedMatrix.value.entries.filter((entry) => (
    entry.venueOrBookmakerId === venueOrBookmakerId
      && entry.selectionEquivalenceKey === selectionEquivalenceKey
  ));
  if (matchingEntries.length !== 1) {
    return blocked(
      'B1_FEE_MATRIX_ENTRY_MISSING',
      'B1 net economics requires exactly one explicit fee entry for every selected venue and terminal outcome.',
      'B1 fee matrix entry keyed by venue_or_bookmaker_id and selection_equivalence_key.',
    );
  }

  const entry = matchingEntries[0];
  if (entry === undefined) {
    throw new Error('B1 fee matrix exact-match search produced no entry after length check.');
  }
  const variableFeeMinor = ceilDiv(stakeMinor * entry.feeBps, 10_000n);
  return accepted(Object.freeze({
    venueOrBookmakerId,
    selectionEquivalenceKey,
    stakeMinor,
    feeBps: entry.feeBps,
    fixedFeeMinor: entry.fixedFeeMinor,
    feeMinor: variableFeeMinor + entry.fixedFeeMinor,
  }));
}

export function normalizeB1FeeMatrix(matrix: B1FeeMatrix): BoundaryResult<B1FeeMatrix> {
  if (typeof matrix !== 'object' || matrix === null || !Array.isArray(matrix.entries)) {
    return blocked(
      'B1_FEE_MATRIX_MISSING',
      'B1 net economics requires an explicit fee matrix.',
      'B1 fee matrix with per-venue per-selection entries.',
    );
  }
  if (matrix.entries.length === 0) {
    return blocked(
      'B1_FEE_MATRIX_EMPTY',
      'B1 net economics requires at least one explicit fee matrix entry.',
      'B1 fee matrix with per-venue per-selection entries.',
    );
  }

  const seenKeys = new Set<string>();
  for (const entry of matrix.entries) {
    const normalizedEntry = normalizeB1FeeMatrixEntry(entry);
    if (!normalizedEntry.ok) {
      return normalizedEntry;
    }
    const key = `${entry.venueOrBookmakerId}\0${entry.selectionEquivalenceKey}`;
    if (seenKeys.has(key)) {
      return blocked(
        'B1_FEE_MATRIX_DUPLICATE_ENTRY',
        'B1 net economics requires a single fee entry for each selected venue and terminal outcome.',
        'Unique B1 fee matrix entries keyed by venue and selection equivalence.',
      );
    }
    seenKeys.add(key);
  }

  return accepted(Object.freeze({
    entries: Object.freeze([...matrix.entries]),
  }));
}

function normalizeB1FeeMatrixEntry(entry: B1FeeMatrixEntry): BoundaryResult<B1FeeMatrixEntry> {
  if (typeof entry !== 'object' || entry === null) {
    return blocked(
      'B1_FEE_MATRIX_ENTRY_INVALID',
      'B1 fee matrix entries must be explicit objects.',
      'B1 fee matrix entry.',
    );
  }
  if (entry.venueOrBookmakerId.length === 0 || entry.selectionEquivalenceKey.length === 0) {
    return blocked(
      'B1_FEE_MATRIX_ENTRY_KEY_INVALID',
      'B1 fee matrix entries require venue and selection equivalence keys.',
      'B1 fee matrix entry keyed by venue and selection equivalence.',
    );
  }
  if (entry.feeBps < 0n) {
    return blocked(
      'B1_FEE_BPS_INVALID',
      'B1 fee basis points must be non-negative integer units.',
      'Non-negative B1 fee basis points.',
    );
  }
  if (entry.fixedFeeMinor < 0n) {
    return blocked(
      'B1_FIXED_FEE_INVALID',
      'B1 fixed fee must be non-negative minor units.',
      'Non-negative B1 fixed fee in minor units.',
    );
  }
  return accepted(entry);
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  if (numerator % denominator === 0n) {
    return quotient;
  }
  return quotient + 1n;
}
