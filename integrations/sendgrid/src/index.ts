import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import actions from './actions'
import { parseError } from './misc/utils'
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
  handler: async () => {},
})
