import { getMetaClientCredentials } from '../../misc/auth'
import { FeedEventEntry, CommentChangeValue, FeedChange } from '../../misc/types'
import { getErrorFromUnknown } from '../../misc/utils'
import * as bp from '.botpress'

export const handler = async (feedEntry: FeedEventEntry, props: bp.HandlerProps) => {
  for (const change of feedEntry.changes) {
    await _handleFeedChange(change, props)
  }
}

const _handleFeedChange = async (change: FeedChange, props: bp.HandlerProps) => {
  const { logger } = props
  const { value } = change
  const { item } = value

  try {
    switch (item) {
      case 'comment':
        await _handleCommentEvent(value as CommentChangeValue, props)
        break
      default:
        logger.forBot().warn(`Unhandled event item: ${item}`)
    }
  } catch (error) {
    const errorMsg = getErrorFromUnknown(error)
    logger.forBot().error(`Error processing feed change: ${errorMsg.message}`)
  }
}

const _handleCommentEvent = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { logger, ctx, client } = props
  const { from, verb } = value
  const { pageId } = await getMetaClientCredentials(ctx.configurationType, client, ctx)
  if (!pageId) {
    logger.forBot().error('Page ID is not set, cannot process comment event. Please configure or reauthorize')
    return
  }

  if (from?.id === pageId) {
    logger.forBot().debug('Comment is from our page, ignoring')
    return
  }

  logger.forBot().debug(`Processing comment event: verb=${verb} `)

  switch (verb) {
    case 'add':
      await _handleCommentCreated(value, props)
      break
    case 'remove': // For removed comments
      break
    case 'edited': // For edited comments
      break
    default:
  }
}

const _handleCommentCreated = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { client, logger } = props
  const { comment_id, post_id, message, from, parent_id } = value

  if (!message) {
    logger.forBot().debug('_handleCommentCreated: No message. Will not reply to this comment.')
    return
  }

  if (post_id !== parent_id) {
    logger.forBot().debug('_handleCommentCreated: Non root comment. Will not reply to this comment.')
    return
  }

  // Use the thread resolver to create conversation based on root thread ID
  const { conversation } = await client.getOrCreateConversation({
    channel: 'commentReplies',
    tags: { id: comment_id },
  })

  const { user } = await client.getOrCreateUser({
    tags: { id: from?.id },
  })

  await client.getOrCreateMessage({
    tags: {
      id: comment_id,
      postId: post_id,
    },
    type: 'text',
    payload: { text: message },
    userId: user.id,
    conversationId: conversation.id,
  })
}
