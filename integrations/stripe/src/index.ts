import actions from './actions'
import { register, unregister, channels, handler } from './setup'
import * as botpress from '.botpress'

console.info('Starting Stripe integration')

export default new botpress.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})
