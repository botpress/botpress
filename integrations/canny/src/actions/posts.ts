import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { InvalidAPIKeyError, CannyAPIError } from '../misc/errors'
import { IntegrationProps } from '.botpress'

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

  if (!input.boardId) {
    throw new RuntimeError('boardId is required to create a post')
  }

  if (!input.title) {
    throw new RuntimeError('title is required to create a post')
  }
  if (!input.details) {
    throw new RuntimeError('details is required to create a post')
  }

  // If no authorId provided, try multiple approaches to create the post
  if (!authorId) {
    // Skip the identified user approach - go straight to Botpress
    let debugInfo = 'Using Botpress user for post creation. '

    // If no identified user found or it failed, create the Botpress user
    if (!authorId) {
      const botUser = await client.createOrUpdateUser({
        name: 'Botpress',
        userId: 'botpress-user',
        email: 'integration@botpress.com',
      })

      // Try approach 1: Use the userId field
      try {
        const result = await client.createPost({
          authorId: 'botpress-user',
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
      } catch (error1: any) {
        debugInfo += `Approach 1 (userId) failed: ${error1.response?.data?.error || error1.message}. `
        // Try approach 2: Use the Canny-generated id
        try {
          const result = await client.createPost({
            authorId: botUser.id,
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
        } catch (error2: any) {
          debugInfo += `Approach 2 (Canny id) failed: ${error2.response?.data?.error || error2.message}. `
          // Try approach 3: Use byId field as the primary identifier
          try {
            const result = await client.createPost({
              authorId: botUser.id,
              boardId: input.boardId,
              title: input.title,
              details: input.details,
              byId: botUser.id, // Use the bot user as the admin creating the post
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
          } catch (error3: any) {
            debugInfo += `Approach 3 (byId) failed: ${error3.response?.data?.error || error3.message}. `
            // Try approach 4: Use a generic authorId and rely on byId
            try {
              const result = await client.createPost({
                authorId: 'system', // Try a generic system user
                boardId: input.boardId,
                title: input.title,
                details: input.details,
                byId: botUser.id, // Use the bot user as the admin creating the post
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
            } catch (error4: any) {
              debugInfo += `Approach 4 (system) failed: ${error4.response?.data?.error || error4.message}. `
              // All approaches failed, throw a helpful error with debug info
              throw new RuntimeError(
                `Post creation failed: Canny requires users to be "identified" through their SDK. Debug info: ${debugInfo}Please provide an authorId of a user who has been identified in your Canny workspace! Error: ${error4.response?.data?.error || error4.message}`
              )
            }
          }
        }
      }
    }
  }

  // If authorId is provided, try to create the post normally
  try {
        const result = await client.createPost({
          authorId: authorId,
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

  return {}
}

export const deletePost: DeletePostAction = async ({ input, ctx }) => {
  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  await client.deletePost(input.postId)

  return {}
}
