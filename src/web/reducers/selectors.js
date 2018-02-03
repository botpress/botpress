import _ from 'lodash'

export const getCurrentFlow = state => state.flows.flowsByName[state.flows.currentFlow] || null

export const getCurrentFlowNode = state => {
  if (!state.flows || !state.flows.currentFlow || !state.flows.currentFlowNode) {
    return
  }

  const currentFlow = getCurrentFlow(state)
  return currentFlow && _.find(currentFlow.nodes, { id: state.flows.currentFlowNode })
}

export const getDirtyFlows = state => {
  if (!state.flows) {
    return []
  }

  const currentKeys = _.keys(state.flows.currentHashes)
  const initialKeys = _.keys(state.flows.initialHashes)
  const keys = _.union(currentKeys, initialKeys)

  const dirtyFlows = _.union(_.xor(keys, currentKeys), _.xor(keys, initialKeys))

  _.keys(state.flows.flowsByName).forEach(flow => {
    if (state.flows.initialHashes[flow] !== state.flows.currentHashes[flow]) {
      dirtyFlows.push(flow)
    }
  })

  return dirtyFlows
}

export const canFlowUndo = state => state.flows.undoStack.length > 0

export const canFlowRedo = state => state.flows.redoStack.length > 0
