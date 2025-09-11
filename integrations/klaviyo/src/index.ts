import { register, unregister } from './setup'
import actions from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler: async () => {},
})
