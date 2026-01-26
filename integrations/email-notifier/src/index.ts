import * as bp from '.botpress'
import actions from './actions'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
