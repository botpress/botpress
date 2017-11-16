import { combineReducers } from 'redux'
import _ from 'lodash'

import flows from './flows'
import license from './license'
import ui from './ui'
import user from './user'
import bot from './bot'
import modules from './modules'
import rules from './rules'
import notifications from './notifications'

const bpApp = combineReducers({ flows, license, ui, user, bot, modules, rules, notifications })

export default bpApp

export const getCurrentFlow = state => state.flows.flowsByName[state.flows.currentFlow]

export const getCurrentFlowNode = state => {
  if (!state.flows || !state.flows.currentFlow || !state.flows.currentFlowNode) {
    return
  }

  const currentFlow = getCurrentFlow(state)
  return currentFlow && _.find(currentFlow.nodes, { id: state.flows.currentFlowNode })
}
