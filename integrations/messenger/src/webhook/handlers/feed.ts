import { getErrorFromUnknown } from '../../misc/utils'
import { FeedEventEntry, FeedChangeValue } from '../../misc/types'
// import { createFacebookClient } from '../../clients'
import * as bp from '.botpress'

export const handler = async (feedEntry: FeedEventEntry, props: bp.HandlerProps) => {
  for (const change of feedEntry.changes) {
    await _handleFeedChange(change, props)
  }
}

const _handleFeedChange = async (change: any, props: bp.HandlerProps) => {
  const { logger } = props
  const { field, value } = change

  logger.forBot().debug(`Processing feed change: field=${field}, verb=${value.verb}, item=${value.item}`)

  try {
    switch (field) {
      case 'feed':
        await _handleFeedEvent(value, props)
        break
      case 'comments':
        await _handleCommentEvent(value, props)
        break
      case 'reactions':
        await _handleReactionEvent(value, props)
        break
      default:
        logger.forBot().warn(`Unhandled feed event field: ${field}`)
    }
  } catch (error) {
    logger.forBot().error(`Error processing feed change: ${getErrorFromUnknown(error).message}`)
  }
}

const _handleFeedEvent = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { verb, post_id } = value

  logger.forBot().debug(`Processing feed event: verb=${verb}, post_id=${post_id}`)

  switch (verb) {
    case 'add':
      await _handlePostCreated(value, props)
      break
    case 'remove':
      await _handlePostRemoved(value, props)
      break
    case 'edited':
      await _handlePostEdited(value, props)
      break
    default:
      logger.forBot().warn(`Unhandled feed event verb: ${verb}`)
  }
}

const _handleCommentEvent = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { verb, comment_id, post_id } = value

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

const _handleReactionEvent = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { verb, post_id, comment_id } = value

  logger.forBot().debug(`Processing reaction event: verb=${verb}, post_id=${post_id}, comment_id=${comment_id}`)

  switch (verb) {
    case 'add':
      await _handleReactionAdded(value, props)
      break
    case 'remove':
      await _handleReactionRemoved(value, props)
      break
    default:
      logger.forBot().warn(`Unhandled reaction event verb: ${verb}`)
  }
}

// Post event handlers
const _handlePostCreated = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { client, logger } = props
  const { post_id, message, from } = value

  logger.forBot().info(`New post created: ${post_id} by ${from?.name || 'Unknown'}`)

  // Create a conversation for the post
  const { conversation } = await client.getOrCreateConversation({
    channel: 'feed',
    tags: {
      id: post_id,
      senderId: from?.id || 'unknown',
      recipientId: 'page',
    },
  })

  // Create or get the user who created the post
  if (from) {
    const { user } = await client.getOrCreateUser({
      tags: { id: from.id },
    })

    // Create a message for the post content
    if (message) {
      await client.getOrCreateMessage({
        tags: {
          id: `post_${post_id}`,
          senderId: from.id,
          recipientId: 'page',
          postId: post_id,
          eventType: 'post',
        },
        type: 'text',
        payload: { text: message },
        userId: user.id,
        conversationId: conversation.id,
      })
    }
  }
}

const _handlePostRemoved = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { post_id } = value

  logger.forBot().info(`Post removed: ${post_id}`)

  // You might want to mark the conversation as archived or deleted
  // This depends on your business logic
}

const _handlePostEdited = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { post_id, message } = value

  logger.forBot().info(`Post edited: ${post_id}`)

  // Update the message content if it exists
  if (message) {
    // Note: Botpress doesn't have a direct update message API
    // You might need to create a new message or handle this differently
    logger.forBot().debug(`Post content updated: ${message}`)
  }
}

// Comment event handlers
const _handleCommentCreated = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { client, logger } = props
  const { comment_id, post_id, message, from } = value

  logger.forBot().info(`New comment created: ${comment_id} on post ${post_id}`)

  // Get the post conversation
  const { conversation } = await client.getOrCreateConversation({
    channel: 'feed',
    tags: {
      id: post_id,
      senderId: from?.id || 'unknown',
      recipientId: 'page',
    },
  })

  // Create or get the user who commented
  if (from) {
    const { user } = await client.getOrCreateUser({
      tags: { id: from.id },
    })

    // Create a message for the comment
    if (message) {
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
  }
}

const _handleCommentRemoved = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { comment_id, post_id } = value

  logger.forBot().info(`Comment removed: ${comment_id} from post ${post_id}`)

  // You might want to mark the message as deleted
  // This depends on your business logic
}

const _handleCommentEdited = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { comment_id, post_id, message } = value

  logger.forBot().info(`Comment edited: ${comment_id} on post ${post_id}`)

  // Update the comment content if it exists
  if (message) {
    logger.forBot().debug(`Comment content updated: ${message}`)
  }
}

// Reaction event handlers
const _handleReactionAdded = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { post_id, comment_id } = value

  logger.forBot().info(`Reaction added to ${comment_id ? `comment ${comment_id}` : `post ${post_id}`}`)

  // You might want to track reactions for analytics
  // This depends on your business logic
}

const _handleReactionRemoved = async (value: FeedChangeValue, props: bp.HandlerProps) => {
  const { logger } = props
  const { post_id, comment_id } = value

  logger.forBot().info(`Reaction removed from ${comment_id ? `comment ${comment_id}` : `post ${post_id}`}`)

  // You might want to track reaction removals for analytics
  // This depends on your business logic
}
