import { Client, RuntimeError, type Conversation, type Message, type User } from '@botpress/client'
import { Request, Response, parseBody } from '../serve'
import { Cast, Merge } from '../type-utils'
import { IntegrationSpecificClient } from './client'
import { ToTags } from './client/types'
import { extractContext, type IntegrationContext } from './context'
import { BaseIntegration } from './generic'
import { IntegrationLogger, integrationLogger } from './logger'

type PrefixConfig<TIntegration extends BaseIntegration> = { enforcePrefix: TIntegration['name'] }

type CommonArgs<TIntegration extends BaseIntegration> = {
  ctx: IntegrationContext<TIntegration['configuration']>
  client: IntegrationSpecificClient<TIntegration>
  logger: IntegrationLogger
}

type RegisterPayload = { webhookUrl: string }
type RegisterArgs<TIntegration extends BaseIntegration> = CommonArgs<TIntegration> & RegisterPayload

type UnregisterPayload = { webhookUrl: string }
type UnregisterArgs<TIntegration extends BaseIntegration> = CommonArgs<TIntegration> & UnregisterPayload

type WebhookPayload = { req: Request }
type WebhookArgs<TIntegration extends BaseIntegration> = CommonArgs<TIntegration> & WebhookPayload

type ActionPayload<T extends string, I> = { type: T; input: I }
type ActionArgs<TIntegration extends BaseIntegration, T extends string, I> = CommonArgs<TIntegration> &
  ActionPayload<T, I>

type CreateUserPayload<TIntegration extends BaseIntegration> = {
  tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
}
type CreateUserArgs<TIntegration extends BaseIntegration> = CommonArgs<TIntegration> & CreateUserPayload<TIntegration>

type CreateConversationPayload<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'] = keyof TIntegration['channels']
> = {
  channel: TChannel
  tags: ToTags<keyof TIntegration['channels'][TChannel]['conversation']['tags'], PrefixConfig<TIntegration>>
}
type CreateConversationArgs<TIntegration extends BaseIntegration> = CommonArgs<TIntegration> &
  CreateConversationPayload<TIntegration>

type MessagePayload<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
> = {
  type: TMessage
  payload: TIntegration['channels'][TChannel]['messages'][TMessage]
  conversation: Merge<
    Conversation,
    {
      tags: ToTags<keyof TIntegration['channels'][TChannel]['conversation']['tags'], PrefixConfig<TIntegration>>
    }
  >
  message: Merge<
    Message,
    {
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags'], PrefixConfig<TIntegration>>
    }
  >
  user: Merge<
    User,
    {
      tags: ToTags<keyof TIntegration['user']['tags'], PrefixConfig<TIntegration>>
    }
  >
}
type MessageArgs<
  TIntegration extends BaseIntegration,
  TChannel extends keyof TIntegration['channels'],
  TMessage extends keyof TIntegration['channels'][TChannel]['messages']
> = CommonArgs<TIntegration> &
  MessagePayload<TIntegration, TChannel, TMessage> & {
    ack: (props: {
      tags: ToTags<keyof TIntegration['channels'][TChannel]['message']['tags'], PrefixConfig<TIntegration>>
    }) => Promise<void>
  }

export type RegisterFunction<TIntegration extends BaseIntegration> = (
  props: RegisterArgs<TIntegration>
) => Promise<void>

export type UnregisterFunction<TIntegration extends BaseIntegration> = (
  props: UnregisterArgs<TIntegration>
) => Promise<void>

export type WebhookFunction<TIntegration extends BaseIntegration> = (
  props: WebhookArgs<TIntegration>
) => Promise<Response | void>

export type ActionFunctions<TIntegration extends BaseIntegration> = {
  [ActionType in keyof TIntegration['actions']]: (
    props: ActionArgs<TIntegration, Cast<ActionType, string>, TIntegration['actions'][ActionType]['input']>
  ) => Promise<TIntegration['actions'][ActionType]['output']>
}

export type CreateUserFunction<TIntegration extends BaseIntegration> = (
  props: CreateUserArgs<TIntegration>
) => Promise<Response | void>

export type CreateConversationFunction<TIntegration extends BaseIntegration> = (
  props: CreateConversationArgs<TIntegration>
) => Promise<Response | void>

export type ChannelFunctions<TIntegration extends BaseIntegration> = {
  [ChannelName in keyof TIntegration['channels']]: {
    messages: {
      [MessageType in keyof TIntegration['channels'][ChannelName]['messages']]: (
        props: CommonArgs<TIntegration> & MessageArgs<TIntegration, ChannelName, MessageType>
      ) => Promise<void>
    }
  }
}

export type IntegrationHandlers<TIntegration extends BaseIntegration> = {
  register: RegisterFunction<TIntegration>
  unregister: UnregisterFunction<TIntegration>
  webhook: WebhookFunction<TIntegration>
  createUser?: CreateUserFunction<TIntegration>
  createConversation?: CreateConversationFunction<TIntegration>
  actions: ActionFunctions<TIntegration>
  channels: ChannelFunctions<TIntegration>
}

type ServerProps<TIntegration extends BaseIntegration> = CommonArgs<TIntegration> & {
  req: Request
  instance: IntegrationHandlers<TIntegration>
}

export const integrationHandler =
  <TIntegration extends BaseIntegration>(instance: IntegrationHandlers<TIntegration>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    const client = new IntegrationSpecificClient<TIntegration>(
      new Client({ botId: ctx.botId, integrationId: ctx.integrationId })
    )

    const props = {
      ctx,
      req,
      client,
      logger: integrationLogger,
      instance,
    }

    try {
      let response: Response | void
      switch (ctx.operation) {
        case 'webhook_received':
          response = await onWebhook<TIntegration>(props)
          break
        case 'register':
          response = await onRegister<TIntegration>(props)
          break
        case 'unregister':
          response = await onUnregister<TIntegration>(props)
          break
        case 'message_created':
          response = await onMessageCreated<TIntegration>(props)
          break
        case 'action_triggered':
          response = await onActionTriggered<TIntegration>(props)
          break
        case 'ping':
          response = await onPing<TIntegration>(props)
          break
        case 'create_user':
          response = await onCreateUser<TIntegration>(props)
          break
        case 'create_conversation':
          response = await onCreateConversation<TIntegration>(props)
          break
        default:
          throw new Error(`Unknown operation ${ctx.operation}`)
      }
      return response ? { ...response, status: response.status ?? 200 } : { status: 200 }
    } catch (e) {
      if (e instanceof RuntimeError) {
        return { status: e.code, body: JSON.stringify(e.toJSON()) }
      } else {
        throw e
      }
    }
  }

const onPing = async <TIntegration extends BaseIntegration>(_: ServerProps<TIntegration>) => {}

const onWebhook = async <TIntegration extends BaseIntegration>({
  client,
  ctx,
  req: incomingRequest,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  const { req } = parseBody<WebhookPayload>(incomingRequest)
  return instance.webhook({ client, ctx, req, logger })
}

const onRegister = async <TIntegration extends BaseIntegration>({
  client,
  ctx,
  req,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  if (!instance.register) {
    return
  }
  const { webhookUrl } = parseBody<RegisterPayload>(req)
  await instance.register({ client, ctx, webhookUrl, logger })
}

const onUnregister = async <TIntegration extends BaseIntegration>({
  client,
  ctx,
  req,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  if (!instance.unregister) {
    return
  }
  const { webhookUrl } = parseBody<UnregisterPayload>(req)
  await instance.unregister({ ctx, webhookUrl, client, logger })
}

const onCreateUser = async <TIntegration extends BaseIntegration>({
  client,
  ctx,
  req,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  if (!instance.createUser) {
    return
  }
  const { tags } = parseBody<CreateUserPayload<TIntegration>>(req)
  return await instance.createUser({ ctx, client, tags, logger })
}

const onCreateConversation = async <TIntegration extends BaseIntegration>({
  client,
  ctx,
  req,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  if (!instance.createConversation) {
    return
  }
  const { channel, tags } = parseBody<CreateConversationPayload<TIntegration>>(req)
  return await instance.createConversation({ ctx, client, channel, tags, logger })
}

const onMessageCreated = async <TIntegration extends BaseIntegration>({
  ctx,
  req,
  client,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  const { conversation, user, type, payload, message } = parseBody<MessagePayload<TIntegration, string, string>>(req)

  const channelHandler = instance.channels[conversation.channel]

  if (!channelHandler) {
    throw new Error(`Channel ${conversation.channel} not found`)
  }

  const messageHandler = channelHandler.messages[type]

  if (!messageHandler) {
    throw new Error(`Message of type ${type} not found in channel ${conversation.channel}`)
  }

  const ack = async ({ tags }: { tags: Record<string, string> }) => {
    await client.updateMessage({
      id: message.id,
      tags: tags as any, // TODO: fix this
    })
  }

  await messageHandler({ ctx, conversation, message, user, type, client, payload, ack, logger })
}

const onActionTriggered = async <TIntegration extends BaseIntegration>({
  req,
  ctx,
  client,
  logger,
  instance,
}: ServerProps<TIntegration>) => {
  const { input, type } = parseBody<ActionPayload<string, any>>(req)

  if (!type) {
    throw new Error('Missing action type')
  }

  const action = instance.actions[type]

  if (!action) {
    throw new Error(`Action ${type} not found`)
  }

  const output = await action({ ctx, input, client, type, logger })

  return {
    body: JSON.stringify({ output }),
  }
}
