import { handleActions } from 'redux-actions'

import { toggleLicenseModal, toggleAboutModal, viewModeChanged, updateGlobalStyle } from '~/actions'

const defaultState = {
  licenseModalOpened: false,
  aboutModalOpened: false,
  viewMode: -1,
  customStyle: {}
}

const reducer = handleActions(
  {
    [toggleLicenseModal]: state => ({
      ...state,
      licenseModalOpened: !state.licenseModalOpened
    }),
    [toggleAboutModal]: state => ({
      ...state,
      aboutModalOpened: !state.aboutModalOpened
    }),
    [viewModeChanged]: (state, { payload }) => ({
      ...state,
      viewMode: payload.toString()
    }),
    [updateGlobalStyle]: (state, { payload }) => ({
      ...state,
      customStyle: Object.assign({}, state.customStyle, payload)
    })
  },
  defaultState
)

export default reducer
