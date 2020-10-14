import produce from 'immer'
import _ from 'lodash'
import { AgentType, SocketMessageType } from '../../../types'
import { StateType } from './Store'

export type ActionType =
  | { type: 'setCurrentAgent'; payload: Partial<AgentType> }
  | { type: 'setAgent'; payload: SocketMessageType }
  | { type: 'setError'; payload: any }

const Reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case 'setCurrentAgent':
      return produce(state, draft => {
        draft.currentAgent = {
          ...draft.currentAgent,
          ...action.payload
        } as AgentType
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
