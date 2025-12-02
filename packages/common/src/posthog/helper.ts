import * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'

import { EventMessage, PostHog } from 'posthog-node'

export const COMMON_SECRET_NAMES = {
  POSTHOG_KEY: {
    description: 'Posthog key for error dashboards',
  },
} satisfies sdk.IntegrationDefinitionProps['secrets']


// Extract props type from any integration handler function
type HandlerProps =
  | Parameters<sdk.IntegrationProps<any>['register']>[0]
  | Parameters<sdk.IntegrationProps<any>['unregister']>[0]
  | Parameters<sdk.IntegrationProps<any>['handler']>[0]
  | Parameters<sdk.IntegrationProps<any>['actions'][string]>[0]
  | Parameters<sdk.IntegrationProps<any>['channels'][string]['messages'][string]>[0]

type AdditionalProperties = (props?: HandlerProps) => Record<string, any>

type PostHogConfig = {
  key: string
  integrationName: string
  integrationVersion: string
  additionalProperties?: AdditionalProperties
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

export function wrapIntegration(config: PostHogConfig) {
  return function <T extends { new (...args: any[]): sdk.Integration<any> }>(constructor: T): T {
    return class extends constructor {
      public constructor(...args: any[]) {
        super(...args)
        const additionalProperties = config.additionalProperties
        this.props.register = wrapFunction(this.props.register, config, additionalProperties)
        this.props.unregister = wrapFunction(this.props.unregister, config, additionalProperties)
        this.props.handler = wrapFunction(wrapHandler(this.props.handler, config, additionalProperties), config, additionalProperties)

        if (this.props.actions) {
          for (const actionType of Object.keys(this.props.actions)) {
            const actionFn = this.props.actions[actionType]
            if (typeof actionFn === 'function') {
              this.props.actions[actionType] = wrapFunction(actionFn, config, additionalProperties)
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
                channel.messages[messageType] = wrapFunction(messageFn, config, additionalProperties)
              }
            })
          }
        }
      }
    }
  }
}

function wrapFunction(fn: Function, config: PostHogConfig, additionalProperties?: AdditionalProperties) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (thrown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      const distinctId = client.isApiError(thrown) ? thrown.id : undefined

      let additionalProps: Record<string, any> = {}
      if (additionalProperties) {
        additionalProps = additionalProperties(args[0])
      }

      await sendPosthogEvent(
        {
          distinctId: distinctId ?? 'no id',
          event: 'unhandled_error',
          properties: {
            from: fn.name,
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

function wrapHandler(fn: Function, config: PostHogConfig, additionalProperties?: AdditionalProperties) {
  return async (...args: any[]) => {
    const resp: void | Response = await fn(...args)
    if (resp instanceof Response && isServerErrorStatus(resp.status)) {
      let additionalProps: Record<string, any> = {}
      if (additionalProperties) {
        additionalProps = additionalProperties(args[0])
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
