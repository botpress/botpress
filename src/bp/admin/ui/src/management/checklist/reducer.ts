import { ServerConfig } from 'common/typings'
import api from '~/api'

const FETCH_SERVER_CONFIG_RECEIVED = 'server/FETCH_FEATURE_RECEIVED'

export interface ChecklistState {
  serverConfig?: ServerConfig
  serverConfigLoaded: boolean
}

const initialState: ChecklistState = {
  serverConfig: undefined,
  serverConfigLoaded: false
}

export default (state = initialState, action) => {
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

export const fetchServerConfig = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/management/checklist/serverConfig')
    dispatch({ type: FETCH_SERVER_CONFIG_RECEIVED, serverConfig: data })
  }
}
