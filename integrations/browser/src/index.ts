import { browsePages } from './actions/browse-pages'
import { captureScreenshot } from './actions/capture-screenshot'
import { webSearch } from './actions/web-search'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    captureScreenshot,
    browsePages,
    webSearch,
  },
  channels: {},
  handler: async () => {},
})
