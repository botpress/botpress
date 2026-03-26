import { LinearOauthClient } from './misc/linear'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  logger.forBot().info('Registering integration...')
  await LinearOauthClient.create({ client, ctx })
  logger.forBot().info('Integration registered successfully.')
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}
