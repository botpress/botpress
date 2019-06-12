import { handleActions } from 'redux-actions'

import { hintsReceived } from '~/actions'

const defaultState = {
  inputs: []
}

const reducer = handleActions(
  {
    [hintsReceived]: (state, { payload }) => ({ ...state, ...payload })
  },
  defaultState
)

export default reducer
