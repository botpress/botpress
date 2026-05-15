import * as bp from '../.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, client }) => {
  let payload: { alerts?: unknown[] }
  try {
    payload = JSON.parse(req.body ?? '{}') as { alerts?: unknown[] }
  } catch {
    return
  }

  for (const alert of payload.alerts ?? []) {
    await client.createEvent({
      type: 'alertFired',
      payload: {
        alertName: alert.labels?.alertname ?? 'unknown',
        status: alert.status,
        ruleUid: alert.labels?.__alert_rule_uid__ ?? '',
        botpressId: alert.labels?.botpress_id,
        labels: alert.labels,
        startsAt: alert.startsAt,
      },
    })
  }
}
