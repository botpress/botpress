import axios from 'axios'
import { Promise as BbPromise } from 'bluebird'
import _ from 'lodash'

type DebounceUpdateFunc = ((flow: any, callback: any) => Promise<void>) & _.Cancelable

const DELAY = 1000

export namespace FlowsAPI {
  const currentUpdates: _.Dictionary<DebounceUpdateFunc> = {}

  export const deleteFlow = async (_flowState: any, name: string) => {
    return apiDeleteFlow(name)
  }

  export const createFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    return apiInsertFlow(flowDto)
  }

  export const renameFlow = async (flowState: any, previousName: string, newName: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[newName]

    const flowDto = toFlowDto(flow, newName)

    return apiUpdateFlow(previousName, flowDto)
  }

  export const updateFlow = async (flowState: any, name: string) => {
    const flowsByName = flowState.flowsByName
    const flow = flowsByName[name]

    const flowDto = toFlowDto(flow, name)

    const debounced = currentUpdates[name]
    if (debounced) {
      return BbPromise.fromCallback(cb => debounced(flowDto, cb))
    }

    const newDebounce = _.debounce(buildUpdateDebounced(name), DELAY)
    currentUpdates[name] = newDebounce
    return BbPromise.fromCallback(cb => newDebounce(flowDto, cb))
  }

  const apiDeleteFlow = async (flowName: string) => {
    flowName = escapeForwardSlashes(flowName)
    return axios.delete(`${window.BOT_API_PATH}/flow/${flowName}`)
  }

  const apiInsertFlow = async flow => {
    return axios.post(`${window.BOT_API_PATH}/flow`, { flow })
  }

  const apiUpdateFlow = async (flowName: string, flow) => {
    flowName = escapeForwardSlashes(flowName)
    return axios.put(`${window.BOT_API_PATH}/flow/${flowName}`, { flow })
  }

  const escapeForwardSlashes = (pathParam: string) => {
    return pathParam.replace(/\//g, '%2F')
  }

  const buildUpdateDebounced = (flowName: string) => async (f, callback) => {
    try {
      await apiUpdateFlow(flowName, f)
      callback()
    } catch (err) {
      const { response } = err
      callback(response)
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
}
