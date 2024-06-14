import { browsePage } from './actions/browse-page'
import { captureScreenshot } from './actions/capture-screenshot'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    captureScreenshot,
    browsePage,
  },
  channels: {},
  handler: async () => {},
})
