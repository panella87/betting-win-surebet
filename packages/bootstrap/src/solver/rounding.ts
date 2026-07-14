import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';

export function toMinorUnits(decimalText: string, scale: number): BoundaryResult<bigint> {
  if (!/^\d+(\.\d+)?$/.test(decimalText)) {
    return blocked('FIXED_POINT_INPUT_INVALID', 'Amount must be a non-negative decimal string.', 'Decimal amount string.');
  }
  const [whole = '0', fraction = ''] = decimalText.split('.');
  if (fraction.length > scale) {
    return blocked('FIXED_POINT_SCALE_EXCEEDED', 'Amount has more fractional digits than the configured scale.', 'Amount within scale.');
  }
  return accepted(BigInt(`${whole}${fraction.padEnd(scale, '0')}`));
}
