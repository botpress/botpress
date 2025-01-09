import { IntegrationProps, Integration, IntegrationDefinitionProps } from '@botpress/sdk'
import * as Sentry from '@sentry/node'

export const COMMON_SECRET_NAMES = {
  SENTRY_DSN: {
    optional: true,
    description: 'Sentry DSN',
  },
  SENTRY_ENVIRONMENT: {
    optional: true,
    description: 'Sentry environment',
  },
  SENTRY_RELEASE: {
    optional: true,
    description: 'Sentry release',
  },
} satisfies IntegrationDefinitionProps['secrets']

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

type Tof<I extends Integration> = I extends Integration<infer T> ? T : never

export type SentryConfig = Partial<{
  dsn: string
  environment: string
  release: string
}>

export const wrapIntegration = <T extends Tof<Integration>>(integration: Integration<T>, config: SentryConfig) => {
  if (!config.dsn || !config.environment || !config.release) {
    return integration
  }

  Sentry.init(config)

  type ActionFunctions = typeof integration.props.actions
  const actionsEntries: Entries<ActionFunctions> = Object.entries(integration.props.actions)
  const actions = actionsEntries.reduce((acc, [actionType, action]) => {
    acc[actionType] = wrapFunction(action)
    return acc
  }, {} as ActionFunctions)

  type ChannelFunctions = typeof integration.props.channels
  const channelEntries: Entries<ChannelFunctions> = Object.entries(integration.props.channels)
  const channels = channelEntries.reduce((acc, [channelName, channel]) => {
    type Messages = typeof channel.messages
    const messageEntries: Entries<Messages> = Object.entries(channel.messages)
    const messages = messageEntries.reduce((messagesAcc, [messageType, messageFunc]) => {
      messagesAcc[messageType] = wrapFunction(messageFunc)
      return messagesAcc
    }, {} as Messages)
    acc[channelName] = { messages }
    return acc
  }, {} as ChannelFunctions)

  const integrationProps: IntegrationProps<T> = {
    register: wrapFunction(integration.props.register),
    unregister: wrapFunction(integration.props.unregister),
    handler: wrapFunction(integration.props.handler),
    actions,
    channels,
  }

  if (integration.props.createUser) {
    integrationProps.createUser = wrapFunction(integration.props.createUser)
  }

  if (integration.props.createConversation) {
    integrationProps.createConversation = wrapFunction(integration.props.createConversation)
  }

  return new Integration<T>(integrationProps)
}

function wrapFunction(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (err) {
      Sentry.captureException(err)
      const drained = await Sentry.close()
      if (!drained) {
        console.error('sentry: failed to drain')
      }
      throw err
    }
  }
}
