import * as actions from 'src/actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
