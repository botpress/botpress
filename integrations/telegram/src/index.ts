import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { ok } from 'assert/strict'

import { Telegraf } from 'telegraf'
import type { User } from 'telegraf/typings/core/types/typegram'

import {
  handleAudioMessage,
  handleBlocMessage,
  handleCardMessage,
  handleCarouselMessage,
  handleChoiceMessage,
  handleDropdownMessage,
  handleFileMessage,
  handleImageMessage,
  handleLocationMessage,
  handleTextMessage,
  handleVideoMessage,
} from './misc/message-handlers'
import { TelegramMessage } from './misc/types'
import {
  getUserPictureDataUri,
  getUserNameFromTelegramUser,
  getChat,
  convertTelegramMessageToBotpressMessage,
  wrapHandler,
  getMessageId,
  mapToRuntimeErrorAndThrow,
} from './misc/utils'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ webhookUrl, ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.setWebhook(webhookUrl).catch(mapToRuntimeErrorAndThrow)
  },
  unregister: async ({ ctx }) => {
    const telegraf = new Telegraf(ctx.configuration.botToken)
    await telegraf.telegram.deleteWebhook({ drop_pending_updates: true }).catch(mapToRuntimeErrorAndThrow)
  },
  actions: {
    startTypingIndicator: async ({ input, ctx, client }) => {
      const telegraf = new Telegraf(ctx.configuration.botToken)
      const { conversation } = await client.getConversation({ id: input.conversationId })
      const { message } = await client.getMessage({ id: input.messageId })

      const chat = getChat(conversation)
      const messageId = getMessageId(message)

      await telegraf.telegram.sendChatAction(chat, 'typing').catch(mapToRuntimeErrorAndThrow)
      await telegraf.telegram
        .setMessageReaction(chat, messageId, [{ type: 'emoji', emoji: '👀' }])
        .catch(mapToRuntimeErrorAndThrow)

      return {}
    },
    stopTypingIndicator: async ({ input, ctx, client }) => {
      const telegraf = new Telegraf(ctx.configuration.botToken)
      const { conversation } = await client.getConversation({ id: input.conversationId })
      const { message } = await client.getMessage({ id: input.messageId })

      const chat = getChat(conversation)
      const messageId = getMessageId(message)

      await telegraf.telegram.setMessageReaction(chat, messageId, []).catch(mapToRuntimeErrorAndThrow)

      return {}
    },
  },
  channels: {
    channel: {
      messages: {
        text: handleTextMessage,
        image: handleImageMessage,
        audio: handleAudioMessage,
        video: handleVideoMessage,
        file: handleFileMessage,
        location: handleLocationMessage,
        card: handleCardMessage,
        carousel: handleCarouselMessage,
        dropdown: handleDropdownMessage,
        choice: handleChoiceMessage,
        bloc: handleBlocMessage,
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
    const telegramConversationId = message.chat.id
    const telegramUserId = message.from?.id
    const messageId = message.message_id

    ok(!message.from?.is_bot, 'Handler received a message from a bot, so the message was ignored')
    ok(telegramConversationId, 'Handler received message with empty "chat.id" value')
    ok(telegramUserId, 'Handler received message with empty "from.id" value')
    ok(messageId, 'Handler received an empty message id')

    const fromUser = message.from as User
    const userName = getUserNameFromTelegramUser(fromUser)

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        id: telegramConversationId.toString(),
        fromUserId: telegramUserId.toString(),
        fromUserUsername: fromUser.username,
        fromUserName: userName,
        chatId: telegramConversationId.toString(),
      },
      discriminateByTags: ['id'],
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        id: telegramUserId.toString(),
      },
      ...(userName && { name: userName }),
      discriminateByTags: ['id'],
    })

    const userFieldsToUpdate = {
      pictureUrl: !user.pictureUrl
        ? await getUserPictureDataUri({
            botToken: ctx.configuration.botToken,
            telegramUserId,
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
      logger,
    })

    logger.forBot().debug(`Received message from user ${telegramUserId}: ${JSON.stringify(message, null, 2)}`)

    await client.createMessage({
      tags: {
        id: messageId.toString(),
        chatId: telegramConversationId.toString(),
      },
      ...bpMessage,
      userId: user.id,
      conversationId: conversation.id,
    })
  }),
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
