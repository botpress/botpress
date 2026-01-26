import * as bp from '.botpress'

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Chatwoot integration unregistered')
}
