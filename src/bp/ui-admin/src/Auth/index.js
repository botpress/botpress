import api from '../api'
import history from '../history'
import ms from 'ms'

export const TOKEN_KEY = 'bp/token'
const HOME_ROUTE = '/home'

export function pullToken() {
  const ls = localStorage.getItem(TOKEN_KEY)
  return (ls && JSON.parse(ls)) || { token: null, expires: 0 }
}

export function setToken(token, expiresAt) {
  const ls = JSON.stringify({ token, expires: expiresAt || new Date() + ms('4h'), time: new Date() })
  localStorage.setItem(TOKEN_KEY, ls)
}

export function logout() {
  // Clear access token and ID token from local storage
  localStorage.removeItem(TOKEN_KEY)
  // navigate to the home route
  history.replace(HOME_ROUTE)
  // need to force reload otherwise the token wont clear properly
  window.location.reload()
}

export default class BasicAuthentication {
  login = async ({ email, password, newPassword }) => {
    if (this.isAuthenticated()) {
      return
    }
    await this.doLogin({ email, password, newPassword })
  }

  async doLogin({ email, password, newPassword }) {
    const { data } = await api.getAnonymous({ toastErrors: false }).post('/auth/login', {
      email,
      password,
      newPassword
    })

    this.setSession({ expiresIn: 7200, idToken: data.payload.token })

    const returnTo = history.location.query.returnTo
    if (returnTo) {
      window.location.replace(returnTo)
    } else {
      history.replace(HOME_ROUTE)
    }
  }

  register = async ({ email, password }) => {
    if (this.isAuthenticated()) {
      return
    }
    await this.doRegister({ email, password })
  }

  async doRegister({ email, password }) {
    const { data } = await api.getAnonymous({ toastErrors: false }).post('/auth/register', {
      email,
      password
    })

    this.setSession({ expiresIn: 7200, idToken: data.payload.token })
    history.replace(HOME_ROUTE)
  }

  setSession({ expiresIn, idToken }) {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((expiresIn || 7200) * 1000 + new Date().getTime())
    setToken(idToken, expiresAt)
  }

  parseJwt(token) {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace('-', '+').replace('_', '/')
    return JSON.parse(window.atob(base64))
  }

  logout = () => {
    logout()
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    const { token, expires } = pullToken()
    return token && new Date().getTime() < expires
  }
}
