import { accepted, type BoundaryResult } from '../contracts/local-types.js';

export interface PartialFillModelStatus {
  readonly implementation: 'local_fixture_completion_state_machine';
  readonly realUpstreamAcceptance: 'blocked_until_pinned_betting_win_interface';
  readonly implementationModule: 'src/simulation/leg-completion.ts';
  readonly residualExposureModule: 'src/simulation/residual-exposure.ts';
}

export function partialFillModelStatus(): BoundaryResult<PartialFillModelStatus> {
  return accepted(
    Object.freeze({
      implementation: 'local_fixture_completion_state_machine',
      realUpstreamAcceptance: 'blocked_until_pinned_betting_win_interface',
      implementationModule: 'src/simulation/leg-completion.ts',
      residualExposureModule: 'src/simulation/residual-exposure.ts',
    }),
  );
}
