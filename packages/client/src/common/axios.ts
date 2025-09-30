import * as axios from 'axios'
import * as consts from './consts'
import { addDebugInterceptors } from './debug-interceptors'
import * as types from './types'

const createAxios = (config: types.ClientConfig): axios.AxiosRequestConfig => ({
  baseURL: config.apiUrl,
  headers: config.headers,
  withCredentials: config.withCredentials,
  timeout: config.timeout,
  maxBodyLength: consts.maxBodyLength,
  maxContentLength: consts.maxContentLength,
  httpAgent: consts.httpAgent,
  httpsAgent: consts.httpsAgent,
})

export const getAxiosInstance = (config: types.ClientConfig): axios.AxiosInstance => {
  const axiosConfig = createAxios(config)
  const axiosInstance = axios.default.create(axiosConfig)

  if (config.debug) {
    addDebugInterceptors(axiosInstance)
  }

  return axiosInstance
}
