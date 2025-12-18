import { handleConversationMessage, handleSwitchboardReleaseControl } from './events'
import { isSuncoWebhookPayload } from './sunshine-events'
import { Handler } from './types'

export const handler: Handler = async ({ req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  try {
    const data: unknown = JSON.parse(req.body)

    if (!isSuncoWebhookPayload(data)) {
      logger.forBot().warn('Received an invalid payload from Sunco')
      return
    }

    for (const event of data.events) {
      const suncoConversationId = event.payload.conversation?.id

      if (!suncoConversationId) {
        logger.forBot().warn('Event missing conversation ID, skipping')
        continue
      }

      const conversation = (
        await client.listConversations({
          channel: 'hitl',
          tags: {
            id: suncoConversationId,
          },
        })
      )?.conversations[0]

      if (!conversation) {
        logger
          .forBot()
          .warn(
            `Ignoring Sunshine conversation ${suncoConversationId} because it was not created by the startHitl action`
          )
        continue
      }

      const eventType = event.type
      switch (eventType) {
        case 'switchboard:releaseControl':
          await handleSwitchboardReleaseControl(event, conversation, client, logger)
          break
        case 'conversation:message':
          await handleConversationMessage(event, conversation, client, logger)
          break
        default:
          logger.forBot().debug(`Unhandled event type: ${eventType}`)
      }
    }
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Error processing Sunco webhook: ${errMsg}`)
  }
}
