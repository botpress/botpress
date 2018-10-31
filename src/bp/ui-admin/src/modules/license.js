import api from '../api'

export const FETCH_LICENSE_RECEIVED = 'license/FETCH_LICENSE_RECEIVED'
export const FETCH_LICENSING_RECEIVED = 'license/FETCH_LICENSING_RECEIVED'

const initialState = {
  license: null,
  licensing: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LICENSE_RECEIVED:
      return {
        ...state,
        license: action.license
      }

    case FETCH_LICENSING_RECEIVED:
      return {
        ...state,
        licensing: action.licensing
      }

    default:
      return state
  }
}

export const fetchLicense = () => {
  return async dispatch => {
    const license = await api
      .getAnonymous()
      .get('/api/license')
      .then(({ data }) => data)

    dispatch({ type: FETCH_LICENSE_RECEIVED, license })
  }
}

export const fetchLicensing = () => {
  return async dispatch => {
    const { data } = await api.getSecured({ toastErrors: false }).get(`/api/license/status`)

    dispatch({
      type: FETCH_LICENSING_RECEIVED,
      licensing: data.payload
    })
  }
}
