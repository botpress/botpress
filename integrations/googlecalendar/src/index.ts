import { posthogHelper } from '@botpress/common'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME } from 'integration.definition'
import { actions } from './actions'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

@posthogHelper.wrapIntegration({
  integrationName: INTEGRATION_NAME,
  key: (bp.secrets as any).POSTHOG_KEY as string,
})
class GoogleCalendarIntegration extends bp.Integration {
  public constructor() {
    super({
      register,
      unregister,
      actions,
      channels: {},
      handler,
    })
  }
}

const integration = new GoogleCalendarIntegration()

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
