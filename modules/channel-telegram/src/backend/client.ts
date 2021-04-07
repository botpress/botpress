import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'
import Telegraf, { Button, CallbackButton, ContextMessageUpdate, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

import { Clients } from './typings'

const outgoingTypes = ['text', 'typing', 'image', 'login_prompt', 'carousel']

export const sendEvent = async (bp: typeof sdk, botId: string, ctx: ContextMessageUpdate, args: { type: string }) => {
  // NOTE: getUpdate and setWebhook dot not return the same context mapping
  const threadId = _.get(ctx, 'chat.id') || _.get(ctx, 'message.chat.id')
  const target = _.get(ctx, 'from.id') || _.get(ctx, 'message.from.id')

  const payload = _.get(ctx, 'message') || _.get(ctx, 'callback_query')
  const preview = _.get(ctx, 'message.text') || _.get(ctx, 'callback_query.data')

  await bp.events.sendEvent(
    bp.IO.Event({
      botId,
      payload,
      preview,
      channel: 'telegram',
      direction: 'incoming',
      threadId: threadId && threadId.toString(),
      target: target && target.toString(),
      ...args
    })
  )
}

export const registerMiddleware = (bp: typeof sdk, outgoingHandler) => {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = telegram.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'telegram.sendMessages',
    order: 100
  })
}

export async function setupBot(bp: typeof sdk, botId: string, clients: Clients) {
  const client = clients[botId]

  client.start(async ctx => sendEvent(bp, botId, ctx, { type: 'start' }))
  client.help(async ctx => sendEvent(bp, botId, ctx, { type: 'help' }))
  client.on('message', async ctx => sendEvent(bp, botId, ctx, { type: 'message' }))
  client.on('callback_query', async ctx => sendEvent(bp, botId, ctx, { type: 'callback' }))
  // TODO We don't support understanding and accepting more complex stuff from users such as files, audio etc
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  registerMiddleware(bp, outgoingHandler)

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'telegram') {
      return next()
    }

    const client: Telegraf<ContextMessageUpdate> = clients[event.botId]
    if (!client) {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const chatId = event.threadId || event.target

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error(`Unsupported event type: ${event.type}`))
    }

    const renderers = bp.experimental.render.getChannelRenderers('telegram')
    const context = { bp, event, client, args: { keyboardButtons } }
    let handled = false
    for (const renderer of renderers) {
      if (!(await renderer.handles(context))) {
        continue
      }

      handled = await renderer.render(context)

      if (handled) {
        break
      }
    }

    if (handled) {
    } else if (messageType === 'typing') {
      await sendTyping(event, client, chatId)
    } else {
      // TODO We don't support sending files, location requests (and probably more) yet
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
  }
}

async function sendTyping(event: sdk.IO.Event, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const typing = parseTyping(event.payload.value)
  await client.telegram.sendChatAction(chatId, 'typing')
  await Promise.delay(typing)
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}

function keyboardButtons<T>(arr: any[] | undefined): T[] | undefined {
  if (!arr || !arr.length) {
    return undefined
  }

  const rows = arr[0].length ? arr : [arr]

  return rows.map(
    row =>
      row.map(x => {
        if (x.url) {
          return Markup.urlButton(x.title, x.url)
        }

        return Markup.callbackButton(x.title, x.payload || '')
      }) as any
  )
}
