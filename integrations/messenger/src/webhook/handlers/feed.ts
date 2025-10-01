import { getErrorFromUnknown } from '../../misc/utils'
import { FeedEventEntry, CommentChangeValue, FeedChange } from '../../misc/types'
import { createConversationAndThread } from '../../misc/thread-resolver'
import { createFacebookClient } from '../../clients'
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
    logger.forBot().error(`Error processing feed change: ${getErrorFromUnknown(error).message}`)
  }
}

const _handleCommentEvent = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { verb, comment_id, post_id, from } = value

  if (props.ctx.configurationType !== 'manual') {
    logger.forBot().error('Manual configuration is required to reply to comments')
    return
  }

  // Check if it is our comment
  if (from?.id === props.ctx.configuration.pageId) {
    logger.forBot().debug(`Comment is from our page, ignoring`)
    return
  }

  logger.forBot().debug(`Processing comment event: verb=${verb}, comment_id=${comment_id}, post_id=${post_id}`)

  switch (verb) {
    case 'add':
      await _handleCommentCreated(value, props)
      break
    case 'remove':
      await _handleCommentRemoved(value, props)
      break
    case 'edited':
      await _handleCommentEdited(value, props)
      break
    default:
      logger.forBot().warn(`Unhandled comment event verb: ${verb}`)
  }
}

const _replyToComment = async (commentId: string, message: string, props: bp.HandlerProps) => {
  const { logger } = props

  try {
    // Create Facebook client
    const facebookClient = await createFacebookClient(props.ctx)

    // Send reply to Facebook
    const result = await facebookClient.replyToComment({
      commentId,
      message,
    })

    logger.forBot().info(`Successfully replied to comment ${commentId}: ${result.id}`)
    return result
  } catch (error) {
    logger.forBot().error(`Failed to reply to comment ${commentId}: ${getErrorFromUnknown(error).message}`)
    throw error
  }
}

// Comment event handlers
const _handleCommentCreated = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { client } = props
  const { comment_id, post_id, message, from, parent_id } = value

  // Create conversation and thread for the comment
  const effectiveCommentId = comment_id || post_id
  const effectiveParentId = parent_id || post_id
  const { conversation, threadId: _threadId } = await createConversationAndThread(
    client,
    post_id,
    effectiveCommentId,
    effectiveParentId,
    'comment'
  )

  // Create or get the user who commented
  if (!from) {
    return
  }

  const { user } = await client.getOrCreateUser({
    tags: { id: from.id },
  })

  if (!message) {
    return
  }
  await client.getOrCreateMessage({
    tags: {
      id: `comment_${comment_id}`,
      senderId: from.id,
      recipientId: 'page',
      postId: post_id,
      commentId: comment_id,
      eventType: 'comment',
    },
    type: 'text',
    payload: { text: message },
    userId: user.id,
    conversationId: conversation.id,
  })
}

const _handleCommentRemoved = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { comment_id, post_id } = value

  logger.forBot().info(`Comment removed: ${comment_id} from post ${post_id}`)

  // You might want to mark the message as deleted
  // This depends on your business logic
}

const _handleCommentEdited = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { comment_id, post_id, message } = value

  logger.forBot().info(`Comment edited: ${comment_id} on post ${post_id}`)

  // Update the comment content if it exists
  if (message) {
    logger.forBot().debug(`Comment content updated: ${message}`)
  }
}
