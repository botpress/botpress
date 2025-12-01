import { Client, TriggerRequestBody, IntegrationEvent, IntegrationEventSchema, EventSchema, Event } from '../types'
import { getTriggerSubscribers, saveTriggerSubscribers } from '../utils/state-management'
import { postToZapierWebhook } from '../utils/zapier-client'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Event handler received an empty body')
    return
  }

  const body = JSON.parse(req.body)

  const integrationEventParse = IntegrationEventSchema.safeParse(body)
  if (integrationEventParse.success) {
    await handleIntegrationEvent(integrationEventParse.data, ctx, client, logger)
    return
  }

  const eventParse = EventSchema.safeParse(body)
  if (!eventParse.success) {
    logger.forBot().warn(`Received invalid event: ${eventParse.error}`)
    return
  }

  await handleEvent(eventParse.data, client, logger)
}

async function handleIntegrationEvent(event: IntegrationEvent, ctx: bp.Context, client: Client, logger: bp.Logger) {
  logger.forBot().info('Received integration event: ', event)

  let subscribers = await getTriggerSubscribers(ctx, client)

  if (event.action === 'subscribe:triggers') {
    subscribers.push({ url: event.url })

    // Send a demo trigger call to the Zapier REST hook so the user can easily test it when setting up the bot trigger in their Zap.
    const demoRequest: TriggerRequestBody = {
      botId: ctx.botId,
      data: '{"message": "Hello from Botpress! This is an automated test message to confirm that your bot is now able to trigger this Zap."}',
      correlationId: '12345',
    }

    const result = await postToZapierWebhook(event.url, demoRequest, logger)

    if (result.success) {
      logger.forBot().info(`Successfully sent demo trigger to Zapier REST hook: ${event.url}`)
    } else {
      logger.forBot().warn(`Failed to send demo trigger to Zapier REST hook: ${event.url} (Error: ${result.error})`)
    }
  } else if (event.action === 'unsubscribe:triggers') {
    subscribers = subscribers.filter((x) => x.url !== event.url)
  }

  await saveTriggerSubscribers(subscribers, ctx, client)

  logger.forBot().info(`Successfully updated trigger subscribers: ${JSON.stringify(subscribers)}`)
}

async function handleEvent(event: Event, client: Client, logger: bp.Logger) {
  logger.forBot().info('Received event from Zapier: ', event)
  await client.createEvent({
    type: 'event',
    payload: event,
  })
}
