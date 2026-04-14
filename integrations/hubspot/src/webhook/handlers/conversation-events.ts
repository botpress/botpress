import { getHitlClient } from '../../hitl/client'
import { handleConversationCompleted } from '../../hitl/events/conversation-completed'
import { handleOperatorAssignedUpdate } from '../../hitl/events/operator-assigned'
import * as bp from '.botpress'

type ConversationEvent = {
  subscriptionType: string
  objectId: string | number
  propertyName?: string
  propertyValue?: string
}

export const isConversationEvent = (props: bp.HandlerProps): boolean => {
  if (props.req.method.toUpperCase() !== 'POST' || !props.req.body?.length) {
    return false
  }
  try {
    const parsed = JSON.parse(props.req.body)
    if (!Array.isArray(parsed) || parsed.length === 0) return false
    const type: string = parsed[0].subscriptionType ?? ''
    return type.startsWith('conversation.') || type.startsWith('conversations.')
  } catch {
    return false
  }
}

export const handleConversationEvent: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  let events: ConversationEvent[]
  try {
    events = JSON.parse(req.body!)
  } catch {
    return { status: 400, body: 'Invalid JSON body' }
  }

  const hubSpotClient = getHitlClient(ctx, client, logger)

  for (const event of events) {
    if (event.subscriptionType === 'conversation.propertyChange') {
      if (event.propertyName === 'assignedTo' && event.propertyValue) {
        logger.forBot().info(`Operator assigned: ${event.propertyValue}`)
        await handleOperatorAssignedUpdate({ hubspotEvent: event, client, hubSpotClient, logger })
      }

      if (event.propertyName === 'status' && (event.propertyValue === 'CLOSED' || event.propertyValue === 'ARCHIVED')) {
        logger.forBot().info(`Conversation ${event.propertyValue} by operator`)
        await handleConversationCompleted({ hubspotEvent: event, client })
      }
    } else {
      logger.forBot().info(`Event ${event.subscriptionType} not handled`)
    }
  }
}
