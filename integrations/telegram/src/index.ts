import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { ok } from 'assert/strict'

import { Markup, Telegraf } from 'telegraf'
import type { User } from 'telegraf/typings/core/types/typegram'

import { TelegramMessage } from './misc/types'
import {
  getUserPictureDataUri,
  getUserNameFromTelegramUser,
  getChat,
  sendCard,
  ackMessage,
  convertTelegramMessageToBotpressMessage,
  wrapHandler,
  getMessageId,
} from './misc/utils'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ webhookUrl, ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.setWebhook(webhookUrl)
  },
  unregister: async ({ ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.deleteWebhook({ drop_pending_updates: true })
  },
  actions: {
    startTypingIndicator: async ({ input, ctx, client }) => {
      const telegraf = new Telegraf(ctx.configuration.botToken)
      const { conversation } = await client.getConversation({ id: input.conversationId })
      const { message } = await client.getMessage({ id: input.messageId })

      const chat = getChat(conversation)
      const messageId = getMessageId(message)

      await telegraf.telegram.sendChatAction(chat, 'typing')
      await telegraf.telegram.setMessageReaction(chat, messageId, [{ type: 'emoji', emoji: '👀' }])

      return {}
    },
    stopTypingIndicator: async ({ input, ctx, client }) => {
      const telegraf = new Telegraf(ctx.configuration.botToken)
      const { conversation } = await client.getConversation({ id: input.conversationId })
      const { message } = await client.getMessage({ id: input.messageId })

      const chat = getChat(conversation)
      const messageId = getMessageId(message)

      await telegraf.telegram.setMessageReaction(chat, messageId, [])

      return {}
    },
  },
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          const { text } = payload
          logger.forBot().debug(`Sending text message to Telegram chat ${chat}:`, text)
          const message = await client.telegram.sendMessage(chat, text)
          await ackMessage(message, ack)
        },
        image: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending image message to Telegram chat ${chat}`, payload.imageUrl)
          const message = await client.telegram.sendPhoto(chat, payload.imageUrl)
          await ackMessage(message, ack)
        },
        markdown: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending markdown message to Telegram chat ${chat}:`, payload.markdown)
          const message = await client.telegram.sendMessage(chat, payload.markdown, {
            parse_mode: 'MarkdownV2',
          })
          await ackMessage(message, ack)
        },
        audio: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending audio voice to Telegram chat ${chat}:`, payload.audioUrl)
          try {
            const message = await client.telegram.sendVoice(chat, payload.audioUrl, { caption: payload.caption })
            await ackMessage(message, ack)
          } catch {
            // If the audio file is too large to be voice, Telegram should send it as an audio file, but if for some reason it doesn't, we can send it as an audio file
            const message = await client.telegram.sendAudio(chat, payload.audioUrl, { caption: payload.caption })
            await ackMessage(message, ack)
          }
        },
        video: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending video message to Telegram chat ${chat}:`, payload.videoUrl)
          const message = await client.telegram.sendVideo(chat, payload.videoUrl)
          await ackMessage(message, ack)
        },
        file: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending file message to Telegram chat ${chat}:`, payload.fileUrl)
          const message = await client.telegram.sendDocument(chat, payload.fileUrl)
          await ackMessage(message, ack)
        },
        location: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending location message to Telegram chat ${chat}:`, {
            latitude: payload.latitude,
            longitude: payload.longitude,
          })
          const message = await client.telegram.sendLocation(chat, payload.latitude, payload.longitude)
          await ackMessage(message, ack)
        },
        card: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending card message to Telegram chat ${chat}:`, payload)
          await sendCard(payload, client, chat, ack)
        },
        carousel: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending carousel message to Telegram chat ${chat}:`, payload)
          payload.items.forEach(async (item) => {
            await sendCard(item, client, chat, ack)
          })
        },
        dropdown: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
          logger.forBot().debug(`Sending dropdown message to Telegram chat ${chat}:`, payload)
          const message = await client.telegram.sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
          await ackMessage(message, ack)
        },
        choice: async ({ payload, ctx, conversation, ack, logger }) => {
          const client = new Telegraf(ctx.configuration.botToken)
          const chat = getChat(conversation)
          logger.forBot().debug(`Sending choice message to Telegram chat ${chat}:`, payload)
          const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
          const message = await client.telegram.sendMessage(chat, payload.text, Markup.keyboard(buttons).oneTime())
          await ackMessage(message, ack)
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: wrapHandler(async ({ req, client, ctx, logger }) => {
    logger.forBot().debug('Handler received request from Telegram with payload:', req.body)

    ok(req.body, 'Handler received an empty body, so the message was ignored')

    const data = JSON.parse(req.body)

    ok(!data.my_chat_member, 'Handler received a chat member update, so the message was ignored')
    ok(!data.channel_post, 'Handler received a channel post, so the message was ignored')
    ok(!data.edited_channel_post, 'Handler received an edited channel post, so the message was ignored')
    ok(!data.edited_message, 'Handler received an edited message, so the message was ignored')
    ok(data.message, 'Handler received a non-message update, so the event was ignored')

    const message = data.message as TelegramMessage
    const conversationId = message.chat.id
    const userId = message.from?.id
    const messageId = message.message_id

    ok(!message.from?.is_bot, 'Handler received a message from a bot, so the message was ignored')
    ok(conversationId, 'Handler received message with empty "chat.id" value')
    ok(userId, 'Handler received message with empty "from.id" value')
    ok(messageId, 'Handler received an empty message id')

    const fromUser = message.from as User
    const userName = getUserNameFromTelegramUser(fromUser)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: conversationId.toString(),
        fromUserId: userId.toString(),
        fromUserUsername: fromUser.username,
        fromUserName: userName,
        chatId: conversationId.toString(),
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        id: userId.toString(),
      },
      ...(userName && { name: userName }),
    })

    const userFieldsToUpdate = {
      pictureUrl: !user.pictureUrl
        ? await getUserPictureDataUri({
            botToken: ctx.configuration.botToken,
            telegramUserId: userId,
            logger,
          })
        : undefined,
      name: user.name !== userName ? userName : undefined,
    }

    if (userFieldsToUpdate.pictureUrl || userFieldsToUpdate.name) {
      await client.updateUser({
        ...user,
        tags: {
          id: user.tags.id,
        },
        ...(userFieldsToUpdate.pictureUrl && { pictureUrl: userFieldsToUpdate.pictureUrl }),
        ...(userFieldsToUpdate.name && { name: userFieldsToUpdate.name }),
      })
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const bpMessage = await convertTelegramMessageToBotpressMessage({
      message,
      telegram: telegraf.telegram,
    })

    logger.forBot().debug(`Received message from user ${userId}: ${JSON.stringify(message, null, 2)}`)

    await client.createMessage({
      tags: {
        id: messageId.toString(),
        chatId: conversationId.toString(),
      },
      ...bpMessage,
      userId: user.id,
      conversationId: conversation.id,
    })
  }),
  createUser: async ({ client, tags, ctx }) => {
    const strId = tags.id
    const userId = Number(strId)

    if (isNaN(userId)) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const member = await telegraf.telegram.getChatMember(userId, userId)

    const { user } = await client.getOrCreateUser({ tags: { id: `${member.user.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const chatId = tags.id
    if (!chatId) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const chat = await telegraf.telegram.getChat(chatId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { id: chat.id.toString() },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
