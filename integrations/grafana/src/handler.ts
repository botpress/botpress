import { z } from '@botpress/sdk'
import * as bp from '../.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  let webhookSecret: string
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'webhookConfig',
      id: ctx.integrationId,
    })
    webhookSecret = state.payload.webhookSecret
  } catch (e) {
    logger.forBot().error(`Failed to load integration state: ${e instanceof Error ? e.message : String(e)}`)
    return { status: 200 }
  }

  if (req.headers['authorization'] !== `Bearer ${webhookSecret}`) {
    logger.forBot().warn('Rejected webhook request: invalid or missing Authorization header')
    return { status: 200 }
  }

  logger.forBot().debug('Webhook request authorized')

  if (!req.body) {
    logger.forBot().debug('Request is missing a body')
    return { status: 200 }
  }

  let jsonPayload: unknown
  try {
    jsonPayload = JSON.parse(req.body)
  } catch {
    logger.forBot().debug('Invalid JSON Body')
    return { status: 200 }
  }

  const parseResult = z
    .object({
      alerts: z
        .array(
          z.object({
            labels: z.record(z.string()).optional(),
            status: z.string().optional(),
            startsAt: z.string().optional(),
          })
        )
        .optional(),
    })
    .safeParse(jsonPayload)

  if (!parseResult.success) {
    logger.forBot().debug('Invalid body schema')
    return { status: 200 }
  }

  for (const alert of parseResult.data.alerts ?? []) {
    const a = alert
    await client.createEvent({
      type: 'alertFired',
      payload: {
        alertName: a.labels?.alertname ?? 'unknown',
        status: a.status ?? 'unknown',
        ruleUid: a.labels?.__alert_rule_uid__ ?? '',
        botpressId: a.labels?.botpress_id,
        labels: a.labels,
        startsAt: a.startsAt,
      },
    })
  }

  return { status: 200 }
}
