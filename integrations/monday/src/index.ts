import { RuntimeError } from '@botpress/sdk'
import * as actions from 'src/actions'
import { getMondayClient } from 'src/misc/auth'
import { isOAuthWizardUrl, oauthWizardHandler } from './oauth-wizard'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ client, ctx }) => {
    try {
      const mondayClient = await getMondayClient({ client, ctx })
      await mondayClient.validateAccessToken()

      await client.configureIntegration({
        identifier: ctx.webhookId,
      })
    } catch (thrown) {
      if (thrown instanceof RuntimeError) {
        throw thrown
      }

      const message = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Failed to configure Monday integration. Please reconnect your account. (${message})`)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async (props) => {
    if (isOAuthWizardUrl(props.req.path)) {
      return await oauthWizardHandler(props)
    }
    return { status: 404, body: 'Invalid endpoint' }
  },
})
