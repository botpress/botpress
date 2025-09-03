import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

import {
  createPost,
  getPost,
  listPosts,
  updatePost,
  deletePost,
} from './actions/posts'

import {
  createComment,
  getComment,
  listComments,
  deleteComment,
} from './actions/comments'

import {
  createOrUpdateUser,
  listUsers,
} from './actions/users'

import {
  listBoards,
} from './actions/boards'

import { CannyClient } from './misc/canny-client'

import { posts } from './channels/posts'

import { webhook } from './handlers/webhook'

export default new bp.Integration({
  register: async ({ ctx }) => {
    try {
      if (!ctx.configuration.apiKey) {
        throw new Error('Canny API key is not configured')
      }

      const client = CannyClient.create({
        apiKey: ctx.configuration.apiKey,
      })

      const botUser = await client.createOrUpdateUser({
        name: 'BotpressIntegration',
        userID: 'botpress-integration-user',
        email: 'integration@botpress.com',
      })
      
      console.log('BotpressIntegration user created/updated:', botUser.id)
      
      const boardsResult = await client.listBoards()
      console.log(`Found ${boardsResult.boards.length} boards:`)
      boardsResult.boards.forEach(board => {
        console.log(`- ${board.name} (ID: ${board.id}) - ${board.postCount} posts`)
      })
      
      console.log('Canny integration registered successfully')
    } catch (error) {
      console.error('Failed to register Canny integration:', error)
      throw error
    }
  },
  unregister: async () => {
    console.log('Canny integration unregistered successfully')
  },
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
