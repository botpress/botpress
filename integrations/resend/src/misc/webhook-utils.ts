import { Result } from './types'
import { safeParseJson } from './utils'
import * as bp from '.botpress'

export const parseWebhookData = (props: bp.HandlerProps): Result<unknown> => {
  if (!props.req.body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const result = safeParseJson(props.req.body)
  if (!result.success) {
    props.logger.error('Unable to parse Resent Webhook Payload', result.error)
    return { success: false, error: result.error }
  }

  const parsedBody = result.data

  return {
    success: true,
    data: parsedBody,
  }
}
