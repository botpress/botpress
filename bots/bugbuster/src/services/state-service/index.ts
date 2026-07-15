import * as types from '../../types'
import * as lin from '../../utils/linear-utils'
import { findCommonStateName } from './common-state-name'

export class StateService {
  private _stateEntries?: types.StateEntry[] = undefined

  public constructor(private _linear: lin.LinearApi) {}

  public async getStates(): Promise<types.StateEntry[]> {
    if (!this._stateEntries) {
      const states = await this._linear.getStates()
      this._stateEntries = states.map((state) => ({ ...state, commonName: findCommonStateName(state) }))
    }
    return this._stateEntries
  }

  public async getIssueState(issue: lin.Issue): Promise<types.StateEntry> {
    const states = await this.getStates()
    const state = states.find((s) => s.id === issue.state.id)
    if (!state) {
      throw new Error(`State with ID "${issue.state.id}" not found.`)
    }
    return state
  }
}
