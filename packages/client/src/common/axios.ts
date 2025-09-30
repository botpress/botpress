import * as axios from 'axios'
import * as consts from './consts'
import * as types from './types'

// const TIMING_HEADER = 'x-start-time'
type AxiosRequestConfigWithMetadata<T = unknown> = {
  headers: axios.AxiosRequestHeaders
  metadata?: {
    startTime?: number
  }
} & axios.AxiosRequestConfig<T>

type AxiosResponseWithMetadata<T = unknown, D = unknown> = {
  config: AxiosRequestConfigWithMetadata<D>
} & axios.AxiosResponse<T, D>

type AxiosErrorWithMetadata<T = unknown, D = unknown> = {
  config: AxiosRequestConfigWithMetadata<D>
} & axios.AxiosError<T, D>

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
    axiosInstance.interceptors.request.use((config: AxiosRequestConfigWithMetadata) => {
      config.metadata = { startTime: new Date().getTime() }
      console.debug(formatRequestLog(config))
      return config
    })

    axiosInstance.interceptors.response.use(
      (response) => {
        console.debug(formatResponseLog(response))
        return response
      },
      (error) => {
        console.debug(formatErrorLog(error))
        return error
      }
    )
  }

  return axiosInstance
}

const formatRequestLog = (config: axios.AxiosRequestConfig): string => {
  const { method, url, headers, data } = config
  return (
    [
      'Request:',
      `  Method: ${method?.toUpperCase()}`,
      `  URL: ${url}`,
      `  Headers: ${JSON.stringify(headers, null, 2)}`,
      `  Body: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`,
      `  Timestamp: ${new Date().toISOString()}`,
    ].join('\n') + '\n'
  )
}

const formatResponseLog = (response: AxiosResponseWithMetadata): string => {
  const { config, status, statusText, headers, data } = response
  const duration = _formatDuration(response)

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

const formatErrorLog = (error: AxiosErrorWithMetadata): string => {
  const config = error?.config ?? error.config
  const status = error?.status ?? 'N/A'
  const code = error?.code ?? 'N/A'
  const duration = error ? _formatDuration(error) : 'N/A'

  return [
    'Error Response:',
    `  Status: ${code} - ${status}`,
    `  URL: ${config?.url ?? 'N/A'}`,
    `  Duration: ${duration}`,
    `  Timestamp: ${new Date().toISOString()}`,
  ].join('\n')
}

const _formatDuration = (response: AxiosResponseWithMetadata | AxiosErrorWithMetadata) => {
  const startTime = response.config.metadata?.startTime
  const endTime = new Date().getTime()
  const duration = startTime ? `${endTime - startTime}ms` : 'N/A'
  return duration
}
