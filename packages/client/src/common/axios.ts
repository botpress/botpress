import * as axios from 'axios'
import * as consts from './consts'
import * as types from './types'

const TIMING_HEADER = 'x-start-time'

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
    //log: request body, headers and timings
    //response body, headers and timings
    axiosInstance.interceptors.request.use((config) => {
      console.debug(formatRequestLog(config))
      return config
    })
    axiosInstance.interceptors.response.use((response) => {
      console.debug(formatResponseLog(response))
      return response
    })
  }
  return axiosInstance
}

export const formatRequestLog = (config: axios.AxiosRequestConfig): string => {
  const { method, url, headers, data } = config
  return [
    'Request:',
    `  Method: ${method?.toUpperCase()}`,
    `  URL: ${url}`,
    `  Headers: ${JSON.stringify(headers, null, 2)}`,
    `  Body: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`,
    `  Timestamp: ${new Date().toISOString()}`,
  ].join('\n')
}

export const formatResponseLog = (response: axios.AxiosResponse): string => {
  const { config, status, statusText, headers, data } = response
  // Axios allows you to attach custom properties to config, so we can store start time
  const startTime = response.data[TIMING_HEADER]
  const endTime = new Date().getTime()
  const duration = startTime ? `${endTime - startTime}ms` : 'N/A'

  return [
    'Response:',
    `  Status: ${status} ${statusText}`,
    `  URL: ${config.url}`,
    `  Duration: ${duration}`,
    `  Headers: ${JSON.stringify(headers, null, 2)}`,
    `  Body: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`,
    `  Timestamp: ${new Date().toISOString()}`,
  ].join('\n')
}
