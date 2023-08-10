import { Client, Conversation, Message, User, RuntimeError } from '@botpress/client'

import {
  botIdHeader,
  botUserIdHeader,
  configurationHeader,
  integrationIdHeader,
  operationHeader,
  webhookIdHeader,
} from '../const'
import { Request, Response, serve } from '../serve'
import { IntegrationContext, integrationOperationSchema } from './context'
import type {
  ActionPayload,
  CreateConversationPayload,
  CreateUserPayload,
  IntegrationImplementationProps,
  RegisterPayload,
  UnregisterPayload,
  WebhookPayload,
} from './implementation'
import { IntegrationLogger, integrationLogger } from './logger'

type OperationHandlerProps = {
  integration: IntegrationImplementationProps
  ctx: IntegrationContext
  req: Request
  client: Client
  logger: IntegrationLogger
}

export const serveIntegration = async (integration: IntegrationImplementationProps, port = 6853) => {
  await serve(integrationHandler(integration), port)
}

export const integrationHandler =
  (integration: IntegrationImplementationProps) =>
  // eslint-disable-next-line complexity
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)
    const client = new Client({ botId: ctx.botId, integrationId: ctx.integrationId })

    const props: OperationHandlerProps = {
      integration,
      ctx,
      req,
      client,
      logger: integrationLogger,
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
    } catch (e) {
      if (e instanceof RuntimeError) {
        return { status: e.code, body: JSON.stringify(e.toJSON()) }
      } else {
        throw e
      }
    }
  }

function extractContext(headers: Record<string, string | undefined>): IntegrationContext {
  const botId = headers[botIdHeader]
  const botUserId = headers[botUserIdHeader]
  const integrationId = headers[integrationIdHeader]
  const webhookId = headers[webhookIdHeader]
  const base64Configuration = headers[configurationHeader]
  const operation = integrationOperationSchema.parse(headers[operationHeader])

  if (!botId) {
    throw new Error('Missing bot headers')
  }

  if (!botUserId) {
    throw new Error('Missing bot user headers')
  }

  if (!integrationId) {
    throw new Error('Missing integration headers')
  }

  if (!webhookId) {
    throw new Error('Missing webhook headers')
  }

  if (!base64Configuration) {
    throw new Error('Missing configuration headers')
  }

  if (!operation) {
    throw new Error('Missing operation headers')
  }

  return {
    botId,
    botUserId,
    integrationId,
    webhookId,
    operation,
    configuration: base64Configuration ? JSON.parse(Buffer.from(base64Configuration, 'base64').toString('utf-8')) : {},
  }
}

function parseBody<T>(req: Request): T {
  if (!req.body) {
    throw new Error('Missing body')
  }

  return JSON.parse(req.body)
}

// TODO implement the ping operation once the signature is defined
async function onPing(_: OperationHandlerProps) {}

async function onWebhook({ client, ctx, integration, req: incomingRequest, logger }: OperationHandlerProps) {
  const { req } = parseBody<WebhookPayload>(incomingRequest)
  return integration.handler({ client, ctx, req, logger })
}

async function onRegister({ client, ctx, integration, req, logger }: OperationHandlerProps) {
  if (!integration.register) {
    return
  }

  const { webhookUrl } = parseBody<RegisterPayload>(req)

  await integration.register({ client, ctx, webhookUrl, logger })
}

async function onUnregister({ client, ctx, integration, req, logger }: OperationHandlerProps) {
  if (!integration.unregister) {
    return
  }

  const { webhookUrl } = parseBody<UnregisterPayload>(req)

  await integration.unregister({ ctx, webhookUrl, client, logger })
}

async function onCreateUser({ client, ctx, integration, req, logger }: OperationHandlerProps) {
  if (!integration.createUser) {
    return
  }

  const { tags } = parseBody<CreateUserPayload>(req)

  return await integration.createUser({ ctx, client, tags, logger })
}

async function onCreateConversation({ client, ctx, integration, req, logger }: OperationHandlerProps) {
  if (!integration.createConversation) {
    return
  }

  const { channel, tags } = parseBody<CreateConversationPayload>(req)

  return await integration.createConversation({ ctx, client, channel, tags, logger })
}

export type MessageCreatedPayload = {
  conversation: Conversation
  user: User
  message: Message
  payload: any
  type: string
}

async function onMessageCreated({ ctx, integration, req, client, logger }: OperationHandlerProps) {
  const { conversation, user, type, payload, message } = parseBody<MessageCreatedPayload>(req)

  const channelHandler = integration.channels[conversation.channel]

  if (!channelHandler) {
    throw new Error(`Channel ${conversation.channel} not found`)
  }

  const messageHandler = channelHandler.messages[type]

  if (!messageHandler) {
    throw new Error(`Message of type ${type} not found in channel ${conversation.channel}`)
  }

  const ack = async ({ tags }: { tags: { [key: string]: string } }) => {
    await client.updateMessage({
      id: message.id,
      tags,
    })
  }

  await messageHandler({ ctx, conversation, message, user, type, client, payload, ack, logger })
}

async function onActionTriggered({ req, integration, ctx, client, logger }: OperationHandlerProps) {
  const { input, type } = parseBody<ActionPayload<string, any>>(req)

  if (!type) {
    throw new Error('Missing action type')
  }

  const action = integration.actions[type]

  if (!action) {
    throw new Error(`Action ${type} not found`)
  }

  const output = await action({ ctx, input, client, type, logger })

  return {
    body: JSON.stringify({ output }),
  }
}
