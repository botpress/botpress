import { createAction } from 'redux-actions'
import axios from 'axios'
import _ from 'lodash'
import BatchRunner from './BatchRunner'
import { getDirtyFlows } from '../reducers/selectors'

// Flows
export const requestFlows = createAction('FLOWS/REQUEST')
export const receiveFlows = createAction('FLOWS/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const fetchFlows = () => dispatch => {
  dispatch(requestFlows())

  axios.get(`${window.BOT_API_PATH}/flows`).then(({ data }) => {
    const flows = _.keyBy(data, 'name')
    dispatch(receiveFlows(flows))
  })
}

export const requestSaveFlows = createAction('FLOWS/SAVE')
export const receiveSaveFlows = createAction('FLOWS/SAVE/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const saveAllFlows = () => (dispatch, getState) => {
  dispatch(requestSaveFlows())

  const state = getState()
  const flowsByName = state.flows.flowsByName

  let dirtyFlows = getDirtyFlows(state)
  const cleanFlows = _.chain(flowsByName)
    .values()
    .map(flow => flow.name)
    .difference(dirtyFlows)
    .value()

  dirtyFlows = dirtyFlows.filter(name => !!flowsByName[name]).map(name => {
    const flow = flowsByName[name]
    return {
      name,
      version: '0.0.1',
      flow: name,
      location: flow.location,
      startNode: flow.startNode,
      catchAll: flow.catchAll,
      links: flow.links,
      nodes: flow.nodes,
      skillData: flow.skillData,
      timeoutNode: flow.timeoutNode
    }
  })

  axios.post(`${window.BOT_API_PATH}/flows`, { cleanFlows, dirtyFlows }).then(() => {
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

export const updateFlowNode = createAction('FLOWS/FLOW/UPDATE_NODE')
export const switchFlowNode = createAction('FLOWS/FLOW/SWITCH_NODE')
export const createFlowNode = createAction('FLOWS/FLOW/CREATE')
export const removeFlowNode = createAction('FLOWS/FLOW/REMOVE')
export const copyFlowNode = createAction('FLOWS/NODE/COPY')
export const pasteFlowNode = createAction('FLOWS/NODE/PASTE')
export const copyFlowNodeElement = createAction('FLOWS/NODE_ELEMENT/COPY')
export const pasteFlowNodeElement = createAction('FLOWS/NODE_ELEMENT/PASTE')
export const openFlowNodeProps = createAction('FLOWS/FLOW/OPEN_NODE_PROPS')
export const closeFlowNodeProps = createAction('FLOWS/FLOW/CLOSE_NODE_PROPS')

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
export const fetchContentCategories = () => dispatch =>
  axios.get(`${window.BOT_API_PATH}/content/types`).then(({ data }) => {
    dispatch(receiveContentCategories(data))
  })

export const receiveContentItems = createAction('CONTENT/ITEMS/RECEIVE')
export const fetchContentItems = ({ contentType, ...query }) => dispatch => {
  const type = contentType && contentType != 'all' ? `${contentType}/` : ''

  return axios
    .post(`${window.BOT_API_PATH}/content/${type}elements`, query)
    .then(({ data }) => dispatch(receiveContentItems(data)))
}

const getBatchedContentItems = ids =>
  axios.post(`${window.BOT_API_PATH}/content/elements`, { ids }).then(({ data }) =>
    data.reduce((acc, item, i) => {
      acc[ids[i]] = item
      return acc
    }, {})
  )

const getBatchedContentRunner = BatchRunner(getBatchedContentItems)

const getBatchedContentItem = id => getBatchedContentRunner.add(id)

const getSingleContentItem = id => axios.get(`${window.BOT_API_PATH}/content/element/${id}`).then(({ data }) => data)

export const receiveContentItem = createAction('CONTENT/ITEMS/RECEIVE_ONE')
export const fetchContentItem = (id, { force = false, batched = false } = {}) => (dispatch, getState) => {
  if (!id || (!force && getState().content.itemsById[id])) {
    return Promise.resolve()
  }
  return (batched ? getBatchedContentItem(id) : getSingleContentItem(id)).then(data =>
    dispatch(receiveContentItem(data))
  )
}

export const receiveContentItemsCount = createAction('CONTENT/ITEMS/RECEIVE_COUNT')
export const fetchContentItemsCount = (contentType = 'all') => dispatch =>
  axios
    .get(`${window.BOT_API_PATH}/content/elements/count`, { params: { contentType } })
    .then(data => dispatch(receiveContentItemsCount(data)))

export const upsertContentItem = ({ contentType, formData, modifyId }) => () =>
  axios.post(`${window.BOT_API_PATH}/content/${contentType}/element/${modifyId || ''}`, { formData })

export const deleteContentItems = data => () => axios.post(`${window.BOT_API_PATH}/content/elements/bulk_delete`, data)

// UI
export const viewModeChanged = createAction('UI/VIEW_MODE_CHANGED')
export const updateGlobalStyle = createAction('UI/UPDATE_GLOBAL_STYLE')
export const addDocumentationHint = createAction('UI/ADD_DOCUMENTATION_HINT')
export const removeDocumentationHint = createAction('UI/REMOVE_DOCUMENTATION_HINT')
export const updateDocumentationModal = createAction('UI/UPDATE_DOCUMENTATION_MODAL')

// User
export const userReceived = createAction('USER/RECEIVED')
export const fetchUser = () => dispatch => {
  axios.get(`${window.API_PATH}/auth/me/profile`).then(res => {
    dispatch(userReceived(res.data && res.data.payload))
  })
}

// Bot
export const botInfoReceived = createAction('BOT/INFO_RECEIVED')
export const fetchBotInformation = () => dispatch => {
  axios.get(`${window.BOT_API_PATH}`).then(information => {
    dispatch(botInfoReceived(information.data))
  })
}

export const botsReceived = createAction('BOTS/RECEIVED')
export const fetchAllBots = () => dispatch => {
  axios.get(`${window.API_PATH}/admin/bots`).then(res => dispatch(botsReceived(res.data)))
}

// Modules
export const modulesReceived = createAction('MODULES/RECEIVED')
export const fetchModules = () => dispatch => {
  axios.get(`${window.API_PATH}/modules`).then(res => {
    dispatch(modulesReceived(res.data))
  })
}

// Skills
export const skillsReceived = createAction('SKILLS/RECEIVED')
export const fetchSkills = () => dispatch => {
  axios.get(`${window.API_PATH}/modules/skills`).then(res => {
    dispatch(skillsReceived(res.data))
  })
}

// Notifications
export const allNotificationsReceived = createAction('NOTIFICATIONS/ALL_RECEIVED')
export const newNotificationsReceived = createAction('NOTIFICATIONS/NEW_RECEIVED')
export const fetchNotifications = () => dispatch => {
  axios.get(`${window.BOT_API_PATH}/notifications`).then(res => {
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
        skillId: node.skill,
        flowName: node.flow,
        nodeId: nodeId,
        data: flow.skillData
      })
    )
}

//Language
export const changeContentLanguage = createAction('LANGUAGE/CONTENT_LANGUAGE', contentLang => ({ contentLang }))
