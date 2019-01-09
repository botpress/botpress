import api from '../api'

export const FETCH_LICENSE_RECEIVED = 'license/FETCH_LICENSE_RECEIVED'
export const FETCH_LICENSING_RECEIVED = 'license/FETCH_LICENSING_RECEIVED'
export const FETCH_KEYS_REQUESTED = 'license/FETCH_KEYS_REQUESTED'
export const FETCH_KEYS_RECEIVED = 'license/FETCH_KEYS_RECEIVED'
export const UPDATE_LICENSING_SERVER_TOKEN = 'license/UPDATE_LICENSING_SERVER_TOKEN'

const initialState = {
  license: null,
  licensing: null,
  keys: [],
  isLoadingKeys: false,
  licensingServerToken: null
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

    case FETCH_KEYS_REQUESTED:
      return {
        ...state,
        isLoadingKeys: true
      }

    case FETCH_KEYS_RECEIVED:
      return {
        ...state,
        keys: action.keys,
        isLoadingKeys: false
      }

    case UPDATE_LICENSING_SERVER_TOKEN:
      return {
        ...state,
        licensingServerToken: action.token
      }

    default:
      return state
  }
}

export const fetchLicense = () => {
  return async dispatch => {
    const license = await api
      .getAnonymous()
      .get('/admin/license')
      .then(({ data }) => data)

    dispatch({ type: FETCH_LICENSE_RECEIVED, license })
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

export const fetchAllKeys = () => async dispatch => {
  dispatch({ type: FETCH_KEYS_REQUESTED })

  const { data } = await api.getLicensing().get('/me/keys')

  dispatch({
    type: FETCH_KEYS_RECEIVED,
    keys: data.licenses
  })
}

export const updateLicensingToken = token => async dispatch => {
  dispatch({
    type: UPDATE_LICENSING_SERVER_TOKEN,
    token
  })
}
