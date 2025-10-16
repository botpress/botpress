import { RuntimeError } from '@botpress/sdk'
import actions from './actions'
import { AirtableApi } from './client'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async ({ ctx, logger }) => {
    const airtableClient = new AirtableApi(
      ctx.configuration.accessToken,
      ctx.configuration.baseId,
      ctx.configuration.endpointUrl
    )

    try {
      await airtableClient.testConnection()
      logger.forBot().info('Connection to Airtable successful')
    } catch (thrown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError('Failed to test connection to Airtable', error)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
