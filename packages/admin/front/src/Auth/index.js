import api from '../api'
import history from '../history'

const TOKEN_KEY = 'id_token'
const EXPIRES_KEY = 'expires_at'
const HOME_ROUTE = '/home'

export default class BasicAuthentication {
  login = async ({ username, password }) => {
    if (this.isAuthenticated()) {
      return
    }
    await this.doLogin({ username, password })
  }

  register = async ({ username, password }) => {
    if (this.isAuthenticated()) {
      return
    }
    await this.doRegister({ username, password })
  }

  async doLogin({ username, password }) {
    const { data } = await api.getAnonymous({ toastErrors: false }).post('/api/login', {
      username,
      password
    })

    this.setSession({ expiresIn: 7200, idToken: data.payload.token })

    history.replace(HOME_ROUTE)
  }

  async doRegister({ username, password }) {
    const { data } = await api.getAnonymous({ toastErrors: false }).post('/api/register', {
      username,
      password
    })

    this.setSession({ expiresIn: 7200, idToken: data.payload.token })

    history.replace(HOME_ROUTE)
  }

  setSession({ expiresIn, idToken }) {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((expiresIn || 7200) * 1000 + new Date().getTime())
    localStorage.setItem(TOKEN_KEY, idToken)
    localStorage.setItem(EXPIRES_KEY, expiresAt)
  }

  parseJwt(token) {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace('-', '+').replace('_', '/')
    return JSON.parse(window.atob(base64))
  }

  logout = () => {
    // Clear access token and ID token from local storage
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    // navigate to the home route
    history.replace(HOME_ROUTE)
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem(EXPIRES_KEY))
    return new Date().getTime() < expiresAt && localStorage.getItem(TOKEN_KEY)
  }
}
