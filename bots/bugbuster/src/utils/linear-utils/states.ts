import * as types from '../../types'

export type StateGuard = (state: types.LinearState) => boolean
export const stateIs = {
  IN_PROGRESS: (state: types.LinearState) => state.type === 'started',
  STAGING: (state: types.LinearState) => state.type === 'started' && state.name.toLowerCase() === 'staging',
  DONE: (state: types.LinearState) => state.type === 'completed',
  BACKLOG: (state: types.LinearState) => state.type === 'backlog',
  TODO: (state: types.LinearState) => state.type === 'unstarted',
  TRIAGE: (state: types.LinearState) => state.type === 'triage',
  CANCELED: (state: types.LinearState) => state.type === 'canceled',
  BLOCKED: (state: types.LinearState) => state.type === 'started' && state.name.toLowerCase() === 'blocked',
  STALE: (state: types.LinearState) => state.type === 'canceled' && state.name.toLowerCase() === 'stale',
} as const satisfies Record<types.CommonState, StateGuard>

export const findCommonState = (state: types.LinearState): types.CommonState | undefined => {
  const commonStates = Object.keys(stateIs) as types.CommonState[]
  for (const commonState of commonStates) {
    if (stateIs[commonState](state)) {
      return commonState
    }
  }
  return undefined
}
