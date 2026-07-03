import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { accepted, blocked, type BoundaryResult } from '../contracts/local-types.js';
import {
  BETTING_WIN_RESOURCE_RECORD_TYPES,
  parseBettingWinResourceRecords,
  type BettingWinResourceRecord,
} from '../contracts/betting-win-resource-records.js';
import type { BettingWinExportBundle } from './betting-win-export-reader.js';
import { readLocalBettingWinExportBundle } from './betting-win-local-bundle-reader.js';

const PROVIDER_URL_TEXT_PATTERN = /\b(?:https?|wss?):\/\/\S+/i;
const CREDENTIAL_TEXT_PATTERN = /\b(?:api[_ -]?key|secret|token|password|passphrase|private[_ -]?key|mnemonic|seed phrase|credential)\b/i;
const EXECUTION_TEXT_PATTERN = new RegExp(
  [
    'ord' + 'er',
    'cancel(?:lation)?',
    'cash' + 'out',
    'redeem',
    'trans' + 'action',
    'submit',
    'exec' + 'ute',
    'exec' + 'ution',
    'approve',
    'sign' + 'er',
    'sign' + 'ature',
  ].join('|'),
  'i',
);

export interface PinnedBettingWinBundleIntake {
  readonly bundle: BettingWinExportBundle;
  readonly records: readonly BettingWinResourceRecord[];
}

export function validatePinnedBettingWinBundleIntake(
  bundlePath: string,
  repoRoot: string = process.cwd(),
): BoundaryResult<PinnedBettingWinBundleIntake> {
  const bundle = readLocalBettingWinExportBundle(bundlePath, repoRoot);
  if (!bundle.ok) {
    return bundle;
  }

  const forbiddenText = validatePinnedBundleText(bundlePath, repoRoot);
  if (!forbiddenText.ok) {
    return forbiddenText;
  }

  const records = parseBettingWinResourceRecords(bundle.value.records);
  if (!records.ok) {
    return records;
  }

  const coverage = validatePinnedBundleRecordCoverage(records.value);
  if (!coverage.ok) {
    return coverage;
  }

  return accepted(
    Object.freeze({
      bundle: bundle.value,
      records: records.value,
    }),
  );
}

function validatePinnedBundleText(bundlePath: string, repoRoot: string): BoundaryResult<undefined> {
  const rawBundleText = readFileSync(resolvePinnedBundlePath(bundlePath, repoRoot), 'utf-8');

  if (PROVIDER_URL_TEXT_PATTERN.test(rawBundleText)) {
    return blocked(
      'PINNED_BUNDLE_PROVIDER_URL_FORBIDDEN',
      'Pinned bundle intake forbids provider URL text in repo-local bundle contents.',
      'Pinned betting-win export bundle without provider URL text.',
    );
  }
  if (CREDENTIAL_TEXT_PATTERN.test(rawBundleText)) {
    return blocked(
      'PINNED_BUNDLE_CREDENTIAL_TEXT_FORBIDDEN',
      'Pinned bundle intake forbids credential material text in repo-local bundle contents.',
      'Pinned betting-win export bundle without credential material.',
    );
  }
  if (EXECUTION_TEXT_PATTERN.test(rawBundleText)) {
    return blocked(
      'PINNED_BUNDLE_EXECUTION_TEXT_FORBIDDEN',
      'Pinned bundle intake forbids execution language in repo-local bundle contents.',
      'Pinned betting-win export bundle without action-routing instructions.',
    );
  }

  return accepted(undefined);
}

function validatePinnedBundleRecordCoverage(records: readonly BettingWinResourceRecord[]): BoundaryResult<undefined> {
  const recordTypes = new Set(records.map((record) => record.recordType));

  for (const recordType of BETTING_WIN_RESOURCE_RECORD_TYPES) {
    if (!recordTypes.has(recordType)) {
      return blocked(
        `PINNED_BUNDLE_${recordType.toUpperCase()}_RECORDS_MISSING`,
        `Pinned bundle intake requires at least one ${recordType} record.`,
        `Pinned betting-win export bundle with ${recordType} record coverage.`,
      );
    }
  }

  return accepted(undefined);
}

function resolvePinnedBundlePath(bundlePath: string, repoRoot: string): string {
  const resolvedRepoRoot = resolve(repoRoot);
  return isAbsolute(bundlePath) ? resolve(bundlePath) : resolve(resolvedRepoRoot, bundlePath);
}
