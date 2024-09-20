import actions from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {
    throw new Error('Not implemented')
  },
})
