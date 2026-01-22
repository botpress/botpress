import * as bp from '../../.botpress'
import { getTwilioClient } from '../twilio'
import { getPhoneNumbers, getTwilioChannelType } from '../utils'

async function sendTypingIndicator({
  client,
  ctx,
  conversationId,
  messageId,
}: {
  client: bp.Client
  ctx: bp.Context
  conversationId: string
  messageId: string
}): Promise<void> {
  const { conversation } = await client.getConversation({ id: conversationId })
  const { to } = getPhoneNumbers(conversation)
  const channelType = getTwilioChannelType(to)

  // Typing indicators only supported for WhatsApp
  if (channelType !== 'whatsapp') {
    return
  }

  const { message } = await client.getMessage({ id: messageId })
  const twilioMessageSid = message.tags?.id

  if (!twilioMessageSid) {
    return
  }

  const twilioClient = getTwilioClient(ctx)

  // The Twilio SDK doesn't expose the v2 Indicators API natively yet (Its in beta),
  // so we use client.request() to call the REST endpoint directly
  await twilioClient.request({
    method: 'post',
    uri: 'https://messaging.twilio.com/v2/Indicators/Typing.json',
    data: {
      messageId: twilioMessageSid,
      channel: 'whatsapp',
    },
  })
}

export const startTypingIndicator: bp.IntegrationProps['actions']['startTypingIndicator'] = async ({
  client,
  ctx,
  input,
  logger,
}) => {
  try {
    const { conversationId, messageId } = input
    await sendTypingIndicator({ client, ctx, conversationId, messageId })
  } catch (error) {
    const thrown = error instanceof Error ? error : new Error(String(error))
    logger.forBot().warn(`Failed to send typing indicator: ${thrown.message ?? '[Unknown error]'}`)
  }
  return {}
}

export const stopTypingIndicator: bp.IntegrationProps['actions']['stopTypingIndicator'] = async () => {
  // Twilio's typing indicator automatically stops after 25 seconds or when a message is sent.
  return {}
}
