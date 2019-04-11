import { handleActions } from 'redux-actions'

import { changeContentLanguage, botInfoReceived } from '~/actions'

const defaultState = {
  contentLang: 'en'
}

const reducer = handleActions(
  {
    [changeContentLanguage]: (state, { payload }) => ({ ...state, ...payload }),
    [botInfoReceived]: (state, { payload }) => ({ ...state, contentLang: payload.defaultLanguage })
  },
  defaultState
)

export default reducer
