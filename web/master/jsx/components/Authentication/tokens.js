import axios from 'axios'

const storageKey = 'skin/token'

export const getToken = () => {
  localStorage.getItem(storageKey)
}

export const setToken = (token) => {
  localStorage.setItem(storageKey, token)
}

export const logout = () => {
  localStorage.removeItem(storageKey)
}

export const login = (user, password) => {
  return axios.post('/api/login', { user, password })
  .then((result) => {
    if(result.success) {
      setToken(result.token)
    } else {
      throw new Error(result.reason)
    }
  })
}
