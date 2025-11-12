import * as sdk from '@botpress/sdk'
import { EventMessage, PostHog } from 'posthog-node'
import { botpressEvents, BotpressEvent } from './events'

export const COMMON_SECRET_NAMES = {
  POSTHOG_KEY: {
    description: 'Posthog key for error dashboards',
  },
} satisfies sdk.IntegrationDefinitionProps['secrets']

type BotpressEventMessage = Omit<EventMessage, 'event'> & {
  event: BotpressEvent
}

type PostHogConfig = {
  key: string
  integrationName: string
}

export const sendPosthogEvent = async (props: BotpressEventMessage, config: PostHogConfig): Promise<void> => {
  const { key, integrationName } = config
  const client = new PostHog(key, {
    host: 'https://us.i.posthog.com',
  })
  try {
    const signedProps: BotpressEventMessage = {
      ...props,
      properties: {
        ...props.properties,
        integrationName,
      },
    }
    await client.captureImmediate(signedProps)
    await client.shutdown()
    console.info('PostHog event sent')
  } catch (thrown: any) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    console.error(`The server for posthog could not be reached - Error: ${errMsg}`)
  }
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

type Tof<I extends sdk.Integration> = I extends sdk.Integration<infer T> ? T : never

export const wrapIntegration = <T extends Tof<sdk.Integration>>(
  integration: sdk.Integration<T>,
  config: PostHogConfig
) => {
  type ActionFunctions = typeof integration.props.actions
  const actionsEntries: Entries<ActionFunctions> = Object.entries(integration.props.actions)
  const actions = actionsEntries.reduce((acc, [actionType, action]) => {
    acc[actionType] = wrapFunction(action, config)
    return acc
  }, {} as ActionFunctions)

  type ChannelFunctions = typeof integration.props.channels
  const channelEntries: Entries<ChannelFunctions> = Object.entries(integration.props.channels)
  const channels = channelEntries.reduce((acc, [channelName, channel]) => {
    type Messages = typeof channel.messages
    const messageEntries: Entries<Messages> = Object.entries(channel.messages)
    const messages = messageEntries.reduce((messagesAcc, [messageType, messageFunc]) => {
      messagesAcc[messageType] = wrapFunction(messageFunc, config)
      return messagesAcc
    }, {} as Messages)
    acc[channelName] = { messages }
    return acc
  }, {} as ChannelFunctions)

  const integrationProps: sdk.IntegrationProps<T> = {
    register: wrapFunction(integration.props.register, config),
    unregister: wrapFunction(integration.props.unregister, config),
    handler: wrapFunction(integration.props.handler, config),
    actions,
    channels,
  }

  return new sdk.Integration<T>(integrationProps)
}

function wrapFunction(fn: Function, config: PostHogConfig) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (thrown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      await sendPosthogEvent(
        {
          distinctId: errMsg,
          event: botpressEvents.UNHANDLED_ERROR,
          properties: {
            from: fn.name,
            integrationName: config.integrationName,
          },
        },
        config
      )
    }
  }
}
