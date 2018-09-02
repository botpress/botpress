import api from '../api'

export const MY_PROFILE_REQUESTED = 'user/MY_PROFILE_REQUESTED'
export const MY_PROFILE_RECEIVED = 'user/MY_PROFILE_RECEIVED'
export const MY_PERMISSIONS_REQUESTED = 'user/MY_PERMISSIONS_REQUESTED'
export const MY_PERMISSIONS_RECEIVED = 'user/MY_PERMISSIONS_RECEIVED'

const initialState = {
  loading: false,
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

    default:
      return state
  }
}

export const fetchProfile = () => {
  return async dispatch => {
    dispatch({ type: MY_PROFILE_REQUESTED })

    const { data } = await api.getSecured().get('/api/me/profile')

    dispatch({
      type: MY_PROFILE_RECEIVED,
      profile: data.payload
    })
  }
}

export const fetchPermissions = teamId => {
  return async dispatch => {
    dispatch({ type: MY_PERMISSIONS_REQUESTED })

    const { data } = await api.getSecured().get(`/api/me/permissions/${teamId}`)

    dispatch({
      type: MY_PERMISSIONS_RECEIVED,
      teamId,
      permissions: data.payload
    })
  }
}
