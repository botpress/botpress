import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { validateConfiguration, AmazonConnectConfiguration } from './client'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    /**
     * This is called when an integration configuration is saved.
     * Validates AWS credentials and Amazon Connect configuration.
     */
    logger.forBot().info('Registering Amazon Connect integration...')

    // Validate configuration
    const validation = await validateConfiguration(ctx.configuration as unknown as AmazonConnectConfiguration)

    if (!validation.valid) {
      const errorMessage = `Invalid Amazon Connect configuration:\n${validation.errors.join('\n')}`
      logger.forBot().error(errorMessage)
      throw new sdk.RuntimeError(errorMessage)
    }

    logger.forBot().info('Amazon Connect integration registered successfully')
    logger.forBot().info('Configure your webhook URL in your Amazon Connect contact flow to receive messages')
  },

  unregister: async ({ logger }) => {
    /**
     * This is called when a bot removes the integration.
     * Performs any necessary cleanup.
     */
    logger.forBot().info('Unregistering Amazon Connect integration...')
    logger.forBot().info('Amazon Connect integration unregistered successfully')
  },

  actions: {},
  channels: {},
  handler: async () => {},
})
