import * as axios from 'axios'
import * as crypto from 'crypto'

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
    config.metadata = { startTime: new Date().getTime(), id: crypto.randomUUID() }
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
    [
      'Request:',
      `  Method: ${method?.toUpperCase()}`,
      `  URL: ${url}`,
      `  Timestamp: ${new Date().toISOString()}`,
      `  Request Id: ${config.metadata?.id}`,
      `  Headers: \n${JSON.stringify(headers)}`,
      `  Body: \n${typeof data === 'string' ? data : JSON.stringify(data)}`,
    ].join('\n') + '\n'
  )
}

const _formatResponseLog = (response: AxiosResponseWithMetadata): string => {
  const { config, status, statusText, headers, data } = response
  const duration = _formatDuration(response)

  return [
    'Response:',
    `  Status: ${status} ${statusText}`,
    `  URL: ${config.url}`,
    `  Timestamp: ${new Date().toISOString()}`,
    `  Request Id: ${config.metadata?.id}`,
    `  Duration: ${duration}`,
    `  Headers: \n${JSON.stringify(headers)}`,
    `  Body: \n${typeof data === 'string' ? data : JSON.stringify(data)}`,
  ].join('\n')
}

const _formatErrorLog = (error: AxiosErrorWithMetadata): string => {
  const duration = error ? _formatDuration(error) : 'N/A'

  return (
    [
      'Error Response:',
      `  Status: ${error.code}`,
      `  URL: ${error.config.url ?? 'N/A'}`,
      `  Timestamp: ${new Date().toISOString()}`,
      `  Duration: ${duration}`,
    ].join('\n') + '\n'
  )
}

const _formatDuration = (response: AxiosResponseWithMetadata | AxiosErrorWithMetadata) => {
  const startTime = response.config.metadata?.startTime
  const endTime = new Date().getTime()
  const duration = startTime ? `${endTime - startTime}ms` : 'N/A'
  return duration
}
