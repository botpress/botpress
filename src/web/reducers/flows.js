import { handleActions } from 'redux-actions'
import reduceReducers from 'reduce-reducers'
import _ from 'lodash'

import { hashCode } from '~/util'

import {
  fetchFlows,
  requestFlows,
  requestSaveFlow,
  receiveSaveFlow,
  receiveFlows,
  switchFlow,
  updateFlow,
  renameFlow,
  saveFlow,
  updateFlowNode,
  switchFlowNode,
  setDiagramAction,
  createFlowNode,
  createFlow,
  removeFlowNode
} from '~/actions'

const defaultState = {
  flowsByName: {},
  fetchingFlows: false,
  currentFlow: null,
  currentFlowNode: null,
  currentDiagramAction: null
}

let reducer = handleActions(
  {
    [requestFlows]: state => ({
      ...state,
      fetchingFlows: true
    }),

    [receiveFlows]: (state, { payload }) => ({
      ...state,
      fetchingFlows: false,
      flowsByName: payload,
      currentFlow: state.currentFlow || _.first(_.keys(payload))
    }),

    [renameFlow]: (state, { payload }) => ({
      ...state,
      flowsByName: doRenameFlow({ flow: state.currentFlow, name: payload, flows: _.values(state.flowsByName) }),
      currentFlow: payload
    }),

    [requestSaveFlow]: state => ({
      ...state,
      savingFlows: true
    }),

    [receiveSaveFlow]: state => ({
      ...state,
      savingFlows: false
    }),

    [switchFlowNode]: (state, { payload }) => ({
      ...state,
      currentFlowNode: payload
    }),

    [switchFlow]: (state, { payload }) => {
      return {
        ...state,
        currentFlowNode: null,
        currentFlow: payload
      }
    },

    [updateFlow]: (state, { payload }) => ({
      ...state,
      flowsByName: {
        ...state.flowsByName,
        [state.currentFlow]: {
          ...state.flowsByName[state.currentFlow],
          ...payload
        }
      }
    }),

    [createFlow]: (state, { payload: name }) => ({
      ...state,
      flowsByName: {
        ...state.flowsByName,
        [name]: doCreateNewFlow(name)
      },
      currentFlow: name,
      currentFlowNode: null
    }),

    [updateFlowNode]: (state, { payload }) => ({
      ...state,
      flowsByName: {
        ...state.flowsByName,
        [state.currentFlow]: {
          ...state.flowsByName[state.currentFlow],
          nodes: state.flowsByName[state.currentFlow].nodes.map(node => {
            if (node.id !== state.currentFlowNode) {
              return node
            }

            return { ...node, ...payload, lastModified: new Date() }
          })
        }
      }
    }), // END updateFlowNode

    [removeFlowNode]: (state, { payload }) => ({
      ...state,
      flowsByName: {
        ...state.flowsByName,
        [state.currentFlow]: {
          ...state.flowsByName[state.currentFlow],
          nodes: state.flowsByName[state.currentFlow].nodes.filter(node => {
            return node.id !== payload
          })
        }
      }
    }),

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
                id: Math.random()
                  .toString()
                  .substr(2, 10),
                name:
                  'node-' +
                  Math.random()
                    .toString()
                    .substr(2, 4),
                x: 0,
                y: 0,
                next: [],
                onEnter: [],
                onReceive: []
              },
              payload
            )
          ]
        }
      }
    }),

    [setDiagramAction]: (state, { payload }) => ({
      ...state,
      currentDiagramAction: payload
    })
  },
  defaultState
)

function doRenameFlow({ flow, name, flows }) {
  return _.reduce(
    flows,
    function(obj, f) {
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
    },
    {}
  )
}

function doCreateNewFlow(name) {
  return {
    version: '0.1',
    name: name,
    location: name,
    startNode: 'entry',
    catchAll: {},
    links: [],
    nodes: [
      {
        id: 'NODE-' + new Date().getTime(),
        name: 'entry',
        onEnter: [],
        onReceive: [],
        next: [],
        x: 100,
        y: 100
      }
    ]
  }
}

// *****
// Reducer that creates snapshots of the flows (for undo / redo)
// *****

reducer = reduceReducers(
  reducer,
  handleActions(
    {
      [updateFlow]: createSnapshot,
      [renameFlow]: createSnapshot,
      [updateFlowNode]: createSnapshot,
      [createFlowNode]: createSnapshot,
      [createFlow]: createSnapshot,
      [removeFlowNode]: createSnapshot
    },
    defaultState
  )
)

function createSnapshot(state) {
  return state
}

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

      [receiveSaveFlow]: state => {
        const hashes = computeFlowsHash(state)
        return { ...state, currentHashes: hashes, initialHashes: hashes }
      },

      [updateFlow]: updateCurrentHash,
      [renameFlow]: updateCurrentHash,
      [updateFlowNode]: updateCurrentHash,

      [createFlowNode]: updateCurrentHash,
      [createFlow]: updateCurrentHash,
      [removeFlowNode]: updateCurrentHash
    },
    defaultState
  )
)

function computeFlowsHash(state) {
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

function updateCurrentHash(state) {
  return { ...state, currentHashes: computeFlowsHash(state) }
}

export default reducer
