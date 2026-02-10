import { formatPhoneNumber } from 'src/misc/phone-number-to-whatsapp'
import { getConversationFromWhatsappUserPhone } from 'src/misc/util'
import { WhatsAppStatusValue } from '../../misc/types'
import * as bp from '.botpress'

export const statusHandler = async (value: WhatsAppStatusValue, props: bp.HandlerProps) => {
  const { client, logger } = props

  if (value.status === 'read') {
    const userPhone = formatPhoneNumber(value.recipient_id)
    const conversation = await getConversationFromWhatsappUserPhone(userPhone, client)
    if (!conversation) {
      logger
        .forBot()
        .error(`No conversation found for recipient ID ${value.recipient_id}, cannot create messageRead event`)
      throw new Error(`No conversation found for recipient ID ${value.recipient_id}, cannot create messageRead event`)
    }
    await client.createEvent({
      type: 'messageRead',
      conversationId: conversation.id,
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
