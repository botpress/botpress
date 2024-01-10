import actions from './actions'
import { register, unregister, channels, handler } from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler,
})
