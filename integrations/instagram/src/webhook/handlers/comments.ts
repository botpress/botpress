import { getCredentials } from 'src/misc/client'
import { InstagramCommentPayloadSchema, InstagramComment } from 'src/misc/types'
import * as bp from '.botpress'
export const commentsHandler = async (props: bp.HandlerProps) => {
  const { logger, req } = props
  if (!req.body) {
    logger.debug('Comments handler received an empty body, so the message was ignored')
    return
  }

  const parseResult = InstagramCommentPayloadSchema.safeParse(JSON.parse(req.body))
  if (!parseResult.success) {
    logger.error('Received invalid or unsupported Instagram comment payload', parseResult.error.message)
    return { status: 400, body: 'Invalid comment payload' }
  }

  for (const entry of parseResult.data.entry) {
    for (const change of entry.changes) {
      if (change.field === 'comments') {
        await _commentHandler(change.value, props)
      }
    }
  }
  return { status: 200 }
}

const _commentHandler = async (comment: InstagramComment, handlerProps: bp.HandlerProps) => {
  const { logger, client, ctx } = handlerProps
  logger.forBot().debug('Received comment from Instagram:', {
    id: comment.id,
    text: comment.text,
    from: comment.from.username,
    mediaId: comment.media.id,
  })

  const { from, id, text } = comment

  // Get bot's Instagram ID to check if this is an echo (bot's own comment)
  const { instagramId: botInstagramId } = await getCredentials(client, ctx)

  if (from.id === botInstagramId) {
    logger.forBot().debug('Ignoring echo comment from bot')
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'comment',

    tags: {
      id,
    },
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
    },
    userId: user.id,
    conversationId: conversation.id,
    payload: {
      text,
    },
  })
}
