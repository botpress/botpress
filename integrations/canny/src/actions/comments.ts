import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'
import { InvalidAPIKeyError, CannyAPIError } from '../misc/errors'

type CreateCommentAction = IntegrationProps['actions']['createComment']
type GetCommentAction = IntegrationProps['actions']['getComment']
type ListCommentsAction = IntegrationProps['actions']['listComments']
type DeleteCommentAction = IntegrationProps['actions']['deleteComment']

export const createComment: CreateCommentAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new InvalidAPIKeyError()
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  let authorId = input.authorId

  if (!authorId) {
    authorId = ctx.configuration.defaultAuthorId
  }
  if (!input.postId) {
    throw new RuntimeError('postId is required to create a comment')
  }
  if (!input.value) {
    throw new RuntimeError('value (comment text) is required to create a comment')
  }

  try {
    const result = await client.createComment({
      authorId,
      postId: input.postId,
      value: input.value,
      parentId: input.parentId,
      imageURLs: input.imageURLs,
      internal: input.internal,
      shouldNotifyVoters: input.shouldNotifyVoters,
      createdAt: input.createdAt,
    })

    return {
      commentId: result.id,
    }
  } catch (error: any) {
    if (
      error.response?.data?.error?.includes('user') ||
      error.response?.data?.error?.includes('author') ||
      error.message?.includes('user')
    ) {
      if (!input.authorId) {
        throw new RuntimeError(
          'Comment creation failed: Canny requires users to be "identified" through their SDK. Please provide an authorId of a user who has been identified in your Canny workspace, or ensure the default author from the integration configuration is properly identified.'
        )
      } else {
        throw new RuntimeError(
          `Comment creation failed: The authorId "${authorId}" is not valid or the user hasn't been identified through Canny's SDK.`
        )
      }
    }
    throw new CannyAPIError(error)
  }
}

export const getComment: GetCommentAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  const comment = await client.getComment(input.commentId)

  return {
    comment: {
      id: comment.id,
      value: comment.value,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
      postId: comment.post.id,
      created: comment.created,
      internal: comment.internal,
      likeCount: comment.likeCount,
    },
  }
}

export const listComments: ListCommentsAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  const result = await client.listComments({
    postId: input.postId,
    authorId: input.authorId,
    boardId: input.boardId,
    companyId: input.companyId,
    limit: input.limit,
    skip: input.nextToken,
  })

  return {
    comments: result.comments.map((comment) => ({
      id: comment.id,
      value: comment.value,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
      postId: comment.post.id,
      created: comment.created,
      internal: comment.internal,
      likeCount: comment.likeCount,
    })),
    nextToken: result.hasMore ? (input.nextToken || 0) + (input.limit || 10) : undefined,
  }
}

export const deleteComment: DeleteCommentAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  await client.deleteComment(input.commentId)

  return {
    success: true,
  }
}
