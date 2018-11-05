import { handleActions } from 'redux-actions'

import { licenseChanged } from '~/actions'

const defaultState = {
  name: null,
  text: null,
  licensed: null,
  status: null
}

const reducer = handleActions(
  {
    [licenseChanged]: (state, { payload }) => {
      return { ...state, ...payload }
    }
  },
  defaultState
)

export default reducer
