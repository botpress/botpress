import { Client, Event } from '@botpress/client'
import { botIdHeader, configurationHeader, operationHeader, typeHeader } from '../const'
import { log } from '../log'
import type { Handler, Request, Response } from '../serve'
import { BotContext, botOperationSchema } from './context'
import type { BotState } from './state'

type EventReceivedBotPayload = {
  event: Event
}

type OperationHandlerProps = {
  botState: BotState
  ctx: BotContext
  client: Client
  req: Request
}

export const createBotHandler =
  (botState: BotState): Handler =>
  async (req: Request): Promise<Response> => {
    const ctx = extractContext(req.headers)

    if (ctx.operation !== 'ping') {
      log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
    }

    const client = new Client({ botId: ctx.botId })

    const props: OperationHandlerProps = {
      req,
      botState,
      ctx,
      client,
    }

    switch (ctx.operation) {
      case 'event_received':
        await onEventReceived(props)
        break
      case 'register':
        await onRegister(props)
        break
      case 'unregister':
        await onUnregister(props)
        break
      case 'ping':
        await onPing(props)
        break
      default:
        throw new Error(`Unknown operation ${ctx.operation}`)
    }

    return { status: 200 }
  }

function extractContext(headers: Record<string, string | undefined>): BotContext {
  const botId = headers[botIdHeader]
  const base64Configuration = headers[configurationHeader]
  const type = headers[typeHeader]
  const operation = botOperationSchema.parse(headers[operationHeader])

  if (!botId) {
    throw new Error('Missing bot headers')
  }

  if (!type) {
    throw new Error('Missing type headers')
  }

  if (!base64Configuration) {
    throw new Error('Missing configuration headers')
  }

  if (!operation) {
    throw new Error('Missing operation headers')
  }

  return {
    botId,
    operation,
    type,
    configuration: base64Configuration ? JSON.parse(Buffer.from(base64Configuration, 'base64').toString('utf-8')) : {},
  }
}

async function onEventReceived({ botState, ctx, req }: OperationHandlerProps) {
  log.debug(`Received event ${ctx.type}`)

  const client = new Client({ botId: ctx.botId })

  const body = parseBody<EventReceivedBotPayload>(req)

  switch (ctx.type) {
    case 'message_created':
      await Promise.all(
        botState.messageHandlers.map((handler) =>
          handler({
            client,
            user: body.event.payload.user as any,
            conversation: body.event.payload.conversation as any,
            message: body.event.payload.message as any,
            event: body.event,
            ctx,
          })
        )
      )
      break
    case 'state_expired':
      await Promise.all(
        botState.stateExpiredHandlers.map((handler) =>
          handler({
            client,
            state: body.event.payload.state as any,
            ctx,
          })
        )
      )
      break
    default:
      await Promise.all(
        botState.eventHandlers.map((handler) =>
          handler({
            client,
            event: body.event,
            ctx,
          })
        )
      )
  }
}

// TODO implement the ping operation once the signature is defined
async function onPing(_: OperationHandlerProps) {}

async function onRegister(_: OperationHandlerProps) {}

async function onUnregister(_: OperationHandlerProps) {}

function parseBody<T>(req: Request): T {
  if (!req.body) {
    throw new Error('Missing body')
  }

  return JSON.parse(req.body)
}
