import axios from 'axios'

import reactor from '~/reactor'
import EventBus from '~/util/EventBus'

import actionTypes from '~/actions/actionTypes'
const {
  MODULES_RECEIVED,
  ALL_NOTIFICATIONS_RECEIVED,
  NEW_NOTIFICATIONS_RECEIVED,
  TOGGLE_LICENSE_MODAL,
  BOT_INFORMATION_RECEIVED,
  LICENSE_CHANGED,
  TOGGLE_ABOUT_MODAL
} = actionTypes

export default {
  fetchModules() {
    axios.get('/api/modules')
    .then((result) => {
      reactor.dispatch(MODULES_RECEIVED, { modules: result.data })
    })
  },

  fetchNotifications() {
    axios.get('/api/notifications')
    .then((result) => {
      reactor.dispatch(ALL_NOTIFICATIONS_RECEIVED, { notifications: result.data })
    })
  },

  replaceNotifications(allNotifications) {
    reactor.dispatch(ALL_NOTIFICATIONS_RECEIVED, { notifications: allNotifications })
  },

  addNotifications(notifications) {
    reactor.dispatch(NEW_NOTIFICATIONS_RECEIVED, { notifications })
  },

  toggleLicenseModal() {
    reactor.dispatch(TOGGLE_LICENSE_MODAL)
  },

  toggleAboutModal() {
    reactor.dispatch(TOGGLE_ABOUT_MODAL)
  },

  fetchBotInformation() {
    axios.get('/api/bot/information')
    .then((information) => {
      axios.get('/api/bot/production')
      .then((production) => {
        const botInformationWithProduction = information.data
        botInformationWithProduction.production = production.data

        reactor.dispatch(BOT_INFORMATION_RECEIVED, { botInformation: botInformationWithProduction })
      })
    })
  },

  licenseChanged(license) {
    reactor.dispatch(LICENSE_CHANGED, { license })
  }
}
