import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { RULES_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable([])
  },

  initialize() {
    this.on(RULES_RECEIVED, receiveRules)
  }
})

function receiveRules(state, { rules }) {
  let newRules = toImmutable(rules)
  return state.merge(newRules)
}
