import * as bp from '.botpress'

const MAX_TRACKED_NOTIFICATIONS = 100

type WebhookPayload = {
  notificationId?: string
  [key: string]: unknown
}

export const dispatchWebhookEvent = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  if (!req.body) {
    logger.forBot().warn('Received empty LinkedIn webhook body')
    return { status: 200 }
  }

  let event: WebhookPayload
  try {
    event = JSON.parse(req.body) as WebhookPayload
  } catch (error) {
    logger.forBot().error('Failed to parse webhook body', { error })
    return { status: 200 }
  }

  // Deduplicate notifications using notification ID
  const notificationId = event.notificationId
  if (notificationId) {
    const isDuplicate = await checkAndTrackNotification({ client, ctx, logger, notificationId })
    if (isDuplicate) {
      logger.forBot().debug('Skipping duplicate notification', { notificationId })
      return { status: 200 }
    }
  } else {
    logger.forBot().warn('Webhook payload missing notificationId - cannot deduplicate')
  }

  logger.forBot().info('Received LinkedIn webhook event', { event })

  return { status: 200 }
}

async function checkAndTrackNotification({
  client,
  ctx,
  logger,
  notificationId,
}: {
  client: bp.Client
  ctx: bp.Context
  logger: bp.HandlerProps['logger']
  notificationId: string
}): Promise<boolean> {
  try {
    let notificationIds: string[] = []
    try {
      const { state } = await client.getState({
        type: 'integration',
        name: 'processedNotifications',
        id: ctx.integrationId,
      })
      notificationIds = state.payload.notificationIds
    } catch {}

    if (notificationIds.includes(notificationId)) {
      return true
    }

    notificationIds.push(notificationId)
    if (notificationIds.length > MAX_TRACKED_NOTIFICATIONS) {
      notificationIds = notificationIds.slice(-MAX_TRACKED_NOTIFICATIONS)
    }

    await client.setState({
      type: 'integration',
      name: 'processedNotifications',
      id: ctx.integrationId,
      payload: { notificationIds },
    })

    return false
  } catch (error) {
    logger.forBot().error('Failed to check/track notification for deduplication', { error, notificationId })
    return false
  }
}
