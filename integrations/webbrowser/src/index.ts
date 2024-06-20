import { browsePage } from './actions/browse-page'
import { captureScreenshot } from './actions/capture-screenshot'
import { webSearch } from './actions/web-search'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    captureScreenshot,
    browsePage,
    webSearch,
  },
  channels: {},
  handler: async () => {},
})
