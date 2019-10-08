import { AuthRule, AuthStrategyConfig, UserProfile, WorkspaceUser } from 'common/typings'

import api from '../api'
import { logout, setActiveWorkspace } from '../Auth'

import { fetchLicensing } from './license'

export const MY_PROFILE_REQUESTED = 'user/MY_PROFILE_REQUESTED'
export const MY_PROFILE_RECEIVED = 'user/MY_PROFILE_RECEIVED'
export const FETCH_USERS_REQUESTED = 'user/FETCH_USERS_REQUESTED'
export const FETCH_USERS_RECEIVED = 'user/FETCH_USERS_RECEIVED'
export const MY_WORKSPACES_RECEIVED = 'user/MY_WORKSPACES_RECEIVED'
export const AUTH_CONFIG_RECEIVED = 'user/AUTH_CONFIG_RECEIVED'
export const CURRENT_WORKSPACE_CHANGED = 'user/CURRENT_WORKSPACE_CHANGED'

export interface UserState {
  loading: boolean
  loadingUsers: boolean
  workspaces?: WorkspaceUser[]
  permissions?: AuthRule[]
  authConfig?: AuthStrategyConfig[]
  profile?: UserProfile
  users?: WorkspaceUser & { attributes: any }[]
  currentWorkspace?: string
}

const initialState: UserState = {
  users: undefined,
  loading: false,
  loadingUsers: false,
  profile: undefined,
  permissions: undefined,
  workspaces: undefined,
  authConfig: undefined,
  currentWorkspace: undefined
}

export default (state = initialState, action) => {
  switch (action.type) {
    case MY_PROFILE_REQUESTED:
      return {
        ...state,
        loading: true
      }

    case FETCH_USERS_REQUESTED:
      return {
        ...state,
        loadingUsers: true
      }

    case MY_PROFILE_RECEIVED:
      return {
        ...state,
        loading: false,
        profile: action.profile,
        permissions: action.profile.permissions
      }

    case FETCH_USERS_RECEIVED:
      return {
        ...state,
        loadingUsers: false,
        users: action.users
      }

    case MY_WORKSPACES_RECEIVED:
      return {
        ...state,
        workspaces: action.workspaces
      }

    case AUTH_CONFIG_RECEIVED:
      return {
        ...state,
        authConfig: action.authConfig
      }

    case CURRENT_WORKSPACE_CHANGED:
      return {
        ...state,
        currentWorkspace: action.currentWorkspace
      }

    default:
      return state
  }
}

export const fetchUsers = () => {
  return async (dispatch, getState) => {
    const { user: state } = getState()

    if (state.loadingUsers) {
      return
    }

    dispatch({ type: FETCH_USERS_REQUESTED })
    const { data: users } = await api.getSecured().get('/admin/users')
    dispatch({ type: FETCH_USERS_RECEIVED, users: users.payload })
  }
}

export const fetchProfile = () => {
  return async dispatch => {
    dispatch({ type: MY_PROFILE_REQUESTED })

    try {
      const { data } = await api.getSecured().get('/auth/me/profile')
      dispatch({ type: MY_PROFILE_RECEIVED, profile: data.payload })
    } catch (err) {
      logout()
    }
  }
}

export const fetchMyWorkspaces = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/auth/me/workspaces')
    dispatch({ type: MY_WORKSPACES_RECEIVED, workspaces: data })
  }
}

export const fetchAuthConfig = () => {
  return async dispatch => {
    const { data } = await api.getAnonymous().get('/auth/config')
    dispatch({ type: AUTH_CONFIG_RECEIVED, authConfig: data.payload.strategies })
  }
}

export const switchWorkspace = (workspaceId: string) => {
  return async dispatch => {
    setActiveWorkspace(workspaceId)
    await dispatch(fetchProfile())
    await dispatch(fetchLicensing())

    dispatch({ type: CURRENT_WORKSPACE_CHANGED, currentWorkspace: workspaceId })
  }
}
