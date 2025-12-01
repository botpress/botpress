import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import { EventMessage, PostHog } from 'posthog-node'
import { PostHogRateLimiter } from './rate-limiter'

export const COMMON_SECRET_NAMES = {
  POSTHOG_KEY: {
    description: 'Posthog key for error dashboards',
  },
} satisfies sdk.IntegrationDefinitionProps['secrets']

type PostHogConfig = {
  key: string
  integrationName: string
}

const getRateLimitConfig = () => {
  const maxEvents = parseInt(process.env.POSTHOG_RATE_LIMIT_MAX_EVENTS || '100', 10)
  const windowMs = parseInt(process.env.POSTHOG_RATE_LIMIT_WINDOW_MS || '60000', 10)
  return { maxEvents, windowMs }
}

const rateLimiter = (() => {
  const { maxEvents, windowMs: windowMsConfig } = getRateLimitConfig()
  const limiter = new PostHogRateLimiter(maxEvents, windowMsConfig)

  setInterval(
    () => {
      limiter.cleanup()
      const now = Date.now()
      for (const [key, windowStart] of burstEventSent.entries()) {
        if (now - windowStart > windowMsConfig * 2) {
          burstEventSent.delete(key)
        }
      }
    },
    5 * 60 * 1000
  )
  return limiter
})()

const burstEventSent: Map<string, number> = new Map()

let posthogClient: PostHog | null = null

function getPostHogClient(key: string): PostHog {
  if (!posthogClient) {
    const { maxEvents, windowMs } = getRateLimitConfig()

    posthogClient = new PostHog(key, {
      host: 'https://us.i.posthog.com',
      flushAt: Math.min(20, maxEvents),
      flushInterval: Math.min(30000, windowMs),
      maxBatchSize: maxEvents,
      maxQueueSize: maxEvents * 2,
      before_send: (event: EventMessage | null): EventMessage | null => {
        if (!event) return null

        const integrationName = (event.properties?.integrationName as string) || 'unknown'
        const distinctId = event.distinctId !== 'no id' ? event.distinctId : integrationName

        if (!rateLimiter.shouldAllow(distinctId)) {
          const windowStart = rateLimiter.getWindowStart(distinctId)
          const suppressedCount = rateLimiter.getSuppressedCount(distinctId)

          const lastBurstTime = burstEventSent.get(distinctId)
          if (!lastBurstTime || windowStart !== lastBurstTime) {
            burstEventSent.set(distinctId, windowStart)

            return {
              distinctId,
              event: 'event_spam_suppressed',
              properties: {
                original_event: event.event,
                actor_key: distinctId,
                suppressed_count: suppressedCount,
                window_start: new Date(windowStart).toISOString(),
                integrationName,
              },
            }
          }

          return null
        }

        return event
      },
    })
  }

  return posthogClient
}

export const sendPosthogEvent = async (props: EventMessage, config: PostHogConfig): Promise<void> => {
  const { key, integrationName } = config
  const client = getPostHogClient(key)

  try {
    // Use capture instead of captureImmediate to benefit from batching
    // The before_send hook will handle rate limiting
    // Add integrationName to properties so before_send can access it
    client.capture({
      distinctId: props.distinctId,
      event: props.event,
      properties: {
        ...props.properties,
        integrationName,
      },
      groups: props.groups,
      sendFeatureFlags: props.sendFeatureFlags,
      timestamp: props.timestamp,
      disableGeoip: props.disableGeoip,
      uuid: props.uuid,
    })
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`Failed to queue PostHog event - Error: ${errMsg}`)
  }
}

export const shutdownImmediate = async (shutdownTimeoutMs?: number): Promise<void> => {
  if (posthogClient) {
    await posthogClient._shutdown(shutdownTimeoutMs)
    posthogClient = null
  }
}

export function wrapIntegration(config: PostHogConfig) {
  return function <T extends { new (...args: any[]): sdk.Integration<any> }>(constructor: T): T {
    return class extends constructor {
      public constructor(...args: any[]) {
        super(...args)
        this.props.register = wrapFunction(this.props.register, config)
        this.props.unregister = wrapFunction(this.props.unregister, config)
        this.props.handler = wrapFunction(wrapHandler(this.props.handler, config), config)

        if (this.props.actions) {
          for (const actionType of Object.keys(this.props.actions)) {
            const actionFn = this.props.actions[actionType]
            if (typeof actionFn === 'function') {
              this.props.actions[actionType] = wrapFunction(actionFn, config)
            }
          }
        }

        if (this.props.channels) {
          for (const channelName of Object.keys(this.props.channels)) {
            const channel = this.props.channels[channelName]
            if (!channel || !channel.messages) continue
            Object.keys(channel.messages).forEach((messageType) => {
              const messageFn = channel.messages[messageType]
              if (typeof messageFn === 'function') {
                channel.messages[messageType] = wrapFunction(messageFn, config)
              }
            })
          }
        }
      }
    }
  }
}

function wrapFunction(fn: Function, config: PostHogConfig) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (thrown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)

      const distinctId = client.isApiError(thrown) ? thrown.id : undefined
      await sendPosthogEvent(
        {
          distinctId: distinctId ?? 'no id',
          event: 'unhandled_error',
          properties: {
            from: fn.name,
            integrationName: config.integrationName,
            errMsg,
          },
        },
        config
      )
      throw thrown
    }
  }
}

const isServerErrorStatus = (status: number): boolean => status >= 500 && status < 600

function wrapHandler(fn: Function, config: PostHogConfig) {
  return async (...args: any[]) => {
    const resp: void | Response = await fn(...args)
    if (resp instanceof Response && isServerErrorStatus(resp.status)) {
      if (!resp.body) {
        await sendPosthogEvent(
          {
            distinctId: 'no id',
            event: 'unhandled_error_empty_body',
            properties: {
              from: fn.name,
              integrationName: config.integrationName,
              errMsg: 'Empty Body',
            },
          },
          config
        )
        return resp
      }
      await sendPosthogEvent(
        {
          distinctId: 'no id',
          event: 'unhandled_error',
          properties: {
            from: fn.name,
            integrationName: config.integrationName,
            errMsg: JSON.stringify(resp.body),
          },
        },
        config
      )
      return resp
    }
    return resp
  }
}
