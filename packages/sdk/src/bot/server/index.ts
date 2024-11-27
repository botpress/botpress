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
          for (const handler of bot.hookHandlers.before_outgoing_message[req.type] ?? []) {
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
          for (const handler of bot.hookHandlers.before_outgoing_call_action[req.type] ?? []) {
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
          for (const handler of bot.hookHandlers.after_outgoing_message[res.message.type] ?? []) {
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
          for (const handler of bot.hookHandlers.after_outgoing_call_action[res.output.type] ?? []) {
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

  type AnyEventPayload = utils.ValueOf<types.EventPayloads<common.BaseBot>>
  const body = parseBody<AnyEventPayload>(req)

  if (ctx.type === 'message_created') {
    const event = body.event
    let message: client.Message = event.payload.message
    for (const handler of self.hookHandlers.before_incoming_message[message.type] ?? []) {
      const hookOutput = await handler({
        client,
        ctx,
        data: message,
      })
      message = hookOutput?.data ?? message
      if (hookOutput?.stop) {
        return SUCCESS_RESPONSE
      }
    }

    const messagePayload: utils.ValueOf<types.MessagePayloads<common.BaseBot>> = {
      user: event.payload.user,
      conversation: event.payload.conversation,
      states: event.payload.states,
      message,
      event,
    }

    const specificMessageHandlers = self.messageHandlers[message.type] ?? []
    const globalMessageHandlers = self.messageHandlers['*'] ?? []
    const messageHandlers = [...specificMessageHandlers, ...globalMessageHandlers]

    for (const handler of messageHandlers) {
      await handler({
        ...messagePayload,
        client,
        ctx,
        self,
      })
    }

    for (const handler of self.hookHandlers.after_incoming_message[message.type] ?? []) {
      const hookOutput = await handler({
        client,
        ctx,
        data: message,
      })
      message = hookOutput?.data ?? message
      if (hookOutput?.stop) {
        return SUCCESS_RESPONSE
      }
    }

    return SUCCESS_RESPONSE
  }

  if (ctx.type === 'state_expired') {
    const event = body.event
    const state: client.State = event.payload.state
    const statePayload: utils.ValueOf<types.StateExpiredPayloads<common.BaseBot>> = { state }

    const stateHandlers = self.stateExpiredHandlers['*'] ?? []
    for (const handler of stateHandlers) {
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
  for (const handler of self.hookHandlers.before_incoming_event[event.type] ?? []) {
    const hookOutput = await handler({
      client,
      ctx,
      data: event,
    })
    event = hookOutput?.data ?? event
    if (hookOutput?.stop) {
      return SUCCESS_RESPONSE
    }
  }

  const eventPayload = { event }

  const specificEventHandlers = self.eventHandlers[event.type] ?? []
  const globalEventHandlers = self.eventHandlers['*'] ?? []
  const eventHandlers = [...specificEventHandlers, ...globalEventHandlers]
  for (const handler of eventHandlers) {
    await handler({
      ...eventPayload,
      client,
      ctx,
      self,
    })
  }

  for (const handler of self.hookHandlers.after_incoming_event[event.type] ?? []) {
    const hookOutput = await handler({
      client,
      ctx,
      data: event,
    })
    event = hookOutput?.data ?? event
    if (hookOutput?.stop) {
      return SUCCESS_RESPONSE
    }
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
