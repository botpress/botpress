import { BotConfig, BotTemplate } from 'botpress/sdk'
import { ServerHealth } from 'common/typings'

import { ALL_BOTS } from 'common/utils'
import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

const FETCH_BOTS_REQUESTED = 'bots/FETCH_BOTS_REQUESTED'
const FETCH_BOTS_RECEIVED = 'bots/FETCH_BOTS_RECEIVED'
const FETCH_BOT_HEALTH_RECEIVED = 'bots/FETCH_BOT_STATUS_RECEIVED'
const FETCH_BOTS_BY_WORKSPACE = 'bots/FETCH_BOTS_BY_WORKSPACE'
const RECEIVED_BOT_CATEGORIES = 'bots/RECEIVED_BOT_CATEGORIES'
const RECEIVED_BOT_TEMPLATES = 'bots/RECEIVED_BOT_TEMPLATES'
const SET_WORKSPACE_APPS_BOT_ID = 'bots/SET_WORKSPACE_APPS_BOT_ID'
const FETCH_BOT_NLU_LANGUAGES_RECEIVED = 'bots/FETCH_BOT_NLU_LANGUAGES_RECEIVED'

interface BotState {
  bots: BotConfig[]
  botsByWorkspace?: { [workspaceId: string]: string[] }
  health?: ServerHealth[]
  loadingBots: boolean
  botTemplates?: BotTemplate[]
  botTemplatesFetched: boolean
  botCategories: string[]
  botCategoriesFetched: boolean
  workspace?: { name: string; pipeline: any; botPrefix?: string }
  // Sets the current bot used by workspace apps
  workspaceAppsBotId?: string
  // Fetches the list of languages available with the NLU
  nluLanguages: string[]
}

const initialState: BotState = {
  bots: [],
  health: undefined,
  loadingBots: false,
  botTemplates: [],
  botTemplatesFetched: false,
  botCategories: [],
  botCategoriesFetched: false,
  workspace: undefined,
  nluLanguages: []
}

export default (state = initialState, action): BotState => {
  switch (action.type) {
    case RECEIVED_BOT_CATEGORIES:
      return {
        ...state,
        botCategories: action.categories || [],
        botCategoriesFetched: true
      }
    case RECEIVED_BOT_TEMPLATES:
      return {
        ...state,
        botTemplates: action.templates || [],
        botTemplatesFetched: true
      }
    case FETCH_BOTS_REQUESTED:
      return {
        ...state,
        loadingBots: true
      }

    case FETCH_BOTS_RECEIVED:
      return {
        ...state,
        loadingBots: false,
        bots: action.bots,
        workspace: action.workspace
      }

    case FETCH_BOT_HEALTH_RECEIVED:
      return {
        ...state,
        health: action.health
      }

    case FETCH_BOTS_BY_WORKSPACE:
      return {
        ...state,
        botsByWorkspace: action.bots
      }

    case SET_WORKSPACE_APPS_BOT_ID:
      return {
        ...state,
        workspaceAppsBotId: action.botId
      }

    case FETCH_BOT_NLU_LANGUAGES_RECEIVED:
      return {
        ...state,
        nluLanguages: action.languages
      }

    default:
      return state
  }
}

export const fetchBotTemplates = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/workspace/bots/templates')
    dispatch({
      type: RECEIVED_BOT_TEMPLATES,
      templates: data
    })
  }
}

export const fetchBotCategories = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/workspace/bots/categories')

    dispatch({
      type: RECEIVED_BOT_CATEGORIES,
      categories: data.payload.categories
    })
  }
}

export const fetchBots = (): AppThunk => {
  return async dispatch => {
    dispatch({ type: FETCH_BOTS_REQUESTED })

    const { data } = await api.getSecured().get('/admin/workspace/bots')
    if (!data || !data.payload) {
      return
    }

    dispatch({
      type: FETCH_BOTS_RECEIVED,
      bots: data.payload.bots,
      workspace: data.payload.workspace
    })
  }
}

export const fetchBotsByWorkspace = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/workspace/bots/byWorkspaces')
    if (!data || !data.payload) {
      return
    }

    dispatch({ type: FETCH_BOTS_BY_WORKSPACE, bots: data.payload.bots })
  }
}

export const fetchBotHealth = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/workspace/bots/health')
    if (!data || !data.payload) {
      return
    }

    dispatch({ type: FETCH_BOT_HEALTH_RECEIVED, health: data.payload })
  }
}

export const fetchBotNLULanguages = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured({ useV1: true }).get(`/bots/${ALL_BOTS}/mod/nlu/health`)
    if (!data || !data.validLanguages) {
      return
    }
    dispatch({ type: FETCH_BOT_NLU_LANGUAGES_RECEIVED, languages: data.validLanguages })
  }
}

export const setWorkspaceAppBotId = (botId?: string): AppThunk => {
  return async dispatch => {
    dispatch({ type: SET_WORKSPACE_APPS_BOT_ID, botId })
  }
}
