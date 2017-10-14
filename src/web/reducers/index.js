import { combineReducers } from 'redux'
import _ from 'lodash'

import flows from './flows'

const bpApp = combineReducers({ flows })

export default bpApp

export const getCurrentFlow = state => state.flows.flowsById[state.flows.currentFlow]

export const getCurrentFlowNode = state => {
  if (!state.flows || !state.flows.currentFlow || !state.flows.currentFlowNode) {
    return
  }

  const currentFlow = getCurrentFlow(state)
  return currentFlow && _.find(currentFlow.nodes, { id: state.flows.currentFlowNode })
}
