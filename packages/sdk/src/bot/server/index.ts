import * as client from '@botpress/client'
import { log } from '../../log'
import { retryConfig } from '../../retry'
import { Request, Response, parseBody } from '../../serve'
import { BotSpecificClient } from '../client'
import * as common from '../types'
import { extractContext } from './context'
import * as types from './types'

export * from './types'

type ServerProps = types.CommonHandlerProps<common.BaseBot> & {
  req: Request
  bot: types.BotHandlers<common.BaseBot>
}

export const botHandler =
  (bot: types.BotHandlers<common.BaseBot>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    if (ctx.operation !== 'ping') {
      log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
    }

    const vanillaClient = new client.Client({
      botId: ctx.botId,
      retry: retryConfig,
    })
    const botClient = new BotSpecificClient<common.BaseBot>(vanillaClient)

    const props: ServerProps = {
      req,
      ctx,
      client: botClient,
      bot,
    }

    switch (ctx.operation) {
      case 'action_triggered':
        throw new Error(`Operation ${ctx.operation} not supported yet`)
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

const onPing = async (_: ServerProps) => {}
const onRegister = async (_: ServerProps) => {}
const onUnregister = async (_: ServerProps) => {}
const onEventReceived = async ({ ctx, req, client, bot }: ServerProps) => {
  log.debug(`Received event ${ctx.type}`)

  const body = parseBody<types.EventPayload<common.BaseBot>>(req)
  const event = body.event

  if (ctx.type === 'message_created') {
    const message: client.Message = event.payload.message
    const messagePayload: types.MessagePayload<common.BaseBot> = {
      user: event.payload.user,
      conversation: event.payload.conversation,
      states: event.payload.states,
      message,
      event,
    }

    for (const handler of bot.messageHandlers) {
      await handler({
        ...messagePayload,
        client,
        ctx,
      })
    }
    return
  }

  if (ctx.type === 'state_expired') {
    const statePayload: types.StateExpiredPayload<common.BaseBot> = { state: event.payload.state }
    for (const handler of bot.stateExpiredHandlers) {
      await handler({
        ...statePayload,
        client,
        ctx,
      })
    }
    return
  }

  const eventPayload = { event: body.event }
  for (const handler of bot.eventHandlers) {
    await handler({
      ...eventPayload,
      client,
      ctx,
    })
  }
}
