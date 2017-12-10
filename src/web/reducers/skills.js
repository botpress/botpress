import { handleActions } from 'redux-actions'

import { modulesReceived } from '~/actions'

const defaultState = []

const reducer = handleActions(
  {
    [modulesReceived]: (state, { payload }) => {
      return payload.filter(module => {
        return module.name.startsWith('botpress-skill-')
      })
    }
  },
  defaultState
)

export default reducer
