import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import Telegraf, { ContextMessageUpdate } from 'telegraf'
import {
  TelegramCarouselRenderer,
  TelegramImageRenderer,
  TelegramChoicesRenderer,
  TelegramTextRenderer,
  TelegramCardRenderer,
  TelegramDropdownRenderer
} from '../renderers'
import { TelegramCommonSender, TelegramTypingSender } from '../senders'
import { CHANNEL_NAME } from './constants'

import { Clients, TelegramContext } from './typings'

const renderers = [
  new TelegramCardRenderer(),
  new TelegramDropdownRenderer(),
  new TelegramTextRenderer(),
  new TelegramImageRenderer(),
  new TelegramCarouselRenderer(),
  new TelegramChoicesRenderer()
]
const senders = [new TelegramTypingSender(), new TelegramCommonSender()]

export const sendEvent = async (bp: typeof sdk, botId: string, ctx: ContextMessageUpdate) => {
  // NOTE: getUpdate and setWebhook dot not return the same context mapping
  const chatId = `${ctx.chat?.id || ctx.message?.chat.id}`
  const userId = `${ctx.from?.id || ctx.message?.from.id}`

  const text = ctx.message?.text || ctx.callbackQuery?.data

  let convoId: sdk.uuid
  if (chatId) {
    convoId = await bp.experimental.conversations.forBot(botId).getLocalId(CHANNEL_NAME, chatId)

    if (!convoId) {
      const conversation = await bp.experimental.conversations.forBot(botId).create(userId)
      convoId = conversation.id

      await bp.experimental.conversations.forBot(botId).createMapping(CHANNEL_NAME, conversation.id, chatId)
    }
  } else {
    const conversation = await bp.experimental.conversations.forBot(botId).recent(userId)
    convoId = conversation.id
  }

  await bp.experimental.messages.forBot(botId).receive(convoId, { type: 'text', text }, { channel: CHANNEL_NAME })
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

  client.start(async ctx => sendEvent(bp, botId, ctx))
  client.help(async ctx => sendEvent(bp, botId, ctx))
  client.on('message', async ctx => sendEvent(bp, botId, ctx))
  client.on('callback_query', async ctx => sendEvent(bp, botId, ctx))
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  registerMiddleware(bp, outgoingHandler)

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== CHANNEL_NAME) {
      return next()
    }

    const client: Telegraf<ContextMessageUpdate> = clients[event.botId]
    if (!client) {
      return next()
    }

    const chatId =
      (await bp.experimental.conversations.forBot(event.botId).getForeignId(CHANNEL_NAME, event.threadId)) ||
      event.target

    const context: TelegramContext = {
      bp,
      event,
      client,
      handlers: [],
      payload: _.cloneDeep(event.payload),
      botUrl: process.EXTERNAL_URL,
      messages: [],
      chatId
    }

    for (const renderer of renderers) {
      if (renderer.handles(context)) {
        renderer.render(context)
        context.handlers.push(renderer.id)
      }
    }

    for (const sender of senders) {
      if (sender.handles(context)) {
        await sender.send(context)
      }
    }

    await bp.experimental.messages
      .forBot(event.botId)
      .create(event.threadId, event.payload, undefined, event.id, event.incomingEventId)

    next(undefined, false)
  }
}
