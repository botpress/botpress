import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { constants } from 'http2'
import * as bp from '.botpress'

export type ZapierRequestOptions = {
  timeout?: number
  retries?: number
  retryDelay?: number
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY = 1000

export async function postToZapierWebhook(
  url: string,
  data: unknown,
  logger: bp.Logger,
  options: ZapierRequestOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, retryDelay = DEFAULT_RETRY_DELAY } = options

  const config: AxiosRequestConfig = {
    method: 'POST',
    url,
    data,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: (status) => status >= 200 && status < 500, // Accept 2xx and 4xx, but not 5xx
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios(config)

      if (response.status >= 200 && response.status < 300) {
        return { success: true }
      }

      if (response.status === constants.HTTP_STATUS_GONE) {
        return {
          success: false,
          error: 'WEBHOOK_GONE',
        }
      }

      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: `HTTP_${response.status}`,
        }
      }

      throw new Error(`Server error: ${response.status}`)
    } catch (error) {
      lastError = error as Error

      const isAxiosError = axios.isAxiosError(error)
      const axiosError = error as AxiosError

      if (isAxiosError && axiosError.code === 'ECONNABORTED' && attempt === retries) {
        return {
          success: false,
          error: 'TIMEOUT',
        }
      }

      if (
        isAxiosError &&
        axiosError.response?.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        if (axiosError.response.status === constants.HTTP_STATUS_GONE) {
          return {
            success: false,
            error: 'WEBHOOK_GONE',
          }
        }
        return {
          success: false,
          error: `HTTP_${axiosError.response.status}`,
        }
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt)
        logger
          .forBot()
          .warn(
            `Failed to send request to Zapier webhook (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`,
            {
              url,
              error: lastError.message,
            }
          )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'UNKNOWN_ERROR',
  }
}
