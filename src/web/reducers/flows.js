import { handleActions } from 'redux-actions'

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
  flowsById: {},
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
      flowsById: payload
    })
  },
  defaultState
)

export default reducer
