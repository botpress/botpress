import * as axios from 'axios'
import * as consts from './consts'
import * as types from './types'

export const createAxios = (config: types.ClientConfig): axios.AxiosRequestConfig => ({
  baseURL: config.apiUrl,
  headers: config.headers,
  withCredentials: config.withCredentials,
  timeout: config.timeout,
  maxBodyLength: consts.maxBodyLength,
  maxContentLength: consts.maxContentLength,
  httpAgent: consts.httpAgent,
  httpsAgent: consts.httpAgent,
})
