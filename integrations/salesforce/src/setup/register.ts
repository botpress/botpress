import { getClient } from 'src/utils'
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ logger, ctx }) => {
  /**
   * This is called when a bot installs the integration.
   * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
   */
  try {
    const client = await getClient(ctx.configuration)
    await client.login()
    logger.forBot().debug('Successfully authenticated with Salesforce')
  } catch (err) {
    logger.forBot().error(`Could not authenticate with Salesforce, please verify your credentials: ${err}`)
  }
}
