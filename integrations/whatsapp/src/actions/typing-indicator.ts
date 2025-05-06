import { RuntimeError } from '@botpress/client'
import { WhatsAppAPI } from 'whatsapp-api-js'
import { Reaction } from 'whatsapp-api-js/messages'
import { getAccessToken } from '../auth'
import { sendTypingIndicator } from '../misc/whatsapp-utils'
import * as bp from '.botpress'

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  const token = await getAccessToken(client, ctx)
  const whatsapp = new WhatsAppAPI({ token, secure: false })
  const { conversationId, messageId } = input
  const { botPhoneNumberId, userPhone } = await _getConversationInfos(client, conversationId)
  const { whatsappMessageId } = await _getMessageInfos(client, messageId)

  // No await to avoid blocking
  void sendTypingIndicator(botPhoneNumberId, whatsappMessageId, client, ctx).catch((e) => {
    logger.forBot().error(`Error sending typing indicator: ${e ?? '[Unknown error]'}`)
  })
  if (ctx.configuration.typingIndicatorEmoji) {
    void whatsapp
      .sendMessage(botPhoneNumberId, userPhone, new Reaction(whatsappMessageId, '👀'))
      .catch((e) => logger.forBot().error(`Error sending typing indicator emoji: ${e ?? '[Unknown error]'}`))
  }
  return {}
}

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async ({
  client,
  ctx,
  input,
}) => {
  const token = await getAccessToken(client, ctx)
  const whatsapp = new WhatsAppAPI({ token, secure: false })
  const { conversationId, messageId } = input
  const { botPhoneNumberId, userPhone } = await _getConversationInfos(client, conversationId)
  const { whatsappMessageId } = await _getMessageInfos(client, messageId)
  await whatsapp.sendMessage(botPhoneNumberId, userPhone, new Reaction(whatsappMessageId))
  return {}
}

const _getConversationInfos = async (client: bp.Client, conversationId: string) => {
  const { conversation } = await client.getConversation({
    id: conversationId,
  })
  const { botPhoneNumberId, userPhone } = conversation.tags
  if (!botPhoneNumberId || !userPhone) {
    throw new RuntimeError('Missing tags in conversation tags')
  }
  return { botPhoneNumberId, userPhone }
}

const _getMessageInfos = async (client: bp.Client, messageId: string) => {
  const { message } = await client.getMessage({
    id: messageId,
  })
  const { id: whatsappMessageId } = message.tags
  if (!whatsappMessageId) {
    throw new RuntimeError('Missing WhatsApp message id in the message tags')
  }
  return { whatsappMessageId }
}
