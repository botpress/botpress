import _ from 'lodash'
import reduceReducers from 'reduce-reducers'
import { handleActions } from 'redux-actions'
import {
  closeFlowNodeProps,
  copyFlowNode,
  copyFlowNodeElement,
  createFlow,
  createFlowNode,
  deleteFlow,
  duplicateFlow,
  handleFlowEditorRedo,
  handleFlowEditorUndo,
  handleRefreshFlowLinks,
  insertNewSkill,
  insertNewSkillNode,
  openFlowNodeProps,
  pasteFlowNode,
  pasteFlowNodeElement,
  receiveFlows,
  receiveSaveFlows,
  removeFlowNode,
  renameFlow,
  requestFlows,
  requestSaveFlows,
  setDiagramAction,
  switchFlow,
  switchFlowNode,
  updateFlow,
  updateFlowNode,
  updateFlowProblems,
  updateSkill
} from '~/actions'
import { hashCode, prettyId } from '~/util'

export interface FlowReducer {
  currentFlow: any
  showFlowNodeProps: boolean
  dirtyFlows: string[]
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
  flowProblems: []
}

const findNodesThatReferenceFlow = (state, flowName) =>
  _.flatten(_.values(state.flowsByName).map(flow => flow.nodes))
    .filter(node => node.flow === flowName || _.find(node.next, { node: flowName }))
    .map(node => node.id)

const computeFlowsHash = state => {
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

  return _.values(state.flowsByName).reduce((obj, curr) => {
    if (!curr) {
      return obj
    }

    let buff = ''
    buff += curr.name
    buff += curr.startNode

    if (curr.catchAll) {
      buff = hashAction(buff, curr.catchAll.onReceive)
      buff = hashAction(buff, curr.catchAll.onEnter)
      buff = hashAction(buff, curr.catchAll.next)
    }

    _.orderBy(curr.nodes, 'id').forEach(node => {
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

    _.orderBy(curr.links, l => l.source + l.target).forEach(link => {
      buff += link.source
      buff += link.target
      link.points &&
        link.points.forEach(p => {
          buff += p.x
          buff += p.y
        })
    })

    obj[curr.name] = hashCode(buff)
    return obj
  }, {})
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
  return {
    ...state,
    currentSnapshot,
    currentFlow: currentSnapshot.currentFlow,
    currentFlowNode: currentSnapshot.currentFlowNode,
    flowsByName: currentSnapshot.flowsByName,
    [stackName]: state[stackName].slice(1),
    [oppositeStack]: [state.currentSnapshot, ...state[oppositeStack]]
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

const doRenameFlow = ({ flow, name, flows }) =>
  flows.reduce((obj, f) => {
    if (f.name === flow) {
      f.name = name
      f.location = name
    }

    if (f.nodes) {
      let json = JSON.stringify(f.nodes)
      json = json.replace(flow, name)
      f.nodes = JSON.parse(json)
    }

    obj[f.name] = f

    return obj
  }, {})

const doCreateNewFlow = name => ({
  version: '0.1',
  name: name,
  location: name,
  startNode: 'entry',
  catchAll: {},
  links: [],
  nodes: [
    {
      id: prettyId(),
      name: 'entry',
      onEnter: [],
      onReceive: null,
      next: [],
      x: 100,
      y: 100
    }
  ]
})

// *****
// Reducer that deals with non-recordable (no snapshot taking)
// *****

let reducer = handleActions(
  {
    [updateFlowProblems]: (state, { payload }) => ({
      ...state,
      flowProblems: payload
    }),

    [requestFlows]: state => ({
      ...state,
      fetchingFlows: true
    }),

    [receiveFlows]: (state, { payload }) => {
      const flows = _.keys(payload).filter(key => !payload[key].skillData)
      const defaultFlow = _.keys(payload).includes('main.flow.json') ? 'main.flow.json' : _.first(flows)
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

    [requestSaveFlows]: state => ({
      ...state,
      savingFlows: true
    }),

    [receiveSaveFlows]: state => ({
      ...state,
      savingFlows: false
    }),

    [switchFlowNode]: (state, { payload }) => ({
      ...state,
      currentFlowNode: payload
    }),

    [openFlowNodeProps]: state => ({
      ...state,
      showFlowNodeProps: true
    }),

    [closeFlowNodeProps]: state => ({
      ...state,
      showFlowNodeProps: false
    }),

    [switchFlow]: (state, { payload }) => {
      if (state.currentFlow === payload) {
        return state
      }

      return {
        ...state,
        currentFlowNode: null,
        currentFlow: payload
      }
    },

    [setDiagramAction]: (state, { payload }) => ({
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
      [renameFlow]: (state, { payload: { targetFlow, name } }) => ({
        ...state,
        flowsByName: doRenameFlow({
          flow: targetFlow,
          name,
          flows: _.values(state.flowsByName)
        }),
        currentFlow: name
      }),

      [updateFlow]: (state, { payload }) => {
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

      [createFlow]: (state, { payload: name }) => ({
        ...state,
        flowsByName: {
          ...state.flowsByName,
          [name]: doCreateNewFlow(name)
        },
        currentFlow: name,
        currentFlowNode: null
      }),

      [deleteFlow]: (state, { payload: name }) => ({
        ...state,
        currentFlow: state.currentFlow === name ? 'main.flow.json' : state.currentFlow,
        currentFlowNode: state.currentFlow === name ? null : state.currentFlowNode,
        flowsByName: _.omit(state.flowsByName, name)
      }),

      // Inserting a new skill essentially:
      // 1. creates a new flow
      // 2. creates a new "skill" node
      // 3. puts that new node in the "insert buffer", waiting for user to place it on the canvas
      [insertNewSkill]: (state, { payload }) => {
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

        return {
          ...state,
          currentDiagramAction: 'insert_skill',
          nodeInBuffer: newNode,
          flowsByName: {
            ...state.flowsByName,
            [newFlow.name]: newFlow
          }
        }
      },

      [updateSkill]: (state, { payload }) => {
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
              const prevTransition = node.next.find(({ condition }) => condition === transition.condition)
              return { ...transition, node: (prevTransition || {}).node || '' }
            })
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

      [insertNewSkillNode]: (state, { payload }) => ({
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

      [duplicateFlow]: (state, { payload: { flowNameToDuplicate, name } }) => {
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

      [updateFlowNode]: (state, { payload }) => {
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

      [removeFlowNode]: (state, { payload }) => {
        const flowsToRemove = []
        const nodeToRemove = _.find(state.flowsByName[state.currentFlow].nodes, { id: payload })

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
              nodes: state.flowsByName[state.currentFlow].nodes.filter(node => node.id !== payload)
            }
          }
        }
      },

      [copyFlowNode]: state => {
        const node = _.find(state.flowsByName[state.currentFlow].nodes, { id: state.currentFlowNode })
        if (!node) {
          return state
        }
        return {
          ...state,
          nodeInBuffer: { ...node, next: node.next.map(item => ({ ...item, node: '' })) }
        }
      },

      [pasteFlowNode]: (state, { payload: { x, y } }) => {
        const currentFlow = state.flowsByName[state.currentFlow]
        const newNodeId = prettyId()
        const name = copyName(currentFlow.nodes.map(({ name }) => name), state.nodeInBuffer.name)
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

      [pasteFlowNodeElement]: (state, { payload }) => {
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

      [createFlowNode]: (state, { payload }) => ({
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

      [updateFlow]: updateCurrentHash,
      [renameFlow]: updateCurrentHash,
      [updateFlowNode]: updateCurrentHash,

      [createFlowNode]: updateCurrentHash,
      [createFlow]: updateCurrentHash,
      [deleteFlow]: updateCurrentHash,
      [duplicateFlow]: updateCurrentHash,
      [removeFlowNode]: updateCurrentHash,
      [pasteFlowNode]: updateCurrentHash,
      [insertNewSkillNode]: updateCurrentHash,
      [updateSkill]: updateCurrentHash,
      [pasteFlowNodeElement]: updateCurrentHash
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
      [updateFlow]: recordHistory,
      [renameFlow]: recordHistory,
      [updateFlowNode]: recordHistory,
      [createFlowNode]: recordHistory,
      [createFlow]: recordHistory,
      [deleteFlow]: recordHistory,
      [duplicateFlow]: recordHistory,
      [removeFlowNode]: recordHistory,
      [pasteFlowNode]: recordHistory,
      [insertNewSkill]: recordHistory,
      [insertNewSkillNode]: recordHistory,
      [updateSkill]: recordHistory,
      [pasteFlowNodeElement]: recordHistory,
      [handleFlowEditorUndo]: popHistory('undoStack'),
      [handleFlowEditorRedo]: popHistory('redoStack')
    },
    defaultState
  )
)

export default reducer
