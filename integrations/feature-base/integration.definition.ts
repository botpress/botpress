import { z, IntegrationDefinition } from '@botpress/sdk'
import { listBoards, getBoard } from 'definitions/boards'
import { listPosts, createPost, deletePost, updatePost } from 'definitions/posts'

export default new IntegrationDefinition({
  name: 'feature-base',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string(),
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
