import { handleActions } from 'redux-actions'

import { modulesReceived } from '~/actions'

const defaultState = []

const reducer = handleActions(
  {
    [modulesReceived]: (state, { payload }) => [...payload]
  },
  defaultState
)

export default reducer
