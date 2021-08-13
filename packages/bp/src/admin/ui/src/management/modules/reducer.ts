import { ModuleDefinition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { ModuleInfo } from 'common/typings'

import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_MODULES_RECEIVED = 'bots/FETCH_MODULES_RECEIVED'
const FETCH_LOADED_MODULES_RECEIVED = 'bots/FETCH_LOADED_MODULES_RECEIVED'
const MODULE_TRANSLATIONS_LOADED = 'bots/MODULE_TRANSLATIONS_LOADED'

interface ModulesState {
  loadedModules: ModuleDefinition[]
  modules: ModuleInfo[]
  translationsLoaded: boolean
}
const initialState: ModulesState = {
  loadedModules: [],
  modules: [],
  translationsLoaded: false
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

    case MODULE_TRANSLATIONS_LOADED:
      return {
        ...state,
        translationsLoaded: true
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
  return async dispatch => {
    const { data } = await api.getSecured({ useV1: true }).get('/modules/translations')

    lang.extend(data)
    lang.init()

    dispatch({ type: MODULE_TRANSLATIONS_LOADED })
  }
}
