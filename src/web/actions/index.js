import { createAction } from 'redux-actions'
import axios from 'axios'
import _ from 'lodash'

// Flows
export const requestFlows = createAction('FLOWS/REQUEST')
export const receiveFlows = createAction('FLOWS/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const fetchFlows = () => dispatch => {
  dispatch(requestFlows())

  axios.get('/flows/all').then(({ data }) => {
    const flows = _.keyBy(data, 'name')
    dispatch(receiveFlows(flows))
  })
}

export const requestSaveFlow = createAction('FLOWS/SAVE')
export const receiveSaveFlow = createAction('FLOWS/SAVE/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const saveFlow = flow => dispatch => {
  dispatch(requestSaveFlow())

  axios.post('/flows/save', flow).then(() => {
    dispatch(receiveSaveFlow())
  })
}

// export const fetchFlowsDefinitions = createAction('FLOWS_DEFINITIONS_FETCH')

export const updateFlow = createAction('FLOWS/FLOW/UPDATE')
export const renameFlow = createAction('FLOWS/FLOW/RENAME')
export const switchFlow = createAction('FLOWS/FLOW/SWITCH')
export const updateFlowNode = createAction('FLOWS/FLOW/UPDATE_NODE')
export const switchFlowNode = createAction('FLOWS/FLOW/SWITCH_NODE')
export const createFlowNode = createAction('FLOWS/FLOW/CREATE')
export const removeFlowNode = createAction('FLOWS/FLOW/REMOVE')

export const setDiagramAction = createAction('FLOWS/FLOW/SET_ACTION')

// License
export const licenseChanged = createAction('LICENSE/CHANGED')
export const fetchLicense = () => dispatch => {
  axios.get('/api/license').then(({ data }) => {
    dispatch(licenseChanged(data))
  })
}

// UI
export const toggleLicenseModal = createAction('UI/TOGGLE_LICENSE_MODAL')
export const toggleAboutModal = createAction('UI/TOGGLE_ABOUT_MODAL')
export const viewModeChanged = createAction('UI/VIEW_MODE_CHANGED')
export const updateGlobalStyle = createAction('UI/UPDATE_GLOBAL_STYLE')

// User
export const userReceived = createAction('USER/RECEIVED')
export const fetchUser = () => dispatch => {
  axios.get('/api/my-account').then(res => {
    dispatch(userReceived(res.data))
  })
}

// Bot
export const botInfoReceived = createAction('BOT/INFO_RECEIVED')
export const fetchBotInformation = () => dispatch => {
  axios.all([axios.get('/api/bot/information'), axios.get('/api/bot/production')]).then(
    axios.spread((information, production) => {
      const info = Object.assign({}, information.data, { production: production.data })
      dispatch(botInfoReceived(info))
    })
  )
}

// Modules
export const modulesReceived = createAction('MODULES/RECEIVED')
export const fetchModules = () => dispatch => {
  axios.get('/api/modules').then(res => {
    dispatch(modulesReceived(res.data))
  })
}

// Rules
export const rulesReceived = createAction('RULES/RECEIVED')
export { fetchRules } from '+/actions'

// Notifications
export const allNotificationsReceived = createAction('NOTIFICATIONS/ALL_RECEIVED')
export const newNotificationsReceived = createAction('NOTIFICATIONS/NEW_RECEIVED')
export const fetchNotifications = () => dispatch => {
  axios.get('/api/notifications/inbox').then(res => {
    dispatch(allNotificationsReceived(res.data))
  })
}

export const replaceNotifications = allNotifications => dispatch => {
  dispatch(allNotificationsReceived(allNotifications))
}

export const addNotifications = notifications => dispatch => {
  dispatch(newNotificationsReceived(notifications))
}
