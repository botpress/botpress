import actions from './actions'
import { register, unregister, handler, channels } from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  handler,
  actions,
  channels,
})
