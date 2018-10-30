import api from '../api'

export const MY_PROFILE_REQUESTED = 'user/MY_PROFILE_REQUESTED'
export const MY_PROFILE_RECEIVED = 'user/MY_PROFILE_RECEIVED'
export const MY_PERMISSIONS_REQUESTED = 'user/MY_PERMISSIONS_REQUESTED'
export const MY_PERMISSIONS_RECEIVED = 'user/MY_PERMISSIONS_RECEIVED'
export const FETCH_USERS_REQUESTED = 'user/FETCH_USERS_REQUESTED'
export const FETCH_USERS_RECEIVED = 'user/FETCH_USERS_RECEIVED'

const initialState = {
  users: null,
  loading: false,
  loadingUsers: false,
  profile: null,
  permissions: {}
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
        permissions: {
          ...state.permissions,
          [action.teamId]: action.permissions
        }
      }

    case FETCH_USERS_RECEIVED:
      return {
        ...state,
        loadingUsers: false,
        items: action.users
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

    dispatch({
      type: FETCH_USERS_REQUESTED
    })

    const { data: users } = await api.getSecured().get('/api/users')

    dispatch({
      type: FETCH_USERS_RECEIVED,
      users: users.payload
    })
  }
}

export const fetchProfile = () => {
  return async dispatch => {
    dispatch({ type: MY_PROFILE_REQUESTED })

    const { data } = await api.getSecured().get('/api/auth/me/profile')

    dispatch({
      type: MY_PROFILE_RECEIVED,
      profile: data.payload
    })
  }
}

export const fetchPermissions = teamId => {
  return async dispatch => {
    dispatch({ type: MY_PERMISSIONS_REQUESTED })

    const { data } = await api.getSecured().get(`/api/auth/me/permissions/${teamId}`)

    dispatch({
      type: MY_PERMISSIONS_RECEIVED,
      teamId,
      permissions: data.payload
    })
  }
}
