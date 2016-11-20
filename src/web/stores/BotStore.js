import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { BOT_INFORMATION_RECEIVED, LICENSE_CHANGED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({})
  },

  initialize() {
    this.on(BOT_INFORMATION_RECEIVED, botInformationReceived)
    this.on(LICENSE_CHANGED, licenseChanged)
  }
})

function botInformationReceived(state, { botInformation }) {
  let newInformation = toImmutable(botInformation)
  return state.merge(newInformation)
}

function licenseChanged(state, { license }) {
  return state.set('license', license)
}
