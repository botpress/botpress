import { handleActions } from 'redux-actions'

import { rulesReceived } from '~/actions'

const defaultState = []

const reducer = handleActions(
  {
    [rulesReceived]: (state, { payload }) => [...payload]
  },
  defaultState
)

export default reducer
