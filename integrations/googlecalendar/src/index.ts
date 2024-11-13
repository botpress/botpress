import { actions } from './actions'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler,
})
