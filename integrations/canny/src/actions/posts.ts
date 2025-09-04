import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'

type CreatePostAction = IntegrationProps['actions']['createPost']
type GetPostAction = IntegrationProps['actions']['getPost']
type ListPostsAction = IntegrationProps['actions']['listPosts']
type UpdatePostAction = IntegrationProps['actions']['updatePost']
type DeletePostAction = IntegrationProps['actions']['deletePost']

export const createPost: CreatePostAction = async ({ input, ctx }) => {
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
  if (!input.boardID) {
    throw new RuntimeError('boardID is required to create a post')
  }
  if (!input.title) {
    throw new RuntimeError('title is required to create a post')
  }
  if (!input.details) {
    throw new RuntimeError('details is required to create a post')
  }

  try {
    const result = await client.createPost({
      authorID,
      boardID: input.boardID,
      title: input.title,
      details: input.details,
      byID: input.byID,
      categoryID: input.categoryID,
      ownerID: input.ownerID,
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
      if (!input.authorID) {
        throw new RuntimeError(
          'Post creation failed: Canny requires users to be "identified" through their SDK. Please provide an authorID of a user who has been identified in your Canny workspace, or implement Canny\'s Identify SDK for the BotpressIntegration user.'
        )
      } else {
        throw new RuntimeError(
          `Post creation failed: The authorID "${authorID}" is not valid or the user hasn't been identified through Canny's SDK.`
        )
      }
    }
    throw new RuntimeError(`Canny API error: ${error.response?.data?.error || error.message || 'Unknown error'}`)
  }
}

export const getPost: GetPostAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  const post = await client.getPost(input.postID, input.boardID)

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
    boardID: input.boardID,
    authorID: input.authorID,
    companyID: input.companyID,
    tagIDs: input.tagIDs,
    limit: input.limit,
    skip: input.skip,
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
    hasMore: result.hasMore,
  }
}

export const updatePost: UpdatePostAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  await client.updatePost({
    postID: input.postID,
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

  await client.deletePost(input.postID)

  return {
    success: true,
  }
}
