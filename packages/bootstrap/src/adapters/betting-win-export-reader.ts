import { accepted, blocked, type BettingWinReference, type BoundaryResult } from '../contracts/local-types.js';

export const BETTING_WIN_EXPORT_BUNDLE_SCHEMA = 'betting-win.export-bundle.v1' as const;

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MANIFEST_HASH_REGEX = /^[0-9a-f]{64}$/i;

export const BETTING_WIN_EXPORT_BUNDLE_KINDS = ['resource_export', 'read_only_query_export'] as const;

export type BettingWinExportBundleKind = (typeof BETTING_WIN_EXPORT_BUNDLE_KINDS)[number];

export interface BettingWinExportBundle {
  readonly schema: typeof BETTING_WIN_EXPORT_BUNDLE_SCHEMA;
  readonly reference: BettingWinReference;
  readonly bundleKind: BettingWinExportBundleKind;
  readonly exportedAt: string;
  readonly records: readonly unknown[];
}

export function parseBettingWinExportBundle(value: unknown): BoundaryResult<BettingWinExportBundle> {
  if (typeof value !== 'object' || value === null) {
    return blocked('EXPORT_NOT_OBJECT', 'Export bundle must be an object.', 'Pinned betting-win export bundle.');
  }
  const candidate = value as Partial<BettingWinExportBundle>;
  if (candidate.schema !== BETTING_WIN_EXPORT_BUNDLE_SCHEMA) {
    return blocked(
      'EXPORT_SCHEMA_INVALID',
      `Export bundle schema must be ${BETTING_WIN_EXPORT_BUNDLE_SCHEMA}.`,
      'Pinned betting-win export bundle schema string.',
    );
  }
  if (!candidate.reference || candidate.reference.source !== 'betting-win') {
    return blocked('EXPORT_NOT_FROM_BETTING_WIN', 'Export bundle must reference betting-win.', 'betting-win export reference.');
  }
  if (typeof candidate.reference.contractVersion !== 'string' || candidate.reference.contractVersion.trim().length === 0) {
    return blocked(
      'EXPORT_CONTRACT_VERSION_MISSING',
      'Export bundle contract version is required.',
      'Pinned betting-win export contract version.',
    );
  }
  if (typeof candidate.reference.manifestHash !== 'string' || !MANIFEST_HASH_REGEX.test(candidate.reference.manifestHash)) {
    return blocked(
      'EXPORT_MANIFEST_HASH_INVALID',
      'Export bundle manifest hash must be 64 hexadecimal characters.',
      'Pinned betting-win export manifest hash.',
    );
  }
  if (!isExportBundleKind(candidate.bundleKind)) {
    return blocked(
      'EXPORT_BUNDLE_KIND_INVALID',
      'Export bundle kind must be a supported local export bundle kind.',
      'Pinned betting-win export bundle kind.',
    );
  }
  if (!Array.isArray(candidate.records)) {
    return blocked('EXPORT_RECORDS_MISSING', 'Export bundle records must be present.', 'Export records array.');
  }
  if (typeof candidate.exportedAt !== 'string' || candidate.exportedAt.length === 0) {
    return blocked('EXPORT_TIMESTAMP_MISSING', 'Export bundle timestamp is required.', 'Export timestamp.');
  }
  if (!isIsoTimestamp(candidate.exportedAt)) {
    return blocked('EXPORT_TIMESTAMP_INVALID', 'Export bundle timestamp must be an ISO-8601 UTC timestamp.', 'Export timestamp.');
  }
  return accepted(
    Object.freeze({
      schema: BETTING_WIN_EXPORT_BUNDLE_SCHEMA,
      reference: Object.freeze({
        source: 'betting-win',
        contractVersion: candidate.reference.contractVersion,
        manifestHash: candidate.reference.manifestHash,
      }),
      bundleKind: candidate.bundleKind,
      exportedAt: candidate.exportedAt,
      records: Object.freeze([...candidate.records]),
    }),
  );
}

function isExportBundleKind(value: unknown): value is BettingWinExportBundleKind {
  return typeof value === 'string' && BETTING_WIN_EXPORT_BUNDLE_KINDS.includes(value as BettingWinExportBundleKind);
}

function isIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}
