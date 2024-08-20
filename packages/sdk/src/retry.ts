import { RetryConfig } from '@botpress/client'

export const retryConfig: RetryConfig = {
  retries: 3,
  retryCondition: ({ response }) => response?.status !== undefined && [429, 502].includes(response?.status),
  retryDelay: (retryCount) => retryCount * 1000,
}
