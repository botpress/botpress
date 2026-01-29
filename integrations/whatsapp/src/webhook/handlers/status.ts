import { WhatsAppStatusValue } from '../../misc/types'
import * as bp from '.botpress'

export const statusHandler = async (value: WhatsAppStatusValue, props: bp.HandlerProps) => {
  const { logger } = props

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
