import { handleActions } from 'redux-actions'
import { botsIdsReceived } from '~/actions'

const defaultState = []

const reducer = handleActions(
  {
    [botsIdsReceived]: (state, { payload }) => payload.payload || []
  },
  defaultState
)

export default reducer
