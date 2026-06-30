import test from 'node:test';
import assert from 'node:assert/strict';
import { residualExposureAnalysisStatus } from '../src/simulation/residual-exposure.js';

test('residual exposure analysis is blocked in SURE-001', () => {
  assert.equal(residualExposureAnalysisStatus().ok, false);
});
