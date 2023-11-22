import * as bpclient from '@botpress/client'
import { log } from '../log'
import { Request, Response, parseBody } from '../serve'
import { Merge } from '../type-utils'
import { BotSpecificClient } from './client'
import { EnumerateEvents } from './client/types'
import { BotContext, extractContext } from './context'
import { BaseBot } from './generic'

type CommonArgs<TBot extends BaseBot> = {
  ctx: BotContext
  client: BotSpecificClient<TBot>
}

type MessagePayload<TBot extends BaseBot> = {
  user: bpclient.User
  conversation: bpclient.Conversation
  message: bpclient.Message
  event: bpclient.Event
  states: {
    [TState in keyof TBot['states']]: {
      type: StateType
      payload: TBot['states'][TState]
    }
  }
}
type MessageArgs<TBot extends BaseBot> = CommonArgs<TBot> & MessagePayload<TBot>

type EventPayload<TBot extends BaseBot> = {
  event: {
    [K in keyof EnumerateEvents<TBot>]: Merge<bpclient.Event, { type: K; payload: EnumerateEvents<TBot>[K] }>
  }[keyof EnumerateEvents<TBot>]
}
type EventArgs<TBot extends BaseBot> = CommonArgs<TBot> & EventPayload<TBot>

type StateExpiredPayload = { state: bpclient.State }
type StateExpiredArgs<TBot extends BaseBot> = CommonArgs<TBot> & StateExpiredPayload

export type StateType = 'conversation' | 'user' | 'bot'

export type MessageHandler<TBot extends BaseBot> = (args: MessageArgs<TBot>) => Promise<void>

export type EventHandler<TBot extends BaseBot> = (args: EventArgs<TBot>) => Promise<void>

export type StateExpiredHandler<TBot extends BaseBot> = (args: StateExpiredArgs<TBot>) => Promise<void>

export type BotHandlers<TBot extends BaseBot> = {
  messageHandlers: MessageHandler<TBot>[]
  eventHandlers: EventHandler<TBot>[]
  stateExpiredHandlers: StateExpiredHandler<TBot>[]
}

type ServerProps<TBot extends BaseBot> = CommonArgs<TBot> & {
  req: Request
  instance: BotHandlers<TBot>
}

export const botHandler =
  <TBot extends BaseBot>(instance: BotHandlers<TBot>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    if (ctx.operation !== 'ping') {
      log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
    }

    const client: BotSpecificClient<TBot> = new BotSpecificClient(new bpclient.Client({ botId: ctx.botId }))

    const props: ServerProps<TBot> = {
      req,
      ctx,
      client,
      instance,
    }

    switch (ctx.operation) {
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

  const body = parseBody<EventPayload<TBot>>(req)
  const event = body.event as bpclient.Event

  switch (ctx.type) {
    case 'message_created':
      const messagePayload: MessagePayload<TBot> = {
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
      const statePayload: StateExpiredPayload = { state: event.payload.state }
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
      const eventPayload = { event: body.event } as EventPayload<TBot>
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
