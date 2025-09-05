import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'
import { InvalidAPIKeyError, CannyAPIError } from '../misc/errors'

type CreatePostAction = IntegrationProps['actions']['createPost']
type GetPostAction = IntegrationProps['actions']['getPost']
type ListPostsAction = IntegrationProps['actions']['listPosts']
type UpdatePostAction = IntegrationProps['actions']['updatePost']
type DeletePostAction = IntegrationProps['actions']['deletePost']

export const createPost: CreatePostAction = async ({ input, ctx }) => {
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
  if (!input.boardId) {
    throw new RuntimeError('boardId is required to create a post')
  }
  if (!input.title) {
    throw new RuntimeError('title is required to create a post')
  }
  if (!input.details) {
    throw new RuntimeError('details is required to create a post')
  }

  try {
    const result = await client.createPost({
      authorId,
      boardId: input.boardId,
      title: input.title,
      details: input.details,
      byId: input.byId,
      categoryId: input.categoryId,
      ownerId: input.ownerId,
      imageURLs: input.imageURLs,
      eta: input.eta,
      etaPublic: input.etaPublic,
      customFields: input.customFields,
    })

    return {
      postId: result.id,
    }
  } catch (error: any) {
    if (
      error.response?.data?.error?.includes('user') ||
      error.response?.data?.error?.includes('author') ||
      error.message?.includes('user')
    ) {
      if (!input.authorId) {
        throw new RuntimeError(
          'Post creation failed: Canny requires users to be "identified" through their SDK. Please provide an authorId of a user who has been identified in your Canny workspace, or ensure the default author from the integration configuration is properly identified.'
        )
      } else {
        throw new RuntimeError(
          `Post creation failed: The authorId "${authorId}" is not valid or the user hasn't been identified through Canny's SDK.`
        )
      }
    }
    throw new CannyAPIError(error)
  }
}

export const getPost: GetPostAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  const post = await client.getPost(input.postId, input.boardId)

  return {
    post: {
      id: post.id,
      title: post.title,
      details: post.details,
      authorName: post.author?.name,
      authorEmail: post.author?.email,
      boardName: post.board.name,
      status: post.status,
      score: post.score,
      commentCount: post.commentCount,
      created: post.created,
      url: post.url,
    },
  }
}

export const listPosts: ListPostsAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  const result = await client.listPosts({
    boardId: input.boardId,
    authorId: input.authorId,
    companyId: input.companyId,
    tagIds: input.tagIds,
    limit: input.limit,
    skip: input.nextToken,
    search: input.search,
    sort: input.sort,
    status: input.status,
  })

  return {
    posts: result.posts.map((post) => ({
      id: post.id,
      title: post.title,
      details: post.details,
      authorName: post.author?.name,
      authorEmail: post.author?.email,
      boardName: post.board.name,
      status: post.status,
      score: post.score,
      commentCount: post.commentCount,
      created: post.created,
      url: post.url,
    })),
    nextToken: result.hasMore ? (input.nextToken || 0) + (input.limit || 10) : undefined,
  }
}

export const updatePost: UpdatePostAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  await client.updatePost({
    postId: input.postId,
    title: input.title,
    details: input.details,
    eta: input.eta,
    etaPublic: input.etaPublic,
    imageURLs: input.imageURLs,
    customFields: input.customFields,
  })

  return {
    success: true,
  }
}

export const deletePost: DeletePostAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  await client.deletePost(input.postId)

  return {
    success: true,
  }
}
