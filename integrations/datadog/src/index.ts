import { posthogHelper } from '@botpress/common'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { actions } from './actions'
import { register, unregister } from './setup'
import * as bp from '.botpress'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
  key: (bp.secrets as any).POSTHOG_KEY as string,
})
class DatadogIntegration extends bp.Integration {
  public constructor() {
    super({
      register,
      unregister,
      actions,
      channels: {},
      handler: async () => {},
    })
  }
}

const integration = new DatadogIntegration()

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

