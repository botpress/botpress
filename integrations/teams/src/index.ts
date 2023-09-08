import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

console.info('starting integration teams')

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
