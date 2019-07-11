import { getModifiedFlows } from '../../reducers/selectors'

import { deleteFlow as apiDeleteFlow, insertFlow, updateFlow as apiUpdateFlow } from './api'

export namespace FlowsAPI {
  export const deleteFlow = async (flowState: any, name: string) => {
    await apiDeleteFlow(name)
  }

  export const createFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    await insertFlow(flowDto)
  }

  export const renameFlow = async (flowState: any, previousName: string, newName: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[newName]

    const flowDto = toFlowDto(flow, newName)

    await apiUpdateFlow(previousName, flowDto)
  }

  export const updateFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    await apiUpdateFlow(name, flowDto)
  }
}

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
