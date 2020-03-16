import axios from 'axios'
import { StoredToken, TokenUser } from 'common/typings'
import { EventEmitter2 } from 'eventemitter2'
import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid'

import storage from './storage'

export const TOKEN_KEY = 'bp/token'
export const authEvents = new EventEmitter2()

export const REFRESH_INTERVAL = ms('5m')
const MIN_MS_LEFT_BEFORE_REFRESH = ms('10m')

export const getToken = (onlyToken: boolean = true): StoredToken | string | undefined => {
  const token = storage.get(TOKEN_KEY)
  const parsed = token && JSON.parse(token)

  return onlyToken ? parsed && parsed.token : parsed
}

export const setToken = (token: string): void => {
  const [, payload] = token.split('.')
  const tokenUser = JSON.parse(atob(payload)) as TokenUser
  const storedToken: StoredToken = { token, expiresAt: tokenUser.exp!, issuedAt: tokenUser.iat! }

  storage.set(TOKEN_KEY, JSON.stringify(storedToken))

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  authEvents.emit('new_token')
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

export const logout = () => {
  storage.del(TOKEN_KEY)
  authEvents.emit('logout')
}

export const login = (email, password) => {
  return axios.post(`${window.API_PATH}/auth/login`, { email, password }).then(result => {
    const { success, token, reason } = result.data.payload

    if (success) {
      setToken(token)
      authEvents.emit('login')
    } else {
      throw new Error(reason)
    }
  })
}

export const setVisitorId = (userId: string, userIdScope?: string) => {
  storage.set(userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user', userId)
  window.__BP_VISITOR_ID = userId
}

export const getUniqueVisitorId = (userIdScope?: string): string => {
  const key = userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user'

  let userId = storage.get(key)
  if (!userId) {
    userId = nanoid()
    storage.set(key, userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}
