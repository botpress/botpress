import { RuntimeError } from '@botpress/sdk'
import { createLead, updateLead, createContact, searchContacts, searchLeads } from './actions'
import { KommoClient } from './kommo-api'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    try {
      await kommoClient.searchLeads('')
      logger.forBot().info('Connection to Kommo Successful')
    } catch (error) {
      logger.forBot().error('Connection to Kommo Failed', { error })
      throw new RuntimeError('failed to connect to Kommo, Please check your access token and subdomain are correct.  ')
    }
  },
  unregister: async () => {},

  actions: {
    createLead,
    updateLead,
    searchLeads,
    createContact,
    searchContacts,
  },
  channels: {},
  handler: async () => {},
})
