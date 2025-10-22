import { getCredentials } from 'src/misc/client'
import { InstagramComment, InstagramLegacyComment } from 'src/misc/types'
import * as bp from '.botpress'

export const commentsHandler = async (
  comments: InstagramComment[] | InstagramLegacyComment[],
  handlerProps: bp.HandlerProps
) => {
  for (const comment of comments) {
    await _commentHandler(comment, handlerProps)
  }
}

const _commentHandler = async (comment: InstagramComment | InstagramLegacyComment, handlerProps: bp.HandlerProps) => {
  const { logger, client, ctx } = handlerProps
  logger.forBot().debug('Received comment from Instagram:', {
    id: comment.id,
    text: comment.text,
    from: comment.from.username,
    mediaId: comment.media.id,
  })

  const { from, id, text, media } = comment
  const postId = media.id

  // Get bot's Instagram ID to check if this is an echo (bot's own comment)
  const { instagramId: botInstagramId } = await getCredentials(client, ctx)

  if (from.id === botInstagramId) {
    logger.forBot().debug('Ignoring echo comment from bot')
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'commentReplies',
    tags: {
      id,
      postId,
    },
    discriminateByTags: ['id'],
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: from.id,
    },
  })

  await client.getOrCreateMessage({
    type: 'text',
    tags: {
      id,
      postId,
    },
    discriminateByTags: ['id'],
    userId: user.id,
    conversationId: conversation.id,
    payload: {
      text,
    },
  })
}
