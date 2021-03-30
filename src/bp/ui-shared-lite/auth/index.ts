// @ts-nocheck

import { AxiosInstance } from 'axios'
import { StoredToken, TokenUser, TokenResponse } from 'common/typings'
import moment from 'moment'
import ms from 'ms'
import storage from '../utils/storage'

export const TOKEN_KEY = 'bp/token'

const MIN_MS_LEFT_BEFORE_REFRESH = ms('5m')

export const getToken = (onlyToken: boolean = true): StoredToken | string | undefined => {
  const token = storage.get(TOKEN_KEY)
  const parsed = token && JSON.parse(token)

  return onlyToken ? parsed && parsed.token : parsed
}

export const setToken = (token: Partial<TokenResponse>): void => {
  let storedToken: StoredToken

  if (window.USE_JWT_COOKIES) {
    storedToken = { token: token.csrf, expiresAt: Date.now() + token.exp, issuedAt: Date.now() }
  } else {
    const [, payload] = token.jwt.split('.')
    const tokenUser = JSON.parse(atob(payload)) as TokenUser
    storedToken = { token: token.jwt, expiresAt: tokenUser.exp, issuedAt: tokenUser.iat! }
  }

  storage.set(TOKEN_KEY, JSON.stringify(storedToken))
}

export const isTokenValid = (): boolean => {
  const storedToken = getToken(false) as StoredToken

  if (storedToken) {
    const { token, expiresAt } = storedToken
    return !!token && moment().unix() < expiresAt
  }

  return false
}

export const tokenNeedsRefresh = () => {
  const tokenData = getToken(false) as StoredToken
  const duration = moment.duration(moment.unix(tokenData.expiresAt).diff(moment()))

  return duration.asMilliseconds() < MIN_MS_LEFT_BEFORE_REFRESH
}

export const logout = async (getAxiosClient: () => AxiosInstance) => {
  await getAxiosClient()
    .post('/admin/auth/logout')
    .catch(() => {})

  // Clear access token and ID token from local storage
  localStorage.removeItem(TOKEN_KEY)
  // need to force reload otherwise the token wont clear properly
  window.location.href = window.location.origin + window['ROOT_PATH']
}
