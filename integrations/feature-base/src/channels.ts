import { RuntimeError } from '@botpress/client'
import { CommentCreatedPayload } from 'definitions/channels/comments'
import { FeatureBaseClient } from './client'
import * as bp from '.botpress'
import { Actions } from '.botpress/implementation/typings/actions'

type MessageHandlerProps<T extends keyof bp.MessageProps['comments']> = bp.MessageProps['comments'][T]

type Tags = {
  rootCommentId: string
  submissionId: string
}

export const handleOutgoingTextMessage = async (props: MessageHandlerProps<'text'>) => {
  const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
  const comment = await client.createComment({
    content: props.payload.text,
    submissionId: props.conversation.tags.submissionId,
    parentCommentId: props.conversation.tags.rootCommentId,
  })
  props.ack({
    tags: {
      id: comment.comment.id,
    },
  })
}

const extractTags = (comment: Actions['getComments']['output']['results'][0]): Tags => {
  if (!comment.path) {
    throw new RuntimeError('Path is not defined. Not possible to extract a tag')
  }
  const pathParts = comment.path.split('/')
  if (pathParts.length < 1) {
    throw new RuntimeError('Path could not be parsed. Not possible to extract a tag')
  }
  if (pathParts.length === 1) {
    return {
      submissionId: pathParts[0]!,
      rootCommentId: comment.id,
    }
  }
  return {
    submissionId: pathParts[0]!,
    rootCommentId: pathParts[1]!,
  }
}

export const handleIncomingTextMessage = async (props: bp.HandlerProps, payload: CommentCreatedPayload) => {
  if (!payload.data.item.user?.id || !payload.data.item.submission) {
    // ...
    return
  }
  const client = new FeatureBaseClient(props.ctx.configuration.apiKey)
  const commentThread = await client.getComments({
    submissionId: payload.data.item.submission,
    commentThreadId: payload.data.item.id,
  })
  if (commentThread.results.length === 0) {
    throw new RuntimeError('The comment does not exists.')
  }
  const comment = commentThread.results[0]!

  const tags = extractTags(comment)

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
