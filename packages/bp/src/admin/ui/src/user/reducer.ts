import { WorkspaceUser } from 'botpress/sdk'
import { auth } from 'botpress/shared'
import { AuthRule, UserProfile } from 'common/typings'

import { AppThunk } from '~/app/rootReducer'
import { fetchLicensing } from '~/management/licensing/reducer'
import api from '../app/api'
import { setActiveWorkspace } from '../auth/basicAuth'

const MY_PROFILE_REQUESTED = 'user/MY_PROFILE_REQUESTED'
const MY_PROFILE_RECEIVED = 'user/MY_PROFILE_RECEIVED'
const MY_WORKSPACES_RECEIVED = 'user/MY_WORKSPACES_RECEIVED'
const CURRENT_WORKSPACE_CHANGED = 'user/CURRENT_WORKSPACE_CHANGED'

export interface UserState {
  loading: boolean
  workspaces?: WorkspaceUser[]
  permissions?: AuthRule[]
  profile?: UserProfile
  currentWorkspace?: string
}

const initialState: UserState = {
  loading: false,
  profile: undefined,
  permissions: undefined,
  workspaces: undefined,
  currentWorkspace: undefined
}

export default (state = initialState, action): UserState => {
  switch (action.type) {
    case MY_PROFILE_REQUESTED:
      return {
        ...state,
        loading: true
      }

    case MY_PROFILE_RECEIVED:
      return {
        ...state,
        loading: false,
        profile: action.profile,
        permissions: action.profile.permissions
      }

    case MY_WORKSPACES_RECEIVED:
      return {
        ...state,
        workspaces: action.workspaces
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

export const fetchProfile = (): AppThunk => {
  return async dispatch => {
    dispatch({ type: MY_PROFILE_REQUESTED })

    try {
      const { data } = await api.getSecured().get('/admin/user/profile')
      dispatch({ type: MY_PROFILE_RECEIVED, profile: data.payload })
    } catch (err) {
      auth.logout(() => api.getSecured())
    }
  }
}

export const fetchMyWorkspaces = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/user/workspaces')
    dispatch({ type: MY_WORKSPACES_RECEIVED, workspaces: data })
  }
}

export const switchWorkspace = (workspaceId: string): AppThunk => {
  return async dispatch => {
    setActiveWorkspace(workspaceId)
    dispatch(fetchProfile())
    dispatch(fetchLicensing())

    dispatch({ type: CURRENT_WORKSPACE_CHANGED, currentWorkspace: workspaceId })
  }
}
