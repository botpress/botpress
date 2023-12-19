import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import axios, { isAxiosError } from 'axios'
import { constants } from 'http2'
import { TriggerRequestBody, IntegrationEventSchema, EventSchema } from './misc/types'
import { getTriggerSubscribers, handleIntegrationEvent, unsubscribeZapierHook } from './misc/utils'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  channels: {},
  actions: {
    trigger: async ({ ctx, input, client, logger }) => {
      logger.forBot().debug('Zapier trigger called with payload:', input)

      const subscribers = await getTriggerSubscribers({ ctx, client, logger })

      logger.forBot().debug(`Notifying ${subscribers.length} Zapier trigger REST hooks`)

      for (const { url: zapierHookUrl } of subscribers) {
        const request: TriggerRequestBody = {
          botId: ctx.botId,
          data: input.data,
          correlationId: input.correlationId,
        }

        await axios
          .post(zapierHookUrl, request)
          .then(() => {
            logger.forBot().info(`Successfully notified Zapier trigger REST hook: ${zapierHookUrl}`)
          })
          .catch(async (e) => {
            logger.forBot().warn(`Failed to notify Zapier trigger REST hook: ${zapierHookUrl} (Error: ${e.message})`)

            if (isAxiosError(e) && e.response?.status === constants.HTTP_STATUS_GONE) {
              // Zapier REST hooks will send back a HTTP 410 Gone error if the hook is no longer valid.
              await unsubscribeZapierHook({ url: zapierHookUrl, ctx, client, logger })
            }
          })
      }

      return {}
    },
  },
  handler: async ({ req, ctx, client, logger }) => {
    if (!req.body) {
      logger.forBot().warn('Event handler received an empty body')
      return
    }

    logger.forBot().debug('Handler received request from Zapier with payload:', req.body)

    const body = JSON.parse(req.body)

    const integrationEventParse = IntegrationEventSchema.safeParse(body)
    if (integrationEventParse.success) {
      await handleIntegrationEvent({ event: integrationEventParse.data, ctx, client, logger })
      return
    }

    const eventParse = EventSchema.safeParse(body)
    if (!eventParse.success) {
      logger.forBot().warn('Received invalid event:', eventParse.error)
      return
    }

    await client.createEvent({
      type: 'zapier:event',
      payload: eventParse.data,
    })
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
