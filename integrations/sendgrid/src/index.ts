import actions from './actions'
import { SendGridClient } from './misc/sendgrid-api'
import { parseError } from './misc/utils'
import { parseWebhookData, verifyWebhookSignature } from './misc/webhook-utils'
import { dispatchIntegrationEvent } from './webhook-events/event-dispatcher'
import { webhookEventPayloadSchemas } from './webhook-events/schemas'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx }) => {
    try {
      const httpClient = new SendGridClient(ctx.configuration.apiKey)
      const response = await httpClient.getPermissionScopes()

      if (response && (response.statusCode < 200 || response.statusCode >= 300)) {
        throw new Error(`The status code '${response.statusCode}' is not within the accepted bounds.`)
      }
    } catch (thrown: unknown) {
      throw parseError(ctx, thrown, 'An invalid API key was provided')
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async (props) => {
    const data = parseWebhookData(props)
    if (data === null) return

    if (data.publicKey !== null && !verifyWebhookSignature(data)) {
      props.logger.forBot().error('The provided SendGrid webhook public signature key is invalid')
      return
    }

    if (!Array.isArray(data.body)) {
      return
    }

    for (const item of data.body) {
      // This approach is a bit stinky. However, it's the only reliable way I could think of to not
      // have unhandled webhook events crash the handler when they can also come in with valid events
      // (Using ZodArray outside the loop can cause the aforementioned issue)
      const result = webhookEventPayloadSchemas.safeParse(item)
      if (!result.success) {
        props.logger.error('Unable to parse sendgrid webhook event', result.error, item)
        continue
      }

      await dispatchIntegrationEvent(props, result.data)
    }
  },
})
