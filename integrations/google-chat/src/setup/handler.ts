import * as bp from '.botpress'
import { getClient } from '../client'

interface GoogleChatMessage {
  text: string
  sender: {
    name: string
    email?: string
  }
}

interface GoogleChatEvent {
  type: string
  space: {
    name: string
  }
  message?: GoogleChatMessage
}

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  let event: GoogleChatEvent
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch (err) {
    logger.forBot().error('Failed to parse request body:', err)
    return
  }

  if (event.type !== 'MESSAGE' || !event.space || !event.message) {
    logger.forBot().debug('Ignoring non-message event or missing data:', event.type)
    return
  }

  try {
    const googleClient = getClient(ctx)
    const spaceId = event.space.name.replace('spaces/', '')

    // Get or create conversation
    const { conversation } = await client.getOrCreateConversation({
      channel: 'text',
      tags: {
        spaceId: event.space.name,
      },
    })

    // Get or create user
    const { user } = await client.getOrCreateUser({
      tags: {
        id: event.message.sender.name,
      },
    })

    // Create message in Botpress
    await client.createMessage({
      type: 'text',
      conversationId: conversation.id,
      userId: user.id,
      payload: {
        text: event.message.text,
      },
      tags: {},
    })

    logger.forBot().info(`Processed message in space ${spaceId}`)
  } catch (error: any) {
    logger.forBot().error('Failed to process message:', error)
  }
}
