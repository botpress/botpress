import { isOAuthWizardUrl } from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import actions from './actions'
import { AirtableClient } from './airtable-api/airtable-client'
import { oauthWizardHandler } from './oauth-wizard'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async ({ client, ctx, logger }) => {
    try {
      const airtableClient = await AirtableClient.createFromStates({ client, ctx, logger })
      await airtableClient.testConnection()
    } catch (thrown) {
      const message = thrown instanceof Error ? thrown.message : String(thrown)
      throw new sdk.RuntimeError(`Failed to connect to Airtable. Re-run the setup wizard. (${message})`)
    }

    logger.forBot().info('Connection to Airtable successful')
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
