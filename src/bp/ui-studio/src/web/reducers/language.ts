import { handleActions } from 'redux-actions'
import { botInfoReceived, changeContentLanguage, receiveModuleTranslations } from '~/actions'

export interface LanguageReducer {
  contentLang: string
  translations: any | undefined
}

const defaultState: LanguageReducer = {
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
