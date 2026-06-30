import * as sdk from '@botpress/sdk'
import actions from './actions'
import { getSharepointClient } from './client'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info(`Registering SharePoint Excel integration for bot: ${ctx.botId}. Performing connection test.`)
    const spClient = getSharepointClient(ctx.configuration)
    try {
      const siteId = await spClient.getSiteId()
      logger.forBot().info(`SharePoint connection test successful during registration. Site ID: ${siteId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.forBot().error(`SharePoint connection test failed during registration: ${message}`)
      throw new sdk.RuntimeError(`SharePoint connection validation failed during registration: ${message}`)
    }
  },
  unregister: async ({ ctx, logger }) => {
    logger.forBot().info(`Unregistering SharePoint Excel integration for bot: ${ctx.botId}`)
  },
  actions,
  channels: {},
  handler: async () => {},
})
