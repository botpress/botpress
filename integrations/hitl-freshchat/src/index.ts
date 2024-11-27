import { actions } from './actions'
import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels,
  handler
})
