import { FlowNode } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import reduceReducers from 'reduce-reducers'
import { handleActions } from 'redux-actions'
import {
  clearErrorSaveFlows,
  clearFlowMutex,
  closeFlowNodeProps,
  copyFlowNode,
  copyFlowNodeElement,
  errorSaveFlows,
  handleFlowEditorRedo,
  handleFlowEditorUndo,
  handleRefreshFlowLinks,
  openFlowNodeProps,
  receiveFlows,
  receiveFlowsModification,
  receiveSaveFlows,
  requestCreateFlow,
  requestCreateFlowNode,
  requestDeleteFlow,
  requestDuplicateFlow,
  requestFlows,
  requestInsertNewSkill,
  requestInsertNewSkillNode,
  requestPasteFlowNode,
  requestPasteFlowNodeElement,
  requestRemoveFlowNode,
  requestRenameFlow,
  requestUpdateFlow,
  requestUpdateFlowNode,
  requestUpdateSkill,
  setDiagramAction,
  switchFlow,
  switchFlowNode,
  updateFlowProblems
} from '~/actions'
import { hashCode, prettyId } from '~/util'

export interface FlowReducer {
  currentFlow?: string
  showFlowNodeProps: boolean
  dirtyFlows: string[]
  errorSavingFlows?: { status: number; message: string }
  flowsByName: _.Dictionary<FlowView>
  currentDiagramAction: string
  nodeInBuffer?: FlowNode
}

const MAX_UNDO_STACK_SIZE = 25
const MIN_HISTORY_RECORD_INTERVAL = 500

const defaultState = {
  flowsByName: {},
  fetchingFlows: false,
  currentFlow: null,
  currentFlowNode: null,
  showFlowNodeProps: false,
  currentDiagramAction: null,
  currentSnapshot: null,
  undoStack: [],
  redoStack: [],
  nodeInBuffer: null, // TODO: move it to buffer.node
  buffer: { action: null, transition: null },
  flowProblems: [],
  errorSavingFlows: undefined
}

const findNodesThatReferenceFlow = (state, flowName) =>
  _.flatten(_.values(state.flowsByName).map(flow => flow.nodes))
    .filter(node => node.flow === flowName || _.find(node.next, { node: flowName }))
    .map(node => node.id)

const computeFlowsHash = state => {
  return _.values(state.flowsByName).reduce((obj, curr) => {
    if (!curr) {
      return obj
    }

    obj[curr.name] = computeHashForFlow(curr)
    return obj
  }, {})
}

const computeHashForFlow = (flow: FlowView) => {
  const hashAction = (hash, action) => {
    if (_.isArray(action)) {
      action.forEach(c => {
        if (_.isString(c)) {
          hash += c
        } else {
          hash += c.node
          hash += c.condition
        }
      })
    } else {
      hash += 'null'
    }

    return hash
  }

  let buff = ''
  buff += flow.name
  buff += flow.startNode

  if (flow.catchAll) {
    buff = hashAction(buff, flow.catchAll.onReceive)
    buff = hashAction(buff, flow.catchAll.onEnter)
    buff = hashAction(buff, flow.catchAll.next)
  }

  _.orderBy(flow.nodes, 'id').forEach(node => {
    buff = hashAction(buff, node.onReceive)
    buff = hashAction(buff, node.onEnter)
    buff = hashAction(buff, node.next)
    buff += node.id
    buff += node.flow
    buff += node.type
    buff += node.name
    buff += node.x
    buff += node.y
  })

  _.orderBy(flow.links, l => l.source + l.target).forEach(link => {
    buff += link.source
    buff += link.target
    link.points &&
      link.points.forEach(p => {
        buff += p.x
        buff += p.y
      })
  })

  return hashCode(buff)
}

const updateCurrentHash = state => ({ ...state, currentHashes: computeFlowsHash(state) })

const createSnapshot = state => ({
  ..._.pick(state, ['currentFlow', 'currentFlowNode', 'flowsByName']),
  createdAt: new Date()
})

const recordHistory = state => {
  // @ts-ignore
  if (!state.currentSnapshot || new Date() - state.currentSnapshot.createdAt < MIN_HISTORY_RECORD_INTERVAL) {
    return { ...state, currentSnapshot: createSnapshot(state) }
  }
  return {
    ...state,
    undoStack: [state.currentSnapshot, ...state.undoStack.slice(0, MAX_UNDO_STACK_SIZE)],
    redoStack: [],
    currentSnapshot: createSnapshot(state)
  }
}

const popHistory = stackName => state => {
  const oppositeStack = stackName === 'undoStack' ? 'redoStack' : 'undoStack'
  if (state[stackName].length === 0) {
    return state
  }
  const currentSnapshot = state[stackName][0]

  const newState = {
    ...state,
    currentSnapshot,
    currentFlow: currentSnapshot.currentFlow,
    currentFlowNode: currentSnapshot.currentFlowNode,
    flowsByName: currentSnapshot.flowsByName,
    [stackName]: state[stackName].slice(1),
    [oppositeStack]: [state.currentSnapshot, ...state[oppositeStack]]
  }
  const currentHashes = computeFlowsHash(newState)

  return {
    ...newState,
    currentHashes
  }
}

const copyName = (siblingNames, nameToCopy) => {
  const copies = siblingNames.filter(name => name.startsWith(`${nameToCopy}-copy`))

  if (!copies.length) {
    return `${nameToCopy}-copy`
  }

  let i = 1
  while (true) {
    if (!copies.find(name => name === `${nameToCopy}-copy-${i}`)) {
      return `${nameToCopy}-copy-${i}`
    } else {
      i += 1
    }
  }
}

const doRenameFlow = ({ currentName, newName, flows }) =>
  flows.reduce((obj, f) => {
    if (f.name === currentName) {
      f.name = newName
      f.location = newName
    }

    if (f.nodes) {
      let json = JSON.stringify(f.nodes)
      json = json.replace(currentName, newName)
      f.nodes = JSON.parse(json)
    }

    const newObj = { ...obj }
    newObj[f.name] = f

    return newObj
  }, {})

const doDeleteFlow = ({ name, flowsByName }) => {
  flowsByName = _.omit(flowsByName, name)
  const flows = _.values(flowsByName)
  return doRenameFlow({ currentName: name, newName: '', flows })
}

const doCreateNewFlow = name => {
  const nodes = [
    {
      id: prettyId(),
      name: 'entry',
      onEnter: [],
      onReceive: null,
      next: [],
      type: 'standard',
      x: 100,
      y: 100
    }
  ]

  if (window.USE_ONEFLOW) {
    nodes.push(
      {
        id: prettyId(),
        name: 'success',
        onEnter: [],
        onReceive: null,
        next: [],
        type: 'success',
        x: 1000,
        y: 100
      },
      {
        id: prettyId(),
        name: 'failure',
        onEnter: [],
        onReceive: null,
        next: [],
        type: 'failure',
        x: 1000,
        y: 200
      }
    )
  }

  return {
    version: '0.1',
    name: name,
    location: name,
    label: undefined,
    description: '',
    startNode: 'entry',
    catchAll: {},
    links: [],
    triggers: [], // TODO: NDU Change to be a node instead
    nodes
  }
}

function isActualCreate(state, modification): boolean {
  return !_.keys(state.flowsByName).includes(modification.name)
}

function isActualUpdate(state, modification): boolean {
  const flowHash = computeHashForFlow(modification.payload)
  const currentFlowHash = computeHashForFlow(state.flowsByName[modification.name])
  return currentFlowHash !== flowHash
}

function isActualDelete(state, modification): boolean {
  return _.keys(state.flowsByName).includes(modification.name)
}

function isActualRename(state, modification): boolean {
  return modification.newName && !_.keys(state.flowsByName).includes(modification.newName)
}

// *****
// Reducer that deals with non-recordable (no snapshot taking)
// *****

let reducer = handleActions(
  {
    [receiveFlowsModification]: (state, { payload: modification }) => {
      const modificationType = modification.modification || ''

      const isUpsertFlow =
        (modificationType === 'create' && isActualCreate(state, modification)) ||
        (modificationType === 'update' && isActualUpdate(state, modification))

      if (isUpsertFlow) {
        const newHash = computeHashForFlow(modification.payload)

        return {
          ...state,
          flowsByName: {
            ...state.flowsByName,
            [modification.name]: modification.payload
          },
          currentHashes: {
            ...state.currentHashes,
            [modification.name]: newHash
          },
          initialHashes: {
            ...state.initialHashes,
            [modification.name]: newHash
          }
        }
      }

      if (modificationType === 'delete' && isActualDelete(state, modification)) {
        return {
          ...state,
          flowsByName: _.omit(state.flowsByName, modification.name)
        }
      }

      if (modificationType === 'rename' && isActualRename(state, modification)) {
        const renamedFlow = state.flowsByName[modification.name]
        const flowsByName = _.omit(state.flowsByName, modification.name)
        flowsByName[modification.newName] = renamedFlow

        return {
          ...state,
          flowsByName
        }
      }

      return {
        ...state
      }
    },

    [clearFlowMutex]: (state, { payload: name }) => ({
      ...state,
      flowsByName: {
        ...state.flowsByName,
        [name]: _.omit(state.flowsByName[name], 'currentMutex')
      }
    }),

    [updateFlowProblems as any]: (state, { payload }) => ({
      ...state,
      flowProblems: payload
    }),

    [requestFlows]: state => ({
      ...state,
      fetchingFlows: true
    }),

    [receiveFlows]: (state, { payload }) => {
      const flows = _.keys(payload).filter(key => !payload[key].skillData)
      const newFlow = _.keys(payload).includes('Built-In/welcome.flow.json') && 'Built-In/welcome.flow.json'
      const defaultFlow = newFlow || (_.keys(payload).includes('main.flow.json') ? 'main.flow.json' : _.first(flows))

      const newState = {
        ...state,
        fetchingFlows: false,
        flowsByName: payload,
        currentFlow: state.currentFlow || defaultFlow
      }
      return {
        ...newState,
        currentSnapshot: createSnapshot(newState)
      }
    },

    [receiveSaveFlows]: state => ({
      ...state,
      errorSavingFlows: undefined
    }),

    [errorSaveFlows]: (state, { payload }) => ({
      ...state,
      errorSavingFlows: payload
    }),

    [clearErrorSaveFlows as any]: state => ({
      ...state,
      errorSavingFlows: undefined
    }),

    [switchFlowNode as any]: (state, { payload }) => ({
      ...state,
      currentFlowNode: payload
    }),

    [openFlowNodeProps as any]: state => ({
      ...state,
      showFlowNodeProps: true
    }),

    [closeFlowNodeProps as any]: state => ({
      ...state,
      showFlowNodeProps: false
    }),

    [switchFlow as any]: (state, { payload }) => {
      if (state.currentFlow === payload) {
        return state
      }

      return {
        ...state,
        currentFlowNode: null,
        currentFlow: payload
      }
    },

    [setDiagramAction as any]: (state, { payload }) => ({
      ...state,
      currentDiagramAction: payload
    }),

    [handleRefreshFlowLinks]: state => ({
      ...state,
      flowsByName: {
        ...state.flowsByName,
        [state.currentFlow]: {
          ...state.flowsByName[state.currentFlow],
          nodes: state.flowsByName[state.currentFlow].nodes.map(node => ({ ...node, lastModified: new Date() }))
        }
      }
    })
  },
  defaultState
)

reducer = reduceReducers(
  reducer,
  handleActions(
    {
      [requestRenameFlow]: (state, { payload: { targetFlow, name } }) => ({
        ...state,
        flowsByName: doRenameFlow({
          currentName: targetFlow,
          newName: name,
          flows: _.values(state.flowsByName)
        }),
        currentFlow: name
      }),

      [requestUpdateFlow]: (state, { payload }) => {
        const currentFlow = state.flowsByName[state.currentFlow]
        const nodes = !payload.links
          ? currentFlow.nodes
          : currentFlow.nodes.map(node => {
              const nodeLinks = payload.links.filter(link => link.source === node.id)
              const next = node.next.map((value, index) => {
                const link = nodeLinks.find(link => Number(link.sourcePort.replace('out', '')) === index)
                const targetNode = _.find(currentFlow.nodes, { id: (link || {}).target })
                let remapNode = ''

                if (value.node.includes('.flow.json') || value.node === 'END' || value.node.startsWith('#')) {
                  remapNode = value.node
                }

                return { ...value, node: (targetNode && targetNode.name) || remapNode }
              })

              return { ...node, next, lastModified: new Date() }
            })

        const links = (payload.links || currentFlow.links).map(link => ({
          ...link,
          points: link.points.map(({ x, y }) => ({ x: Math.round(x), y: Math.round(y) }))
        }))

        return {
          ...state,
          flowsByName: {
            ...state.flowsByName,
            [state.currentFlow]: { ...currentFlow, nodes, ...payload, links }
          }
        }
      },

      [requestCreateFlow]: (state, { payload: name }) => ({
        ...state,
        flowsByName: {
          ...state.flowsByName,
          [name]: doCreateNewFlow(name)
        },
        currentFlow: name,
        currentFlowNode: null
      }),

      [requestDeleteFlow]: (state, { payload: name }) => ({
        ...state,
        currentFlow: state.currentFlow === name ? 'main.flow.json' : state.currentFlow,
        currentFlowNode: state.currentFlow === name ? null : state.currentFlowNode,
        flowsByName: doDeleteFlow({ name, flowsByName: state.flowsByName })
      }),

      // Inserting a new skill essentially:
      // 1. creates a new flow
      // 2. creates a new "skill" node
      // 3. puts that new node in the "insert buffer", waiting for user to place it on the canvas
      [requestInsertNewSkill]: (state, { payload }) => {
        const skillId = payload.skillId
        const flowRandomId = prettyId(6)
        const flowName = `skills/${skillId}-${flowRandomId}.flow.json`

        const newFlow = Object.assign({}, payload.generatedFlow, {
          skillData: payload.data,
          name: flowName,
          location: flowName
        })

        const newNode = {
          id: 'skill-' + flowRandomId,
          type: 'skill-call',
          skill: skillId,
          name: `${skillId}-${flowRandomId}`,
          flow: flowName,
          next: payload.transitions || [],
          onEnter: null,
          onReceive: null
        }

        const newFlowHash = computeHashForFlow(newFlow)

        return {
          ...state,
          flowsByName: {
            ...state.flowsByName,
            [newFlow.name]: newFlow,
            [state.currentFlow]: {
              ...state.flowsByName[state.currentFlow],
              nodes: [
                ...state.flowsByName[state.currentFlow].nodes,
                _.merge(newNode, _.pick(payload.location, ['x', 'y']))
              ]
            }
          },
          currentHashes: {
            ...state.currentHashes,
            [newFlow.name]: newFlowHash
          }
        }
      },

      [requestUpdateSkill]: (state, { payload }) => {
        const modifiedFlow = Object.assign({}, state.flowsByName[payload.editFlowName], payload.generatedFlow, {
          skillData: payload.data,
          name: payload.editFlowName,
          location: payload.editFlowName
        })

        const nodes = state.flowsByName[state.currentFlow].nodes.map(node => {
          if (node.id !== payload.editNodeId) {
            return node
          }

          return {
            ...node,
            next: payload.transitions.map(transition => {
              const prevTransition = node.next.find(
                ({ condition, caption }) => condition === transition.condition || caption === transition.caption
              )

              return { ...transition, node: (prevTransition || {}).node || '' }
            }),
            lastModified: new Date()
          }
        })

        return {
          ...state,
          flowsByName: {
            ...state.flowsByName,
            [payload.editFlowName]: modifiedFlow,
            [state.currentFlow]: {
              ...state.flowsByName[state.currentFlow],
              nodes: nodes
            }
          }
        }
      },

      [requestInsertNewSkillNode]: (state, { payload }) => ({
        ...state,
        flowsByName: {
          ...state.flowsByName,
          [state.currentFlow]: {
            ...state.flowsByName[state.currentFlow],
            nodes: [
              ...state.flowsByName[state.currentFlow].nodes,
              _.merge(state.nodeInBuffer, _.pick(payload, ['x', 'y']))
            ]
          }
        }
      }),

      [requestDuplicateFlow]: (state, { payload: { flowNameToDuplicate, name } }) => {
        return {
          ...state,
          flowsByName: {
            ...state.flowsByName,
            [name]: {
              ...state.flowsByName[flowNameToDuplicate],
              name,
              location: name,
              nodes: state.flowsByName[flowNameToDuplicate].nodes.map(node => ({
                ...node,
                id: prettyId()
              }))
            }
          },
          currentFlow: name,
          currentFlowNode: null
        }
      },

      [requestUpdateFlowNode]: (state, { payload }) => {
        const currentFlow = state.flowsByName[state.currentFlow]
        const currentNode = _.find(state.flowsByName[state.currentFlow].nodes, { id: state.currentFlowNode })
        const needsUpdate = name => name === (currentNode || {}).name && payload.name

        const updateNodeName = elements =>
          elements.map(element => {
            return {
              ...element,
              node: needsUpdate(element.node) ? payload.name : element.node
            }
          })

        return {
          ...state,
          flowsByName: {
            ...state.flowsByName,
            [state.currentFlow]: {
              ...currentFlow,
              startNode: needsUpdate(currentFlow.startNode) ? payload.name : currentFlow.startNode,
              nodes: currentFlow.nodes.map(node => {
                if (node.id !== state.currentFlowNode) {
                  return {
                    ...node,
                    next: node.next && updateNodeName(node.next)
                  }
                }

                return { ...node, ...payload, lastModified: new Date() }
              }),
              catchAll: {
                ...currentFlow.catchAll,
                next: currentFlow.catchAll.next && updateNodeName(currentFlow.catchAll.next)
              }
            }
          }
        }
      },

      [requestRemoveFlowNode]: (state, { payload }) => {
        const flowsToRemove = []
        const nodeToRemove = _.find(state.flowsByName[state.currentFlow].nodes, { id: payload?.id })

        if (nodeToRemove.type === 'skill-call') {
          if (findNodesThatReferenceFlow(state, nodeToRemove.flow).length <= 1) {
            // Remove the skill flow if that was the only node referencing it
            flowsToRemove.push(nodeToRemove.flow)
          }
        }

        return {
          ...state,
          flowsByName: {
            ..._.omit(state.flowsByName, flowsToRemove),
            [state.currentFlow]: {
              ...state.flowsByName[state.currentFlow],
              nodes: state.flowsByName[state.currentFlow].nodes.filter(node => node.id !== payload.id)
            }
          }
        }
      },

      [copyFlowNode as any]: state => {
        const node = _.find(state.flowsByName[state.currentFlow].nodes, { id: state.currentFlowNode })
        if (!node) {
          return state
        }
        return {
          ...state,
          nodeInBuffer: { ...node, next: node.next.map(item => ({ ...item, node: '' })) }
        }
      },

      [requestPasteFlowNode]: (state, { payload: { x, y } }) => {
        const currentFlow = state.flowsByName[state.currentFlow]
        const newNodeId = prettyId()
        const name = copyName(
          currentFlow.nodes.map(({ name }) => name),
          state.nodeInBuffer.name
        )
        return {
          ...state,
          currentFlowNode: newNodeId,
          flowsByName: {
            ...state.flowsByName,
            [state.currentFlow]: {
              ...currentFlow,
              nodes: [
                ...currentFlow.nodes,
                { ...state.nodeInBuffer, id: newNodeId, name, lastModified: new Date(), x, y }
              ]
            }
          }
        }
      },

      [copyFlowNodeElement]: (state, { payload }) => ({
        ...state,
        buffer: {
          ...state.buffer,
          ...payload
        }
      }),

      [requestPasteFlowNodeElement]: (state, { payload }) => {
        const SECTION_TYPES = { onEnter: 'action', onReceive: 'action', next: 'transition' }
        const element = state.buffer[SECTION_TYPES[payload]]
        if (!element) {
          return state
        }

        const currentFlow = state.flowsByName[state.currentFlow]
        const currentNode = _.find(currentFlow.nodes, { id: state.currentFlowNode })

        // TODO: use this as a helper function in other reducers
        const updateCurrentFlow = modifier => ({
          ...state,
          flowsByName: { ...state.flowsByName, [state.currentFlow]: { ...currentFlow, ...modifier } }
        })

        if (currentNode) {
          return updateCurrentFlow({
            nodes: [
              ...currentFlow.nodes.filter(({ id }) => id !== state.currentFlowNode),
              { ...currentNode, [payload]: [...(currentNode[payload] || []), element] }
            ]
          })
        }

        return updateCurrentFlow({
          catchAll: {
            ...currentFlow.catchAll,
            [payload]: [...currentFlow.catchAll[payload], element]
          }
        })
      },

      [requestCreateFlowNode]: (state, { payload }) => ({
        ...state,
        flowsByName: {
          ...state.flowsByName,
          [state.currentFlow]: {
            ...state.flowsByName[state.currentFlow],
            nodes: [
              ...state.flowsByName[state.currentFlow].nodes,
              _.merge(
                {
                  id: prettyId(),
                  name: `node-${prettyId(4)}`,
                  x: 0,
                  y: 0,
                  next: [],
                  onEnter: [],
                  onReceive: null
                },
                payload
              )
            ]
          }
        }
      })
    },
    defaultState
  )
)

// *****
// Reducer that creates the 'initial hash' of flows (for dirty detection)
// Resets the 'dirty' state when a flow is saved
// *****

reducer = reduceReducers(
  reducer,
  handleActions(
    {
      [receiveFlows]: state => {
        const hashes = computeFlowsHash(state)
        return { ...state, currentHashes: hashes, initialHashes: hashes }
      },

      [receiveSaveFlows]: state => {
        const hashes = computeFlowsHash(state)
        return { ...state, currentHashes: hashes, initialHashes: hashes }
      },

      [requestUpdateFlow]: updateCurrentHash,
      [requestRenameFlow]: updateCurrentHash,
      [requestUpdateFlowNode]: updateCurrentHash,

      [requestCreateFlowNode]: updateCurrentHash,
      [requestCreateFlow]: updateCurrentHash,
      [requestDeleteFlow]: updateCurrentHash,
      [requestDuplicateFlow]: updateCurrentHash,
      [requestRemoveFlowNode]: updateCurrentHash,
      [requestPasteFlowNode]: updateCurrentHash,
      [requestInsertNewSkill]: updateCurrentHash,
      [requestInsertNewSkillNode]: updateCurrentHash,
      [requestUpdateSkill]: updateCurrentHash,
      [requestPasteFlowNodeElement]: updateCurrentHash
    },
    defaultState
  )
)

// *****
// Reducer that records state of the flows for undo/redo
// *****

reducer = reduceReducers(
  reducer,
  handleActions(
    {
      [requestRenameFlow]: recordHistory,
      [requestUpdateFlowNode]: recordHistory,
      [requestCreateFlowNode]: recordHistory,
      [requestCreateFlow]: recordHistory,
      [requestDeleteFlow]: recordHistory,
      [requestDuplicateFlow]: recordHistory,
      [requestRemoveFlowNode]: recordHistory,
      [requestPasteFlowNode]: recordHistory,
      [requestInsertNewSkill]: recordHistory,
      [requestInsertNewSkillNode]: recordHistory,
      [requestUpdateSkill]: recordHistory,
      [requestPasteFlowNodeElement]: recordHistory,
      [handleFlowEditorUndo]: popHistory('undoStack'),
      [handleFlowEditorRedo]: popHistory('redoStack')
    },
    defaultState
  )
)

export default reducer
