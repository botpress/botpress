import { IntegrationProps, Integration } from '@botpress/sdk'
import * as Sentry from '@sentry/node'

export const COMMON_SECRET_NAMES = ['SENTRY_DSN', 'SENTRY_ENVIRONMENT', 'SENTRY_RELEASE']

export const init = ({ dsn, environment, release }: { dsn: string; environment: string; release: string }) =>
  Sentry.init({ dsn, environment, release })

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

type ConfigOf<I extends Integration> = I extends Integration<infer TConfig, any, any, any> ? TConfig : never
type ActionsOf<I extends Integration> = I extends Integration<any, infer TActions, any, any> ? TActions : never
type ChannelsOf<I extends Integration> = I extends Integration<any, any, infer TChannels, any> ? TChannels : never
type EventsOf<I extends Integration> = I extends Integration<any, any, any, infer TEvents> ? TEvents : never

type BaseConfig = ConfigOf<Integration>
type BaseActions = ActionsOf<Integration>
type BaseChannels = ChannelsOf<Integration>
type BaseEvents = EventsOf<Integration>

export const wrapIntegration = <
  TConfig extends BaseConfig,
  TActions extends BaseActions,
  TChannels extends BaseChannels,
  TEvents extends BaseEvents
>(
  integration: Integration<TConfig, TActions, TChannels, TEvents>
) => {
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

  const integrationProps: IntegrationProps<TConfig, TActions, TChannels, TEvents> = {
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

  return new Integration<TConfig, TActions, TChannels, TEvents>(integrationProps)
}

function wrapFunction(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (err) {
      Sentry.captureException(err)
      const drained = await Sentry.close()
      if (!drained) {
        // eslint-disable-next-line no-console
        console.error('sentry: failed to drain')
      }
      throw err
    }
  }
}
