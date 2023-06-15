import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import { channels } from './channels'
import { handler } from './handler'
import * as botpress from '.botpress'

sentryHelpers.init({
  dsn: botpress.secrets.SENTRY_DSN,
  environment: botpress.secrets.SENTRY_ENVIRONMENT,
  release: botpress.secrets.SENTRY_RELEASE,
})

console.info('starting integration teams')

const integration = new botpress.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration)
