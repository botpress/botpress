import _ from 'lodash'
import { createSelector } from 'reselect'

const _getFlowsByName = state => state.flows?.flowsByName
const _getCurrentFlow = state => state.flows?.currentFlow
const _getCurrentFlowNode = state => state.flows?.currentFlowNode
const _getCurrentHashes = state => state.flows.currentHashes
const _getInitialHashes = state => state.flows.initialHashes

export const getAllFlows = createSelector([_getFlowsByName], flowsByName => {
  return _.values(flowsByName)
})

export const getFlowNamesList = createSelector([getAllFlows], flows => {
  const normalFlows = _.reject(flows, x => x.name && x.name.startsWith('skills/'))
  return normalFlows.map(x => {
    const withTriggers = x.nodes.filter(x => x.type === 'trigger')
    return { name: x.name, label: x.label, triggerCount: withTriggers.length }
  })
})

export const getCurrentFlow = createSelector([_getFlowsByName, _getCurrentFlow], (flowsByName, currFlow) => {
  return flowsByName[currFlow]
})

export const getCurrentFlowNode = createSelector([getCurrentFlow, _getCurrentFlowNode], (currentFlow, currFlowNode) => {
  return _.find(currentFlow?.nodes, { id: currFlowNode })
})

export const getNewFlows = createSelector([_getCurrentHashes, _getInitialHashes], (currentHash, initialHash) => {
  return _.without(_.keys(currentHash), ..._.keys(initialHash))
})

export const getDeletedFlows = createSelector([_getCurrentHashes, _getInitialHashes], (currentHash, initialHash) => {
  return _.without(_.keys(initialHash), ..._.keys(currentHash))
})

export const getModifiedFlows = createSelector(
  [_getFlowsByName, _getCurrentHashes, _getInitialHashes],
  (flowsByName, currentHash, initialHash) => {
    const modifiedFlows = []
    _.keys(flowsByName).forEach(flow => {
      if (initialHash[flow] !== currentHash[flow]) {
        modifiedFlows.push(flow)
      }
    })

    return modifiedFlows
  }
)

export const getDirtyFlows = createSelector([getNewFlows, getModifiedFlows], (newFlows, modifiedFlows) => {
  return [...newFlows, ...modifiedFlows]
})

export const canFlowUndo = state => state.flows.undoStack.length > 0

export const canFlowRedo = state => state.flows.redoStack.length > 0
