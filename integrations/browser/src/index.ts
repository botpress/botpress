import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { browsePages } from './actions/browse-pages'
import { captureScreenshot } from './actions/capture-screenshot'
import { discoverUrls } from './actions/discover-urls'
import { getWebsiteLogo } from './actions/get-website-logo'
import { webSearch } from './actions/web-search'
import { trackEvent } from './tracking'
import * as bp from '.botpress'

const integrationConfig: bp.IntegrationProps = {
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
}

export default posthogHelper.wrapIntegration(
  {
    integrationName: INTEGRATION_NAME,
    key: bp.secrets.POSTHOG_KEY,
    integrationVersion: INTEGRATION_VERSION,
  },
  integrationConfig
)
