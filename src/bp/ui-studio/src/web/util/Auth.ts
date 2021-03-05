import axios from 'axios'
import { CSRF_TOKEN_HEADER } from 'common/auth'
import { EventEmitter2 } from 'eventemitter2'
import nanoid from 'nanoid'

import * as auth from '../../../../ui-shared-lite/auth'
import storage from './storage'

export const authEvents = new EventEmitter2()

export const setToken = (token: any): void => {
  auth.setToken(token)

  axios.defaults.headers.common[CSRF_TOKEN_HEADER] = token.csrf
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  authEvents.emit('new_token')
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
