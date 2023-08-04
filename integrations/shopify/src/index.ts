import actions from './actions'
import { handler } from './handler'
import { register } from './setup/register'
import { unregister } from './setup/unregister'
import * as botpress from '.botpress'

console.info('Starting Shopify Integration')

export default new botpress.Integration({
  register,
  unregister,
  actions,
  handler,
})
