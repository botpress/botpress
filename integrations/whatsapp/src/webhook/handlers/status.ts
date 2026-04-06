import { getMessageFromWhatsappMessageId } from 'src/misc/util'
import { WhatsAppStatusValue } from '../../misc/types'
import * as bp from '.botpress'

export const statusHandler = async (value: WhatsAppStatusValue, props: bp.HandlerProps) => {
  const { client, logger } = props

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
