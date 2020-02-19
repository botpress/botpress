import api from '../api'

export const FETCH_LICENSING_RECEIVED = 'license/FETCH_LICENSING_RECEIVED'

const initialState = {
  licensing: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LICENSING_RECEIVED:
      return {
        ...state,
        licensing: action.licensing
      }

    default:
      return state
  }
}

export const fetchLicensing = () => {
  return async dispatch => {
    const { data } = await api.getSecured({ toastErrors: false }).get(`admin/license/status`)

    dispatch({
      type: FETCH_LICENSING_RECEIVED,
      licensing: data.payload
    })
  }
}
