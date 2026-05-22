import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import { RuntimeError } from '@botpress/sdk'
import * as actions from 'src/actions'
import { getMondayClient } from 'src/misc/auth'
import { oauthWizardHandler } from './oauth-wizard'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ client, ctx }) => {
    const mondayClient = await getMondayClient({ client, ctx })

    if (!(await mondayClient.validateAccessToken())) {
      throw new RuntimeError('Invalid Monday credentials. Please reconnect your account or provide a valid token.')
    }

    await client.configureIntegration({
      identifier: ctx.webhookId,
    })
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async (props) => {
    if (isOAuthWizardUrl(props.req.path)) {
      return await oauthWizardHandler(props)
    }

    return
  },
})
