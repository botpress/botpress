import { Skill } from 'botpress/sdk'
import { LocalActionDefinition } from 'common/typings'
import { handleActions } from 'redux-actions'
import {
  actionsReceived,
  buildNewSkill,
  cancelNewSkill,
  editSkill,
  intentsReceived,
  requestInsertNewSkill,
  requestUpdateSkill,
  skillsReceived
} from '~/actions'

const defaultState = {
  installed: [],
  builder: {
    opened: false,
    data: {},
    skillId: null,
    action: null,
    editFlowName: null,
    editNodeId: null,
    actions: []
  }
}

export interface SkillsReducer {
  installed: Skill[]
  actions: LocalActionDefinition[]
}

const reducer = handleActions(
  {
    [skillsReceived]: (state, { payload }) => ({
      ...state,
      installed: payload
    }),

    [buildNewSkill as any]: (state, { payload }) => ({
      ...state,
      builder: {
        ...state.builder,
        opened: true,
        action: 'new',
        data: {},
        skillId: payload.id,
        location: payload.location
      }
    }),

    [cancelNewSkill]: state => ({
      ...state,
      builder: {
        ...state.builder,
        opened: false
      }
    }),

    [requestInsertNewSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        ...state.builder,
        opened: false,
        data: payload.data,
        skillId: payload.skillId
      }
    }),

    [editSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        ...state.builder,
        opened: true,
        action: 'edit',
        skillId: payload.skillId,
        data: payload.data,
        editFlowName: payload.flowName,
        editNodeId: payload.nodeId
      }
    }),

    [requestUpdateSkill]: state => ({
      ...state,
      builder: {
        ...state.builder,
        opened: false
      }
    }),

    [intentsReceived]: (state, { payload }) => ({
      ...state,
      intents: payload
    }),

    [actionsReceived]: (state, { payload }) => ({
      ...state,
      actions: payload
    })
  },
  defaultState
)

export default reducer
