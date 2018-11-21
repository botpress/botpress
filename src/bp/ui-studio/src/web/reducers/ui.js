import { handleActions } from 'redux-actions'

import { viewModeChanged, updateGlobalStyle } from '~/actions'

const defaultState = {
  viewMode: -1,
  customStyle: {}
}

const reducer = handleActions(
  {
    [viewModeChanged]: (state, { payload }) => ({
      ...state,
      viewMode: payload.toString()
    }),
    [updateGlobalStyle]: (state, { payload }) => ({
      ...state,
      customStyle: Object.assign({}, state.customStyle, payload)
    })
  },
  defaultState
)

export default reducer
