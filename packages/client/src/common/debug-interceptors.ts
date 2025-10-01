import * as axios from 'axios'
import { isNode } from 'browser-or-node'
let randomUUID: () => string
if (isNode) {
  // Only import in Node.js
  randomUUID = require('crypto').randomUUID
} else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
  // Browser with Web Crypto API
  randomUUID = () => crypto.randomUUID()
} else {
  // Fallback
  randomUUID = () => Math.random().toString(36).substring(2, 15)
}

type AxiosRequestConfigWithMetadata<T = unknown> = {
  headers: axios.AxiosRequestHeaders
  metadata?: {
    id?: string
    startTime?: number
  }
} & axios.AxiosRequestConfig<T>

type AxiosResponseWithMetadata<T = unknown, D = unknown> = {
  config: AxiosRequestConfigWithMetadata<D>
} & axios.AxiosResponse<T, D>

type AxiosErrorWithMetadata<T = unknown, D = unknown> = {
  config: AxiosRequestConfigWithMetadata<D>
} & axios.AxiosError<T, D>

export const addDebugInterceptors = (axiosInstance: axios.AxiosInstance) => {
  axiosInstance.interceptors.request.use((config: AxiosRequestConfigWithMetadata) => {
    config.metadata = { startTime: new Date().getTime(), id: randomUUID() }
    console.debug(_formatRequestLog(config))
    return config
  })

  axiosInstance.interceptors.response.use(
    (response) => {
      console.debug(_formatResponseLog(response))
      return response
    },

    (error) => {
      console.debug(_formatErrorLog(error))
      return Promise.reject(error)
    }
  )
}

const _formatRequestLog = (config: AxiosRequestConfigWithMetadata): string => {
  const { method, url, headers, data } = config
  return (
    'REQUEST:\n' +
    JSON.stringify({
      method: method?.toUpperCase(),
      url,
      timestamp: new Date().toISOString(),
      requestId: config.metadata?.id,
      headers,
      body: data,
    }) +
    '\n'
  )
}

const _formatResponseLog = (response: AxiosResponseWithMetadata): string => {
  const { config, status, headers, data } = response
  const duration = _formatDuration(response)

  return (
    'RESPONSE:\n' +
    JSON.stringify({
      method: config.method?.toUpperCase(),
      status,
      url: config.url,
      timestamp: new Date().toISOString(),
      requestId: config.metadata?.id,
      duration,
      headers,
      body: data,
    })
  )
}

const _formatErrorLog = (error: AxiosErrorWithMetadata): string => {
  const duration = error ? _formatDuration(error) : 'N/A'

  return (
    'ERROR:\n' +
    JSON.stringify({
      status: error.code,
      url: error.config.url ?? 'N/A',
      timestamp: new Date().toISOString(),
      duration,
    })
  )
}

const _formatDuration = (response: AxiosResponseWithMetadata | AxiosErrorWithMetadata) => {
  const startTime = response.config.metadata?.startTime
  const endTime = new Date().getTime()
  const duration = startTime ? `${endTime - startTime}ms` : 'N/A'
  return duration
}
