import api from '../api'
import { logout } from '../Auth'

export const MY_PROFILE_REQUESTED = 'user/MY_PROFILE_REQUESTED'
export const MY_PROFILE_RECEIVED = 'user/MY_PROFILE_RECEIVED'
export const MY_PERMISSIONS_REQUESTED = 'user/MY_PERMISSIONS_REQUESTED'
export const MY_PERMISSIONS_RECEIVED = 'user/MY_PERMISSIONS_RECEIVED'
export const FETCH_USERS_REQUESTED = 'user/FETCH_USERS_REQUESTED'
export const FETCH_USERS_RECEIVED = 'user/FETCH_USERS_RECEIVED'
export const MY_WORKSPACES_RECEIVED = 'user/MY_WORKSPACES_RECEIVED'
export const AUTH_CONFIG_RECEIVED = 'user/AUTH_CONFIG_RECEIVED'

const initialState = {
  users: null,
  loading: false,
  loadingUsers: false,
  profile: null,
  permissions: null,
  workspaces: null,
  authConfig: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case MY_PROFILE_REQUESTED:
    case MY_PERMISSIONS_REQUESTED:
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
        profile: action.profile
      }

    case MY_PERMISSIONS_RECEIVED:
      return {
        ...state,
        loading: false,
        permissions: action.permissions
      }

    case FETCH_USERS_RECEIVED:
      return {
        ...state,
        loadingUsers: false,
        items: action.users
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

export const fetchPermissions = () => {
  return async dispatch => {
    dispatch({ type: MY_PERMISSIONS_REQUESTED })
    const { data } = await api.getSecured().get(`/auth/me/permissions`)
    dispatch({ type: MY_PERMISSIONS_RECEIVED, permissions: data.payload })
  }
}

export const fetchWorkspaces = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/auth/me/workspaces')
    dispatch({ type: MY_WORKSPACES_RECEIVED, workspaces: data })
  }
}

export const fetchAuthConfig = () => {
  return async dispatch => {
    const { data } = await api.getAnonymous().get('/auth/config')
    dispatch({ type: AUTH_CONFIG_RECEIVED, authConfig: data.payload })
  }
}
