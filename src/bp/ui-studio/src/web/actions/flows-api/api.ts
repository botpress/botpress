import axios from 'axios'

export const deleteFlow = async (flowName: string) => {
  flowName = escapeForwardSlashes(flowName)
  return axios.delete(`${window.BOT_API_PATH}/flow/${flowName}`)
}

export const insertFlow = async flow => {
  return axios.post(`${window.BOT_API_PATH}/flow`, { flow })
}

export const updateFlow = async (flowName: string, flow) => {
  console.log(`update!!!!: ${flowName}`)
  flowName = escapeForwardSlashes(flowName)
  return axios.put(`${window.BOT_API_PATH}/flow/${flowName}`, { flow })
}

const escapeForwardSlashes = (pathParam: string) => {
  return pathParam.replace(/\//g, '%2F')
}
