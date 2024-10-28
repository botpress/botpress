import { isApiError, Client, RuntimeError } from '@botpress/client'
import { retryConfig } from '../../retry'
import { Request, Response, parseBody } from '../../serve'
import { IntegrationSpecificClient } from '../client'
import { BaseIntegration } from '../types'
import { ActionMetadataStore } from './action-metadata'
import { extractContext } from './context'
import { integrationLogger } from './logger'
import {
  CommonHandlerProps,
  IntegrationHandlers,
  WebhookPayload,
  ActionPayload,
  MessagePayload,
  RegisterPayload,
  CreateUserPayload,
  UnregisterPayload,
  CreateConversationPayload,
  IntegrationContext,
} from './types'

export * from './types'

type ServerProps<TIntegration extends BaseIntegration> = CommonHandlerProps<TIntegration> & {
  req: Request
  instance: IntegrationHandlers<TIntegration>
}

export const integrationHandler =
  <TIntegration extends BaseIntegration>(instance: IntegrationHandlers<TIntegration>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers) as IntegrationContext<TIntegration>

    const vanillaClient = new Client({
      botId: ctx.botId,
      integrationId: ctx.integrationId,
      retry: retryConfig,
    })
    const client = new IntegrationSpecificClient<TIntegration>(vanillaClient)

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
    } catch (thrown) {
      if (isApiError(thrown)) {
        const runtimeError = new RuntimeError(thrown.message, thrown)
        integrationLogger.forBot().error(runtimeError.message)

        return { status: runtimeError.code, body: JSON.stringify(runtimeError.toJSON()) }
      }

      // prints the error in the integration logs
      console.error(thrown)

      const runtimeError = new RuntimeError(
        'An unexpected error occurred in the integration. Bot owners: Check logs for more informations. Integration owners: throw a RuntimeError to return a custom error message instead.'
      )
      integrationLogger.forBot().error(runtimeError.message)
      return { status: runtimeError.code, body: JSON.stringify(runtimeError.toJSON()) }
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

  type UpdateMessageProps = Parameters<(typeof client)['updateMessage']>[0]
  const ack = async ({ tags }: Pick<UpdateMessageProps, 'tags'>) => {
    await client.updateMessage({
      id: message.id,
      tags,
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

  const metadata = new ActionMetadataStore()
  const output = await action({ ctx, input, client, type, logger, metadata })

  const response = { output, meta: metadata.toJSON() }
  return {
    body: JSON.stringify(response),
  }
}
