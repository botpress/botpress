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
  saveFlow,
  updateFlowNode,
  switchFlowNode,
  setDiagramAction,
  createFlowNode,
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

            return { ...node, ...payload }
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

export default reducer
