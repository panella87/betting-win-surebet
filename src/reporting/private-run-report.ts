export interface PrivateRunReport {
  readonly runKind: 'private_paper_skeleton_validation';
  readonly sureTask: 'SURE-001';
  readonly status: 'skeleton_only';
}

export function createPrivateRunReport(): PrivateRunReport {
  return Object.freeze({ runKind: 'private_paper_skeleton_validation', sureTask: 'SURE-001', status: 'skeleton_only' });
}
