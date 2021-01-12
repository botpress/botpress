import { Dictionary } from 'lodash'
import React, { createContext, Dispatch, useReducer } from 'react'

import { IAgent, IHandoff } from '../../../types'

import Reducer, { ActionType } from './Reducer'

interface StoreType {
  state: StateType
  dispatch: Dispatch<ActionType>
}

export interface StateType {
  readonly agents: Dictionary<IAgent>
  readonly handoffs: Dictionary<IHandoff>
  readonly error?: any
}

const initialState: StateType = {
  agents: {},
  handoffs: {},
  error: null
}

export const Context = createContext<StoreType>({ state: initialState, dispatch: () => null })

export const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, initialState)
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
