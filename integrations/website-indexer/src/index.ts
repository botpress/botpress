import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when a bot installs the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {
    indexPage: async ({ input: { pageUrl }, logger, client }) => {
      logger.forBot().debug(`Indexing page ${pageUrl}`)

      const size = 1000
      const response = await client.upsertFile({ key: pageUrl, size })
      logger.forBot().debug(`Page ${pageUrl} indexed`)
      logger.forBot().debug(`Response: ${JSON.stringify(response)}`)

      return {}
    },
  },
  channels: {},
  handler: async () => {},
})
