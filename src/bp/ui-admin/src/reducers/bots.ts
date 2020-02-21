import { BotConfig, BotTemplate } from 'botpress/sdk'
import { ServerHealth } from 'common/typings'

import api from '../api'

export const FETCH_BOTS_REQUESTED = 'bots/FETCH_BOTS_REQUESTED'
export const FETCH_BOTS_RECEIVED = 'bots/FETCH_BOTS_RECEIVED'
export const FETCH_BOT_HEALTH_RECEIVED = 'bots/FETCH_BOT_STATUS_RECEIVED'
export const FETCH_BOTS_BY_WORKSPACE = 'bots/FETCH_BOTS_BY_WORKSPACE'
export const RECEIVED_BOT_CATEGORIES = 'bots/RECEIVED_BOT_CATEGORIES'
export const RECEIVED_BOT_TEMPLATES = 'bots/RECEIVED_BOT_TEMPLATES'

export interface BotState {
  bots?: BotConfig[]
  botsByWorkspace?: { [workspaceId: string]: string[] }
  health?: ServerHealth
  loadingBots: boolean
  botTemplates?: BotTemplate[]
  botTemplatesFetched: boolean
  botCategories: string[]
  botCategoriesFetched: boolean
}

const initialState: BotState = {
  bots: undefined,
  health: undefined,
  loadingBots: false,
  botTemplates: [],
  botTemplatesFetched: false,
  botCategories: [],
  botCategoriesFetched: false
}

export default (state = initialState, action) => {
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

    default:
      return state
  }
}

export const fetchBotTemplates = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/modules/botTemplates')
    dispatch({
      type: RECEIVED_BOT_TEMPLATES,
      templates: data
    })
  }
}

export const fetchBotCategories = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/bots/categories')

    dispatch({
      type: RECEIVED_BOT_CATEGORIES,
      categories: data.payload.categories
    })
  }
}

export const fetchBots = () => {
  return async dispatch => {
    dispatch({
      type: FETCH_BOTS_REQUESTED
    })

    const { data } = await api.getSecured().get('/admin/bots')
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

export const fetchBotsByWorkspace = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/bots/byWorkspaces')
    if (!data || !data.payload) {
      return
    }

    dispatch({ type: FETCH_BOTS_BY_WORKSPACE, bots: data.payload.bots })
  }
}

export const fetchBotHealth = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/bots/health')
    if (!data || !data.payload) {
      return
    }

    dispatch({ type: FETCH_BOT_HEALTH_RECEIVED, health: data.payload })
  }
}
