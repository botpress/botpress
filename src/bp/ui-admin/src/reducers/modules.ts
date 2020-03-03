import api from '../api'

export const FETCH_MODULES_RECEIVED = 'bots/FETCH_MODULES_RECEIVED'
export const FETCH_LOADED_MODULES_RECEIVED = 'bots/FETCH_LOADED_MODULES_RECEIVED'

export interface ModulesState {
  loadedModules: []
  modules: []
}
const initialState: ModulesState = {
  loadedModules: [],
  modules: []
}

export default (state = initialState, action): ModulesState => {
  switch (action.type) {
    case FETCH_MODULES_RECEIVED:
      return {
        ...state,
        modules: action.modules
      }

    case FETCH_LOADED_MODULES_RECEIVED:
      return {
        ...state,
        loadedModules: action.modules
      }

    default:
      return state
  }
}

export const fetchModules = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/modules/all')
    dispatch({ type: FETCH_MODULES_RECEIVED, modules: data })
  }
}

export const fetchLoadedModules = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/modules')
    dispatch({ type: FETCH_LOADED_MODULES_RECEIVED, modules: data })
  }
}
