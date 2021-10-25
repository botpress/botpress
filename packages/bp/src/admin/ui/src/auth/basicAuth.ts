import { auth } from 'botpress/shared'
import { ChatUserAuth } from 'common/typings'

import api from '~/app/api'
import history from '~/app/history'

export const WORKSPACE_KEY = 'bp/workspace'
export const CHAT_USER_AUTH_KEY = 'bp/chat_user_auth'
const HOME_ROUTE = '/home'

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
      .post(`/admin/auth${loginUrl}`, credentials, { timeout: 15000 })

    auth.setToken(data.payload)

    await this.afterLoginRedirect(returnTo)
  }

  afterLoginRedirect = async (redirectTo?: string) => {
    // Chat user authentication triggers an event & auto-closes, so must be cleared from storage after.
    const chatUserAuth = getChatUserAuth()
    if (chatUserAuth) {
      try {
        const { data: workspaceId } = await api.getSecured().post('/admin/auth/me/chatAuth', chatUserAuth)
        setActiveWorkspace(workspaceId)

        return history.replace('/chatAuthResult')
      } catch (error) {
        return history.replace({ pathname: '/chatAuthResult', state: { error: error.message } })
      } finally {
        setChatUserAuth(undefined)
      }
    }

    const { data: workspaces } = await api.getSecured().get('/admin/user/workspaces')
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

    const { data } = await api.getAnonymous({ toastErrors: false }).post(`/admin/auth${registerUrl}`, {
      email,
      password
    })

    auth.setToken(data.payload)
    await this.afterLoginRedirect()

    history.replace(HOME_ROUTE)
  }

  logout = async () => {
    auth.logout(() => api.getSecured())
  }

  isAuthenticated() {
    return auth.isTokenValid()
  }
}
