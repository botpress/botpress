import { ChatUserAuth, StoredToken, TokenUser } from 'common/typings'
import moment from 'moment'
import ms from 'ms'

import api from '../api'
import history from '../history'
export const TOKEN_KEY = 'bp/token'
export const WORKSPACE_KEY = 'bp/workspace'
export const CHAT_USER_AUTH_KEY = 'bp/chat_user_auth'
const HOME_ROUTE = '/home'

export const REFRESH_INTERVAL = ms('5m')
const MIN_MS_LEFT_BEFORE_REFRESH = ms('10m')

export const getToken = (onlyToken: boolean = true): StoredToken | string | undefined => {
  const token = localStorage.getItem(TOKEN_KEY)
  const parsed = token && JSON.parse(token)

  return onlyToken ? parsed && parsed.token : parsed
}

export const setToken = (token: string): void => {
  const [, payload] = token.split('.')
  const tokenUser = JSON.parse(atob(payload)) as TokenUser
  const storedToken: StoredToken = { token, expiresAt: tokenUser.exp!, issuedAt: tokenUser.iat! }

  localStorage.setItem(TOKEN_KEY, JSON.stringify(storedToken))
}

export const isTokenValid = (): boolean => {
  const storedToken = getToken(false) as StoredToken
  if (storedToken) {
    const { token, expiresAt } = storedToken
    return !!token && moment().unix() < expiresAt
  }
  return false
}

export const tokenNeedsRefresh = () => {
  const tokenData = getToken(false) as StoredToken
  const duration = moment.duration(moment.unix(tokenData.expiresAt).diff(moment()))

  return duration.asMilliseconds() < MIN_MS_LEFT_BEFORE_REFRESH
}

export function setActiveWorkspace(workspaceName) {
  workspaceName ? localStorage.setItem(WORKSPACE_KEY, workspaceName) : localStorage.removeItem(WORKSPACE_KEY)
}

export function getActiveWorkspace() {
  return localStorage.getItem(WORKSPACE_KEY)
}

export function setChatUserAuth(auth?: ChatUserAuth) {
  auth ? localStorage.setItem(CHAT_USER_AUTH_KEY, JSON.stringify(auth)) : localStorage.removeItem(CHAT_USER_AUTH_KEY)
}

export function getChatUserAuth(): ChatUserAuth | undefined {
  try {
    return JSON.parse(localStorage.getItem(CHAT_USER_AUTH_KEY) || '')
  } catch (err) {
    return undefined
  }
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

    setToken(data.payload.token)

    await this.afterLoginRedirect(returnTo)
  }

  afterLoginRedirect = async (redirectTo?: string) => {
    // Chat user authentication triggers an event & auto-closes, so must be cleared from storage after.
    const chatUserAuth = getChatUserAuth()
    if (chatUserAuth) {
      try {
        const { data: workspaceId } = await api.getSecured().post('/auth/me/chatAuth', chatUserAuth)
        setActiveWorkspace(workspaceId)

        return history.replace('/chatAuthResult')
      } catch (error) {
        return history.replace({ pathname: '/chatAuthResult', state: { error: error.message } })
      } finally {
        setChatUserAuth(undefined)
      }
    }

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

    setToken(data.payload.token)
    await this.afterLoginRedirect()

    history.replace(HOME_ROUTE)
  }

  logout = () => {
    logout()
  }

  isAuthenticated() {
    return isTokenValid()
  }
}
