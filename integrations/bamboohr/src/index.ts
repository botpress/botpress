import * as bp from '.botpress'
import { actions } from './actions'
import { handler } from './handler'
import { register, unregister } from './setup'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler,
})
