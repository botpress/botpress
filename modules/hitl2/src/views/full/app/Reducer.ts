import produce from 'immer'
import _ from 'lodash'
import { CommentType, EscalationType, AgentType, SocketMessageType } from '../../../types'
import { StateType, AgentsMapType, EscalationsMapType } from './Store'

export type ActionType =
  | { type: 'setCurrentAgent'; payload: Partial<AgentType> }
  | { type: 'setCurrentEscalation'; payload: string }
  | { type: 'setAgents'; payload: AgentType[] }
  | { type: 'setEscalations'; payload: EscalationType[] }
  | { type: 'setComment'; payload: CommentType }
  | { type: 'setAgent'; payload: SocketMessageType }
  | { type: 'setEscalation'; payload: SocketMessageType }
  | { type: 'setRead'; payload: string }
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
    case 'setCurrentEscalation':
      return produce(state, draft => {
        draft.currentEscalation = draft.escalations[action.payload]
      })
    case 'setAgents':
      return produce(state, draft => {
        draft.agents = _.keyBy(action.payload, 'id') as AgentsMapType
      })
    case 'setEscalations':
      return produce(state, draft => {
        draft.escalations = _.keyBy(action.payload, 'id') as EscalationsMapType
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
          [action.payload.id]: {
            ...draft.agents[action.payload.id],
            ...action.payload.payload
          }
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
          [action.payload.id]: {
            ...draft.escalations[action.payload.id],
            ...action.payload.payload
          }
        }
      })
    case 'setRead':
      return produce(state, draft => {
        draft.reads = {
          ...draft.reads,
          [action.payload]: draft.escalations[action.payload].userConversation.createdOn
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
