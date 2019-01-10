import api from '../api'

export const FETCH_PENDING_CHANGES = 'versioning/FETCH_PENDING_CHANGES'
export const RECEIVE_PENDING_CHANGES = 'versioning/RECEIVE_PENDING_CHANGES'
export const EXPORT_CHANGES = 'versioning/EXPORT_CHANGES'

const initialState = {
  pendingChanges: {},
  loading: false,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PENDING_CHANGES:
      return {
        ...state,
        loading: true
      }
    case RECEIVE_PENDING_CHANGES:
      return {
        loading: false,
        pendingChanges: action.pendingChanges
      }
    default:
      return state
  }
}

export const fetchPendingChanges = () => {
  return async dispatch => {
    dispatch({ type: FETCH_PENDING_CHANGES })

    const { data } = await api.getSecured().get(`/admin/versioning/pending`)
    dispatch({
      type: RECEIVE_PENDING_CHANGES,
      pendingChanges: data
    })
  }
}
