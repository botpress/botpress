import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { actions } from './actions'
import { channels } from './channels'
import { executeConversationCreated, handleConversationMessage } from './events'
import { isSuncoWebhookPayload } from './messaging-events'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  actions,
  channels,
  handler: async ({ req, client, logger }) => {
    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }

    const data = JSON.parse(req.body)

    if (!isSuncoWebhookPayload(data)) {
      logger.forBot().warn('Received an invalid payload from Sunco')
      return
    }

    for (const event of data.events) {
      if (event.type === 'conversation:create') {
        await executeConversationCreated({ event, client, logger })
      } else if (event.type === 'conversation:message') {
        await handleConversationMessage(event, client, logger)
      } else {
        console.warn(`Received an event of type ${event.type}, which is not supported`)
      }
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
