import { Flow, FlowNode } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import { createSelector } from 'reselect'

const _getFlowsByName = state => state.flows?.flowsByName
const _getCurrentFlow = state => state.flows?.currentFlow
const _getCurrentFlowNode = state => state.flows?.currentFlowNode
const _getCurrentHashes = state => state.flows.currentHashes
const _getInitialHashes = state => state.flows.initialHashes

export const getAllFlows = createSelector([_getFlowsByName], (flowsByName): FlowView[] => {
  return _.values(flowsByName)
})

export const getFlowNames = createSelector([getAllFlows], flows => {
  const normalFlows = _.reject(flows, x => x.name && x.name.startsWith('skills/'))
  return normalFlows.map(x => x.name)
})

export const getFlowNamesList = createSelector([getAllFlows], flows => {
  const normalFlows = _.reject(flows, x => x.name && x.name.startsWith('skills/'))

  const references = normalFlows.reduce((acc, flow) => {
    acc[flow.name] = _.flatMap(flow.nodes, node => node.next.map(x => x.node)).filter(x => x.endsWith('.flow.json'))
    return acc
  }, {})

  return normalFlows.map(x => {
    const withTriggers = x.nodes.filter(x => x.type === 'trigger')
    const referencedIn = Object.keys(references).filter(flowName => references[flowName].includes(x.name))

    return { name: x.name, label: x.label, triggerCount: withTriggers.length, referencedIn }
  })
})

export const getCurrentFlow = createSelector(
  [_getFlowsByName, _getCurrentFlow],
  (flowsByName, currFlow): FlowView => {
    return flowsByName[currFlow]
  }
)

export const getCurrentFlowNode = createSelector([getCurrentFlow, _getCurrentFlowNode], (currentFlow, currFlowNode):
  | FlowNode
  | undefined => {
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
