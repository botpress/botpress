import { InviteeEvent, inviteeEventSchema } from 'definitions/events'
import { Result } from 'src/types'
import { safeParseJson } from '../utils'
import * as bp from '.botpress'

export const parseWebhookData = (props: bp.HandlerProps): Result<InviteeEvent> => {
  if (!props.req.body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const result = safeParseJson(props.req.body)
  if (!result.success) {
    return { success: false, error: new Error('Unable to parse Calendly Webhook Payload', result.error) }
  }

  const parseResult = inviteeEventSchema.safeParse(result.data)
  if (!parseResult.success) {
    return { success: false, error: new Error('Invalid Webhook payload structure', parseResult.error) }
  }

  return {
    success: true,
    data: parseResult.data,
  }
}
