import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { USER_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({})
  },

  initialize() {
    this.on(USER_RECEIVED, receiveUser)
  }
})

function receiveUser(state, { user }) {
  let newUser = toImmutable(user)
  return state.merge(newUser)
}
