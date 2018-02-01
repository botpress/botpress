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

export const requestSaveFlows = createAction('FLOWS/SAVE')
export const receiveSaveFlows = createAction('FLOWS/SAVE/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const saveAllFlows = flows => (dispatch, getState) => {
  dispatch(requestSaveFlows())

  const flows = _.values(getState().flows.flowsByName).map(flow => ({
    flow: flow.name,
    location: flow.location,
    startNode: flow.startNode,
    catchAll: flow.catchAll,
    links: flow.links,
    nodes: flow.nodes,
    skillData: flow.skillData
  }))

  axios.post('/flows/save', flows).then(() => {
    dispatch(receiveSaveFlows())
  })
}

export const updateFlow = createAction('FLOWS/FLOW/UPDATE')
export const renameFlow = createAction('FLOWS/FLOW/RENAME')
export const createFlow = createAction('FLOWS/CREATE')
export const switchFlow = createAction('FLOWS/SWITCH')
export const deleteFlow = createAction('FLOWS/DELETE')
export const duplicateFlow = createAction('FLOWS/DUPLICATE')
export const handleRefreshFlowLinks = createAction('FLOWS/FLOW/UPDATE_LINKS')
export const refreshFlowsLinks = () => dispatch => setTimeout(() => dispatch(handleRefreshFlowLinks()), 10)

export const linkFlowNodes = createAction('FLOWS/FLOW/LINK')
export const updateFlowNode = createAction('FLOWS/FLOW/UPDATE_NODE')
export const switchFlowNode = createAction('FLOWS/FLOW/SWITCH_NODE')
export const createFlowNode = createAction('FLOWS/FLOW/CREATE')
export const removeFlowNode = createAction('FLOWS/FLOW/REMOVE')
export const copyFlowNode = createAction('FLOWS/NODE/COPY')
export const pasteFlowNode = createAction('FLOWS/NODE/PASTE')

export const handleFlowEditorUndo = createAction('FLOWS/EDITOR/UNDO')
export const handleFlowEditorRedo = createAction('FLOWS/EDITOR/REDO')

export const flowEditorUndo = () => dispatch => {
  dispatch(handleFlowEditorUndo())
  dispatch(refreshFlowsLinks())
}

export const flowEditorRedo = () => dispatch => {
  dispatch(handleFlowEditorRedo())
  dispatch(refreshFlowsLinks())
}

export const setDiagramAction = createAction('FLOWS/FLOW/SET_ACTION')

// Content
export const receiveContentCategories = createAction('CONTENT/CATEGORIES/RECEIVE')
export const fetchContentCategories = id => dispatch =>
  axios.get('/content/categories').then(({ data }) => {
    dispatch(receiveContentCategories(data))
  })

export const receiveContentItems = createAction('CONTENT/ITEMS/RECEIVE')
export const fetchContentItems = ({ id, from, count, searchTerm }) => dispatch =>
  axios
    .get(`/content/items`, { params: { categoryId: id, from, count, searchTerm } })
    .then(({ data }) => dispatch(receiveContentItems(data)))

export const receiveContentItemsRecent = createAction('CONTENT/ITEMS/RECEIVE_RECENT')
export const fetchContentItemsRecent = ({ searchTerm, count = 5, categoryId = 'all' }) => dispatch =>
  axios
    .get(`/content/items`, { params: { categoryId, count, searchTerm, orderBy: ['createdOn', 'desc'] } })
    .then(({ data }) => dispatch(receiveContentItemsRecent(data)))

export const receiveContentItem = createAction('CONTENT/ITEMS/RECEIVE_ONE')
export const fetchContentItem = id => dispatch =>
  axios.get(`/content/items/${id}`).then(({ data }) => dispatch(receiveContentItem(data)))

export const receiveContentItemsCount = createAction('CONTENT/ITEMS/RECEIVE_COUNT')
export const fetchContentItemsCount = (categoryId = 'all') => dispatch =>
  axios.get(`/content/items/count`, { params: { categoryId } }).then(data => dispatch(receiveContentItemsCount(data)))

export const upsertContentItem = ({ categoryId, formData, modifyId }) => () =>
  axios.post(`/content/categories/${categoryId}/items/${modifyId || ''}`, { formData })

export const deleteContentItems = data => () => axios.post('/content/categories/all/bulk_delete', data)

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

// Skills
export const buildNewSkill = createAction('SKILLS/BUILD')
export const cancelNewSkill = createAction('SKILLS/BUILD/CANCEL')
export const insertNewSkill = createAction('SKILLS/INSERT')
export const insertNewSkillNode = createAction('SKILLS/INSERT/NODE')
export const updateSkill = createAction('SKILLS/UPDATE')

export const editSkill = createAction('SKILLS/EDIT')
export const requestEditSkill = nodeId => (dispatch, getState) => {
  const state = getState()
  const node = _.find(state.flows.flowsByName[state.flows.currentFlow].nodes, { id: nodeId })
  const flow = node && state.flows.flowsByName[node.flow]

  flow &&
    dispatch(
      editSkill({
        skillId: 'botpress-skill-' + node.skill,
        flowName: node.flow,
        nodeId: nodeId,
        data: flow.skillData
      })
    )
}
