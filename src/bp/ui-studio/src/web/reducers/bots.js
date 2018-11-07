import { handleActions } from 'redux-actions'
import { botsReceived } from '~/actions'

const defaultState = []

const reducer = handleActions(
  {
    [botsReceived]: (state, { payload }) => payload.payload || []
  },
  defaultState
)

export default reducer
