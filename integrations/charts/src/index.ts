import { actionImplementations } from './actions'

import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: actionImplementations,
  channels: {},
  handler: async () => {},
})
