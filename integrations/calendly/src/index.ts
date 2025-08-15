import * as bp from '.botpress'
import actions from './actions'
import { register, unregister } from './setup'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler: async () => {},
})
