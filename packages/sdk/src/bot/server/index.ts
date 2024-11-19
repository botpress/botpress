import * as client from '@botpress/client'
import { log } from '../../log'
import { retryConfig } from '../../retry'
import { Request, Response, parseBody } from '../../serve'
import * as utils from '../../utils/type-utils'
import { BotSpecificClient } from '../client'
import * as common from '../types'
import { extractContext } from './context'
import * as types from './types'

export * from './types'

type ServerProps = types.CommonHandlerProps<common.BaseBot> & {
  req: Request
}

const SUCCESS_RESPONSE = { status: 200 }

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
      self: bot,
    }

    switch (ctx.operation) {
      case 'action_triggered':
        return await onActionTriggered(props)
      case 'event_received':
        return await onEventReceived(props)
      case 'register':
        return await onRegister(props)
      case 'unregister':
        return await onUnregister(props)
      case 'ping':
        return await onPing(props)
      default:
        throw new Error(`Unknown operation ${ctx.operation}`)
    }
  }

const onPing = async ({ ctx }: ServerProps): Promise<Response> => {
  log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
  return SUCCESS_RESPONSE
}

const onRegister = async (_: ServerProps): Promise<Response> => SUCCESS_RESPONSE

const onUnregister = async (_: ServerProps): Promise<Response> => SUCCESS_RESPONSE

const onEventReceived = async ({ ctx, req, client, self }: ServerProps): Promise<Response> => {
  log.debug(`Received event ${ctx.type}`)

  const body = parseBody<types.EventPayload<common.BaseBot>>(req)

  if (ctx.type === 'message_created') {
    const event = body.event
    let message: client.Message = event.payload.message
    for (const handler of self.hooks.before_incoming_message[message.type] ?? []) {
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
    for (const handler of self.messageHandlers) {
      await handler({
        ...messagePayload,
        client,
        ctx,
        self,
      })
    }

    for (const handler of self.hooks.after_incoming_message[message.type] ?? []) {
      const hookOutput = await handler({
        client,
        ctx,
        data: message,
      })
      message = hookOutput?.data ?? message
    }

    return SUCCESS_RESPONSE
  }

  if (ctx.type === 'state_expired') {
    const event = body.event
    const statePayload: types.StateExpiredPayload<common.BaseBot> = { state: event.payload.state }
    for (const handler of self.stateExpiredHandlers) {
      await handler({
        ...statePayload,
        client,
        ctx,
        self,
      })
    }
    return SUCCESS_RESPONSE
  }

  let event = body.event
  for (const handler of self.hooks.before_incoming_event[event.type] ?? []) {
    const hookOutput = await handler({
      client,
      ctx,
      data: event,
    })
    event = hookOutput?.data ?? event
  }

  const eventPayload = { event }
  for (const handler of self.eventHandlers) {
    await handler({
      ...eventPayload,
      client,
      ctx,
      self,
    })
  }

  for (const handler of self.hooks.after_incoming_event[event.type] ?? []) {
    const hookOutput = await handler({
      client,
      ctx,
      data: event,
    })
    event = hookOutput?.data ?? event
  }

  return SUCCESS_RESPONSE
}

const onActionTriggered = async ({ ctx, req, client, self }: ServerProps): Promise<Response> => {
  type AnyActionPayload = utils.ValueOf<types.ActionHandlerPayloads<common.BaseBot>>
  const { input, type } = parseBody<AnyActionPayload>(req)

  if (!type) {
    throw new Error('Missing action type')
  }

  const action = self.actionHandlers[type]

  if (!action) {
    throw new Error(`Action ${type} not found`)
  }

  const output = await action({ ctx, input, client, type, self })

  const response = { output }
  return {
    status: 200,
    body: JSON.stringify(response),
  }
}
