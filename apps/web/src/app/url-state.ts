export interface BwsOperatorCockpitUrlState {
  readonly page: number;
  readonly record: string | null;
  readonly search: string;
}

export interface BwsOperatorCockpitUrlStatePatch {
  readonly page?: number;
  readonly record?: string | null;
  readonly search?: string;
}

const DEFAULT_STATE = Object.freeze({
  page: 0,
  record: null,
  search: '',
} satisfies BwsOperatorCockpitUrlState);

function requireNonNegativeInteger(value: string | null): number {
  if (value === null || value.length === 0) {
    return 0;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error('BWS cockpit page state must be a non-negative integer.');
  }
  return Number.parseInt(value, 10);
}

export function readBwsOperatorCockpitUrlState(
  search: string,
): BwsOperatorCockpitUrlState {
  const params = new URLSearchParams(search);
  const recordValue = params.get('record');
  const searchValue = params.get('search');
  return Object.freeze({
    page: requireNonNegativeInteger(params.get('page')),
    record: recordValue === null || recordValue.trim().length === 0 ? null : recordValue.trim(),
    search: searchValue === null ? '' : searchValue,
  });
}

export function mergeBwsOperatorCockpitUrlState(
  current: BwsOperatorCockpitUrlState,
  patch: BwsOperatorCockpitUrlStatePatch,
): BwsOperatorCockpitUrlState {
  return Object.freeze({
    page: patch.page ?? current.page,
    record: patch.record === undefined ? current.record : patch.record,
    search: patch.search ?? current.search,
  });
}

export function createBwsOperatorCockpitUrlSearch(
  state: BwsOperatorCockpitUrlState,
): string {
  const params = new URLSearchParams();
  if (state.page > 0) {
    params.set('page', String(state.page));
  }
  if (state.record !== null) {
    params.set('record', state.record);
  }
  if (state.search.length > 0) {
    params.set('search', state.search);
  }
  const encoded = params.toString();
  return encoded.length === 0 ? '' : `?${encoded}`;
}

export function defaultBwsOperatorCockpitUrlState(): BwsOperatorCockpitUrlState {
  return DEFAULT_STATE;
}
