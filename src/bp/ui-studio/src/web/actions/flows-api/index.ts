import _ from 'lodash'

import { deleteFlow as apiDeleteFlow, insertFlow, updateFlow as apiUpdateFlow } from './api'

const DELAY = 1000

export namespace FlowsAPI {
  export const deleteFlow = async (flowState: any, name: string) => {
    return apiDeleteFlow(name)
  }

  export const createFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    return insertFlow(flowDto)
  }

  export const renameFlow = async (flowState: any, previousName: string, newName: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[newName]

    const flowDto = toFlowDto(flow, newName)

    return apiUpdateFlow(previousName, flowDto)
  }

  export const updateFlow = async (flowState: any, name: string, then?: () => void, error?: (err) => void) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    const debounced = currentUpdates[name]
    if (debounced) {
      debounced(flowDto)
      return
    }

    const newDebounce = _.debounce(buildUpdateDebounced(name, then, error), DELAY)
    await newDebounce(flowDto)
    currentUpdates[name] = newDebounce
  }
}

const buildUpdateDebounced = (flowName: string, then?: () => void, error?: (err) => void) => async f => {
  try {
    await apiUpdateFlow(flowName, f)
    then && then()
  } catch (err) {
    const { response } = err
    error && error(response)
  }
}

const currentUpdates = {}

const toFlowDto = (flow: any, name: string) => {
  return {
    name,
    version: '0.0.1',
    flow: name,
    location: flow.location,
    startNode: flow.startNode,
    catchAll: flow.catchAll,
    links: flow.links,
    nodes: flow.nodes,
    skillData: flow.skillData,
    timeoutNode: flow.timeoutNode
  }
}
