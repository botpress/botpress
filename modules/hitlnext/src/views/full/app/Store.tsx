import { Dictionary } from 'lodash'
import React, { createContext, Dispatch, useEffect, useReducer } from 'react'

import { Config } from '../../../config'
import { AgentWithPermissions, IAgent, IHandoff } from '../../../types'

import Reducer, { ActionType } from './Reducer'
import Storage from './storage'

interface IStore {
  state: IState
  dispatch: Dispatch<ActionType>
}

export interface UserDefaultsType {
  [key: string]: {
    username: string
  }
}

export interface IState {
  readonly currentAgent?: AgentWithPermissions
  readonly selectedHandoffId: string | null
  readonly agents: Dictionary<IAgent>
  readonly handoffs: Dictionary<IHandoff>
  readonly reads: Dictionary<Date>
  readonly config?: Config
  readonly defaults: {
    user?: UserDefaultsType
  }
  readonly error?: Error
}

const initialState: IState = {
  currentAgent: null,
  selectedHandoffId: null,
  agents: {},
  handoffs: {},
  reads: Storage.get('reads', {}),
  config: null,
  defaults: {},
  error: null
}

export const Context = createContext<IStore>({ state: initialState, dispatch: () => null })

export const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, initialState)

  // Persist some state locally for coherence between page loads and sessions
  // WARNING: the data stored could become large over time
  useEffect(() => {
    Storage.set('reads', state.reads)
  }, [state.reads])

  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
