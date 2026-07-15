import * as types from '../../types'
import * as lin from '../../utils/linear-utils'

type StateNameParse = [RegExp, types.CommonStateName]
const COMMON_STATE_NAME_BY_TYPE: Record<lin.StateType, StateNameParse[]> = {
  triage: [
    //
    [/^triage$/i, 'TRIAGE'],
  ],
  backlog: [
    //
    [/^backlog$/i, 'BACKLOG'],
  ],
  unstarted: [
    //
    [/^todo$/i, 'TODO'],
  ],
  started: [
    [/^in progress$/i, 'IN_PROGRESS'],
    [/^in review$/i, 'IN_REVIEW'],
    [/^in pr review$/i, 'IN_REVIEW'],
    [/^blocked$/i, 'BLOCKED'],
    [/^staging$/i, 'STAGING'],
    [/^monitoring$/i, 'MONITORING'],
    [/^in prod testing$/i, 'MONITORING'],
  ],
  completed: [
    //
    [/^done$/i, 'DONE'],
    [/^production(?: \(done\))?$/i, 'DONE'],
  ],
  canceled: [
    [/^canceled$/i, 'CANCELED'],
    [/^stale$/i, 'STALE'],
  ],
  duplicate: [
    //
    [/^duplicate$/i, 'DUPLICATE'],
  ],
}

export const findCommonStateName = (state: {
  type: lin.StateType
  name: string
}): types.CommonStateName | undefined => {
  const resolver = COMMON_STATE_NAME_BY_TYPE[state.type]
  if (!resolver) {
    return
  }
  const name = state.name.toLowerCase()
  const match = resolver.find(([regex]) => regex.test(name))
  return match?.[1]
}
