import { RuntimeError } from '@botpress/client'
import { CommentCreatedSchema } from 'definitions/channels/comments'
import { FeatureBaseClient } from './client'
import * as bp from '.botpress'
import { Actions } from '.botpress/implementation/typings/actions'

type MessageHandlerProps<T extends keyof bp.MessageProps['comments']> = bp.MessageProps['comments'][T]

export const handleOutgoingTextMessage = async (props: MessageHandlerProps<'text'>) => {
  const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
  const comment = await client
    .createComment({
      content: props.payload.text,
      submissionId: props.conversation.tags.submissionId,
      parentCommentId: props.conversation.tags.rootCommentId,
    })
    .catch((thrown: unknown) => {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError('Failed to send message in Feature Base: ' + err.message)
    })

  await props.ack({
    tags: {
      id: comment.comment.id,
    },
  })
}

type ExtractTagsReturn = {
  isRoot: boolean
  tags: {
    rootCommentId: string
    submissionId: string
  }
}

const extractTags = (comment: Actions['getComments']['output']['results'][0]): ExtractTagsReturn => {
  if (!comment.path) {
    throw new RuntimeError('Path is not defined. Not possible to extract a tag')
  }
  const pathParts = comment.path.split('/')
  if (pathParts.length < 1) {
    throw new RuntimeError('Path could not be parsed. Not possible to extract a tag')
  }
  if (pathParts.length === 1) {
    return {
      isRoot: true,
      tags: {
        submissionId: pathParts[0]!,
        rootCommentId: comment.id,
      },
    }
  }
  return {
    isRoot: pathParts.length <= 2,
    tags: {
      submissionId: pathParts[0]!,
      rootCommentId: pathParts[1]!,
    },
  }
}

export const handleIncomingTextMessage = async (props: bp.HandlerProps, payload: CommentCreatedSchema) => {
  const ID = Math.floor(Math.random() * 1000)
  if (!payload.data.item.user?.id || !payload.data.item.submission) {
    return
  }
  const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
  const commentThread = await client.getComments({
    submissionId: payload.data.item.submission,
    commentThreadId: payload.data.item.id,
  })
  props.logger.forBot().info(`[${ID}] commentId: ${payload.data.item.id}, submission ${payload.data.item.submission}`)
  if (commentThread.results.length === 0) {
    throw new RuntimeError('The comment does not exists.')
  }
  const comment = commentThread.results[0]!
  props.logger
    .forBot()
    .info(
      `[${ID}] parent comment id: ${comment.id}, length: ${commentThread.results.length}, content: ${commentThread.results.map((r) => r.content).join(' --- ')}`
    )

  const { isRoot, tags } = extractTags(comment)

  // We only want to respond to roots comment. If the comment is not at the root of the comments
  // section we do not respond to the message
  if (!isRoot) {
    props.logger.forBot().info(`[${ID}] path: ${comment.path}, isRoot: ${isRoot}, tags: ${tags}`)
    return
  }

  const { conversation } = await props.client.getOrCreateConversation({
    channel: 'comments',
    tags,
  })
  const { user } = await props.client.getOrCreateUser({
    tags: {
      id: payload.data.item.user.id,
    },
    name: comment.author,
    pictureUrl: comment.authorPicture,
  })
  await props.client.getOrCreateMessage({
    type: 'text',
    payload: {
      text: payload.data.item.content ?? '',
    },
    tags: {
      id: comment.id,
    },
    userId: user.id,
    conversationId: conversation.id,
  })
}
