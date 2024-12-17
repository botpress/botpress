import { RuntimeError } from '@botpress/client'
import { getAccessToken } from 'src/misc/whatsapp'
import WhatsAppAPI from 'whatsapp-api-js'
import { Reaction } from 'whatsapp-api-js/messages'
import * as bp from '.botpress'

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async ({
  client,
  ctx,
  input,
}) => {
  const token = await getAccessToken(client, ctx)
  const whatsapp = new WhatsAppAPI({ token, secure: false })
  const { conversationId, messageId } = input
  const { phoneNumberId, userPhone } = await getConversationInfos(client, conversationId)
  const { whatsappMessageId } = await getMessageInfos(client, messageId)
  await whatsapp.markAsRead(phoneNumberId, whatsappMessageId)
  if (ctx.configuration.typingIndicatorEmoji) {
    await whatsapp.sendMessage(phoneNumberId, userPhone, new Reaction(whatsappMessageId, '👀'))
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
  const { phoneNumberId, userPhone } = await getConversationInfos(client, conversationId)
  const { whatsappMessageId } = await getMessageInfos(client, messageId)
  await whatsapp.sendMessage(phoneNumberId, userPhone, new Reaction(whatsappMessageId))
  return {}
}

const getConversationInfos = async (client: bp.Client, conversationId: string) => {
  const { conversation } = await client.getConversation({
    id: conversationId,
  })
  const { phoneNumberId, userPhone } = conversation.tags
  if (!phoneNumberId || !userPhone) {
    throw new RuntimeError('Missing tags in conversation tags')
  }
  return { phoneNumberId, userPhone }
}

const getMessageInfos = async (client: bp.Client, messageId: string) => {
  const { message } = await client.getMessage({
    id: messageId,
  })
  const { id: whatsappMessageId } = message.tags
  if (!whatsappMessageId) {
    throw new RuntimeError('Missing Whatsapp message id in the message tags')
  }
  return { whatsappMessageId }
}
