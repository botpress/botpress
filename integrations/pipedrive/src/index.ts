import actions from './actions' 
import * as bp from '.botpress'
import { getApiConfig } from './auth'

export const register: bp.IntegrationProps['register'] = async ({ ctx, logger }) => {
  await getApiConfig({ ctx })
  logger.forBot().info('Pipedrive integration registered')
}

export const unregister: bp.IntegrationProps['unregister'] = async ({ logger }) => {
  logger.forBot().info('Pipedrive integration unregistered')
}

export default new bp.Integration({
  register,   
  unregister,
  actions, 
  channels: {},
  handler: async () => {},
})
