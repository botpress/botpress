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
  instance: types.BotHandlers<common.BaseBot>
}

export const botHandler =
  (instance: types.BotHandlers<common.BaseBot>) =>
  async (req: Request): Promise<Response | void> => {
    const ctx = extractContext(req.headers)

    if (ctx.operation !== 'ping') {
      log.info(`Received ${ctx.operation} operation for bot ${ctx.botId} of type ${ctx.type}`)
    }

    const vanillaClient = new client.Client({
      botId: ctx.botId,
      retry: retryConfig,
    })
    const botClient = new BotSpecificClient<common.BaseBot>(vanillaClient, {
      before: {
        createMessage: async (req) => {
          for (const plugin of instance.plugins) {
            const pluginOutput = await plugin.run.before_outgoing_message(req.type, {
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: req,
            })
            req = pluginOutput.data
          }

          return req
        },
        callAction: async (req) => {
          for (const plugin of instance.plugins) {
            const pluginOutput = await plugin.run.before_call_action(req.type, {
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: req,
            })
            req = pluginOutput.data
          }

          return req
        },
      },
      after: {
        createMessage: async (res) => {
          for (const plugin of instance.plugins) {
            const pluginOutput = await plugin.run.after_outgoing_message(res.message.type, {
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: res,
            })
            res = pluginOutput.data
          }

          return res
        },
        callAction: async (res) => {
          for (const plugin of instance.plugins) {
            const pluginOutput = await plugin.run.after_call_action(res.output.type, {
              client: new BotSpecificClient(vanillaClient),
              ctx,
              data: res,
            })
            res = pluginOutput.data
          }

          return res
        },
      },
    })

    const props: ServerProps = {
      req,
      ctx,
      client: botClient,
      instance,
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
const onEventReceived = async ({ ctx, req, client, instance }: ServerProps) => {
  log.debug(`Received event ${ctx.type}`)

  const body = parseBody<types.EventPayload<common.BaseBot>>(req)

  if (ctx.type === 'message_created') {
    const event = body.event
    let message: types.MessagePayload<common.BaseBot>['message'] = event.payload.message

    for (const plugin of instance.plugins) {
      const pluginOutput = await plugin.run.before_incoming_message(message.type, {
        client,
        ctx,
        data: message,
      })
      message = pluginOutput.data
    }

    await Promise.all(
      instance.messageHandlers.map((handler) =>
        handler({
          client,
          ctx,
          event,
          message,
          user: event.payload.user,
          conversation: event.payload.conversation,
          states: event.payload.states,
        })
      )
    )

    for (const plugin of instance.plugins) {
      const pluginOutput = await plugin.run.after_incoming_message(message.type, {
        client,
        ctx,
        data: message,
      })
      message = pluginOutput.data
    }

    return
  }
  if (ctx.type === 'state_expired') {
    const event = body.event
    const statePayload: types.StateExpiredPayload<common.BaseBot> = { state: event.payload.state }
    await Promise.all(
      instance.stateExpiredHandlers.map((handler) =>
        handler({
          client,
          ctx,
          ...statePayload,
        })
      )
    )
    return
  }

  let event = body.event
  for (const plugin of instance.plugins) {
    const pluginOutput = await plugin.run.before_incoming_event(event.type, {
      client,
      ctx,
      data: event,
    })
    event = pluginOutput.data
  }

  await Promise.all(
    instance.eventHandlers.map((handler) =>
      handler({
        client,
        ctx,
        event,
      })
    )
  )

  for (const plugin of instance.plugins) {
    const pluginOutput = await plugin.run.after_incoming_event(event.type, {
      client,
      ctx,
      data: event,
    })
    event = pluginOutput.data
  }

  return
}
