import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '../actions/actionTypes'
const { MODULES_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable([])
  },

  initialize() {
    this.on(MODULES_RECEIVED, receiveModules)
  }
})

function receiveModules(state, { modules }) {
  let newModules = toImmutable(modules)
  return state.merge(newModules)
}
