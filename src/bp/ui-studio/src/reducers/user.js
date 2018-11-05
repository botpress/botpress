import { handleActions } from 'redux-actions'

import { userReceived } from '~/actions'

const defaultState = {}

const reducer = handleActions(
  {
    [userReceived]: (state, { payload }) => ({ ...state, ...payload })
  },
  defaultState
)

export default reducer
