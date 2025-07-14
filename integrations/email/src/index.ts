import { actions } from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  handler: async () => {},
  channels: {},
})
