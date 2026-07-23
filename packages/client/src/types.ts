export type { RetryConfig } from './common/http'

export type Headers = Record<string, string | string[]>

export type ClientConfig = {
  apiUrl: string
  headers: Headers
  withCredentials: boolean
  timeout: number
  debug: boolean
}
