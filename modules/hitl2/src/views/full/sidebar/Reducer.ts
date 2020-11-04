import { AgentType, EscalationType, SocketMessageType } from '../../../types'

import { StateType } from './Store'
import _ from 'lodash'
import produce from 'immer'

export type ActionType =
  | { type: 'setAgents'; payload: AgentType[] }
  | { type: 'setEscalations'; payload: EscalationType[] }
  | { type: 'setAgent'; payload: SocketMessageType }
  | { type: 'setEscalation'; payload: SocketMessageType }
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
