import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { TOGGLE_LICENSE_MODAL, TOGGLE_ABOUT_MODAL, VIEW_MODE_CHANGED, UPDATE_GLOBAL_STYLE } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({
      licenseModalOpened: false,
      aboutModalOpened: false,
      viewMode: -1,
      customStyle: {}
    })
  },

  initialize() {
    this.on(TOGGLE_LICENSE_MODAL, toggleLicenseModal)
    this.on(TOGGLE_ABOUT_MODAL, toggleAboutModal)
    this.on(VIEW_MODE_CHANGED, viewModeChanged)
    this.on(UPDATE_GLOBAL_STYLE, updateStyleChanged)
  }
})

function updateStyleChanged(state, { style }) {
  return state.set('customStyle', Object.assign({}, state.get('customStyle'), style))
}

function toggleLicenseModal(state) {
  return state.set('licenseModalOpened', !state.get('licenseModalOpened'))
}

function toggleAboutModal(state) {
  return state.set('aboutModalOpened', !state.get('aboutModalOpened'))
}

function viewModeChanged(state, { mode }) {
  return state.set('viewMode', mode.toString())
}
