import type { Conversation } from '@botpress/client'
import type { AckFunction } from '@botpress/sdk'

import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { Context, Markup, Telegraf } from 'telegraf'
import type { Update } from 'telegraf/typings/core/types/typegram'
import * as botpress from '.botpress'

type Card = botpress.channels.channel.card.Card

const log = console

sentryHelpers.init({
  dsn: botpress.secrets.SENTRY_DSN,
  environment: botpress.secrets.SENTRY_ENVIRONMENT,
  release: botpress.secrets.SENTRY_RELEASE,
})

const integration = new botpress.Integration({
  register: async ({ webhookUrl, ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.setWebhook(webhookUrl)
  },
  unregister: async ({ ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.deleteWebhook({ drop_pending_updates: true })
  },
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          const { text } = payload
          logger.forBot().info(`Sending message to chat ${chat}: ${text}`)
          const message = await client.telegram.sendMessage(chat, text)
          await ackMessage(message, ack)
        },
        image: async ({ payload, ctx, conversation, ack }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const message = await client.telegram.sendPhoto(getChat(conversation), payload.imageUrl)
          await ackMessage(message, ack)
        },
        markdown: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const message = await client.telegram.sendMessage(getChat(conversation), payload.markdown, {
            parse_mode: 'MarkdownV2',
          })
          await ackMessage(message, ack)
        },
        audio: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const message = await client.telegram.sendAudio(getChat(conversation), payload.audioUrl)
          await ackMessage(message, ack)
        },
        video: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const message = await client.telegram.sendVideo(getChat(conversation), payload.videoUrl)
          await ackMessage(message, ack)
        },
        file: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const message = await client.telegram.sendDocument(getChat(conversation), payload.fileUrl)
          await ackMessage(message, ack)
        },
        location: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const message = await client.telegram.sendLocation(getChat(conversation), payload.latitude, payload.longitude)
          await ackMessage(message, ack)
        },
        card: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          await sendCard(payload, client, conversation, ack)
        },
        carousel: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          payload.items.forEach(async (item) => {
            await sendCard(item, client, conversation, ack)
          })
        },
        dropdown: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
          const message = await client.telegram.sendMessage(
            getChat(conversation),
            payload.text,
            Markup.keyboard(buttons).oneTime()
          )
          await ackMessage(message, ack)
        },
        choice: async ({ ctx, conversation, ack, payload }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
          const message = await client.telegram.sendMessage(
            getChat(conversation),
            payload.text,
            Markup.keyboard(buttons).oneTime()
          )
          await ackMessage(message, ack)
        },
      },
    },
  },
  handler: async ({ req, client, logger }) => {
    log.info('Handler received request')

    if (!req.body) {
      log.warn('Handler received an empty body')
      return
    }

    const data = JSON.parse(req.body)

    if (data.my_chat_member) {
      return
    }

    if (data.channel_post) {
      return
    }

    if (data.edited_message) {
      return
    }

    if (data.message.from.is_bot) {
      return
    }

    if (!data.message.text) {
      return
    }

    const conversationId = data.message.chat.id

    if (!conversationId) {
      throw new Error('Handler received an empty chat id')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        'telegram:id': `${conversationId}`,
      },
    })

    const userId = data.message.from.id

    if (!userId) {
      throw new Error('Handler received an empty from id')
    }

    const { user } = await client.getOrCreateUser({
      tags: {
        'telegram:id': `${userId}`,
      },
    })

    const messageId = data.message.message_id

    if (!messageId) {
      throw new Error('Handler received an empty message id')
    }

    logger.forBot().info(`Received message from user ${userId}: ${data.message.text}`)
    await client.createMessage({
      tags: { 'telegram:id': `${messageId}` },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: data.message.text },
    })
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = Number(tags['telegram:id'])

    if (isNaN(userId)) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const member = await telegraf.telegram.getChatMember(userId, userId)

    const { user } = await client.getOrCreateUser({ tags: { 'telegram:id': `${member.user.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const chatId = tags['telegram:id']

    if (!chatId) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const chat = await telegraf.telegram.getChat(chatId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { 'telegram:id': `${chat.id}` },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration)

async function sendCard(
  payload: Card,
  client: Telegraf<Context<Update>>,
  conversation: Conversation,
  ack: AckFunction
) {
  const text = `*${payload.title}*${payload.subtitle ? '\n' + payload.subtitle : ''}`
  const buttons = payload.actions
    .filter((item) => item.value && item.label)
    .map((item) => {
      switch (item.action) {
        case 'url':
          return Markup.button.url(item.label, item.value)
        case 'postback':
          return Markup.button.callback(item.label, `postback:${item.value}`)
        case 'say':
          return Markup.button.callback(item.label, `say:${item.value}`)
        default:
          throw new Error(`Unknown action type: ${item.action}`)
      }
    })
  if (payload.imageUrl) {
    const message = await client.telegram.sendPhoto(getChat(conversation), payload.imageUrl, {
      caption: text,
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    })
    await ackMessage(message, ack)
  } else {
    const message = await client.telegram.sendMessage(getChat(conversation), text, {
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    })
    await ackMessage(message, ack)
  }
}

function getChat(conversation: Conversation): string {
  const chat = conversation.tags['telegram:id']

  if (!chat) {
    throw Error(`No chat found for conversation ${conversation.id}`)
  }

  return chat
}

type TelegramMessage = {
  message_id: number
}

async function ackMessage(message: TelegramMessage, ack: AckFunction) {
  await ack({ tags: { 'telegram:id': `${message.message_id}` } })
}
