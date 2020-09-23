import * as sdk from 'botpress/sdk'
import { isValidOutgoingType } from 'common/channels'
import _ from 'lodash'
import path from 'path'
import Telegraf, { Button, CallbackButton, ContextMessageUpdate, Markup } from 'telegraf'
import Extra from 'telegraf/extra'

import { Clients } from './typings'

const debug = DEBUG('channel-telegram')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const sendEvent = async (bp: typeof sdk, botId: string, ctx: ContextMessageUpdate, args: { type: string }) => {
  debugIncoming('Received incoming event %o', ctx)
  // NOTE: getUpdate and setWebhook dot not return the same context mapping
  const threadId = _.get(ctx, 'chat.id') || _.get(ctx, 'message.chat.id')
  const target = _.get(ctx, 'from.id') || _.get(ctx, 'message.from.id')

  await bp.events.sendEvent(
    bp.IO.Event({
      botId,
      channel: 'telegram',
      direction: 'incoming',
      payload: ctx.message,
      preview: ctx.message.text,
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
  client.on('message', async ctx => sendEvent(bp, botId, ctx, { type: 'text' }))
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

    const { type, payload, threadId, target } = event

    const { __typing } = payload.metadata as sdk.Content.Metadata
    const chatId = threadId ?? target

    if (!isValidOutgoingType(type)) {
      return next(new Error(`Unsupported event type: ${event.type}`))
    }

    if (__typing) {
      await sendTyping(payload, client, chatId)
    }

    if (type === 'text') {
      await sendTextMessage(payload, client, chatId)
    } else if (type === 'image') {
      await sendImage(payload, client, chatId)
    } else if (type === 'carousel') {
      await sendCarousel(payload, client, chatId)
    }

    next(undefined, false)
  }
}

async function sendCarousel(payload: sdk.Content.Carousel, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  if (!payload.items.length) {
    return
  }

  const { title, image, subtitle } = payload.items[0]
  const buttons = payload.items.map(x => x.actions)

  if (image) {
    const url = `${payload.extraProps.BOT_URL}${image}`
    await client.telegram.sendChatAction(chatId, 'upload_photo')
    await client.telegram.sendPhoto(chatId, { url, filename: path.basename(url) })
  }

  const keyboard = keyboardButtons<CallbackButton>(buttons)
  await client.telegram.sendMessage(
    chatId,
    `*${title}*\n${subtitle}`,
    Extra.markdown(true).markup(Markup.inlineKeyboard(keyboard))
  )
}

const getKeyboard = (payload: sdk.Content.All, markdown = false) => {
  const options = payload.metadata?.__suggestions
  const keyboard = Markup.keyboard(keyboardButtons<Button>(options))
  return Extra.markdown(markdown).markup({ ...keyboard, one_time_keyboard: true })
}

async function sendTextMessage(payload: sdk.Content.Text, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const { __markdown } = payload.metadata
  const text = payload.text as string

  if (__markdown) {
    // Attempt at sending with markdown first, fallback to regular text on failure
    await client.telegram
      .sendMessage(chatId, text, getKeyboard(payload, true))
      .catch(() => client.telegram.sendMessage(chatId, text, getKeyboard(payload)))
  } else {
    await client.telegram.sendMessage(chatId, text, getKeyboard(payload))
  }
}

async function sendImage(payload: sdk.Content.Image, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const url = `${payload.extraProps.BOT_URL}${payload.image}`

  if (url.toLowerCase().endsWith('.gif')) {
    await client.telegram.sendAnimation(chatId, url, getKeyboard(payload))
  } else {
    await client.telegram.sendPhoto(chatId, url, getKeyboard(payload))
  }
}

async function sendTyping(payload: sdk.Content.All, client: Telegraf<ContextMessageUpdate>, chatId: string) {
  const typing = parseTyping(payload.metadata.__typing)
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
        if (x.label) {
          return Markup.callbackButton(x.label, x.value)
        } else if (x.url) {
          return Markup.urlButton(x.title, x.url)
        }

        return Markup.callbackButton(x.title, x.payload)
      }) as any
  )
}
