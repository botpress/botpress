import * as bp from '.botpress'

import { actions } from './actions'
import { channels } from './channels'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels,
  handler: async () => {},
})
