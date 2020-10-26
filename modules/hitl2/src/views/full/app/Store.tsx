import React, { createContext, Dispatch, useReducer } from 'react'

import { AgentType, EscalationType } from '../../../types'

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

export interface ReadsMapType {
  [key: string]: Date
}

export type StateType = {
  readonly currentAgent?: AgentType
  readonly currentEscalation?: EscalationType
  readonly agents: AgentsMapType
  readonly escalations: EscalationsMapType
  readonly reads: ReadsMapType
  readonly error?: any
}

const initialState: StateType = {
  currentAgent: null,
  currentEscalation: null,
  agents: {},
  escalations: {},
  reads: {},
  error: null
}

export const Context = createContext<StoreType>({ state: initialState, dispatch: () => null })

export const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, initialState)
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
