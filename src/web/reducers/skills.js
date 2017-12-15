import { handleActions } from 'redux-actions'

import { modulesReceived, buildNewSkill, cancelNewSkill, insertNewSkill, editSkill, updateSkill } from '~/actions'

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
    [modulesReceived]: (state, { payload }) => ({
      ...state,
      installed: payload
        .filter(module => {
          return module.name.startsWith('botpress-skill-')
        })
        .map(module => {
          return {
            id: module.name,
            name: module.menuText,
            icon: module.menuIcon
          }
        })
    }),

    [buildNewSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        ...state.builder,
        opened: true,
        data: {},
        skillId: payload,
        action: 'new',
        editFlowName: null,
        editNodeId: null
      }
    }),

    [cancelNewSkill]: (state, { payload }) => ({
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
        skillId: payload.skillId,
        editFlowName: null,
        editNodeId: null
      }
    }),

    [editSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        opened: true,
        action: 'edit',
        skillId: payload.skillId,
        data: payload.data,
        editFlowName: payload.flowName,
        editNodeId: payload.nodeId
      }
    }),

    [updateSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        opened: false,
        action: null,
        skillId: null,
        data: null,
        editFlowName: null,
        editNodeId: null
      }
    })
  },
  defaultState
)

export default reducer
