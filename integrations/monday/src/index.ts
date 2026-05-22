import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { RuntimeError } from '@botpress/sdk'
import * as actions from 'src/actions'
import { getMondayClient } from 'src/misc/auth'
import { oauthWizardHandler } from './oauth-wizard'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ client, ctx }) => {
    try {
      const mondayClient = await getMondayClient({ client, ctx })
      const validationError = await mondayClient.validateAccessToken()

      if (validationError) {
        throw new RuntimeError('Invalid Monday credentials. Please reconnect your account or provide a valid token.')
      }

      await client.configureIntegration({
        identifier: ctx.webhookId,
      })
    } catch (thrown) {
      throw thrown
    }
  },
  unregister: async () => {
    try {
      return
    } catch (thrown) {
      throw thrown
    }
  },
  actions,
  channels: {},
  handler: async (props) => {
    try {
      if (isOAuthWizardUrl(props.req.path)) {
        return await oauthWizardHandler(props)
      }

      return
    } catch (thrown) {
      throw thrown
    }
  },
})
