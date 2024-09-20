import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import axios, { isAxiosError } from 'axios'
import { constants } from 'http2'
import { getTriggerSubscribers, saveTriggerSubscribers, unsubscribeZapierHook } from './helpers'
import { Client, TriggerRequestBody, IntegrationEvent, IntegrationEventSchema, EventSchema, Event } from './types'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  channels: {},
  actions: {
    trigger: async ({ ctx, input, client, logger }) => {
      console.info(`Zapier trigger called with payload: ${JSON.stringify(input)}`)

      const subscribers = await getTriggerSubscribers(ctx, client)

      console.info(`Notifying ${subscribers.length} Zapier trigger REST hooks`)

      for (const { url: zapierHookUrl } of subscribers) {
        const request: TriggerRequestBody = {
          botId: ctx.botId,
          data: input.data,
          correlationId: input.correlationId,
        }

        await axios
          .post(zapierHookUrl, request)
          .then(() => {
            console.info(`Successfully notified Zapier trigger REST hook: ${zapierHookUrl}`)
          })
          .catch(async (e) => {
            logger.forBot().warn(`Failed to notify Zapier trigger REST hook: ${zapierHookUrl} (Error: ${e.message})`)
            console.warn(`Failed to notify Zapier trigger REST hook: ${zapierHookUrl} (Error: ${e.message})`)

            if (isAxiosError(e) && e.response?.status === constants.HTTP_STATUS_GONE) {
              // Zapier REST hooks will send back a HTTP 410 Gone error if the hook is no longer valid.
              await unsubscribeZapierHook(zapierHookUrl, ctx, client)
            }
          })
      }

      return {}
    },
  },
  handler: async ({ req, ctx, client }) => {
    if (!req.body) {
      console.warn('Event handler received an empty body')
      return
    }

    const body = JSON.parse(req.body)

    const integrationEventParse = IntegrationEventSchema.safeParse(body)
    if (integrationEventParse.success) {
      await handleIntegrationEvent(integrationEventParse.data, ctx, client)
      return
    }

    const eventParse = EventSchema.safeParse(body)
    if (!eventParse.success) {
      console.warn(`Received invalid event: ${eventParse.error}`)
      return
    }

    await handleEvent(eventParse.data, client)
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

async function handleIntegrationEvent(event: IntegrationEvent, ctx: bp.Context, client: Client) {
  console.info('Received integration event: ', event)

  let subscribers = await getTriggerSubscribers(ctx, client)

  if (event.action === 'subscribe:triggers') {
    subscribers.push({ url: event.url })

    // Send a demo trigger call to the Zapier REST hook so the user can easily test it when setting up the bot trigger in their Zap.
    await axios
      .post(event.url, <TriggerRequestBody>{
        botId: ctx.botId,
        data: '{"message": "Hello from Botpress! This is an automated test message to confirm that your bot is now able to trigger this Zap."}',
        correlationId: '12345',
      })
      .then(() => {
        console.info(`Successfully sent demo trigger to Zapier REST hook: ${event.url}`)
      })
      .catch((e) => {
        console.warn(`Failed to send demo trigger to Zapier REST hook: ${event.url} (Error: ${e.message})`)
      })
  } else if (event.action === 'unsubscribe:triggers') {
    subscribers = subscribers.filter((x) => x.url !== event.url)
  }

  await saveTriggerSubscribers(subscribers, ctx, client)

  console.info(`Successfully updated trigger subscribers: ${JSON.stringify(subscribers)}`)
}

export async function handleEvent(event: Event, client: Client) {
  await client.createEvent({
    type: 'zapier:event',
    payload: event,
  })
}
