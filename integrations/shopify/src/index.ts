import * as botpress from '.botpress'
import actions from './actions'
import { register } from './setup/register'
import { unregister } from './setup/unregister'
import { handler } from './handler'

console.info('Starting Shopify Integration')

export default new botpress.Integration({
  register,
  unregister: async ({ logger }) => {
    logger.forBot().debug('in unregister 1')
    console.log('in unregister 1')
  },
  actions,
  handler,
})
