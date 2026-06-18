import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { reporting } from '@botpress/sdk-addons'
import { ok } from 'assert/strict'
import { Telegraf } from 'telegraf'
import type { User } from 'telegraf/typings/core/types/typegram'
import { getStoredBotToken } from './botToken'
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
import { handler as wizardHandler } from './wizard'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ webhookUrl, ctx, client }) => {
    const botToken = await getStoredBotToken(client, ctx.integrationId, ctx.configuration.botToken)
    const telegraf = new Telegraf(botToken)
    await telegraf.telegram
      .setWebhook(webhookUrl)
      .catch(mapToRuntimeErrorAndThrow('Fail to set webhook. Check your bot token'))
  },
  unregister: async ({ ctx, client }) => {
    const botToken = await getStoredBotToken(client, ctx.integrationId, ctx.configuration.botToken)
    const telegraf = new Telegraf(botToken)
    await telegraf.telegram
      .deleteWebhook({ drop_pending_updates: true })
      .catch(mapToRuntimeErrorAndThrow('Fail to delete webhook'))
  },
  actions: {
    startTypingIndicator: async ({ input, ctx, client }) => {
      const botToken = await getStoredBotToken(client, ctx.integrationId, ctx.configuration.botToken)
      const telegraf = new Telegraf(botToken)
      const { conversation } = await client.getConversation({ id: input.conversationId })
      const { message } = await client.getMessage({ id: input.messageId })

      const chat = getChat(conversation)
      const messageId = getMessageId(message)

      await telegraf.telegram.sendChatAction(chat, 'typing').catch(mapToRuntimeErrorAndThrow('Fail to start typing'))

      if (ctx.configuration.typingIndicatorEmoji === false) {
        return {}
      }

      await telegraf.telegram
        .setMessageReaction(chat, messageId, [{ type: 'emoji', emoji: '👀' }])
        .catch(mapToRuntimeErrorAndThrow('Fail to set message reaction'))

      return {}
    },
    stopTypingIndicator: async ({ input, ctx, client }) => {
      if (ctx.configuration.typingIndicatorEmoji === false) {
        return {}
      }

      const botToken = await getStoredBotToken(client, ctx.integrationId, ctx.configuration.botToken)
      const telegraf = new Telegraf(botToken)
      const { conversation } = await client.getConversation({ id: input.conversationId })
      const { message } = await client.getMessage({ id: input.messageId })

      const chat = getChat(conversation)
      const messageId = getMessageId(message)

      await telegraf.telegram
        .setMessageReaction(chat, messageId, [])
        .catch(mapToRuntimeErrorAndThrow('Fail to set message reaction'))

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
  handler: async (props) => {
    if (isOAuthWizardUrl(props.req.path)) {
      return await wizardHandler(props)
    }

    if (props.req.path.startsWith('/oauth')) {
      return { status: 404, body: 'Not Found' }
    }

    return await wrapHandler(async ({ req, client, ctx, logger }) => {
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

      const botToken = await getStoredBotToken(client, ctx.integrationId, ctx.configuration.botToken)

      const userFieldsToUpdate = {
        pictureUrl: !user.pictureUrl
          ? await getUserPictureDataUri({
              botToken,
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

      const telegraf = new Telegraf(botToken)
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
    })(props)
  },
})

export default reporting.wrapIntegration(integration)
