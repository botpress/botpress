import produce from 'immer'
import _ from 'lodash'
import { CommentType, EscalationType, AgentType, SocketMessageType } from '../../types'
import { StateType, AgentsMapType, EscalationsMapType } from './Store'

export type ActionType =
  | { type: 'setCurrentAgent'; payload: Partial<AgentType> }
  | { type: 'setCurrentEscalation'; payload: string }
  | { type: 'setAgents'; payload: AgentType[] }
  | { type: 'setEscalations'; payload: EscalationType[] }
  | { type: 'setComment'; payload: CommentType }
  | { type: 'createSocketMessage'; payload: SocketMessageType }
  | { type: 'updateSocketMessage'; payload: SocketMessageType }
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
      })
    case 'setComment':
      return produce(state, draft => {
        const escalation = draft.escalations[action.payload.escalationId]

        if (!escalation.comments) {
          escalation.comments = []
        }

        escalation.comments.push(action.payload)
        draft.currentEscalation = escalation
      })
    case 'createSocketMessage':
      switch (action.payload['resource']) {
        case 'escalation':
          return produce(state, draft => {
            draft.escalations[action.payload.id] = action.payload.payload as EscalationType
          })
        default:
          return state
      }
    case 'updateSocketMessage':
      switch (action.payload.resource) {
        case 'escalation':
          return produce(state, draft => {
            draft.escalations[action.payload.id] = {
              ...draft.escalations[action.payload.id],
              ...action.payload.payload
            } as EscalationType
          })
        case 'agent':
          return produce(state, draft => {
            draft.agents[action.payload.id] = {
              ...draft.agents[action.payload.id],
              ...action.payload.payload
            } as AgentType
          })
        default:
          return state
      }
    case 'setError':
      return produce(state, draft => {
        draft.error = action.payload
      })
    default:
      return state
  }
}

export default Reducer
