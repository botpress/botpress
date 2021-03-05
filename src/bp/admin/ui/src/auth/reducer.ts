import { AuthStrategyConfig } from 'common/typings'

import api from '~/api'
import { AppThunk } from '~/app/reducer'

const AUTH_CONFIG_RECEIVED = 'user/AUTH_CONFIG_RECEIVED'

interface AuthState {
  authConfig?: AuthStrategyConfig[]
}

const initialState: AuthState = {
  authConfig: undefined
}

export default (state = initialState, action): AuthState => {
  switch (action.type) {
    case AUTH_CONFIG_RECEIVED:
      return {
        ...state,
        authConfig: action.authConfig
      }

    default:
      return state
  }
}

export const fetchAuthConfig = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getAnonymous({ useV1: true }).get('/auth/config')
    dispatch({ type: AUTH_CONFIG_RECEIVED, authConfig: data.payload.strategies })
  }
}
