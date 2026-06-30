import { accepted, blocked, type BettingWinReference, type BoundaryResult } from '../contracts/local-types.js';

export interface BettingWinExportBundle {
  readonly reference: BettingWinReference;
  readonly exportedAt: string;
  readonly records: readonly unknown[];
}

export function parseBettingWinExportBundle(value: unknown): BoundaryResult<BettingWinExportBundle> {
  if (typeof value !== 'object' || value === null) {
    return blocked('EXPORT_NOT_OBJECT', 'Export bundle must be an object.', 'Pinned betting-win export bundle.');
  }
  const candidate = value as Partial<BettingWinExportBundle>;
  if (!candidate.reference || candidate.reference.source !== 'betting-win') {
    return blocked('EXPORT_NOT_FROM_BETTING_WIN', 'Export bundle must reference betting-win.', 'betting-win export reference.');
  }
  if (!Array.isArray(candidate.records)) {
    return blocked('EXPORT_RECORDS_MISSING', 'Export bundle records must be present.', 'Export records array.');
  }
  if (typeof candidate.exportedAt !== 'string' || candidate.exportedAt.length === 0) {
    return blocked('EXPORT_TIMESTAMP_MISSING', 'Export bundle timestamp is required.', 'Export timestamp.');
  }
  return accepted(candidate as BettingWinExportBundle);
}
