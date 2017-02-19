import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { TOGGLE_LICENSE_MODAL, TOGGLE_ABOUT_MODAL } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({
      licenseModalOpened: false,
      aboutModalOpened: false
    })
  },

  initialize() {
    this.on(TOGGLE_LICENSE_MODAL, toggleLicenseModal)
    this.on(TOGGLE_ABOUT_MODAL, toggleAboutModal)
  }
})

function toggleLicenseModal(state) {
  return state.set('licenseModalOpened', !state.get('licenseModalOpened'))
}

function toggleAboutModal(state) {
  return state.set('aboutModalOpened', !state.get('aboutModalOpened'))
}
