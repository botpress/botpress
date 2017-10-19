import { handleActions } from 'redux-actions'
import _ from 'lodash'

import {
  fetchFlows,
  requestFlows,
  receiveFlows,
  switchFlow,
  updateFlow,
  saveFlow,
  updateFlowNode,
  switchFlowNode
} from './actions'

const defaultState = {
  flowsByName: {},
  fetchingFlows: false,
  currentFlow: null,
  currentFlowNode: null
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

    [switchFlowNode]: (state, { payload }) => ({
      ...state,
      currentFlowNode: payload
    }),

    [updateFlow]: (state, { payload }) => ({
      ...state,
      flowsByName: (state.flowsByName = {
        ...state.flowsByName,
        [state.currentFlow]: {
          ...state.flowsByName[state.currentFlow],
          ...payload
        }
      })
    }),

    [updateFlowNode]: (state, { payload }) => ({
      ...state,
      flowsByName: (state.flowsByName = {
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
      })
    }) // END updateFlowNode
  },
  defaultState
)

export default reducer
