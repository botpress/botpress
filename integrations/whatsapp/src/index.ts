import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import actions from 'src/actions'
import channels from './channels'
import { createConversationHandler as createConversation } from './create-conversation'
import { register, unregister } from './setup'
import { handler } from './webhook'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  actions,
  createConversation, // TODO: Remove and implement proactive-conversation interface
  channels,
  handler,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
