import axios from 'axios'
import { Promise as BbPromise } from 'bluebird'
import _ from 'lodash'

type DebounceUpdateFunc = ((flow: any, callback: any) => Promise<void>) & _.Cancelable

const DELAY = 1000

export namespace FlowsAPI {
  const currentUpdates: _.Dictionary<DebounceUpdateFunc> = {}

  export const cancelUpdate = (name: string) => {
    const updater = currentUpdates[name]
    if (updater) {
      updater.cancel()
    }
  }

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

    const newDebounce = _.debounce(buildUpdateDebounced(name), DELAY, { leading: true })
    currentUpdates[name] = newDebounce
    return BbPromise.fromCallback(cb => newDebounce(flowDto, cb))
  }

  const apiDeleteFlow = async (flowName: string) => {
    flowName = escapeForwardSlashes(flowName)
    return axios.post(`${window.BOT_API_PATH}/flow/${flowName}/delete`)
  }

  const apiInsertFlow = async flow => {
    return axios.post(`${window.BOT_API_PATH}/flow`, { flow })
  }

  const apiUpdateFlow = async (flowName: string, flow) => {
    flowName = escapeForwardSlashes(flowName)
    return axios.post(`${window.BOT_API_PATH}/flow/${flowName}`, { flow })
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
      // 423 === Mutex locked we don't have anything to do...
      if (response.status !== 423) {
        callback(response)
      }
    }
  }

  const toFlowDto = (flow: any, name: string) => {
    return {
      name,
      version: '0.0.1',
      flow: name,
      ..._.pick(flow, [
        'location',
        'startNode',
        'catchAll',
        'links',
        'nodes',
        'skillData',
        'timeoutNode',
        'triggers', // TODO: NDU Remove
        'description',
        'label'
      ])
    }
  }
}
