import api from '../api'

export const FETCH_BOTS_REQUESTED = 'teams/FETCH_BOTS_REQUESTED'
export const FETCH_BOTS_RECEIVED = 'teams/FETCH_BOTS_RECEIVED'

export const FETCH_BOT_TEMPLATES_REQUESTED = 'teams/FETCH_BOT_TEMPLATES_REQUESTED'
export const FETCH_BOT_TEMPLATES_RECEIVED = 'teams/FETCH_BOT_TEMPLATES_RECEIVED'

const initialState = {
  bots: null,
  loadingBots: false,
  botTemplates: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BOT_TEMPLATES_REQUESTED:
      return {
        ...state
      }
    case FETCH_BOT_TEMPLATES_RECEIVED:
      return {
        ...state,
        botTemplates: action.botTemplates
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
  return async (dispatch, getState) => {
    dispatch({
      type: FETCH_BOT_TEMPLATES_REQUESTED
    })

    const { data } = await api.getSecured().get('/modules/botTemplates')

    dispatch({
      type: FETCH_BOT_TEMPLATES_RECEIVED,
      botTemplates: data
    })
  }
}

export const fetchBots = () => {
  return async (dispatch, getState) => {
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
