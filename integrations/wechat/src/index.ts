import { handler } from './webhook'
import channels from './channels'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels,
  handler,
})

export default integration
