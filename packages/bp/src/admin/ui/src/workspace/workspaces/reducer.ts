import { WorkspaceRollout } from 'botpress/sdk'
import { Workspace } from 'common/typings'

import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'
import { getActiveWorkspace } from '~/auth/basicAuth'

const FETCH_WORKSPACES_RECEIVED = 'server/FETCH_WORKSPACES_RECEIVED'
const WORKSPACE_ROLLOUT_RECEIVED = 'user/WORKSPACE_ROLLOUT_RECEIVED'

interface WorkspacesState {
  workspaceRollout?: WorkspaceRollout
  list?: Workspace[]
}

const initialState: WorkspacesState = {
  workspaceRollout: undefined,
  list: undefined
}

export default (state = initialState, action): WorkspacesState => {
  switch (action.type) {
    case FETCH_WORKSPACES_RECEIVED:
      return {
        ...state,
        list: action.workspaces
      }

    case WORKSPACE_ROLLOUT_RECEIVED:
      return {
        ...state,
        workspaceRollout: action.rollout
      }

    default:
      return state
  }
}

export const fetchWorkspaces = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/workspace/workspaces')
    dispatch({ type: FETCH_WORKSPACES_RECEIVED, workspaces: data })
  }
}

export const fetchWorkspaceRollout = (): AppThunk => {
  return async dispatch => {
    const workspaceId = getActiveWorkspace()
    const { data } = await api.getSecured().get(`/admin/workspace/workspaces/${workspaceId}/rollout`)
    dispatch({ type: WORKSPACE_ROLLOUT_RECEIVED, rollout: data })
  }
}
