import React, { createContext, Dispatch, useReducer } from 'react'

import { IAgent } from '../../../types'

import Reducer, { ActionType } from './Reducer'

interface StoreType {
  state: StateType
  dispatch: Dispatch<ActionType>
}

export interface StateType {
  readonly currentAgent: IAgent
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
