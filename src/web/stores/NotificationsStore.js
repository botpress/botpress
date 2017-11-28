import { Store, toImmutable } from 'nuclear-js'
import { Howl } from 'howler'
import _ from 'lodash'

import actionTypes from '~/actions/actionTypes'

const { ALL_NOTIFICATIONS_RECEIVED, NEW_NOTIFICATIONS_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable([])
  },

  initialize() {
    this.on(ALL_NOTIFICATIONS_RECEIVED, allNotificationsReceived)
    this.on(NEW_NOTIFICATIONS_RECEIVED, newNotificationsReceived)

    this.sound = new Howl({
      src: ['/audio/notification.mp3']
    })
  }
})

function allNotificationsReceived(state, { notifications }) {
  return toImmutable(notifications)
}

function newNotificationsReceived(state, { notifications }) {
  if (_.some(notifications, { sound: true })) {
    this.sound.play()  
  }

  const newNotifications = notifications.map(toImmutable)
  return state.unshift(...newNotifications)
}
