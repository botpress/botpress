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
  const newFlows = getNewFlows(state)
  const modifiedFlows = getModifiedFlows(state)

  return [...newFlows, ...modifiedFlows]
}

export const getNewFlows = state => {
  if (!state.flows) {
    return []
  }

  const currentKeys = _.keys(state.flows.currentHashes)
  const initialKeys = _.keys(state.flows.initialHashes)

  return _.without(currentKeys, ...initialKeys)
}

export const getDeletedFlows = state => {
  if (!state.flows) {
    return []
  }

  const currentKeys = _.keys(state.flows.currentHashes)
  const initialKeys = _.keys(state.flows.initialHashes)

  return _.without(initialKeys, ...currentKeys)
}

export const getModifiedFlows = state => {
  if (!state.flows) {
    return []
  }

  const modifiedFlows = []
  _.keys(state.flows.flowsByName).forEach(flow => {
    if (state.flows.initialHashes[flow] !== state.flows.currentHashes[flow]) {
      modifiedFlows.push(flow)
    }
  })

  return modifiedFlows
}

export const canFlowUndo = state => state.flows.undoStack.length > 0

export const canFlowRedo = state => state.flows.redoStack.length > 0
