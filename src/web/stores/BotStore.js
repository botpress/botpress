import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { BOT_INFORMATION_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({})
  },

  initialize() {
    this.on(BOT_INFORMATION_RECEIVED, botInformationReceived)
  }
})

function botInformationReceived(state, { information }) {
  let newInformation = toImmutable(information)
  return state.merge(newInformation)
}
