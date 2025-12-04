import { posthogHelper } from '@botpress/common'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { actions } from './actions'
import { channels } from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

export const posthogConfig = {
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: bp.secrets.POSTHOG_KEY,
}
@posthogHelper.wrapIntegration(posthogConfig)
class GmailIntegration extends bp.Integration {
  public constructor() {
    super({
      register,
      unregister,
      actions,
      channels,
      handler,
    })
  }
}

const integration = new GmailIntegration()

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
