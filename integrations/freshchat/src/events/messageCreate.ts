import { Message } from '@botpress/common'
import { MessageCreateFreshchatEvent } from '../definitions/freshchat-events'
import { updateAgentUser } from '../util'
import * as bp from '.botpress'

export const executeMessageCreate = async ({
  freshchatEvent,
  client,
  ctx,
  logger,
}: {
  freshchatEvent: MessageCreateFreshchatEvent
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  // Ignore non agent messages
  if (freshchatEvent.actor.actor_type === 'user') {
    return
  }

  // Ignore private messages
  if (freshchatEvent.data.message.message_type === 'private') {
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: freshchatEvent.data.message.conversation_id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: freshchatEvent.actor.actor_id,
    },
  })

  // An unassigned agent might send a message
  await updateAgentUser(user, client, ctx, logger)

  const items: Extract<Message, { type: 'bloc' }>['payload']['items'] = []
  for (const messagePart of freshchatEvent.data.message.message_parts) {
    if ('text' in messagePart) {
      items.push({
        type: 'text',
        payload: {
          text: messagePart.text.content,
        },
      })
    } else if ('file' in messagePart) {
      const { name, url, content_type } = messagePart.file as {
        name: string
        url: string
        file_size_in_bytes: number
        content_type: string
      }
      if (content_type.startsWith('image/')) {
        items.push({
          type: 'image',
          payload: {
            imageUrl: url,
          },
        })
      } else if (content_type.startsWith('audio/')) {
        items.push({
          type: 'audio',
          payload: {
            audioUrl: url,
          },
        })
      } else if (content_type.startsWith('video/')) {
        items.push({
          type: 'video',
          payload: {
            videoUrl: url,
          },
        })
      } else {
        items.push({
          type: 'file',
          payload: {
            title: name,
            fileUrl: url,
          },
        })
      }
    } else {
      logger.forBot().warn(`Unsupported message part type ${Object.keys(messagePart)[0]}`)
    }
  }

  await client.createMessage({
    type: 'bloc',
    payload: {
      items,
    },
    tags: {},
    userId: user?.id as string,
    conversationId: conversation.id,
  })
}
