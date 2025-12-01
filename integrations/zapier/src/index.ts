import { posthogHelper } from '@botpress/common'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from 'integration.definition'
import { actions } from './actions'
import { handler } from './webhook-events'
import * as bp from '.botpress'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  key: (bp.secrets as any).POSTHOG_KEY as string,
})
class ZapierIntegration extends bp.Integration {
  public constructor() {
    super({
      register: async () => {},
      unregister: async () => {},
      channels: {},
      actions,
      handler,
    })
  }
}

const integration = new ZapierIntegration()

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
