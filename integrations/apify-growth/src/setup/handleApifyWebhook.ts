import { apifyWebhookSchema } from '../misc/schemas'
import type { z } from 'zod'
import { handleCrawlerCompleted } from './handleCrawlerCompleted'
import * as bp from '.botpress'

type ApifyWebhook = z.infer<typeof apifyWebhookSchema>

export async function handleApifyWebhook({
  webhookPayload,
  client,
  logger,
  ctx,
}: {
  webhookPayload: ApifyWebhook
  client: bp.Client
  logger: bp.Logger
  ctx: bp.Context
}) {
  const eventType = webhookPayload.eventType
  const runId = webhookPayload.resource.id

  if (!eventType) {
    logger.forBot().debug('Webhook payload missing eventType, ignoring')
    return {}
  }

  switch (eventType) {
    case 'ACTOR.RUN.SUCCEEDED':
      logger.forBot().info(`Processing Apify webhook event: ${eventType}`)
      await handleCrawlerCompleted({ webhookPayload, client, logger, ctx })
      break

    case 'ACTOR.RUN.FAILED':
      logger.forBot().warn(`Received webhook for failed crawler run: ${runId}`)
      await client.createEvent({
        type: 'crawlerFailed',
        payload: {
          actorId: webhookPayload.eventData.actorId,
          actorRunId: webhookPayload.eventData.actorRunId,
          runId: runId,
          eventType: eventType,
          reason: 'FAILED',
        },
      })
      break

    case 'ACTOR.RUN.ABORTED':
      logger.forBot().warn(`Received webhook for aborted crawler run: ${runId}`)
      await client.createEvent({
        type: 'crawlerFailed',
        payload: {
          actorId: webhookPayload.eventData.actorId,
          actorRunId: webhookPayload.eventData.actorRunId,
          runId: runId,
          eventType: eventType,
          reason: 'ABORTED',
        },
      })
      break

    case 'ACTOR.RUN.TIMED_OUT':
      logger.forBot().warn(`Received webhook for timed out crawler run: ${runId}`)
      await client.createEvent({
        type: 'crawlerFailed',
        payload: {
          actorId: webhookPayload.eventData.actorId,
          actorRunId: webhookPayload.eventData.actorRunId,
          runId: runId,
          eventType: eventType,
          reason: 'TIMED_OUT',
        },
      })
      break

    case 'ACTOR.RUN.CREATED':
      logger.forBot().debug(`Received webhook for created crawler run: ${runId}`)
      break

    case 'ACTOR.RUN.RESURRECTED':
      logger.forBot().debug(`Received webhook for resurrected crawler run: ${runId}`)
      break

    default:
      logger.forBot().debug(`Received webhook for unhandled event type: ${eventType}`)
  }

  return {}
}
