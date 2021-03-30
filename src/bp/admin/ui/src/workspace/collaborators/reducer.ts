import { WorkspaceUserWithAttributes } from 'botpress/sdk'

import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_USERS_REQUESTED = 'user/FETCH_USERS_REQUESTED'
const FETCH_USERS_RECEIVED = 'user/FETCH_USERS_RECEIVED'
const AVAILABLE_USERS_RECEIVED = 'user/AVAILABLE_USERS_RECEIVED'

interface CollaboratorsState {
  loading: boolean
  users?: WorkspaceUserWithAttributes[]
  availableUsers?: WorkspaceUserWithAttributes[]
}

const initialState: CollaboratorsState = {
  users: undefined,
  loading: false
}

export default (state = initialState, action): CollaboratorsState => {
  switch (action.type) {
    case FETCH_USERS_REQUESTED:
      return {
        ...state,
        loading: true
      }

    case FETCH_USERS_RECEIVED:
      return {
        ...state,
        loading: false,
        users: action.users
      }

    case AVAILABLE_USERS_RECEIVED:
      return {
        ...state,
        availableUsers: action.availableUsers
      }

    default:
      return state
  }
}

export const fetchUsers = (filterRoles?: string): AppThunk => {
  return async (dispatch, getState) => {
    const { user: state } = getState()

    if (state.loading) {
      return
    }

    dispatch({ type: FETCH_USERS_REQUESTED })
    const query = (filterRoles && `?roles=${filterRoles}`) || ''
    const { data: users } = await api.getSecured().get(`/admin/workspace/collaborators${query}`)
    dispatch({ type: FETCH_USERS_RECEIVED, users: users.payload })
  }
}

export const fetchAvailableUsers = (filterRoles?: string): AppThunk => {
  const query = (filterRoles && `?roles=${filterRoles}`) || ''
  return async dispatch => {
    const { data } = await api.getSecured().get(`/admin/workspace/collaborators/listAvailableUsers${query}`)
    dispatch({ type: AVAILABLE_USERS_RECEIVED, availableUsers: data.payload })
  }
}
