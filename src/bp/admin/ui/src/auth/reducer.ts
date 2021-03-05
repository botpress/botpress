import { AuthStrategyConfig } from 'common/typings'

import api from '~/api'

const AUTH_CONFIG_RECEIVED = 'user/AUTH_CONFIG_RECEIVED'

export interface AuthState {
  authConfig?: AuthStrategyConfig[]
}

const initialState: AuthState = {
  authConfig: undefined
}

export default (state = initialState, action) => {
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

export const fetchAuthConfig = () => {
  return async dispatch => {
    const { data } = await api.getAnonymous({ useV1: true }).get('/auth/config')
    dispatch({ type: AUTH_CONFIG_RECEIVED, authConfig: data.payload.strategies })
  }
}
