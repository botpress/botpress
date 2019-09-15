import axios from 'axios'
import { EventEmitter2 } from 'eventemitter2'
import nanoid from 'nanoid'

import storage from './storage'

const storageKey = 'bp/token'

export const authEvents = new EventEmitter2()

export const getToken = () => {
  const tokenStr = storage.get(storageKey)

  if (tokenStr) {
    return JSON.parse(tokenStr)
  }

  return false
}

export const setToken = token => {
  storage.set(
    storageKey,
    JSON.stringify({
      token,
      time: new Date()
    })
  )

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  authEvents.emit('new_token')
}

export const logout = () => {
  storage.del(storageKey)
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
