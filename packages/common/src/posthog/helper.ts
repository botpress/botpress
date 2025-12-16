import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'

import { EventMessage, PostHog } from 'posthog-node'

export const COMMON_SECRET_NAMES = {
  POSTHOG_KEY: {
    description: 'Posthog key for error dashboards',
  },
} satisfies sdk.IntegrationDefinitionProps['secrets']

export type PostHogConfig = {
  key: string
  integrationName: string
  integrationVersion: string
}

export const sendPosthogEvent = async (props: EventMessage, config: PostHogConfig): Promise<void> => {
  const { key, integrationName, integrationVersion } = config
  const client = new PostHog(key, {
    host: 'https://us.i.posthog.com',
  })
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
  integrationProps.register = wrapFunction(integrationProps.register, config, 'register')
  integrationProps.unregister = wrapFunction(integrationProps.unregister, config, 'unregister')
  integrationProps.handler = wrapFunction(wrapHandler(integrationProps.handler, config), config, 'handler')

  if (integrationProps.actions) {
    for (const actionType of Object.keys(integrationProps.actions)) {
      const actionFn = integrationProps.actions[actionType]
      if (typeof actionFn === 'function') {
        integrationProps.actions[actionType] = wrapFunction(actionFn, config, actionType)
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
          channel.messages[messageType] = wrapFunction(messageFn, config, channelName)
        }
      })
    }
  }
  return new sdk.Integration(integrationProps)
}

function wrapFunction(fn: Function, config: PostHogConfig, functionName: string) {
  return async (...args: any[]) => {
    try {
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
            integrationName: config.integrationName,
            integrationVersion: config.integrationVersion,
            errMsg,
            ...additionalProps,
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
            integrationVersion: config.integrationVersion,
            errMsg: JSON.stringify(resp.body),
            ...additionalProps,
          },
        },
        config
      )
      return resp
    }
    return resp
  }
}
