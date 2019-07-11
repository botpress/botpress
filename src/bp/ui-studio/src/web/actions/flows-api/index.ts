import _ from 'lodash'

import { deleteFlow as apiDeleteFlow, insertFlow, updateFlow as apiUpdateFlow } from './api'

const DEBOUNCE_WAIT = 1000
const DEBOUNCE_MAX_WAIT = 5000

const debounceDeleteFlow = _.debounce(apiDeleteFlow, DEBOUNCE_WAIT, { maxWait: DEBOUNCE_MAX_WAIT })
const debounceUpdateFlow = _.debounce(apiUpdateFlow, DEBOUNCE_WAIT, { maxWait: DEBOUNCE_MAX_WAIT })
const debounceInsertFlow = _.debounce(insertFlow, DEBOUNCE_WAIT, { maxWait: DEBOUNCE_MAX_WAIT })

export namespace FlowsAPI {
  export const deleteFlow = async (flowState: any, name: string) => {
    await debounceDeleteFlow(name)
  }

  export const createFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    await debounceInsertFlow(flowDto)
  }

  export const renameFlow = async (flowState: any, previousName: string, newName: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[newName]

    const flowDto = toFlowDto(flow, newName)

    await debounceUpdateFlow(previousName, flowDto)
  }

  export const updateFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    await debounceUpdateFlow(name, flowDto)
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
