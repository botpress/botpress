import actions from './actions'
import { AirtableClient } from './airtable-api/airtable-client'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async ({ client, ctx, logger }) => {
    const airtableClient = await AirtableClient.createFromStates({ client, ctx, logger })

    await airtableClient.testConnection()

    logger.forBot().info('Connection to Airtable successful')
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
