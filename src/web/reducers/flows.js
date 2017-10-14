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
      flowsById: payload,
      currentFlow: state.currentFlow || _.first(_.keys(payload))
    }),

    [switchFlowNode]: (state, { payload }) => ({
      ...state,
      currentFlowNode: payload
    })
  },
  defaultState
)

export default reducer
