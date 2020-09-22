import { handleActions } from 'redux-actions'
import { licensingReceived } from '~/actions'

export interface CoreReducer {
  licensing: any
}

const defaultState = {
  licensing: undefined
}

const reducer = handleActions(
  {
    [licensingReceived]: (state, { payload }) => {
      window.LICENSING = { isPro: payload.isPro }

      return { ...state, licensing: payload || {} }
    }
  },
  defaultState
)

export default reducer
