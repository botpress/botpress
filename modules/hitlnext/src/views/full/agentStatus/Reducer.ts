import produce from 'immer'
import _ from 'lodash'

import { IAgent, ISocketMessage } from '../../../types'

import { StateType } from './Store'

export type ActionType =
  | { type: 'setCurrentAgent'; payload: Partial<IAgent> }
  | { type: 'setAgent'; payload: ISocketMessage }
  | { type: 'setError'; payload: any }

const Reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case 'setCurrentAgent':
      return produce(state, draft => {
        draft.currentAgent = {
          ...draft.currentAgent,
          ...action.payload
        } as IAgent
      })
    case 'setAgent':
      return produce(state, draft => {
        draft.currentAgent = {
          ...draft.currentAgent,
          ...action.payload.payload
        }
      })
    case 'setError':
      return produce(state, draft => {
        draft.error = action.payload
      })
    default:
      return state
  }
}

export default Reducer
