import { ModuleDefinition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { ModuleInfo } from 'common/typings'

import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_MODULES_RECEIVED = 'bots/FETCH_MODULES_RECEIVED'
const FETCH_LOADED_MODULES_RECEIVED = 'bots/FETCH_LOADED_MODULES_RECEIVED'

interface ModulesState {
  loadedModules: ModuleDefinition[]
  modules: ModuleInfo[]
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

export const fetchModules = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured({ useV1: true }).get('/modules/all')
    dispatch({ type: FETCH_MODULES_RECEIVED, modules: data })
  }
}

export const fetchLoadedModules = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured({ useV1: true }).get('/modules')
    dispatch({ type: FETCH_LOADED_MODULES_RECEIVED, modules: data })
  }
}

export const loadModulesTranslations = (): AppThunk => {
  return async () => {
    const { data } = await api.getSecured({ useV1: true }).get('/modules/translations')

    lang.extend(data)
    lang.init()
  }
}
