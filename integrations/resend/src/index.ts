import { RuntimeError } from '@botpress/sdk'
import { ErrorResponse, Resend } from 'resend'
import actions from './actions'
import { ResendError } from './misc/ResendError'
import { parseWebhookData } from './misc/webhook-utils'
import { dispatchIntegrationEvent } from './webhook-events/event-dispatcher'
import { emailWebhookEventPayloadSchemas } from './webhook-events/schemas/email'
import * as bp from '.botpress'

const FALLBACK_ERROR_RESP: ErrorResponse = { message: 'Unable to evaluate API key validity', name: 'application_error' }

export default new bp.Integration({
  register: async ({ ctx }) => {
    const client = new Resend(ctx.configuration.apiKey)

    // https://resend.com/docs/dashboard/emails/send-test-emails
    const { data, error } = await client.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'API Key Validation Test',
      text: '<p>Testing API key validity</p>',
    })

    if (error || !data) {
      const cause = new ResendError(error ?? FALLBACK_ERROR_RESP)
      throw new RuntimeError('An invalid API key was provided.', cause)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async (props) => {
    const result = parseWebhookData(props)
    if (!result.success) {
      props.logger.forBot().error(result.error.message, result.error)
      return
    }

    const eventPayload = emailWebhookEventPayloadSchemas.parse(result.data)
    await dispatchIntegrationEvent(props, eventPayload)
  },
})
