import { RuntimeError } from '@botpress/sdk'
import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import actions from './actions'
import { parseError } from './misc/utils'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx }) => {
    sgClient.setApiKey(ctx.configuration.apiKey)
    sgMail.setClient(sgClient)

    await sgClient.request(
      {
        method: 'GET',
        url: '/v3/scopes',
      },
      (error, [resp]) => {
        if (error) {
          throw parseError(error)
        }

        if (resp && resp.statusCode < 200 && resp.statusCode >= 300) {
          throw new RuntimeError('An invalid API key was provided.')
        }
      }
    )
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
