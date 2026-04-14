import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Unregister process for Zoom integration invoked. No resources to clean up.')
}
