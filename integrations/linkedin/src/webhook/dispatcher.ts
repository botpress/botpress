import * as bp from '.botpress'

export const dispatchWebhookEvent = async ({ req, logger }: bp.HandlerProps) => {
  if (!req.body) {
    logger.forBot().warn('Received empty LinkedIn webhook body')
    return { status: 200 }
  }

  let event: unknown
  try {
    event = JSON.parse(req.body)
  } catch (error) {
    logger.forBot().error('Failed to parse webhook body', { error })
    return { status: 200 }
  }

  logger.forBot().info('Received LinkedIn webhook event', { event })

  return { status: 200 }
}
