import crypto from 'crypto'
import { Response } from 'express'
import { performance, PerformanceObserver, PerformanceObserverCallback } from 'perf_hooks'

import { ResponseError } from './errors'

export const makeAgentId = (strategy: string, email: string): string => {
  return crypto
    .createHash('md5')
    .update([strategy, email].filter(Boolean).join('-'))
    .digest('hex')
}

export const formatError = (res: Response, error: ResponseError) => {
  res.status(error.statusCode)
  res.json({
    errors: error.messages
  })
}

// Measures the execution time of an async function
export const measure = async <T>(
  namespace: string,
  promise: Promise<T>,
  callback: PerformanceObserverCallback
): Promise<T> => {
  const observer = new PerformanceObserver(callback)
  observer.observe({ entryTypes: ['measure'], buffered: true })

  performance.mark(`${namespace}-start`)

  const value = await promise

  performance.mark(`${namespace}-end`)
  performance.measure(namespace, `${namespace}-start`, `${namespace}-end`)

  return value
}
