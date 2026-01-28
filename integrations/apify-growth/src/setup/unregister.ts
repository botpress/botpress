import type { UnregisterFunction } from '../misc/types'

export const unregister: UnregisterFunction = async ({ logger }) => {
  // Log the action to indicate that the unregister process has been initiated
  logger.forBot().info('Unregister process for Apify integration invoked. No resources to clean up.')
}
