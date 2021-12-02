import { ServerConfig } from 'common/typings'
import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_SERVER_CONFIG_RECEIVED = 'server/FETCH_SERVER_CONFIG_RECEIVED'

interface ChecklistState {
  serverConfig?: ServerConfig
  serverConfigLoaded: boolean
}

const initialState: ChecklistState = {
  serverConfig: undefined,
  serverConfigLoaded: false
}

export default (state = initialState, action): ChecklistState => {
  switch (action.type) {
    case FETCH_SERVER_CONFIG_RECEIVED:
      return {
        ...state,
        serverConfig: action.serverConfig,
        serverConfigLoaded: true
      }

    default:
      return state
  }
}

export const fetchServerConfig = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/management/checklist/serverConfig')
    dispatch({ type: FETCH_SERVER_CONFIG_RECEIVED, serverConfig: data })
  }
}
