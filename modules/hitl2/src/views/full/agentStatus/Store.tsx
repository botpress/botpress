import React, { Dispatch, createContext, useReducer } from 'react'
import Reducer, { ActionType } from './Reducer'

import { AgentType } from '../../../types'

type StoreType = {
  state: StateType
  dispatch: Dispatch<ActionType>
}

export type StateType = {
  readonly currentAgent: AgentType
  readonly error?: any
}

const initialState: StateType = {
  currentAgent: null,
  error: null
}

export const Context = createContext<StoreType>({ state: initialState, dispatch: () => null })

export const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, initialState)
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
