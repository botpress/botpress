import { Result } from '../types'
import { safeParseJson } from '../utils'
import { AllEnvelopeEvents, allEnvelopeEventsSchema } from './schemas'
import * as bp from '.botpress'

export const parseWebhookEvent = (props: bp.HandlerProps): Result<AllEnvelopeEvents> => {
  const { body } = props.req
  if (!body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const parseResult = safeParseJson(body)
  if (!parseResult.success) {
    return {
      success: false,
      error: new Error(`Unable to parse Docusign Webhook Payload: ${parseResult.error.message}`),
    }
  }

  const zodResult = allEnvelopeEventsSchema.safeParse(parseResult.data)
  if (!zodResult.success) {
    const errorMsg = `Webhook handler received unexpected payload: ${zodResult.error.message}`
    props.logger.error(errorMsg)
    return { success: false, error: new Error(errorMsg) }
  }

  return {
    success: true,
    data: zodResult.data,
  }
}
