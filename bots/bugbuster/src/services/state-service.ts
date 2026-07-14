import * as types from '../types'
import * as lin from '../utils/linear-utils'

type StateResolver = {
  byName?: Record<string, types.CommonStateName>
  default: types.CommonStateName
}

const COMMON_STATE_BY_TYPE: Record<lin.StateType, StateResolver> = {
  triage: { default: 'TRIAGE' },
  backlog: { default: 'BACKLOG' },
  unstarted: { default: 'TODO' },
  started: {
    byName: { staging: 'STAGING', blocked: 'BLOCKED' },
    default: 'IN_PROGRESS',
  },
  completed: { default: 'DONE' },
  canceled: {
    byName: { stale: 'STALE' },
    default: 'CANCELED',
  },
  duplicate: {
    default: 'DUPLICATE',
  },
}

type StateEntry = { state: lin.State; key?: types.CommonStateName }

export class StateService {
  private _stateEntries?: StateEntry[] = undefined

  public constructor(private _linear: lin.LinearApi) {}

  private async _getClassifiedStates(): Promise<StateEntry[]> {
    if (!this._stateEntries) {
      const states = await this._linear.getStates()
      this._stateEntries = states.map((state) => ({ state, key: this._findCommonState(state) }))
    }
    return this._stateEntries
  }

  public async mapToStateIds(keys: types.CommonStateName[]): Promise<string[]> {
    const states = await this._getClassifiedStates()
    return keys.flatMap((key) => {
      const relevantStates = states.filter((state) => state.key === key)
      const ids = relevantStates.map((state) => state.state.id)
      return ids
    })
  }

  public async getIssueCommonStateName(issue: lin.Issue): Promise<types.CommonStateName | undefined> {
    const states = await this._getClassifiedStates()
    const state = states.find((s) => s.state.id === issue.state.id)
    if (!state) {
      throw new Error(`State with ID "${issue.state.id}" not found.`)
    }
    return state.key
  }

  private _findCommonState = (state: lin.State): types.CommonStateName | undefined => {
    const resolver = COMMON_STATE_BY_TYPE[state.type]
    if (!resolver) {
      return
    }
    const name = state.name.toLowerCase()
    return resolver.byName?.[name] ?? resolver.default
  }
}
