import { handleActions } from 'redux-actions'

import { botInfoReceived } from '~/actions'

const defaultState = {}

const reducer = handleActions(
  {
    [botInfoReceived]: (state, { payload }) => ({ ...payload })
  },
  defaultState
)

export default reducer
