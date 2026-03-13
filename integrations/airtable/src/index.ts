import actions from './actions'
import { wrapAsyncFnWithTryCatch } from './api/error-handling'
import { AirtableApi } from './client'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async ({ client, ctx, logger }) => {
    const airtableClient = new AirtableApi({ client, ctx, logger })

    await wrapAsyncFnWithTryCatch(
      () => airtableClient.testConnection(),
      'Failed to test connection to Airtable'
    )()

    logger.forBot().info('Connection to Airtable successful')
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
