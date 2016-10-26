import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '../actions/actionTypes'
const { ALL_NOTIFICATIONS_RECEIVED, NEW_NOTIFICATIONS_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable([])
  },

  initialize() {
    this.on(ALL_NOTIFICATIONS_RECEIVED, allNotificationsReceived)
    this.on(NEW_NOTIFICATIONS_RECEIVED, newNotificationsReceived)
  }
})

function allNotificationsReceived(state, { notifications }) {
  return toImmutable(notifications)
}

function newNotificationsReceived(state, { notifications }) {
  const newNotifications = toImmutable(notifications)
  return state.unshift(...newNotifications)
}
