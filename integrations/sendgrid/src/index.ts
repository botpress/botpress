import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import actions from './actions'
import { isSendGridWebhookResp, parseError } from './misc/utils'
import { dispatchIntegrationEvent } from './webhook-events/event-dispatcher'
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
      if (!isSendGridWebhookResp(parsedBody)) {
        return
      }

      for (const item of parsedBody) {
        await dispatchIntegrationEvent(props, item)
      }
    } catch (thrown: unknown) {
      parseError(props.ctx, thrown, 'Unable to parse body')
    }
  },
})
