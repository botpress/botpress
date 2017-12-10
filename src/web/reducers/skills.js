import { handleActions } from 'redux-actions'

import { modulesReceived, insertNewSkill } from '~/actions'

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

    [insertNewSkill]: (state, { payload }) => ({
      ...state,
      builder: {
        opened: true,
        data: {},
        skillId: payload
      }
    })
  },
  defaultState
)

export default reducer
