import { getMetaClientCredentials } from '../../misc/auth'
import { FeedChanges, FeedChange, CommentChangeValue } from '../../misc/types'
import { getErrorFromUnknown } from '../../misc/utils'
import * as bp from '.botpress'

export const handler = async (changes: FeedChanges, props: bp.HandlerProps) => {
  if (props.ctx.configurationType === 'sandbox') {
    props.logger.error(
      'Feed changes are not supported in sandbox mode, turn off webhook subscriptions in the Sandbox Meta App'
    )
    return
  }

  for (const change of changes) {
    await _handleFeedChange(change, props)
  }
}

const _handleFeedChange = async (change: FeedChange, props: bp.HandlerProps) => {
  const { logger } = props
  const { value } = change

  try {
    switch (value.item) {
      case 'comment':
        await _handleCommentEvent(value, props)
        break
      default:
        logger.forBot().warn(`Unhandled event item: ${value.item}`)
    }
  } catch (error) {
    const errorMsg = getErrorFromUnknown(error)
    logger.forBot().error(`Error processing feed change: ${errorMsg.message}`)
  }
}

const _handleCommentEvent = async (value: CommentChangeValue, props: bp.HandlerProps) => {
  const { logger, ctx, client } = props
  const { from, verb } = value
  const { pageId } = await getMetaClientCredentials({ client, ctx })
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
  const { comment_id: commentId, post_id: postId, message, from, parent_id: parentId } = value

  if (!message) {
    logger
      .forBot()
      .warn(
        'Incoming comment has no message, will not reply. Make sure that your app has been granted the necessary permissions to access user data.'
      )
    return
  }

  if (postId !== parentId) {
    logger.forBot().debug('Incoming comment is not a root comment, will not reply')
    return
  }

  if (!from) {
    logger.forBot().error("Incoming comment doesn't contain 'from' information, will not reply")
    return
  }

  // Use the thread resolver to create conversation based on root thread ID
  const userId = from.id
  const { conversation } = await client.getOrCreateConversation({
    channel: 'commentReplies',
    tags: { id: commentId, postId, userId },
    discriminateByTags: ['id'],
  })

  const { user } = await client.getOrCreateUser({
    tags: { id: userId },
  })

  if (!user.name) {
    await client.updateUser({
      id: user.id,
      name: from.name,
    })
  }

  await client.getOrCreateMessage({
    tags: {
      id: commentId,
      postId,
    },
    discriminateByTags: ['id'],
    type: 'text',
    payload: { text: message, commentId },
    userId: user.id,
    conversationId: conversation.id,
  })
}
