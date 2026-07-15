import * as types from '../../types'
import * as lin from '../../utils/linear-utils'

type StateNameParse<T extends lin.StateType> = [RegExp, types.CommonStates[T]]
const COMMON_STATE_NAME_BY_TYPE: {
  [T in lin.StateType]?: StateNameParse<T>[]
} = {
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

export const findCommonStateName = <T extends lin.StateType>(state: {
  type: T
  name: string
}): types.CommonStates[T] | undefined => {
  const resolver = COMMON_STATE_NAME_BY_TYPE[state.type]
  if (!resolver) {
    return
  }
  const name = state.name.toLowerCase()
  const match = resolver.find(([regex]) => regex.test(name))
  return match?.[1]
}
