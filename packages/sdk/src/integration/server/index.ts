import { isApiError, Client, RuntimeError } from '@botpress/client'
import { retryConfig } from '../../retry'
import { Request, Response, parseBody } from '../../serve'
import { IntegrationSpecificClient } from '../client'
import { BaseIntegration } from '../types'
import { ActionMetadataStore } from './action-metadata'
import { extractContext } from './context'
import { IntegrationLogger } from './integration-logger'
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
} from './types'

export * from './types'
export * from './integration-logger'

type ServerProps = CommonHandlerProps<BaseIntegration> & {
  req: Request
  instance: IntegrationHandlers<BaseIntegration>
}

export const integrationHandler =
  (instance: IntegrationHandlers<BaseIntegration>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    const vanillaClient = new Client({
      botId: ctx.botId,
      integrationId: ctx.integrationId,
      retry: retryConfig,
    })
    const client = new IntegrationSpecificClient<BaseIntegration>(vanillaClient)
    const logger = new IntegrationLogger()

    const props = {
      ctx,
      req,
      client,
      logger,
      instance,
    }

    try {
      let response: Response | void
      switch (ctx.operation) {
        case 'webhook_received':
          response = await onWebhook(props)
          break
        case 'register':
          response = await onRegister(props)
          break
        case 'unregister':
          response = await onUnregister(props)
          break
        case 'message_created':
          response = await onMessageCreated(props)
          break
        case 'action_triggered':
          response = await onActionTriggered(props)
          break
        case 'ping':
          response = await onPing(props)
          break
        case 'create_user':
          response = await onCreateUser(props)
          break
        case 'create_conversation':
          response = await onCreateConversation(props)
          break
        default:
          throw new Error(`Unknown operation ${ctx.operation}`)
      }
      return response ? { ...response, status: response.status ?? 200 } : { status: 200 }
    } catch (error) {
      if (isApiError(error)) {
        const runtimeError = error.type === 'Runtime' ? error : new RuntimeError(error.message, error)
        logger.forBot().error(runtimeError.message)

        return { status: runtimeError.code, body: JSON.stringify(runtimeError.toJSON()) }
      }

      // prints the error in the integration logs
      console.error(error)

      const runtimeError = new RuntimeError(
        'An unexpected error occurred in the integration. Bot owners: Check logs for more informations. Integration owners: throw a RuntimeError to return a custom error message instead.'
      )
      logger.forBot().error(runtimeError.message)
      return { status: runtimeError.code, body: JSON.stringify(runtimeError.toJSON()) }
    }
  }

const onPing = async (_: ServerProps) => {}

const onWebhook = async ({ client, ctx, req: incomingRequest, logger, instance }: ServerProps) => {
  const { req } = parseBody<WebhookPayload>(incomingRequest)
  return instance.webhook({ client, ctx, req, logger })
}

const onRegister = async ({ client, ctx, req, logger, instance }: ServerProps) => {
  if (!instance.register) {
    return
  }
  const { webhookUrl } = parseBody<RegisterPayload>(req)
  await instance.register({ client, ctx, webhookUrl, logger })
}

const onUnregister = async ({ client, ctx, req, logger, instance }: ServerProps) => {
  if (!instance.unregister) {
    return
  }
  const { webhookUrl } = parseBody<UnregisterPayload>(req)
  await instance.unregister({ ctx, webhookUrl, client, logger })
}

const onCreateUser = async ({ client, ctx, req, logger, instance }: ServerProps) => {
  if (!instance.createUser) {
    return
  }
  const { tags } = parseBody<CreateUserPayload<BaseIntegration>>(req)
  return await instance.createUser({ ctx, client, tags, logger })
}

const onCreateConversation = async ({ client, ctx, req, logger, instance }: ServerProps) => {
  if (!instance.createConversation) {
    return
  }
  const { channel, tags } = parseBody<CreateConversationPayload<BaseIntegration>>(req)
  return await instance.createConversation({ ctx, client, channel, tags, logger })
}

const onMessageCreated = async ({ ctx, req, client, logger, instance }: ServerProps) => {
  const { conversation, user, type, payload, message } = parseBody<MessagePayload<BaseIntegration, string, string>>(req)

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

const onActionTriggered = async ({ req, ctx, client, logger, instance }: ServerProps) => {
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
