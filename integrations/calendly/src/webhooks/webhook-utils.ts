import type { Result } from '../types'
import { safeParseJson } from '../utils'
import { type InviteeEvent, inviteeEventSchema } from './schemas'
import type * as bp from '.botpress'

export const parseWebhookEvent = (props: bp.HandlerProps): Result<InviteeEvent> => {
  if (!props.req.body?.trim()) {
    return { success: false, error: new Error('Received empty webhook payload') }
  }

  const result = safeParseJson(props.req.body)
  if (!result.success) {
    return { success: false, error: new Error('Unable to parse Calendly Webhook Payload', result.error) }
  }

  const parseResult = inviteeEventSchema.safeParse(result.data)
  if (!parseResult.success) {
    props.logger.error('Webhook handler received unexpected payload', parseResult.error)
    return { success: false, error: new Error('Invalid webhook payload structure', parseResult.error) }
  }

  return {
    success: true,
    data: parseResult.data,
  }
}
