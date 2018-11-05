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
      installed: payload.filter(module => module.name.startsWith('skill-')).map(module => ({
        id: module.name,
        name: module.menuText,
        icon: module.menuIcon
      }))
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
