import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { 
  TOGGLE_LICENSE_MODAL,
  TOGGLE_ABOUT_MODAL,
  VIEW_MODE_CHANGED
} = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({
      licenseModalOpened: false,
      aboutModalOpened: false,
      viewMode: -1
    })
  },

  initialize() {
    this.on(TOGGLE_LICENSE_MODAL, toggleLicenseModal)
    this.on(TOGGLE_ABOUT_MODAL, toggleAboutModal)
    this.on(VIEW_MODE_CHANGED, viewModeChanged)
  }
})

function toggleLicenseModal(state) {
  return state.set('licenseModalOpened', !state.get('licenseModalOpened'))
}

function toggleAboutModal(state) {
  return state.set('aboutModalOpened', !state.get('aboutModalOpened'))
}

function viewModeChanged(state, { mode }) {
  return state.set('viewMode', mode.toString())
}
