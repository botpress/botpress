import * as bp from '../../.botpress'

type Conversation = Awaited<ReturnType<bp.Client['listConversations']>>['conversations'][number]

export async function handleSwitchboardReleaseControl(
  event: any,
  conversation: Conversation,
  client: bp.Client,
  logger: bp.Logger
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
  } catch (error: any) {
    logger.forBot().error(`Failed to handle switchboard:releaseControl event: ${error.message}`, error)
  }
}
