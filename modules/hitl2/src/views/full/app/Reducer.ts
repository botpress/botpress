import produce from 'immer'
import _, { Dictionary } from 'lodash'

import { AgentType, CommentType, EscalationType, SocketMessageType } from '../../../types'

import { StateType } from './Store'

export type ActionType =
  | { type: 'setCurrentAgent'; payload: Partial<AgentType> }
  | { type: 'setCurrentEscalation'; payload: string }
  | { type: 'setAgents'; payload: AgentType[] }
  | { type: 'setEscalations'; payload: EscalationType[] }
  | { type: 'setComment'; payload: CommentType }
  | { type: 'setAgent'; payload: SocketMessageType }
  | { type: 'setEscalation'; payload: SocketMessageType }
  | { type: 'setRead'; payload: Dictionary<Date> }
  | { type: 'setDefault'; payload: Object }
  | { type: 'setError'; payload: any }

const Reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case 'setCurrentAgent':
      return produce(state, draft => {
        draft.currentAgent = _.merge(draft.currentAgent, action.payload)
      })
    case 'setCurrentEscalation':
      return produce(state, draft => {
        draft.currentEscalation = draft.escalations[action.payload]
      })
    case 'setAgents':
      return produce(state, draft => {
        draft.agents = _.keyBy(action.payload, 'id')
      })
    case 'setEscalations':
      return produce(state, draft => {
        draft.escalations = _.keyBy(action.payload, 'id')
        draft.reads = _.mapValues(draft.escalations, escalation => escalation.userConversation.createdOn)
      })
    case 'setComment':
      return produce(state, draft => {
        const escalation = draft.escalations[action.payload.escalationId]
        escalation.comments.push(action.payload)
        draft.currentEscalation = escalation
      })
    case 'setAgent':
      return produce(state, draft => {
        draft.agents = {
          ...draft.agents,
          [action.payload.id]: _.merge(draft.agents[action.payload.id], action.payload.payload)
        }
        // Note: because currentAgent is an actual object,
        // instead of a reference, must be manually updated
        if (state.currentAgent.id == action.payload.id) {
          draft.currentAgent = draft.agents[action.payload.id]
        }
      })
    case 'setEscalation':
      return produce(state, draft => {
        draft.escalations = {
          ...draft.escalations,
          [action.payload.id]: _.merge(draft.escalations[action.payload.id], action.payload.payload)
        }
      })
    case 'setDefault':
      return produce(state, draft => {
        draft.defaults = _.merge(draft.defaults, action.payload)
      })
    case 'setRead':
      return produce(state, draft => {
        draft.reads = _.merge(draft.reads, action.payload)
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
