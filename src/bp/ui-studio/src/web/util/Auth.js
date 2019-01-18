import EventEmitter2 from 'eventemitter2'
import axios from 'axios'
import nanoid from 'nanoid'

const storageKey = 'bp/token'

export const authEvents = new EventEmitter2()

export const getToken = () => {
  const tokenStr = localStorage.getItem(storageKey)

  if (tokenStr) {
    return JSON.parse(tokenStr)
  }

  return false
}

export const setToken = token => {
  localStorage.setItem(
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
  localStorage.removeItem(storageKey)
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

export const getUniqueVisitorId = () => {
  let userId = localStorage.getItem('bp/socket/user')

  if (!userId) {
    userId = nanoid()
    localStorage.setItem('bp/socket/user', userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}
