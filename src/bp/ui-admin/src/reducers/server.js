import api from '../api'

export const FETCH_LANGUAGES_RECEIVED = 'server/FETCH_LANGUAGES_RECEIVED'

const initialState = {
  languages: null
}

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LANGUAGES_RECEIVED:
      return {
        ...state,
        languages: action.languages
      }

    default:
      return state
  }
}

export const fetchLanguages = () => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/bots/languages')

    dispatch({
      type: FETCH_LANGUAGES_RECEIVED,
      languages: data
    })
  }
}
