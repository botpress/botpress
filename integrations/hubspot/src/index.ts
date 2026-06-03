import actions from './actions'
import { channels } from './hitl/channel-handler'
import { register, unregister } from './setup'
import { handler } from './webhook'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})
