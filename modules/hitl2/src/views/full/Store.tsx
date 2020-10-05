import React, { createContext, useReducer, Dispatch } from 'react'
import { AgentType, EscalationType } from '../../types'
import Reducer, { ActionType } from './Reducer'

type StoreType = {
  state: StateType
  dispatch: Dispatch<ActionType>
}

export interface AgentsMapType {
  [key: string]: AgentType
}

export interface EscalationsMapType {
  [key: string]: EscalationType
}

export type StateType = {
  readonly currentAgent?: AgentType
  readonly currentEscalation?: EscalationType
  readonly agents: AgentsMapType
  readonly escalations: EscalationsMapType
  readonly error?: any
}

const initialState: StateType = {
  currentAgent: null,
  currentEscalation: null,
  agents: {},
  escalations: {},
  error: null
}

export const Context = createContext<StoreType>({ state: initialState, dispatch: () => null })

export const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, initialState)
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
