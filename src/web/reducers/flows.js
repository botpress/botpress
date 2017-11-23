import { handleActions } from 'redux-actions'
import _ from 'lodash'

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

const reducer = handleActions(
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

export default reducer
