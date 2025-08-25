import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { actions } from './actions'
import { register, unregister } from './setup'
import { handler } from './webhook-events'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
