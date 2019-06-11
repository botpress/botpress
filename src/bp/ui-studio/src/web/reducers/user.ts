import { handleActions } from 'redux-actions'

import { userReceived } from '~/actions'

const defaultState = {}

export interface UserReducer {
  email: string
  fullName: string
  isSuperAdmin: boolean
  permissions: any
}

const reducer = handleActions<UserReducer, string>(
  {
    [userReceived]: (state, { payload }) => ({ ...state, ...payload })
  },
  defaultState
)

export default reducer
