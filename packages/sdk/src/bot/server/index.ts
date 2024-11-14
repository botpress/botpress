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

    const vanillaClient = new client.Client({
      botId: ctx.botId,
      retry: retryConfig,
    })
    const botClient = new BotSpecificClient<common.BaseBot>(vanillaClient, {
      before: {
        createMessage: async (req) => {
          for (const handler of bot.hooks.before_outgoing_message[req.type] ?? []) {
            const hookOutput = await handler({
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: req,
            })
            req = hookOutput?.data ?? req
          }
          return req
        },
        callAction: async (req) => {
          for (const handler of bot.hooks.before_call_action[req.type] ?? []) {
            const hookOutput = await handler({
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: req,
            })
            req = hookOutput?.data ?? req
          }
          return req
        },
      },
      after: {
        createMessage: async (res) => {
          for (const handler of bot.hooks.after_outgoing_message[res.message.type] ?? []) {
            const hookOutput = await handler({
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: res,
            })
            res = hookOutput?.data ?? res
          }
          return res
        },
        callAction: async (res) => {
          for (const handler of bot.hooks.after_call_action[res.output.type] ?? []) {
            const hookOutput = await handler({
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: res,
            })
            res = hookOutput?.data ?? res
          }
          return res
        },
      },
    })

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

const onPing = async ({ ctx }: ServerProps) => {
  log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
}

const onRegister = async (_: ServerProps) => {}

const onUnregister = async (_: ServerProps) => {}

const onEventReceived = async ({ ctx, req, client, bot }: ServerProps) => {
  log.debug(`Received event ${ctx.type}`)

  const body = parseBody<types.EventPayload<common.BaseBot>>(req)

  if (ctx.type === 'message_created') {
    const event = body.event
    let message: client.Message = event.payload.message
    for (const handler of bot.hooks.before_incoming_message[message.type] ?? []) {
      const hookOutput = await handler({
        client,
        ctx,
        data: message,
      })
      message = hookOutput?.data ?? message
    }

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

    for (const handler of bot.hooks.after_incoming_message[message.type] ?? []) {
      const hookOutput = await handler({
        client,
        ctx,
        data: message,
      })
      message = hookOutput?.data ?? message
    }

    return
  }

  if (ctx.type === 'state_expired') {
    const event = body.event
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

  let event = body.event
  for (const handler of bot.hooks.before_incoming_event[event.type] ?? []) {
    const hookOutput = await handler({
      client,
      ctx,
      data: event,
    })
    event = hookOutput?.data ?? event
  }

  const eventPayload = { event }
  for (const handler of bot.eventHandlers) {
    await handler({
      ...eventPayload,
      client,
      ctx,
    })
  }

  for (const handler of bot.hooks.after_incoming_event[event.type] ?? []) {
    const hookOutput = await handler({
      client,
      ctx,
      data: event,
    })
    event = hookOutput?.data ?? event
  }
}
