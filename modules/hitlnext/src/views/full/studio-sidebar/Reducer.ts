import produce from 'immer'
import _ from 'lodash'

import { IAgent, IEscalation, ISocketMessage } from '../../../types'

import { StateType } from './Store'

export type ActionType =
  | { type: 'setAgents'; payload: IAgent[] }
  | { type: 'setEscalations'; payload: IEscalation[] }
  | { type: 'setAgent'; payload: ISocketMessage }
  | { type: 'setEscalation'; payload: ISocketMessage }
  | { type: 'setError'; payload: any }

const Reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case 'setAgents':
      return produce(state, draft => {
        draft.agents = _.keyBy(action.payload, 'id')
      })
    case 'setEscalations':
      return produce(state, draft => {
        draft.escalations = _.keyBy(action.payload, 'id')
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
    case 'setEscalation':
      return produce(state, draft => {
        draft.escalations = {
          ...draft.escalations,
          [action.payload.id]: {
            ...draft.escalations[action.payload.id],
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
