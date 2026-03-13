import actions from './actions'
import { AirtableApi } from './client'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async ({ client, ctx, logger }) => {
    const airtableClient = new AirtableApi({ client, ctx, logger })

    await airtableClient.testConnection()

    logger.forBot().info('Connection to Airtable successful')
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
