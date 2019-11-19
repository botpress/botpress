import api from '../api'

export const FETCH_LANGUAGES_RECEIVED = 'server/FETCH_LANGUAGES_RECEIVED'
export const FETCH_WORKSPACES_RECEIVED = 'server/FETCH_WORKSPACES_RECEIVED'
export const FETCH_SERVER_CONFIG_RECEIVED = 'server/FETCH_FEATURE_RECEIVED'

const initialState = {
  languages: null,
  workspaces: null,
  serverConfig: null,
  serverConfigLoaded: false
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LANGUAGES_RECEIVED:
      return {
        ...state,
        languages: action.languages
      }

    case FETCH_WORKSPACES_RECEIVED:
      return {
        ...state,
        workspaces: action.workspaces
      }

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

export const fetchLanguages = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/languages/available')
    dispatch({ type: FETCH_LANGUAGES_RECEIVED, languages: data.languages })
  }
}

export const fetchWorkspaces = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/workspaces')
    dispatch({ type: FETCH_WORKSPACES_RECEIVED, workspaces: data })
  }
}

export const fetchServerConfig = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/server/serverConfig')
    dispatch({ type: FETCH_SERVER_CONFIG_RECEIVED, serverConfig: data })
  }
}
