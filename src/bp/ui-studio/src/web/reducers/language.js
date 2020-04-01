import { handleActions } from 'redux-actions'

import { changeContentLanguage, botInfoReceived, receiveModuleTranslations } from '~/actions'

const defaultState = {
  contentLang: 'en',
  translations: undefined
}

const reducer = handleActions(
  {
    [changeContentLanguage]: (state, { payload }) => ({ ...state, ...payload }),
    [botInfoReceived]: (state, { payload }) => ({ ...state, contentLang: payload.defaultLanguage }),
    [receiveModuleTranslations]: (state, { payload }) => ({ ...state, translations: payload })
  },
  defaultState
)

export default reducer
