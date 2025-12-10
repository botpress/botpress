import { Client, Conversation, Logger } from 'src/types'
import { SwitchboardReleaseControlEvent } from '../sunshine-events'

export async function handleSwitchboardReleaseControl(
  event: SwitchboardReleaseControlEvent,
  conversation: Conversation,
  client: Client,
  logger: Logger
): Promise<void> {
  const payload = event.payload
  const suncoConversationId = payload.conversation?.id

  if (!suncoConversationId) {
    logger.forBot().warn('switchboard:releaseControl event missing conversation ID')
    return
  }

  logger
    .forBot()
    .info(
      `Received switchboard:releaseControl event for conversation ${suncoConversationId}, reason: ${payload.reason}`
    )

  try {
    // Emit hitlStopped event to close the HITL session
    await client.createEvent({
      type: 'hitlStopped',
      payload: {
        conversationId: conversation.id,
      },
    })

    logger.forBot().info(`HITL session stopped for conversation ${conversation.id} due to switchboard releaseControl`)
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Failed to handle switchboard:releaseControl event: ${errMsg}`)
  }
}
