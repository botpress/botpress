import { getMessageFromWhatsappMessageId } from 'src/misc/util'
import { WhatsAppStatusValue } from '../../misc/types'
import * as bp from '.botpress'

export const statusHandler = async (value: WhatsAppStatusValue, props: bp.HandlerProps) => {
  const { client, logger } = props

  if (value.status === 'read') {
    const message = await getMessageFromWhatsappMessageId(value.id, client)
    if (!message) {
      logger.forBot().error(`No message found for WhatsApp message ID ${value.id}, cannot create messageRead event`)
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
  }
}
