import * as bp from '../.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'webhookConfig',
    id: ctx.integrationId,
  })

  const expected = `Bearer ${state.payload.webhookSecret}`
  if (req.headers['authorization'] !== expected) {
    logger.forBot().warn('Rejected webhook request: invalid or missing Authorization header')
    return { status: 401 }
  }

  logger.forBot().debug('Webhook request authorized')

  let payload: { alerts?: unknown[] }
  try {
    payload = JSON.parse(req.body ?? '{}') as { alerts?: unknown[] }
  } catch {
    return { status: 400 }
  }

  for (const alert of payload.alerts ?? []) {
    const a = alert as { labels?: Record<string, string>; status?: string; startsAt?: string }
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
