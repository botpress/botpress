import api from '../api'
import history from '../history'
import ms from 'ms'

export const TOKEN_KEY = 'bp/token'
export const WORKSPACE_KEY = 'bp/workspace'
const HOME_ROUTE = '/home'

export function pullToken() {
  const ls = localStorage.getItem(TOKEN_KEY)
  return (ls && JSON.parse(ls)) || { token: null, expires: 0 }
}

export function setToken(token, expiresAt) {
  const ls = JSON.stringify({ token, expires: expiresAt || new Date() + ms('4h'), time: new Date() })
  localStorage.setItem(TOKEN_KEY, ls)
}

export function setActiveWorkspace(workspaceName) {
  workspaceName ? localStorage.setItem(WORKSPACE_KEY, workspaceName) : localStorage.removeItem(WORKSPACE_KEY)
}

export function getActiveWorkspace() {
  return localStorage.getItem(WORKSPACE_KEY)
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
  login = async ({ email, password, newPassword }, loginUrl) => {
    if (this.isAuthenticated()) {
      return
    }

    const { data } = await api.getAnonymous({ toastErrors: false }).post(
      '/auth' + loginUrl,
      {
        email,
        password,
        newPassword
      },
      { timeout: 15000 }
    )

    const { token } = data.payload
    this.setSession({ expiresIn: 7200, idToken: token })

    await this.setupWorkspace()

    const returnTo = history.location.query.returnTo
    returnTo ? window.location.replace(returnTo) : history.replace(HOME_ROUTE)
  }

  getStrategyConfig = async userStrategy => {
    const { data } = await api.getAnonymous().get('/auth/config')
    if (!data.payload || !data.payload.strategies || !data.payload.strategies.length) {
      return
    }

    const { strategies, isFirstUser } = data.payload

    const strategyId = userStrategy || strategies[0].strategyId
    const strategyConfig = strategies.find(s => s.strategyId === strategyId)

    return strategyConfig && { ...strategyConfig, isFirstUser }
  }

  setupWorkspace = async () => {
    const { data: workspaces } = await api.getSecured().get('/auth/me/workspaces')
    if (!workspaces || !workspaces.length) {
      throw new Error(`You must have access to at least one workspace to login.`)
    }

    // We set either the active workspace, or the first in the list he's allowed otherwise.
    setActiveWorkspace(getActiveWorkspace() || workspaces[0].workspace)
  }

  register = async ({ email, password }, registerUrl) => {
    if (this.isAuthenticated()) {
      return
    }

    const { data } = await api.getAnonymous({ toastErrors: false }).post('/auth' + registerUrl, {
      email,
      password
    })

    this.setSession({ expiresIn: 7200, idToken: data.payload.token })
    await this.setupWorkspace()

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
