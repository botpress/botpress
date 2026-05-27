import { getClient } from '../client'
import type { UnregisterFunction } from '../misc/types'

export const unregister: UnregisterFunction = async ({ ctx, client, logger }) => {
  // Log the action to indicate that the unregister process has been initiated
  logger.forBot().info('Unregister process for GoHighLevel integration invoked. No resources to clean up.')
}
