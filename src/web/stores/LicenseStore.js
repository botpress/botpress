import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { LICENSE_CHANGED, LICENSE_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({})
  },

  initialize() {
    this.on(LICENSE_RECEIVED, licenseReceived)
    this.on(LICENSE_CHANGED, licenseChanged)
  }
})

function licenseReceived(state, { license }) {
  let newLicense = toImmutable(license)
  return state.merge(newLicense)
}

function licenseChanged(state, { license }) {
  return state.set('license', license)
}
