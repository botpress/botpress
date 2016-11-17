import EventEmitter2 from 'eventemitter2'
import axios from 'axios'

const storageKey = 'bp/token'

export const authEvents = (new EventEmitter2())

export const getToken = () => {
  const tokenStr = localStorage.getItem(storageKey)

  if (!!tokenStr) {
    const token = JSON.parse(tokenStr)
    axios.defaults.headers.common['authorization'] = token.token
    return token
  }

  return false
}

export const setToken = (token) => {
  localStorage.setItem(storageKey, JSON.stringify({
    token, time: new Date()
  }))

  axios.defaults.headers.common['authorization'] = token
  authEvents.emit('new_token')
}

export const logout = () => {
  localStorage.removeItem(storageKey)
  authEvents.emit('logout')
}

export const login = (user, password) => {
  return axios.post('/api/login', { user, password })
  .then((result) => {
    if (result.data.success) {
      setToken(result.data.token)
      authEvents.emit('login')
    } else {
      throw new Error(result.data.reason)
    }
  })
}
