import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import path from 'path'
import { Button, Buttons, CallbackButton, ContextMessageUpdate, Markup } from 'telegraf'
import Extra from 'telegraf/extra'
import { InlineKeyboardMarkup } from 'telegram-typings'

import { Clients } from './typings'

const outgoingTypes = ['text', 'typing', 'login_prompt', 'file', 'carousel', 'custom']

export async function setupBot(bp: typeof sdk, botId: string, clients: Clients) {
  const client = clients[botId]

  // make this generic for 'help' and 'message' and 'callback_query'
  const send = (ctx: ContextMessageUpdate, args: { type: string }) =>
    bp.events.sendEvent(
      bp.IO.Event({
        botId,
        channel: 'telegram',
        direction: 'incoming',
        payload: ctx.message,
        preview: ctx.message.text,
        threadId: ctx.chat.id.toString(),
        target: ctx.from.id.toString(),
        ...args
      })
    )

  client.start(ctx => send(ctx, { type: 'start' }))
  client.help(ctx => send(ctx, { type: 'help' }))
  client.on('message', ctx => send(ctx, { type: 'message' }))
  client.on('callback_query', ctx => send(ctx, { type: 'callback' }))
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = telegram.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'telegram.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'telegram') {
      return next()
    }

    const client = clients[event.botId]
    if (!client) {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const chatId = event.threadId || event.target

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }

    if (messageType === 'typing') {
      const typing = parseTyping(event.payload.value)
      await client.telegram.sendChatAction(chatId, 'typing')
      await Promise.delay(typing)
    } else if (messageType === 'text') {
      // Quick Replies
      const keyboard = Markup.keyboard(keyboardButtons<Button>(event.payload.quick_replies))

      if (event.payload.markdown != false) {
        // Attempt at sending with markdown first, fallback to regular text on failure
        await client.telegram
          .sendMessage(chatId, event.preview, Extra.markdown(true).markup({ ...keyboard, one_time_keyboard: true }))
          .catch(() =>
            client.telegram.sendMessage(
              chatId,
              event.preview,
              Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
            )
          )
      } else {
        await client.telegram.sendMessage(
          chatId,
          event.preview,
          Extra.markdown(false).markup({ ...keyboard, one_time_keyboard: true })
        )
      }
    } else if (messageType === 'carousel') {
      if (event.payload.elements && event.payload.elements.length) {
        const { title, picture, subtitle } = event.payload.elements[0]
        const buttons = event.payload.elements.map(x => x.buttons)

        if (picture) {
          await client.telegram.sendChatAction(chatId, 'upload_photo')
          await client.telegram.sendPhoto(chatId, { url: picture, filename: path.basename(picture) })
        }
        const keyboard = keyboardButtons<CallbackButton>(buttons)
        await client.telegram.sendMessage(
          chatId,
          `*${title}*\n${subtitle}`,
          Extra.markdown(true).markup(Markup.inlineKeyboard(keyboard))
        )
      }
    } else {
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
  }
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

        return Markup.callbackButton(x.title, x.payload)
      }) as any
  )
}
