import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { browsePages } from './actions/browse-pages'
import { captureScreenshot } from './actions/capture-screenshot'
import { discoverUrls } from './actions/discover-urls'
import { getWebsiteLogo } from './actions/get-website-logo'
import { webSearch } from './actions/web-search'
import { trackEvent } from './tracking'
import * as bp from '.botpress'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
})
class BrowserIntegration extends bp.Integration {
  public constructor() {
    super({
      register: async ({ ctx }) => {
        await trackEvent('browser_registered', {
          integrationId: ctx.integrationId,
        })
      },
      unregister: async ({ ctx }) => {
        await trackEvent('browser_unregistered', {
          integrationId: ctx.integrationId,
        })
      },
      actions: {
        captureScreenshot,
        browsePages,
        webSearch,
        discoverUrls,
        getWebsiteLogo,
      },
      channels: {},
      handler: async () => {},
    })
  }
}

export default new BrowserIntegration()
