import produce from 'immer'
import _, { Dictionary } from 'lodash'

import { Config } from '../../../config'
import { IAgent, IHandoff, ISocketMessage } from '../../../types'

import { IState } from './Store'

export type ActionType =
  | { type: 'setCurrentAgent'; payload: Partial<IAgent> }
  | { type: 'setSelectedHandoffId'; payload: string }
  | { type: 'setAgents'; payload: IAgent[] }
  | { type: 'setHandoffs'; payload: IHandoff[] }
  | { type: 'setAgent'; payload: ISocketMessage }
  | { type: 'setHandoff'; payload: ISocketMessage }
  | { type: 'setRead'; payload: Dictionary<Date> }
  | { type: 'setConfig'; payload: Config }
  | { type: 'setDefault'; payload: Object }
  | { type: 'setError'; payload: Error }

const Reducer = (state: IState, action: ActionType): IState => {
  switch (action.type) {
    case 'setCurrentAgent':
      return produce(state, draft => {
        draft.currentAgent = _.merge(draft.currentAgent, action.payload)
      })
    case 'setSelectedHandoffId':
      return produce(state, draft => {
        draft.selectedHandoffId = action.payload
      })
    case 'setAgents':
      return produce(state, draft => {
        draft.agents = _.keyBy(action.payload, 'agentId')
      })
    case 'setHandoffs':
      return produce(state, draft => {
        draft.handoffs = _.keyBy(action.payload, 'id')
      })
    case 'setAgent':
      return produce(state, draft => {
        draft.agents = {
          ...draft.agents,
          [action.payload.id]: _.merge(draft.agents[action.payload.id], action.payload.payload)
        }

        // Note: because currentAgent is an actual object,
        // instead of a reference, it must be manually updated
        if (state.currentAgent.agentId === action.payload.id) {
          draft.currentAgent = draft.agents[action.payload.id]
        }
      })
    case 'setHandoff':
      return produce(state, draft => {
        draft.handoffs = {
          ...draft.handoffs,
          [action.payload.id]: {
            ..._.merge(draft.handoffs[action.payload.id], action.payload.payload),
            tags: action.payload.payload.tags
          }
        }
        // Note: Because it is the current handoff, it is assumed to be instantly read
        if (draft.selectedHandoffId === action.payload.id) {
          draft.reads = _.merge(draft.reads, {
            [action.payload.id]: action.payload.payload.userConversation.createdOn
          })
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
    case 'setConfig':
      return produce(state, draft => {
        draft.config = _.merge(draft.config, action.payload)
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
