import { listBoards } from './actions/boards'
import { createComment, getComment, listComments, deleteComment } from './actions/comments'
import { createPost, getPost, listPosts, updatePost, deletePost } from './actions/posts'

import { createOrUpdateUser, listUsers } from './actions/users'

import { posts } from './channels/posts'
import { webhook } from './handlers/webhook'
import { CannyClient } from './misc/canny-client'

import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx }) => {
    try {
      if (!ctx.configuration.apiKey) {
        throw new Error('Canny API key is not configured')
      }

      const client = CannyClient.create({
        apiKey: ctx.configuration.apiKey,
      })

      if (!ctx.configuration.defaultAuthorId) {
        throw new Error('Default author ID is required in integration configuration.')
      }

      const boardsResult = await client.listBoards()

      boardsResult.boards.forEach((_board) => {})
    } catch (error) {
      console.error('Failed to register Canny integration:', error)
      throw error
    }
  },
  unregister: async () => {},
  actions: {
    createPost,
    getPost,
    listPosts,
    updatePost,
    deletePost,
    createComment,
    getComment,
    listComments,
    deleteComment,
    createOrUpdateUser,
    listUsers,
    listBoards,
  },
  channels: {
    posts,
  },
  handler: webhook,
})
