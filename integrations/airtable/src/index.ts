import actions from './actions'
import * as botpress from '.botpress'

export default new botpress.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
