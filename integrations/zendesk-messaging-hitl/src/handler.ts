import { handleConversationMessage, handleSwitchboardReleaseControl } from './events'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  logger.forBot().debug('Handler received request from Sunco with payload:', req.body)

  try {
    const data = JSON.parse(req.body)

    // Handle Sunco webhook events
    // Sunco sends events in the format: { events: [...] }
    if (!data.events && !Array.isArray(data.events)) {
      logger.forBot().warn('Received an invalid payload from Sunco')
      return
    }

    for (const event of data.events) {
      const suncoConversationId = event.payload.conversation?.id

      const { conversations } = await client.listConversations({
        channel: 'hitl',
        tags: {
          id: suncoConversationId,
        },
      })
      const conversation = conversations[0]

      if (!conversation) {
        logger
          .forBot()
          .warn(
            `Ignoring Sunshine conversation ${suncoConversationId} because it was not created by the startHitl action`
          )
        continue
      }

      if (event.type === 'switchboard:releaseControl') {
        await handleSwitchboardReleaseControl(event, conversation, client, logger)
      } else if (event.type === 'conversation:message') {
        await handleConversationMessage(event, conversation, client, logger)
      } else {
        logger.forBot().debug(`Unhandled event type: ${event.type}`)
      }
    }
  } catch (error: any) {
    logger.forBot().error('Error processing Sunco webhook: ' + error.message, error)
  }
}
