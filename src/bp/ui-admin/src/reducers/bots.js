import api from '../api'

export const FETCH_BOTS_REQUESTED = 'bots/FETCH_BOTS_REQUESTED'
export const FETCH_BOTS_RECEIVED = 'bots/FETCH_BOTS_RECEIVED'
export const RECEIVED_BOT_CATEGORIES = 'bots/RECEIVED_BOT_CATEGORIES'
export const RECEIVED_BOT_TEMPLATES = 'bots/RECEIVED_BOT_TEMPLATES'

const initialState = {
  bots: null,
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

    dispatch({
      type: FETCH_BOTS_RECEIVED,
      bots: data.payload.bots,
      workspace: data.payload.workspace
    })
  }
}
