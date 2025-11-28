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
      // Handle switchboard:releaseControl events - close HITL when control is released
      if (event.type === 'switchboard:releaseControl') {
        const payload = event.payload
        const suncoConversationId = payload.conversation?.id

        if (!suncoConversationId) {
          logger.forBot().warn('switchboard:releaseControl event missing conversation ID')
          continue
        }

        logger
          .forBot()
          .info(
            `Received switchboard:releaseControl event for conversation ${suncoConversationId}, reason: ${payload.reason}`
          )

        try {
          const { conversation } = await client.getOrCreateConversation({
            channel: 'hitl',
            tags: {
              id: suncoConversationId,
            },
          })

          // Emit hitlStopped event to close the HITL session
          await client.createEvent({
            type: 'hitlStopped',
            payload: {
              conversationId: conversation.id,
            },
          })

          logger
            .forBot()
            .info(`HITL session stopped for conversation ${conversation.id} due to switchboard releaseControl`)
        } catch (error: any) {
          logger.forBot().error(`Failed to handle switchboard:releaseControl event: ${error.message}`, error)
        }
        continue
      }

      // Handle conversation:message events
      if (event.type === 'conversation:message') {
        const payload = event.payload

        // Agent messages will come as business
        if (payload.message.author.type !== 'business') {
          continue
        }

        const zendeskAgentId: string | undefined = payload.message.metadata['__zendesk_msg.agent.id']

        if (!zendeskAgentId?.length) {
          logger.forBot().warn('Received a message from a non-agent user, ignoring message')
          continue
        }

        // Only handle text messages for now
        if (payload.message.content.type !== 'text') {
          logger.forBot().warn('Received a message that is not a text message')
          continue
        }

        const { conversation } = await client.getOrCreateConversation({
          channel: 'hitl',
          tags: {
            id: payload.conversation.id,
          },
        })

        const { user } = await client.getOrCreateUser({
          tags: {
            id: zendeskAgentId,
          },
          name: payload.message.author.displayName,
          pictureUrl: payload.message.author.avatarUrl,
        })

        await client.createMessage({
          tags: { id: payload.message.id },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: payload.message.content.text },
        })
      }
    }
  } catch (error: any) {
    logger.forBot().error('Error processing Sunco webhook: ' + error.message, error)
  }
}
