import api from '~/api'

const FETCH_LICENSING_RECEIVED = 'license/FETCH_LICENSING_RECEIVED'

export interface LicensingState {
  license: any
}

const initialState = {
  license: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LICENSING_RECEIVED:
      return {
        ...state,
        license: action.licensing
      }

    default:
      return state
  }
}

export const fetchLicensing = () => {
  return async dispatch => {
    const { data } = await api.getSecured({ toastErrors: false }).get('admin/management/licensing/status')

    dispatch({
      type: FETCH_LICENSING_RECEIVED,
      licensing: data.payload
    })
  }
}
