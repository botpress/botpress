import { handleActions } from 'redux-actions'

import { skillsReceived, buildNewSkill, cancelNewSkill, insertNewSkill, editSkill, updateSkill } from '~/actions'

const defaultState = {
  installed: [],
  builder: {
    opened: false,
    data: {},
    skillId: null,
    action: null,
    editFlowName: null,
    editNodeId: null
  }
}

const reducer = handleActions(
  {
    [skillsReceived]: (state, { payload }) => ({
      ...state,
      installed: payload
    }),

    [buildNewSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        ...state.builder,
        opened: true,
        action: 'new',
        data: {},
        skillId: payload
      }
    }),

    [cancelNewSkill]: state => ({
      ...state,
      builder: {
        ...state.builder,
        opened: false
      }
    }),

    [insertNewSkill]: (state, { payload }) => ({
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

    [updateSkill]: state => ({
      ...state,
      builder: {
        ...state.builder,
        opened: false
      }
    })
  },
  defaultState
)

export default reducer
