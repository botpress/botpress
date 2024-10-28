import * as client from '@botpress/client'
import { log } from '../../log'
import { retryConfig } from '../../retry'
import { Request, Response, parseBody } from '../../serve'
import { BotSpecificClient } from '../client'
import { BaseBot } from '../types/generic'
import { extractContext } from './context'
import * as types from './types'

export * from './types'

type ServerProps<TBot extends BaseBot> = types.CommonHandlerProps<TBot> & {
  req: Request
  instance: types.BotHandlers<TBot>
}

export const botHandler =
  <TBot extends BaseBot>(instance: types.BotHandlers<TBot>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    if (ctx.operation !== 'ping') {
      log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
    }

    const vanillaClient = new client.Client({
      botId: ctx.botId,
      retry: retryConfig,
    })
    const botClient = new BotSpecificClient<TBot>(vanillaClient)

    const props: ServerProps<TBot> = {
      req,
      ctx,
      client: botClient,
      instance,
    }

    switch (ctx.operation) {
      case 'action_triggered':
        throw new Error(`Operation ${ctx.operation} not supported yet`)
      case 'event_received':
        await onEventReceived<TBot>(props as ServerProps<TBot>)
        break
      case 'register':
        await onRegister<TBot>(props as ServerProps<TBot>)
        break
      case 'unregister':
        await onUnregister<TBot>(props as ServerProps<TBot>)
        break
      case 'ping':
        await onPing<TBot>(props as ServerProps<TBot>)
        break
      default:
        throw new Error(`Unknown operation ${ctx.operation}`)
    }

    return { status: 200 }
  }

const onPing = async <TBot extends BaseBot>(_: ServerProps<TBot>) => {}
const onRegister = async <TBot extends BaseBot>(_: ServerProps<TBot>) => {}
const onUnregister = async <TBot extends BaseBot>(_: ServerProps<TBot>) => {}
const onEventReceived = async <TBot extends BaseBot>({ ctx, req, client, instance }: ServerProps<TBot>) => {
  log.debug(`Received event ${ctx.type}`)

  const body = parseBody<types.EventPayload<TBot>>(req)
  const event = body.event as client.Event

  switch (ctx.type) {
    case 'message_created':
      const messagePayload: types.MessagePayload<TBot> = {
        user: event.payload.user,
        conversation: event.payload.conversation,
        message: event.payload.message,
        states: event.payload.states,
        event,
      }

      await Promise.all(
        instance.messageHandlers.map((handler) =>
          handler({
            client,
            ctx,
            ...messagePayload,
          })
        )
      )
      break
    case 'state_expired':
      const statePayload: types.StateExpiredPayload<TBot> = { state: event.payload.state }
      await Promise.all(
        instance.stateExpiredHandlers.map((handler) =>
          handler({
            client,
            ctx,
            ...statePayload,
          })
        )
      )
      break
    default:
      const eventPayload = { event: body.event } as types.EventPayload<TBot>
      await Promise.all(
        instance.eventHandlers.map((handler) =>
          handler({
            client,
            ctx,
            ...eventPayload,
          })
        )
      )
  }
}
