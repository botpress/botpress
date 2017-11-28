import axios from 'axios'
import reactor from '~/reactor'

import actions from '+/actions'

import actionTypes from '~/actions/actionTypes'

const {
  MODULES_RECEIVED,
  ALL_NOTIFICATIONS_RECEIVED,
  NEW_NOTIFICATIONS_RECEIVED,
  TOGGLE_LICENSE_MODAL,
  BOT_INFORMATION_RECEIVED,
  LICENSE_RECEIVED,
  LICENSE_CHANGED,
  TOGGLE_ABOUT_MODAL,
  USER_RECEIVED,
  VIEW_MODE_CHANGED
} = actionTypes

const fetchModules = () => {
  axios.get('/api/modules').then(res => {
    reactor.dispatch(MODULES_RECEIVED, { modules: res.data })
  })
}

const fetchNotifications = () => {
  axios.get('/api/notifications/inbox').then(res => {
    reactor.dispatch(ALL_NOTIFICATIONS_RECEIVED, { notifications: res.data })
  })
}

const replaceNotifications = allNotifications => {
  reactor.dispatch(ALL_NOTIFICATIONS_RECEIVED, { notifications: allNotifications })
}

const addNotifications = notifications => {
  reactor.dispatch(NEW_NOTIFICATIONS_RECEIVED, { notifications })
}

const toggleLicenseModal = () => {
  reactor.dispatch(TOGGLE_LICENSE_MODAL)
}

const toggleAboutModal = () => {
  reactor.dispatch(TOGGLE_ABOUT_MODAL)
}

const fetchBotInformation = () => {
  axios.get('/api/bot/information').then(information => {
    axios.get('/api/bot/production').then(production => {
      const botInformationWithProduction = information.data
      botInformationWithProduction.production = production.data

      reactor.dispatch(BOT_INFORMATION_RECEIVED, { botInformation: botInformationWithProduction })
    })
  })
}

const fetchLicense = () => {
  axios.get('/api/license').then(({ data }) => {
    reactor.dispatch(LICENSE_RECEIVED, { license: data })
  })
}

const licenseChanged = license => {
  reactor.dispatch(LICENSE_CHANGED, { license })
}

const fetchUser = () => {
  axios.get('/api/my-account').then(res => {
    reactor.dispatch(USER_RECEIVED, { user: res.data })
  })
}

const viewModeChanged = mode => {
  reactor.dispatch(VIEW_MODE_CHANGED, { mode: mode })
}

module.exports = {
  fetchModules,
  fetchNotifications,
  replaceNotifications,
  addNotifications,
  toggleLicenseModal,
  toggleAboutModal,
  fetchBotInformation,
  fetchLicense,
  licenseChanged,
  fetchUser,
  viewModeChanged,
  ...actions
}
