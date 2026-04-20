import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'

import { EventMessage, PostHog } from 'posthog-node'
import { useBooleanGenerator } from './boolean-generator'

export const COMMON_SECRET_NAMES = {
  POSTHOG_KEY: {
    description: 'Posthog key for error dashboards',
  },
} satisfies sdk.IntegrationDefinitionProps['secrets']

export type PostHogConfig = {
  key: string
  integrationName: string
  integrationVersion: string
  /** A map of function names to their rate limit ratio (0-1 exclusive of 0).
   *  Use '*' as a wildcard key to set a default for all unlisted functions.
   *  Functions not listed (and no '*' key) default to 1 (no rate limiting). */
  rateLimitByFunction?: Record<string, number>
}

type WrapFunctionProps = {
  config: PostHogConfig
  fn: Function
  functionName: string
  functionArea: string
}

const getRateLimitRatio = (config: PostHogConfig, functionName?: string): number => {
  if (functionName && config.rateLimitByFunction?.[functionName] !== undefined) {
    return config.rateLimitByFunction[functionName]
  }
  if (config.rateLimitByFunction?.['*'] !== undefined) {
    return config.rateLimitByFunction['*']
  }
  return 1
}

const createPostHogClient = (key: string, rateLimitRatio: number = 1): PostHog => {
  const shouldAllow = useBooleanGenerator(rateLimitRatio)
  return new PostHog(key, {
    host: 'https://us.i.posthog.com',
    before_send: (event) => {
      return shouldAllow() ? event : null
    },
  })
}

export const sendPosthogEvent = async (
  props: EventMessage,
  config: PostHogConfig,
  functionName?: string
): Promise<void> => {
  const { key, integrationName, integrationVersion } = config
  const rateLimitRatio = getRateLimitRatio(config, functionName)
  const client = createPostHogClient(key, rateLimitRatio)
  try {
    const signedProps: EventMessage = {
      ...props,
      properties: {
        ...props.properties,
        integrationName,
        integrationVersion,
      },
    }
    await client.captureImmediate(signedProps)
    await client.shutdown()
    console.info('PostHog event sent')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}

export function wrapIntegration(config: PostHogConfig, integrationProps: sdk.IntegrationProps<any>) {
  integrationProps.register = wrapFunction({
    fn: integrationProps.register,
    config,
    functionName: 'register',
    functionArea: 'registration',
  })
  integrationProps.unregister = wrapFunction({
    fn: integrationProps.unregister,
    config,
    functionName: 'unregister',
    functionArea: 'registration',
  })
  integrationProps.handler = wrapFunction({
    fn: wrapHandler(integrationProps.handler, config),
    config,
    functionName: 'handler',
    functionArea: 'handler',
  })

  if (integrationProps.actions) {
    for (const actionType of Object.keys(integrationProps.actions)) {
      const actionFn = integrationProps.actions[actionType]
      if (typeof actionFn === 'function') {
        integrationProps.actions[actionType] = wrapFunction({
          fn: actionFn,
          config,
          functionName: actionType,
          functionArea: 'actions',
        })
      }
    }
  }

  if (integrationProps.channels) {
    for (const channelName of Object.keys(integrationProps.channels)) {
      const channel = integrationProps.channels[channelName]
      if (!channel || !channel.messages) continue
      Object.keys(channel.messages).forEach((messageType) => {
        const messageFn = channel.messages[messageType]
        if (typeof messageFn === 'function') {
          channel.messages[messageType] = wrapFunction({
            fn: messageFn,
            config,
            functionName: channelName,
            functionArea: 'channels',
          })
        }
      })
    }
  }
  return new sdk.Integration(integrationProps)
}

function wrapFunction(props: WrapFunctionProps) {
  const { config, fn, functionArea, functionName } = props
  return async (...args: any[]) => {
    try {
      await sendPosthogEvent(
        {
          distinctId: `${config.integrationName}_${config.integrationVersion}`,
          event: `${config.integrationName}_${functionName}`, // e.g. "gmail_registered"
          properties: {
            from: functionName,
            area: functionArea,
            integrationName: config.integrationName,
            integrationVersion: config.integrationVersion,
          },
        },
        config,
        functionName
      )

      return await fn(...args)
    } catch (thrown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      const distinctId = client.isApiError(thrown) ? thrown.id : undefined
      const additionalProps = {
        configurationType: args[0]?.ctx?.configurationType,
        integrationId: args[0]?.ctx?.integrationId,
      }

      await sendPosthogEvent(
        {
          distinctId: distinctId ?? 'no id',
          event: 'unhandled_error',
          properties: {
            from: functionName,
            area: functionArea,
            integrationName: config.integrationName,
            integrationVersion: config.integrationVersion,
            errMsg,
            ...additionalProps,
          },
        },
        config,
        functionName
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
      const additionalProps = {
        configurationType: args[0]?.ctx?.configurationType,
        integrationId: args[0]?.ctx?.integrationId,
      }

      if (!resp.body) {
        await sendPosthogEvent(
          {
            distinctId: 'no id',
            event: 'unhandled_error_empty_body',
            properties: {
              from: fn.name,
              integrationName: config.integrationName,
              integrationVersion: config.integrationVersion,
              errMsg: 'Empty Body',
              ...additionalProps,
            },
          },
          config,
          'handler'
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
            integrationVersion: config.integrationVersion,
            errMsg: JSON.stringify(resp.body),
            ...additionalProps,
          },
        },
        config,
        'handler'
      )
      return resp
    }
    return resp
  }
}
