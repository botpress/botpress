import ms from 'ms'

import api from '../api'
import history from '../history'

export const TOKEN_KEY = 'bp/token'
export const WORKSPACE_KEY = 'bp/workspace'
const HOME_ROUTE = '/home'

export function pullToken() {
  const ls = localStorage.getItem(TOKEN_KEY)
  return (ls && JSON.parse(ls)) || { token: null, expires: 0 }
}

export function setToken(token, expiresAt) {
  const ls = JSON.stringify({ token, expires: expiresAt || Date.now() + ms('4h'), time: new Date() })
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
  // need to force reload otherwise the token wont clear properly
  window.location.href = window.location.origin + window['ROOT_PATH']
}

interface LoginCredentials {
  email: string
  password: string
  newPassword?: string
}

export default class BasicAuthentication {
  login = async (credentials: LoginCredentials, loginUrl: string, returnTo?: string) => {
    if (this.isAuthenticated()) {
      return
    }

    const { data } = await api
      .getAnonymous({ toastErrors: false })
      .post('/auth' + loginUrl, credentials, { timeout: 15000 })

    const { token } = data.payload
    this.setSession({ expiresIn: 7200, idToken: token })

    await this.setupWorkspace(returnTo)
  }

  setupWorkspace = async (redirectTo?: string) => {
    const { data: workspaces } = await api.getSecured().get('/auth/me/workspaces')
    if (!workspaces || !workspaces.length) {
      return history.replace('/noAccess')
    }

    // We set either the active workspace, or the first in the list he's allowed otherwise.
    setActiveWorkspace(getActiveWorkspace() || workspaces[0].workspace)

    history.replace(redirectTo || HOME_ROUTE)
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
