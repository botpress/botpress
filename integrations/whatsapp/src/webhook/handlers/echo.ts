import { WhatsAppMessage, WhatsAppMessageEchoValue, WhatsAppEchoMessage } from '../../misc/types'
import { _handleMessage } from './messages'
import * as bp from '.botpress'

export const echoHandler = async (
  echo: WhatsAppEchoMessage,
  value: WhatsAppMessageEchoValue,
  props: bp.HandlerProps
) => {
  const { ctx, client, logger } = props

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      userPhone: echo.to,
      botPhoneNumberId: value.metadata.phone_number_id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: { number: echo.from },
    name: echo.from,
    discriminateByTags: ['number'],
  })

  const newMessage = await _handleMessage({
    message: echo,
    conversationId: conversation.id,
    userId: user.id,
    ctx,
    client,
    logger,
    tags: { id: echo.id, echoCreationType: echo.message_creation_type },
    createMessageOverride: async ({ type, payload }) => {
      const { messages } = await client._inner.importMessages({
        messages: [
          {
            type,
            payload,
            userId: user.id,
            conversationId: conversation.id,
            tags: { id: echo.id, echoCreationType: echo.message_creation_type },
            createdAt: new Date(parseInt(echo.timestamp) * 1000).toISOString(),
            discriminateByTags: ['id'],
          },
        ],
      })
      return messages[0] ? { message: messages[0] } : undefined
    },
  })

  if (newMessage && ctx.configuration.listenMessageEchoes) {
    await client.createEvent({
      type: 'onMessageEchoReceived',
      conversationId: conversation.id,
      messageId: newMessage.message.id,
      payload: {},
    })
  }
}
