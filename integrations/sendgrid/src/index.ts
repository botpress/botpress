import { RuntimeError } from '@botpress/sdk'
import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import actions from './actions'
import { parseError } from './misc/utils'
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

    try {
      const parsedBody = JSON.parse(props.req.body)

      if (!Array.isArray(parsedBody)) {
        return
      }

      for (const item of parsedBody) {
        // This approach is a bit stinky, but it's the only reliable way I could think of to not have
        // unhandled webhook events crash the handler when they can also come in with valid events
        const result = sendGridWebhookEventSchema.safeParse(item)
        if (!result.success) {
          props.logger.error('Unable to parse sendgrid webhook event', result.error, item)
          continue
        }

        await dispatchIntegrationEvent(props, result.data)
      }
    } catch (thrown: unknown) {
      if (thrown instanceof SyntaxError) {
        throw new RuntimeError('Unable to parse body')
      }

      throw parseError(props.ctx, thrown)
    }
  },
})
