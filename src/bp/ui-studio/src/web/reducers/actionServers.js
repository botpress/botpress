import { handleActions } from 'redux-actions'

import { actionServersReceived } from '~/actions'

const defaultState = []

const reducer = handleActions(
  {
    [actionServersReceived]: (state, { payload }) => [...payload]
  },
  defaultState
)

export default reducer
