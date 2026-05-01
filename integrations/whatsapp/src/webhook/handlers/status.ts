import { getAuthenticatedWhatsappClient } from 'src/auth'
import { getMessageFromWhatsappMessageId } from 'src/misc/util'
import { Text } from 'whatsapp-api-js/messages'
import { WhatsAppStatusValue } from '../../misc/types'
import * as bp from '.botpress'

// Meta error codes for which a plain-text URL fallback is useful.
// 131053 = Media upload error (Meta rejected the media format/codec).
// 131052 = Media download error (Meta couldn't fetch the URL).
const MEDIA_FAILURE_CODES = new Set([131052, 131053])

const _getMediaUrlFromPayload = (
  message: { type: string; payload: { [k: string]: any } } | undefined
): string | undefined => {
  if (!message) return undefined
  switch (message.type) {
    case 'audio':
      return message.payload.audioUrl
    case 'video':
      return message.payload.videoUrl
    case 'image':
      return message.payload.imageUrl
    case 'file':
      return message.payload.fileUrl
    default:
      return undefined
  }
}

export const statusHandler = async (value: WhatsAppStatusValue, props: bp.HandlerProps) => {
  const { client, ctx, logger } = props

  if (value.status === 'sent') {
    const message = await getMessageFromWhatsappMessageId(value.id, client)
    if (!message) {
      logger
        .forBot()
        .debug(
          `The WhatsApp message was sent, but there is no corresponding message in Botpress. Botpress cannot create a messageSent event for WhatsApp message ID: ${value.id}`
        )
      return
    }

    await client.createEvent({
      type: 'messageSent',
      conversationId: message.conversationId,
      messageId: message.id,
      payload: {},
    })
  }

  if (value.status === 'delivered') {
    const message = await getMessageFromWhatsappMessageId(value.id, client)
    if (!message) {
      logger
        .forBot()
        .debug(
          `The WhatsApp message was delivered, but there is no corresponding message in Botpress. Botpress cannot create a messageDelivered event for WhatsApp message ID: ${value.id}`
        )
      return
    }

    await client.createEvent({
      type: 'messageDelivered',
      conversationId: message.conversationId,
      messageId: message.id,
      payload: {},
    })
  }

  if (value.status === 'read') {
    const message = await getMessageFromWhatsappMessageId(value.id, client)
    if (!message) {
      logger
        .forBot()
        .debug(
          `The WhatsApp message was read, but there is no corresponding message in Botpress. Botpress cannot create a messageRead event for WhatsApp message ID: ${value.id}`
        )
      return
    }

    await client.createEvent({
      type: 'messageRead',
      conversationId: message.conversationId,
      messageId: message.id,
      payload: {},
    })
  }

  if (value.status === 'failed') {
    const errorDetails =
      value.errors
        ?.map(
          (err) =>
            `${err.title} (${err.code}): ${err.message}${err.error_data?.details ? ` - ${err.error_data.details}` : ''}`
        )
        .join('; ') || 'Unknown error'

    logger
      .forBot()
      .error(
        `WhatsApp message delivery failed. Message ID: ${value.id}, Recipient: ${value.recipient_id}, Errors: ${errorDetails}`
      )

    const message = await getMessageFromWhatsappMessageId(value.id, client)
    if (!message) {
      logger
        .forBot()
        .debug(
          `The WhatsApp message delivery failed, but there is no corresponding message in Botpress. Botpress cannot create a messageFailed event for WhatsApp message ID: ${value.id}`
        )
      return
    }

    const mediaErrorCode = value.errors?.find((e) => MEDIA_FAILURE_CODES.has(e.code))?.code
    const mediaUrl = _getMediaUrlFromPayload(message)
    if (mediaErrorCode && mediaUrl) {
      try {
        const { conversation } = await client.getConversation({ id: message.conversationId })
        const { botPhoneNumberId, userPhone } = conversation.tags
        if (botPhoneNumberId && userPhone) {
          logger
            .forBot()
            .warn(
              `WhatsApp rejected the ${message.type} (code ${mediaErrorCode}); sending the URL as a plain text fallback to ${userPhone}.`
            )
          const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
          await whatsapp.sendMessage(botPhoneNumberId, userPhone, new Text(mediaUrl))
        }
      } catch (err) {
        logger.forBot().error('Failed to send the plain text URL fallback for the rejected media:', err)
      }
    }

    await client.createEvent({
      type: 'messageFailed',
      conversationId: message.conversationId,
      messageId: message.id,
      payload: {
        error: errorDetails,
      },
    })
  }
}
