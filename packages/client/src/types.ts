import { IAxiosRetryConfig } from 'axios-retry'

export type Headers = Record<string, string | string[]>

export type RetryConfig = IAxiosRetryConfig

export type ClientConfig = {
  apiUrl: string
  headers: Headers
  withCredentials: boolean
  timeout: number
}
