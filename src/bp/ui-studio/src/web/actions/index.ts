import axios from 'axios'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import { createAction } from 'redux-actions'

import { getDeletedFlows, getDirtyFlows, getModifiedFlows, getNewFlows } from '../reducers/selectors'

import { FlowsAPI } from './api'
import BatchRunner from './BatchRunner'

// Flows
export const receiveFlowsModification = createAction('FLOWS/MODIFICATIONS/RECEIVE')

const MUTEX_UNLOCK_SECURITY_FACTOR = 1.25
const mutexHandles: _.Dictionary<number> = {}

export const handleReceiveFlowsModification = modification => (dispatch, getState) => {
  const dirtyFlows = getDirtyFlows(getState())
  const amIModifyingTheSameFlow = dirtyFlows.includes(modification.name)
  if (amIModifyingTheSameFlow) {
    FlowsAPI.cancelUpdate(modification.name)
  }

  dispatch(receiveFlowsModification(modification))
  dispatch(refreshFlowsLinks())

  if (_.has(modification, 'payload.currentMutex') && _.has(modification, 'payload.name')) {
    dispatch(startMutexCountDown(modification.payload))
  }
}

const startMutexCountDown = (flow: FlowView) => dispatch => {
  const { name, currentMutex } = flow
  if (!currentMutex || !currentMutex.remainingSeconds) {
    return
  }

  const handle = mutexHandles[name]
  if (handle) {
    clearTimeout(handle)
  }
  mutexHandles[name] = window.setTimeout(() => {
    dispatch(clearFlowMutex(name))
  }, currentMutex.remainingSeconds * 1000 * MUTEX_UNLOCK_SECURITY_FACTOR)
}

export const clearFlowMutex = createAction('FLOWS/MODIFICATIONS/CLEAR_MUTEX')

export const requestFlows = createAction('FLOWS/REQUEST')
export const receiveFlows = createAction('FLOWS/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))

export const fetchFlows = () => dispatch => {
  dispatch(requestFlows())

  // tslint:disable-next-line: no-floating-promises
  axios
    .get(`${window.BOT_API_PATH}/flows`)
    .then(({ data }) => {
      const flows = _.keyBy(data, 'name')
      dispatch(receiveFlows(flows))
      return flows
    })
    .then(flows => {
      for (const flow of _.values(flows)) {
        dispatch(startMutexCountDown(flow))
      }
    })
}

export const receiveSaveFlows = createAction('FLOWS/SAVE/RECEIVE', flows => flows, () => ({ receiveAt: new Date() }))
export const errorSaveFlows = createAction('FLOWS/SAVE/ERROR')
export const clearErrorSaveFlows = createAction('FLOWS/SAVE/ERROR/CLEAR')

// actions that modifies flow
export const requestUpdateFlow = createAction('FLOWS/FLOW/UPDATE')
export const requestRenameFlow = createAction('FLOWS/FLOW/RENAME')
export const requestCreateFlow = createAction('FLOWS/CREATE')
export const requestDeleteFlow = createAction('FLOWS/DELETE')
export const requestDuplicateFlow = createAction('FLOWS/DUPLICATE')

export const requestUpdateFlowNode = createAction('FLOWS/FLOW/UPDATE_NODE')
export const requestCreateFlowNode = createAction('FLOWS/FLOW/CREATE')
export const requestRemoveFlowNode = createAction('FLOWS/FLOW/REMOVE')

export const requestPasteFlowNode = createAction('FLOWS/NODE/PASTE')
export const requestPasteFlowNodeElement = createAction('FLOWS/NODE_ELEMENT/PASTE')

const wrapAction = (
  requestAction,
  asyncCallback: (payload, state, dispatch) => Promise<any>,
  receiveAction = receiveSaveFlows,
  errorAction = errorSaveFlows
) => payload => (dispatch, getState) => {
  dispatch(requestAction(payload))
  // tslint:disable-next-line: no-floating-promises
  asyncCallback(payload, getState(), dispatch)
    .then(() => dispatch(receiveAction()))
    .catch(err => dispatch(errorAction(err)))
}

const updateCurrentFlow = async (_payload, state) => {
  const flowState = state.flows
  return FlowsAPI.updateFlow(flowState, flowState.currentFlow)
}

const saveDirtyFlows = async state => {
  const dirtyFlows = getModifiedFlows(state).filter(name => !!state.flows.flowsByName[name])

  const promises = []
  for (const flow of dirtyFlows) {
    promises.push(FlowsAPI.updateFlow(state.flows, flow))
  }
  return Promise.all(promises)
}

export const updateFlow = wrapAction(requestUpdateFlow, updateCurrentFlow)

export const renameFlow = wrapAction(requestRenameFlow, async (payload, state) => {
  const { targetFlow, name } = payload
  await FlowsAPI.renameFlow(state.flows, targetFlow, name)
  await saveDirtyFlows(state)
})

export const createFlow = wrapAction(requestCreateFlow, async (payload, state) => {
  const name = payload
  const flowState = state.flows
  await FlowsAPI.createFlow(flowState, name)
})

export const deleteFlow = wrapAction(requestDeleteFlow, async (payload, state) => {
  await FlowsAPI.deleteFlow(state.flows, payload)
  await saveDirtyFlows(state)
})

export const duplicateFlow = wrapAction(requestDuplicateFlow, async (payload, state) => {
  const { name } = payload
  const flowState = state.flows
  await FlowsAPI.createFlow(flowState, name)
})

export const updateFlowNode = wrapAction(requestUpdateFlowNode, updateCurrentFlow)
export const createFlowNode = wrapAction(requestCreateFlowNode, updateCurrentFlow)

export const removeFlowNode = wrapAction(requestRemoveFlowNode, async (payload, state) => {
  await updateCurrentFlow(payload, state)

  // If node is a skill and there's no references to it, then the complete flow is deleted
  const deletedFlows = getDeletedFlows(state)
  if (deletedFlows.length) {
    await FlowsAPI.deleteFlow(state.flows, deletedFlows[0])
  }
})

export const pasteFlowNode = wrapAction(requestPasteFlowNode, updateCurrentFlow)
export const pasteFlowNodeElement = wrapAction(requestPasteFlowNodeElement, updateCurrentFlow)

// actions that do not modify flow
export const switchFlow = createAction('FLOWS/SWITCH')
export const switchFlowNode = createAction('FLOWS/FLOW/SWITCH_NODE')
export const openFlowNodeProps = createAction('FLOWS/FLOW/OPEN_NODE_PROPS')
export const closeFlowNodeProps = createAction('FLOWS/FLOW/CLOSE_NODE_PROPS')

export const handleRefreshFlowLinks = createAction('FLOWS/FLOW/UPDATE_LINKS')
export const refreshFlowsLinks = () => dispatch => setTimeout(() => dispatch(handleRefreshFlowLinks()), 10)
export const updateFlowProblems = createAction('FLOWS/FLOW/UPDATE_PROBLEMS')

export const copyFlowNode = createAction('FLOWS/NODE/COPY')
export const copyFlowNodeElement = createAction('FLOWS/NODE_ELEMENT/COPY')

export const handleFlowEditorUndo = createAction('FLOWS/EDITOR/UNDO')
export const handleFlowEditorRedo = createAction('FLOWS/EDITOR/REDO')

export const flowEditorUndo = wrapAction(handleFlowEditorUndo, async (payload, state, dispatch) => {
  dispatch(refreshFlowsLinks())
  await updateCurrentFlow(payload, state)
  await createNewFlows(state)
})

export const flowEditorRedo = wrapAction(handleFlowEditorRedo, async (payload, state, dispatch) => {
  dispatch(refreshFlowsLinks())
  await updateCurrentFlow(payload, state)
  await createNewFlows(state)
})

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
export const toggleBottomPanel = createAction('UI/TOGGLE_BOTTOM_PANEL')

// User
export const userReceived = createAction('USER/RECEIVED')
export const fetchUser = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.API_PATH}/auth/me/profile`).then(res => {
    dispatch(userReceived(res.data && res.data.payload))
  })
}

// Bot
export const botInfoReceived = createAction('BOT/INFO_RECEIVED')
export const fetchBotInformation = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.BOT_API_PATH}`).then(information => {
    dispatch(botInfoReceived(information.data))
  })
}

// Modules
export const modulesReceived = createAction('MODULES/RECEIVED')
export const fetchModules = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.API_PATH}/modules`).then(res => {
    dispatch(modulesReceived(res.data))
  })
}

// Skills
export const skillsReceived = createAction('SKILLS/RECEIVED')
export const fetchSkills = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.API_PATH}/modules/skills`).then(res => {
    dispatch(skillsReceived(res.data))
  })
}

// Notifications
export const allNotificationsReceived = createAction('NOTIFICATIONS/ALL_RECEIVED')
export const newNotificationsReceived = createAction('NOTIFICATIONS/NEW_RECEIVED')
export const fetchNotifications = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
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
export const requestInsertNewSkill = createAction('SKILLS/INSERT')
export const requestInsertNewSkillNode = createAction('SKILLS/INSERT/NODE')
export const requestUpdateSkill = createAction('SKILLS/UPDATE')

export const buildNewSkill = createAction('SKILLS/BUILD')
export const cancelNewSkill = createAction('SKILLS/BUILD/CANCEL')

export const insertNewSkill = wrapAction(requestInsertNewSkill, async (payload, state) => {
  await updateCurrentFlow(payload, state)
  await createNewFlows(state)
})

const createNewFlows = async state => {
  const newFlows: string[] = getNewFlows(state)
  for (const newFlow of newFlows) {
    await FlowsAPI.createFlow(state.flows, newFlow)
  }
}

export const insertNewSkillNode = wrapAction(requestInsertNewSkillNode, updateCurrentFlow)

export const updateSkill = wrapAction(requestUpdateSkill, async (payload, state) => {
  const { editFlowName } = payload
  const { flows: flowState } = state
  await Promise.all([
    FlowsAPI.updateFlow(flowState, editFlowName),
    FlowsAPI.updateFlow(flowState, flowState.currentFlow)
  ])
})

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

// Language
export const changeContentLanguage = createAction('LANGUAGE/CONTENT_LANGUAGE', contentLang => ({ contentLang }))

// Hints
export const hintsReceived = createAction('HINTS/RECEIVED')
export const refreshHints = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.BOT_API_PATH}/hints`).then(res => {
    dispatch(hintsReceived(res.data))
  })
}

export const actionsReceived = createAction('ACTIONS/RECEIVED')
export const refreshActions = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.BOT_API_PATH}/actions`).then(({ data }) => {
    dispatch(actionsReceived(_.sortBy(data.filter(action => !action.metadata.hidden), ['metadata.category', 'name'])))
  })
}

export const intentsReceived = createAction('INTENTS/RECEIVED')
export const refreshIntents = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.BOT_API_PATH}/mod/nlu/intents`).then(({ data }) => {
    dispatch(intentsReceived(data))
  })
}

export const conditionsReceived = createAction('CONDITIONS/RECEIVED')
export const refreshConditions = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.BOT_API_PATH}/mod/ndu/conditions`).then(({ data }) => {
    dispatch(conditionsReceived(data))
  })
}

export const topicsReceived = createAction('TOPICS/RECEIVED')
export const fetchTopics = () => dispatch => {
  // tslint:disable-next-line: no-floating-promises
  axios.get(`${window.BOT_API_PATH}/mod/ndu/topics`).then(({ data }) => {
    dispatch(topicsReceived(data))
  })
}
