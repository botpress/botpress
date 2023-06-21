import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { register, unregister, createUser, createConversation } from './setup'
import { Integration, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const integration = new Integration({
  register,
  unregister,
  createUser,
  createConversation,
  actions,
  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration)
