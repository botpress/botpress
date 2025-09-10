import { z, IntegrationDefinition } from '@botpress/sdk'
import { listBoards, getBoard } from 'definitions/boards'
import { listPosts, createPost, deletePost, updatePost } from 'definitions/posts'

export default new IntegrationDefinition({
  name: 'feature-base',
  version: '0.1.0',
  title: 'Feature Base',
  description: 'CRUD operations for Feature Base',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1, 'API Key is required').describe('Your Feature Base API Key').title('API Key'),
    }),
  },
  actions: {
    listBoards,
    getBoard,
    createPost,
    listPosts,
    deletePost,
    updatePost,
  },
})
