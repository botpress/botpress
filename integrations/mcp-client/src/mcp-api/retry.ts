const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export type RetryOptions = {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

export const withRetry = async <T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> => {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | undefined
  let delay = opts.initialDelayMs

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === opts.maxAttempts) {
        break
      }

      if (!isRetryableError(lastError)) {
        break
      }

      await sleep(delay)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs)
    }
  }

  throw lastError
}

const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase()

  // Network/connection errors are retryable
  const retryablePatterns = [
    'econnrefused',
    'econnreset',
    'etimedout',
    'socket hang up',
    'network',
    'timeout',
    'temporarily unavailable',
    '503',
    '502',
    '504',
  ]

  // Auth/validation errors should not be retried
  const nonRetryablePatterns = ['401', '403', 'unauthorized', 'forbidden', 'invalid', 'not found', '404']

  if (nonRetryablePatterns.some((pattern) => message.includes(pattern))) {
    return false
  }

  return retryablePatterns.some((pattern) => message.includes(pattern))
}
