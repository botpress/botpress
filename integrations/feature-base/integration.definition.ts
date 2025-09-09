import { z, IntegrationDefinition, boolean } from '@botpress/sdk'
import { integrationName } from './package.json'
import { listBoards, getBoard } from 'definitions/boards';
import { listPosts, createPost, deletePost, updatePost } from 'definitions/posts';

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string()
    })
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
