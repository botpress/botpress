import { handleActions } from 'redux-actions'
import {
  buildNewSkill,
  cancelNewSkill,
  editSkill,
  requestInsertNewSkill,
  requestUpdateSkill,
  skillsReceived,
  updateSkill
} from '~/actions'

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
    })
  },
  defaultState
)

export default reducer
