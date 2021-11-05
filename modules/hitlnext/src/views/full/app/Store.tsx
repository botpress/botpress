import { Dictionary } from 'lodash'
import React, { createContext, Dispatch, useEffect, useReducer } from 'react'

import { Config } from '../../../config'
import { MODULE_NAME } from '../../../constants'
import { AgentWithPermissions, IAgent, IHandoff } from '../../../types'

import Reducer, { ActionType } from './Reducer'

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

const readsKey = `bp::${MODULE_NAME}::reads`

const loadReadsFromStorage = () => {
  const stringReads: Dictionary<string> = window.BP_STORAGE.get(readsKey)
  if (!stringReads) {
    return {}
  }

  return Object.entries(stringReads).reduce((reads, [key, strValue]) => {
    try {
      reads[key] = new Date(strValue)
    } catch (err) {
      reads[key] = new Date()
    }

    return reads
  }, {})
}

const initialState: IState = {
  currentAgent: null,
  selectedHandoffId: null,
  agents: {},
  handoffs: {},
  reads: loadReadsFromStorage(),
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
    window.BP_STORAGE.set(readsKey, state.reads)
  }, [state.reads])

  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
