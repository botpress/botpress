import channels from './channels'
import { handler } from './webhook'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels,
  handler,
})

export default integration
