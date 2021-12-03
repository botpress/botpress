import { LicensingStatus } from 'common/typings'
import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_LICENSING_RECEIVED = 'license/FETCH_LICENSING_RECEIVED'

interface LicensingState {
  license?: LicensingStatus
}

const initialState: LicensingState = {
  license: undefined
}

export default (state = initialState, action): LicensingState => {
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

export const fetchLicensing = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured({ toastErrors: false }).get('admin/management/licensing/status')

    dispatch({
      type: FETCH_LICENSING_RECEIVED,
      licensing: data.payload
    })
  }
}
