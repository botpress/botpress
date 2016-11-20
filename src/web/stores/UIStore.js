import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { TOGGLE_LICENSE_MODAL } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({
      licenseModalOpened: false
    })
  },

  initialize() {
    this.on(TOGGLE_LICENSE_MODAL, toggleLicenseModal)
  }
})

function toggleLicenseModal(state) {
  return state.set('licenseModalOpened', !state.get('licenseModalOpened'))
}
