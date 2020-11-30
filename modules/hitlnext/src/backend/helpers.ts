import crypto from 'crypto'
import { ValidationError } from 'joi'
import _ from 'lodash'
import { performance, PerformanceObserver, PerformanceObserverCallback } from 'perf_hooks'

import Repository from './repository'

export const makeAgentId = (strategy: string, email: string): string => {
  return crypto
    .createHash('md5')
    .update([strategy, email].filter(Boolean).join('-'))
    .digest('hex')
}

export const formatValidationError = (validation: ValidationError) => {
  return _.map(validation.details, 'message').join(', ')
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

  observer.disconnect()

  return value
}

export const extendAgentSession = async (repository: Repository, realtime: any, botId: string, agentId: string) => {
  return repository.setAgentOnline(botId, agentId, async () => {
    // By now the agent *should* be offline, but we check nonetheless
    const online = await repository.getAgentOnline(botId, agentId)
    const payload = {
      online
    }

    realtime.sendPayload(botId, {
      resource: 'agent',
      type: 'update',
      id: agentId,
      payload
    })
  })
}
