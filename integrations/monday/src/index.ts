import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import * as actions from 'src/actions'
import { getMondayClient } from 'src/misc/auth'
import { oauthWizardHandler } from './oauth-wizard'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ client, ctx }) => {
    await getMondayClient({ client, ctx })

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
