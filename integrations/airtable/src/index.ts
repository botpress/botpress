import actions from './actions'
import { AirtableApi } from './client'
import { RuntimeError } from '@botpress/client'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async ({ ctx }) => {
    try {
      const airtable = new AirtableApi(
        ctx.configuration.accessToken,
        ctx.configuration.baseId,
        ctx.configuration.endpointUrl
      )
      await airtable.testConnection()
    } catch (thrown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError('Failed to connect to Airtable', error)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
