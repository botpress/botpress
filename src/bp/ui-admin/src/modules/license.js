import api from '../api'

export const FETCH_LICENSE_REQUESTED = 'user/FETCH_LICENSE_REQUESTED'
export const FETCH_LICENSE_RECEIVED = 'user/FETCH_LICENSE_RECEIVED'

const initialState = {
  loading: false,
  licensing: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LICENSE_REQUESTED:
      return {
        ...state,
        loading: true
      }

    case FETCH_LICENSE_RECEIVED:
      return {
        ...state,
        loading: false,
        licensing: action.licensing
      }

    default:
      return state
  }
}

export const fetchLicense = () => {
  return async dispatch => {
    dispatch({ type: FETCH_LICENSE_REQUESTED })

    const { data } = await api.getSecured().get(`/api/license/status`)

    dispatch({
      type: FETCH_LICENSE_RECEIVED,
      licensing: data.payload
    })
  }
}
