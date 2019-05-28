import EventEmitter2 from 'eventemitter2'
import axios from 'axios'
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

export const setVisitorId = userId => {
  storage.set('bp/socket/user', userId)
  window.__BP_VISITOR_ID = userId
}

export const getUniqueVisitorId = () => {
  let userId = storage.get('bp/socket/user')
  if (!userId) {
    userId = nanoid()
    storage.set('bp/socket/user', userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}
