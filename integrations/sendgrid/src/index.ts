import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import actions from './actions'
import { parseError, safeParseJson } from './misc/utils'
import { dispatchIntegrationEvent } from './webhook-events/event-dispatcher'
import { sendGridWebhookEventSchema } from './webhook-events/sendgrid-webhook-schemas'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx }) => {
    sgClient.setApiKey(ctx.configuration.apiKey)
    sgMail.setClient(sgClient)

    try {
      const [response] = await sgClient.request({
        method: 'GET',
        url: '/v3/scopes',
      })

      if (response && response.statusCode < 200 && response.statusCode >= 300) {
        // noinspection ExceptionCaughtLocallyJS
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
    if (!props.req.body) {
      return
    }

    const parsedBody = safeParseJson(props.req.body)

    if (!parsedBody.success) {
      props.logger.error('Unable to parse SendGrid request body', parsedBody.error)
      return
    }

    if (!Array.isArray(parsedBody)) {
      return
    }

    for (const item of parsedBody) {
      // This approach is a bit stinky. However, it's the only reliable way I could think of to not
      // have unhandled webhook events crash the handler when they can also come in with valid events
      // (Using ZodArray outside the loop can cause the aforementioned issue)
      const result = sendGridWebhookEventSchema.safeParse(item)
      if (!result.success) {
        props.logger.error('Unable to parse sendgrid webhook event', result.error, item)
        continue
      }

      await dispatchIntegrationEvent(props, result.data)
    }
  },
})
