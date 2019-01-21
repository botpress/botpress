import api from '../api'

export const FETCH_ROLES_REQUESTED = 'roles/FETCH_ROLES_REQUESTED'
export const FETCH_ROLES_RECEIVED = 'roles/FETCH_ROLES_RECEIVED'

const initialState = {
  roles: [],
  loading: false
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ROLES_REQUESTED:
      return {
        ...state,
        loading: true
      }
    case FETCH_ROLES_RECEIVED:
      return {
        ...state,
        loading: false,
        roles: action.roles
      }
    default:
      return state
  }
}

export const fetchRoles = () => {
  return async (dispatch, getState) => {
    const { roles: state } = getState()

    if (state.loading) {
      return
    }

    dispatch({
      type: FETCH_ROLES_REQUESTED
    })

    const { data } = await api.getSecured().get('/admin/roles')

    dispatch({
      type: FETCH_ROLES_RECEIVED,
      roles: data.payload.roles
    })
  }
}
