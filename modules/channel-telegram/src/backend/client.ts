import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import Telegraf, { ContextMessageUpdate, Markup } from 'telegraf'

import { Clients, TelegramContext } from './typings'

export const sendEvent = async (bp: typeof sdk, botId: string, ctx: ContextMessageUpdate, args: { type: string }) => {
  // NOTE: getUpdate and setWebhook dot not return the same context mapping
  const chatId = `${ctx.chat?.id || ctx.message?.chat.id}`
  const userId = `${ctx.from?.id || ctx.message?.from.id}`

  const payload = ctx.message || ctx.callbackQuery
  const preview = ctx.message?.text || ctx.callbackQuery?.data

  let convoId: sdk.uuid
  if (chatId) {
    convoId = await bp.experimental.conversations.forBot(botId).getLocalId('telegram', chatId)

    if (!convoId) {
      const conversation = await bp.experimental.conversations.forBot(botId).create(userId)
      convoId = conversation.id

      await bp.experimental.conversations.forBot(botId).createMapping('telegram', conversation.id, chatId)
    }
  } else {
    const conversation = await bp.experimental.conversations.forBot(botId).recent(userId)
    convoId = conversation.id
  }

  await bp.experimental.messages
    .forBot(botId)
    .receive(convoId, { ...args, ...payload }, { channel: 'telegram', preview })
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

  let renderers: sdk.ChannelRenderer<TelegramContext>[]
  let senders: sdk.ChannelSender<TelegramContext>[]

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'telegram') {
      return next()
    }

    const client: Telegraf<ContextMessageUpdate> = clients[event.botId]
    if (!client) {
      return next()
    }

    const chatId =
      (await bp.experimental.conversations.forBot(event.botId).getForeignId('telegram', event.threadId)) || event.target

    if (!renderers) {
      // TODO we can't initialize this at setup because these aren't loaded yet
      renderers = bp.experimental.render.getChannelRenderers('telegram')
      senders = bp.experimental.render.getChannelSenders('telegram')
    }

    const context: TelegramContext = {
      bp,
      event,
      client,
      handlers: [],
      payload: _.cloneDeep(event.payload),
      messages: [],
      chatId,
      keyboardButtons
    }

    for (const renderer of renderers) {
      if (await renderer.handles(context)) {
        await renderer.render(context)
        context.handlers.push(renderer.id)
      }
    }

    for (const sender of senders) {
      if (await sender.handles(context)) {
        await sender.send(context)
      }
    }

    await bp.experimental.messages
      .forBot(event.botId)
      .create(event.threadId, event.payload, undefined, event.id, event.incomingEventId)

    next(undefined, false)
  }
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
