import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { Markup, Telegraf } from 'telegraf'
import type { User } from 'telegraf/typings/core/types/typegram'
import { chatIdTag, idTag, senderIdTag } from './const'
import { getUserPictureDataUri, getUserNameFromTelegramUser, getChat, sendCard, ackMessage } from './misc/utils'
import * as bp from '.botpress'

export type IntegrationLogger = Parameters<bp.IntegrationProps['handler']>[0]['logger']

const integration = new bp.Integration({
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
          logger.forBot().debug(`Sending audio message to Telegram chat ${chat}:`, payload.audioUrl)
          const message = await client.telegram.sendAudio(chat, payload.audioUrl)
          await ackMessage(message, ack)
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
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    logger.forBot().debug('Handler received request from Telegram with payload:', req.body)

    if (!req.body) {
      logger.forBot().warn('Handler received an empty body, so the message was ignored')
      return
    }

    const data = JSON.parse(req.body)

    if (data.my_chat_member) {
      logger.forBot().warn('Handler received a chat member update, so the message was ignored')
      return
    }

    if (data.channel_post) {
      logger.forBot().warn('Handler received a channel post, so the message was ignored')
      return
    }

    if (data.edited_channel_post) {
      logger.forBot().warn('Handler received an edited channel post, so the message was ignored')
      return
    }

    if (data.edited_message) {
      logger.forBot().warn('Handler received an edited message, so the message was ignored')
      return
    }

    if (data.message.from.is_bot) {
      logger.forBot().warn('Handler received a message from a bot, so the message was ignored')
      return
    }

    if (!data.message.text) {
      logger.forBot().warn('Request body does not contain a text message, so the message was ignored')
      return
    }

    const conversationId = data.message.chat.id

    if (!conversationId) {
      throw new Error('Handler received an empty chat id')
    }

    const userId = data.message.from?.id
    const chatId = data.message.chat?.id

    if (!userId) {
      throw new Error('Handler received an empty from id')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        [idTag]: `${conversationId}`,
        [senderIdTag]: `${userId}`,
        [chatIdTag]: `${chatId}`,
      },
    })

    const userName = getUserNameFromTelegramUser(data.message.from as User)

    const { user } = await client.getOrCreateUser({
      tags: {
        [idTag]: `${userId}`,
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
        ...(userFieldsToUpdate.pictureUrl && { pictureUrl: userFieldsToUpdate.pictureUrl }),
        ...(userFieldsToUpdate.name && { name: userFieldsToUpdate.name }),
      })
    }

    const messageId = data.message.message_id

    if (!messageId) {
      throw new Error('Handler received an empty message id')
    }

    logger.forBot().debug(`Received message from user ${userId}: ${data.message.text}`)
    await client.createMessage({
      tags: { [idTag]: `${messageId}`, [senderIdTag]: `${userId}`, [chatIdTag]: `${chatId}` },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: data.message.text },
    })
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = Number(tags[idTag])

    if (isNaN(userId)) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const member = await telegraf.telegram.getChatMember(userId, userId)

    const { user } = await client.getOrCreateUser({ tags: { [idTag]: `${member.user.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const chatId = tags[idTag]

    if (!chatId) {
      return
    }

    const telegraf = new Telegraf(ctx.configuration.botToken)
    const chat = await telegraf.telegram.getChat(chatId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { [idTag]: `${chat.id}` },
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
