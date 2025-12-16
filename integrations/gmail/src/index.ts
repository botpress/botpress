import { posthogHelper } from '@botpress/common'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { actions } from './actions'
import { channels } from './channels'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

export const posthogConfig: posthogHelper.PostHogConfig = {
  integrationName: INTEGRATION_NAME,
  key: bp.secrets.POSTHOG_KEY,
  integrationVersion: INTEGRATION_VERSION,
}
const integrationConfig: bp.IntegrationProps = {
  register,
  unregister,
  actions,
  channels,
  handler,
}

const integration = posthogHelper.wrapIntegration(posthogConfig, integrationConfig)

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
