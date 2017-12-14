import { handleActions } from 'redux-actions'

import { modulesReceived, buildNewSkill, cancelNewSkill, insertNewSkill } from '~/actions'

const defaultState = {
  installed: [],
  generated: [],
  builder: {
    opened: false,
    data: {},
    skillId: null
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
        skillId: payload
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
        skillId: payload.skillId
      }
    })
  },
  defaultState
)

export default reducer
