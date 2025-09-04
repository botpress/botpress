import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'

type CreateCommentAction = IntegrationProps['actions']['createComment']
type GetCommentAction = IntegrationProps['actions']['getComment']
type ListCommentsAction = IntegrationProps['actions']['listComments']
type DeleteCommentAction = IntegrationProps['actions']['deleteComment']

export const createComment: CreateCommentAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new RuntimeError('Canny API key is not configured. Please add your API key in the integration settings.')
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  let authorID = input.authorID

  if (!authorID) {
    const botUser = await client.createOrUpdateUser({
      name: 'BotpressIntegration',
      userID: 'botpress-integration-user',
      email: 'integration@botpress.com',
    })
    authorID = botUser.id
  }
  if (!input.postID) {
    throw new RuntimeError('postID is required to create a comment')
  }
  if (!input.value) {
    throw new RuntimeError('value (comment text) is required to create a comment')
  }

  try {
    const result = await client.createComment({
      authorID,
      postID: input.postID,
      value: input.value,
      parentID: input.parentID,
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
      if (!input.authorID) {
        throw new RuntimeError(
          'Comment creation failed: Canny requires users to be "identified" through their SDK. Please provide an authorID of a user who has been identified in your Canny workspace, or implement Canny\'s Identify SDK for the BotpressIntegration user.'
        )
      } else {
        throw new RuntimeError(
          `Comment creation failed: The authorID "${authorID}" is not valid or the user hasn't been identified through Canny's SDK.`
        )
      }
    }
    throw new RuntimeError(`Canny API error: ${error.response?.data?.error || error.message || 'Unknown error'}`)
  }
}

export const getComment: GetCommentAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  const comment = await client.getComment(input.commentID)

  return {
    comment: {
      id: comment.id,
      value: comment.value,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
      postID: comment.post.id,
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
    postID: input.postID,
    authorID: input.authorID,
    boardID: input.boardID,
    companyID: input.companyID,
    limit: input.limit,
    skip: input.skip,
  })

  return {
    comments: result.comments.map((comment) => ({
      id: comment.id,
      value: comment.value,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
      postID: comment.post.id,
      created: comment.created,
      internal: comment.internal,
      likeCount: comment.likeCount,
    })),
    hasMore: result.hasMore,
  }
}

export const deleteComment: DeleteCommentAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  await client.deleteComment(input.commentID)

  return {
    success: true,
  }
}
