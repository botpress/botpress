import produce from 'immer'
import _ from 'lodash'

import { IAgent, IHandoff, ISocketMessage } from '../../../types'

import { StateType } from './Store'

export type ActionType =
  | { type: 'setAgents'; payload: IAgent[] }
  | { type: 'setHandoffs'; payload: IHandoff[] }
  | { type: 'setAgent'; payload: ISocketMessage }
  | { type: 'setHandoff'; payload: ISocketMessage }
  | { type: 'setError'; payload: any }

const Reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case 'setAgents':
      return produce(state, draft => {
        draft.agents = _.keyBy(action.payload, 'id')
      })
    case 'setHandoffs':
      return produce(state, draft => {
        draft.handoffs = _.keyBy(action.payload, 'id')
      })
    case 'setAgent':
      return produce(state, draft => {
        draft.agents = {
          ...draft.agents,
          [action.payload.id]: {
            ...draft.agents[action.payload.id],
            ...action.payload.payload
          }
        }
      })
    case 'setHandoff':
      return produce(state, draft => {
        draft.handoffs = {
          ...draft.handoffs,
          [action.payload.id]: {
            ...draft.handoffs[action.payload.id],
            ...action.payload.payload
          }
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
