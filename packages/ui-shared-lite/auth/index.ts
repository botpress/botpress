// @ts-nocheck

import { AxiosInstance } from 'axios'
import { StoredToken, TokenUser, TokenResponse } from 'common/typings'
import moment from 'moment'
import ms from 'ms'
import { nanoid } from 'nanoid'
import storage from '../utils/storage'

export const TOKEN_KEY = 'bp/token'

const MIN_MS_LEFT_BEFORE_REFRESH = ms('5m')

export const getToken = (onlyToken: boolean = true): StoredToken | string | undefined => {
  const parsedToken = storage.get<StoredToken>(TOKEN_KEY)

  return onlyToken ? parsedToken && parsedToken.token : parsedToken
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

  storage.set(TOKEN_KEY, storedToken)
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
  let url = ''
  try {
    const resp = await getAxiosClient().get('/admin/auth/logout')

    url = resp.data.url
  } catch {
    // Silently fails
  } finally {
    storage.del(TOKEN_KEY)

    if (url) {
      // If /logout gave us a URL, manually redirect to this URL
      window.location.replace(url)
    } else {
      // need to force reload otherwise the token wont clear properly
      window.location.href = window.location.origin + window['ROOT_PATH']
    }
  }
}

export const setVisitorId = (userId: string, userIdScope?: string) => {
  if (typeof userId === 'string' && userId !== 'undefined') {
    storage.set(userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user', userId)
    window.__BP_VISITOR_ID = userId
  }
}

export const getUniqueVisitorId = (userIdScope?: string): string => {
  const key = userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user'

  let userId = storage.get(key)
  if (typeof userId !== 'string' || userId === 'undefined') {
    userId = nanoid(24)
    storage.set(key, userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}
